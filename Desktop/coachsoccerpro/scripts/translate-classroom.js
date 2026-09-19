/* Translate the classroom to native Spanish (es-MX), football-native — NOT
   literal. Reads the English source from the handoff exports, fills every
   missing bodyEs / titleEs / subEs via Claude in batches, and writes
   handoff/es_overrides.json which convert-managers.js merges into classroom.js.
   Re-run safely: it skips anything already translated in the overrides file.
   Run:  node scripts/translate-classroom.js */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OVERRIDES = path.join(ROOT, "handoff/es_overrides.json");

function env(key) {
  const f = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = f.match(new RegExp("^" + key + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
}
const KEY = env("REACT_APP_ANTHROPIC_API_KEY");
if (!KEY) { console.error("No Anthropic key in .env"); process.exit(1); }

const mgr = JSON.parse(fs.readFileSync(path.join(ROOT, "handoff/sm_managers_export.json"), "utf8")).managers;
const tac = JSON.parse(fs.readFileSync(path.join(ROOT, "handoff/sm_tactics_export.json"), "utf8"));

// Build the work list of English strings that need Spanish.
const lessons = [
  ...mgr.map((m) => ({ id: m.id, title: m.title, sub: m.sub, beats: m.beats || [] })),
  ...(tac.tactics || []).map((t) => ({ id: t.id, title: t.title, sub: t.sub, title_es: t.title_es, sub_es: t.sub_es, beats: t.beats || [] })),
  ...(tac.world_of_football || []).map((t) => ({ id: t.id, title: t.title, sub: t.sub, beats: t.beats || [] })),
];

let overrides = {};
try { overrides = JSON.parse(fs.readFileSync(OVERRIDES, "utf8")); } catch (e) { overrides = {}; }

// Collect items: {ref, en}  ref = "unit|beat|body" | "unit|title" | "unit|sub"
const items = [];
for (const l of lessons) {
  overrides[l.id] = overrides[l.id] || {};
  if (l.title && !overrides[l.id].titleEs && !l.title_es) items.push({ ref: `${l.id}|title`, en: l.title });
  if (l.sub && !overrides[l.id].subEs && !l.sub_es) items.push({ ref: `${l.id}|sub`, en: l.sub });
  for (const b of l.beats) {
    if (b.body && !b.body_es && !(overrides[l.id].beats && overrides[l.id].beats[b.beat])) {
      items.push({ ref: `${l.id}|${b.beat}|body`, en: b.body });
    }
  }
}
console.log(`${items.length} strings need Spanish.`);
if (!items.length) { console.log("Nothing to do."); process.exit(0); }

async function translateBatch(batch) {
  const numbered = batch.map((it, i) => `[${i}] ${it.en.replace(/\n/g, " ")}`).join("\n\n");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      system: "You are a native Mexican-Spanish (es-MX) football coach and translator. Translate each numbered English coaching text into natural, native Spanish — the way a Spanish-speaking coach would actually say it, NOT a literal word-for-word translation. Keep football terminology correct (marcaje, presión, línea de pase, escaneo, etc.). Keep names, years and citations as-is. Preserve meaning and tone. Output ONLY a JSON array of objects [{\"i\":0,\"es\":\"...\"}] with one entry per input index, nothing else.",
      messages: [{ role: "user", content: "Translate:\n\n" + numbered }],
    }),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const data = await r.json();
  // Concatenate ALL text blocks (a reasoning block can precede the answer),
  // then pull out the JSON array robustly.
  let txt = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").replace(/```json|```/g, "").trim();
  const m = txt.match(/\[[\s\S]*\]/);
  return JSON.parse(m ? m[0] : txt);
}

function apply(ref, es) {
  const parts = ref.split("|");
  const id = parts[0];
  overrides[id] = overrides[id] || {};
  if (parts[1] === "title") overrides[id].titleEs = es;
  else if (parts[1] === "sub") overrides[id].subEs = es;
  else { overrides[id].beats = overrides[id].beats || {}; overrides[id].beats[parts[1]] = es; }
}

(async () => {
  const BATCH = 8;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    try {
      const out = await translateBatch(batch);
      out.forEach((o) => { if (batch[o.i]) apply(batch[o.i].ref, o.es); });
      fs.writeFileSync(OVERRIDES, JSON.stringify(overrides, null, 1));
      console.log(`  translated ${Math.min(i + BATCH, items.length)}/${items.length}`);
      await new Promise((res) => setTimeout(res, 400));
    } catch (e) {
      console.error(`  batch ${i} failed: ${e.message}`);
    }
  }
  console.log("Done → handoff/es_overrides.json. Now run: node scripts/convert-managers.js");
})();

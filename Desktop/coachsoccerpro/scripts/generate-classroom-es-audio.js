/* Bake the Spanish classroom BODY audio so Mia reads the lessons aloud in
   Spanish. Uses the ES classroom voice (matches the ES headlines). Skips any
   clip that already exists (incl. the 52 SM-provided ones). One-time.
   Run:  node scripts/generate-classroom-es-audio.js */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public", "tts_cache");
const ES_VOICE = "LlZr3QuzbW4WrPjgATHG"; // Spanish classroom voice (matches ES heads)

function env(key) {
  const f = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = f.match(new RegExp("^" + key + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
}
const KEY = env("REACT_APP_ELEVENLABS_API_KEY");
if (!KEY) { console.error("No ElevenLabs key in .env"); process.exit(1); }

// Load the generated classroom to get every beat's Spanish body.
const src = fs.readFileSync(path.join(ROOT, "src/data/classroom.js"), "utf8").replace(/export const /g, "global.");
// eslint-disable-next-line no-eval
eval(src.replace("global.CLASSROOM", "var CLASSROOM"));
const all = [...global.MANAGER_PLAYS, ...global.TACTICS_LESSONS, ...global.WORLD_LESSONS];

const sha1 = (s) => crypto.createHash("sha1").update(s, "utf8").digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Collect unique ES body texts that need a clip.
const jobs = [];
const seen = new Set();
for (const l of all) for (const b of l.beats) {
  const txt = (b.bodyEs || "").trim();
  if (!txt) continue;
  const file = sha1(ES_VOICE + "|" + txt.slice(0, 2000)) + ".mp3";
  if (seen.has(file)) continue; seen.add(file);
  if (fs.existsSync(path.join(OUT, file))) continue; // already baked (or SM-provided)
  jobs.push({ file, txt });
}
console.log(`${jobs.length} Spanish body clips to bake (voice ${ES_VOICE}).`);

async function mint(text) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ES_VOICE}`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text, model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 1.0, style: 0.5, use_speaker_boost: true },
    }),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  return Buffer.from(await r.arrayBuffer());
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  let made = 0, failed = 0;
  for (let i = 0; i < jobs.length; i++) {
    try {
      const buf = await mint(jobs[i].txt.slice(0, 2000));
      fs.writeFileSync(path.join(OUT, jobs[i].file), buf);
      made++;
      if (made % 20 === 0 || i === jobs.length - 1) console.log(`  ${made}/${jobs.length} baked`);
      await sleep(300);
    } catch (e) { failed++; console.error(`  ✗ ${e.message}`); }
  }
  console.log(`Done. ${made} baked, ${failed} failed.`);
})();

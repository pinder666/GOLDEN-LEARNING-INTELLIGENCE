/* Bake Mia's voice. Generates every fixed line (EN in her EN voice, ES in her
   ES voice) to public/mia_voice/<sha1>.mp3 — once. Runtime plays clips, no API.
   Run:  node scripts/generate-mia-voice.js
   Needs in .env: REACT_APP_ELEVENLABS_API_KEY, REACT_APP_MIA_VOICE_EN/ES */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public", "mia_voice");

// ── read .env ──
function env(key) {
  const f = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = f.match(new RegExp("^" + key + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
}
const KEY = env("REACT_APP_ELEVENLABS_API_KEY");
const MIA = { en: env("REACT_APP_MIA_VOICE_EN"), es: env("REACT_APP_MIA_VOICE_ES") };
if (!KEY || !MIA.en || !MIA.es) { console.error("Missing ELEVENLABS key or MIA voice IDs in .env"); process.exit(1); }

// ── load the line list from src/services/miaLines.js (one source of truth) ──
function loadLines() {
  const src = require("@babel/core").transformFileSync(
    path.join(ROOT, "src/services/miaLines.js"),
    { presets: [["@babel/preset-env", { targets: { node: "current" } }]] }
  ).code;
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function("module", "exports", "require", src)(mod, mod.exports, require);
  return mod.exports.allBakedLines();
}

const sha1 = (s) => crypto.createHash("sha1").update(s, "utf8").digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mint(text, voiceId) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 1.0, style: 0.3, use_speaker_boost: true },
    }),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const lines = loadLines();
  console.log(`Baking ${lines.length} lines (EN: ${MIA.en}, ES: ${MIA.es}) → public/mia_voice/`);
  let made = 0, skipped = 0, failed = 0;
  for (const { text, lang } of lines) {
    const vid = MIA[lang] || MIA.en;
    const file = path.join(OUT, sha1(vid + "|" + String(text).trim().slice(0, 2000)) + ".mp3");
    if (fs.existsSync(file)) { skipped++; continue; }
    try {
      const buf = await mint(text, vid);
      fs.writeFileSync(file, buf);
      made++;
      console.log(`  ✓ [${lang}] ${text}`);
      await sleep(250); // gentle on the API
    } catch (e) {
      failed++;
      console.error(`  ✗ [${lang}] ${text} — ${e.message}`);
    }
  }
  console.log(`\nDone. ${made} baked, ${skipped} already there, ${failed} failed. Total files: ${fs.readdirSync(OUT).length}`);
})();

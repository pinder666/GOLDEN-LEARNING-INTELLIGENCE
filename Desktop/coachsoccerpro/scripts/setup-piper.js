#!/usr/bin/env node
/* PIPER SETUP — local, owned TTS pipeline. Run once: node scripts/setup-piper.js

   Downloads (idempotent, ~120MB total, all MIT/free):
     tools/piper/piper.exe            — the engine (rhasspy/piper, MIT)
     tools/piper/voices/en.onnx(.json)— stock EN voice (until OUR voice is trained)
     tools/piper/voices/es.onnx(.json)— stock ES voice

   After setup, scripts/piper-tts.js can synthesize any line with zero
   cloud dependency. When Jason's recorded voices are trained, their .onnx
   files replace these two and NOTHING else changes.

   tools/piper is gitignored — binaries stay local, this script recreates
   them on any machine. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "tools", "piper");
const VOICES = path.join(DIR, "voices");

const FILES = [
  {
    url: "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip",
    out: path.join(DIR, "piper.zip"),
    unzip: true,
  },
  {
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    out: path.join(VOICES, "en.onnx"),
  },
  {
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
    out: path.join(VOICES, "en.onnx.json"),
  },
  {
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_MX/claude/high/es_MX-claude-high.onnx",
    out: path.join(VOICES, "es.onnx"),
  },
  {
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_MX/claude/high/es_MX-claude-high.onnx.json",
    out: path.join(VOICES, "es.onnx.json"),
  },
];

async function download(url, out) {
  if (fs.existsSync(out) && fs.statSync(out).size > 1000) {
    console.log(`[skip] ${path.basename(out)} exists`);
    return;
  }
  console.log(`[get ] ${url}`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(out, buf);
  console.log(`[done] ${path.basename(out)} (${(buf.length / 1048576).toFixed(1)} MB)`);
}

(async () => {
  fs.mkdirSync(VOICES, { recursive: true });
  for (const f of FILES) {
    await download(f.url, f.out);
    if (f.unzip && !fs.existsSync(path.join(DIR, "piper", "piper.exe"))) {
      console.log("[unzip] piper.zip");
      execSync(`powershell -NoProfile -Command "Expand-Archive -Force '${f.out}' '${DIR}'"`);
    }
  }
  const exe = path.join(DIR, "piper", "piper.exe");
  if (!fs.existsSync(exe)) throw new Error("piper.exe missing after unzip");

  // Smoke test: one EN and one ES line
  const test = (voice, text, out) => {
    execSync(`"${exe}" -m "${path.join(VOICES, voice)}" -f "${path.join(DIR, out)}"`, {
      input: text,
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log(`[test] ${out} (${(fs.statSync(path.join(DIR, out)).size / 1024).toFixed(0)} KB)`);
  };
  test("en.onnx", "Excellent scanning. You check your shoulders like the pros do.", "test_en.wav");
  test("es.onnx", "Excelente escaneo. Miras sobre los hombros como los profesionales.", "test_es.wav");

  console.log("\nPIPER READY — local voice generation with zero cloud dependency.");
  console.log("Owned-voice swap later: replace voices/en.onnx + es.onnx with the trained models.");
})().catch((e) => {
  console.error("SETUP FAILED:", e.message);
  process.exit(1);
});

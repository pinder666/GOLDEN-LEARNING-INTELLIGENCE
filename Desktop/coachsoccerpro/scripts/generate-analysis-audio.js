#!/usr/bin/env node
/* Generate video-analysis voice lines in the COACH voice — zero API calls at runtime.

   Run: node scripts/generate-analysis-audio.js
   Requires: SoccerMental game-server running at localhost:8091

   Output: public/audio/analysis/<key>-<lang>.mp3
   Lines are FIXED (no numbers) so they can be pre-generated; the numbers
   stay on screen where they belong.
*/

const fs = require('fs');
const path = require('path');

const COACH_EN = 'KgPrBPTt9lFW3IWauARL';
const COACH_ES = 'pMsXgVXv3BLzUgSXRplE';
const TTS_URL = 'http://localhost:8091/tts';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'analysis');

const LINES = {
  intro: {
    en: "Analysis complete. Here's what I saw.",
    es: "Análisis completo. Esto es lo que vi.",
  },
  'scanning-good': {
    en: "Excellent scanning. You check your shoulders like the pros do — keep those eyes moving before the ball arrives.",
    es: "Excelente escaneo. Miras sobre los hombros como los profesionales — sigue moviendo esos ojos antes de que llegue el balón.",
  },
  'scanning-low': {
    en: "Let's work on scanning. Check over both shoulders before the ball comes — three looks every five seconds, that's the target.",
    es: "Vamos a trabajar el escaneo. Mira sobre ambos hombros antes de que llegue el balón — tres vistazos cada cinco segundos, esa es la meta.",
  },
  'body-good': {
    en: "Great body shape. You stay open to the field, so you always know what's around you.",
    es: "Gran postura corporal. Te mantienes abierto al campo, así siempre sabes lo que hay a tu alrededor.",
  },
  'body-low': {
    en: "Open up your body when you receive. Take the ball side-on, so you can see more of the field.",
    es: "Abre el cuerpo cuando recibas. Toma el balón de perfil, así puedes ver más campo.",
  },
  'movement-good': {
    en: "Sharp movement. Those bursts of pace make you very hard to mark.",
    es: "Movimiento explosivo. Esos cambios de ritmo te hacen muy difícil de marcar.",
  },
  'movement-low': {
    en: "Let's add sharper bursts. Walk, then explode — quick changes of pace win you space.",
    es: "Vamos a añadir arranques más fuertes. Camina, y luego explota — los cambios rápidos de ritmo te ganan espacio.",
  },
  'posture-good': {
    en: "Strong balance. Head steady over your hips, even on the move. That's how you stay in control.",
    es: "Gran equilibrio. Cabeza firme sobre las caderas, incluso en movimiento. Así mantienes el control.",
  },
  'posture-low': {
    en: "Focus on balance. Keep your head steady over your hips, especially when you turn.",
    es: "Enfócate en el equilibrio. Mantén la cabeza firme sobre las caderas, sobre todo al girar.",
  },

  // ── PENALTY PACK ──
  'intro-penalty': {
    en: "Penalty analyzed. Here's the breakdown.",
    es: "Penal analizado. Aquí está el desglose.",
  },
  'plant-good': {
    en: "Strong plant foot. Right beside the ball, body balanced over it.",
    es: "Buen pie de apoyo. Justo al lado del balón, con el cuerpo equilibrado.",
  },
  'plant-low': {
    en: "Watch the plant foot. Step it level with the ball, not behind it — that's where balance comes from.",
    es: "Cuida el pie de apoyo. Colócalo a la altura del balón, no detrás — de ahí viene el equilibrio.",
  },
  'shape-good': {
    en: "Good body shape at contact. Chest over the ball, hips driving through the target.",
    es: "Buena postura al contacto. Pecho sobre el balón, caderas hacia el objetivo.",
  },
  'shape-low': {
    en: "Open those hips through contact. Drive them at your target — don't let the body lean away.",
    es: "Abre las caderas en el contacto. Llévalas hacia tu objetivo — no dejes que el cuerpo se incline hacia atrás.",
  },
  'head-good': {
    en: "Head down and steady at the strike. That's how you keep it under the bar.",
    es: "Cabeza abajo y firme en el golpeo. Así lo mantienes bajo el travesaño.",
  },
  'head-low': {
    en: "Keep the head down through the strike. Look at the ball, not the keeper.",
    es: "Mantén la cabeza abajo durante el golpeo. Mira el balón, no al portero.",
  },
  'approach-good': {
    en: "Confident run-up. Controlled speed into the strike.",
    es: "Carrera decidida. Velocidad controlada hasta el golpeo.",
  },
  'approach-low': {
    en: "Slow the run-up down a touch. Controlled steps beat a rushed sprint.",
    es: "Baja un poco la carrera. Pasos controlados ganan a un sprint apurado.",
  },
  'keeper-early': {
    en: "And look at the keeper — moving before the strike. A calm taker punishes that.",
    es: "Y mira al portero — se mueve antes del golpeo. Un lanzador tranquilo castiga eso.",
  },
  'keeper-held': {
    en: "The keeper held the line until contact. Good discipline — place it in the corner.",
    es: "El portero aguantó la línea hasta el contacto. Buena disciplina — colócalo en la esquina.",
  },

  // ── DUEL PACK ──
  'intro-duel': {
    en: "Duel analyzed. Both players — here's the read.",
    es: "Duelo analizado. Ambos jugadores — aquí está la lectura.",
  },
  'duel-height-good': {
    en: "Got low into the contact. Strong base — that's how you stay on the ball.",
    es: "Se agachó en el contacto. Base fuerte — así te quedas con el balón.",
  },
  'duel-height-low': {
    en: "Too upright at contact. Bend the knees, drop the hips — get under the challenge.",
    es: "Demasiado erguido en el contacto. Flexiona las rodillas, baja las caderas — entra por debajo.",
  },
  'duel-balance-good': {
    en: "Balanced through the contact and ready for the next action. Excellent.",
    es: "Equilibrado durante el contacto y listo para la siguiente acción. Excelente.",
  },
  'duel-balance-low': {
    en: "Lost balance after the contact. Land on both feet and stay in the play.",
    es: "Perdió el equilibrio tras el contacto. Cae con ambos pies y sigue en la jugada.",
  },
  'duel-winner': {
    en: "The duel was won before the contact — lower body, better balance, ball protected. That's the lesson for both players.",
    es: "El duelo se ganó antes del contacto — cuerpo más bajo, mejor equilibrio, balón protegido. Esa es la lección para ambos jugadores.",
  },
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── PIPER: local, owned TTS. Third backend — no cloud, no account. ──
// Run `node scripts/setup-piper.js` once. Set FORCE_PIPER=1 to use it
// exclusively (e.g. after the owned voices are trained in).
const { execSync } = require('child_process');
const PIPER_EXE = path.join(__dirname, '..', 'tools', 'piper', 'piper', 'piper.exe');
const PIPER_VOICES = path.join(__dirname, '..', 'tools', 'piper', 'voices');
const FORCE_PIPER = process.env.FORCE_PIPER === '1';

function piperAvailable() {
  return fs.existsSync(PIPER_EXE);
}

function generateWithPiper(text, lang, outputPathMp3) {
  // Piper emits WAV; we write <name>.wav next to the requested .mp3 path.
  // The app's players fall back .mp3 → .wav automatically.
  const outWav = outputPathMp3.replace(/\.mp3$/, '.wav');
  const model = path.join(PIPER_VOICES, lang === 'es' ? 'es.onnx' : 'en.onnx');
  execSync(`"${PIPER_EXE}" -m "${model}" -f "${outWav}"`, {
    input: text,
    stdio: ['pipe', 'ignore', 'ignore'],
  });
  return fs.existsSync(outWav) && fs.statSync(outWav).size > 1000;
}

// ElevenLabs key from .env (one-time generation only — runtime stays zero-API)
function getElevenKey() {
  try {
    const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const m = env.match(/REACT_APP_ELEVENLABS_API_KEY=(.+)/);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}
const ELEVEN_KEY = getElevenKey();

async function generateAudio(text, voiceId, outputPath) {
  const lang = /-es\.mp3$/.test(outputPath) ? 'es' : 'en';
  if (fs.existsSync(outputPath) || fs.existsSync(outputPath.replace(/\.mp3$/, '.wav'))) {
    console.log(`  [skip] ${path.basename(outputPath)} exists`);
    return 'skipped';
  }

  // Owned-pipeline mode: Piper only, no cloud at all
  if (FORCE_PIPER && piperAvailable()) {
    try {
      if (generateWithPiper(text, lang, outputPath)) {
        console.log(`  [done] ${path.basename(outputPath).replace('.mp3', '.wav')} (via Piper, local)`);
        return 'done';
      }
    } catch (e) {
      console.error(`  [fail] piper: ${e.message}`);
      return 'failed';
    }
  }

  // Try the local game-server proxy first
  try {
    const response = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_id: voiceId }),
    });
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      console.log(`  [done] ${path.basename(outputPath)} (via game-server)`);
      return 'done';
    }
  } catch { /* fall through to direct */ }

  // Direct ElevenLabs fallback
  if (!ELEVEN_KEY) {
    // Last resort: local Piper (stock voices) — never blocked by a vendor
    if (piperAvailable()) {
      try {
        if (generateWithPiper(text, lang, outputPath)) {
          console.log(`  [done] ${path.basename(outputPath).replace('.mp3', '.wav')} (via Piper, local)`);
          return 'done';
        }
      } catch (e) { /* fall through */ }
    }
    console.error(`  [fail] ${path.basename(outputPath)}: no ElevenLabs key, no Piper`);
    return 'failed';
  }
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!response.ok) {
      console.error(`  [fail] ${path.basename(outputPath)}: ${response.status}`);
      return 'failed';
    }
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`  [done] ${path.basename(outputPath)} (via ElevenLabs)`);
    return 'done';
  } catch (e) {
    console.error(`  [fail] ${path.basename(outputPath)}: ${e.message}`);
    return 'failed';
  }
}

async function main() {
  let done = 0, failed = 0, skipped = 0;
  for (const [key, texts] of Object.entries(LINES)) {
    console.log(`\n${key}`);
    const rEn = await generateAudio(texts.en, COACH_EN, path.join(OUTPUT_DIR, `${key}-en.mp3`));
    const rEs = await generateAudio(texts.es, COACH_ES, path.join(OUTPUT_DIR, `${key}-es.mp3`));
    for (const r of [rEn, rEs]) {
      if (r === 'done') done++;
      else if (r === 'skipped') skipped++;
      else failed++;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`\nComplete: ${done} new, ${skipped} existed, ${failed} failed`);
  console.log(`Files at: ${OUTPUT_DIR}`);
}

main();

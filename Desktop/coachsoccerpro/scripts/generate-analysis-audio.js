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
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
  if (fs.existsSync(outputPath)) {
    console.log(`  [skip] ${path.basename(outputPath)} exists`);
    return 'skipped';
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
    console.error(`  [fail] ${path.basename(outputPath)}: no ElevenLabs key`);
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

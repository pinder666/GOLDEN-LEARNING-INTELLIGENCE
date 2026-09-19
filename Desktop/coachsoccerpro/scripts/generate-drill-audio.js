#!/usr/bin/env node
/* Generate all drill audio files upfront — zero API calls at runtime

   Run: node scripts/generate-drill-audio.js
   Requires: SoccerMental game-server running at localhost:8091

   Output: public/audio/drills/<drill-id>-<lang>.mp3
*/

const fs = require('fs');
const path = require('path');

const drillsPath = path.join(__dirname, '..', 'src', 'data', 'drills.js');
const drillsContent = fs.readFileSync(drillsPath, 'utf8');

// Find all drill objects by matching id: patterns
const drillIds = [];
const idMatches = drillsContent.matchAll(/id:\s*['"]([a-z]+\d+)['"]/g);
for (const m of idMatches) {
  if (!drillIds.includes(m[1])) drillIds.push(m[1]);
}

// Extract drill data for each ID
const drills = [];
for (const id of drillIds) {
  // Find the drill block containing this ID
  const idPattern = new RegExp(`id:\\s*['"]${id}['"][^}]+`, 's');
  const blockMatch = drillsContent.match(new RegExp(`\\{[^{}]*id:\\s*['"]${id}['"][^}]*\\}`, 's'));

  if (!blockMatch) continue;
  const block = blockMatch[0];

  // Extract fields - handle both single and double quotes
  const get = (field) => {
    const m = block.match(new RegExp(`${field}:\\s*['"]([^'"]+)['"]`));
    return m ? m[1] : '';
  };

  drills.push({
    id,
    title: get('title'),
    titleEs: get('titleEs') || get('title'),
    desc: get('desc'),
    descEs: get('descEs') || get('desc'),
    coaching: get('coaching'),
    coachingEs: get('coachingEs') || get('coaching'),
  });
}

console.log(`Found ${drills.length} drills`);

const COACH_EN = 'KgPrBPTt9lFW3IWauARL';
const COACH_ES = 'pMsXgVXv3BLzUgSXRplE';
const TTS_URL = 'http://localhost:8091/tts';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'drills');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function generateAudio(text, voiceId, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`  [skip] ${path.basename(outputPath)} exists`);
    return true;
  }

  if (!text || text.length < 5) {
    console.log(`  [skip] ${path.basename(outputPath)} no text`);
    return false;
  }

  try {
    const response = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_id: voiceId }),
    });

    if (!response.ok) {
      console.error(`  [fail] ${path.basename(outputPath)}: ${response.status}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`  [done] ${path.basename(outputPath)}`);
    return true;
  } catch (e) {
    console.error(`  [fail] ${path.basename(outputPath)}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log(`\nGenerating audio for ${drills.length} drills...\n`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  let success = 0, failed = 0, skipped = 0;

  for (const drill of drills) {
    console.log(`\n${drill.id}: "${drill.title || '(no title)'}"`);

    // English
    const enText = [drill.title, drill.desc, drill.coaching].filter(Boolean).join('. ');
    const enPath = path.join(OUTPUT_DIR, `${drill.id}-en.mp3`);
    const enResult = await generateAudio(enText, COACH_EN, enPath);
    if (enResult) success++; else if (fs.existsSync(enPath)) skipped++; else failed++;

    // Spanish
    const esText = [drill.titleEs, drill.descEs, drill.coachingEs].filter(Boolean).join('. ');
    const esPath = path.join(OUTPUT_DIR, `${drill.id}-es.mp3`);
    const esResult = await generateAudio(esText, COACH_ES, esPath);
    if (esResult) success++; else if (fs.existsSync(esPath)) skipped++; else failed++;

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n\nComplete: ${success} new, ${skipped} existed, ${failed} failed`);
  console.log(`Files at: ${OUTPUT_DIR}`);
}

main();

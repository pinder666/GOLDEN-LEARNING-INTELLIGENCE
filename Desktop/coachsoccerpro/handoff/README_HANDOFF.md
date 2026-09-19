# SoccerMental → CoachSoccerPro — FULL Classroom Handoff

Exported 2026-09-15 per owner order: "the full lesson … the audio, the entire thing, do not cut anything, the manager, the tactics, everything." The earlier digest-only export is superseded — this handoff ships every lesson body, every stats card, every source citation, and the verbatim `draw()` animation source, plus every piece of owned audio that already exists on disk for these lines.

Source of truth: `soccermental/game-server/soccerscan.html` (the `MODULES` lesson-data object) — 54 classroom modules across three wings: 22 TACTICS, 17 MANAGERS, 15 WORLD OF FOOTBALL. All 54 are in this handoff. Nothing was cut, summarized, or rewritten.

## Files

| File | What it is |
|---|---|
| `sm_managers_export.json` | The 17 manager lessons (Chapman → Ranieri), complete. Keeps the previously validated per-manager metadata (team, system, doctrine, key_principle, honours, positions[], arrows[], beats_digest) and now adds `beats[]` — the full verbatim lesson. |
| `sm_tactics_export.json` | The 22 TACTICS-wing lessons (`tactics[]`) plus the 15 WORLD OF FOOTBALL career lessons (`world_of_football[]`), complete. Per-beat `positions[]`/`arrows[]` extracted from the drawings where the coordinates are literal. |
| `audio_manifest.json` | One entry per spoken line. EN entries are at the TRUE PLAYBACK GRAIN (see Audio section); ES entries preserved from the first export. Every EN entry points at a real file. |
| `audio/` | 2,558 mp3 files — every EN classroom line (coach voice, minted 2026-09-15) + the 337 ES files from the first export. All owned SoccerMental audio, byte-copied. |

## The beat schema

Every lesson is a `beats[]` array. Each beat:

```json
{
  "beat": 1,
  "head": "WHY CHAPMAN CHANGED EVERYTHING",         // spoken + displayed headline
  "head_es": "…",                                    // present only if SM already has the ES line
  "body": "In 1925 the Football Association …",     // FULL verbatim lesson text (the narration)
  "body_es": "…",                                    // present only if SM already has the ES line
  "src": "Wilson \"Inverting the Pyramid\" 2008",   // citation shown with the beat
  "stats": [["1925", "offside law changed — …"], …], // 4 [label, text] stat cards
  "draw_source": "draw(){ clearAll(); crPlayer(…); … }" // verbatim JS of the beat's animation
}
```

Tactics/world beats additionally carry `positions[]` and `arrows[]` (see below). A few early tactics beats had no `beat:` number in the source; the export numbers them by order (1-based).

## The drawing system (0–100 pitch)

`draw_source` is the animation exactly as SM runs it. Coordinate space: **x 0–100 left→right (attacking right), y 0–100 top→bottom.** Labels are sometimes placed slightly outside 0–100 for margin text. The helper calls:

- `crPlayer(x, y, color, label, sublabel, delay, glowClass)` — a player dot. `glowClass` ∈ gold/red/green/blue/'' .
- `animLine(layerId, x1, y1, x2, y2, color, width, delay, glowClass)` — an animated pass/run arrow.
- `crZone(x, y, w, h, fillRgba, glowClass)` — a shaded zone (x,y = top-left).
- `crLabel(x, y, text, color, delay)` — a caption chip.
- `crTri(points, color, delay)` — connects three [x,y] points (triangle lessons).
- `clearAll()` — wipe all layers (every beat starts with it).
- Delays are seconds; `setTimeout` blocks sequence the reveal.

Where every `crPlayer`/`animLine` call in a beat uses literal numbers, the export also gives you pre-parsed `positions[]` (`{x, y, color, label, sublabel}`) and `arrows[]` (`{x1, y1, x2, y2}`). Beats using loops/variables for coordinates carry a `positions_note` instead — for those, `draw_source` is authoritative and should be ported, not the extraction.

In `sm_managers_export.json`, the top-level per-manager `positions[]`/`arrows[]` are the previously validated formation-signature extraction (one representative drawing per manager, with `meaning` strings on arrows) — kept as-is. The per-beat drawings are all in `beats[].draw_source`.

## Spanish (honest state)

- **All 310 beat heads have ES translations** (from SM's spoken-line ES maps) → shipped as `head_es`.
- **Only 52 of 310 bodies have ES translations** (a 12-lesson-intro sample SM translated to set tone/terminology) → shipped as `body_es` where they exist.
- The remaining 258 bodies are **untranslated in SM** — SM's own i18n census flags the classroom bodies (~33,700 words) as a pending dedicated translation pass. **Nothing was machine-translated for this export.** If CSP wants ES bodies, translate natively per CSP law.
- ES lookup sources: `i18n/es_spoken.json`, `i18n/es.json`, `i18n/parts/spoken_classroom.json`.

## Audio — the hash contract and the honest ledger

**Contract** (verified byte-for-byte against SM's minted Mentor library — 522/522 files matched with the exact code used here):

```
filename = sha1( VOICE_ID + '|' + text.trim().slice(0, 2000) ) + '.mp3'
```

Voices checked per line, in order:
- EN lines: coach `KgPrBPTt9lFW3IWauARL` → founder `6lig94OhEOztC0ogyfsd` → her `NbkKnEAZ7Bqw4EAkVEaz`
- ES lines: es `LlZr3QuzbW4WrPjgATHG` → coach → founder

**Minting parameters SM uses** (so CSP can mint its own audio for the missing lines, in its own voice, if it chooses): ElevenLabs model `eleven_multilingual_v2`, voice_settings `{ stability: 0.45, similarity_boost: 1.0, style: 0.50, use_speaker_boost: true }`, text trimmed and truncated to 2000 chars before both hashing and minting. No API key is included anywhere in this handoff and no API was called to produce it.

**The ledger (updated 2026-09-15 — EN audio is now COMPLETE):**

| Class | Lines | Hits | Misses |
|---|---|---|---|
| EN playback lines (intro + body sentences + coming-soon) | 2,234 | 2,234 | 0 |
| ES heads (`head_es`) | 310 | 310 | 0 |
| ES bodies (`body_es`) | 52 | 52 | 0 |

**The playback grain (this is how the app actually speaks, and how the EN manifest is keyed):** beat heads are NEVER spoken. A lesson speaks one intro line (`"<title>. <sub>."`), then each beat body **one sentence at a time** (split `/[^.!?]+[.!?]+/g`, trimmed). EN manifest entries carry `field: "intro" | "sentence"` with `seq` = sentence index within the beat, plus one global `coming_soon` line. The first export's head/body-grain EN entries were removed — they never matched a spoken line. Chain a beat's `sentence` files in `seq` order (SM inserts a natural pause between sentences at play time).

SM minted all 2,221 unique EN files on 2026-09-15 (coach voice `KgPrBPTt9lFW3IWauARL`, zero failures) and this handoff byte-copies every one. ES bodies remain 52/310 because the other 258 have no Spanish text in SM yet — untranslated, not cut, and nothing was machine-translated.

## License note

SoccerMental original content, shared for CoachSoccerPro rendering only.

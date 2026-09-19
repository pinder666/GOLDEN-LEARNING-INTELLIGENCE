# FOR THE CSP AGENT — EN audio is now COMPLETE (2026-09-15)

Your earlier report said: "EN classroom audio doesn't exist yet — SM never minted it (620 English lines). EN Play uses device voice until minted." **That is now resolved.** SoccerMental minted every English classroom line on 2026-09-15 (coach voice, zero failures) and this handoff folder was updated in place.

## What changed in this folder

- `audio/` — now **2,558 mp3s**: every English classroom line (new) + the 337 Spanish files you already had. All owned SoccerMental audio, byte-copies.
- `audio_manifest.json` — **regenerated**. Read it fresh; the old one is gone.
- `README_HANDOFF.md` — audio section rewritten to match.

## The one thing you must change in how you key audio

The old manifest listed EN lines at **head/body grain**. That was wrong — those hashes never matched a spoken line, because:

1. **Beat heads are NEVER spoken.** They are display-only. Do not look for or play head audio in EN.
2. **A lesson speaks one intro line, then each beat body ONE SENTENCE AT A TIME.**
   - Intro text = `"<title>. <sub>."` (title and sub from the lesson JSON).
   - Body sentences = `body.match(/[^.!?]+[.!?]+/g)`, each `.trim()`ed.

The new manifest is already at this grain — you don't need to split anything yourself. EN entries carry:

```json
{
  "unit": "classroom/triangle",
  "beat": 2,                     // 0 = the lesson intro
  "field": "intro" | "sentence" | "coming_soon",
  "seq": 0,                      // sentence index within the beat (null for intro)
  "voice": "coach KgPrBPTt9lFW3IWauARL",
  "text": "…the exact spoken text…",
  "hash": "…sha1…",
  "audio": "audio/<hash>.mp3"    // never null for EN — coverage is 100%
}
```

**To play a beat:** take its `sentence` entries in `seq` order and chain the files, with a short natural pause (~300–500ms) between sentences. Play the `intro` entry (beat 0) once when the lesson opens.

Hash contract is unchanged: `sha1(voiceId + '|' + text.trim().slice(0,2000)) + '.mp3'` — but you shouldn't need to hash anything; every EN entry's `audio` path is filled in.

## Unchanged / still true

- ES: all 310 heads have owned audio; only 52/310 bodies have ES text at all. The other 258 remain untranslated in SoccerMental (nothing machine-translated). ES entries are preserved verbatim at their original grain at the end of `lines[]` (fields `head_es` / `body_es`).
- Lesson content files (`sm_managers_export.json`, `sm_tactics_export.json`) — untouched, still complete.
- No API keys anywhere in this handoff; no minting needed on your side for EN.

Upload/integrate the `audio/` folder + `audio_manifest.json` and retire the device-voice fallback for EN.

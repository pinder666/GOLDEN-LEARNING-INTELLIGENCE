# SWEEP LOG — CoachSoccerPro
Every sweep is dated and logged: findings AND changes. Future sweeps read this first.

## 2026-09-14 — Pre-beta polish sweep (Claude)

**Findings:**
1. Dashboard "AI Assistant" card showed English insight text in Spanish mode (dev-path string never localized)
2. How To Use guides missing the three newest features — Video Analysis, My Drills board, the Assistant. This also starved the Assistant's cheat-sheet brain, which answers from these guides
3. Dashboard quick-action "Roster" label untranslated in ES (both ternary branches said "Roster")
4. Not fixed / known-open (tracked in memory `csp-video-analyst`): crowded-scene tracking edge cases; Checkmatch requires SoccerMental game-server on :8091; parent pages query a `payments` table name that Phase B live-wiring must reconcile with `player_payments`

**Changes:**
1. Dashboard insight line localized (falls back to the localized "all up to date" whenever no live insight exists)
2. Added three bilingual guides to How To Use (`videoanalysis`, `mydrills`, `assistant`) + matching keyword maps in the Assistant router
3. Quick-action label → "Plantilla" in ES

**Context notes for future sweeps:**
- Dev server pinned to **:3010** (`.env.local` PORT) — SoccerMental landing owns :3000 under pm2
- All voice audio is bundled files; Piper local TTS = third generation backend (`scripts/setup-piper.js`, gitignored binaries)
- `?lang=es` on any URL flips the whole app; language persists via localStorage

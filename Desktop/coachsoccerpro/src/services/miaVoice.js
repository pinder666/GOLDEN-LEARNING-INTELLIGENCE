/**
 * MIA'S VOICE — plays her BAKED clips (no runtime AI). Each line was generated
 * once in her ElevenLabs voice (scripts/generate-mia-voice.js) and lives at
 * /mia_voice/<sha1>.mp3. We look it up by hashing the exact text with her voice
 * ID for that language. Unbaked lines (e.g. names) fall back to device voice so
 * nothing is ever silent. Mute-aware (shares the app's csp_muted flag).
 */
import { sha1hex } from "services/voice";

// Mia's CoachSoccerPro female voices (also in .env, but hardcoded so playback
// never depends on the dev server having reloaded .env). These are the exact
// IDs her clips were baked with — changing them means re-baking.
const MIA_EN = process.env.REACT_APP_MIA_VOICE_EN || "r1KmysJdVYZjJCm4mL3b";
const MIA_ES = process.env.REACT_APP_MIA_VOICE_ES || "m7yTemJqdIqrcNleANfX";

let current = null;
let token = 0;

function isMuted() {
  try { return localStorage.getItem("csp_muted") === "1"; } catch (e) { return false; }
}
function voiceId(lang) { return lang === "es" ? MIA_ES : MIA_EN; }
function clipUrl(text, lang) {
  const vid = voiceId(lang);
  const tt = String(text).trim().slice(0, 2000);
  return "/mia_voice/" + sha1hex(vid + "|" + tt) + ".mp3";
}

export function stop() {
  token++;
  if (current) { try { current.pause(); } catch (e) {} current = null; }
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
}

// Play one line in Mia's baked voice. NEVER robotic — if a clip is missing or
// autoplay is blocked, we stay silent (the coach taps 🔊 to hear it).
export function speak(text, lang = "en", onEnd) {
  if (!text || isMuted()) { onEnd && onEnd(); return; }
  stop();
  const my = ++token;
  const a = new Audio(clipUrl(text, lang));
  current = a;
  a.onended = () => { if (token === my) onEnd && onEnd(); };
  a.onerror = () => { if (token === my) onEnd && onEnd(); };        // missing clip → silent
  a.play().catch(() => { if (token === my) onEnd && onEnd(); });    // autoplay blocked → silent
}

// Play an ordered briefing (array of text lines) back-to-back, her voice only.
// force=true = an explicit "Hear it" tap → play even if global mute is on.
export function speakLines(lines, lang = "en", onEnd, force) {
  if ((!force && isMuted()) || !lines || !lines.length) { onEnd && onEnd(); return; }
  stop();
  const my = ++token;
  let i = 0;
  const next = () => {
    if (token !== my) return;
    if (i >= lines.length) { onEnd && onEnd(); return; }
    const line = lines[i++];
    const a = new Audio(clipUrl(line, lang));
    current = a;
    a.onended = () => { if (token === my) setTimeout(next, 180); };
    a.onerror = () => { if (token === my) setTimeout(next, 60); };            // skip missing, silent
    a.play().catch(() => { if (token === my) onEnd && onEnd(); });            // autoplay blocked → stop, wait for 🔊
  };
  next();
}

export const hasVoice = !!(MIA_EN && MIA_ES);
export default { speak, speakLines, stop, hasVoice };

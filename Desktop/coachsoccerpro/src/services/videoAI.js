/**
 * AI Video read (build #1 + #2). Takes the on-device pose metrics AND a handful
 * of real frames from the clip, and asks Claude (vision) for a specific,
 * per-clip coaching read — instead of the 8 canned threshold lines. The read is
 * spoken in the REAL coach voice, minted at runtime via ElevenLabs and cached,
 * so the audio is different every clip and never robotic.
 *
 * Every call degrades safely: no Anthropic key → returns null (caller keeps the
 * on-device insights); no ElevenLabs key → text only, silent (never device TTS).
 */

const ANTHROPIC = process.env.REACT_APP_ANTHROPIC_API_KEY;
const ELEVEN = process.env.REACT_APP_ELEVENLABS_API_KEY;
const COACH_EN = "KgPrBPTt9lFW3IWauARL";
const COACH_ES = "pMsXgVXv3BLzUgSXRplE";

// ── Grab a few real frames from the clip as JPEG base64 (for Claude vision) ──
export async function sampleFrames(video, count = 6, maxW = 512) {
  if (!video || !video.videoWidth || !video.duration) return [];
  const dur = video.duration;
  const scale = Math.min(1, maxW / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  const was = video.currentTime;
  const wasPaused = video.paused;
  try { video.pause(); } catch (e) {}
  const seek = (t) => new Promise((res) => {
    let done = false;
    const on = () => { if (done) return; done = true; video.removeEventListener("seeked", on); res(); };
    video.addEventListener("seeked", on);
    try { video.currentTime = t; } catch (e) { done = true; res(); }
    setTimeout(on, 500); // safety: never hang on a seek that won't fire
  });
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = dur * ((i + 0.5) / count);
    try { await seek(t); ctx.drawImage(video, 0, 0, canvas.width, canvas.height); frames.push({ data: canvas.toDataURL("image/jpeg", 0.7).split(",")[1], t }); } catch (e) { /* tainted / seek fail → skip */ }
  }
  try { await seek(Math.min(was, dur)); } catch (e) {}
  if (!wasPaused) { try { video.play().catch(() => {}); } catch (e) {} }
  return frames; // [{ data, t }]
}

const SCENARIO_FOCUS = {
  open: "open play — receiving, scanning before the ball, body shape, movement off the ball",
  penalty: "a penalty kick — run-up, plant foot, hips/shoulders at strike, follow-through, and where it likely went",
  duel: "a 1v1 duel — approach, body position, timing of the challenge, who won the ball and why",
};

const SYSTEM = `You are a football video analyst breaking a clip down PLAY BY PLAY, like a coach with a remote pausing at each moment. You get frames sampled IN ORDER across ONE clip (each is a later moment in the play), plus rough pose numbers. Output ONLY valid JSON, no markdown.

THE JOB — go MOMENT BY MOMENT, not a general paragraph:
1. First IDENTIFY from the frames what this clip is (in "context"): e.g. "dribble through cones", "1v1 to beat a defender", "shot on goal", "receiving under pressure", or "unclear". Read it from the frames — do NOT assume.
2. State the STANDARD for that action in "standard" — what good looks like (the why you judge against).
3. Then walk the play: for EACH frame in order, add one "moments" entry describing what is happening AT that moment and the single coaching read for it. This is the analysis — the play broken down step by step.

HARD RULES (no bullshit):
- Every moment must describe what is ACTUALLY visible in that frame. NEVER mention cones, feet, ball, opponents, or a tackle unless you can see them in that frame.
- If a moment is unclear, say "unclear" for that moment — do not invent.
- If the whole clip is blank/too far/no player: canSee false, explain in observed, moments empty.
- Do not give one generic verdict — the value is the play-by-play.

Schema (all fields required):
{
  "canSee": true|false,
  "observed": one sentence of what is literally visible across the clip (proof),
  "context": what this clip is, read from the frames,
  "standard": what good looks like for THAT action (the why),
  "moments": array — ONE per frame, in order — { "seq": 1-based, "saw": what is happening in this exact frame, "read": the one coaching point for this moment (or "solid here" if good), "good": true|false },
  "headline": short overall verdict grounded in the play,
  "drill": { "title", "titleEs", "desc", "descEs" } — fixes the biggest gap seen,
  "spoken": array (English) — line 1 = the context, then one short line PER key moment in order, natural coach speech,
  "spokenEs": same lines in natural Spanish,
  "observedEs": Spanish of observed, "contextEs": Spanish of context, "standardEs": Spanish of standard,
  "momentsEs": same moments array with Spanish "saw"/"read"
}
Write Spanish natively. Keep strings tight.`;

export async function analyzeClip({ scenario = "open", metrics, playerName, frames, lang = "en" }) {
  if (!ANTHROPIC) return null;
  if (!frames || !frames.length) return { canSee: false, observed: "No frames could be read from this clip.", moments: [], noFrames: true };
  const focus = SCENARIO_FOCUS[scenario] || SCENARIO_FOCUS.open;
  const content = [];
  frames.forEach((f, i) => content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.data || f } }));
  content.push({
    type: "text",
    text:
      `Above are ${frames.length} frames in time order from the clip (frame 1 = earliest, frame ${frames.length} = latest). Treat each as a moment in the play.\n` +
      `Coach's stated scenario (a hint only — trust the frames): ${focus}.\n` +
      (playerName ? `Focus player: ${playerName}.\n` : "") +
      `Rough pose numbers (context only): ${JSON.stringify(metrics || {})}\n` +
      `Break the play down MOMENT BY MOMENT — one "moments" entry per frame. Output JSON only.`,
  });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: "user", content }],
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    let text = (data?.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
    const out = JSON.parse(text);
    // Return the read even when it can't see — the play-by-play (or the honest
    // "can't see") is the point. Attach real frame timestamps to each moment.
    if (out && (out.observed || Array.isArray(out.moments))) {
      out.moments = out.moments || [];
      out.moments.forEach((m, i) => { if (frames[i] && frames[i].t != null) m.t = frames[i].t; });
      return out;
    }
  } catch (e) { /* fall back to on-device insights */ }
  return null;
}

// ── Real-voice minting (ElevenLabs), cached per line for the session ─────────
const voiceCache = new Map(); // `${lang}|${text}` -> objectURL
export async function mintLine(text, lang = "en") {
  if (!ELEVEN || !text) return null;
  const key = `${lang}|${text}`;
  if (voiceCache.has(key)) return voiceCache.get(key);
  const voiceId = lang === "es" ? COACH_ES : COACH_EN;
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVEN, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 1.0, style: 0.5, use_speaker_boost: true },
      }),
    });
    if (!r.ok) return null;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    voiceCache.set(key, url);
    return url;
  } catch (e) { return null; }
}

export async function mintLines(lines, lang = "en") {
  return Promise.all((lines || []).map((l) => mintLine(l, lang)));
}

export default { sampleFrames, analyzeClip, mintLine, mintLines };

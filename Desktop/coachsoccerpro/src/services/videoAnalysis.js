/**
 * Real on-device video analysis using MediaPipe Pose (Apache-2.0).
 *
 * Everything runs in the browser: the WASM runtime is served from /wasm and
 * the pose model from /models — no frame ever leaves the device.
 *
 * What we measure from the pose stream (33 landmarks per frame):
 *  - Scanning: head-turn count. Head yaw is approximated by the nose's
 *    horizontal offset from the shoulder midpoint, normalized by shoulder
 *    width. A "scan" is a direction reversal beyond a threshold — the same
 *    behaviour Jordet counts in elite players before they receive the ball.
 *  - Body orientation: how open the body stays (visible shoulder width vs.
 *    turning). Open receivers see more of the pitch.
 *  - Movement intensity: hip displacement per second — bursts vs. standing.
 *  - Posture: head-over-hips vertical alignment while moving.
 */

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

let landmarkerPromise = null;

function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    })();
  }
  return landmarkerPromise;
}

function seekTo(video, t) {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = t;
  });
}

// Landmark indices (MediaPipe Pose)
const NOSE = 0;
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;

/**
 * Analyze a loaded <video> element. Returns { frames, fps, metrics } or
 * { error } when no player is detectable.
 * onProgress(0..1) reports sampling progress.
 */
export async function analyzeVideoElement(video, onProgress) {
  const landmarker = await getLandmarker();

  const duration = Math.min(video.duration || 0, 30); // cap at 30s
  if (!duration || !isFinite(duration)) return { error: "no-duration" };

  const fps = 6;
  const step = 1 / fps;
  const samples = [];

  video.pause();
  video.muted = true;

  let ts = performance.now();
  for (let t = 0; t < duration; t += step) {
    await seekTo(video, t);
    ts += 33; // monotonically increasing timestamp for VIDEO mode
    const result = landmarker.detectForVideo(video, ts);
    const lm = result?.landmarks?.[0];
    samples.push(lm ? extractFrame(lm, t) : null);
    if (onProgress) onProgress(Math.min(1, (t + step) / duration));
  }

  const valid = samples.filter(Boolean);
  if (valid.length < Math.max(6, samples.length * 0.25)) {
    return { error: "no-player" };
  }

  return { metrics: computeMetrics(valid, duration), framesAnalyzed: valid.length, duration };
}

function extractFrame(lm, t) {
  const nose = lm[NOSE];
  const ls = lm[L_SHOULDER];
  const rs = lm[R_SHOULDER];
  const lh = lm[L_HIP];
  const rh = lm[R_HIP];

  const shoulderMidX = (ls.x + rs.x) / 2;
  const shoulderMidY = (ls.y + rs.y) / 2;
  const shoulderWidth = Math.abs(ls.x - rs.x) || 0.0001;
  const hipMidX = (lh.x + rh.x) / 2;
  const hipMidY = (lh.y + rh.y) / 2;

  return {
    t,
    // Head yaw proxy: nose offset from shoulder midline, in shoulder-widths
    headYaw: (nose.x - shoulderMidX) / shoulderWidth,
    shoulderWidth,
    hipX: hipMidX,
    hipY: hipMidY,
    // Posture: horizontal drift of head over hips, in shoulder-widths
    lean: Math.abs(nose.x - hipMidX) / shoulderWidth,
    torso: Math.abs(shoulderMidY - hipMidY),
  };
}

function computeMetrics(frames, duration) {
  // ---- Scanning: count head-yaw direction reversals beyond threshold ----
  const YAW_DELTA = 0.18; // shoulder-widths of nose travel that counts as a turn
  let scans = 0;
  let lastExtreme = frames[0].headYaw;
  let dir = 0;
  for (const f of frames) {
    const d = f.headYaw - lastExtreme;
    if (dir >= 0 && d <= -YAW_DELTA) {
      scans++;
      dir = -1;
      lastExtreme = f.headYaw;
    } else if (dir <= 0 && d >= YAW_DELTA) {
      scans++;
      dir = 1;
      lastExtreme = f.headYaw;
    } else if ((dir >= 0 && d > 0) || (dir <= 0 && d < 0)) {
      lastExtreme = f.headYaw; // extend the current extreme
    }
  }
  const scansPer5s = (scans / duration) * 5;
  // Jordet benchmark: elite players scan 3+ times in the 5s before receiving
  const scanScore = clamp(Math.round((scansPer5s / 3) * 100));

  // ---- Body orientation: average visible shoulder width ----
  const widths = frames.map((f) => f.shoulderWidth);
  const avgWidth = avg(widths);
  const maxWidth = Math.max(...widths);
  const openness = maxWidth > 0 ? avgWidth / maxWidth : 0;
  const bodyScore = clamp(Math.round(openness * 115));

  // ---- Movement intensity: hip speed (normalized units/sec) ----
  const speeds = [];
  for (let i = 1; i < frames.length; i++) {
    const dt = frames[i].t - frames[i - 1].t || 0.167;
    const dx = frames[i].hipX - frames[i - 1].hipX;
    const dy = frames[i].hipY - frames[i - 1].hipY;
    speeds.push(Math.sqrt(dx * dx + dy * dy) / dt);
  }
  const avgSpeed = avg(speeds);
  const peakSpeed = speeds.length ? Math.max(...speeds) : 0;
  const moveScore = clamp(Math.round(Math.min(avgSpeed / 0.25, 1) * 70 + Math.min(peakSpeed / 0.9, 1) * 30));

  // ---- Posture: head stacked over hips (lower lean = better) ----
  const avgLean = avg(frames.map((f) => f.lean));
  const postureScore = clamp(Math.round(100 - Math.min(avgLean / 0.9, 1) * 60));

  return {
    scans,
    scansPer5s: Math.round(scansPer5s * 10) / 10,
    scanScore,
    bodyScore,
    moveScore,
    postureScore,
  };
}

const clamp = (n) => Math.max(5, Math.min(100, n));
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

/**
 * Play the pre-generated coach-voice line for one insight (or the intro).
 * Files live at /audio/analysis/<key>-<lang>.mp3 — bundled, zero API calls.
 * Returns the Audio element so callers can chain or stop playback.
 */
export function playAnalysisLine(key, lang = "en") {
  const audio = new Audio(`/audio/analysis/${key}-${lang === "es" ? "es" : "en"}.mp3`);
  audio.play().catch(() => {});
  return audio;
}

/** Build the display insights (EN/ES) from computed metrics. */
export function buildInsights(m) {
  return [
    {
      label: "Scanning",
      labelEs: "Escaneo",
      audioKey: m.scansPer5s >= 3 ? "scanning-good" : "scanning-low",
      score: m.scanScore,
      feedback:
        `${m.scans} head checks detected (${m.scansPer5s} per 5 seconds). ` +
        (m.scansPer5s >= 3
          ? "Elite level — top players scan 3+ times in the 5 seconds before receiving."
          : "Target is 3+ scans every 5 seconds before receiving the ball."),
      feedbackEs:
        `${m.scans} vistazos detectados (${m.scansPer5s} por 5 segundos). ` +
        (m.scansPer5s >= 3
          ? "Nivel élite — los mejores escanean 3+ veces en los 5 segundos antes de recibir."
          : "El objetivo es 3+ escaneos cada 5 segundos antes de recibir el balón."),
    },
    {
      label: "Body Orientation",
      labelEs: "Orientación Corporal",
      audioKey: m.bodyScore >= 75 ? "body-good" : "body-low",
      score: m.bodyScore,
      feedback:
        m.bodyScore >= 75
          ? "Body stays open to the field — good receiving shape."
          : "Body turns closed at times. Work on receiving side-on so more of the field stays visible.",
      feedbackEs:
        m.bodyScore >= 75
          ? "El cuerpo se mantiene abierto al campo — buena postura para recibir."
          : "El cuerpo se cierra a veces. Trabaja en recibir de perfil para ver más campo.",
    },
    {
      label: "Movement Intensity",
      labelEs: "Intensidad de Movimiento",
      audioKey: m.moveScore >= 70 ? "movement-good" : "movement-low",
      score: m.moveScore,
      feedback:
        m.moveScore >= 70
          ? "Active movement with sharp bursts."
          : "Movement is steady but low-intensity in this clip. Encourage sharper changes of pace.",
      feedbackEs:
        m.moveScore >= 70
          ? "Movimiento activo con arranques fuertes."
          : "El movimiento es constante pero de baja intensidad en este clip. Fomenta cambios de ritmo más fuertes.",
    },
    {
      label: "Posture & Balance",
      labelEs: "Postura y Equilibrio",
      audioKey: m.postureScore >= 75 ? "posture-good" : "posture-low",
      score: m.postureScore,
      feedback:
        m.postureScore >= 75
          ? "Head stays balanced over the hips while moving."
          : "Noticeable lean while moving — balance drills will help stability on the turn.",
      feedbackEs:
        m.postureScore >= 75
          ? "La cabeza se mantiene equilibrada sobre las caderas al moverse."
          : "Inclinación notable al moverse — ejercicios de equilibrio ayudarán en los giros.",
    },
  ];
}

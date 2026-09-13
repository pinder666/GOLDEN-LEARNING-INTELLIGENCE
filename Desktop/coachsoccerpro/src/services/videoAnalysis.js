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

const landmarkerCache = {}; // keyed by numPoses

function getLandmarker(numPoses = 1) {
  if (!landmarkerCache[numPoses]) {
    landmarkerCache[numPoses] = (async () => {
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
        },
        runningMode: "VIDEO",
        numPoses,
      });
    })();
  }
  return landmarkerCache[numPoses];
}

// Minimal skeleton for overlay drawing (landmark index pairs)
export const SKELETON = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // arms + shoulder line
  [11, 23], [12, 24], [23, 24],                      // torso
  [23, 25], [25, 27], [24, 26], [26, 28],            // legs
  [27, 31], [28, 32],                                // feet
  [0, 11], [0, 12],                                  // head to shoulders
];

/** Draw one pose's skeleton onto a 2D canvas context (normalized landmarks). */
export function drawSkeleton(ctx, lm, w, h, color = "#4ade80") {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w / 320);
  ctx.fillStyle = color;
  for (const [a, b] of SKELETON) {
    if (!lm[a] || !lm[b]) continue;
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  }
  for (const p of lm) {
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, Math.max(2.5, w / 300), 0, Math.PI * 2);
    ctx.fill();
  }
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
 * Analyze a loaded <video> element.
 * opts.scenario: "open" (default) or "penalty" (tracks 2 people).
 * opts.onFrame(posesLandmarks, t): called per sampled frame — for the overlay.
 * onProgress(0..1) reports sampling progress.
 */
export async function analyzeVideoElement(video, onProgress, opts = {}) {
  const scenario = opts.scenario || "open";
  const numPoses = scenario === "penalty" ? 2 : 1;
  const landmarker = await getLandmarker(numPoses);

  const duration = Math.min(video.duration || 0, 30); // cap at 30s
  if (!duration || !isFinite(duration)) return { error: "no-duration" };

  const fps = 6;
  const step = 1 / fps;
  const samples = [];      // open-play: extracted frames
  const rawFrames = [];    // penalty: per-frame array of raw landmark sets

  video.pause();
  video.muted = true;

  let ts = performance.now();
  for (let t = 0; t < duration; t += step) {
    await seekTo(video, t);
    ts += 33; // monotonically increasing timestamp for VIDEO mode
    const result = landmarker.detectForVideo(video, ts);
    const poses = result?.landmarks || [];
    if (opts.onFrame) opts.onFrame(poses, t);
    if (scenario === "penalty") {
      rawFrames.push({ t, poses });
    } else {
      samples.push(poses[0] ? extractFrame(poses[0], t) : null);
    }
    if (onProgress) onProgress(Math.min(1, (t + step) / duration));
  }

  if (scenario === "penalty") {
    return analyzePenalty(rawFrames, duration);
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

const L_ANKLE = 27;
const R_ANKLE = 28;

/**
 * PENALTY PACK v1.
 * Two tracked people. The taker is whoever produces the fastest foot movement
 * (the strike); the keeper is the other. The strike frame is the moment of
 * peak kicking-foot speed. Metrics are read at and around that frame.
 */
function analyzePenalty(rawFrames, duration) {
  // Track up to 2 identities by hip-midpoint continuity
  const tracks = [[], []]; // arrays of {t, lm}
  for (const { t, poses } of rawFrames) {
    if (!poses.length) continue;
    const centers = poses.map((lm) => (lm[L_HIP].x + lm[R_HIP].x) / 2);
    if (!tracks[0].length && !tracks[1].length) {
      // seed: leftmost person -> track 0
      const order = centers.map((c, i) => [c, i]).sort((a, b) => a[0] - b[0]);
      order.forEach(([, pi], ti) => {
        if (ti < 2) tracks[ti].push({ t, lm: poses[pi] });
      });
      continue;
    }
    // assign each pose to nearest track tail
    const used = new Set();
    for (const trk of tracks) {
      if (!poses.length) break;
      const lastX = trk.length ? (trk[trk.length - 1].lm[L_HIP].x + trk[trk.length - 1].lm[R_HIP].x) / 2 : null;
      let best = -1;
      let bestD = Infinity;
      poses.forEach((lm, pi) => {
        if (used.has(pi)) return;
        const c = centers[pi];
        const d = lastX === null ? 0 : Math.abs(c - lastX);
        if (d < bestD) {
          bestD = d;
          best = pi;
        }
      });
      if (best >= 0) {
        used.add(best);
        trk.push({ t, lm: poses[best] });
      }
    }
  }

  const t0 = tracks[0];
  const t1 = tracks[1];
  if (t0.length < 6 && t1.length < 6) return { error: "no-player" };

  // Peak foot speed per track decides who the taker is
  const peak = (trk) => {
    let maxV = 0;
    let maxT = 0;
    let foot = L_ANKLE;
    for (let i = 1; i < trk.length; i++) {
      const dt = trk[i].t - trk[i - 1].t || 0.167;
      for (const a of [L_ANKLE, R_ANKLE]) {
        const dx = trk[i].lm[a].x - trk[i - 1].lm[a].x;
        const dy = trk[i].lm[a].y - trk[i - 1].lm[a].y;
        const v = Math.sqrt(dx * dx + dy * dy) / dt;
        if (v > maxV) {
          maxV = v;
          maxT = trk[i].t;
          foot = a;
        }
      }
    }
    return { maxV, maxT, foot };
  };

  const p0 = t0.length >= 6 ? peak(t0) : { maxV: -1 };
  const p1 = t1.length >= 6 ? peak(t1) : { maxV: -1 };
  const takerTrack = p0.maxV >= p1.maxV ? t0 : t1;
  const keeperTrack = p0.maxV >= p1.maxV ? t1 : t0;
  const strike = p0.maxV >= p1.maxV ? p0 : p1;
  const kickFoot = strike.foot;
  const plantFoot = kickFoot === L_ANKLE ? R_ANKLE : L_ANKLE;
  const strikeT = strike.maxT;

  const at = (trk, t) => {
    let best = trk[0];
    for (const f of trk) if (Math.abs(f.t - t) < Math.abs(best.t - t)) best = f;
    return best;
  };
  const sf = at(takerTrack, strikeT).lm;

  const shoulderW = Math.abs(sf[L_SHOULDER].x - sf[R_SHOULDER].x) || 0.0001;
  const hipMidX = (sf[L_HIP].x + sf[R_HIP].x) / 2;
  const shoulderMidY = (sf[L_SHOULDER].y + sf[R_SHOULDER].y) / 2;
  const torso = Math.abs(shoulderMidY - (sf[L_HIP].y + sf[R_HIP].y) / 2) || 0.0001;

  // Plant foot: stable base = plant ankle close under the hips at strike
  const plantDist = Math.abs(sf[plantFoot].x - hipMidX) / shoulderW;
  const plantScore = clamp(Math.round(100 - Math.min(plantDist / 1.4, 1) * 65));

  // Body shape: hips/shoulders driving square through contact
  const hipW = Math.abs(sf[L_HIP].x - sf[R_HIP].x);
  const maxHipW = Math.max(...takerTrack.map((f) => Math.abs(f.lm[L_HIP].x - f.lm[R_HIP].x)), 0.0001);
  const shapeScore = clamp(Math.round((hipW / maxHipW) * 110));

  // Head: down over the ball at strike (nose below shoulder line = good)
  const headDrop = (sf[NOSE].y - shoulderMidY) / torso;
  const headScore = clamp(Math.round(55 + headDrop * 160));

  // Approach: taker hip speed in the second before the strike
  const pre = takerTrack.filter((f) => f.t >= strikeT - 1.2 && f.t <= strikeT);
  const preSpeeds = [];
  for (let i = 1; i < pre.length; i++) {
    const dt = pre[i].t - pre[i - 1].t || 0.167;
    const dx = (pre[i].lm[L_HIP].x + pre[i].lm[R_HIP].x) / 2 - (pre[i - 1].lm[L_HIP].x + pre[i - 1].lm[R_HIP].x) / 2;
    preSpeeds.push(Math.abs(dx) / dt);
  }
  const approachScore = clamp(Math.round(Math.min(avg(preSpeeds) / 0.22, 1) * 100));

  // Keeper: did they move before the strike?
  let keeper = null;
  if (keeperTrack.length >= 6) {
    const kPre = keeperTrack.filter((f) => f.t >= strikeT - 0.6 && f.t <= strikeT);
    let moved = 0;
    for (let i = 1; i < kPre.length; i++) {
      moved += Math.abs(
        (kPre[i].lm[L_HIP].x + kPre[i].lm[R_HIP].x) / 2 -
        (kPre[i - 1].lm[L_HIP].x + kPre[i - 1].lm[R_HIP].x) / 2
      );
    }
    const kf = at(keeperTrack, strikeT).lm;
    const kShoulderMidX = (kf[L_SHOULDER].x + kf[R_SHOULDER].x) / 2;
    const kHipMidX = (kf[L_HIP].x + kf[R_HIP].x) / 2;
    keeper = {
      movedEarly: moved > 0.05,
      lean: kShoulderMidX - kHipMidX > 0.015 ? "right" : kShoulderMidX - kHipMidX < -0.015 ? "left" : "center",
    };
  }

  return {
    scenario: "penalty",
    strikeT,
    framesAnalyzed: takerTrack.length,
    duration,
    metrics: { plantScore, shapeScore, headScore, approachScore, plantDist: Math.round(plantDist * 100) / 100, keeper },
  };
}

/** Build penalty insights (EN/ES) with audio keys. */
export function buildPenaltyInsights(m, lang = "en") {
  const cards = [
    {
      label: "Plant Foot",
      labelEs: "Pie de Apoyo",
      audioKey: m.plantScore >= 70 ? "plant-good" : "plant-low",
      score: m.plantScore,
      feedback:
        m.plantScore >= 70
          ? "Plant foot lands beside the ball with the body balanced over it."
          : "Plant foot lands wide or behind the ball — step it level with the ball for balance and accuracy.",
      feedbackEs:
        m.plantScore >= 70
          ? "El pie de apoyo cae junto al balón con el cuerpo equilibrado."
          : "El pie de apoyo cae lejos o detrás del balón — colócalo a la altura del balón para equilibrio y precisión.",
    },
    {
      label: "Body Shape at Contact",
      labelEs: "Postura al Contacto",
      audioKey: m.shapeScore >= 70 ? "shape-good" : "shape-low",
      score: m.shapeScore,
      feedback:
        m.shapeScore >= 70
          ? "Hips drive square through the strike — power and control."
          : "Hips close off at contact. Drive them through the target instead of leaning away.",
      feedbackEs:
        m.shapeScore >= 70
          ? "Las caderas empujan de frente en el golpeo — potencia y control."
          : "Las caderas se cierran al contacto. Llévalas hacia el objetivo en vez de inclinarte hacia atrás.",
    },
    {
      label: "Head Position",
      labelEs: "Posición de la Cabeza",
      audioKey: m.headScore >= 70 ? "head-good" : "head-low",
      score: m.headScore,
      feedback:
        m.headScore >= 70
          ? "Head down and steady over the ball at the strike."
          : "Head comes up early — keep eyes on the ball through contact to stay under the bar.",
      feedbackEs:
        m.headScore >= 70
          ? "Cabeza abajo y firme sobre el balón en el golpeo."
          : "La cabeza se levanta pronto — mantén la vista en el balón durante el contacto.",
    },
    {
      label: "Approach",
      labelEs: "Carrera",
      audioKey: m.approachScore >= 60 ? "approach-good" : "approach-low",
      score: m.approachScore,
      feedback:
        m.approachScore >= 60
          ? "Confident, controlled run-up into the strike."
          : "Run-up is hesitant in this clip — controlled, committed steps beat a stuttered approach.",
      feedbackEs:
        m.approachScore >= 60
          ? "Carrera decidida y controlada hasta el golpeo."
          : "La carrera es dudosa en este clip — pasos decididos y controlados ganan a una carrera entrecortada.",
    },
  ];

  const keeperNote = m.keeper
    ? {
        audioKey: m.keeper.movedEarly ? "keeper-early" : "keeper-held",
        text: m.keeper.movedEarly
          ? `Keeper moved before the strike (leaning ${m.keeper.lean}). A calm taker punishes that.`
          : "Keeper held the line until contact. Good discipline — placement beats power here.",
        textEs: m.keeper.movedEarly
          ? `El portero se movió antes del golpeo (inclinado a la ${m.keeper.lean === "right" ? "derecha" : m.keeper.lean === "left" ? "izquierda" : "posición central"}). Un lanzador tranquilo castiga eso.`
          : "El portero aguantó la línea hasta el contacto. Buena disciplina — la colocación gana a la potencia.",
      }
    : null;

  return { cards, keeperNote };
}

/**
 * Build the parent-facing share card: frozen frame + skeleton + scores,
 * stamped "Analyzed by SoccerMental". Returns a PNG dataURL.
 * Inside CoachSoccerPro the brand never shows — only on this outbound card.
 */
export async function buildShareCard(video, frameT, insights, { scenario = "open", lang = "en", playerName = "" } = {}) {
  const numPoses = scenario === "penalty" ? 2 : 1;
  const landmarker = await getLandmarker(numPoses);

  await seekTo(video, Math.max(0, frameT));
  const result = landmarker.detectForVideo(video, performance.now() + 100000);
  const poses = result?.landmarks || [];

  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 360;
  const W = 900;
  const frameH = Math.round((vh / vw) * W);
  const footerH = 130 + insights.length * 44;
  const H = frameH + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Frame + skeletons
  ctx.fillStyle = "#0a0e23";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(video, 0, 0, W, frameH);
  poses.forEach((lm, i) => drawSkeleton(ctx, lm, W, frameH, i === 0 ? "#4ade80" : "#60a5fa"));

  // Title band
  const title = scenario === "penalty"
    ? (lang === "es" ? "ANÁLISIS DE PENAL" : "PENALTY ANALYSIS")
    : (lang === "es" ? "ANÁLISIS DE JUEGO" : "PLAY ANALYSIS");
  ctx.fillStyle = "rgba(10,14,35,0.85)";
  ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 26px Inter, Arial, sans-serif";
  ctx.fillText(title + (playerName ? ` — ${playerName}` : ""), 24, 36);

  // Scores
  let y = frameH + 44;
  ctx.font = "600 22px Inter, Arial, sans-serif";
  for (const ins of insights) {
    const label = lang === "es" ? ins.labelEs : ins.label;
    const color = ins.score >= 80 ? "#4ade80" : ins.score >= 60 ? "#fbbf24" : "#ef4444";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(label, 24, y);
    // score bar
    const barX = W - 320;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(barX, y - 18, 220, 20);
    ctx.fillStyle = color;
    ctx.fillRect(barX, y - 18, Math.round((ins.score / 100) * 220), 20);
    ctx.font = "800 20px Inter, Arial, sans-serif";
    ctx.fillText(String(ins.score), barX + 236, y);
    ctx.font = "600 22px Inter, Arial, sans-serif";
    y += 44;
  }

  // SoccerMental brand footer — the funnel
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(0, H - 58, W, 58);
  ctx.fillStyle = "#4ade80";
  ctx.font = "800 22px Inter, Arial, sans-serif";
  const brand = lang === "es" ? "Analizado por SoccerMental" : "Analyzed by SoccerMental";
  ctx.fillText("⚽ " + brand, 24, H - 21);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "500 18px Inter, Arial, sans-serif";
  ctx.fillText("soccermental.com", W - 200, H - 21);

  return canvas.toDataURL("image/png");
}

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

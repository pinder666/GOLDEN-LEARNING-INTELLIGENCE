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

// MediaPipe requires strictly increasing timestamps per landmarker instance.
// One global monotonic clock shared by prescan, analysis, and share-card
// keeps every call ahead of the last, across any number of runs.
let lastTs = 0;
function nextTs() {
  lastTs = Math.max(lastTs + 33, performance.now());
  return lastTs;
}

// Multi-person work uses the FULL model — far better at small/distant
// bodies than lite. Single-person stays on lite for speed.
const MODEL_LITE = "/models/pose_landmarker_lite.task";
const MODEL_FULL = "/models/pose_landmarker_full.task";

function getLandmarker(numPoses = 1) {
  if (!landmarkerCache[numPoses]) {
    landmarkerCache[numPoses] = (async () => {
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: numPoses > 1 ? MODEL_FULL : MODEL_LITE,
        },
        runningMode: "VIDEO",
        numPoses,
        // Low thresholds so SMALL/DISTANT players get detected at all —
        // the coach's taps decide who matters, not detection confidence.
        minPoseDetectionConfidence: numPoses > 1 ? 0.3 : 0.5,
        minPosePresenceConfidence: numPoses > 1 ? 0.3 : 0.5,
        minTrackingConfidence: numPoses > 1 ? 0.3 : 0.5,
      });
    })();
  }
  return landmarkerCache[numPoses];
}

// ── LIVE FILMING GUIDE ──────────────────────────────────────────────────
// Lightweight detector for the in-app camera: tells the FILMER what to fix
// while they film (closer / keep in frame / steady) so the footage is
// analysis-grade at capture time. Lite model — must run live on a phone.
let guidePromise = null;
function getGuideLandmarker() {
  if (!guidePromise) {
    guidePromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task" },
        runningMode: "VIDEO",
        numPoses: 3,
        minPoseDetectionConfidence: 0.3,
        minPosePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });
    })();
  }
  return guidePromise;
}

/** One live-guidance read of the camera stream: people found, their sizes
 *  and positions. Cheap enough for ~8 calls/second on a phone. */
export async function guideDetect(video) {
  const landmarker = await getGuideLandmarker();
  const result = landmarker.detectForVideo(video, nextTs());
  return (result?.landmarks || []).map((lm) => ({
    torso: Math.abs((lm[11].y + lm[12].y) / 2 - (lm[23].y + lm[24].y) / 2),
    hipX: (lm[23].x + lm[24].x) / 2,
    hipY: (lm[23].y + lm[24].y) / 2,
  }));
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
  const targetIndex = opts.targetIndex ?? 0;
  const anchors = opts.anchors?.length ? opts.anchors : null;
  // Crowded shots: with taps we detect generously (6) and keep only tapped
  const numPoses = anchors ? 6 : scenario === "penalty" || scenario === "duel" || opts.multi ? 4 : 1;
  const landmarker = await getLandmarker(numPoses);
  const ballTracker = opts.ballAnchor ? createBallTracker(video, opts.ballAnchor) : null;

  // Length caps: penalty/duel are short moments (30s); open play can run
  // longer (90s). Longer clips sample fewer frames/sec so timing stays sane.
  const maxLen = scenario === "open" ? 90 : 30;
  const duration = Math.min(video.duration || 0, maxLen);
  if (!duration || !isFinite(duration)) return { error: "no-duration" };

  const fps = duration > 45 ? 3 : duration > 20 ? 4 : 6;
  const step = 1 / fps;
  const rawFrames = []; // every scenario: per-frame raw landmark sets (also feeds the replay)

  video.pause();
  video.muted = true;

  // THE ARENA: when a crop is set, every frame is cut to that region and
  // magnified before detection — the engine cannot see outside it. Landmark
  // coordinates are mapped back to full-frame space so nothing downstream
  // changes.
  const crop = opts.crop && opts.crop.w > 0.05 && opts.crop.h > 0.05 ? opts.crop : null;
  let cropCanvas = null;
  let cropCtx = null;
  if (crop) {
    cropCanvas = document.createElement("canvas");
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 360;
    cropCanvas.width = 640;
    cropCanvas.height = Math.max(64, Math.round(((crop.h * vh) / (crop.w * vw)) * 640));
    cropCtx = cropCanvas.getContext("2d");
  }

  const detectFrame = () => {
    if (!crop) return landmarker.detectForVideo(video, nextTs())?.landmarks || [];
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    cropCtx.drawImage(
      video,
      crop.x * vw, crop.y * vh, crop.w * vw, crop.h * vh,
      0, 0, cropCanvas.width, cropCanvas.height
    );
    const raw = landmarker.detectForVideo(cropCanvas, nextTs())?.landmarks || [];
    return raw.map((lm) => lm.map((q) => ({ ...q, x: crop.x + q.x * crop.w, y: crop.y + q.y * crop.h })));
  };

  // ONLINE ZOOM-TRACKER (anchors mode): each tapped player is followed
  // frame by frame. The leash SCALES with the player's on-screen size (a
  // kid sprinting toward the camera grows fast and moves far per frame),
  // matching happens from the PREDICTED position (velocity carried
  // forward), and a size-memory guard stops crossing players from
  // swapping identities. Wide-pass misses get a personal, size-matched
  // crop-and-magnify rescue.
  const torsoOf = (lm) =>
    Math.abs((lm[L_SHOULDER].y + lm[R_SHOULDER].y) / 2 - (lm[L_HIP].y + lm[R_HIP].y) / 2) || 0.06;
  const cur = anchors
    ? anchors.map((a) => ({
        x: a.x, y: a.y, vx: 0, vy: 0,
        size: a.lm ? torsoOf(a.lm) : 0.1,
        lost: 0, locked: !!a.lm,
      }))
    : null;
  const anchorTracksOnline = anchors ? anchors.map(() => []) : null;

  const leash = (c) =>
    Math.min(0.5, Math.max(0.08, c.size * 2.4) * (1 + Math.min(c.lost, 4) * 0.5));

  const acceptTrack = (c, ai, lm, hx, hy, t) => {
    // velocity + size memory (EMA) so prediction and guard stay smooth
    c.vx = 0.6 * (hx - c.x) + 0.4 * c.vx;
    c.vy = 0.6 * (hy - c.y) + 0.4 * c.vy;
    c.x = hx;
    c.y = hy;
    c.size = 0.65 * c.size + 0.35 * torsoOf(lm);
    c.lost = 0;
    c.locked = true;
    anchorTracksOnline[ai].push({ t, lm });
  };

  const assignFrame = (poses, t) => {
    const info = poses.map((lm) => ({
      lm,
      hipX: (lm[L_HIP].x + lm[R_HIP].x) / 2,
      hipY: (lm[L_HIP].y + lm[R_HIP].y) / 2,
      size: torsoOf(lm),
    }));
    const dist = (c, p) => {
      if (!c.locked) return bboxDist({ x: c.x, y: c.y }, p.lm);
      // measure from where the player was HEADING
      const px = c.x + c.vx;
      const py = c.y + c.vy;
      return Math.hypot(p.hipX - px, p.hipY - py);
    };
    const sizeOk = (c, p) => {
      if (!c.locked) return true;
      const r = p.size / c.size;
      const slack = 1 + Math.min(c.lost, 3) * 0.35; // relax when we've been blind
      return r > 0.5 / slack && r < 2.0 * slack;
    };
    const pairs = [];
    cur.forEach((c, ai) => info.forEach((p, pi) => pairs.push({ ai, pi, d: dist(c, p), p })));
    pairs.sort((a, b) => a.d - b.d);
    const assigned = new Map(); // ai -> lm
    const used = new Set();
    for (const { ai, pi, d, p } of pairs) {
      if (assigned.has(ai) || used.has(pi)) continue;
      const c = cur[ai];
      if (d > (c.locked ? leash(c) : 0.18)) continue;
      if (!sizeOk(c, p)) continue; // a body that doubled in size is someone else
      assigned.set(ai, p.lm);
      used.add(pi);
      acceptTrack(c, ai, p.lm, p.hipX, p.hipY, t);
    }
    return assigned;
  };

  const ballPath = [];
  for (let t = 0; t < duration; t += step) {
    await seekTo(video, t);
    const widePoses = detectFrame();

    let framePoses = widePoses;
    if (anchors) {
      const assigned = assignFrame(widePoses, t);
      // Zoom rescue: any tapped player the wide pass missed gets a
      // personal window sized to THEIR body, aimed where they were heading
      for (let ai = 0; ai < cur.length; ai++) {
        if (assigned.has(ai)) continue;
        const c = cur[ai];
        const aim = { x: c.x + c.vx, y: c.y + c.vy };
        const zoomPoses = await cropDetectAt(video, aim, c.size * 4.5);
        const local = nearestPose(zoomPoses, aim, Math.max(0.14, leash(c) * 0.8));
        if (local) {
          assigned.set(ai, local);
          acceptTrack(
            c, ai, local,
            (local[L_HIP].x + local[R_HIP].x) / 2,
            (local[L_HIP].y + local[R_HIP].y) / 2,
            t
          );
        } else {
          c.lost += 1;
        }
      }
      // Overlay + downstream see ONLY the tapped players, in tap order
      framePoses = cur.map((_, ai) => assigned.get(ai)).filter(Boolean);
    }

    let ball = null;
    if (ballTracker) {
      ball = ballTracker.step();
      ball.t = t;
      ballPath.push(ball);
    }
    if (opts.onFrame) opts.onFrame(framePoses, t, ball);
    rawFrames.push({ t, poses: framePoses, wide: anchors ? widePoses : undefined });
    if (onProgress) onProgress(Math.min(1, (t + step) / duration));
  }

  const anchorTracks = anchorTracksOnline;
  const framesForAnalysis = rawFrames; // anchors mode: already only tapped players

  // Honest confidence: what share of the clip each tapped player was held
  const coverage = anchors
    ? anchorTracksOnline.map((trk) => Math.round((trk.length / Math.max(1, rawFrames.length)) * 100))
    : null;

  let outcome;
  if (scenario === "penalty") {
    outcome = analyzePenalty(framesForAnalysis, duration, ballPath);
  } else if (scenario === "duel") {
    outcome = analyzeDuel(framesForAnalysis, duration, targetIndex);
  } else {
    // Open play: the tapped player (or picker index without taps)
    const tracks = anchorTracks || trackPeople(rawFrames, numPoses);
    const trk = tracks[Math.min(targetIndex, tracks.length - 1)];
    const valid = trk ? trk.map((f) => extractFrame(f.lm, f.t)) : [];
    if (valid.length < 6) {
      outcome = { error: "no-player" };
    } else {
      outcome = { metrics: computeMetrics(valid, duration), framesAnalyzed: valid.length, duration };
    }
  }

  if (!outcome.error) {
    outcome.allFrames = anchors ? framesForAnalysis : rawFrames; // replay shows only who matters
    if (ballPath.length) outcome.ballPath = ballPath;
    if (coverage) outcome.coverage = coverage;
  }
  return outcome;
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

/** Track up to maxPeople identities across frames by hip-x continuity.
 *  Returns tracks ordered left-to-right by first appearance. */
function trackPeople(rawFrames, maxPeople = 4) {
  const tracks = [];
  for (const { t, poses } of rawFrames) {
    if (!poses.length) continue;
    const centers = poses.map((lm) => (lm[L_HIP].x + lm[R_HIP].x) / 2);
    const used = new Set();
    // match existing tracks first
    for (const trk of tracks) {
      const lastX = (trk[trk.length - 1].lm[L_HIP].x + trk[trk.length - 1].lm[R_HIP].x) / 2;
      let best = -1;
      let bestD = 0.18; // max jump between samples
      poses.forEach((lm, pi) => {
        if (used.has(pi)) return;
        const d = Math.abs(centers[pi] - lastX);
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
    // unmatched poses start new tracks
    poses.forEach((lm, pi) => {
      if (used.has(pi) || tracks.length >= maxPeople) return;
      tracks.push([{ t, lm }]);
    });
  }
  const kept = tracks.filter((trk) => trk.length >= 6);
  kept.sort((a, b) => {
    const ax = (a[0].lm[L_HIP].x + a[0].lm[R_HIP].x) / 2;
    const bx = (b[0].lm[L_HIP].x + b[0].lm[R_HIP].x) / 2;
    return ax - bx;
  });
  return kept;
}


/**
 * Tiny ball tracker: template patch from the tapped ball position, followed
 * frame-to-frame by SSD search in a small window on a downscaled canvas.
 * Best-effort — when it loses the ball it says so via conf, never crashes.
 */
function createBallTracker(video, ballAnchor) {
  const W = 240;
  const H = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * W));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const P = 12; // patch half-size
  let template = null;
  let pos = { x: ballAnchor.x * W, y: ballAnchor.y * H };

  const grab = () => {
    ctx.drawImage(video, 0, 0, W, H);
    return ctx.getImageData(0, 0, W, H).data;
  };
  const patchAt = (data, cx, cy) => {
    const out = [];
    for (let dy = -P; dy <= P; dy += 2) {
      for (let dx = -P; dx <= P; dx += 2) {
        const x = Math.min(W - 1, Math.max(0, Math.round(cx + dx)));
        const y = Math.min(H - 1, Math.max(0, Math.round(cy + dy)));
        const i = (y * W + x) * 4;
        out.push(data[i], data[i + 1], data[i + 2]);
      }
    }
    return out;
  };

  return {
    step() {
      const data = grab();
      if (!template) {
        template = patchAt(data, pos.x, pos.y);
        return { x: pos.x / W, y: pos.y / H, conf: 1 };
      }
      const SEARCH = 30;
      let best = null;
      let bestSSD = Infinity;
      for (let dy = -SEARCH; dy <= SEARCH; dy += 3) {
        for (let dx = -SEARCH; dx <= SEARCH; dx += 3) {
          const cx = pos.x + dx;
          const cy = pos.y + dy;
          if (cx < P || cy < P || cx > W - P || cy > H - P) continue;
          const cand = patchAt(data, cx, cy);
          let ssd = 0;
          for (let i = 0; i < cand.length; i++) {
            const d = cand[i] - template[i];
            ssd += d * d;
            if (ssd > bestSSD) break;
          }
          if (ssd < bestSSD) {
            bestSSD = ssd;
            best = { x: cx, y: cy };
          }
        }
      }
      if (best) {
        pos = best;
        const conf = Math.max(0, 1 - bestSSD / (template.length * 5500));
        return { x: pos.x / W, y: pos.y / H, conf };
      }
      return { x: pos.x / W, y: pos.y / H, conf: 0 };
    },
  };
}

/**
 * BODY-SCAN LOCK: detect on the CURRENT frozen frame and lock onto the one
 * body nearest the coach's tap. Returns { lm, hip:{x,y} } — the skeleton to
 * flash as confirmation and the precise anchor for analysis — or null when
 * nothing lockable is under the tap.
 */
let imageLandmarkerPromise = null;
function getImageLandmarker() {
  if (!imageLandmarkerPromise) {
    imageLandmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_FULL },
        runningMode: "IMAGE",
        numPoses: 3,
        minPoseDetectionConfidence: 0.25,
        minPosePresenceConfidence: 0.25,
      });
    })();
  }
  return imageLandmarkerPromise;
}

// Crop-and-magnify detection around a point on the CURRENT video frame.
// Returns poses mapped back to full-frame coordinates. This is how a
// 40-pixel kid becomes detector-sized — used by tap-lock AND, per frame,
// by the zoom-tracker for any locked player the wide pass loses.
async function cropDetectAt(video, center, cwOverride) {
  const landmarker = await getImageLandmarker();
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw) return [];
  // Window sizes itself to the player: a near-camera body needs a BIG
  // window (default fixed crop showed torso-only and found nothing).
  const cw = Math.min(0.9, Math.max(0.22, cwOverride || 0.38));
  const ch = Math.min(0.7, (cw * vw) / vh);
  const cx = Math.min(Math.max(center.x - cw / 2, 0), 1 - cw);
  const cy = Math.min(Math.max(center.y - ch / 2, 0), 1 - ch);

  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = Math.round(((ch * vh) / (cw * vw)) * 384);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, cx * vw, cy * vh, cw * vw, ch * vh, 0, 0, canvas.width, canvas.height);

  const result = landmarker.detect(canvas);
  return (result?.landmarks || []).map((lm) =>
    lm.map((q) => ({ ...q, x: cx + q.x * cw, y: cy + q.y * ch }))
  );
}

// Distance from a point to a pose's BOUNDING BOX: 0 when the tap lands
// INSIDE the body's outline. A tap ON a small player beats any sprawling
// big body nearby — size can never steal a lock again.
function bboxDist(point, lm) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const q of lm) {
    if (q.x < minX) minX = q.x;
    if (q.y < minY) minY = q.y;
    if (q.x > maxX) maxX = q.x;
    if (q.y > maxY) maxY = q.y;
  }
  const dx = point.x < minX ? minX - point.x : point.x > maxX ? point.x - maxX : 0;
  const dy = point.y < minY ? minY - point.y : point.y > maxY ? point.y - maxY : 0;
  return Math.hypot(dx, dy);
}

function nearestPose(poses, point, maxD) {
  let best = null;
  let bestD = maxD;
  for (const lm of poses) {
    const d = bboxDist(point, lm);
    if (d < bestD) {
      bestD = d;
      best = lm;
    }
  }
  return best;
}

// ZOOM SCAN: crop a window around the tap, magnify it, detect on the crop.
async function zoomScan(video, point) {
  const poses = await cropDetectAt(video, point);
  return nearestPose(poses, point, 0.12);
}

/**
 * Auto-crop: build the arena around the locked players (and ball) with
 * scenario-sized breathing room. Returns {x,y,w,h} normalized, clamped.
 */
export function computeAutoCrop(anchors, ballAnchor, scenario = "open") {
  const pts = [];
  for (const a of anchors) {
    if (a.lm) {
      for (const q of a.lm) pts.push(q);
    } else {
      pts.push({ x: a.x, y: a.y });
    }
  }
  if (ballAnchor) pts.push(ballAnchor);
  if (!pts.length) return null;

  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const q of pts) {
    if (q.x < minX) minX = q.x;
    if (q.y < minY) minY = q.y;
    if (q.x > maxX) maxX = q.x;
    if (q.y > maxY) maxY = q.y;
  }
  const pad = scenario === "duel" ? 0.16 : scenario === "penalty" ? 0.28 : 0.3;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(1, maxX + pad);
  maxY = Math.min(1, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * BODY-SCAN LOCK, three layers deep:
 *  1. Zoom scan around the tap (small/distant players become findable)
 *  2. Full-frame scan
 *  3. The same two scans on the next moments of the clip
 * Returns { lm, hip } or null (caller then keeps the tap as a manual mark).
 */
export async function lockPlayerAt(video, point) {
  const t0 = video.currentTime;
  const attempt = async () => {
    const zoomed = await zoomScan(video, point);
    if (zoomed) return zoomed;
    const landmarker = await getLandmarker(6);
    const result = landmarker.detectForVideo(video, nextTs());
    return nearestPose(result?.landmarks || [], point, 0.15);
  };

  let best = await attempt();
  if (!best) {
    for (const dt of [0.4, 0.8, 1.2]) {
      await seekTo(video, t0 + dt);
      best = await attempt();
      if (best) break;
    }
    await seekTo(video, t0); // always restore the frozen frame
  }
  if (!best) return null;
  return {
    lm: best,
    hip: { x: (best[L_HIP].x + best[R_HIP].x) / 2, y: (best[L_HIP].y + best[R_HIP].y) / 2 },
  };
}

/**
 * Quick pre-scan: sample the first ~2s and report each player found, with a
 * head position for drawing the number badge. Returns [{index, x, y}] in
 * left-to-right order.
 */
export async function prescanPlayers(video, maxPoses = 4) {
  const landmarker = await getLandmarker(maxPoses);
  const end = Math.min(video.duration || 2, 2.5);
  const raw = [];
  video.pause();
  for (let t = 0.1; t < end; t += 0.4) {
    await seekTo(video, t);
    const result = landmarker.detectForVideo(video, nextTs());
    raw.push({ t, poses: result?.landmarks || [] });
  }
  const tracks = trackPeople(raw, maxPoses).filter((trk) => trk.length >= 2);
  return tracks.map((trk, i) => {
    const f = trk[Math.floor(trk.length / 2)].lm;
    return { index: i, x: f[NOSE].x, y: Math.max(0.04, f[NOSE].y - 0.09) };
  });
}

/**
 * PENALTY PACK v1.
 * Two tracked people. The taker is whoever produces the fastest foot movement
 * (the strike); the keeper is the other. The strike frame is the moment of
 * peak kicking-foot speed. Metrics are read at and around that frame.
 */
function analyzePenalty(rawFrames, duration, ballPath = null) {
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
  let strikeT = strike.maxT;

  // Tapped ball refines the strike: the true strike is when the kicking
  // foot meets the ball, not just the fastest frame.
  if (ballPath?.length) {
    let bestT = null;
    let bestD = Infinity;
    for (const f of takerTrack) {
      const b = ballPath.reduce((p, c) => (Math.abs(c.t - f.t) < Math.abs(p.t - f.t) ? c : p));
      if (b.conf < 0.3) continue;
      const d = Math.hypot(f.lm[kickFoot].x - b.x, f.lm[kickFoot].y - b.y);
      if (d < bestD) {
        bestD = d;
        bestT = f.t;
      }
    }
    if (bestT !== null && Math.abs(bestT - strikeT) <= 1.2) strikeT = bestT;
  }

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

/**
 * DUEL / TACKLE PACK v1 — analyzes BOTH players in a contact.
 * Target player = picker index (left-to-right). Opponent = whoever comes
 * closest to them. Contact = moment of minimum distance between hip centers.
 */
function analyzeDuel(rawFrames, duration, targetIndex = 0) {
  const tracks = trackPeople(rawFrames, 4);
  if (!tracks.length) return { error: "no-player" };

  const target = tracks[Math.min(targetIndex, tracks.length - 1)];

  // SINGLE-LOCK DUEL: only one player tapped — read the opponent
  // opportunistically from the untapped bodies the wide pass saw.
  if (tracks.length < 2) {
    return analyzeDuelSingle(rawFrames, duration, target);
  }
  const hipC = (f) => ({
    x: (f.lm[L_HIP].x + f.lm[R_HIP].x) / 2,
    y: (f.lm[L_HIP].y + f.lm[R_HIP].y) / 2,
  });
  const nearestAt = (trk, t) => {
    let best = trk[0];
    for (const f of trk) if (Math.abs(f.t - t) < Math.abs(best.t - t)) best = f;
    return best;
  };

  // Opponent = track with smallest minimum distance to target
  let opponent = null;
  let contactT = target[0].t;
  let minD = Infinity;
  for (const trk of tracks) {
    if (trk === target) continue;
    for (const f of target) {
      const o = nearestAt(trk, f.t);
      if (Math.abs(o.t - f.t) > 0.3) continue;
      const a = hipC(f);
      const b = hipC(o);
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < minD) {
        minD = d;
        opponent = trk;
        contactT = f.t;
      }
    }
  }
  if (!opponent) return { error: "no-player" };

  const evalPlayer = (trk) => {
    const at = nearestAt(trk, contactT).lm;
    const torso = Math.abs((at[L_SHOULDER].y + at[R_SHOULDER].y) / 2 - (at[L_HIP].y + at[R_HIP].y) / 2) || 0.0001;
    const baseHipY = avg(trk.map((f) => hipC(f).y));
    const contactHipY = (at[L_HIP].y + at[R_HIP].y) / 2;
    // Lower at contact than their own baseline = good (y grows downward)
    const drop = (contactHipY - baseHipY) / torso;
    const heightScore = clamp(Math.round(50 + drop * 220));

    // Recovery: the second after contact — did they stay tall and steady?
    const post = trk.filter((f) => f.t > contactT && f.t <= contactT + 1.0);
    let balanceScore = 50;
    if (post.length >= 3) {
      const torsos = post.map(
        (f) => Math.abs((f.lm[L_SHOULDER].y + f.lm[R_SHOULDER].y) / 2 - (f.lm[L_HIP].y + f.lm[R_HIP].y) / 2)
      );
      const torsoKept = avg(torsos) / torso; // < 1 = crumpled / went down
      const ys = post.map((f) => hipC(f).y);
      const sway = Math.max(...ys) - Math.min(...ys);
      balanceScore = clamp(Math.round(torsoKept * 80 - Math.min(sway / 0.25, 1) * 25 + 20));
    }
    return { heightScore, balanceScore, total: heightScore + balanceScore };
  };

  const p1 = evalPlayer(target);
  const p2 = evalPlayer(opponent);

  return {
    scenario: "duel",
    strikeT: contactT,
    duration,
    framesAnalyzed: target.length,
    metrics: { p1, p2, winner: p1.total >= p2.total ? 1 : 2 },
  };
}

/** One tapped player: contact = closest approach of ANY other body (from
 *  the wide pass); opponent read only if visible enough around contact. */
function analyzeDuelSingle(rawFrames, duration, target) {
  const hip = (lm) => ({ x: (lm[L_HIP].x + lm[R_HIP].x) / 2, y: (lm[L_HIP].y + lm[R_HIP].y) / 2 });
  const nearestAt = (trk, t) => {
    let best = trk[0];
    for (const f of trk) if (Math.abs(f.t - t) < Math.abs(best.t - t)) best = f;
    return best;
  };

  // Closest untapped body to the target across the clip = the contact
  let contactT = target[Math.floor(target.length / 2)].t;
  let minD = Infinity;
  const oppCandidates = [];
  for (const f of target) {
    const frame = rawFrames.find((r) => r.t === f.t);
    const wide = frame?.wide || frame?.poses || [];
    const th = hip(f.lm);
    for (const lm of wide) {
      const oh = hip(lm);
      const d = Math.hypot(oh.x - th.x, oh.y - th.y);
      if (d < 0.02 || d > 0.5) continue; // self / irrelevant
      oppCandidates.push({ t: f.t, lm, d });
      if (d < minD) {
        minD = d;
        contactT = f.t;
      }
    }
  }

  const evalOne = (trk) => {
    const at = nearestAt(trk, contactT).lm;
    const torso = Math.abs((at[L_SHOULDER].y + at[R_SHOULDER].y) / 2 - (at[L_HIP].y + at[R_HIP].y) / 2) || 0.0001;
    const baseHipY = avg(trk.map((f) => hip(f.lm).y));
    const drop = ((at[L_HIP].y + at[R_HIP].y) / 2 - baseHipY) / torso;
    const heightScore = clamp(Math.round(50 + drop * 220));
    const post = trk.filter((f) => f.t > contactT && f.t <= contactT + 1.0);
    let balanceScore = 50;
    if (post.length >= 3) {
      const torsos = post.map(
        (f) => Math.abs((f.lm[L_SHOULDER].y + f.lm[R_SHOULDER].y) / 2 - (f.lm[L_HIP].y + f.lm[R_HIP].y) / 2)
      );
      const kept = avg(torsos) / torso;
      const ys = post.map((f) => hip(f.lm).y);
      const sway = Math.max(...ys) - Math.min(...ys);
      balanceScore = clamp(Math.round(kept * 80 - Math.min(sway / 0.25, 1) * 25 + 20));
    }
    return { heightScore, balanceScore, total: heightScore + balanceScore };
  };

  const p1 = evalOne(target);

  // Opponent only if a body stayed near through the contact window
  const oppTrk = oppCandidates
    .filter((c) => Math.abs(c.t - contactT) <= 1.5)
    .map((c) => ({ t: c.t, lm: c.lm }));
  const p2 = oppTrk.length >= 4 ? evalOne(oppTrk) : null;

  return {
    scenario: "duel",
    strikeT: contactT,
    duration,
    framesAnalyzed: target.length,
    metrics: p2
      ? { p1, p2, winner: p1.total >= p2.total ? 1 : 2 }
      : { p1, p2: null, winner: 1 },
  };
}

/** Build duel insights (EN/ES): both players reviewed, winner named. */
export function buildDuelInsights(m) {
  const playerCards = (p, n) => [
    {
      label: `Player ${n} — Contact Height`,
      labelEs: `Jugador ${n} — Altura al Contacto`,
      audioKey: p.heightScore >= 65 ? "duel-height-good" : "duel-height-low",
      score: p.heightScore,
      feedback:
        p.heightScore >= 65
          ? "Got low into the contact — strong base, hard to knock off the ball."
          : "Arrived too upright. Bend the knees and drop the hips before contact.",
      feedbackEs:
        p.heightScore >= 65
          ? "Se agachó en el contacto — base fuerte, difícil de desequilibrar."
          : "Llegó demasiado erguido. Flexiona las rodillas y baja las caderas antes del contacto.",
    },
    {
      label: `Player ${n} — Balance & Recovery`,
      labelEs: `Jugador ${n} — Equilibrio y Recuperación`,
      audioKey: p.balanceScore >= 65 ? "duel-balance-good" : "duel-balance-low",
      score: p.balanceScore,
      feedback:
        p.balanceScore >= 65
          ? "Stayed on their feet and ready for the next action."
          : "Lost shape after the contact — balance work will keep them in the play.",
      feedbackEs:
        p.balanceScore >= 65
          ? "Se mantuvo en pie y listo para la siguiente acción."
          : "Perdió la forma tras el contacto — trabajo de equilibrio lo mantendrá en la jugada.",
    },
  ];

  // Single-lock: only the tapped player readable — their cards, no verdict-vs
  if (!m.p2) {
    const cards = playerCards(m.p1, 1);
    const duelNote = {
      audioKey: "duel-winner",
      text: "Opponent wasn't visible enough for a two-sided read — your player's contact and balance are above. Film with both players in frame for the full duel verdict.",
      textEs: "El oponente no fue suficientemente visible para una lectura de ambos — arriba están el contacto y equilibrio de tu jugador. Graba con ambos en cuadro para el veredicto completo.",
    };
    return { cards, duelNote };
  }

  const cards = [...playerCards(m.p1, 1), ...playerCards(m.p2, 2)];
  const w = m.winner;
  const duelNote = {
    audioKey: "duel-winner",
    text: `Player ${w} won this duel — lower at contact and balanced coming out of it. Player ${w === 1 ? 2 : 1}: the duel is won before contact.`,
    textEs: `El Jugador ${w} ganó este duelo — más bajo en el contacto y equilibrado al salir. Jugador ${w === 1 ? 2 : 1}: el duelo se gana antes del contacto.`,
  };
  return { cards, duelNote };
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
  const result = landmarker.detectForVideo(video, nextTs());
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
  const base = `/audio/analysis/${key}-${lang === "es" ? "es" : "en"}`;
  const audio = new Audio(`${base}.mp3`);
  // Piper-generated lines are .wav — fall back transparently
  audio.onerror = () => {
    audio.onerror = null;
    audio.src = `${base}.wav`;
    audio.play().catch(() => {});
  };
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

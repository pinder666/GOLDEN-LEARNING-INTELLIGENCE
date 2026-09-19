/**
 * OBJECT DETECTION — the Video Analyst upgrade. Detects the BALL and every
 * PLAYER on-device using MediaPipe's Object Detector (same @mediapipe/tasks-
 * vision package + same /wasm already served, EfficientDet trained on COCO,
 * Apache-2.0). Zero new dependencies, zero uploads — the video never leaves the
 * device, matching the analyst's core law.
 *
 * This is what lets the analyst SEE the game: the ball is found automatically
 * (no manual tap), all players are located (fixes crowded scenes), and real
 * ball events (speed, who's on it) become possible.
 */
import { FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";

const MODEL_FAST = "/models/efficientdet_lite0.tflite";  // ~7MB, quicker
const MODEL_ACC = "/models/efficientdet_lite2.tflite";   // ~12MB, sharper

let detectorPromise = null;

export function getDetector(accurate = true) {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      return ObjectDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: accurate ? MODEL_ACC : MODEL_FAST },
        runningMode: "VIDEO",
        scoreThreshold: 0.28,
        maxResults: 25,        // plenty of players + the ball
        categoryAllowlist: ["person", "sports ball"],
      });
    })();
  }
  return detectorPromise;
}

// Detect on one frame. Returns normalized (0..1) boxes split into players/ball.
// `source` is a video or canvas; `ts` a monotonic ms timestamp.
export function detectFrame(detector, source, ts) {
  const w = source.videoWidth || source.width;
  const h = source.videoHeight || source.height;
  if (!w || !h) return { players: [], balls: [] };
  let res;
  try { res = detector.detectForVideo(source, ts); } catch (e) { return { players: [], balls: [] }; }
  const players = [], balls = [];
  for (const d of res?.detections || []) {
    const b = d.boundingBox;
    const cat = (d.categories && d.categories[0]) || {};
    const item = {
      x: (b.originX + b.width / 2) / w,
      y: (b.originY + b.height / 2) / h,
      w: b.width / w, h: b.height / h,
      score: cat.score || 0,
    };
    if (cat.categoryName === "sports ball") balls.push(item);
    else if (cat.categoryName === "person") players.push(item);
  }
  // Best ball = highest score (there should be one); players sorted by score.
  balls.sort((a, b) => b.score - a.score);
  players.sort((a, b) => b.score - a.score);
  return { players, balls };
}

export function bestBall(balls) { return balls && balls.length ? balls[0] : null; }

export default { getDetector, detectFrame, bestBall };

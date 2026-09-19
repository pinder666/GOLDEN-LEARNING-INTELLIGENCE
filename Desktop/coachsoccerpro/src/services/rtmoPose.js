/**
 * RTMO POSE ENGINE — the real Chinese stack. One-stage multi-person pose from
 * Shanghai AI Lab (OpenMMLab), Apache-2.0, run in the browser via ONNX Runtime
 * Web. Better at crowded scenes than MediaPipe (one-stage, gets faster with
 * more people), and it detects EVERY person + their 17 COCO keypoints in a
 * single pass. Fully on-device — the video never leaves the phone.
 *
 * Output is remapped to a MediaPipe-33 landmark array (normalized 0..1) so the
 * existing analyzer (which uses MediaPipe indices) consumes it unchanged.
 *
 * NOTE: raw ONNX inference — written from rtmlib's reference. Needs an in-browser
 * test pass to confirm on real hardware.
 */
import * as ort from "onnxruntime-web";

ort.env.wasm.wasmPaths = "/ort/";
ort.env.wasm.numThreads = 1;   // CRA dev often lacks cross-origin isolation for threads

const MODEL = "/models/onnx/rtmo-s.onnx";
const SIZE = 640;
const PAD = 114;

let sessionPromise = null;
export function getRtmo() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
  }
  return sessionPromise;
}

// COCO-17 keypoint index -> MediaPipe-33 index (only the ones the analyzer uses,
// plus enough for head yaw / limbs). Others stay zero-visibility.
const COCO_TO_MP = {
  0: 0,   // nose
  1: 2, 2: 5,       // eyes (L,R) -> MP 2,5
  3: 7, 4: 8,       // ears -> MP 7,8
  5: 11, 6: 12,     // shoulders
  7: 13, 8: 14,     // elbows
  9: 15, 10: 16,    // wrists
  11: 23, 12: 24,   // hips
  13: 25, 14: 26,   // knees
  15: 27, 16: 28,   // ankles
};

// Letterbox a video/canvas frame into a 640x640 BGR NCHW Float32 tensor.
// Returns { data, ratio }.  ratio maps model-space back to source pixels.
const _c = typeof document !== "undefined" ? document.createElement("canvas") : null;
function preprocess(source) {
  const sw = source.videoWidth || source.width;
  const sh = source.videoHeight || source.height;
  const ratio = Math.min(SIZE / sh, SIZE / sw);
  const nw = Math.round(sw * ratio), nh = Math.round(sh * ratio);
  _c.width = SIZE; _c.height = SIZE;
  const ctx = _c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = `rgb(${PAD},${PAD},${PAD})`;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(source, 0, 0, sw, sh, 0, 0, nw, nh);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  // NCHW, BGR, 0-255 (RTMO trained on cv2 BGR, no normalization)
  const chw = new Float32Array(3 * SIZE * SIZE);
  const plane = SIZE * SIZE;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    chw[p] = data[i + 2];              // B
    chw[plane + p] = data[i + 1];      // G
    chw[2 * plane + p] = data[i];      // R
  }
  return { data: chw, ratio };
}

// Pick the two RTMO outputs by shape: dets [.,N,5], keypoints [.,N,17,3] (or flat).
function splitOutputs(results) {
  const vals = Object.values(results);
  let dets = null, kpts = null;
  for (const t of vals) {
    const d = t.dims;
    if (d[d.length - 1] === 5) dets = t;                 // x1,y1,x2,y2,score
    else if (d[d.length - 1] === 3 || d.includes(17)) kpts = t;
  }
  // fallback: first is dets, second keypoints
  if (!dets && vals[0]) dets = vals[0];
  if (!kpts && vals[1]) kpts = vals[1];
  return { dets, kpts };
}

// Run RTMO on one frame → array of people, each a MediaPipe-33 landmark array
// (normalized 0..1). scoreThr filters weak detections.
export async function detectPoses(source, scoreThr = 0.3) {
  const session = await getRtmo();
  const { data, ratio } = preprocess(source);
  const input = new ort.Tensor("float32", data, [1, 3, SIZE, SIZE]);
  const feeds = {}; feeds[session.inputNames[0]] = input;
  const results = await session.run(feeds);
  const { dets, kpts } = splitOutputs(results);
  if (!dets || !kpts) return [];

  const sw = source.videoWidth || source.width;
  const sh = source.videoHeight || source.height;
  const N = dets.dims[dets.dims.length - 2];
  const dd = dets.data, kd = kpts.data;
  const K = 17;
  const people = [];
  for (let i = 0; i < N; i++) {
    const score = dd[i * 5 + 4];
    if (score < scoreThr) continue;
    // build a 33-length MediaPipe landmark array
    const lm = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }));
    for (let k = 0; k < K; k++) {
      const base = (i * K + k) * 3;
      const px = (kd[base] / ratio) / sw;       // → normalized source coords
      const py = (kd[base + 1] / ratio) / sh;
      const kc = kd[base + 2];
      const mp = COCO_TO_MP[k];
      if (mp !== undefined) { lm[mp] = { x: px, y: py, z: 0, visibility: kc }; }
    }
    people.push(lm);
  }
  return people;
}

export const RTMO_MODEL = MODEL;
export default { getRtmo, detectPoses };

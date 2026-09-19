/**
 * THE LEARNING LAYER — the assistant watches the coach's rhythm and
 * predicts the next action. No ML mystery: a frequency memory of
 * (page, weekday, hour-bucket) that gets sharper every week the coach
 * uses the app. All local, all private.
 */

const KEY = "csp_usage_patterns";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

const bucketOf = (d = new Date()) => `${d.getDay()}-${Math.floor(d.getHours() / 3)}`; // weekday + 3h slot

/** Call on every page visit — one line, builds the whole memory. */
export function recordVisit(route) {
  if (!route || !route.startsWith("/coach/")) return;
  try {
    const data = load();
    const b = bucketOf();
    data[b] = data[b] || {};
    data[b][route] = (data[b][route] || 0) + 1;
    // global counts too — fallback when a time slot has no history yet
    data._all = data._all || {};
    data._all[route] = (data._all[route] || 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* never break the app for telemetry */ }
}

/**
 * Predict the coach's likely next pages right now.
 * Time-slot history first (weighted 3x), global habits as backup.
 * Returns up to `n` routes, excluding the page they're already on.
 */
export function predictNext(currentRoute, n = 3) {
  const data = load();
  const slot = data[bucketOf()] || {};
  const all = data._all || {};
  const scores = {};
  for (const [r, c] of Object.entries(all)) scores[r] = (scores[r] || 0) + c;
  for (const [r, c] of Object.entries(slot)) scores[r] = (scores[r] || 0) + c * 3;
  return Object.entries(scores)
    .filter(([r]) => r !== currentRoute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([r]) => r);
}

/* ── ACTION MEMORY — Mia learns what the coach actually DOES, not just pages ──
   Every command the coach runs is remembered (by time slot + overall), so her
   suggestions become the coach's own routine over time. No spiel, just habits. */
const AKEY = "csp_action_patterns";
function loadA() { try { return JSON.parse(localStorage.getItem(AKEY) || "{}"); } catch { return {}; } }

/** Record one command the coach ran. `label` is the tappable text to replay it. */
export function recordAction(label) {
  if (!label) return;
  try {
    const data = loadA();
    const b = bucketOf();
    data[b] = data[b] || {}; data[b][label] = (data[b][label] || 0) + 1;
    data._all = data._all || {}; data._all[label] = (data._all[label] || 0) + 1;
    localStorage.setItem(AKEY, JSON.stringify(data));
  } catch { /* telemetry never breaks the app */ }
}

/** The coach's most-likely actions right now (time slot 3x, overall as backup). */
export function predictActions(n = 4) {
  const data = loadA();
  const slot = data[bucketOf()] || {};
  const all = data._all || {};
  const scores = {};
  for (const [a, c] of Object.entries(all)) scores[a] = (scores[a] || 0) + c;
  for (const [a, c] of Object.entries(slot)) scores[a] = (scores[a] || 0) + c * 3;
  return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, n).map(([a]) => a);
}

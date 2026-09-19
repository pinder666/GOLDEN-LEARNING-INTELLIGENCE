/**
 * MIA'S BRAIN — a real, explainable learning + prediction engine (no ML black
 * box, no fakery). She OBSERVES what the coach does, learns the patterns, and
 * only predicts once she has genuine evidence. All local, all private.
 *
 * What she learns from each action:
 *   1. SEQUENCE (Markov): after action A, which action usually comes next.
 *   2. TIME: which actions happen in this weekday + time-of-day slot.
 *   3. FREQUENCY: how often each action happens overall, with recency decay.
 *
 * How she predicts NOW (given the last action + current time):
 *   score(a) = 0.5·P(a | lastAction)  +  0.3·P(a | timeSlot)  +  0.2·P(a overall)
 * She returns nothing until she has observed enough (MIN_OBS) — she watches
 * first, predicts second. Every prediction carries a confidence.
 */

const KEY = "csp_mia_brain_v1";
const MIN_OBS = 8;          // she must observe this many actions before predicting
const MAX_EVENTS = 600;     // rolling log cap
const DECAY = 0.98;         // gentle recency decay applied to counts on each observe

const slotOf = (d = new Date()) => `${d.getDay()}-${Math.floor(d.getHours() / 3)}`;

function fresh() {
  return { n: 0, actions: {}, trans: {}, time: {}, last: null, events: [] };
}
function load() {
  try { return { ...fresh(), ...(JSON.parse(localStorage.getItem(KEY) || "null") || {}) }; }
  catch { return fresh(); }
}
function save(m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} }

// Normalise a raw command into a stable pattern key (so "message Sofia's mum
// great effort" and "message Liam's dad well done" learn as the same habit
// "message a parent", while still replaying the exact text the coach tapped).
export function actionKey(text) {
  const q = String(text || "").toLowerCase().trim();
  if (/^(mark|set)\b.*\b(present|here|absent|out|presente|ausente)/.test(q)) return "attendance";
  if (/^(message|text|tell|whats ?app|mensaje|dile|manda)/.test(q)) return "message-parent";
  if (/\b(request|charge|collect|cobra|solicita)\b.*\d/.test(q)) return "request-payment";
  if (/^(remind|recu[eé]rdame|nota)/.test(q)) return "reminder";
  if (/(build|create|make|crea|haz)\b.*(drill|ejercicio)/.test(q)) return "build-drill";
  if (/(drill|ejercicio)/.test(q)) return "find-drill";
  if (/^(how|c[oó]mo)\b/.test(q) || /\?$/.test(q)) return "howto";
  if (/^(open|go to|show|abre|ir a|mu[eé]strame)\b/.test(q)) return "open:" + q.replace(/^(open|go to|show me|show|abre|abrir|ir a|mu[eé]strame)\s*/, "").trim();
  return "say:" + q.slice(0, 40);
}

const inc = (obj, k, by = 1) => { obj[k] = (obj[k] || 0) + by; };
function decayAll(m) {
  for (const a in m.actions) m.actions[a] *= DECAY;
  for (const p in m.trans) for (const nx in m.trans[p]) m.trans[p][nx] *= DECAY;
  for (const s in m.time) for (const a in m.time[s]) m.time[s][a] *= DECAY;
}

/** Observe one thing the coach did. `label` is the exact text to replay it. */
export function observe(label, ctx = {}) {
  if (!label) return;
  const key = actionKey(label);
  const m = load();
  decayAll(m);
  const slot = slotOf();
  inc(m.actions, key);
  m.time[slot] = m.time[slot] || {}; inc(m.time[slot], key);
  if (m.last && m.last.key) { m.trans[m.last.key] = m.trans[m.last.key] || {}; inc(m.trans[m.last.key], key); }
  m.n += 1;
  m.last = { key, label, ts: Date.now() };
  m.events.push({ key, label, slot, page: ctx.page || "", ts: Date.now() });
  if (m.events.length > MAX_EVENTS) m.events = m.events.slice(-MAX_EVENTS);
  // remember the freshest exact label for each pattern key (for replay text)
  m._labels = m._labels || {}; m._labels[key] = label;
  save(m);
}

const norm = (obj) => {
  const total = Object.values(obj || {}).reduce((s, v) => s + v, 0) || 1;
  const out = {}; for (const k in obj) out[k] = obj[k] / total; return out;
};

/**
 * Predict the coach's likely next actions RIGHT NOW.
 * Returns { ready, observed, need, items:[{key,label,confidence}] }.
 * ready=false (with progress) until she's observed enough — she won't fake it.
 */
export function predict(n = 4) {
  const m = load();
  if (m.n < MIN_OBS) return { ready: false, observed: m.n, need: MIN_OBS, items: [] };

  const pMarkov = norm(m.last && m.trans[m.last.key]);   // what usually follows the last action
  const pTime = norm(m.time[slotOf()]);                  // what happens in this time slot
  const pFreq = norm(m.actions);                         // overall habit
  const labels = m._labels || {};

  const keys = new Set([...Object.keys(pMarkov), ...Object.keys(pTime), ...Object.keys(pFreq)]);
  const scored = [];
  for (const k of keys) {
    if (m.last && k === m.last.key) continue; // don't suggest the thing they just did
    const score = 0.5 * (pMarkov[k] || 0) + 0.3 * (pTime[k] || 0) + 0.2 * (pFreq[k] || 0);
    if (score <= 0) continue;
    scored.push({ key: k, label: labels[k] || k, confidence: Math.round(score * 100) });
  }
  scored.sort((a, b) => b.confidence - a.confidence);
  // only surface predictions she's actually confident about
  const items = scored.filter((s) => s.confidence >= 12).slice(0, n);
  return { ready: true, observed: m.n, need: MIN_OBS, items };
}

export function reset() { save(fresh()); }
export default { observe, predict, actionKey, reset };

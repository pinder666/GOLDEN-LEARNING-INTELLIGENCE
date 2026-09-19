/* Build src/data/classroom.js from the FULL SoccerMental handoff.
   Ships every lesson body, stat card, source, the VERBATIM draw() animation
   source, and the owned audio path — a faithful copy of the SoccerMental
   classroom, reskinned for CoachSoccerPro rendering only.
   Re-run:  node scripts/convert-managers.js */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const mgrJson = JSON.parse(fs.readFileSync(path.join(ROOT, "handoff/sm_managers_export.json"), "utf8"));
const tacJson = JSON.parse(fs.readFileSync(path.join(ROOT, "handoff/sm_tactics_export.json"), "utf8"));
// Native Spanish translations (scripts/translate-classroom.js) merged over the export.
let esov = {};
try { esov = JSON.parse(fs.readFileSync(path.join(ROOT, "handoff/es_overrides.json"), "utf8")); } catch (e) { esov = {}; }
const esBeat = (id, beat) => (esov[id] && esov[id].beats && esov[id].beats[beat]) || "";
const esTitle = (id) => (esov[id] && esov[id].titleEs) || "";
const esSub = (id) => (esov[id] && esov[id].subEs) || "";
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "handoff/audio_manifest.json"), "utf8")).lines;

// 0-100 -> board pixels, ONLY for the signature formation on the Tactics Board.
// (The classroom renders in SoccerMental's own 140x90 space via draw().)
const MX = (x) => Math.round(45 + (Math.max(-8, Math.min(112, x)) / 100) * 590);
const MY = (y) => Math.round(45 + (Math.max(-8, Math.min(112, y)) / 100) * 350);

// ── Audio grain (regenerated manifest 2026-09-15) ────────────────────────────
//   EN — heads never spoken. One intro (beat 0), then body sentence-by-sentence.
//   ES — original grain: head_es / body_es per beat.
const toUrl = (a) => "/tts_cache/" + a.split("/").pop();
const enIntro = {}, enSentences = {}, esHead = {}, esBody = {};
for (const e of manifest) {
  if (!e.audio) continue;
  const unit = (e.unit || "").replace(/^classroom\//, "");
  if (e.field === "intro") enIntro[unit] = { file: toUrl(e.audio), text: e.text || "" };
  else if (e.field === "sentence") {
    const k = `${unit}|${e.beat}`;
    (enSentences[k] = enSentences[k] || []).push({ file: toUrl(e.audio), text: e.text || "", seq: e.seq || 0 });
  } else if (e.field === "head_es") esHead[`${unit}|${e.beat}`] = toUrl(e.audio);
  else if (e.field === "body_es") esBody[`${unit}|${e.beat}`] = toUrl(e.audio);
}
Object.values(enSentences).forEach((a) => a.sort((x, y) => x.seq - y.seq));
const enSents = (u, b) => (enSentences[`${u}|${b}`] || []).map(({ file, text }) => ({ file, text }));

// draw(){ …body… }  ->  the body only, so it can run as a Function body.
function drawBody(src) {
  if (!src) return "";
  const i = src.indexOf("{"), j = src.lastIndexOf("}");
  return i >= 0 && j > i ? src.slice(i + 1, j) : src;
}

function isGk(l) { return /gk|keeper|alisson|de ?sar|neuer|courtois|ederson/i.test(l || ""); }

// Spanish classroom voice (matches the ES heads). Body clips for our native
// translations are baked to /tts_cache/<hash>.mp3 by generate-classroom-es-audio.js.
const crypto = require("crypto");
const ES_VOICE = "LlZr3QuzbW4WrPjgATHG";
const esBodyPath = (txt) =>
  txt ? "/tts_cache/" + crypto.createHash("sha1").update(ES_VOICE + "|" + String(txt).trim().slice(0, 2000), "utf8").digest("hex") + ".mp3" : null;

function buildBeats(rawBeats, id) {
  return (rawBeats || []).map((b) => {
    const bodyEs = b.body_es || esBeat(id, b.beat) || "";
    return {
      beat: b.beat,
      head: b.head || "",
      headEs: b.head_es || "",
      body: b.body || "",
      bodyEs,
      src: b.src || "",
      stats: (b.stats || []).slice(0, 4),
      draw: drawBody(b.draw_source),                     // verbatim SM animation
      audioEnSentences: enSents(id, b.beat),
      audioEsHead: esHead[`${id}|${b.beat}`] || null,
      // SM-provided ES clip, else our baked ES clip for the translated body
      audioEsBody: esBody[`${id}|${b.beat}`] || esBodyPath(bodyEs),
    };
  });
}

// ── Managers ──────────────────────────────────────────────────────────────
const MANAGER_PLAYS = mgrJson.managers.map((m) => {
  const players = (m.positions || []).map((p, i) => ({
    id: `${m.id}_${i}`, x: MX(p.x), y: MY(p.y),
    col: isGk(p.label) ? "#f59e0b" : "#f97316",
    lbl: (p.label || "•").slice(0, 3), role: p.sublabel || p.meaning || "",
  }));
  const arrows = (m.arrows || []).map((a) => ({ x1: MX(a.x1), y1: MY(a.y1), x2: MX(a.x2), y2: MY(a.y2), col: "#f97316" }));
  return {
    id: m.id, wing: "manager",
    coach: m.name, team: m.team, system: m.system,
    name: m.title && m.title.includes("—") ? m.title.split("—")[1].trim() : (m.system || m.name),
    nameEs: esTitle(m.id) && esTitle(m.id).includes("—") ? esTitle(m.id).split("—")[1].trim() : "",
    title: m.title || m.name, sub: m.sub || "",
    titleEs: esTitle(m.id), subEs: esSub(m.id),
    keyPrinciple: m.key_principle, honours: m.honours || "",
    description: m.doctrine, descriptionEs: m.doctrine,
    players, arrows,
    audioEnIntro: (enIntro[m.id] && enIntro[m.id].file) || null,
    introText: (enIntro[m.id] && enIntro[m.id].text) || "",
    beats: buildBeats(m.beats, m.id),
  };
});

// ── Tactics + World ─────────────────────────────────────────────────────────
function lessonFrom(t, wing) {
  const beats = buildBeats(t.beats, t.id);
  return {
    id: t.id, wing, coach: t.sub || (wing === "world" ? "World of Football" : "Tactics"),
    team: "", system: "",
    name: t.title && t.title.includes("—") ? t.title.split("—")[1].trim() : (t.title || t.id),
    nameEs: (() => { const e = t.title_es || esTitle(t.id); return e && e.includes("—") ? e.split("—")[1].trim() : ""; })(),
    title: t.title || t.id, sub: t.sub || "",
    titleEs: t.title_es || esTitle(t.id), subEs: t.sub_es || esSub(t.id),
    keyPrinciple: (beats[0] && beats[0].head) || "",
    description: (beats[0] && beats[0].body) || t.sub || "",
    descriptionEs: (beats[0] && beats[0].bodyEs) || t.sub_es || "",
    players: [], arrows: [],
    audioEnIntro: (enIntro[t.id] && enIntro[t.id].file) || null,
    introText: (enIntro[t.id] && enIntro[t.id].text) || "",
    beats,
  };
}
const TACTICS_LESSONS = (tacJson.tactics || []).map((t) => lessonFrom(t, "tactic"));
const WORLD_LESSONS = (tacJson.world_of_football || []).map((t) => lessonFrom(t, "world"));

const banner =
  "// AUTO-GENERATED from handoff/*.json — SoccerMental original content,\n" +
  "// rendered/reskinned for CoachSoccerPro rendering only. Do not hand-edit.\n" +
  "// Re-run:  node scripts/convert-managers.js\n\n";
const body =
  "export const MANAGER_PLAYS = " + JSON.stringify(MANAGER_PLAYS) + ";\n\n" +
  "export const TACTICS_LESSONS = " + JSON.stringify(TACTICS_LESSONS) + ";\n\n" +
  "export const WORLD_LESSONS = " + JSON.stringify(WORLD_LESSONS) + ";\n\n" +
  "export const CLASSROOM = { manager: MANAGER_PLAYS, tactic: TACTICS_LESSONS, world: WORLD_LESSONS };\n";
fs.writeFileSync(path.join(ROOT, "src/data/classroom.js"), banner + body);

const all = [...MANAGER_PLAYS, ...TACTICS_LESSONS, ...WORLD_LESSONS];
const beatCount = all.reduce((n, l) => n + l.beats.length, 0);
const withDraw = all.reduce((n, l) => n + l.beats.filter((b) => b.draw).length, 0);
console.log("wrote src/data/classroom.js");
console.log(`  managers ${MANAGER_PLAYS.length} · tactics ${TACTICS_LESSONS.length} · world ${WORLD_LESSONS.length}`);
console.log(`  ${beatCount} beats · ${withDraw} with draw() · intros ${all.filter((l) => l.audioEnIntro).length}/${all.length}`);

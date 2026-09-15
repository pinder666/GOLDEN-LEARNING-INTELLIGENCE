/* Convert handoff/sm_managers_export.json → src/data/managers.js in the
   Tactics Board play format. SoccerMental content, rendered/reskinned for
   CoachSoccerPro. Re-run: node scripts/convert-managers.js */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const j = JSON.parse(fs.readFileSync(path.join(ROOT, "handoff/sm_managers_export.json"), "utf8"));

// JSON coords: x 0-100 (attacking right), y 0-100 (top-bottom).
// Board viewBox 680x440, pitch rect ~x30-650 / y30-410.
const MX = (x) => Math.round(45 + (Math.max(0, Math.min(100, x)) / 100) * 590);
const MY = (y) => Math.round(45 + (Math.max(0, Math.min(100, y)) / 100) * 350);
const AX = (x) => Math.round(45 + (Math.max(-5, Math.min(112, x)) / 100) * 590);

const plays = j.managers.map((m) => {
  const players = m.positions.map((p, i) => ({
    id: `${m.id}_${i}`,
    x: MX(p.x),
    y: MY(p.y),
    col: /gk|alisson|de sar/i.test(p.label || "") ? "#f59e0b" : "#f97316",
    lbl: p.label || "•",
    role: "",
  }));
  const arrows = (m.arrows || []).map((a) => ({
    x1: AX(a.x1), y1: MY(a.y1), x2: AX(a.x2), y2: MY(a.y2), col: "#f97316",
  }));
  return {
    id: m.id,
    coach: m.name,
    team: m.team,
    system: m.system,
    name: m.title.includes("—") ? m.title.split("—")[1].trim() : m.system,
    keyPrinciple: m.key_principle,
    smUnits: [
      `Coaching point: ${m.key_principle}`,
      ...((m.beats_digest || []).slice(0, 2).map((b) => b.head)),
    ],
    description: m.doctrine,
    descriptionEs: m.doctrine, // ES fallback until translated
    players,
    arrows,
  };
});

const out =
  "// AUTO-GENERATED from handoff/sm_managers_export.json — SoccerMental\n" +
  "// content, rendered/reskinned for CoachSoccerPro. Re-run:\n" +
  "//   node scripts/convert-managers.js\n\n" +
  "export const MANAGER_PLAYS = " + JSON.stringify(plays, null, 1) + ";\n";

fs.writeFileSync(path.join(ROOT, "src/data/managers.js"), out);
console.log(`wrote src/data/managers.js — ${plays.length} managers`);
console.log("chapman players[0..2]:", JSON.stringify(plays[0].players.slice(0, 3)));
console.log("chapman arrows:", JSON.stringify(plays[0].arrows));

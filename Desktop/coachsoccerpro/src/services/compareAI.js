/**
 * Compare-as-a-game. The coach sets up their own play + mindset, picks an
 * elite manager to play against, and gets a scored read: how close their
 * football is to the master's, what's aligned, the biggest gap, and ONE
 * drill to close it. Creation-time only — never called during playback.
 *
 * Tries Claude for the real read; falls back to a deterministic heuristic
 * so the game is never dead (dev, offline, or no key).
 */

const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

// Board pixels -> 0..100 so the model reasons in pitch terms.
const NX = (x) => Math.round(((x - 45) / 590) * 100);
const NY = (y) => Math.round(((y - 45) / 350) * 100);

function shape(players) {
  return (players || []).map((p) => ({
    x: NX(p.x), y: NY(p.y), label: p.lbl || "", role: p.role || "",
  }));
}

const SYSTEM = `You are an elite football tactics coach analysing a youth coach's play against a master manager's doctrine. You are encouraging but honest. You output ONLY valid JSON, no markdown fences, no commentary.

Schema (all fields required):
{
  "score": integer 0-100 — how closely the coach's play embodies the master's football,
  "verdict": one punchy line like "You're 70% Guardiola, 30% Mourinho" — name the closest style and the tension,
  "aligned": array of 2-3 short strings — what the coach is ALREADY doing that matches the master,
  "gap": one short string — the single biggest thing missing vs the master,
  "improve": one short, concrete instruction the coach can apply on the training pitch tomorrow,
  "drill": { "title": string, "titleEs": Spanish, "desc": one sentence, "descEs": Spanish } — one drill that closes the gap,
  "mindsetRead": one short line reacting to the coach's stated mindset vs the master's.
}
Keep every string tight. Write Spanish natively, not literal translation.`;

export async function comparePlay({ playName, players, arrows, mindset, manager, lang = "en" }) {
  const payload = {
    coach_play: {
      name: playName || "My Play",
      mindset: mindset || "(none stated)",
      formation: shape(players),
      movements: (arrows || []).map((a) => ({ from: [NX(a.x1), NY(a.y1)], to: [NX(a.x2), NY(a.y2)] })),
    },
    master: {
      name: manager.coach, team: manager.team, system: manager.system,
      principle: manager.keyPrinciple, doctrine: manager.description,
    },
    reply_language: lang === "es" ? "Spanish" : "English",
  };

  if (API_KEY) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1200,
          system: SYSTEM,
          messages: [{ role: "user", content: "Analyse this and output the JSON only:\n" + JSON.stringify(payload) }],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        let text = (data?.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
        const out = JSON.parse(text);
        if (typeof out.score === "number" && out.verdict) return { ...out, source: "ai" };
      }
    } catch (e) { /* fall through to heuristic */ }
  }
  return heuristic(payload, lang);
}

// ── Deterministic fallback so the game always plays ──────────────────────────
function heuristic(payload, lang) {
  const { coach_play, master } = payload;
  const ps = coach_play.formation;
  const n = ps.length || 1;
  const avgX = ps.reduce((s, p) => s + p.x, 0) / n;      // higher = further forward
  const spreadY = Math.max(...ps.map((p) => p.y), 0) - Math.min(...ps.map((p) => p.y), 100);
  const highLine = avgX > 55;
  const wide = spreadY > 55;
  const doc = (master.principle + " " + master.doctrine).toLowerCase();
  const wantsHigh = /press|high|possess|dominate|attack|control|forward/.test(doc);
  const wantsWide = /width|wing|stretch|spread|overload/.test(doc);
  const wantsCompact = /compact|deep|block|counter|shrink|narrow|defen/.test(doc);

  let score = 50;
  const aligned = [];
  if (wantsHigh && highLine) { score += 15; aligned.push(lang === "es" ? "Tu línea es alta, como el maestro" : "Your line is high, like the master"); }
  if (wantsWide && wide) { score += 12; aligned.push(lang === "es" ? "Usas el ancho del campo" : "You use the full width"); }
  if (wantsCompact && !wide) { score += 12; aligned.push(lang === "es" ? "Mantienes un bloque compacto" : "You keep a compact block"); }
  if (coach_play.movements.length) { score += 8; aligned.push(lang === "es" ? "Tus jugadores tienen movimientos definidos" : "Your players have defined movements"); }
  if (!aligned.length) aligned.push(lang === "es" ? "Tienes una estructura clara para construir" : "You have a clear structure to build on");
  score = Math.max(35, Math.min(92, score));

  let gap, improve;
  if (wantsHigh && !highLine) {
    gap = lang === "es" ? "Tu equipo está demasiado profundo para su presión" : "Your team sits too deep for their press";
    improve = lang === "es" ? "Sube la línea 10 metros y presiona la primera salida" : "Push the line up 10 yards and press the first pass";
  } else if (wantsWide && !wide) {
    gap = lang === "es" ? "Estás demasiado estrecho — falta amplitud" : "You're too narrow — missing width";
    improve = lang === "es" ? "Ancla un jugador en cada banda para estirar la defensa" : "Pin a player on each touchline to stretch the defence";
  } else if (wantsCompact && wide) {
    gap = lang === "es" ? "Dejas espacios entre líneas" : "You leave gaps between the lines";
    improve = lang === "es" ? "Junta las líneas: máximo 25 metros entre defensa y ataque" : "Squeeze the lines: 25 yards max from back to front";
  } else {
    gap = lang === "es" ? "Falta un patrón claro de progresión" : "A clear pattern to progress the ball is missing";
    improve = lang === "es" ? "Define quién recibe entre líneas y quién corre en profundidad" : "Decide who receives between the lines and who runs in behind";
  }

  return {
    source: "heuristic",
    score,
    verdict: lang === "es"
      ? `Tu juego es ${score}% ${master.name.split(" ").pop()}`
      : `Your play is ${score}% ${master.name.split(" ").pop()}`,
    aligned,
    gap,
    improve,
    drill: {
      title: "Shape & Space",
      titleEs: "Forma y Espacio",
      desc: improve + ".",
      descEs: (lang === "es" ? improve : "") + ".",
    },
    mindsetRead: lang === "es"
      ? `El maestro diría: "${master.principle}". Compara eso con tu mentalidad.`
      : `The master would say: "${master.principle}". Weigh that against your mindset.`,
  };
}

export default { comparePlay };

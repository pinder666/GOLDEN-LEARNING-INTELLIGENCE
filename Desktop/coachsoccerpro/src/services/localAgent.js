/**
 * THE LOCAL AGENT — the assistant's brain. Runs 100% on-device: no Claude, no
 * API, no recurring bill. Voice/text in → a command out. It understands what
 * the coach said with patterns + slot-filling and returns an intent the
 * Assistant executes (navigate, mark attendance, request payment, save a note,
 * template a parent message, find a library drill, answer a how-to).
 *
 * The ONE thing it hands to Claude is generating a BRAND-NEW drill — that's the
 * only paid area (kind "build-drill" → My Drills runs the model). Everything
 * else is free forever.
 */

// Pages the agent can open.
export const NAV_TARGETS = [
  { route: "/coach/dashboard", en: "Dashboard", es: "Inicio", keys: ["dashboard", "home", "inicio", "snapshot", "business"] },
  { route: "/coach/roster", en: "Roster", es: "Plantilla", keys: ["roster", "plantilla", "team list", "players list", "jugadores"] },
  { route: "/coach/roster/add", en: "Add Player", es: "Agregar Jugador", keys: ["add player", "new player", "agregar jugador"] },
  { route: "/coach/media", en: "Media", es: "Fotos y Videos", keys: ["media", "photos", "fotos", "videos"] },
  { route: "/coach/calendar", en: "Calendar", es: "Calendario", keys: ["calendar", "calendario", "schedule", "event", "evento"] },
  { route: "/coach/attendance", en: "Attendance", es: "Asistencia", keys: ["attendance", "asistencia"] },
  { route: "/coach/messages", en: "Messages", es: "Mensajes", keys: ["messages", "mensajes", "inbox"] },
  { route: "/coach/badges", en: "Badges", es: "Insignias", keys: ["badge", "insignia"] },
  { route: "/coach/prohabits", en: "Pro Habits", es: "Hábitos Pro", keys: ["habit", "hábito", "habito"] },
  { route: "/coach/leaderboard", en: "Leaderboard", es: "Tabla", keys: ["leaderboard", "tabla", "ranking"] },
  { route: "/coach/payments", en: "Payments", es: "Pagos", keys: ["payments", "pagos", "dues", "cuotas", "billing"] },
  { route: "/coach/drills", en: "Drill Library", es: "Ejercicios", keys: ["drill library", "library", "biblioteca", "ejercicios"] },
  { route: "/coach/mydrills", en: "My Drills", es: "Mis Ejercicios", keys: ["my drills", "mis ejercicios", "drill board", "pizarra"] },
  { route: "/coach/tactics", en: "Tactics Board", es: "Tablero Táctico", keys: ["tactic", "táctic", "tactica"] },
  { route: "/coach/classroom", en: "Classroom", es: "Aula", keys: ["classroom", "aula", "lesson", "lección", "manager"] },
  { route: "/coach/session", en: "Session Planner", es: "Plan de Sesión", keys: ["session", "sesión", "sesion", "planner"] },
  { route: "/coach/checkmatch", en: "Checkmatch", es: "Checkmatch", keys: ["checkmatch"] },
  { route: "/coach/video", en: "Video Analysis", es: "Análisis de Video", keys: ["video", "analysis", "análisis", "film", "grabar"] },
  { route: "/coach/seats", en: "Seats", es: "Asientos", keys: ["seats", "asientos", "families", "familias"] },
  { route: "/coach/settings", en: "Settings", es: "Ajustes", keys: ["settings", "ajustes", "config", "white label", "brand"] },
];

// ── tiny local stores (dev). Production wires these to Supabase. ──
const store = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
};
const push = (key, item) => {
  const list = [item, ...store(key)].slice(0, 500);
  localStorage.setItem(key, JSON.stringify(list));
  try { window.dispatchEvent(new Event(key + "-changed")); } catch (e) {}
  return item;
};

const norm = (s) => String(s || "").toLowerCase().trim();
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Best-effort fuzzy nav match (no library): score keyword hits.
function matchNav(q) {
  let best = null, score = 0;
  for (const tgt of NAV_TARGETS) {
    const s = tgt.keys.filter((k) => q.includes(k)).length;
    if (s > score) { score = s; best = tgt; }
  }
  return score ? best : null;
}

/**
 * interpret(text, lang) → { kind, replyEn, replyEs, ...payload }
 * kinds: navigate | attendance | payment | reminder | message | find-drill |
 *        build-drill | howto | note | unknown
 */
export function interpret(raw, lang = "en") {
  const text = String(raw || "").trim();
  const q = norm(text);
  if (!q) return { kind: "unknown", replyEn: "Say that again?", replyEs: "¿Repite eso?" };

  // ── Attendance: "mark Marcus present" / "Sofia is absent" ──
  const att = q.match(/\b(?:mark|set|register)?\s*([a-záéíóúñ]+)\s+(?:is\s+|as\s+|está\s+)?(present|here|in|absent|missing|out|presente|ausente|falta)\b/i);
  if (att && /(present|here|in|absent|missing|out|presente|ausente|falta)/i.test(att[2])) {
    const name = cap(att[1]);
    const present = /(present|here|in|presente)/i.test(att[2]);
    push("csp_attendance_log", { name, present, at: new Date().toISOString() });
    return {
      kind: "attendance", name, present,
      replyEn: `✓ ${name} marked ${present ? "present" : "absent"}.`,
      replyEs: `✓ ${name} marcado ${present ? "presente" : "ausente"}.`,
    };
  }

  // ── Payment request: "request 40 from the U12s for the tournament" ──
  const pay = q.match(/\b(request|charge|collect|invoice|cobra|solicita)\b.*?(\$?\s?\d+)\s*(?:dollars|usd|dólares)?\s*(?:from|for|to|de|a|para)?\s*(.*)?/i);
  if (pay) {
    const amount = (pay[2] || "").replace(/[^\d]/g, "");
    const who = cap((pay[3] || "").replace(/\bfor .*$/i, "").trim()) || (lang === "es" ? "el equipo" : "the team");
    if (amount) {
      push("csp_payment_requests", { amount: Number(amount), who, note: text, at: new Date().toISOString(), status: "requested" });
      return {
        kind: "payment", amount, who,
        replyEn: `✓ Payment request logged: $${amount} from ${who}. It's on your Payments page — SoccerMental bills it.`,
        replyEs: `✓ Solicitud registrada: $${amount} de ${who}. Está en tu página de Pagos — SoccerMental lo cobra.`,
        route: "/coach/payments",
      };
    }
  }

  // ── Reminder ──
  if (/^(remind me|recu[eé]rdame|recordarme|reminder|nota)\b/i.test(q)) {
    const rtext = text.replace(/^(remind me( to)?|recu[eé]rdame( de)?|recordarme|reminder:?|nota:?)\s*/i, "").trim();
    push("csp_reminders", { id: Date.now(), text: rtext || text, createdAt: new Date().toISOString(), done: false });
    return { kind: "reminder", text: rtext, replyEn: `📌 Saved: "${rtext}" — it's on your Dashboard.`, replyEs: `📌 Guardado: "${rtext}" — está en tu Inicio.` };
  }

  // ── Parent message (template, NO Claude): "message Sofia's mum great effort" ──
  const msg = text.match(/^(?:message|text|tell|whats ?app|mensaje|dile|manda(?:le)?|env[ií]a(?:le)?)\s+(.+)/i);
  if (msg) {
    const rest = msg[1];
    // split recipient from the note at the first comma, "that", "about", "—"
    const m = rest.match(/^(.+?)(?:,|\bthat\b|\babout\b|\bque\b|\bsobre\b|—|:)\s*(.+)$/i);
    const recipient = cap((m ? m[1] : rest.split(" ").slice(0, 2).join(" ")).trim());
    const note = (m ? m[2] : rest).trim();
    return { kind: "message", recipient, note, replyEn: "Here's the draft — send it your way:", replyEs: "Aquí está el borrador — envíalo a tu manera:" };
  }

  // ── Drill: BUILD (new → Claude) vs FIND (library → local) ──
  if (/\b(drill|ejercicio|exercise|rondo)\b/i.test(q)) {
    if (/\b(build|create|make|design|generate|new|crea|haz|diseñ|genera|nuevo)\b/i.test(q)) {
      return { kind: "build-drill", prompt: text, replyEn: "Building a fresh drill on your board… →", replyEs: "Creando un ejercicio nuevo en tu pizarra… →" };
    }
    return { kind: "find-drill", query: text, replyEn: "Opening the library to that… →", replyEs: "Abriendo la biblioteca… →", route: "/coach/drills" };
  }

  // ── How-to ──
  if (/^(how|c[oó]mo)\b/i.test(q) || /\?$/.test(q)) {
    return { kind: "howto", query: text };
  }

  // ── Navigation ──
  const nav = matchNav(q);
  if (nav && (/(open|go to|take me|show|abre|abrir|ir a|mu[eé]strame|ll[eé]vame)/i.test(q) || q.split(" ").length <= 3)) {
    return { kind: "navigate", target: nav, replyEn: `Opening ${nav.en} →`, replyEs: `Abriendo ${nav.es} →` };
  }

  // ── Plain note fallback (still useful, no Claude): keep it ──
  if (q.split(" ").length >= 3) {
    push("csp_reminders", { id: Date.now(), text, createdAt: new Date().toISOString(), done: false, note: true });
    return { kind: "note", text, replyEn: `📝 Saved as a note on your Dashboard.`, replyEs: `📝 Guardado como nota en tu Inicio.` };
  }

  return {
    kind: "unknown",
    replyEn: "I can open any page, mark attendance, request a payment, save a note, message a parent, or find a drill. Try: \"message Sofia's mum great effort today\".",
    replyEs: "Puedo abrir cualquier página, marcar asistencia, solicitar un pago, guardar una nota, enviar mensaje a un padre, o buscar un ejercicio. Prueba: \"mensaje a la mamá de Sofía gran esfuerzo hoy\".",
  };
}

// Template a parent message from the coach's own words — NO Claude.
export function templateMessage(recipient, note, coachName, lang = "en") {
  const to = recipient ? recipient : (lang === "es" ? "Hola" : "Hi");
  const body = cap(String(note || "").trim());
  const sig = coachName ? `\n— ${lang === "es" ? "Entrenador" : "Coach"} ${coachName}` : "";
  return lang === "es"
    ? `Hola ${to === "Hola" ? "" : to}, ${body}${sig}`.replace("Hola ,", "Hola,")
    : `Hi ${to === "Hi" ? "" : to}, ${body}${sig}`.replace("Hi ,", "Hi,");
}

// ── Automation message templates — all local, no Claude, no cost. ──────────────
// The coach's own voice, filled from data. Used by welcome/reminder automations.
export function welcomeMessage({ parent, player, team, coach }, lang = "en") {
  const p = parent || (lang === "es" ? "" : "");
  if (lang === "es") {
    return `Hola${p ? " " + p : ""}, soy ${coach || "el entrenador"} de ${team || "el equipo"}. ¡Bienvenido! ` +
      `Estoy encantado de tener a ${player || "tu hijo/a"} con nosotros. Te mantendré al día de su progreso, ` +
      `partidos y todo lo que necesites. Cualquier duda, escríbeme por aquí cuando quieras.`;
  }
  return `Hi${p ? " " + p : ""}, I'm ${coach || "your coach"} at ${team || "the team"}. Welcome! ` +
    `I'm really glad to have ${player || "your child"} with us. I'll keep you posted on their progress, ` +
    `sessions and anything you need. Any questions, just message me here anytime.`;
}

export function paymentReminder({ parent, amount, what, dueLabel }, lang = "en") {
  if (lang === "es") {
    return `Hola${parent ? " " + parent : ""}, un recordatorio amistoso: ${what || "las cuotas"} ` +
      `${amount ? "de $" + amount + " " : ""}${dueLabel || ""}. Puedes pagar con el botón de abajo. ¡Gracias!`;
  }
  return `Hi${parent ? " " + parent : ""}, a friendly reminder: ${what || "dues"} ` +
    `${amount ? "of $" + amount + " " : ""}${dueLabel || "are due"}. You can pay with the button below. Thanks!`;
}

export function eventReminder({ parent, title, whenLabel, place }, lang = "en") {
  if (lang === "es") {
    return `Hola${parent ? " " + parent : ""}, recordatorio: ${title || "sesión"} ${whenLabel || "mañana"}` +
      `${place ? " en " + place : ""}. ¡Nos vemos!`;
  }
  return `Hi${parent ? " " + parent : ""}, reminder: ${title || "session"} ${whenLabel || "tomorrow"}` +
    `${place ? " at " + place : ""}. See you there!`;
}

export default { interpret, templateMessage, welcomeMessage, paymentReminder, eventReminder, NAV_TARGETS };

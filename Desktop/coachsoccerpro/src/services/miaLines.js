/**
 * MIA'S SCRIPT LIBRARY — every fixed thing she says, EN + ES. Baked to MP3 in
 * her voice once (scripts/generate-mia-voice.js), played by hashing the exact
 * text. NO runtime AI. Dynamic names fall back to device voice; small counts
 * are baked as sentence variants so numbers sound natural.
 *
 * To add something she can say: add the line here, re-run the bake script.
 */

// Confirmations she speaks after doing something (via the local agent).
export const CONFIRMS = {
  present: { en: "Done — marked present.", es: "Listo — marcado presente." },
  absent: { en: "Done — marked absent.", es: "Listo — marcado ausente." },
  reminderSaved: { en: "Saved to your dashboard.", es: "Guardado en tu inicio." },
  paymentLogged: { en: "Payment request logged.", es: "Solicitud de pago registrada." },
  messageReady: { en: "Your message is ready — send it your way.", es: "Tu mensaje está listo — envíalo a tu manera." },
  drillBuilding: { en: "Building your drill now.", es: "Creando tu ejercicio ahora." },
  welcomeSent: { en: "Welcome message ready for the new parent.", es: "Mensaje de bienvenida listo para el nuevo padre." },
  noteSaved: { en: "Saved as a note.", es: "Guardado como nota." },
  onIt: { en: "On it.", es: "Enseguida." },
  didntCatch: { en: "I didn't catch that — try again.", es: "No entendí eso — inténtalo de nuevo." },
};

// Navigation ("Opening the …").
export const NAV_SAY = {
  dashboard: { en: "Opening your dashboard.", es: "Abriendo tu inicio." },
  roster: { en: "Opening your roster.", es: "Abriendo tu plantilla." },
  messages: { en: "Opening your messages.", es: "Abriendo tus mensajes." },
  payments: { en: "Opening payments.", es: "Abriendo pagos." },
  attendance: { en: "Opening attendance.", es: "Abriendo asistencia." },
  calendar: { en: "Opening your calendar.", es: "Abriendo tu calendario." },
  drills: { en: "Opening the drill library.", es: "Abriendo la biblioteca de ejercicios." },
  classroom: { en: "Opening the classroom.", es: "Abriendo el aula." },
  tactics: { en: "Opening the tactics board.", es: "Abriendo el tablero táctico." },
  video: { en: "Opening video analysis.", es: "Abriendo el análisis de video." },
};

// Briefing greeting + closers (the Jarvis read-out).
export const BRIEF = {
  morning: { en: "Good morning, Coach.", es: "Buenos días, entrenador." },
  afternoon: { en: "Good afternoon, Coach.", es: "Buenas tardes, entrenador." },
  evening: { en: "Good evening, Coach.", es: "Buenas noches, entrenador." },
  hereIsYourDay: { en: "Here's what needs you today.", es: "Esto es lo que necesita tu atención hoy." },
  allCaught: { en: "You're all caught up. Nothing needs you right now.", es: "Estás al día. Nada requiere tu atención ahora." },
  thatsIt: { en: "That's everything for now.", es: "Eso es todo por ahora." },
  birthdayTomorrow: { en: "There's a birthday tomorrow.", es: "Hay un cumpleaños mañana." },
  trainingToday: { en: "You have training today.", es: "Tienes entrenamiento hoy." },
  matchToday: { en: "You have a match today.", es: "Tienes un partido hoy." },
};

// Count sentences — baked for counts 0..12 so numbers sound natural. Each is a
// function of n; the bake script expands COUNT_MAX variants of each.
export const COUNT_LINES = {
  paymentsDue: {
    en: (n) => n === 1 ? "One payment is due." : `${n} payments are due.`,
    es: (n) => n === 1 ? "Hay un pago pendiente." : `Hay ${n} pagos pendientes.`,
  },
  unseenPlayers: {
    en: (n) => n === 1 ? "One player hasn't heard from you this week." : `${n} players haven't heard from you this week.`,
    es: (n) => n === 1 ? "Un jugador no ha sabido de ti esta semana." : `${n} jugadores no han sabido de ti esta semana.`,
  },
  newParents: {
    en: (n) => n === 1 ? "One new parent joined — send them a welcome." : `${n} new parents joined — send them a welcome.`,
    es: (n) => n === 1 ? "Un nuevo padre se unió — envíale una bienvenida." : `${n} nuevos padres se unieron — envíales una bienvenida.`,
  },
  eventsThisWeek: {
    en: (n) => n === 1 ? "One event this week." : `${n} events this week.`,
    es: (n) => n === 1 ? "Un evento esta semana." : `${n} eventos esta semana.`,
  },
};

export const COUNT_MAX = 12; // bake count-sentence variants 0..12

// Every line the bake script must generate, tagged by language so each is baked
// in the right voice (EN → Mia EN voice, ES → Mia ES voice).
export function allBakedLines() {
  const out = [];
  const seen = new Set();
  const put = (text, lang) => { const k = lang + "|" + text; if (text && !seen.has(k)) { seen.add(k); out.push({ text, lang }); } };
  const add = (obj) => Object.values(obj).forEach((v) => { put(v.en, "en"); put(v.es, "es"); });
  add(CONFIRMS); add(NAV_SAY); add(BRIEF);
  for (const key of Object.keys(COUNT_LINES)) {
    for (let n = 0; n <= COUNT_MAX; n++) { put(COUNT_LINES[key].en(n), "en"); put(COUNT_LINES[key].es(n), "es"); }
  }
  return out;
}

// Compose an ordered briefing (array of text lines) from live dashboard data.
// Names are appended as their own line so they fall to device voice cleanly.
export function composeBriefing(data, lang = "en") {
  const L = (o) => (lang === "es" ? o.es : o.en);
  const CL = (key, n) => (lang === "es" ? COUNT_LINES[key].es(n) : COUNT_LINES[key].en(n));
  const hour = data.hour != null ? data.hour : 12;
  const lines = [L(hour < 12 ? BRIEF.morning : hour < 18 ? BRIEF.afternoon : BRIEF.evening)];

  const items = [];
  if (data.paymentsDue > 0) items.push(CL("paymentsDue", Math.min(data.paymentsDue, COUNT_MAX)));
  if (data.newParents > 0) items.push(CL("newParents", Math.min(data.newParents, COUNT_MAX)));
  if (data.unseenPlayers > 0) items.push(CL("unseenPlayers", Math.min(data.unseenPlayers, COUNT_MAX)));
  if (data.birthdayTomorrow) items.push(L(BRIEF.birthdayTomorrow)); // name shown on screen, not spoken (keeps every line a baked clip)
  if (data.eventToday === "match") items.push(L(BRIEF.matchToday));
  else if (data.eventToday === "training") items.push(L(BRIEF.trainingToday));

  if (!items.length) { lines.push(L(BRIEF.allCaught)); return lines; }
  lines.push(L(BRIEF.hereIsYourDay));
  lines.push(...items);
  lines.push(L(BRIEF.thatsIt));
  return lines;
}

export default { CONFIRMS, NAV_SAY, BRIEF, COUNT_LINES, COUNT_MAX, allBakedLines, composeBriefing };

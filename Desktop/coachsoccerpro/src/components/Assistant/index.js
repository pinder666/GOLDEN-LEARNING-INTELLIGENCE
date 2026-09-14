/**
 * THE ASSISTANT — one floating button on every page. Three jobs:
 *   1. Cheat sheet  — "how do I…" answered instantly from the app's own
 *                     How-To guides (local, zero API)
 *   2. Doer         — "take me to payments" navigates; "build me a U10
 *                     scanning drill" opens My Drills and builds it;
 *                     "remind me to bring bibs Thursday" saves a reminder
 *   3. Free-form    — anything else goes to Claude (creation-time only)
 * Reminders surface on the Dashboard — the coach's main scan page.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import VuiBox from "components/VuiBox";
import { useLang } from "useLang";
import { DEMOS } from "layouts/coach/demo";
import { askAssistant } from "services/assistantAI";
import { predictNext } from "services/habits";

// ── Reminders store (dashboard reads the same key) ──
export function loadReminders() {
  try { return JSON.parse(localStorage.getItem("csp_reminders") || "[]"); } catch { return []; }
}
function saveReminders(list) {
  localStorage.setItem("csp_reminders", JSON.stringify(list));
  window.dispatchEvent(new Event("csp-reminders-changed"));
}

// ── Local intent routing ──
const NAV_TARGETS = [
  { route: "/coach/dashboard", en: "Dashboard", es: "Inicio", keys: ["dashboard", "home", "inicio"] },
  { route: "/coach/roster", en: "Roster", es: "Plantilla", keys: ["roster", "plantilla", "players list", "jugadores"] },
  { route: "/coach/roster/add", en: "Add Player", es: "Agregar Jugador", keys: ["add player", "new player", "agregar jugador", "nuevo jugador"] },
  { route: "/coach/media", en: "Media", es: "Fotos y Videos", keys: ["media", "photos", "fotos"] },
  { route: "/coach/calendar", en: "Calendar", es: "Calendario", keys: ["calendar", "calendario", "schedule", "event"] },
  { route: "/coach/messages", en: "Messages", es: "Mensajes", keys: ["message", "mensaje"] },
  { route: "/coach/badges", en: "Badges", es: "Insignias", keys: ["badge", "insignia"] },
  { route: "/coach/prohabits", en: "Pro Habits", es: "Hábitos Pro", keys: ["habit", "hábito", "habito"] },
  { route: "/coach/leaderboard", en: "Leaderboard", es: "Tabla", keys: ["leaderboard", "tabla", "ranking"] },
  { route: "/coach/payments", en: "Payments", es: "Pagos", keys: ["payment", "pago", "dues", "cuota"] },
  { route: "/coach/drills", en: "Drill Library", es: "Ejercicios", keys: ["drill library", "library", "biblioteca", "ejercicios"] },
  { route: "/coach/mydrills", en: "My Drills", es: "Mis Ejercicios", keys: ["my drills", "mis ejercicios", "drill board", "pizarra"] },
  { route: "/coach/tactics", en: "Tactics Board", es: "Tablero Táctico", keys: ["tactic", "táctic", "tactica"] },
  { route: "/coach/session", en: "Session Planner", es: "Plan de Sesión", keys: ["session", "sesión", "sesion", "plan"] },
  { route: "/coach/checkmatch", en: "Checkmatch", es: "Checkmatch", keys: ["checkmatch"] },
  { route: "/coach/automation", en: "Automation", es: "Automatización", keys: ["automation", "automatiz"] },
  { route: "/coach/video", en: "Video Analysis", es: "Análisis de Video", keys: ["video", "analysis", "análisis", "analisis", "film"] },
  { route: "/coach/settings", en: "Settings", es: "Ajustes", keys: ["settings", "ajustes", "config"] },
];

const HOWTO_KEYS = {
  roster: ["roster", "player", "plantilla", "jugador", "invite", "invitar"],
  drills: ["drill", "ejercicio", "animation", "voice", "voz"],
  attendance: ["attendance", "asistencia", "present", "presente"],
  badges: ["badge", "insignia", "award", "otorgar"],
  payments: ["payment", "pago", "stripe", "dues", "cuota", "charge", "cobrar"],
  messages: ["message", "mensaje", "parent", "padre", "voice note", "nota de voz"],
  tactics: ["tactic", "táctic", "formation", "formación"],
  automation: ["automation", "automatiz", "reminder", "birthday", "cumpleaños"],
};

function detectIntent(raw, lang) {
  const q = raw.toLowerCase().trim();

  // Reminders
  if (/^(remind me|recu[eé]rdame|recordarme|reminder:?)/i.test(q)) {
    return { type: "add-reminder", text: raw.replace(/^(remind me( to)?|recu[eé]rdame|recordarme|reminder:?)\s*/i, "").trim() };
  }
  if (/(show|list|my|mis|ver).*(reminder|recordatorio)|^(reminders|recordatorios)$/i.test(q)) {
    return { type: "list-reminders" };
  }

  // Drill builder
  if (/(build|create|make|design|crea|haz|diseñ).*(drill|ejercicio)|(drill|ejercicio).*(for|para|de)/i.test(q) && q.length > 12) {
    return { type: "build-drill", prompt: raw };
  }

  // Navigation ("go to X", "open X", or just the page name)
  const goVerb = /(take me|go to|open|show me|ll[eé]vame|abre|abrir|ir a|mu[eé]strame)/i.test(q);
  for (const tgt of NAV_TARGETS) {
    if (tgt.keys.some((k) => q.includes(k))) {
      if (goVerb || q.split(" ").length <= 3) return { type: "navigate", target: tgt };
    }
  }

  // How-to (cheat sheet)
  if (/(how|cómo|como |c[oó]mo)/i.test(q) || /\?$/.test(q)) {
    let best = null;
    let bestScore = 0;
    for (const demo of DEMOS) {
      const keys = HOWTO_KEYS[demo.id] || [];
      const score = keys.filter((k) => q.includes(k)).length;
      if (score > bestScore) { bestScore = score; best = demo; }
    }
    if (best) return { type: "howto", demo: best };
  }

  return { type: "freeform" };
}

// ── UI ──
const S = {
  fab: {
    position: "fixed", right: 22, bottom: 22, zIndex: 1500,
    width: 58, height: 58, borderRadius: "50%",
    background: "linear-gradient(135deg, #0075FF 0%, #21d4fd 100%)",
    border: "none", cursor: "pointer", fontSize: 26,
    boxShadow: "0 6px 24px rgba(0,117,255,.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  panel: {
    position: "fixed", right: 22, bottom: 92, zIndex: 1500,
    width: "min(360px, calc(100vw - 44px))", height: "min(520px, calc(100vh - 140px))",
    background: "linear-gradient(160deg, #0d1440 0%, #0a0e23 100%)",
    border: "1px solid rgba(255,255,255,.12)", borderRadius: 16,
    display: "flex", flexDirection: "column", overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,.6)", fontFamily: "Inter,sans-serif",
  },
  msgUser: {
    alignSelf: "flex-end", background: "#0075FF", color: "#fff",
    borderRadius: "12px 12px 4px 12px", padding: "8px 12px",
    fontSize: 13, maxWidth: "85%", whiteSpace: "pre-wrap", lineHeight: 1.45,
  },
  msgBot: {
    alignSelf: "flex-start", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)",
    borderRadius: "12px 12px 12px 4px", padding: "8px 12px",
    fontSize: 13, maxWidth: "90%", whiteSpace: "pre-wrap", lineHeight: 1.5,
  },
  chip: {
    background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.75)",
    border: "1px solid rgba(255,255,255,.14)", borderRadius: 16,
    padding: "5px 11px", fontSize: 11, cursor: "pointer", fontFamily: "Inter,sans-serif",
  },
};

function Assistant() {
  const [lang] = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const listRef = useRef(null);

  const t = (en, es) => (lang === "es" ? es : en);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, open]);

  const bot = (text, extras = {}) => setMsgs((m) => [...m, { who: "bot", text, ...extras }]);

  const handle = async (raw) => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { who: "user", text }]);
    const intent = detectIntent(text, lang);

    if (intent.type === "navigate") {
      bot(t(`Taking you to ${intent.target.en} →`, `Te llevo a ${intent.target.es} →`));
      setTimeout(() => { navigate(intent.target.route); }, 350);
      return;
    }

    if (intent.type === "add-reminder") {
      const item = { id: Date.now(), text: intent.text || text, createdAt: new Date().toISOString(), done: false };
      saveReminders([item, ...loadReminders()]);
      bot(t(
        `📌 Saved: "${item.text}"\nIt's on your Dashboard so you'll see it.`,
        `📌 Guardado: "${item.text}"\nEstá en tu Inicio para que lo veas.`
      ));
      return;
    }

    if (intent.type === "list-reminders") {
      const list = loadReminders().filter((r) => !r.done);
      bot(list.length
        ? t("Your reminders:\n", "Tus recordatorios:\n") + list.map((r) => `• ${r.text}`).join("\n")
        : t("No reminders. Say \"remind me to…\" and I'll keep it.", "Sin recordatorios. Di \"recuérdame…\" y lo guardo."));
      return;
    }

    if (intent.type === "build-drill") {
      sessionStorage.setItem("csp_drill_prompt", intent.prompt);
      bot(t("On it — opening your board and building it… →", "Voy — abriendo tu pizarra y creándolo… →"));
      setTimeout(() => navigate("/coach/mydrills"), 400);
      return;
    }

    if (intent.type === "howto") {
      const d = intent.demo;
      const steps = d.steps.map((s, i) => `${i + 1}. ${lang === "es" ? s.es : s.en}`).join("\n");
      bot(`${lang === "es" ? d.titleEs : d.title}\n${steps}`, { goto: null });
      return;
    }

    // Free-form → Claude
    setBusy(true);
    try {
      const answer = await askAssistant(text, { page: location.pathname, lang });
      bot(answer);
    } catch {
      bot(t(
        "I couldn't reach the AI right now. Try the How To Use tab, or ask me to open a page / set a reminder — those always work.",
        "No pude conectar con la IA ahora. Prueba la pestaña Cómo Usar, o pídeme abrir una página / guardar un recordatorio — eso siempre funciona."
      ));
    } finally {
      setBusy(false);
    }
  };

  // THE LEARNING LAYER: predicted next actions from the coach's own rhythm
  // (same weekday + hour habits), then evergreen starters to fill the row.
  const predicted = predictNext(location.pathname, 3)
    .map((r) => NAV_TARGETS.find((tg) => tg.route === r))
    .filter(Boolean)
    .map((tg) => ({
      en: `Open ${tg.en}`, es: `Abre ${tg.es}`,
      predicted: true,
    }));
  const starters = [
    { en: "How do I take attendance?", es: "¿Cómo tomo asistencia?" },
    { en: "Remind me to bring bibs", es: "Recuérdame llevar petos" },
    { en: "Build a U10 scanning drill", es: "Crea un ejercicio de escaneo U10" },
    { en: "Open payments", es: "Abre pagos" },
  ];
  const chips = [...predicted, ...starters].slice(0, 5);

  return (
    <>
      {open && (
        <VuiBox sx={S.panel}>
          {/* Header */}
          <VuiBox sx={{
            padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.1)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>
              ⚡ {t("Assistant", "Asistente")}
            </span>
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", color: "rgba(255,255,255,.5)",
              fontSize: 18, cursor: "pointer",
            }}>✕</button>
          </VuiBox>

          {/* Messages */}
          <VuiBox ref={listRef} sx={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: "8px",
            scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
          }}>
            {!msgs.length && (
              <>
                <div style={S.msgBot}>
                  {t(
                    "Ask me anything — how to use a feature, open a page, build a drill, or say \"remind me to…\"",
                    "Pregúntame lo que sea — cómo usar una función, abrir una página, crear un ejercicio, o di \"recuérdame…\""
                  )}
                </div>
                <VuiBox display="flex" gap="6px" flexWrap="wrap" mt={0.5}>
                  {chips.map((c, i) => (
                    <button
                      key={i}
                      style={{
                        ...S.chip,
                        ...(c.predicted && {
                          border: "1px solid rgba(74,222,128,.45)",
                          color: "#4ade80",
                        }),
                      }}
                      onClick={() => handle(lang === "es" ? c.es : c.en)}
                    >
                      {c.predicted ? "✨ " : ""}{lang === "es" ? c.es : c.en}
                    </button>
                  ))}
                </VuiBox>
              </>
            )}
            {msgs.map((m, i) => (
              <div key={i} style={m.who === "user" ? S.msgUser : S.msgBot}>{m.text}</div>
            ))}
            {busy && <div style={{ ...S.msgBot, opacity: 0.6 }}>{t("Thinking…", "Pensando…")}</div>}
          </VuiBox>

          {/* Input */}
          <VuiBox sx={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,.1)", display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle(input)}
              placeholder={t("Ask or tell me…", "Pregunta o dime…")}
              style={{
                flex: 1, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13,
                fontFamily: "Inter,sans-serif", outline: "none",
              }}
            />
            <button onClick={() => handle(input)} disabled={busy || !input.trim()} style={{
              background: input.trim() ? "#0075FF" : "rgba(255,255,255,.1)",
              color: "#fff", border: "none", borderRadius: 10, padding: "0 16px",
              fontSize: 15, cursor: input.trim() ? "pointer" : "default",
            }}>➤</button>
          </VuiBox>
        </VuiBox>
      )}

      <button onClick={() => setOpen((o) => !o)} style={S.fab} title={t("Assistant", "Asistente")}>
        {open ? "✕" : "⚡"}
      </button>
    </>
  );
}

export default Assistant;

/**
 * MIA — the assistant. A real persona in the top navbar (a face, not a bare
 * mic). She runs on the LOCAL agent: no Claude, no API, no bill. She opens
 * pages, marks attendance, requests payments, saves notes, templates a parent
 * message (your words, sent via WhatsApp/SMS), and finds library drills — all
 * on-device. The ONLY thing she hands to Claude is generating a brand-new
 * drill (that runs on My Drills, the one paid area).
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import VuiBox from "components/VuiBox";
import { useLang } from "useLang";
import { DEMOS } from "layouts/coach/demo";
import miaBrain from "services/miaBrain";
import { interpret, templateMessage } from "services/localAgent";
import { CONFIRMS, NAV_SAY } from "services/miaLines";
import miaVoice from "services/miaVoice";
import agentFace from "assets/images/avatar4.png";

// Map a /coach/<x> route to the baked "Opening …" line, if she has one.
function navLine(route) {
  const key = (route || "").split("/").pop();
  return NAV_SAY[key] || null;
}

export const AGENT_EVENT = "csp-toggle-agent";
export const AGENT_NAME = "Mia";

// Reminders store — the local agent writes here; the Dashboard reads it.
export function loadReminders() {
  try { return JSON.parse(localStorage.getItem("csp_reminders") || "[]"); } catch (e) { return []; }
}

// How-to matching against the app's own guides (local, zero API).
const HOWTO_KEYS = {
  roster: ["roster", "player", "plantilla", "jugador", "invite"],
  drills: ["drill", "ejercicio", "animation", "voice"],
  attendance: ["attendance", "asistencia", "present", "presente"],
  badges: ["badge", "insignia", "award"],
  payments: ["payment", "pago", "dues", "charge", "cobrar"],
  messages: ["message", "mensaje", "parent", "padre"],
  tactics: ["tactic", "táctic", "formation"],
  videoanalysis: ["video", "film", "analy", "análisis", "penalty", "duel"],
  mydrills: ["board", "pizarra", "draw", "dibuj"],
};
function matchHowto(q) {
  const s = q.toLowerCase();
  let best = null, score = 0;
  for (const demo of DEMOS) {
    const hit = (HOWTO_KEYS[demo.id] || []).filter((k) => s.includes(k)).length;
    if (hit > score) { score = hit; best = demo; }
  }
  return best;
}

function getSpeech() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function Assistant() {
  const [lang] = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const listRef = useRef(null);
  const recRef = useRef(null);
  const handleRef = useRef(null);

  const t = (en, es) => (lang === "es" ? es : en);
  const speechOK = !!getSpeech();

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [msgs, open]);

  // Opened from Mia's face up in the navbar.
  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener(AGENT_EVENT, toggle);
    return () => window.removeEventListener(AGENT_EVENT, toggle);
  }, []);

  // ── The mic (browser speech — free, on-device) ──
  const stopListening = () => {
    setListening(false);
    if (recRef.current) { try { recRef.current.stop(); } catch (e) {} recRef.current = null; }
  };
  const startListening = () => {
    const SR = getSpeech();
    if (!SR) return;
    if (recRef.current) { stopListening(); return; }
    setOpen(true); setHeard("");
    const rec = new SR();
    rec.lang = lang === "es" ? "es-MX" : "en-US";
    rec.interimResults = true; rec.continuous = false;
    rec.onresult = (e) => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += seg; else interim += seg;
      }
      setHeard(final || interim);
      if (final.trim()) { stopListening(); setHeard(""); if (handleRef.current) handleRef.current(final.trim()); }
    };
    rec.onerror = () => stopListening();
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch (e) { stopListening(); }
  };
  useEffect(() => () => stopListening(), []);

  // ── Send a templated message from the coach's OWN app (Apple-safe) ──
  const sendWhatsApp = (text) => window.open("https://wa.me/?text=" + encodeURIComponent(text || ""), "_blank");
  const sendSMS = (text) => {
    const sep = /iPhone|iPad|Macintosh/i.test(navigator.userAgent) ? "&" : "?";
    window.location.href = "sms:" + sep + "body=" + encodeURIComponent(text || "");
  };
  const copyText = (text) => { try { navigator.clipboard.writeText(text || ""); } catch (e) {} };

  const bot = (text, extra = {}) => setMsgs((m) => [...m, { who: "bot", text, ...extra }]);
  // Mia speaks a baked confirmation line in her real voice (respects mute).
  const say = (lineObj) => { if (lineObj) miaVoice.speak(lang === "es" ? lineObj.es : lineObj.en, lang); };

  // ── Everything routes through the LOCAL agent. No Claude here. ──
  const handle = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { who: "user", text }]);
    miaBrain.observe(text, { page: location.pathname }); // she watches, learns the pattern, then predicts

    const r = interpret(text, lang);
    const reply = () => (lang === "es" ? r.replyEs : r.replyEn);

    switch (r.kind) {
      case "navigate":
        bot(reply());
        say(navLine(r.target.route) || CONFIRMS.onIt);
        setTimeout(() => navigate(r.target.route), 350);
        return;
      case "attendance":
        bot(reply());
        say(r.present ? CONFIRMS.present : CONFIRMS.absent);
        return;
      case "payment":
        bot(reply());
        say(CONFIRMS.paymentLogged);
        if (r.route) setTimeout(() => navigate(r.route), 700);
        return;
      case "reminder":
        bot(reply()); say(CONFIRMS.reminderSaved); return;
      case "note":
        bot(reply()); say(CONFIRMS.noteSaved); return;
      case "message": {
        const draft = templateMessage(r.recipient, r.note, "", lang);
        bot(reply());
        say(CONFIRMS.messageReady);
        setMsgs((m) => [...m, { who: "bot", id: Date.now(), text: draft, message: true }]);
        return;
      }
      case "find-drill":
        bot(reply());
        say(NAV_SAY.drills);
        setTimeout(() => navigate("/coach/drills"), 350);
        return;
      case "build-drill":            // the ONE Claude area — runs on My Drills
        sessionStorage.setItem("csp_drill_prompt", r.prompt);
        bot(reply());
        say(CONFIRMS.drillBuilding);
        setTimeout(() => navigate("/coach/mydrills"), 400);
        return;
      case "howto": {
        const d = matchHowto(r.query);
        if (d) {
          const steps = d.steps.map((s, i) => `${i + 1}. ${lang === "es" ? s.es : s.en}`).join("\n");
          bot(`${lang === "es" ? d.titleEs : d.title}\n${steps}`);
        } else {
          bot(t("Tell me the feature — attendance, drills, payments, messages…", "Dime la función — asistencia, ejercicios, pagos, mensajes…"));
        }
        return;
      }
      default:
        bot(reply());
        say(CONFIRMS.didntCatch);
    }
  };
  handleRef.current = handle;

  // Mia's suggestions = the coach's OWN learned routine first (what they've
  // actually done, most-likely now), then their frequent pages. Over time this
  // becomes their real workflow — no fixed "here's what I do" list.
  // Real learned predictions from her brain — nothing until she's observed
  // enough (she watches first). `brain.ready` gates the whole thing.
  const brain = miaBrain.predict(5);
  const chips = brain.items.map((it) => ({ en: it.label, es: it.label, learned: true, confidence: it.confidence }));

  return (
    <>
      {open && (
        <VuiBox sx={S.panel}>
          <VuiBox sx={S.header}>
            <VuiBox display="flex" alignItems="center" gap="8px">
              <img src={agentFace} alt={AGENT_NAME} style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "2px solid #f97316" }} />
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{AGENT_NAME}</span>
              <span style={{ color: "rgba(255,255,255,.4)", fontSize: 10 }}>{t("your assistant", "tu asistente")}</span>
            </VuiBox>
            <button onClick={() => setOpen(false)} style={S.x}>✕</button>
          </VuiBox>

          <VuiBox ref={listRef} sx={S.list}>
            {!msgs.length && (
              (brain.ready && chips.length) ? (
                <VuiBox display="flex" gap="6px" flexWrap="wrap">
                  {/* She's learned enough — these are HER predictions of your next move */}
                  {chips.map((c, i) => (
                    <button key={i} style={{ ...S.chip, border: "1px solid rgba(249,115,22,.45)", color: "#f97316" }}
                      onClick={() => handle(lang === "es" ? c.es : c.en)}>
                      ✨ {lang === "es" ? c.es : c.en}
                    </button>
                  ))}
                </VuiBox>
              ) : (
                // Still learning — honest card. She watches; the coach just does it.
                <VuiBox sx={{ background: "rgba(249,115,22,.08)", border: "1px solid rgba(249,115,22,.2)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ color: "#f97316", fontSize: 12, fontWeight: 800, fontFamily: "Inter,sans-serif", marginBottom: 4 }}>
                    {t("Learning how you work", "Aprendiendo cómo trabajas")}
                  </div>
                  <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12, lineHeight: 1.5, fontFamily: "Inter,sans-serif" }}>
                    {t("Just do what you do — tap the mic or type. Once I've seen your routine, I'll start predicting your next move.",
                       "Solo haz lo que haces — toca el micrófono o escribe. Cuando vea tu rutina, empezaré a predecir tu próximo paso.")}
                  </div>
                  <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,.1)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Math.round((brain.observed / brain.need) * 100))}%`, background: "#f97316" }} />
                  </div>
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10, marginTop: 4, fontFamily: "Inter,sans-serif" }}>
                    {t(`Learned ${brain.observed} of ${brain.need} to start predicting`, `Aprendido ${brain.observed} de ${brain.need} para empezar a predecir`)}
                  </div>
                </VuiBox>
              )
            )}
            {msgs.map((m, i) => (
              <div key={m.id || i} style={{ display: "flex", flexDirection: "column", alignItems: m.who === "user" ? "flex-end" : "flex-start", gap: 6 }}>
                <div style={m.who === "user" ? S.msgUser : S.msgBot}>{m.text}</div>
                {m.message && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => sendWhatsApp(m.text)} style={{ ...S.chip, background: "#25D366", color: "#000", fontWeight: 700 }}>WhatsApp</button>
                    <button onClick={() => sendSMS(m.text)} style={{ ...S.chip, background: "#f97316", color: "#000", fontWeight: 700 }}>{t("Text", "SMS")}</button>
                    <button onClick={() => copyText(m.text)} style={S.chip}>{t("Copy", "Copiar")}</button>
                  </div>
                )}
              </div>
            ))}
            {listening && <div style={{ ...S.msgUser, background: "#ef4444", opacity: 0.9 }}>🎙️ {heard || t("Listening…", "Escuchando…")}</div>}
          </VuiBox>

          <VuiBox sx={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,.1)", display: "flex", gap: "8px" }}>
            {speechOK && (
              <button onClick={startListening} title={t("Speak", "Habla")} style={{
                background: listening ? "#ef4444" : "rgba(255,255,255,.08)", color: "#fff", border: "none",
                borderRadius: 10, padding: "0 13px", fontSize: 16, cursor: "pointer", flexShrink: 0,
                animation: listening ? "cspPulse 1s infinite" : "none",
              }}>🎙️</button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle(input)}
              placeholder={t("Tell me or speak…", "Dime o habla…")}
              style={{ flex: 1, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif", outline: "none" }}
            />
            <button onClick={() => handle(input)} disabled={!input.trim()} style={{ background: input.trim() ? "#f97316" : "rgba(255,255,255,.1)", color: "#000", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 15, cursor: input.trim() ? "pointer" : "default" }}>➤</button>
          </VuiBox>
        </VuiBox>
      )}
      <style>{`@keyframes cspPulse{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}`}</style>
    </>
  );
}

const S = {
  panel: {
    position: "fixed", right: 22, top: 74, zIndex: 1500,
    width: "min(360px, calc(100vw - 44px))", height: "min(520px, calc(100vh - 120px))",
    background: "linear-gradient(160deg, #0d1440 0%, #0a0e23 100%)",
    border: "1px solid rgba(255,255,255,.12)", borderRadius: 16,
    display: "flex", flexDirection: "column", overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,.6)", fontFamily: "Inter,sans-serif",
  },
  header: { padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "space-between" },
  x: { background: "none", border: "none", color: "rgba(255,255,255,.5)", fontSize: 18, cursor: "pointer" },
  list: { flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } },
  msgUser: { alignSelf: "flex-end", background: "#f97316", color: "#000", borderRadius: "12px 12px 4px 12px", padding: "8px 12px", fontSize: 13, maxWidth: "85%", whiteSpace: "pre-wrap", lineHeight: 1.45, fontWeight: 600 },
  msgBot: { alignSelf: "flex-start", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", borderRadius: "12px 12px 12px 4px", padding: "8px 12px", fontSize: 13, maxWidth: "90%", whiteSpace: "pre-wrap", lineHeight: 1.5 },
  chip: { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.75)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: "5px 11px", fontSize: 11, cursor: "pointer", fontFamily: "Inter,sans-serif" },
};

export default Assistant;

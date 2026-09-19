/**
 * MIA BRIEFING — the Jarvis moment. When the coach opens the dashboard, Mia
 * greets him and reads what needs him TODAY in her real (baked) voice, then
 * shows predictive one-tap buttons to act. 100% local: the read-out is composed
 * from live data + baked clips, the buttons are rules + the habit predictor.
 * No AI, no bill. Fully language-piped (re-reads in the new voice on toggle).
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "useLang";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { composeBriefing } from "services/miaLines";
import miaVoice from "services/miaVoice";
import { predictNext } from "services/habits";
import { NAV_TARGETS } from "services/localAgent";
import agentFace from "assets/images/avatar4.png";

function welcomeQueueCount() {
  try { return JSON.parse(localStorage.getItem("csp_welcome_queue") || "[]").length; } catch { return 0; }
}

export default function MiaBriefing({ playersCount = 0, pendingPayments = 0, upcomingEvents = [], unseenCount = 0, birthday = null }) {
  const [lang] = useLang();
  const navigate = useNavigate();
  const [speaking, setSpeaking] = useState(false);
  const t = (en, es) => (lang === "es" ? es : en);

  // Is an event happening today?
  const eventToday = (() => {
    const e = upcomingEvents[0];
    if (!e || !e.date) return null;
    const d = new Date(e.date); const now = new Date();
    if (d.toDateString() !== now.toDateString()) return null;
    return /match|game|partido/i.test(e.type || e.title || "") ? "match" : "training";
  })();

  const data = {
    hour: new Date().getHours(),
    paymentsDue: pendingPayments,
    unseenPlayers: unseenCount,
    newParents: welcomeQueueCount(),
    birthdayTomorrow: !!(birthday && birthday.days != null && birthday.days <= 1),
    birthdayName: birthday && birthday.name,
    eventToday,
  };
  const lines = composeBriefing(data, lang);

  const speak = () => {
    setSpeaking(true);
    // force=true → an explicit tap always plays, even if the global mute is on.
    miaVoice.speakLines(lines, lang, () => setSpeaking(false), true);
  };
  const stopSpeak = () => { miaVoice.stop(); setSpeaking(false); };

  // Try to greet on open (browsers block audio before a gesture, so this only
  // fires where allowed — the text is always visible and the ▶ button plays it).
  // We DON'T flip the button to "stop" here, so the first tap always plays.
  useEffect(() => {
    const id = setTimeout(() => { miaVoice.speakLines(lines, lang, () => {}); }, 500);
    return () => { clearTimeout(id); miaVoice.stop(); };
  }, [lang]); // re-read on language flip only

  // Predictive one-tap actions — rules off the data + the habit predictor.
  const actions = [];
  if (pendingPayments > 0) actions.push({ label: t(`Chase ${pendingPayments} payment${pendingPayments > 1 ? "s" : ""}`, `Cobrar ${pendingPayments} pago${pendingPayments > 1 ? "s" : ""}`), go: "/coach/payments", hot: true });
  if (data.newParents > 0) actions.push({ label: t(`Welcome ${data.newParents} new parent${data.newParents > 1 ? "s" : ""}`, `Dar bienvenida a ${data.newParents}`), go: "/coach/messages", hot: true });
  if (data.birthdayTomorrow) actions.push({ label: t(`🎂 Birthday message`, `🎂 Mensaje de cumpleaños`), go: "/coach/messages", hot: true });
  if (unseenCount > 0) actions.push({ label: t(`Message a player`, `Mensaje a un jugador`), go: "/coach/messages" });
  if (eventToday) actions.push({ label: t(`Take attendance`, `Tomar asistencia`), go: "/coach/attendance" });
  // fill with the coach's own rhythm
  predictNext("/coach/dashboard", 3).forEach((route) => {
    const tg = NAV_TARGETS.find((x) => x.route === route);
    if (tg && actions.length < 5 && !actions.some((a) => a.go === route)) actions.push({ label: (lang === "es" ? "Abre " + tg.es : "Open " + tg.en), go: route, predicted: true });
  });

  return (
    <VuiBox mb={3} sx={{
      background: "linear-gradient(135deg, rgba(249,115,22,.12) 0%, rgba(13,20,64,.5) 60%)",
      border: "1px solid rgba(249,115,22,.25)", borderRadius: "16px", p: { xs: 2, md: 2.5 },
    }}>
      <VuiBox display="flex" alignItems="flex-start" gap="14px">
        <VuiBox sx={{ position: "relative", flexShrink: 0 }}>
          <img src={agentFace} alt="Mia" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #f97316", boxShadow: speaking ? "0 0 0 4px rgba(249,115,22,.3)" : "none", transition: "box-shadow .2s" }} />
          {speaking && <span style={{ position: "absolute", right: -2, bottom: -2, width: 16, height: 16, borderRadius: "50%", background: "#f97316", border: "2px solid #0a0e23", animation: "cspPulse 1s infinite" }} />}
        </VuiBox>
        <VuiBox flex={1} minWidth={0}>
          <VuiBox display="flex" alignItems="center" justifyContent="space-between">
            <VuiTypography variant="button" sx={{ color: "#f97316", fontWeight: 800, letterSpacing: ".02em" }}>Mia</VuiTypography>
            <button onClick={speaking ? stopSpeak : speak} title={t("Hear it", "Escuchar")} style={{
              background: speaking ? "rgba(239,68,68,.15)" : "rgba(249,115,22,.15)", color: speaking ? "#ef4444" : "#f97316",
              border: `1px solid ${speaking ? "rgba(239,68,68,.4)" : "rgba(249,115,22,.4)"}`, borderRadius: 20,
              padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
            }}>{speaking ? "■ " + t("Stop", "Parar") : "▶ " + t("Hear it", "Escuchar")}</button>
          </VuiBox>
          {/* The read-out (always visible; spoken in her real voice) */}
          <VuiBox mt={0.5}>
            {lines.map((l, i) => (
              <VuiTypography key={i} variant={i === 0 ? "h6" : "body2"} sx={{ color: i === 0 ? "#fff" : "rgba(255,255,255,.8)", fontWeight: i === 0 ? 700 : 400, lineHeight: 1.5 }}>
                {l}
              </VuiTypography>
            ))}
          </VuiBox>
          {/* Predictive one-tap actions */}
          {actions.length > 0 && (
            <VuiBox display="flex" gap="8px" flexWrap="wrap" mt={1.5}>
              {actions.slice(0, 5).map((a, i) => (
                <button key={i} onClick={() => navigate(a.go)} style={{
                  background: a.hot ? "#f97316" : a.predicted ? "rgba(249,115,22,.12)" : "rgba(255,255,255,.08)",
                  color: a.hot ? "#000" : a.predicted ? "#f97316" : "rgba(255,255,255,.85)",
                  border: `1px solid ${a.hot ? "transparent" : a.predicted ? "rgba(249,115,22,.4)" : "rgba(255,255,255,.14)"}`,
                  borderRadius: 20, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}>{a.predicted ? "✨ " : ""}{a.label}</button>
              ))}
            </VuiBox>
          )}
        </VuiBox>
      </VuiBox>
      <style>{`@keyframes cspPulse{0%{transform:scale(1)}50%{transform:scale(1.25);opacity:.6}100%{transform:scale(1)}}`}</style>
    </VuiBox>
  );
}

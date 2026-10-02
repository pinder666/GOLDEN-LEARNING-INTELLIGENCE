import { useState } from "react";
import { useLang } from "useLang";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAuth } from "context/AuthContext";
import { welcomeMessage, paymentReminder, eventReminder } from "services/localAgent";

const AUTOMATIONS = [
  {
    id: "welcome-new-parent",
    title: "Welcome New Parents",
    titleEs: "Bienvenida a Nuevos Padres",
    desc: "The moment a parent is added — by you or by a roster import — they get a warm welcome from you: who you are, what to expect, and that their child is in good hands. Nothing feels automated to them.",
    descEs: "En cuanto se agrega un padre — por ti o al importar la plantilla — recibe una bienvenida cálida de tu parte: quién eres, qué esperar, y que su hijo está en buenas manos. Nada les parece automático.",
    icon: "👋",
    color: "#4ade80",
    enabled: true,
    schedule: "When a parent is added",
  },
  {
    id: "birthday-messages",
    title: "Birthday Messages",
    titleEs: "Mensajes de Cumpleaños",
    desc: "On each player's birthday: parent receives a warm message from you automatically, and the player's card gets a birthday celebration. You get a reminder the day before.",
    descEs: "En el cumpleaños de cada jugador: el padre recibe automáticamente un mensaje cálido de tu parte, y la tarjeta del jugador se celebra. Recibes un recordatorio el día anterior.",
    icon: "🎂",
    color: "#f472b6",
    enabled: true,
    schedule: "Day before + birthday morning",
  },
  {
    id: "payment-reminder",
    title: "Payment Reminders",
    titleEs: "Recordatorios de Pago",
    desc: "Auto-send reminders to parents with unpaid dues. Triggers 3 days before due date, on due date, and 3 days after.",
    descEs: "Envía recordatorios automáticos a padres con pagos pendientes. Se activa 3 días antes, el día del vencimiento, y 3 días después.",
    icon: "💳",
    color: "#f97316",
    enabled: true,
    schedule: "3 days before, on due, 3 days after",
  },
  {
    id: "attendance-summary",
    title: "Weekly Attendance Summary",
    titleEs: "Resumen Semanal de Asistencia",
    desc: "Send coaches a summary every Monday: who attended, who missed, streaks at risk.",
    descEs: "Envía a los entrenadores un resumen cada lunes: quién asistió, quién faltó, rachas en riesgo.",
    icon: "📊",
    color: "#60a5fa",
    enabled: true,
    schedule: "Every Monday 8am",
  },
  {
    id: "parent-report",
    title: "Weekly Parent Report",
    titleEs: "Informe Semanal a Padres",
    desc: "Every Friday, parents receive: what their child worked on, badges earned, coach notes, next session info.",
    descEs: "Cada viernes, los padres reciben: qué trabajó su hijo, insignias ganadas, notas del entrenador, info de la próxima sesión.",
    icon: "📣",
    color: "#fbbf24",
    enabled: false,
    schedule: "Every Friday 5pm",
  },
  {
    id: "inactive-nudge",
    title: "Inactive Player Nudge",
    titleEs: "Recordatorio de Jugador Inactivo",
    desc: "Alert coaches when a player hasn't received feedback in 2 weeks. Suggest quick actions.",
    descEs: "Alerta a los entrenadores cuando un jugador no ha recibido retroalimentación en 2 semanas.",
    icon: "👋",
    color: "#a78bfa",
    enabled: true,
    schedule: "Daily check",
  },
  {
    id: "session-prep",
    title: "Session Prep Reminder",
    titleEs: "Recordatorio de Preparación",
    desc: "24 hours before a scheduled session, remind coach to prep: roster, drills, equipment checklist.",
    descEs: "24 horas antes de una sesión, recordar al entrenador: plantilla, ejercicios, lista de equipamiento.",
    icon: "⚡",
    color: "#f97316",
    enabled: true,
    schedule: "24h before session",
  },
  {
    id: "drill-suggestion",
    title: "AI Drill Suggestions",
    titleEs: "Sugerencias de Ejercicios IA",
    desc: "Based on recent session tags and player performance, suggest drills for next session.",
    descEs: "Basado en etiquetas recientes y rendimiento de jugadores, sugerir ejercicios para la próxima sesión.",
    icon: "🧠",
    color: "#f43f5e",
    enabled: false,
    schedule: "After each session",
  },
];

const SCHED_ES = {
  "When a parent is added": "Cuando se agrega un padre",
  "Day before + birthday morning": "Día antes + mañana del cumpleaños",
  "3 days before, on due, 3 days after": "3 días antes, el día del pago, 3 días después",
  "Every Monday 8am": "Cada lunes 8am",
  "Every Friday 5pm": "Cada viernes 5pm",
  "Daily check": "Revisión diaria",
  "24h before session": "24h antes de la sesión",
  "After each session": "Después de cada sesión",
};

function buildPreview(id, lang, coachName, teamName) {
  const coach = coachName || "Coach";
  const team = teamName || "your team";
  if (id === "welcome-new-parent")
    return welcomeMessage({ parent: "Alex Garcia", player: "Sofia", team, coach }, lang);
  if (id === "payment-reminder")
    return paymentReminder({ parent: "Alex Garcia", amount: "$79.97", what: "Monthly subscription", dueLabel: "the 1st" }, lang);
  if (id === "birthday-messages")
    return eventReminder({ parent: "Alex Garcia", title: "Sofia's 12th birthday", whenLabel: "today", place: "" }, lang);
  return null;
}

function Automation() {
  const [lang, setLang] = useLang();
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [preview, setPreview] = useState(null);
  const { userProfile } = useAuth();

  const coachName = userProfile?.first_name || userProfile?.display_name || "";
  const teamName = userProfile?.team_name || "";

  const t = (en, es) => lang === "es" ? es : en;

  const toggleAutomation = (id) => {
    setAutomations(prev => prev.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const openPreview = (auto) => {
    const msg = buildPreview(auto.id, lang, coachName, teamName);
    if (msg) {
      setPreview({ title: lang === "es" ? auto.titleEs : auto.title, text: msg });
    }
  };

  const enabledCount = automations.filter(a => a.enabled).length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <VuiBox mb={1} display="flex" justifyContent="space-between" alignItems="center">
          <VuiBox>
            <VuiTypography variant="h5" color="white" fontWeight="bold">
              {t("Automation", "Automatización")}
            </VuiTypography>
            <VuiTypography variant="caption" color="text">
              {t(`${enabledCount} of ${automations.length} automations active`, `${enabledCount} de ${automations.length} automatizaciones activas`)}
            </VuiTypography>
          </VuiBox>

          {/* Language toggle */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.08)", borderRadius: 20, padding: 3 }}>
            {["en", "es"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? "#f97316" : "transparent",
                color: lang === l ? "#000" : "rgba(255,255,255,.6)",
                border: "none", borderRadius: 18, padding: "4px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </VuiBox>

        {/* Automation grid */}
        <VuiBox sx={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px", alignContent: "start" }}>
          {automations.map(auto => (
            <VuiBox key={auto.id} sx={{
              background: "rgba(255,255,255,.04)",
              border: `1px solid ${auto.enabled ? auto.color + "40" : "rgba(255,255,255,.08)"}`,
              borderRadius: "12px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start">
                <VuiBox display="flex" alignItems="center" gap="10px">
                  <span style={{ fontSize: 24 }}>{auto.icon}</span>
                  <VuiBox>
                    <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block" }}>
                      {lang === "es" ? auto.titleEs : auto.title}
                    </VuiTypography>
                    <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.4)", fontSize: 10 }}>
                      {lang === "es" ? (SCHED_ES[auto.schedule] || auto.schedule) : auto.schedule}
                    </VuiTypography>
                  </VuiBox>
                </VuiBox>

                {/* Toggle */}
                <button onClick={() => toggleAutomation(auto.id)} style={{
                  width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                  background: auto.enabled ? auto.color : "rgba(255,255,255,.15)",
                  position: "relative", transition: "background .2s",
                }}>
                  <span style={{
                    position: "absolute", top: 3, left: auto.enabled ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#fff", transition: "left .2s",
                  }} />
                </button>
              </VuiBox>

              <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.6)", lineHeight: 1.5, fontSize: 11 }}>
                {lang === "es" ? auto.descEs : auto.desc}
              </VuiTypography>

              {auto.enabled && (
                <VuiBox display="flex" gap="6px" mt={0.5}>
                  <button
                    onClick={() => openPreview(auto)}
                    style={{
                      background: buildPreview(auto.id, lang, coachName, teamName) ? "rgba(249,115,22,.15)" : "rgba(255,255,255,.08)",
                      border: buildPreview(auto.id, lang, coachName, teamName) ? "1px solid rgba(249,115,22,.3)" : "none",
                      borderRadius: 6, padding: "5px 10px",
                      color: buildPreview(auto.id, lang, coachName, teamName) ? "#f97316" : "rgba(255,255,255,.7)",
                      fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif",
                    }}
                  >
                    {t("Preview Message", "Ver Mensaje")}
                  </button>
                  <button style={{
                    background: "rgba(255,255,255,.08)", border: "none", borderRadius: 6,
                    padding: "5px 10px", color: "rgba(255,255,255,.7)", fontSize: 10,
                    fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif",
                  }}>
                    {t("View History", "Ver Historial")}
                  </button>
                </VuiBox>
              )}
            </VuiBox>
          ))}
        </VuiBox>

        {/* Bottom info */}
        <VuiBox mt={1} sx={{
          background: "rgba(249,115,22,.06)",
          border: "1px solid rgba(249,115,22,.15)",
          borderRadius: "10px",
          padding: "10px 14px",
        }}>
          <VuiTypography variant="caption" sx={{ color: "#f97316", fontSize: 11 }}>
            {t(
              "Automations run in the background. You'll be notified when actions are taken. All messages are sent from your coach profile.",
              "Las automatizaciones se ejecutan en segundo plano. Serás notificado cuando se tomen acciones. Todos los mensajes se envían desde tu perfil de entrenador."
            )}
          </VuiTypography>
        </VuiBox>

      </VuiBox>

      {/* Template preview panel */}
      {preview && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300,
        }} onClick={() => setPreview(null)}>
          <div style={{
            background: "#1a1a2e", border: "1px solid rgba(249,115,22,.3)",
            borderRadius: 14, padding: "24px 28px", maxWidth: 480, width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,.6)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "Inter,sans-serif" }}>
                {preview.title}
              </span>
              <button onClick={() => setPreview(null)} style={{
                background: "none", border: "none", color: "rgba(255,255,255,.5)",
                fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0,
              }}>×</button>
            </div>
            <div style={{
              background: "rgba(255,255,255,.06)", borderRadius: 10,
              padding: "14px 16px", whiteSpace: "pre-wrap",
              color: "rgba(255,255,255,.85)", fontSize: 13, lineHeight: 1.65,
              fontFamily: "Inter,sans-serif",
            }}>
              {preview.text}
            </div>
            <p style={{ color: "rgba(255,255,255,.35)", fontSize: 10, marginTop: 12, fontFamily: "Inter,sans-serif" }}>
              {t("Sample message — real names + details filled at send time.", "Mensaje de muestra — nombres y datos reales se completan al enviar.")}
            </p>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default Automation;

import { useState } from "react";
import { useLang } from "useLang";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

const DEMOS = [
  {
    id: "roster",
    title: "Managing Your Roster",
    titleEs: "Gestionar Tu Plantilla",
    duration: "2 min",
    icon: "👥",
    color: "#4ade80",
    steps: [
      { en: "Go to Roster tab", es: "Ve a la pestaña Plantilla" },
      { en: "Click 'Add Player' to add a new player", es: "Haz clic en 'Agregar Jugador'" },
      { en: "Enter player name, parent email, and age group", es: "Ingresa nombre, email del padre, y grupo de edad" },
      { en: "Parent receives invite to download the app", es: "El padre recibe invitación para descargar la app" },
    ],
  },
  {
    id: "drills",
    title: "Using the Drill Library",
    titleEs: "Usar la Biblioteca de Ejercicios",
    duration: "3 min",
    icon: "⚽",
    color: "#60a5fa",
    steps: [
      { en: "Go to Drill Library tab", es: "Ve a la pestaña Ejercicios" },
      { en: "Filter by category or age group", es: "Filtra por categoría o grupo de edad" },
      { en: "Click any drill to see the animation", es: "Haz clic en cualquier ejercicio para ver la animación" },
      { en: "Voice explains the drill automatically", es: "La voz explica el ejercicio automáticamente" },
      { en: "Use 'Parent Message' to copy text for parents", es: "Usa 'Mensaje a Padres' para copiar texto" },
    ],
  },
  {
    id: "attendance",
    title: "Taking Attendance",
    titleEs: "Tomar Asistencia",
    duration: "1 min",
    icon: "✅",
    color: "#fbbf24",
    steps: [
      { en: "Go to Calendar tab", es: "Ve a la pestaña Calendario" },
      { en: "Click on today's session", es: "Haz clic en la sesión de hoy" },
      { en: "Tap each player to mark Present/Absent", es: "Toca cada jugador para marcar Presente/Ausente" },
      { en: "Attendance is saved automatically", es: "La asistencia se guarda automáticamente" },
    ],
  },
  {
    id: "badges",
    title: "Awarding Badges",
    titleEs: "Otorgar Insignias",
    duration: "2 min",
    icon: "🏅",
    color: "#a78bfa",
    steps: [
      { en: "Go to Badges tab", es: "Ve a la pestaña Insignias" },
      { en: "Browse 50+ pre-built badges", es: "Explora más de 50 insignias prediseñadas" },
      { en: "Click a badge, then select players to award", es: "Haz clic en una insignia, luego selecciona jugadores" },
      { en: "Players see badges instantly on their card", es: "Los jugadores ven las insignias en su tarjeta" },
    ],
  },
  {
    id: "payments",
    title: "Requesting Payments",
    titleEs: "Solicitar Pagos",
    duration: "2 min",
    icon: "💳",
    color: "#f97316",
    steps: [
      { en: "Go to Payments tab", es: "Ve a la pestaña Pagos" },
      { en: "Click 'New Payment Request'", es: "Haz clic en 'Nueva Solicitud de Pago'" },
      { en: "Set amount, due date, and description", es: "Establece monto, fecha límite y descripción" },
      { en: "Parents receive notification and can pay via Stripe", es: "Los padres reciben notificación y pagan vía Stripe" },
    ],
  },
  {
    id: "messages",
    title: "Voice-to-Message",
    titleEs: "Voz a Mensaje",
    duration: "1 min",
    icon: "🎤",
    color: "#f43f5e",
    steps: [
      { en: "Go to Messages tab", es: "Ve a la pestaña Mensajes" },
      { en: "Hold the mic button and speak", es: "Mantén presionado el micrófono y habla" },
      { en: "AI polishes your message professionally", es: "La IA pule tu mensaje profesionalmente" },
      { en: "Review and send to parents", es: "Revisa y envía a los padres" },
    ],
  },
  {
    id: "tactics",
    title: "Tactics Board",
    titleEs: "Tablero Táctico",
    duration: "3 min",
    icon: "📋",
    color: "#22d3ee",
    steps: [
      { en: "Go to Tactics Board tab", es: "Ve a la pestaña Tablero Táctico" },
      { en: "Choose a formation or start blank", es: "Elige una formación o empieza en blanco" },
      { en: "Drag players to position them", es: "Arrastra jugadores para posicionarlos" },
      { en: "Draw arrows for movement patterns", es: "Dibuja flechas para patrones de movimiento" },
      { en: "Save and share with your team", es: "Guarda y comparte con tu equipo" },
    ],
  },
  {
    id: "automation",
    title: "Setting Up Automation",
    titleEs: "Configurar Automatización",
    duration: "2 min",
    icon: "⚙️",
    color: "#84cc16",
    steps: [
      { en: "Go to Automation tab", es: "Ve a la pestaña Automatización" },
      { en: "Toggle on the automations you want", es: "Activa las automatizaciones que quieras" },
      { en: "Payment reminders, parent reports, nudges run automatically", es: "Recordatorios de pago, informes a padres se ejecutan automáticamente" },
      { en: "You're notified when actions are taken", es: "Recibes notificación cuando se toman acciones" },
    ],
  },
];

function Demo() {
  const [lang, setLang] = useLang();
  const [activeDemo, setActiveDemo] = useState(null);

  const t = (en, es) => lang === "es" ? es : en;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <VuiBox mb={1} display="flex" justifyContent="space-between" alignItems="center">
          <VuiBox>
            <VuiTypography variant="h5" color="white" fontWeight="bold">
              {t("How to Use CoachSoccerPro", "Cómo Usar CoachSoccerPro")}
            </VuiTypography>
            <VuiTypography variant="caption" color="text">
              {t("Quick guides for every feature", "Guías rápidas para cada función")}
            </VuiTypography>
          </VuiBox>

          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.08)", borderRadius: 20, padding: 3 }}>
            {["en", "es"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? "#4ade80" : "transparent",
                color: lang === l ? "#000" : "rgba(255,255,255,.6)",
                border: "none", borderRadius: 18, padding: "4px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </VuiBox>

        {/* Demo grid */}
        <VuiBox sx={{ flex: 1, overflow: "hidden", display: "flex", gap: "12px" }}>

          {/* Demo list */}
          <VuiBox sx={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden" }}>
            {DEMOS.map(demo => (
              <button key={demo.id} onClick={() => setActiveDemo(demo.id === activeDemo ? null : demo.id)} style={{
                background: activeDemo === demo.id ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.04)",
                border: `1px solid ${activeDemo === demo.id ? demo.color + "60" : "rgba(255,255,255,.08)"}`,
                borderRadius: 10, padding: "12px 14px",
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{demo.icon}</span>
                <VuiBox sx={{ flex: 1 }}>
                  <VuiTypography variant="button" sx={{ color: "#fff", fontWeight: 700, display: "block", fontSize: 12 }}>
                    {lang === "es" ? demo.titleEs : demo.title}
                  </VuiTypography>
                  <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.4)", fontSize: 10 }}>
                    {demo.duration}
                  </VuiTypography>
                </VuiBox>
                <span style={{ color: demo.color, fontSize: 16 }}>{activeDemo === demo.id ? "▼" : "▶"}</span>
              </button>
            ))}
          </VuiBox>

          {/* Steps panel */}
          <VuiBox sx={{ flex: 1, background: "rgba(255,255,255,.04)", borderRadius: "12px", padding: "16px 20px", overflow: "hidden" }}>
            {activeDemo ? (
              (() => {
                const demo = DEMOS.find(d => d.id === activeDemo);
                return (
                  <VuiBox>
                    <VuiBox display="flex" alignItems="center" gap="12px" mb={2}>
                      <span style={{ fontSize: 32 }}>{demo.icon}</span>
                      <VuiBox>
                        <VuiTypography variant="h6" color="white" fontWeight="bold">
                          {lang === "es" ? demo.titleEs : demo.title}
                        </VuiTypography>
                        <VuiTypography variant="caption" sx={{ color: demo.color }}>
                          {demo.duration} {t("walkthrough", "tutorial")}
                        </VuiTypography>
                      </VuiBox>
                    </VuiBox>

                    <VuiBox sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {demo.steps.map((step, i) => (
                        <VuiBox key={i} sx={{
                          display: "flex", alignItems: "flex-start", gap: "12px",
                          background: "rgba(0,0,0,.2)", borderRadius: "8px", padding: "12px 14px",
                        }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: demo.color, color: "#000",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 800, flexShrink: 0,
                          }}>
                            {i + 1}
                          </span>
                          <VuiTypography variant="button" sx={{ color: "rgba(255,255,255,.85)", fontWeight: 500, lineHeight: 1.5 }}>
                            {lang === "es" ? step.es : step.en}
                          </VuiTypography>
                        </VuiBox>
                      ))}
                    </VuiBox>
                  </VuiBox>
                );
              })()
            ) : (
              <VuiBox sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: 48, opacity: 0.3 }}>👈</span>
                <VuiTypography variant="button" sx={{ color: "rgba(255,255,255,.4)" }}>
                  {t("Select a guide to get started", "Selecciona una guía para comenzar")}
                </VuiTypography>
              </VuiBox>
            )}
          </VuiBox>

        </VuiBox>

      </VuiBox>
    </DashboardLayout>
  );
}

export default Demo;

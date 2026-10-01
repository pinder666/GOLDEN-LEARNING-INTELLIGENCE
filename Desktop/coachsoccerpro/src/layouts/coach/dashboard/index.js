import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";

// Icons
import { IoCalendar } from "react-icons/io5";
import { BsFillPeopleFill } from "react-icons/bs";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

// Assistant reminders (saved via "remind me to…")
import { loadReminders } from "components/Assistant";
import MiaBriefing from "components/MiaBriefing";

const DEMO_MODE = false;

const DEMO_BIRTHDAYS = [
  { id: 1, first_name: "Sofia", last_name: "Garcia", days_until: 2, turning: 12 },
  { id: 2, first_name: "Marcus", last_name: "Johnson", days_until: 7, turning: 12 },
];

const DEMO_DATA = {
  userProfile: { first_name: "Coach" },
  teamData: { name: "Thunder FC", age_group: "U12" },
  players: Array.from({ length: 18 }, (_, i) => ({ id: i, first_name: `Player ${i + 1}` })),
  upcomingEvents: [
    { id: 1, title: "Practice", event_type: "practice", start_time: new Date(Date.now() + 86400000).toISOString(), location_name: "Main Field" },
    { id: 2, title: "Game vs Eagles", event_type: "game", start_time: new Date(Date.now() + 172800000).toISOString(), location_name: "Stadium" },
  ],
  pendingPayments: 3,
  aiInsight: "3 players haven't received feedback in 2+ weeks: Marcus, Sofia, Emma...",
};

function CoachDashboard() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const navigate = useNavigate();
  const { userProfile: authUserProfile, teamData: authTeamData, loading: authLoading } = useAuth();

  const userProfile = DEMO_MODE ? DEMO_DATA.userProfile : authUserProfile;
  const teamData = DEMO_MODE ? DEMO_DATA.teamData : authTeamData;

  const [players, setPlayers] = useState(DEMO_MODE ? DEMO_DATA.players : []);
  const [upcomingEvents, setUpcomingEvents] = useState(DEMO_MODE ? DEMO_DATA.upcomingEvents : []);
  const [pendingPayments, setPendingPayments] = useState(DEMO_MODE ? DEMO_DATA.pendingPayments : 0);
  const [loading, setLoading] = useState(DEMO_MODE ? false : true);
  const [aiInsight, setAiInsight] = useState(DEMO_MODE ? DEMO_DATA.aiInsight : "");
  const [reminders, setReminders] = useState(loadReminders);
  const [unseenCount, setUnseenCount] = useState(DEMO_MODE ? 3 : 0);

  useEffect(() => {
    const refresh = () => setReminders(loadReminders());
    window.addEventListener("csp-reminders-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("csp-reminders-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const toggleReminder = (id) => {
    const next = loadReminders().map((r) => (r.id === id ? { ...r, done: !r.done } : r));
    localStorage.setItem("csp_reminders", JSON.stringify(next));
    setReminders(next);
  };

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id) {
      fetchDashboardData();
    }
  }, [teamData]);

  const fetchDashboardData = async () => {
    try {
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamData.id)
        .order("first_name");
      setPlayers(playersData || []);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("team_id", teamData.id)
        .gte("start_time", new Date().toISOString())
        .lte("start_time", nextWeek.toISOString())
        .order("start_time")
        .limit(5);
      setUpcomingEvents(eventsData || []);

      const { count } = await supabase
        .from("player_payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingPayments(count || 0);

      generateInsight(playersData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async (playersData) => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: recentNotes } = await supabase
      .from("development_notes")
      .select("player_id")
      .gte("created_at", twoWeeksAgo.toISOString());

    const playersWithNotes = new Set(recentNotes?.map((n) => n.player_id) || []);
    const playersWithoutNotes = playersData.filter((p) => !playersWithNotes.has(p.id));
    setUnseenCount(playersWithoutNotes.length);

    if (playersWithoutNotes.length > 0) {
      const names = playersWithoutNotes.slice(0, 3).map((p) => p.first_name).join(", ");
      setAiInsight(
        language === "es"
          ? `${playersWithoutNotes.length} jugadores sin feedback en 2+ semanas: ${names}...`
          : `${playersWithoutNotes.length} players without feedback in 2+ weeks: ${names}...`
      );
    } else {
      setAiInsight(
        language === "es"
          ? "¡Todos los jugadores están al día!"
          : "All players are up to date!"
      );
    }
  };

  const getNextEventInfo = () => {
    if (upcomingEvents.length === 0) return null;
    const event = upcomingEvents[0];
    const date = new Date(event.start_time);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr;
    if (date.toDateString() === today.toDateString()) {
      dateStr = language === "es" ? "Hoy" : "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateStr = language === "es" ? "Mañana" : "Tomorrow";
    } else {
      dateStr = date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    return {
      title: event.title,
      time: `${dateStr} @ ${date.toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`,
      type: event.event_type,
      location: event.location_name,
    };
  };

  const nextEvent = getNextEventInfo();

  if (!DEMO_MODE && (authLoading || loading)) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <VuiBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <VuiTypography color="white">{t("common:status.loading")}</VuiTypography>
        </VuiBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Welcome Header — the ONE mic lives in the top navbar (the agent). */}
        <VuiBox mb={2} display="flex" justifyContent="space-between" alignItems="flex-start">
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              {language === "es" ? "Bienvenido" : "Welcome back"}, {userProfile?.first_name || "Coach"}!
            </VuiTypography>
            <VuiTypography variant="body2" color="text">
              {teamData?.name} • {teamData?.age_group}
            </VuiTypography>
          </VuiBox>
        </VuiBox>

        {/* Mia's briefing — reads what needs you today, in her real voice */}
        <MiaBriefing
          playersCount={players.length}
          pendingPayments={pendingPayments}
          upcomingEvents={upcomingEvents}
          unseenCount={unseenCount}
        />

        {/* Stats Row - 3 equal cards */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}>
            <MiniStatisticsCard
              title={{ text: language === "es" ? "Jugadores" : "Players", fontWeight: "bold" }}
              count={players.length}
              icon={{ color: "info", component: <BsFillPeopleFill size="22px" color="white" /> }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MiniStatisticsCard
              title={{ text: language === "es" ? "Eventos Esta Semana" : "Events This Week", fontWeight: "bold" }}
              count={upcomingEvents.length}
              icon={{ color: "info", component: <IoCalendar size="22px" color="white" /> }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MiniStatisticsCard
              title={{ text: language === "es" ? "Pagos Pendientes" : "Pending Payments", fontWeight: "bold" }}
              count={pendingPayments}
              icon={{ color: "info", component: <Icon>payments</Icon> }}
            />
          </Grid>
        </Grid>

        {/* Main Content - 2 equal columns */}
        <Grid container spacing={2} sx={{ flex: 1, overflow: "hidden" }}>
          {/* Left Column */}
          <Grid item xs={12} lg={6} sx={{ display: "flex", flexDirection: "column" }}>
            {/* Next Event */}
            <Card sx={{ mb: 2 }}>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" fontWeight="bold" mb={2}>
                  {language === "es" ? "Próximo Evento" : "Next Event"}
                </VuiTypography>
                {nextEvent ? (
                  <VuiBox
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      background: nextEvent.type === "game"
                        ? "rgba(245, 54, 92, 0.15)"
                        : "rgba(45, 206, 137, 0.15)",
                    }}
                  >
                    <VuiBox display="flex" alignItems="center">
                      <VuiBox sx={{ fontSize: "28px", mr: 2 }}>
                        {nextEvent.type === "game" ? "⚽" : "🏃"}
                      </VuiBox>
                      <VuiBox>
                        <VuiTypography variant="button" color="white" fontWeight="bold">
                          {nextEvent.title}
                        </VuiTypography>
                        <VuiTypography variant="caption" color="text" display="block">
                          {nextEvent.time}
                        </VuiTypography>
                        {nextEvent.location && (
                          <VuiTypography variant="caption" color="text">
                            📍 {nextEvent.location}
                          </VuiTypography>
                        )}
                      </VuiBox>
                    </VuiBox>
                  </VuiBox>
                ) : (
                  <VuiTypography variant="body2" color="text">
                    {language === "es" ? "Sin eventos programados" : "No events scheduled"}
                  </VuiTypography>
                )}
              </VuiBox>
            </Card>

            {/* AI Insight */}
            <Card sx={{ flex: 1 }}>
              <VuiBox p={3}>
                <VuiBox display="flex" alignItems="center" mb={2}>
                  <VuiBox
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #7928CA 0%, #FF0080 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 1.5,
                      fontSize: "14px",
                    }}
                  >
                    🤖
                  </VuiBox>
                  <VuiTypography variant="h6" color="white" fontWeight="bold">
                    {language === "es" ? "Asistente AI" : "AI Assistant"}
                  </VuiTypography>
                </VuiBox>
                <VuiTypography variant="body2" color="text">
                  {DEMO_MODE || aiInsight === DEMO_DATA.aiInsight || !aiInsight
                    ? (language === "es" ? "¡Todos los jugadores están al día!" : "All players are up to date!")
                    : aiInsight}
                </VuiTypography>
                <VuiButton
                  color="info"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => navigate("/coach/messages")}
                >
                  {language === "es" ? "Enviar Mensaje" : "Send Message"}
                </VuiButton>

                {/* Upcoming Birthdays */}
                {DEMO_BIRTHDAYS.length > 0 && (
                  <VuiBox mt={3} pt={2} sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
                      🎂 {language === "es" ? "Próximos Cumpleaños" : "Upcoming Birthdays"}
                    </VuiTypography>
                    {DEMO_BIRTHDAYS.map((b) => (
                      <VuiBox
                        key={b.id}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ py: 0.75 }}
                      >
                        <VuiTypography variant="caption" color="white">
                          {b.first_name} {b.last_name.charAt(0)}. {language === "es" ? "cumple" : "turns"} {b.turning}
                        </VuiTypography>
                        <VuiTypography variant="caption" sx={{ color: b.days_until <= 2 ? "#f472b6" : "rgba(255,255,255,0.5)" }}>
                          {b.days_until === 0
                            ? (language === "es" ? "¡HOY!" : "TODAY!")
                            : language === "es"
                            ? `en ${b.days_until} días`
                            : `in ${b.days_until} days`}
                        </VuiTypography>
                      </VuiBox>
                    ))}
                    <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: 0.5, fontSize: 10 }}>
                      {language === "es"
                        ? "Mensaje automático activado — se envía la mañana del cumpleaños"
                        : "Auto-message is on — sends the morning of the birthday"}
                    </VuiTypography>
                  </VuiBox>
                )}

                {/* Reminders the coach saved through the Assistant */}
                {reminders.filter((r) => !r.done).length > 0 && (
                  <VuiBox mt={2} pt={2} sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
                      📌 {language === "es" ? "Recordatorios" : "Reminders"}
                    </VuiTypography>
                    {reminders.filter((r) => !r.done).slice(0, 5).map((r) => (
                      <VuiBox key={r.id} display="flex" alignItems="center" gap="8px" sx={{ py: 0.5 }}>
                        <button
                          onClick={() => toggleReminder(r.id)}
                          title={language === "es" ? "Hecho" : "Done"}
                          style={{
                            width: 18, height: 18, borderRadius: 5, cursor: "pointer",
                            background: "transparent", border: "2px solid rgba(74,222,128,.6)",
                            flexShrink: 0,
                          }}
                        />
                        <VuiTypography variant="caption" color="white">
                          {r.text}
                        </VuiTypography>
                      </VuiBox>
                    ))}
                  </VuiBox>
                )}
              </VuiBox>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={6} sx={{ display: "flex", flexDirection: "column" }}>
            {/* Quick Actions */}
            <Card sx={{ flex: 1 }}>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" fontWeight="bold" mb={2}>
                  {language === "es" ? "Acciones Rápidas" : "Quick Actions"}
                </VuiTypography>
                <Grid container spacing={2}>
                  {[
                    { icon: "💬", label: language === "es" ? "Mensaje" : "Message", route: "/coach/messages", color: "#0075FF" },
                    { icon: "📋", label: language === "es" ? "Asistencia" : "Attendance", route: "/coach/calendar", color: "#2dce89" },
                    { icon: "🏅", label: language === "es" ? "Insignias" : "Badges", route: "/coach/badges", color: "#fb6340" },
                    { icon: "👥", label: language === "es" ? "Plantilla" : "Roster", route: "/coach/roster", color: "#7928CA" },
                    { icon: "📅", label: language === "es" ? "Calendario" : "Calendar", route: "/coach/calendar", color: "#f5365c" },
                    { icon: "💳", label: language === "es" ? "Pagos" : "Payments", route: "/coach/payments", color: "#11cdef" },
                  ].map((action, i) => (
                    <Grid item xs={4} key={i}>
                      <VuiBox
                        onClick={() => navigate(action.route)}
                        sx={{
                          p: 2,
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.05)",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            background: "rgba(255,255,255,0.1)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <VuiBox sx={{ fontSize: "24px", mb: 1 }}>{action.icon}</VuiBox>
                        <VuiTypography variant="caption" color="white" fontWeight="medium">
                          {action.label}
                        </VuiTypography>
                      </VuiBox>
                    </Grid>
                  ))}
                </Grid>
              </VuiBox>
            </Card>
          </Grid>
        </Grid>

{/* Footer removed — dashboard fits one screen, no scroll */}
      </VuiBox>
    </DashboardLayout>
  );
}

export default CoachDashboard;

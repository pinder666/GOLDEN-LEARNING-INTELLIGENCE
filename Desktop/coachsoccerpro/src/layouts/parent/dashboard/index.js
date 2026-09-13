import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Custom components
import PlayerCard from "components/PlayerCard";

// Icons
import { IoCalendar, IoChatbubbles, IoCard, IoTrophy } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

// Demo avatar
import demoAvatar from "assets/images/avatar4.png";

import { DEV_MODE } from "devMode";

const DEMO_CHILD = {
  id: 1,
  first_name: "Marcus",
  last_name: "Johnson",
  jersey_number: 10,
  position: "Midfielder",
  total_points: 450,
  card_frame: "gold",
  attendance_streak: 12,
  avatar_url: demoAvatar,
  date_of_birth: "2014-09-20",
  badges: [
    { id: 1, created_at: "2026-09-10", badge: { icon: "⭐", name_en: "5 Sessions", name_es: "5 Sesiones" } },
    { id: 2, created_at: "2026-09-08", badge: { icon: "⚽", name_en: "First Goal", name_es: "Primer Gol" } },
    { id: 3, created_at: "2026-09-05", badge: { icon: "🤝", name_en: "Team Player", name_es: "Jugador de Equipo" } },
    { id: 4, created_at: "2026-09-01", badge: { icon: "🔥", name_en: "Perfect Week", name_es: "Semana Perfecta" } },
  ],
};

const DEMO_TEAM = { id: 1, name: "Thunder FC", age_group: "U12" };

const DEMO_EVENTS = [
  { id: 1, title: "Practice", event_type: "practice", start_time: new Date(Date.now() + 86400000).toISOString() },
  { id: 2, title: "Game vs Eagles", event_type: "game", start_time: new Date(Date.now() + 259200000).toISOString() },
  { id: 3, title: "Skills Session", event_type: "practice", start_time: new Date(Date.now() + 432000000).toISOString() },
];

const DEMO_PAYMENTS = [
  { id: 1, amount_due: 75, status: "pending", payment_request: { description: "September dues" } },
];

function ParentDashboard() {
  const { t, i18n } = useTranslation(["common", "parent"]);
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [child, setChild] = useState(null);
  const [team, setTeam] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentBadges, setRecentBadges] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setChild(DEMO_CHILD);
      setTeam(DEMO_TEAM);
      setUpcomingEvents(DEMO_EVENTS);
      setRecentBadges(DEMO_CHILD.badges);
      setUnreadMessages(2);
      setPendingPayments(DEMO_PAYMENTS);
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchParentData();
    }
  }, [user]);

  const fetchParentData = async () => {
    try {
      // Get parent record
      const { data: parentData, error: parentError } = await supabase
        .from("parents")
        .select(`
          *,
          team:teams(*)
        `)
        .eq("user_id", user.id)
        .single();

      if (parentError) throw parentError;

      setTeam(parentData.team);

      // Get child (player) linked to this parent
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select(`
          *,
          badges:player_badges(
            id,
            created_at,
            badge:badge_definitions(*)
          )
        `)
        .eq("parent_id", parentData.id)
        .single();

      if (!playerError && playerData) {
        setChild(playerData);
        setRecentBadges(
          (playerData.badges || [])
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
        );
      }

      // Get upcoming events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("team_id", parentData.team_id)
        .gte("start_time", new Date().toISOString())
        .order("start_time")
        .limit(3);

      setUpcomingEvents(eventsData || []);

      // Get pending payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select(`
          *,
          payment_request:payment_requests(*)
        `)
        .eq("parent_id", parentData.id)
        .eq("status", "pending");

      setPendingPayments(paymentsData || []);

      // Get unread messages count
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .or(`recipient_parent_id.eq.${parentData.id},message_type.eq.team`)
        .eq("team_id", parentData.team_id)
        .is("read_at", null);

      setUnreadMessages(count || 0);
    } catch (error) {
      console.error("Error fetching parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case "practice": return "⚽";
      case "game": return "🏆";
      case "tournament": return "🎯";
      default: return "📅";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <VuiBox py={3} display="flex" justifyContent="center">
          <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
        </VuiBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {language === "es" ? "Hola" : "Hello"}, {userProfile?.first_name || "Parent"}! 👋
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            {team?.name || (language === "es" ? "Tu equipo" : "Your team")}
          </VuiTypography>
        </VuiBox>

        <Grid container spacing={3}>
          {/* Child's Player Card - Prominent Display */}
          <Grid item xs={12} lg={5}>
            <Card sx={{ overflow: "visible", height: "100%" }}>
              <VuiBox p={3} pb={5} display="flex" flexDirection="column" alignItems="center">
                <VuiTypography variant="h6" color="white" mb={2} alignSelf="flex-start">
                  {child?.first_name
                    ? language === "es"
                      ? `Tarjeta de ${child.first_name}`
                      : `${child.first_name}'s Card`
                    : language === "es"
                    ? "Tarjeta del Jugador"
                    : "Player Card"}
                </VuiTypography>
                {child ? (
                  <VuiBox display="flex" justifyContent="center" pb={2}>
                    <PlayerCard player={child} size="large" showStats />
                  </VuiBox>
                ) : (
                  <VuiBox textAlign="center" py={3}>
                    <VuiTypography color="text">
                      {language === "es"
                        ? "Aún no hay jugador conectado"
                        : "No player connected yet"}
                    </VuiTypography>
                  </VuiBox>
                )}
              </VuiBox>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={7}>
            {/* Quick Actions */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6} md={3}>
                <Card
                  onClick={() => navigate("/parent/schedule")}
                  sx={{ cursor: "pointer", "&:hover": { transform: "translateY(-2px)" }, transition: "all 0.2s" }}
                >
                  <VuiBox p={2} textAlign="center">
                    <IoCalendar size={28} color="#0075FF" />
                    <VuiTypography variant="caption" color="white" display="block" mt={1}>
                      {language === "es" ? "Calendario" : "Schedule"}
                    </VuiTypography>
                  </VuiBox>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card
                  onClick={() => navigate("/parent/messages")}
                  sx={{ cursor: "pointer", "&:hover": { transform: "translateY(-2px)" }, transition: "all 0.2s", position: "relative" }}
                >
                  <VuiBox p={2} textAlign="center">
                    <IoChatbubbles size={28} color="#4CAF50" />
                    <VuiTypography variant="caption" color="white" display="block" mt={1}>
                      {language === "es" ? "Mensajes" : "Messages"}
                    </VuiTypography>
                    {unreadMessages > 0 && (
                      <VuiBox
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#f44336",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <VuiTypography variant="caption" color="white" sx={{ fontSize: 10 }}>
                          {unreadMessages}
                        </VuiTypography>
                      </VuiBox>
                    )}
                  </VuiBox>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card
                  onClick={() => navigate("/parent/payments")}
                  sx={{ cursor: "pointer", "&:hover": { transform: "translateY(-2px)" }, transition: "all 0.2s", position: "relative" }}
                >
                  <VuiBox p={2} textAlign="center">
                    <IoCard size={28} color="#FF9800" />
                    <VuiTypography variant="caption" color="white" display="block" mt={1}>
                      {language === "es" ? "Pagos" : "Payments"}
                    </VuiTypography>
                    {pendingPayments.length > 0 && (
                      <VuiBox
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#f44336",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <VuiTypography variant="caption" color="white" sx={{ fontSize: 10 }}>
                          {pendingPayments.length}
                        </VuiTypography>
                      </VuiBox>
                    )}
                  </VuiBox>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card
                  onClick={() => navigate("/parent/badges")}
                  sx={{ cursor: "pointer", "&:hover": { transform: "translateY(-2px)" }, transition: "all 0.2s" }}
                >
                  <VuiBox p={2} textAlign="center">
                    <IoTrophy size={28} color="#9D4EDD" />
                    <VuiTypography variant="caption" color="white" display="block" mt={1}>
                      {language === "es" ? "Insignias" : "Badges"}
                    </VuiTypography>
                  </VuiBox>
                </Card>
              </Grid>
            </Grid>

            {/* Upcoming Events */}
            <Card sx={{ mb: 3 }}>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" mb={2}>
                  {language === "es" ? "Próximos Eventos" : "Upcoming Events"}
                </VuiTypography>
                {upcomingEvents.length === 0 ? (
                  <VuiTypography variant="body2" color="text">
                    {language === "es" ? "No hay eventos programados" : "No upcoming events"}
                  </VuiTypography>
                ) : (
                  upcomingEvents.map((event) => (
                    <VuiBox
                      key={event.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.03)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <VuiBox display="flex" alignItems="center" gap={2}>
                        <VuiTypography variant="h5">{getEventTypeIcon(event.event_type)}</VuiTypography>
                        <VuiBox>
                          <VuiTypography variant="button" color="white" fontWeight="bold">
                            {event.title}
                          </VuiTypography>
                          <VuiTypography variant="caption" color="text" display="block">
                            {formatDate(event.start_time)} • {formatTime(event.start_time)}
                          </VuiTypography>
                        </VuiBox>
                      </VuiBox>
                      <VuiButton color="info" size="small" variant="outlined">
                        {language === "es" ? "RSVP" : "RSVP"}
                      </VuiButton>
                    </VuiBox>
                  ))
                )}
              </VuiBox>
            </Card>

            {/* Recent Badges */}
            {recentBadges.length > 0 && (
              <Card>
                <VuiBox p={3}>
                  <VuiTypography variant="h6" color="white" mb={2}>
                    {language === "es" ? "Insignias Recientes" : "Recent Badges"} 🏅
                  </VuiTypography>
                  <VuiBox display="flex" gap={2} flexWrap="wrap">
                    {recentBadges.map((item) => (
                      <VuiBox
                        key={item.id}
                        sx={{
                          p: 1.5,
                          borderRadius: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          textAlign: "center",
                          minWidth: 80,
                        }}
                      >
                        <VuiTypography variant="h4">{item.badge?.icon || "🏅"}</VuiTypography>
                        <VuiTypography variant="caption" color="text" display="block">
                          {language === "es" ? item.badge?.name_es : item.badge?.name_en}
                        </VuiTypography>
                      </VuiBox>
                    ))}
                  </VuiBox>
                </VuiBox>
              </Card>
            )}
          </Grid>

          {/* Pending Payments Alert */}
          {pendingPayments.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ background: "linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 87, 34, 0.1) 100%)" }}>
                <VuiBox p={3} display="flex" justifyContent="space-between" alignItems="center">
                  <VuiBox>
                    <VuiTypography variant="h6" color="warning">
                      {language === "es" ? "Pagos Pendientes" : "Pending Payments"}
                    </VuiTypography>
                    <VuiTypography variant="body2" color="text">
                      {pendingPayments.length}{" "}
                      {language === "es"
                        ? pendingPayments.length === 1
                          ? "pago pendiente"
                          : "pagos pendientes"
                        : pendingPayments.length === 1
                        ? "payment due"
                        : "payments due"}{" "}
                      •{" "}
                      {formatCurrency(
                        pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0)
                      )}
                    </VuiTypography>
                  </VuiBox>
                  <VuiButton color="warning" onClick={() => navigate("/parent/payments")}>
                    {language === "es" ? "Pagar Ahora" : "Pay Now"}
                  </VuiButton>
                </VuiBox>
              </Card>
            </Grid>
          )}
        </Grid>

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default ParentDashboard;

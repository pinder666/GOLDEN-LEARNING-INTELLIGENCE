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
import { IoTrophy, IoFlame, IoFitness, IoCalendar, IoRibbon } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

// Demo avatar
import demoAvatar from "assets/images/avatar4.png";

const DEV_MODE = process.env.NODE_ENV === 'development';

const DEMO_PLAYER = {
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
  team: { id: 1, name: "Thunder FC", age_group: "U12" },
};

const DEMO_BADGES = [
  { id: 1, created_at: "2026-09-10", badge: { icon: "⭐", name_en: "5 Sessions", name_es: "5 Sesiones" } },
  { id: 2, created_at: "2026-09-08", badge: { icon: "⚽", name_en: "First Goal", name_es: "Primer Gol" } },
  { id: 3, created_at: "2026-09-05", badge: { icon: "🤝", name_en: "Team Player", name_es: "Jugador de Equipo" } },
  { id: 4, created_at: "2026-09-01", badge: { icon: "🔥", name_en: "Perfect Week", name_es: "Semana Perfecta" } },
  { id: 5, created_at: "2026-08-28", badge: { icon: "📈", name_en: "Most Improved", name_es: "Más Mejorado" } },
];

const DEMO_HABIT = {
  player_name: "Lionel Messi",
  habit_en: "I visualize my goals before every match",
  habit_es: "Visualizo mis goles antes de cada partido",
};

const DEMO_EVENT = {
  id: 1,
  title: "Game vs Eagles",
  event_type: "game",
  start_time: new Date(Date.now() + 259200000).toISOString(),
  location: "City Stadium",
};

function ChildDashboard() {
  const { t, i18n } = useTranslation(["common", "child"]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [player, setPlayer] = useState(null);
  const [badges, setBadges] = useState([]);
  const [todayHabit, setTodayHabit] = useState(null);
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [teamRank, setTeamRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setPlayer(DEMO_PLAYER);
      setBadges(DEMO_BADGES);
      setTodayHabit(DEMO_HABIT);
      setUpcomingEvent(DEMO_EVENT);
      setTeamRank({ rank: 3, total: 15 });
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchPlayerData();
    }
  }, [user]);

  const fetchPlayerData = async () => {
    try {
      // Get player linked to this user
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select(`
          *,
          team:teams(*),
          badges:player_badges(
            id,
            created_at,
            badge:badge_definitions(*)
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (playerError) throw playerError;
      setPlayer(playerData);
      setBadges(playerData.badges || []);

      // Get team rank
      const { data: teamPlayers } = await supabase
        .from("players")
        .select("id, total_points")
        .eq("team_id", playerData.team_id)
        .eq("is_active", true)
        .order("total_points", { ascending: false });

      if (teamPlayers) {
        const rank = teamPlayers.findIndex((p) => p.id === playerData.id) + 1;
        setTeamRank({ rank, total: teamPlayers.length });
      }

      // Get today's habit
      const { data: habitData } = await supabase
        .from("player_habit_assignments")
        .select(`
          *,
          habit:pro_habits(*)
        `)
        .eq("player_id", playerData.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .single();

      if (habitData) setTodayHabit(habitData.habit);

      // Get next event
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("team_id", playerData.team_id)
        .gte("start_time", new Date().toISOString())
        .order("start_time")
        .limit(1)
        .single();

      if (eventData) setUpcomingEvent(eventData);
    } catch (error) {
      console.error("Error fetching player data:", error);
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

  const recentBadges = badges
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Welcome Header */}
        <VuiBox mb={3} textAlign="center">
          <VuiTypography variant="h3" color="white" fontWeight="bold">
            {language === "es" ? "¡Hola" : "Hey"}, {player?.first_name}! 👋
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            {player?.team?.name}
          </VuiTypography>
        </VuiBox>

        <Grid container spacing={3}>
          {/* Player Card - Center Stage */}
          <Grid item xs={12} display="flex" justifyContent="center" sx={{ pb: 3 }}>
            {player && (
              <VuiBox
                onClick={() => navigate("/player/card")}
                sx={{ cursor: "pointer", transition: "transform 0.3s", "&:hover": { transform: "scale(1.02)" } }}
              >
                <PlayerCard player={player} size="large" showStats />
              </VuiBox>
            )}
          </Grid>

          {/* Stats Row */}
          <Grid item xs={6} md={3}>
            <Card
              onClick={() => navigate("/player/leaderboard")}
              sx={{ cursor: "pointer", "&:hover": { transform: "translateY(-2px)" }, transition: "all 0.2s" }}
            >
              <VuiBox p={2} textAlign="center">
                <IoTrophy size={28} color="#FFD700" />
                <VuiTypography variant="h4" color="white" mt={1}>
                  #{teamRank?.rank || "-"}
                </VuiTypography>
                <VuiTypography variant="caption" color="text">
                  {language === "es" ? "En el equipo" : "On team"}
                </VuiTypography>
              </VuiBox>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card>
              <VuiBox p={2} textAlign="center">
                <VuiTypography variant="h4" color="info">
                  {player?.total_points || 0}
                </VuiTypography>
                <VuiTypography variant="caption" color="text">
                  {language === "es" ? "Puntos" : "Points"}
                </VuiTypography>
              </VuiBox>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              onClick={() => navigate("/player/badges")}
              sx={{ cursor: "pointer", "&:hover": { transform: "translateY(-2px)" }, transition: "all 0.2s" }}
            >
              <VuiBox p={2} textAlign="center">
                <IoRibbon size={28} color="#9D4EDD" />
                <VuiTypography variant="h4" color="white" mt={1}>
                  {badges.length}
                </VuiTypography>
                <VuiTypography variant="caption" color="text">
                  {language === "es" ? "Insignias" : "Badges"}
                </VuiTypography>
              </VuiBox>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card>
              <VuiBox p={2} textAlign="center">
                <IoFlame size={28} color="#FF6B6B" />
                <VuiTypography variant="h4" color="white" mt={1}>
                  {player?.attendance_streak || 0}
                </VuiTypography>
                <VuiTypography variant="caption" color="text">
                  {language === "es" ? "Racha" : "Streak"}
                </VuiTypography>
              </VuiBox>
            </Card>
          </Grid>

          {/* Today's Pro Habit */}
          {todayHabit && (
            <Grid item xs={12} md={6}>
              <Card sx={{ background: "linear-gradient(135deg, rgba(0, 117, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)" }}>
                <VuiBox p={3}>
                  <VuiBox display="flex" alignItems="center" gap={1} mb={2}>
                    <IoFitness size={20} color="#0075FF" />
                    <VuiTypography variant="button" color="info" fontWeight="bold">
                      {language === "es" ? "HÁBITO PRO DEL DÍA" : "TODAY'S PRO HABIT"}
                    </VuiTypography>
                  </VuiBox>
                  <VuiTypography variant="h6" color="white" mb={1}>
                    {todayHabit.player_name}
                  </VuiTypography>
                  <VuiTypography variant="body2" color="white">
                    "{language === "es" ? todayHabit.habit_es : todayHabit.habit_en}"
                  </VuiTypography>
                </VuiBox>
              </Card>
            </Grid>
          )}

          {/* Next Event */}
          {upcomingEvent && (
            <Grid item xs={12} md={todayHabit ? 6 : 12}>
              <Card>
                <VuiBox p={3}>
                  <VuiBox display="flex" alignItems="center" gap={1} mb={2}>
                    <IoCalendar size={20} color="#4CAF50" />
                    <VuiTypography variant="button" color="success" fontWeight="bold">
                      {language === "es" ? "PRÓXIMO EVENTO" : "NEXT UP"}
                    </VuiTypography>
                  </VuiBox>
                  <VuiBox display="flex" alignItems="center" gap={2}>
                    <VuiTypography variant="h3">
                      {getEventTypeIcon(upcomingEvent.event_type)}
                    </VuiTypography>
                    <VuiBox>
                      <VuiTypography variant="h6" color="white">
                        {upcomingEvent.title}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        {formatDate(upcomingEvent.start_time)}
                        {upcomingEvent.location && ` • ${upcomingEvent.location}`}
                      </VuiTypography>
                    </VuiBox>
                  </VuiBox>
                </VuiBox>
              </Card>
            </Grid>
          )}

          {/* Recent Badges */}
          {recentBadges.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <VuiBox p={3}>
                  <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <VuiTypography variant="h6" color="white">
                      {language === "es" ? "Insignias Recientes" : "Recent Badges"} 🏅
                    </VuiTypography>
                    <VuiButton
                      color="info"
                      size="small"
                      variant="outlined"
                      onClick={() => navigate("/player/badges")}
                    >
                      {language === "es" ? "Ver Todas" : "See All"}
                    </VuiButton>
                  </VuiBox>
                  <VuiBox display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                    {recentBadges.map((item) => (
                      <VuiBox
                        key={item.id}
                        sx={{
                          p: 2,
                          borderRadius: "16px",
                          background: "rgba(255, 255, 255, 0.05)",
                          textAlign: "center",
                          minWidth: 100,
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.05)" },
                        }}
                      >
                        <VuiTypography variant="h2">{item.badge?.icon || "🏅"}</VuiTypography>
                        <VuiTypography variant="caption" color="white" display="block" mt={1}>
                          {language === "es" ? item.badge?.name_es : item.badge?.name_en}
                        </VuiTypography>
                      </VuiBox>
                    ))}
                  </VuiBox>
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

export default ChildDashboard;

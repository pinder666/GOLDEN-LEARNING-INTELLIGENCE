import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiAvatar from "components/VuiAvatar";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const LEADERBOARD_TYPES = [
  { key: "points", labelEn: "Total Points", labelEs: "Puntos Totales", field: "total_points" },
  { key: "badges", labelEn: "Badges", labelEs: "Insignias", field: "badge_count" },
  { key: "attendance", labelEn: "Attendance Streak", labelEs: "Racha de Asistencia", field: "attendance_streak" },
];

import { DEV_MODE } from "devMode";

const DEMO_PLAYERS = [
  { id: 1, first_name: "Marcus", last_name: "Johnson", total_points: 450, badge_count: 8, attendance_streak: 12 },
  { id: 2, first_name: "Sofia", last_name: "Garcia", total_points: 420, badge_count: 6, attendance_streak: 15 },
  { id: 3, first_name: "Liam", last_name: "Smith", total_points: 380, badge_count: 5, attendance_streak: 8 },
  { id: 4, first_name: "Emma", last_name: "Williams", total_points: 350, badge_count: 7, attendance_streak: 10 },
  { id: 5, first_name: "Noah", last_name: "Brown", total_points: 320, badge_count: 4, attendance_streak: 6 },
  { id: 6, first_name: "Olivia", last_name: "Davis", total_points: 290, badge_count: 3, attendance_streak: 9 },
];

function CoachLeaderboard() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const { teamData } = useAuth();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("points");

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setPlayers(DEMO_PLAYERS);
      setLoading(false);
      return;
    }
    if (teamData?.id) {
      fetchPlayers();
    }
  }, [teamData]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select(`
          *,
          badges:player_badges(id)
        `)
        .eq("team_id", teamData.id)
        .eq("is_active", true);

      if (error) throw error;

      // Add badge count to each player
      const playersWithBadgeCount = data.map((player) => ({
        ...player,
        badge_count: player.badges?.length || 0,
      }));

      setPlayers(playersWithBadgeCount);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentType = LEADERBOARD_TYPES.find((t) => t.key === activeType);

  // Sort players by the active leaderboard type
  const sortedPlayers = [...players].sort((a, b) => {
    const aValue = a[currentType.field] || 0;
    const bValue = b[currentType.field] || 0;
    return bValue - aValue;
  });

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0075FF&color=fff&size=100`;

  const getFrameColor = (frame) => {
    switch (frame) {
      case "diamond": return "#B9F2FF";
      case "platinum": return "#E5E4E2";
      case "gold": return "#FFD700";
      case "silver": return "#C0C0C0";
      default: return "#CD7F32"; // bronze
    }
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return { icon: "🥇", color: "#FFD700" };
    if (rank === 2) return { icon: "🥈", color: "#C0C0C0" };
    if (rank === 3) return { icon: "🥉", color: "#CD7F32" };
    return { icon: rank.toString(), color: "rgba(255,255,255,0.5)" };
  };

  const getValueDisplay = (player) => {
    const value = player[currentType.field] || 0;
    if (activeType === "points") return `${value} pts`;
    if (activeType === "badges") return `${value} 🏅`;
    if (activeType === "attendance") return value > 0 ? `🔥 ${value}` : "0";
    return value;
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {language === "es" ? "Tabla de Líderes" : "Leaderboard"}
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            {language === "es"
              ? "Todos los jugadores del equipo • Nadie queda fuera"
              : "Every player on the team • No one left out"}
          </VuiTypography>
        </VuiBox>

        {/* Type Tabs */}
        <Card sx={{ mb: 3 }}>
          <VuiBox px={2}>
            <Tabs
              value={activeType}
              onChange={(e, val) => setActiveType(val)}
              sx={{
                "& .MuiTab-root": { color: "rgba(255,255,255,0.7)" },
                "& .Mui-selected": { color: "#0075FF" },
                "& .MuiTabs-indicator": { backgroundColor: "#0075FF" },
              }}
            >
              {LEADERBOARD_TYPES.map((type) => (
                <Tab
                  key={type.key}
                  value={type.key}
                  label={language === "es" ? type.labelEs : type.labelEn}
                />
              ))}
            </Tabs>
          </VuiBox>
        </Card>

        {loading ? (
          <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
        ) : players.length === 0 ? (
          <Card>
            <VuiBox p={5} textAlign="center">
              <VuiTypography variant="h2" mb={2}>
                🏆
              </VuiTypography>
              <VuiTypography variant="h5" color="white">
                {language === "es" ? "Sin jugadores todavía" : "No players yet"}
              </VuiTypography>
            </VuiBox>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {/* Top 3 Podium */}
            <Grid item xs={12}>
              <Card>
                <VuiBox p={3}>
                  <VuiBox display="flex" justifyContent="center" alignItems="flex-end" gap={3} py={2}>
                    {/* 2nd Place */}
                    {sortedPlayers[1] && (
                      <VuiBox textAlign="center" sx={{ order: 1 }}>
                        <VuiBox
                          sx={{
                            width: 80,
                            height: 80,
                            mx: "auto",
                            mb: 1,
                            position: "relative",
                          }}
                        >
                          <VuiAvatar
                            src={sortedPlayers[1].avatar_url || defaultAvatar(`${sortedPlayers[1].first_name} ${sortedPlayers[1].last_name}`)}
                            sx={{
                              width: 80,
                              height: 80,
                              border: `4px solid #C0C0C0`,
                            }}
                          />
                          <VuiBox
                            sx={{
                              position: "absolute",
                              bottom: -8,
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "24px",
                            }}
                          >
                            🥈
                          </VuiBox>
                        </VuiBox>
                        <VuiTypography variant="button" color="white" fontWeight="bold">
                          {sortedPlayers[1].first_name}
                        </VuiTypography>
                        <VuiTypography variant="h6" color="info">
                          {getValueDisplay(sortedPlayers[1])}
                        </VuiTypography>
                        <VuiBox
                          sx={{
                            width: 60,
                            height: 60,
                            mx: "auto",
                            mt: 1,
                            background: "linear-gradient(180deg, #C0C0C0 0%, #808080 100%)",
                            borderRadius: "4px 4px 0 0",
                          }}
                        />
                      </VuiBox>
                    )}

                    {/* 1st Place */}
                    {sortedPlayers[0] && (
                      <VuiBox textAlign="center" sx={{ order: 2 }}>
                        <VuiBox
                          sx={{
                            width: 100,
                            height: 100,
                            mx: "auto",
                            mb: 1,
                            position: "relative",
                          }}
                        >
                          <VuiAvatar
                            src={sortedPlayers[0].avatar_url || defaultAvatar(`${sortedPlayers[0].first_name} ${sortedPlayers[0].last_name}`)}
                            sx={{
                              width: 100,
                              height: 100,
                              border: `4px solid #FFD700`,
                              boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
                            }}
                          />
                          <VuiBox
                            sx={{
                              position: "absolute",
                              bottom: -8,
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "32px",
                            }}
                          >
                            🥇
                          </VuiBox>
                        </VuiBox>
                        <VuiTypography variant="h6" color="white" fontWeight="bold">
                          {sortedPlayers[0].first_name}
                        </VuiTypography>
                        <VuiTypography variant="h5" color="warning">
                          {getValueDisplay(sortedPlayers[0])}
                        </VuiTypography>
                        <VuiBox
                          sx={{
                            width: 80,
                            height: 100,
                            mx: "auto",
                            mt: 1,
                            background: "linear-gradient(180deg, #FFD700 0%, #B8860B 100%)",
                            borderRadius: "4px 4px 0 0",
                          }}
                        />
                      </VuiBox>
                    )}

                    {/* 3rd Place */}
                    {sortedPlayers[2] && (
                      <VuiBox textAlign="center" sx={{ order: 3 }}>
                        <VuiBox
                          sx={{
                            width: 70,
                            height: 70,
                            mx: "auto",
                            mb: 1,
                            position: "relative",
                          }}
                        >
                          <VuiAvatar
                            src={sortedPlayers[2].avatar_url || defaultAvatar(`${sortedPlayers[2].first_name} ${sortedPlayers[2].last_name}`)}
                            sx={{
                              width: 70,
                              height: 70,
                              border: `4px solid #CD7F32`,
                            }}
                          />
                          <VuiBox
                            sx={{
                              position: "absolute",
                              bottom: -8,
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "20px",
                            }}
                          >
                            🥉
                          </VuiBox>
                        </VuiBox>
                        <VuiTypography variant="button" color="white" fontWeight="bold">
                          {sortedPlayers[2].first_name}
                        </VuiTypography>
                        <VuiTypography variant="h6" color="info">
                          {getValueDisplay(sortedPlayers[2])}
                        </VuiTypography>
                        <VuiBox
                          sx={{
                            width: 50,
                            height: 40,
                            mx: "auto",
                            mt: 1,
                            background: "linear-gradient(180deg, #CD7F32 0%, #8B4513 100%)",
                            borderRadius: "4px 4px 0 0",
                          }}
                        />
                      </VuiBox>
                    )}
                  </VuiBox>
                </VuiBox>
              </Card>
            </Grid>

            {/* Full Ranking List - EVERY PLAYER APPEARS */}
            <Grid item xs={12}>
              <Card>
                <VuiBox p={3}>
                  <VuiTypography variant="h6" color="white" mb={2}>
                    {language === "es" ? "Clasificación Completa" : "Full Ranking"}
                    <VuiTypography component="span" variant="caption" color="text" ml={1}>
                      ({sortedPlayers.length} {language === "es" ? "jugadores" : "players"})
                    </VuiTypography>
                  </VuiTypography>

                  {sortedPlayers.map((player, index) => {
                    const rank = index + 1;
                    const rankDisplay = getRankDisplay(rank);

                    return (
                      <VuiBox
                        key={player.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          mb: 1,
                          borderRadius: "12px",
                          background:
                            rank <= 3
                              ? `linear-gradient(90deg, ${rankDisplay.color}15 0%, transparent 100%)`
                              : "rgba(255, 255, 255, 0.02)",
                          borderLeft: `4px solid ${rank <= 3 ? rankDisplay.color : "transparent"}`,
                        }}
                      >
                        {/* Rank */}
                        <VuiBox
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "10px",
                            background: rank <= 3 ? `${rankDisplay.color}30` : "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mr: 2,
                          }}
                        >
                          <VuiTypography
                            variant={rank <= 3 ? "h6" : "button"}
                            color={rank <= 3 ? "white" : "text"}
                            fontWeight="bold"
                          >
                            {rankDisplay.icon}
                          </VuiTypography>
                        </VuiBox>

                        {/* Player Info */}
                        <VuiBox display="flex" alignItems="center" gap={2} flex={1}>
                          <VuiAvatar
                            src={player.avatar_url || defaultAvatar(`${player.first_name} ${player.last_name}`)}
                            size="sm"
                            sx={{
                              border: `2px solid ${getFrameColor(player.card_frame)}`,
                            }}
                          />
                          <VuiBox>
                            <VuiTypography variant="button" color="white" fontWeight="bold">
                              {player.first_name} {player.last_name}
                              {player.jersey_number && (
                                <VuiTypography component="span" variant="caption" color="text" ml={1}>
                                  #{player.jersey_number}
                                </VuiTypography>
                              )}
                            </VuiTypography>
                            {player.position && (
                              <VuiTypography variant="caption" color="text" display="block">
                                {player.position}
                              </VuiTypography>
                            )}
                          </VuiBox>
                        </VuiBox>

                        {/* Value */}
                        <VuiBox textAlign="right">
                          <VuiTypography
                            variant="h6"
                            color={rank <= 3 ? "white" : "text"}
                            fontWeight="bold"
                          >
                            {getValueDisplay(player)}
                          </VuiTypography>
                        </VuiBox>
                      </VuiBox>
                    );
                  })}
                </VuiBox>
              </Card>
            </Grid>
          </Grid>
        )}

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default CoachLeaderboard;

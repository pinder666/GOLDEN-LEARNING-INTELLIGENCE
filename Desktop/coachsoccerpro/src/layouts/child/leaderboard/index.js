import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Card from "@mui/material/Card";

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

const DEV_MODE = process.env.NODE_ENV === 'development';

const DEMO_TEAM_PLAYERS = [
  { id: 2, first_name: "Sofia", last_name: "G.", total_points: 480, card_frame: "gold", attendance_streak: 15 },
  { id: 3, first_name: "Liam", last_name: "S.", total_points: 465, card_frame: "silver", attendance_streak: 8 },
  { id: 1, first_name: "Marcus", last_name: "J.", total_points: 450, card_frame: "gold", attendance_streak: 12 },
  { id: 4, first_name: "Emma", last_name: "W.", total_points: 420, card_frame: "silver", attendance_streak: 10 },
  { id: 5, first_name: "Noah", last_name: "B.", total_points: 380, card_frame: "bronze", attendance_streak: 6 },
  { id: 6, first_name: "Olivia", last_name: "D.", total_points: 350, card_frame: "bronze", attendance_streak: 9 },
  { id: 7, first_name: "Ava", last_name: "M.", total_points: 310, card_frame: "bronze", attendance_streak: 4 },
  { id: 8, first_name: "Ethan", last_name: "T.", total_points: 280, card_frame: "bronze", attendance_streak: 7 },
];

function ChildLeaderboard() {
  const { t, i18n } = useTranslation(["common"]);
  const { user } = useAuth();

  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setPlayers(DEMO_TEAM_PLAYERS);
      setCurrentPlayerId(1);
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchLeaderboard();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      // Get current player
      const { data: playerData } = await supabase
        .from("players")
        .select("id, team_id")
        .eq("user_id", user.id)
        .single();

      if (!playerData) return;
      setCurrentPlayerId(playerData.id);

      // Get all team players sorted by points
      const { data: teamPlayers } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", playerData.team_id)
        .eq("is_active", true)
        .order("total_points", { ascending: false });

      setPlayers(teamPlayers || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0075FF&color=fff&size=100`;

  const getFrameColor = (frame) => {
    switch (frame) {
      case "diamond": return "#B9F2FF";
      case "platinum": return "#E5E4E2";
      case "gold": return "#FFD700";
      case "silver": return "#C0C0C0";
      default: return "#CD7F32";
    }
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return { icon: "🥇", color: "#FFD700", bg: "rgba(255, 215, 0, 0.15)" };
    if (rank === 2) return { icon: "🥈", color: "#C0C0C0", bg: "rgba(192, 192, 192, 0.15)" };
    if (rank === 3) return { icon: "🥉", color: "#CD7F32", bg: "rgba(205, 127, 50, 0.15)" };
    return { icon: rank.toString(), color: "rgba(255,255,255,0.5)", bg: "transparent" };
  };

  const myRank = players.findIndex((p) => p.id === currentPlayerId) + 1;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3} textAlign="center">
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {language === "es" ? "Tabla de Líderes" : "Leaderboard"} 🏆
          </VuiTypography>
          {myRank > 0 && (
            <VuiTypography variant="h6" color="info" mt={1}>
              {language === "es" ? "Estás en el puesto" : "You're in"} #{myRank}!
            </VuiTypography>
          )}
        </VuiBox>

        {loading ? (
          <VuiTypography color="text" textAlign="center">
            {t("common:status.loading")}
          </VuiTypography>
        ) : (
          <Card>
            <VuiBox p={2}>
              {/* EVERY player appears - no one left out */}
              {players.map((player, index) => {
                const rank = index + 1;
                const rankDisplay = getRankDisplay(rank);
                const isMe = player.id === currentPlayerId;

                return (
                  <VuiBox
                    key={player.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 2,
                      mb: 1,
                      borderRadius: "12px",
                      background: isMe
                        ? "linear-gradient(90deg, rgba(0, 117, 255, 0.3) 0%, rgba(0, 212, 255, 0.1) 100%)"
                        : rankDisplay.bg,
                      border: isMe ? "2px solid #0075FF" : "2px solid transparent",
                      transition: "all 0.2s",
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
                        variant={rank <= 3 ? "h5" : "button"}
                        color="white"
                        fontWeight="bold"
                      >
                        {rankDisplay.icon}
                      </VuiTypography>
                    </VuiBox>

                    {/* Avatar */}
                    <VuiAvatar
                      src={player.avatar_url || defaultAvatar(`${player.first_name} ${player.last_name}`)}
                      size="md"
                      sx={{
                        border: `3px solid ${getFrameColor(player.card_frame)}`,
                        mr: 2,
                      }}
                    />

                    {/* Name */}
                    <VuiBox flex={1}>
                      <VuiTypography variant="button" color="white" fontWeight="bold">
                        {player.first_name} {player.last_name}
                        {isMe && (
                          <VuiTypography component="span" variant="caption" color="info" ml={1}>
                            ({language === "es" ? "Tú" : "You"})
                          </VuiTypography>
                        )}
                      </VuiTypography>
                      {player.attendance_streak > 0 && (
                        <VuiTypography variant="caption" color="warning" display="block">
                          🔥 {player.attendance_streak}
                        </VuiTypography>
                      )}
                    </VuiBox>

                    {/* Points */}
                    <VuiBox textAlign="right">
                      <VuiTypography variant="h5" color={isMe ? "info" : "white"} fontWeight="bold">
                        {player.total_points || 0}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        pts
                      </VuiTypography>
                    </VuiBox>
                  </VuiBox>
                );
              })}
            </VuiBox>
          </Card>
        )}

        {/* Encouragement for those not in top 3 */}
        {myRank > 3 && (
          <Card sx={{ mt: 3 }}>
            <VuiBox p={3} textAlign="center">
              <VuiTypography variant="h5" color="white">
                💪 {language === "es" ? "¡Sigue adelante!" : "Keep going!"}
              </VuiTypography>
              <VuiTypography variant="body2" color="text" mt={1}>
                {language === "es"
                  ? "Cada entrenamiento te acerca más a la cima. ¡Tú puedes!"
                  : "Every practice gets you closer to the top. You've got this!"}
              </VuiTypography>
            </VuiBox>
          </Card>
        )}

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default ChildLeaderboard;

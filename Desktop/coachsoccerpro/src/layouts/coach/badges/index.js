import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Modal from "@mui/material/Modal";
import IconButton from "@mui/material/IconButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";
import VuiAvatar from "components/VuiAvatar";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Icons
import { IoClose, IoTrophy, IoSearch, IoCheckmarkCircle } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const BADGE_CATEGORIES = [
  { key: "all", labelEn: "All Badges", labelEs: "Todas" },
  { key: "attendance", labelEn: "Attendance", labelEs: "Asistencia" },
  { key: "skills", labelEn: "Skills", labelEs: "Habilidades" },
  { key: "teamwork", labelEn: "Teamwork", labelEs: "Trabajo en Equipo" },
  { key: "milestones", labelEn: "Milestones", labelEs: "Logros" },
  { key: "special", labelEn: "Special", labelEs: "Especial" },
];

const RARITY_COLORS = {
  common: { color: "#A0A0A0", label: "Common", labelEs: "Común" },
  uncommon: { color: "#4CAF50", label: "Uncommon", labelEs: "Poco Común" },
  rare: { color: "#2196F3", label: "Rare", labelEs: "Raro" },
  epic: { color: "#9C27B0", label: "Epic", labelEs: "Épico" },
  legendary: { color: "#FF9800", label: "Legendary", labelEs: "Legendario" },
};

import { DEV_MODE } from "devMode";

const DEMO_BADGES = [
  { id: 1, key: "attendance_5", name_en: "5 Sessions", name_es: "5 Sesiones", description_en: "Attended 5 sessions", description_es: "Asistió a 5 sesiones", emoji: "⭐", category: "attendance", rarity: "common" },
  { id: 2, key: "attendance_10", name_en: "10 Sessions", name_es: "10 Sesiones", description_en: "Attended 10 sessions", description_es: "Asistió a 10 sesiones", emoji: "🌟", category: "attendance", rarity: "uncommon" },
  { id: 3, key: "first_goal", name_en: "First Goal", name_es: "Primer Gol", description_en: "Scored their first goal", description_es: "Anotó su primer gol", emoji: "⚽", category: "milestones", rarity: "common" },
  { id: 4, key: "team_player", name_en: "Team Player", name_es: "Jugador de Equipo", description_en: "Great teamwork", description_es: "Gran trabajo en equipo", emoji: "🤝", category: "teamwork", rarity: "common" },
  { id: 5, key: "most_improved", name_en: "Most Improved", name_es: "Más Mejorado", description_en: "Showed great improvement", description_es: "Mostró gran mejora", emoji: "📈", category: "special", rarity: "rare" },
  { id: 6, key: "captain", name_en: "Captain", name_es: "Capitán", description_en: "Led the team", description_es: "Lideró el equipo", emoji: "👑", category: "special", rarity: "epic" },
  { id: 7, key: "perfect_week", name_en: "Perfect Week", name_es: "Semana Perfecta", description_en: "Attended all sessions this week", description_es: "Asistió a todas las sesiones esta semana", emoji: "🔥", category: "attendance", rarity: "rare" },
  { id: 8, key: "ball_control", name_en: "Ball Control", name_es: "Control de Balón", description_en: "Mastered ball control", description_es: "Dominó el control del balón", emoji: "🎯", category: "skills", rarity: "uncommon" },
];

const DEMO_PLAYERS = [
  { id: 1, first_name: "Marcus", last_name: "Johnson", badges: [] },
  { id: 2, first_name: "Sofia", last_name: "Garcia", badges: [{ badge: { key: "attendance_5" } }] },
  { id: 3, first_name: "Liam", last_name: "Smith", badges: [] },
  { id: 4, first_name: "Emma", last_name: "Williams", badges: [{ badge: { key: "team_player" } }] },
];

function CoachBadges() {
  const { t, i18n } = useTranslation(["common", "coach", "badges"]);
  const { teamData, coachData } = useAuth();

  const [badges, setBadges] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Award modal state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [awardNote, setAwardNote] = useState("");
  const [awarding, setAwarding] = useState(false);
  const [awarded, setAwarded] = useState(false);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setBadges(DEMO_BADGES);
      setPlayers(DEMO_PLAYERS);
      setLoading(false);
      return;
    }
    fetchData();
  }, [teamData]);

  const fetchData = async () => {
    try {
      // Fetch badge definitions
      const { data: badgesData, error: badgesError } = await supabase
        .from("badge_definitions")
        .select("*")
        .order("category", { ascending: true })
        .order("rarity", { ascending: true });

      if (badgesError) throw badgesError;
      setBadges(badgesData || []);

      // Fetch players
      if (teamData?.id) {
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select(`
            *,
            badges:player_badges(
              badge:badge_definitions(key)
            )
          `)
          .eq("team_id", teamData.id)
          .eq("is_active", true)
          .order("first_name");

        if (playersError) throw playersError;
        setPlayers(playersData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAwardModal = (badge) => {
    setSelectedBadge(badge);
    setSelectedPlayer(null);
    setAwardNote("");
    setAwarded(false);
    setShowAwardModal(true);
  };

  const handleAward = async () => {
    if (!selectedBadge || !selectedPlayer) return;

    setAwarding(true);
    try {
      // Check if player already has this badge
      const { data: existing } = await supabase
        .from("player_badges")
        .select("id")
        .eq("player_id", selectedPlayer.id)
        .eq("badge_id", selectedBadge.id)
        .single();

      if (existing) {
        alert(
          language === "es"
            ? "Este jugador ya tiene esta insignia"
            : "This player already has this badge"
        );
        setAwarding(false);
        return;
      }

      // Award badge
      const { error } = await supabase.from("player_badges").insert([
        {
          player_id: selectedPlayer.id,
          badge_id: selectedBadge.id,
          awarded_by_coach_id: coachData.id,
          notes: awardNote || null,
        },
      ]);

      if (error) throw error;

      // Award points based on rarity
      const rarityPoints = {
        common: 10,
        uncommon: 15,
        rare: 25,
        epic: 50,
        legendary: 100,
      };
      const points = rarityPoints[selectedBadge.rarity] || 10;
      await supabase.rpc("add_player_points", {
        player_id: selectedPlayer.id,
        points_to_add: points,
      });

      setAwarded(true);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error awarding badge:", error);
    } finally {
      setAwarding(false);
    }
  };

  const filteredBadges = badges.filter((badge) => {
    if (activeCategory !== "all" && badge.category !== activeCategory) return false;
    if (searchTerm) {
      const name = language === "es" ? badge.name_es : badge.name_en;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0075FF&color=fff&size=100`;

  const playerHasBadge = (player, badgeKey) => {
    return player.badges?.some((b) => b.badge?.key === badgeKey);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {t("coach:badges.title")}
          </VuiTypography>
          <VuiBox display="flex" gap={2}>
            <VuiInput
              placeholder={language === "es" ? "Buscar insignias..." : "Search badges..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={{ component: <IoSearch />, direction: "left" }}
              sx={{ width: 200 }}
            />
          </VuiBox>
        </VuiBox>

        {/* Category Tabs */}
        <Card sx={{ mb: 3 }}>
          <VuiBox px={2}>
            <Tabs
              value={activeCategory}
              onChange={(e, val) => setActiveCategory(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": { color: "rgba(255,255,255,0.7)", minWidth: "auto", px: 2 },
                "& .Mui-selected": { color: "#0075FF" },
                "& .MuiTabs-indicator": { backgroundColor: "#0075FF" },
              }}
            >
              {BADGE_CATEGORIES.map((cat) => (
                <Tab
                  key={cat.key}
                  value={cat.key}
                  label={language === "es" ? cat.labelEs : cat.labelEn}
                />
              ))}
            </Tabs>
          </VuiBox>
        </Card>

        {/* Badge Grid */}
        {loading ? (
          <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
        ) : (
          <Grid container spacing={2}>
            {filteredBadges.map((badge) => {
              const rarity = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

              return (
                <Grid item xs={6} sm={4} md={3} lg={2} key={badge.id}>
                  <Card
                    onClick={() => openAwardModal(badge)}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 0 20px ${rarity.color}40`,
                      },
                    }}
                  >
                    <VuiBox p={2} textAlign="center">
                      <VuiBox
                        sx={{
                          width: 60,
                          height: 60,
                          margin: "0 auto 12px",
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${rarity.color}40 0%, ${rarity.color}10 100%)`,
                          border: `2px solid ${rarity.color}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                        }}
                      >
                        {badge.icon}
                      </VuiBox>
                      <VuiTypography variant="button" color="white" fontWeight="bold" display="block">
                        {language === "es" ? badge.name_es : badge.name_en}
                      </VuiTypography>
                      <VuiTypography
                        variant="caption"
                        sx={{ color: rarity.color }}
                        fontWeight="medium"
                      >
                        {language === "es" ? rarity.labelEs : rarity.label}
                      </VuiTypography>
                    </VuiBox>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Award Modal */}
        <Modal open={showAwardModal} onClose={() => setShowAwardModal(false)}>
          <VuiBox
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "95%", md: 500 },
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <Card>
              <VuiBox p={3}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <VuiTypography variant="h5" color="white">
                    {t("coach:badges.awardBadge")}
                  </VuiTypography>
                  <IconButton onClick={() => setShowAwardModal(false)}>
                    <IoClose color="white" />
                  </IconButton>
                </VuiBox>

                {selectedBadge && (
                  <>
                    {/* Badge Preview */}
                    <VuiBox textAlign="center" mb={3}>
                      <VuiBox
                        sx={{
                          width: 80,
                          height: 80,
                          margin: "0 auto 12px",
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${
                            RARITY_COLORS[selectedBadge.rarity]?.color
                          }40 0%, ${RARITY_COLORS[selectedBadge.rarity]?.color}10 100%)`,
                          border: `3px solid ${RARITY_COLORS[selectedBadge.rarity]?.color}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "36px",
                        }}
                      >
                        {selectedBadge.icon}
                      </VuiBox>
                      <VuiTypography variant="h6" color="white">
                        {language === "es" ? selectedBadge.name_es : selectedBadge.name_en}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        {language === "es" ? selectedBadge.description_es : selectedBadge.description_en}
                      </VuiTypography>
                    </VuiBox>

                    {awarded ? (
                      <VuiBox textAlign="center" py={3}>
                        <IoCheckmarkCircle size={60} color="#4CAF50" />
                        <VuiTypography variant="h5" color="success" mt={2}>
                          {t("coach:badges.badgeAwarded", { player: `${selectedPlayer?.first_name}` })}
                        </VuiTypography>
                        <VuiButton
                          color="info"
                          onClick={() => setShowAwardModal(false)}
                          sx={{ mt: 3 }}
                        >
                          {t("common:buttons.close")}
                        </VuiButton>
                      </VuiBox>
                    ) : (
                      <>
                        {/* Player Selection */}
                        <VuiBox mb={3}>
                          <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                            {t("coach:badges.selectPlayer")}
                          </VuiTypography>
                          <VuiBox
                            sx={{
                              maxHeight: 200,
                              overflow: "auto",
                              borderRadius: "12px",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            {players.map((player) => {
                              const hasBadge = playerHasBadge(player, selectedBadge.key);
                              const isSelected = selectedPlayer?.id === player.id;

                              return (
                                <VuiBox
                                  key={player.id}
                                  onClick={() => !hasBadge && setSelectedPlayer(player)}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    p: 1.5,
                                    cursor: hasBadge ? "not-allowed" : "pointer",
                                    opacity: hasBadge ? 0.5 : 1,
                                    background: isSelected ? "rgba(0, 117, 255, 0.2)" : "transparent",
                                    borderLeft: isSelected ? "3px solid #0075FF" : "3px solid transparent",
                                    "&:hover": {
                                      background: hasBadge ? "transparent" : "rgba(255,255,255,0.05)",
                                    },
                                  }}
                                >
                                  <VuiBox display="flex" alignItems="center" gap={1.5}>
                                    <VuiAvatar
                                      src={player.avatar_url || defaultAvatar(`${player.first_name} ${player.last_name}`)}
                                      size="sm"
                                    />
                                    <VuiTypography variant="button" color="white">
                                      {player.first_name} {player.last_name}
                                    </VuiTypography>
                                  </VuiBox>
                                  {hasBadge && (
                                    <VuiTypography variant="caption" color="success">
                                      ✓ {language === "es" ? "Ya tiene" : "Already has"}
                                    </VuiTypography>
                                  )}
                                </VuiBox>
                              );
                            })}
                          </VuiBox>
                        </VuiBox>

                        {/* Note */}
                        <VuiBox mb={3}>
                          <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                            {t("coach:badges.addNote")}
                          </VuiTypography>
                          <VuiInput
                            multiline
                            rows={2}
                            placeholder={
                              language === "es"
                                ? "Gran trabajo en el entrenamiento de hoy..."
                                : "Great work at practice today..."
                            }
                            value={awardNote}
                            onChange={(e) => setAwardNote(e.target.value)}
                          />
                        </VuiBox>

                        {/* Award Button */}
                        <VuiButton
                          color="info"
                          fullWidth
                          onClick={handleAward}
                          disabled={awarding || !selectedPlayer}
                        >
                          {awarding ? t("common:status.saving") : t("coach:badges.awardNow")}
                        </VuiButton>
                      </>
                    )}
                  </>
                )}
              </VuiBox>
            </Card>
          </VuiBox>
        </Modal>

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default CoachBadges;

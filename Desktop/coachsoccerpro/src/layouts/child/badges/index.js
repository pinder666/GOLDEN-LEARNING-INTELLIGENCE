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

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const BADGE_CATEGORIES = [
  { key: "all", labelEn: "All", labelEs: "Todas" },
  { key: "earned", labelEn: "Earned", labelEs: "Ganadas" },
  { key: "locked", labelEn: "Locked", labelEs: "Bloqueadas" },
];

const RARITY_COLORS = {
  common: "#A0A0A0",
  uncommon: "#4CAF50",
  rare: "#2196F3",
  epic: "#9C27B0",
  legendary: "#FF9800",
};

import { DEV_MODE } from "devMode";

const DEMO_ALL_BADGES = [
  { id: 1, icon: "⭐", name_en: "5 Sessions", name_es: "5 Sesiones", description_en: "Attend 5 sessions", description_es: "Asiste a 5 sesiones", rarity: "common", category: "attendance" },
  { id: 2, icon: "🌟", name_en: "10 Sessions", name_es: "10 Sesiones", description_en: "Attend 10 sessions", description_es: "Asiste a 10 sesiones", rarity: "uncommon", category: "attendance" },
  { id: 3, icon: "⚽", name_en: "First Goal", name_es: "Primer Gol", description_en: "Score your first goal", description_es: "Anota tu primer gol", rarity: "common", category: "milestones" },
  { id: 4, icon: "🤝", name_en: "Team Player", name_es: "Jugador de Equipo", description_en: "Show great teamwork", description_es: "Muestra gran trabajo en equipo", rarity: "common", category: "teamwork" },
  { id: 5, icon: "🔥", name_en: "Perfect Week", name_es: "Semana Perfecta", description_en: "Attend all sessions in a week", description_es: "Asiste a todas las sesiones en una semana", rarity: "rare", category: "attendance" },
  { id: 6, icon: "📈", name_en: "Most Improved", name_es: "Más Mejorado", description_en: "Show the most improvement", description_es: "Muestra la mayor mejora", rarity: "rare", category: "special" },
  { id: 7, icon: "👑", name_en: "Captain", name_es: "Capitán", description_en: "Lead your team", description_es: "Lidera tu equipo", rarity: "epic", category: "special" },
  { id: 8, icon: "🎯", name_en: "Ball Control", name_es: "Control de Balón", description_en: "Master ball control", description_es: "Domina el control del balón", rarity: "uncommon", category: "skills" },
  { id: 9, icon: "🏆", name_en: "Champion", name_es: "Campeón", description_en: "Win a tournament", description_es: "Gana un torneo", rarity: "legendary", category: "milestones" },
  { id: 10, icon: "💪", name_en: "20 Sessions", name_es: "20 Sesiones", description_en: "Attend 20 sessions", description_es: "Asiste a 20 sesiones", rarity: "rare", category: "attendance" },
  { id: 11, icon: "🧠", name_en: "Smart Scanner", name_es: "Escáner Inteligente", description_en: "Master scanning before receiving", description_es: "Domina el escaneo antes de recibir", rarity: "epic", category: "skills" },
  { id: 12, icon: "⚡", name_en: "Speed Demon", name_es: "Demonio de Velocidad", description_en: "Fastest sprint in training", description_es: "Sprint más rápido en entrenamiento", rarity: "uncommon", category: "skills" },
];

const DEMO_EARNED_IDS = [1, 3, 4, 5, 6];

function ChildBadges() {
  const { t, i18n } = useTranslation(["common"]);
  const { user } = useAuth();

  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setAllBadges(DEMO_ALL_BADGES);
      setEarnedBadgeIds(new Set(DEMO_EARNED_IDS));
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    try {
      // Get player
      const { data: playerData } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!playerData) return;

      // Get all badge definitions
      const { data: badgesData } = await supabase
        .from("badge_definitions")
        .select("*")
        .order("rarity")
        .order("category");

      setAllBadges(badgesData || []);

      // Get player's earned badges
      const { data: earnedData } = await supabase
        .from("player_badges")
        .select("badge_id")
        .eq("player_id", playerData.id);

      setEarnedBadgeIds(new Set(earnedData?.map((e) => e.badge_id) || []));
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = allBadges.filter((badge) => {
    const isEarned = earnedBadgeIds.has(badge.id);
    if (activeTab === "earned") return isEarned;
    if (activeTab === "locked") return !isEarned;
    return true;
  });

  const earnedCount = allBadges.filter((b) => earnedBadgeIds.has(b.id)).length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3} textAlign="center">
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {language === "es" ? "Mi Colección de Insignias" : "My Badge Collection"} 🏅
          </VuiTypography>
          <VuiTypography variant="h6" color="info" mt={1}>
            {earnedCount} / {allBadges.length}{" "}
            {language === "es" ? "desbloqueadas" : "unlocked"}
          </VuiTypography>
        </VuiBox>

        {/* Progress Bar */}
        <Card sx={{ mb: 3 }}>
          <VuiBox p={2}>
            <VuiBox
              sx={{
                height: 12,
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
              }}
            >
              <VuiBox
                sx={{
                  height: "100%",
                  width: `${(earnedCount / allBadges.length) * 100}%`,
                  background: "linear-gradient(90deg, #0075FF 0%, #00D4FF 100%)",
                  borderRadius: "6px",
                  transition: "width 0.5s",
                }}
              />
            </VuiBox>
          </VuiBox>
        </Card>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <VuiBox px={2}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              centered
              sx={{
                "& .MuiTab-root": { color: "rgba(255,255,255,0.7)" },
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
          <VuiTypography color="text" textAlign="center">
            {t("common:status.loading")}
          </VuiTypography>
        ) : (
          <Grid container spacing={2}>
            {filteredBadges.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const rarityColor = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

              return (
                <Grid item xs={4} sm={3} md={2} key={badge.id}>
                  <Card
                    sx={{
                      position: "relative",
                      opacity: isEarned ? 1 : 0.4,
                      filter: isEarned ? "none" : "grayscale(100%)",
                      transition: "all 0.3s",
                      "&:hover": isEarned
                        ? {
                            transform: "scale(1.05)",
                            boxShadow: `0 0 20px ${rarityColor}40`,
                          }
                        : {},
                    }}
                  >
                    <VuiBox p={2} textAlign="center">
                      <VuiBox
                        sx={{
                          width: 60,
                          height: 60,
                          margin: "0 auto",
                          borderRadius: "50%",
                          background: isEarned
                            ? `linear-gradient(135deg, ${rarityColor}40 0%, ${rarityColor}10 100%)`
                            : "rgba(255, 255, 255, 0.05)",
                          border: `2px solid ${isEarned ? rarityColor : "rgba(255,255,255,0.2)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                        }}
                      >
                        {isEarned ? badge.icon : "🔒"}
                      </VuiBox>
                      <VuiTypography
                        variant="caption"
                        color={isEarned ? "white" : "text"}
                        display="block"
                        mt={1}
                        sx={{ fontSize: 11 }}
                      >
                        {language === "es" ? badge.name_es : badge.name_en}
                      </VuiTypography>
                    </VuiBox>

                    {/* Rarity indicator */}
                    {isEarned && (
                      <VuiBox
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: rarityColor,
                        }}
                      />
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default ChildBadges;

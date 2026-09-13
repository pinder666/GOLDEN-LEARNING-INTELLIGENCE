import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiAvatar from "components/VuiAvatar";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Icons
import { IoCheckmarkCircle, IoFlame, IoStar, IoTrendingUp, IoHeart } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const QUICK_TAGS = [
  {
    key: "effort",
    icon: "💪",
    labelEn: "Gave Full Effort",
    labelEs: "Dio Todo su Esfuerzo",
    points: 10,
    color: "#FF6B6B",
  },
  {
    key: "teammate",
    icon: "🤝",
    labelEn: "Great Teammate",
    labelEs: "Gran Compañero",
    points: 10,
    color: "#4ECDC4",
  },
  {
    key: "improvement",
    icon: "📈",
    labelEn: "Showed Improvement",
    labelEs: "Mostró Mejora",
    points: 15,
    color: "#FFE66D",
  },
  {
    key: "coachspick",
    icon: "⭐",
    labelEn: "Coach's Pick",
    labelEs: "Elegido del Entrenador",
    points: 20,
    color: "#9D4EDD",
  },
];

function CoachQuickTags() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["common", "coach"]);
  const { teamData, coachData } = useAuth();

  const [event, setEvent] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerTags, setPlayerTags] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id && eventId) {
      fetchData();
    }
  }, [teamData, eventId]);

  const fetchData = async () => {
    try {
      // Fetch event
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      setEvent(eventData);

      // Fetch players who attended this event
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select(`
          player_id,
          player:players(*)
        `)
        .eq("event_id", eventId)
        .in("status", ["present", "late"]);

      const presentPlayers = attendanceData?.map((a) => a.player).filter(Boolean) || [];
      setPlayers(presentPlayers);

      // Fetch existing quick tags for this event
      const { data: existingTags } = await supabase
        .from("quick_tags")
        .select("*")
        .eq("event_id", eventId);

      // Map existing tags to player IDs
      const tagsMap = {};
      existingTags?.forEach((tag) => {
        if (!tagsMap[tag.player_id]) {
          tagsMap[tag.player_id] = [];
        }
        tagsMap[tag.player_id].push(tag.tag_key);
      });
      setPlayerTags(tagsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (playerId, tagKey) => {
    setPlayerTags((prev) => {
      const playerCurrentTags = prev[playerId] || [];
      const hasTag = playerCurrentTags.includes(tagKey);

      if (hasTag) {
        return {
          ...prev,
          [playerId]: playerCurrentTags.filter((t) => t !== tagKey),
        };
      } else {
        return {
          ...prev,
          [playerId]: [...playerCurrentTags, tagKey],
        };
      }
    });
    setSaved(false);
  };

  const saveTags = async () => {
    setSaving(true);

    try {
      // Delete existing tags for this event
      await supabase.from("quick_tags").delete().eq("event_id", eventId);

      // Build new tag records
      const records = [];
      let pointsToAward = {};

      Object.entries(playerTags).forEach(([playerId, tags]) => {
        tags.forEach((tagKey) => {
          const tagInfo = QUICK_TAGS.find((t) => t.key === tagKey);
          records.push({
            event_id: eventId,
            player_id: playerId,
            tag_key: tagKey,
            awarded_by_coach_id: coachData.id,
          });

          // Track points to award
          if (tagInfo) {
            pointsToAward[playerId] = (pointsToAward[playerId] || 0) + tagInfo.points;
          }
        });
      });

      // Insert tags
      if (records.length > 0) {
        const { error } = await supabase.from("quick_tags").insert(records);
        if (error) throw error;
      }

      // Award points to players
      for (const [playerId, points] of Object.entries(pointsToAward)) {
        await supabase.rpc("add_player_points", { player_id: playerId, points_to_add: points });
      }

      // Check for badge triggers (e.g., "10 Coach's Picks" badge)
      await checkBadgeTriggers();

      setSaved(true);
    } catch (error) {
      console.error("Error saving tags:", error);
    } finally {
      setSaving(false);
    }
  };

  const checkBadgeTriggers = async () => {
    // This would check various badge conditions
    // For now, just placeholder - will be expanded in badge system
    console.log("Checking badge triggers...");
  };

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0075FF&color=fff&size=100`;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const totalTags = Object.values(playerTags).flat().length;

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
      <VuiBox py={3}>
        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {t("coach:quickTags.title")}
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            {t("coach:quickTags.subtitle")}
            {event && ` • ${formatDate(event.start_time)}`}
          </VuiTypography>
        </VuiBox>

        {/* Tag Legend */}
        <Card sx={{ mb: 3 }}>
          <VuiBox p={2} display="flex" flexWrap="wrap" gap={2} justifyContent="center">
            {QUICK_TAGS.map((tag) => (
              <VuiBox
                key={tag.key}
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  background: `${tag.color}20`,
                  borderRadius: "8px",
                  px: 2,
                  py: 1,
                }}
              >
                <VuiTypography variant="h6">{tag.icon}</VuiTypography>
                <VuiTypography variant="caption" color="white">
                  {language === "es" ? tag.labelEs : tag.labelEn}
                </VuiTypography>
                <VuiTypography variant="caption" color="success">
                  +{tag.points}
                </VuiTypography>
              </VuiBox>
            ))}
          </VuiBox>
        </Card>

        <Grid container spacing={3}>
          {/* Player List */}
          <Grid item xs={12} lg={8}>
            <Card>
              <VuiBox p={3}>
                {players.length === 0 ? (
                  <VuiBox textAlign="center" py={5}>
                    <VuiTypography variant="h2" mb={2}>
                      📋
                    </VuiTypography>
                    <VuiTypography variant="h5" color="white" mb={1}>
                      {language === "es" ? "Sin jugadores presentes" : "No players present"}
                    </VuiTypography>
                    <VuiTypography variant="body2" color="text">
                      {language === "es"
                        ? "Toma asistencia primero para ver jugadores aquí"
                        : "Take attendance first to see players here"}
                    </VuiTypography>
                  </VuiBox>
                ) : (
                  <VuiBox>
                    {players.map((player) => {
                      const tags = playerTags[player.id] || [];

                      return (
                        <VuiBox
                          key={player.id}
                          sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: "12px",
                            background: tags.length > 0
                              ? "rgba(0, 117, 255, 0.05)"
                              : "rgba(255, 255, 255, 0.03)",
                          }}
                        >
                          <VuiBox display="flex" alignItems="center" gap={2} mb={2}>
                            <VuiAvatar
                              src={player.avatar_url || defaultAvatar(`${player.first_name} ${player.last_name}`)}
                              alt={player.first_name}
                              size="sm"
                            />
                            <VuiBox flex={1}>
                              <VuiTypography variant="button" color="white" fontWeight="bold">
                                {player.first_name} {player.last_name}
                              </VuiTypography>
                              {player.position && (
                                <VuiTypography variant="caption" color="text" display="block">
                                  {player.position}
                                </VuiTypography>
                              )}
                            </VuiBox>
                            {tags.length > 0 && (
                              <VuiBox
                                sx={{
                                  background: "rgba(0, 255, 0, 0.1)",
                                  borderRadius: "8px",
                                  px: 1.5,
                                  py: 0.5,
                                }}
                              >
                                <VuiTypography variant="caption" color="success">
                                  +{tags.reduce((sum, tagKey) => {
                                    const tag = QUICK_TAGS.find((t) => t.key === tagKey);
                                    return sum + (tag?.points || 0);
                                  }, 0)} pts
                                </VuiTypography>
                              </VuiBox>
                            )}
                          </VuiBox>

                          {/* Tag Buttons */}
                          <VuiBox display="flex" flexWrap="wrap" gap={1}>
                            {QUICK_TAGS.map((tag) => {
                              const isSelected = tags.includes(tag.key);

                              return (
                                <VuiBox
                                  key={tag.key}
                                  onClick={() => toggleTag(player.id, tag.key)}
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    background: isSelected ? tag.color : "rgba(255, 255, 255, 0.1)",
                                    border: `2px solid ${isSelected ? tag.color : "transparent"}`,
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    "&:hover": {
                                      background: isSelected ? tag.color : `${tag.color}40`,
                                    },
                                  }}
                                >
                                  <VuiTypography variant="body2">{tag.icon}</VuiTypography>
                                  <VuiTypography
                                    variant="caption"
                                    color="white"
                                    fontWeight={isSelected ? "bold" : "regular"}
                                  >
                                    {language === "es" ? tag.labelEs : tag.labelEn}
                                  </VuiTypography>
                                  {isSelected && <IoCheckmarkCircle size={14} color="white" />}
                                </VuiBox>
                              );
                            })}
                          </VuiBox>
                        </VuiBox>
                      );
                    })}
                  </VuiBox>
                )}
              </VuiBox>
            </Card>
          </Grid>

          {/* Summary Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" mb={3}>
                  {language === "es" ? "Resumen" : "Summary"}
                </VuiTypography>

                <VuiBox textAlign="center" mb={3}>
                  <VuiTypography variant="h2" color="info">
                    {totalTags}
                  </VuiTypography>
                  <VuiTypography variant="body2" color="text">
                    {language === "es" ? "etiquetas asignadas" : "tags assigned"}
                  </VuiTypography>
                </VuiBox>

                {/* Tag breakdown */}
                <VuiBox mb={3}>
                  {QUICK_TAGS.map((tag) => {
                    const count = Object.values(playerTags)
                      .flat()
                      .filter((t) => t === tag.key).length;

                    return (
                      <VuiBox
                        key={tag.key}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <VuiTypography variant="caption" color="text">
                          {tag.icon} {language === "es" ? tag.labelEs : tag.labelEn}
                        </VuiTypography>
                        <VuiTypography variant="button" color="white">
                          {count}
                        </VuiTypography>
                      </VuiBox>
                    );
                  })}
                </VuiBox>

                <VuiButton
                  color={saved ? "success" : "info"}
                  fullWidth
                  onClick={saveTags}
                  disabled={saving}
                >
                  {saving
                    ? t("common:status.saving")
                    : saved
                    ? t("coach:quickTags.tagsSaved")
                    : t("coach:quickTags.saveAndClose")}
                </VuiButton>

                {saved && (
                  <VuiBox mt={2}>
                    <VuiButton
                      color="secondary"
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate("/coach/calendar")}
                    >
                      {language === "es" ? "Volver al Calendario" : "Back to Calendar"}
                    </VuiButton>
                  </VuiBox>
                )}
              </VuiBox>
            </Card>
          </Grid>
        </Grid>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default CoachQuickTags;

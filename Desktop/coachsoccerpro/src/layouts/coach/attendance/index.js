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
import { IoCheckmarkCircle, IoCloseCircle, IoTime, IoCheckmarkDone } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

function CoachAttendance() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["common", "coach"]);
  const { teamData, coachData } = useAuth();

  const [event, setEvent] = useState(null);
  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id && eventId) {
      fetchEventAndPlayers();
    }
  }, [teamData, eventId]);

  const fetchEventAndPlayers = async () => {
    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamData.id)
        .eq("is_active", true)
        .order("first_name");

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      // Fetch existing attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("event_id", eventId);

      if (attendanceError) throw attendanceError;

      // Map attendance to player IDs
      const attendanceMap = {};
      attendanceData?.forEach((record) => {
        attendanceMap[record.player_id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (playerId) => {
    setAttendance((prev) => {
      const current = prev[playerId];
      let next;

      if (current === "present") {
        next = "absent";
      } else if (current === "absent") {
        next = "late";
      } else if (current === "late") {
        next = undefined;
      } else {
        next = "present";
      }

      if (next === undefined) {
        const { [playerId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [playerId]: next };
    });
    setSaved(false);
  };

  const markAll = (status) => {
    const newAttendance = {};
    players.forEach((player) => {
      newAttendance[player.id] = status;
    });
    setAttendance(newAttendance);
    setSaved(false);
  };

  const saveAttendance = async () => {
    setSaving(true);

    try {
      // Delete existing attendance for this event
      await supabase.from("attendance").delete().eq("event_id", eventId);

      // Insert new attendance records
      const records = Object.entries(attendance).map(([playerId, status]) => ({
        event_id: eventId,
        player_id: playerId,
        status,
        recorded_by_coach_id: coachData.id,
      }));

      if (records.length > 0) {
        const { error } = await supabase.from("attendance").insert(records);
        if (error) throw error;
      }

      // Update player streaks for those present
      const presentPlayers = Object.entries(attendance)
        .filter(([_, status]) => status === "present" || status === "late")
        .map(([playerId]) => playerId);

      for (const playerId of presentPlayers) {
        // Increment attendance streak
        await supabase.rpc("increment_attendance_streak", { player_id: playerId });
      }

      // Reset streak for absent players
      const absentPlayers = Object.entries(attendance)
        .filter(([_, status]) => status === "absent")
        .map(([playerId]) => playerId);

      for (const playerId of absentPlayers) {
        await supabase
          .from("players")
          .update({ attendance_streak: 0 })
          .eq("id", playerId);
      }

      setSaved(true);
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "#4CAF50";
      case "absent":
        return "#f44336";
      case "late":
        return "#FF9800";
      default:
        return "rgba(255, 255, 255, 0.2)";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <IoCheckmarkCircle size={24} color="#4CAF50" />;
      case "absent":
        return <IoCloseCircle size={24} color="#f44336" />;
      case "late":
        return <IoTime size={24} color="#FF9800" />;
      default:
        return <VuiBox sx={{ width: 24, height: 24, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.3)" }} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "present":
        return language === "es" ? "Presente" : "Present";
      case "absent":
        return language === "es" ? "Ausente" : "Absent";
      case "late":
        return language === "es" ? "Tarde" : "Late";
      default:
        return language === "es" ? "Sin marcar" : "Not marked";
    }
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

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const lateCount = Object.values(attendance).filter((s) => s === "late").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;

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
            {t("coach:attendance.title")}
          </VuiTypography>
          {event && (
            <VuiTypography variant="body2" color="text">
              {event.title} • {formatDate(event.start_time)}
            </VuiTypography>
          )}
        </VuiBox>

        <Grid container spacing={3}>
          {/* Player List */}
          <Grid item xs={12} lg={8}>
            <Card>
              <VuiBox p={3}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <VuiTypography variant="h6" color="white">
                    {t("coach:attendance.whoShowedUp")}
                  </VuiTypography>
                  <VuiBox display="flex" gap={1}>
                    <VuiButton
                      color="success"
                      size="small"
                      variant="outlined"
                      onClick={() => markAll("present")}
                    >
                      {t("coach:attendance.allPresent")}
                    </VuiButton>
                    <VuiButton
                      color="error"
                      size="small"
                      variant="outlined"
                      onClick={() => markAll("absent")}
                    >
                      {t("coach:attendance.allAbsent")}
                    </VuiButton>
                  </VuiBox>
                </VuiBox>

                {players.length === 0 ? (
                  <VuiBox textAlign="center" py={4}>
                    <VuiTypography color="text">
                      {language === "es" ? "No hay jugadores en el equipo" : "No players on the team"}
                    </VuiTypography>
                  </VuiBox>
                ) : (
                  <VuiBox>
                    {players.map((player, index) => {
                      const status = attendance[player.id];

                      return (
                        <VuiBox
                          key={player.id}
                          onClick={() => toggleAttendance(player.id)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderRadius: "12px",
                            cursor: "pointer",
                            mb: 1,
                            background: status
                              ? `linear-gradient(90deg, ${getStatusColor(status)}20 0%, transparent 100%)`
                              : "rgba(255, 255, 255, 0.03)",
                            borderLeft: `4px solid ${getStatusColor(status)}`,
                            transition: "all 0.2s",
                            "&:hover": {
                              background: "rgba(255, 255, 255, 0.08)",
                            },
                          }}
                        >
                          <VuiBox display="flex" alignItems="center" gap={2}>
                            <VuiAvatar
                              src={player.avatar_url || defaultAvatar(`${player.first_name} ${player.last_name}`)}
                              alt={player.first_name}
                              size="sm"
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
                              {player.attendance_streak > 0 && (
                                <VuiTypography variant="caption" color="warning" display="block">
                                  🔥 {player.attendance_streak} {language === "es" ? "en fila" : "streak"}
                                </VuiTypography>
                              )}
                            </VuiBox>
                          </VuiBox>

                          <VuiBox display="flex" alignItems="center" gap={2}>
                            <VuiTypography variant="caption" color="text">
                              {getStatusLabel(status)}
                            </VuiTypography>
                            {getStatusIcon(status)}
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

                <Grid container spacing={2} mb={3}>
                  <Grid item xs={4}>
                    <VuiBox
                      textAlign="center"
                      p={2}
                      sx={{
                        background: "rgba(76, 175, 80, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(76, 175, 80, 0.3)",
                      }}
                    >
                      <VuiTypography variant="h4" color="success">
                        {presentCount}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        {language === "es" ? "Presentes" : "Present"}
                      </VuiTypography>
                    </VuiBox>
                  </Grid>
                  <Grid item xs={4}>
                    <VuiBox
                      textAlign="center"
                      p={2}
                      sx={{
                        background: "rgba(255, 152, 0, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 152, 0, 0.3)",
                      }}
                    >
                      <VuiTypography variant="h4" color="warning">
                        {lateCount}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        {language === "es" ? "Tarde" : "Late"}
                      </VuiTypography>
                    </VuiBox>
                  </Grid>
                  <Grid item xs={4}>
                    <VuiBox
                      textAlign="center"
                      p={2}
                      sx={{
                        background: "rgba(244, 67, 54, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(244, 67, 54, 0.3)",
                      }}
                    >
                      <VuiTypography variant="h4" color="error">
                        {absentCount}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        {language === "es" ? "Ausentes" : "Absent"}
                      </VuiTypography>
                    </VuiBox>
                  </Grid>
                </Grid>

                <VuiBox mb={2}>
                  <VuiTypography variant="body2" color="text" textAlign="center">
                    {Object.keys(attendance).length} / {players.length}{" "}
                    {language === "es" ? "marcados" : "marked"}
                  </VuiTypography>
                </VuiBox>

                <VuiButton
                  color={saved ? "success" : "info"}
                  fullWidth
                  onClick={saveAttendance}
                  disabled={saving || Object.keys(attendance).length === 0}
                  startIcon={saved ? <IoCheckmarkDone /> : null}
                >
                  {saving
                    ? t("common:status.saving")
                    : saved
                    ? t("coach:attendance.attendanceSaved")
                    : t("coach:attendance.saveAttendance")}
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

            {/* Tips */}
            <Card sx={{ mt: 2 }}>
              <VuiBox p={2}>
                <VuiTypography variant="caption" color="text" fontWeight="bold" mb={1} display="block">
                  💡 {language === "es" ? "Consejos" : "Tips"}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" display="block" mb={1}>
                  • {language === "es" ? "Toca un jugador para cambiar su estado" : "Tap a player to cycle their status"}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" display="block" mb={1}>
                  • {language === "es" ? "Los presentes ganan puntos y mantienen su racha" : "Present players earn points and keep their streak"}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" display="block">
                  • {language === "es" ? "La racha se reinicia si están ausentes" : "Streak resets if they're absent"}
                </VuiTypography>
              </VuiBox>
            </Card>
          </Grid>
        </Grid>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default CoachAttendance;

import { useState, useEffect } from "react";
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

// Icons
import { IoCheckmarkCircle, IoCloseCircle, IoTime, IoLocation } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const DEV_MODE = process.env.NODE_ENV === 'development';

const DEMO_EVENTS = [
  { id: 1, title: "Practice", event_type: "practice", start_time: new Date(Date.now() + 86400000).toISOString(), location: "Main Field", notes: "Bring water and shin guards" },
  { id: 2, title: "Game vs Eagles", event_type: "game", start_time: new Date(Date.now() + 259200000).toISOString(), location: "City Stadium", notes: "Arrive 45 minutes early for warm-up" },
  { id: 3, title: "Skills Session", event_type: "practice", start_time: new Date(Date.now() + 432000000).toISOString(), location: "Training Ground" },
  { id: 4, title: "Spring Tournament", event_type: "tournament", start_time: new Date(Date.now() + 604800000).toISOString(), location: "Regional Sports Complex", notes: "Full day event - pack lunch" },
];

function ParentSchedule() {
  const { t, i18n } = useTranslation(["common", "parent"]);
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState({});
  const [parentId, setParentId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setEvents(DEMO_EVENTS);
      setRsvps({ 1: "confirmed" });
      setPlayerId(1);
      setParentId(1);
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Get parent and player
      const { data: parentData } = await supabase
        .from("parents")
        .select("id, team_id")
        .eq("user_id", user.id)
        .single();

      if (!parentData) return;
      setParentId(parentData.id);

      const { data: playerData } = await supabase
        .from("players")
        .select("id")
        .eq("parent_id", parentData.id)
        .single();

      if (playerData) setPlayerId(playerData.id);

      // Get upcoming events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("team_id", parentData.team_id)
        .gte("start_time", new Date().toISOString())
        .order("start_time")
        .limit(20);

      setEvents(eventsData || []);

      // Get RSVPs
      if (playerData) {
        const { data: rsvpData } = await supabase
          .from("event_rsvps")
          .select("*")
          .eq("player_id", playerData.id);

        const rsvpMap = {};
        rsvpData?.forEach((r) => {
          rsvpMap[r.event_id] = r.status;
        });
        setRsvps(rsvpMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (eventId, status) => {
    if (!playerId) return;

    if (DEV_MODE) {
      setRsvps((prev) => ({ ...prev, [eventId]: status }));
      return;
    }

    try {
      // Upsert RSVP
      const { error } = await supabase
        .from("event_rsvps")
        .upsert(
          {
            event_id: eventId,
            player_id: playerId,
            status: status,
            responded_by_parent_id: parentId,
          },
          { onConflict: "event_id,player_id" }
        );

      if (error) throw error;

      setRsvps((prev) => ({
        ...prev,
        [eventId]: status,
      }));
    } catch (error) {
      console.error("Error updating RSVP:", error);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      month: "long",
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

  const getEventTypeInfo = (type) => {
    switch (type) {
      case "practice":
        return { icon: "⚽", color: "#0075FF", labelEn: "Practice", labelEs: "Entrenamiento" };
      case "game":
        return { icon: "🏆", color: "#FF6B6B", labelEn: "Game", labelEs: "Partido" };
      case "tournament":
        return { icon: "🎯", color: "#FFD93D", labelEn: "Tournament", labelEs: "Torneo" };
      case "meeting":
        return { icon: "👥", color: "#6BCB77", labelEn: "Meeting", labelEs: "Reunión" };
      default:
        return { icon: "📅", color: "#9D4EDD", labelEn: "Event", labelEs: "Evento" };
    }
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = new Date(event.start_time).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {language === "es" ? "Calendario" : "Schedule"}
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            {language === "es"
              ? "Confirma asistencia a los próximos eventos"
              : "Confirm attendance for upcoming events"}
          </VuiTypography>
        </VuiBox>

        {loading ? (
          <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
        ) : events.length === 0 ? (
          <Card>
            <VuiBox p={5} textAlign="center">
              <VuiTypography variant="h2" mb={2}>
                📅
              </VuiTypography>
              <VuiTypography variant="h5" color="white">
                {language === "es" ? "No hay eventos programados" : "No upcoming events"}
              </VuiTypography>
            </VuiBox>
          </Card>
        ) : (
          <VuiBox>
            {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
              <VuiBox key={dateKey} mb={3}>
                <VuiTypography variant="h6" color="info" mb={2}>
                  {formatDate(dateEvents[0].start_time)}
                </VuiTypography>

                {dateEvents.map((event) => {
                  const typeInfo = getEventTypeInfo(event.event_type);
                  const currentRsvp = rsvps[event.id];

                  return (
                    <Card key={event.id} sx={{ mb: 2 }}>
                      <VuiBox p={3}>
                        <Grid container spacing={2} alignItems="center">
                          {/* Event Info */}
                          <Grid item xs={12} md={7}>
                            <VuiBox display="flex" alignItems="flex-start" gap={2}>
                              <VuiBox
                                sx={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: "12px",
                                  background: `${typeInfo.color}20`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "24px",
                                }}
                              >
                                {typeInfo.icon}
                              </VuiBox>
                              <VuiBox>
                                <VuiTypography variant="h6" color="white" fontWeight="bold">
                                  {event.title}
                                </VuiTypography>
                                <VuiBox display="flex" alignItems="center" gap={1} mt={0.5}>
                                  <IoTime color="#0075FF" size={14} />
                                  <VuiTypography variant="caption" color="text">
                                    {formatTime(event.start_time)}
                                    {event.end_time && ` - ${formatTime(event.end_time)}`}
                                  </VuiTypography>
                                </VuiBox>
                                {event.location && (
                                  <VuiBox display="flex" alignItems="center" gap={1} mt={0.5}>
                                    <IoLocation color="#0075FF" size={14} />
                                    <VuiTypography variant="caption" color="text">
                                      {event.location}
                                    </VuiTypography>
                                  </VuiBox>
                                )}
                              </VuiBox>
                            </VuiBox>
                          </Grid>

                          {/* RSVP Buttons */}
                          <Grid item xs={12} md={5}>
                            <VuiBox display="flex" gap={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                              <VuiButton
                                color={currentRsvp === "confirmed" ? "success" : "secondary"}
                                variant={currentRsvp === "confirmed" ? "contained" : "outlined"}
                                size="small"
                                onClick={() => handleRsvp(event.id, "confirmed")}
                                startIcon={<IoCheckmarkCircle />}
                              >
                                {language === "es" ? "Sí" : "Yes"}
                              </VuiButton>
                              <VuiButton
                                color={currentRsvp === "declined" ? "error" : "secondary"}
                                variant={currentRsvp === "declined" ? "contained" : "outlined"}
                                size="small"
                                onClick={() => handleRsvp(event.id, "declined")}
                                startIcon={<IoCloseCircle />}
                              >
                                {language === "es" ? "No" : "No"}
                              </VuiButton>
                              <VuiButton
                                color={currentRsvp === "maybe" ? "warning" : "secondary"}
                                variant={currentRsvp === "maybe" ? "contained" : "outlined"}
                                size="small"
                                onClick={() => handleRsvp(event.id, "maybe")}
                              >
                                {language === "es" ? "Quizás" : "Maybe"}
                              </VuiButton>
                            </VuiBox>
                          </Grid>
                        </Grid>

                        {event.notes && (
                          <VuiBox
                            mt={2}
                            p={2}
                            sx={{ background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px" }}
                          >
                            <VuiTypography variant="caption" color="text">
                              {event.notes}
                            </VuiTypography>
                          </VuiBox>
                        )}
                      </VuiBox>
                    </Card>
                  );
                })}
              </VuiBox>
            ))}
          </VuiBox>
        )}

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default ParentSchedule;

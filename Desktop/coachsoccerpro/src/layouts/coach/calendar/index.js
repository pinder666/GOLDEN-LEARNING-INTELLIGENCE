import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Modal from "@mui/material/Modal";
import IconButton from "@mui/material/IconButton";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";
import VuiSwitch from "components/VuiSwitch";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Icons
import { IoAdd, IoClose, IoChevronBack, IoChevronForward, IoLocation, IoTime, IoPeople, IoTrash } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const EVENT_TYPES = [
  { value: "practice", labelEn: "Practice", labelEs: "Entrenamiento", color: "#0075FF", icon: "⚽" },
  { value: "game", labelEn: "Game", labelEs: "Partido", color: "#FF6B6B", icon: "🏆" },
  { value: "tournament", labelEn: "Tournament", labelEs: "Torneo", color: "#FFD93D", icon: "🎯" },
  { value: "meeting", labelEn: "Team Meeting", labelEs: "Reunión", color: "#6BCB77", icon: "👥" },
  { value: "other", labelEn: "Other", labelEs: "Otro", color: "#9D4EDD", icon: "📅" },
];

function CoachCalendar() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const { teamData, coachData } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Create event form
  const [eventForm, setEventForm] = useState({
    title: "",
    event_type: "practice",
    location: "",
    start_time: "",
    end_time: "",
    notes: "",
    is_recurring: false,
    recurrence_pattern: "weekly",
  });

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id) {
      fetchEvents();
    }
  }, [teamData, currentDate]);

  const fetchEvents = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          rsvps:event_rsvps(
            id,
            status,
            player:players(id, first_name, last_name)
          )
        `)
        .eq("team_id", teamData.id)
        .gte("start_time", startOfMonth.toISOString())
        .lte("start_time", endOfMonth.toISOString())
        .order("start_time");

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!eventForm.title || !eventForm.start_time) {
      return;
    }

    try {
      const { error } = await supabase.from("events").insert([
        {
          team_id: teamData.id,
          created_by_coach_id: coachData.id,
          title: eventForm.title,
          event_type: eventForm.event_type,
          location: eventForm.location || null,
          start_time: eventForm.start_time,
          end_time: eventForm.end_time || null,
          notes: eventForm.notes || null,
          is_recurring: eventForm.is_recurring,
          recurrence_pattern: eventForm.is_recurring ? eventForm.recurrence_pattern : null,
        },
      ]);

      if (error) throw error;

      setShowCreateModal(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm(language === "es" ? "¿Eliminar este evento?" : "Delete this event?")) {
      return;
    }

    try {
      await supabase.from("events").delete().eq("id", eventId);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: "",
      event_type: "practice",
      location: "",
      start_time: "",
      end_time: "",
      notes: "",
      is_recurring: false,
      recurrence_pattern: "weekly",
    });
  };

  const openCreateModal = (date = null) => {
    if (date) {
      const dateStr = date.toISOString().split("T")[0];
      setEventForm((prev) => ({
        ...prev,
        start_time: `${dateStr}T09:00`,
        end_time: `${dateStr}T10:30`,
      }));
    }
    setShowCreateModal(true);
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Previous month days
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getEventTypeInfo = (type) => {
    return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[4];
  };

  const monthNames = language === "es"
    ? ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayNames = language === "es"
    ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              {t("coach:calendar.title")}
            </VuiTypography>
          </VuiBox>
          <VuiButton color="info" onClick={() => openCreateModal()} startIcon={<IoAdd />}>
            {t("coach:calendar.createEvent")}
          </VuiButton>
        </VuiBox>

        <Grid container spacing={3}>
          {/* Calendar */}
          <Grid item xs={12} lg={8}>
            <Card>
              <VuiBox p={3}>
                {/* Month Navigation */}
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <IconButton
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  >
                    <IoChevronBack color="white" />
                  </IconButton>
                  <VuiTypography variant="h5" color="white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </VuiTypography>
                  <IconButton
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  >
                    <IoChevronForward color="white" />
                  </IconButton>
                </VuiBox>

                {/* Day Headers */}
                <Grid container spacing={0.5} mb={1}>
                  {dayNames.map((day) => (
                    <Grid item xs={12 / 7} key={day}>
                      <VuiBox textAlign="center" py={1}>
                        <VuiTypography variant="caption" color="text" fontWeight="bold">
                          {day}
                        </VuiTypography>
                      </VuiBox>
                    </Grid>
                  ))}
                </Grid>

                {/* Calendar Grid */}
                <Grid container spacing={0.5}>
                  {days.map((day, index) => {
                    const dayEvents = getEventsForDate(day.date);
                    const isToday =
                      day.date.toDateString() === today.toDateString();
                    const isSelected =
                      selectedDate && day.date.toDateString() === selectedDate.toDateString();

                    return (
                      <Grid item xs={12 / 7} key={index}>
                        <VuiBox
                          onClick={() => {
                            setSelectedDate(day.date);
                            if (dayEvents.length === 0) {
                              openCreateModal(day.date);
                            }
                          }}
                          sx={{
                            minHeight: 80,
                            p: 1,
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: isSelected
                              ? "rgba(0, 117, 255, 0.3)"
                              : isToday
                              ? "rgba(0, 117, 255, 0.1)"
                              : day.isCurrentMonth
                              ? "rgba(255, 255, 255, 0.03)"
                              : "transparent",
                            border: isToday ? "1px solid #0075FF" : "1px solid transparent",
                            opacity: day.isCurrentMonth ? 1 : 0.4,
                            "&:hover": {
                              background: "rgba(255, 255, 255, 0.08)",
                            },
                          }}
                        >
                          <VuiTypography
                            variant="caption"
                            color={isToday ? "info" : "white"}
                            fontWeight={isToday ? "bold" : "regular"}
                          >
                            {day.date.getDate()}
                          </VuiTypography>

                          {/* Event dots */}
                          <VuiBox mt={0.5}>
                            {dayEvents.slice(0, 3).map((event) => {
                              const typeInfo = getEventTypeInfo(event.event_type);
                              return (
                                <VuiBox
                                  key={event.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                  }}
                                  sx={{
                                    background: typeInfo.color,
                                    borderRadius: "4px",
                                    px: 0.5,
                                    py: 0.25,
                                    mb: 0.25,
                                    overflow: "hidden",
                                  }}
                                >
                                  <VuiTypography
                                    variant="caption"
                                    color="white"
                                    sx={{ fontSize: "10px" }}
                                    noWrap
                                  >
                                    {typeInfo.icon} {event.title}
                                  </VuiTypography>
                                </VuiBox>
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <VuiTypography variant="caption" color="text" sx={{ fontSize: "10px" }}>
                                +{dayEvents.length - 3} {language === "es" ? "más" : "more"}
                              </VuiTypography>
                            )}
                          </VuiBox>
                        </VuiBox>
                      </Grid>
                    );
                  })}
                </Grid>
              </VuiBox>
            </Card>
          </Grid>

          {/* Upcoming Events Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" mb={2}>
                  {language === "es" ? "Próximos Eventos" : "Upcoming Events"}
                </VuiTypography>

                {loading ? (
                  <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
                ) : events.filter((e) => new Date(e.start_time) >= today).length === 0 ? (
                  <VuiBox textAlign="center" py={3}>
                    <VuiTypography variant="h2" mb={1}>
                      📅
                    </VuiTypography>
                    <VuiTypography variant="body2" color="text">
                      {t("coach:calendar.noEvents")}
                    </VuiTypography>
                  </VuiBox>
                ) : (
                  <VuiBox>
                    {events
                      .filter((e) => new Date(e.start_time) >= today)
                      .slice(0, 5)
                      .map((event) => {
                        const typeInfo = getEventTypeInfo(event.event_type);
                        const confirmed = event.rsvps?.filter((r) => r.status === "confirmed").length || 0;

                        return (
                          <VuiBox
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            sx={{
                              p: 2,
                              mb: 1,
                              borderRadius: "12px",
                              background: "rgba(255, 255, 255, 0.05)",
                              borderLeft: `4px solid ${typeInfo.color}`,
                              cursor: "pointer",
                              "&:hover": {
                                background: "rgba(255, 255, 255, 0.08)",
                              },
                            }}
                          >
                            <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start">
                              <VuiBox>
                                <VuiTypography variant="button" color="white" fontWeight="bold">
                                  {typeInfo.icon} {event.title}
                                </VuiTypography>
                                <VuiTypography variant="caption" color="text" display="block">
                                  {formatDate(event.start_time)}
                                </VuiTypography>
                                <VuiTypography variant="caption" color="text">
                                  {formatTime(event.start_time)}
                                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                                </VuiTypography>
                              </VuiBox>
                              {confirmed > 0 && (
                                <VuiBox
                                  sx={{
                                    background: "rgba(0, 255, 0, 0.1)",
                                    borderRadius: "8px",
                                    px: 1,
                                    py: 0.5,
                                  }}
                                >
                                  <VuiTypography variant="caption" color="success">
                                    {confirmed} <IoPeople size={12} />
                                  </VuiTypography>
                                </VuiBox>
                              )}
                            </VuiBox>
                          </VuiBox>
                        );
                      })}
                  </VuiBox>
                )}
              </VuiBox>
            </Card>

            {/* Event Type Legend */}
            <Card sx={{ mt: 2 }}>
              <VuiBox p={2}>
                <VuiTypography variant="caption" color="text" fontWeight="bold" mb={1} display="block">
                  {language === "es" ? "Tipos de Evento" : "Event Types"}
                </VuiTypography>
                <VuiBox display="flex" flexWrap="wrap" gap={1}>
                  {EVENT_TYPES.map((type) => (
                    <VuiBox
                      key={type.value}
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      sx={{
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "6px",
                        px: 1,
                        py: 0.5,
                      }}
                    >
                      <VuiBox
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: type.color,
                        }}
                      />
                      <VuiTypography variant="caption" color="text">
                        {language === "es" ? type.labelEs : type.labelEn}
                      </VuiTypography>
                    </VuiBox>
                  ))}
                </VuiBox>
              </VuiBox>
            </Card>
          </Grid>
        </Grid>

        {/* Create Event Modal */}
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <VuiBox
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "90%", md: 500 },
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <Card>
              <VuiBox p={3}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <VuiTypography variant="h5" color="white">
                    {t("coach:calendar.createEvent")}
                  </VuiTypography>
                  <IconButton onClick={() => setShowCreateModal(false)}>
                    <IoClose color="white" />
                  </IconButton>
                </VuiBox>

                <VuiBox component="form" onSubmit={handleCreateEvent}>
                  {/* Event Type */}
                  <VuiBox mb={2}>
                    <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                      {t("coach:calendar.eventType")}
                    </VuiTypography>
                    <VuiBox display="flex" flexWrap="wrap" gap={1}>
                      {EVENT_TYPES.map((type) => (
                        <VuiBox
                          key={type.value}
                          onClick={() => setEventForm({ ...eventForm, event_type: type.value })}
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: "8px",
                            cursor: "pointer",
                            background:
                              eventForm.event_type === type.value
                                ? type.color
                                : "rgba(255, 255, 255, 0.1)",
                            border:
                              eventForm.event_type === type.value
                                ? `2px solid ${type.color}`
                                : "2px solid transparent",
                          }}
                        >
                          <VuiTypography variant="button" color="white">
                            {type.icon} {language === "es" ? type.labelEs : type.labelEn}
                          </VuiTypography>
                        </VuiBox>
                      ))}
                    </VuiBox>
                  </VuiBox>

                  {/* Title */}
                  <VuiBox mb={2}>
                    <VuiTypography variant="button" color="white" fontWeight="medium">
                      {language === "es" ? "Título" : "Title"} *
                    </VuiTypography>
                    <VuiInput
                      placeholder={
                        eventForm.event_type === "practice"
                          ? language === "es"
                            ? "Entrenamiento Semanal"
                            : "Weekly Practice"
                          : eventForm.event_type === "game"
                          ? language === "es"
                            ? "vs. Eagles FC"
                            : "vs. Eagles FC"
                          : ""
                      }
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      required
                    />
                  </VuiBox>

                  {/* Location */}
                  <VuiBox mb={2}>
                    <VuiTypography variant="button" color="white" fontWeight="medium">
                      {t("coach:calendar.location")}
                    </VuiTypography>
                    <VuiInput
                      placeholder={language === "es" ? "Campo de fútbol principal" : "Main soccer field"}
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      icon={{ component: <IoLocation />, direction: "left" }}
                    />
                  </VuiBox>

                  {/* Date & Time */}
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6}>
                      <VuiTypography variant="button" color="white" fontWeight="medium">
                        {t("coach:calendar.startTime")} *
                      </VuiTypography>
                      <VuiInput
                        type="datetime-local"
                        value={eventForm.start_time}
                        onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <VuiTypography variant="button" color="white" fontWeight="medium">
                        {t("coach:calendar.endTime")}
                      </VuiTypography>
                      <VuiInput
                        type="datetime-local"
                        value={eventForm.end_time}
                        onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                      />
                    </Grid>
                  </Grid>

                  {/* Notes */}
                  <VuiBox mb={2}>
                    <VuiTypography variant="button" color="white" fontWeight="medium">
                      {t("coach:calendar.notes")}
                    </VuiTypography>
                    <VuiInput
                      multiline
                      rows={3}
                      placeholder={
                        language === "es"
                          ? "Traer agua y zapatos de tacos"
                          : "Bring water and cleats"
                      }
                      value={eventForm.notes}
                      onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                    />
                  </VuiBox>

                  {/* Recurring */}
                  <VuiBox mb={3}>
                    <VuiBox display="flex" alignItems="center" justifyContent="space-between">
                      <VuiTypography variant="button" color="white" fontWeight="medium">
                        {t("coach:calendar.recurring")}
                      </VuiTypography>
                      <VuiSwitch
                        checked={eventForm.is_recurring}
                        onChange={(e) => setEventForm({ ...eventForm, is_recurring: e.target.checked })}
                      />
                    </VuiBox>
                    {eventForm.is_recurring && (
                      <VuiBox display="flex" gap={1} mt={1}>
                        <VuiButton
                          variant={eventForm.recurrence_pattern === "weekly" ? "contained" : "outlined"}
                          color="info"
                          size="small"
                          onClick={() => setEventForm({ ...eventForm, recurrence_pattern: "weekly" })}
                        >
                          {t("coach:calendar.weekly")}
                        </VuiButton>
                        <VuiButton
                          variant={eventForm.recurrence_pattern === "biweekly" ? "contained" : "outlined"}
                          color="info"
                          size="small"
                          onClick={() => setEventForm({ ...eventForm, recurrence_pattern: "biweekly" })}
                        >
                          {t("coach:calendar.biweekly")}
                        </VuiButton>
                      </VuiBox>
                    )}
                  </VuiBox>

                  {/* Actions */}
                  <VuiBox display="flex" justifyContent="flex-end" gap={2}>
                    <VuiButton color="secondary" onClick={() => setShowCreateModal(false)}>
                      {t("common:buttons.cancel")}
                    </VuiButton>
                    <VuiButton color="info" type="submit">
                      {t("coach:calendar.createEvent")}
                    </VuiButton>
                  </VuiBox>
                </VuiBox>
              </VuiBox>
            </Card>
          </VuiBox>
        </Modal>

        {/* Event Details Modal */}
        <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)}>
          <VuiBox
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "90%", md: 450 },
            }}
          >
            <Card>
              <VuiBox p={3}>
                {selectedEvent && (
                  <>
                    <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <VuiBox>
                        <VuiTypography variant="h5" color="white">
                          {getEventTypeInfo(selectedEvent.event_type).icon} {selectedEvent.title}
                        </VuiTypography>
                        <VuiBox
                          sx={{
                            display: "inline-block",
                            px: 1,
                            py: 0.25,
                            mt: 0.5,
                            borderRadius: "4px",
                            background: getEventTypeInfo(selectedEvent.event_type).color,
                          }}
                        >
                          <VuiTypography variant="caption" color="white">
                            {language === "es"
                              ? getEventTypeInfo(selectedEvent.event_type).labelEs
                              : getEventTypeInfo(selectedEvent.event_type).labelEn}
                          </VuiTypography>
                        </VuiBox>
                      </VuiBox>
                      <VuiBox display="flex" gap={1}>
                        <IconButton onClick={() => handleDeleteEvent(selectedEvent.id)} size="small">
                          <IoTrash color="#f44336" />
                        </IconButton>
                        <IconButton onClick={() => setSelectedEvent(null)} size="small">
                          <IoClose color="white" />
                        </IconButton>
                      </VuiBox>
                    </VuiBox>

                    <VuiBox mb={2}>
                      <VuiBox display="flex" alignItems="center" gap={1} mb={1}>
                        <IoTime color="#0075FF" />
                        <VuiTypography variant="body2" color="white">
                          {formatDate(selectedEvent.start_time)}
                        </VuiTypography>
                      </VuiBox>
                      <VuiTypography variant="body2" color="text" ml={3}>
                        {formatTime(selectedEvent.start_time)}
                        {selectedEvent.end_time && ` - ${formatTime(selectedEvent.end_time)}`}
                      </VuiTypography>
                    </VuiBox>

                    {selectedEvent.location && (
                      <VuiBox display="flex" alignItems="center" gap={1} mb={2}>
                        <IoLocation color="#0075FF" />
                        <VuiTypography variant="body2" color="white">
                          {selectedEvent.location}
                        </VuiTypography>
                      </VuiBox>
                    )}

                    {selectedEvent.notes && (
                      <VuiBox mb={2} p={2} sx={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px" }}>
                        <VuiTypography variant="body2" color="text">
                          {selectedEvent.notes}
                        </VuiTypography>
                      </VuiBox>
                    )}

                    {/* RSVP Status */}
                    {selectedEvent.rsvps && selectedEvent.rsvps.length > 0 && (
                      <VuiBox>
                        <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                          {t("coach:calendar.rsvpStatus")}
                        </VuiTypography>
                        <VuiBox display="flex" gap={2}>
                          <VuiBox textAlign="center">
                            <VuiTypography variant="h5" color="success">
                              {selectedEvent.rsvps.filter((r) => r.status === "confirmed").length}
                            </VuiTypography>
                            <VuiTypography variant="caption" color="text">
                              {language === "es" ? "Confirmados" : "Confirmed"}
                            </VuiTypography>
                          </VuiBox>
                          <VuiBox textAlign="center">
                            <VuiTypography variant="h5" color="warning">
                              {selectedEvent.rsvps.filter((r) => r.status === "pending").length}
                            </VuiTypography>
                            <VuiTypography variant="caption" color="text">
                              {language === "es" ? "Pendientes" : "Pending"}
                            </VuiTypography>
                          </VuiBox>
                          <VuiBox textAlign="center">
                            <VuiTypography variant="h5" color="error">
                              {selectedEvent.rsvps.filter((r) => r.status === "declined").length}
                            </VuiTypography>
                            <VuiTypography variant="caption" color="text">
                              {language === "es" ? "No pueden" : "Declined"}
                            </VuiTypography>
                          </VuiBox>
                        </VuiBox>
                      </VuiBox>
                    )}

                    <VuiBox mt={3}>
                      <VuiButton color="info" fullWidth onClick={() => setSelectedEvent(null)}>
                        {t("common:buttons.close")}
                      </VuiButton>
                    </VuiBox>
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

export default CoachCalendar;

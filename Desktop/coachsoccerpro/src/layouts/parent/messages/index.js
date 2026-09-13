import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Card from "@mui/material/Card";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Icons
import { IoPerson, IoPeople, IoSparkles } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

import { DEV_MODE } from "devMode";

const DEMO_MESSAGES = [
  {
    id: 1,
    message_type: "individual",
    subject: "Great progress this week!",
    body: "Hi! I wanted to let you know Marcus had an excellent week. His scanning before receiving the ball has improved noticeably — he's checking his shoulders 2-3 times before every touch now. Keep encouraging him at home!",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    was_ai_enhanced: true,
    sender: { user: { first_name: "Coach", last_name: "Rivera" } },
  },
  {
    id: 2,
    message_type: "team",
    subject: "Saturday's game - arrival time",
    body: "Team — please arrive at City Stadium by 8:15am Saturday for warm-up. Game kicks off at 9:00am sharp. Bring both jerseys and plenty of water. Let's go Thunder! ⚡",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    was_ai_enhanced: false,
    sender: { user: { first_name: "Coach", last_name: "Rivera" } },
  },
  {
    id: 3,
    message_type: "team",
    subject: "Practice moved to 5pm this Thursday",
    body: "Quick update: Thursday's practice is moved from 4pm to 5pm due to field maintenance. Same location. See everyone there!",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    was_ai_enhanced: false,
    sender: { user: { first_name: "Coach", last_name: "Rivera" } },
  },
];

function ParentMessages() {
  const { t, i18n } = useTranslation(["common"]);
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setMessages(DEMO_MESSAGES);
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      // Get parent info
      const { data: parentData } = await supabase
        .from("parents")
        .select("id, team_id")
        .eq("user_id", user.id)
        .single();

      if (!parentData) return;

      // Get messages for this parent (individual + team messages)
      const { data: messagesData } = await supabase
        .from("messages")
        .select(`
          *,
          sender:coaches(
            user:users(first_name, last_name)
          )
        `)
        .eq("team_id", parentData.team_id)
        .eq("status", "sent")
        .or(`recipient_parent_id.eq.${parentData.id},message_type.eq.team`)
        .order("created_at", { ascending: false });

      setMessages(messagesData || []);

      // Mark as read
      if (messagesData?.length > 0) {
        const unreadIds = messagesData.filter((m) => !m.read_at).map((m) => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .in("id", unreadIds);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return language === "es" ? "Ayer" : "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
        weekday: "long",
      });
    }
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {language === "es" ? "Mensajes" : "Messages"}
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            {language === "es" ? "Mensajes del entrenador" : "Messages from the coach"}
          </VuiTypography>
        </VuiBox>

        {loading ? (
          <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
        ) : messages.length === 0 ? (
          <Card>
            <VuiBox p={5} textAlign="center">
              <VuiTypography variant="h2" mb={2}>
                💬
              </VuiTypography>
              <VuiTypography variant="h5" color="white">
                {language === "es" ? "Sin mensajes" : "No messages yet"}
              </VuiTypography>
              <VuiTypography variant="body2" color="text">
                {language === "es"
                  ? "Los mensajes del entrenador aparecerán aquí"
                  : "Messages from the coach will appear here"}
              </VuiTypography>
            </VuiBox>
          </Card>
        ) : (
          <VuiBox>
            {messages.map((message) => (
              <Card key={message.id} sx={{ mb: 2 }}>
                <VuiBox p={3}>
                  {/* Header */}
                  <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <VuiBox display="flex" alignItems="center" gap={2}>
                      <VuiBox
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "10px",
                          background:
                            message.message_type === "team"
                              ? "linear-gradient(135deg, #0075FF 0%, #00D4FF 100%)"
                              : "linear-gradient(135deg, #6BCB77 0%, #4CAF50 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {message.message_type === "team" ? (
                          <IoPeople size={20} color="white" />
                        ) : (
                          <IoPerson size={20} color="white" />
                        )}
                      </VuiBox>
                      <VuiBox>
                        <VuiTypography variant="button" color="white" fontWeight="bold">
                          {message.sender?.user
                            ? `${message.sender.user.first_name} ${message.sender.user.last_name}`
                            : language === "es"
                            ? "Entrenador"
                            : "Coach"}
                        </VuiTypography>
                        <VuiTypography variant="caption" color="text" display="block">
                          {message.message_type === "team"
                            ? language === "es"
                              ? "Mensaje del equipo"
                              : "Team message"
                            : language === "es"
                            ? "Mensaje personal"
                            : "Personal message"}
                        </VuiTypography>
                      </VuiBox>
                    </VuiBox>
                    <VuiBox textAlign="right">
                      <VuiTypography variant="caption" color="text">
                        {formatDate(message.created_at)}
                      </VuiTypography>
                      {message.was_ai_enhanced && (
                        <VuiBox display="flex" alignItems="center" justifyContent="flex-end" gap={0.5} mt={0.5}>
                          <IoSparkles size={12} color="#0075FF" />
                        </VuiBox>
                      )}
                    </VuiBox>
                  </VuiBox>

                  {/* Subject */}
                  {message.subject && (
                    <VuiTypography variant="h6" color="white" mb={1}>
                      {message.subject}
                    </VuiTypography>
                  )}

                  {/* Body */}
                  <VuiBox
                    sx={{
                      p: 2,
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.03)",
                    }}
                  >
                    <VuiTypography variant="body2" color="white" sx={{ whiteSpace: "pre-wrap" }}>
                      {message.body}
                    </VuiTypography>
                  </VuiBox>
                </VuiBox>
              </Card>
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

export default ParentMessages;

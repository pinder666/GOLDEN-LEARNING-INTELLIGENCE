import { useState, useEffect, useRef } from "react";
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
import { IoMic, IoMicOff, IoClose, IoSend, IoPeople, IoPerson, IoSparkles, IoCheckmark } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";
import { templateMessage } from "services/localAgent";

function CoachMessages() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const { teamData, coachData } = useAuth();

  const [messages, setMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [recipient, setRecipient] = useState(null); // null = team, player object = individual
  const [messageText, setMessageText] = useState("");
  const [enhancedText, setEnhancedText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [sending, setSending] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id) {
      fetchMessagesAndPlayers();
    }
  }, [teamData]);

  const fetchMessagesAndPlayers = async () => {
    try {
      // Fetch sent messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(`
          *,
          recipient_player:players(id, first_name, last_name)
        `)
        .eq("sender_id", coachData.user_id)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Fetch players for recipient selection
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select(`
          *,
          parent:parents(
            id,
            email,
            user_id,
            user:users(first_name, last_name, email)
          )
        `)
        .eq("team_id", teamData.id)
        .eq("is_active", true)
        .order("first_name");

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Voice recording functions
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === "es" ? "Tu navegador no soporta reconocimiento de voz" : "Your browser doesn't support voice input");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === "es" ? "es-MX" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessageText(transcript);
      handleEnhance(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      clearInterval(timerRef.current);
    };

    recognition.onend = () => {
      setIsRecording(false);
      clearInterval(timerRef.current);
    };

    recognition.start();
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleEnhance = (text = messageText) => {
    if (!String(text).trim()) return;
    const enhanced = templateMessage(
      recipient?.first_name || "",
      text,
      coachData?.first_name || coachData?.display_name || "",
      language
    );
    setEnhancedText(enhanced);
    setUseEnhanced(true);
  };

  const getParentEmail = (player) => player?.parent?.user?.email || player?.parent?.email || null;

  const handleSend = async () => {
    const finalText = useEnhanced && enhancedText ? enhancedText : messageText;
    if (!finalText.trim()) return;

    // Who is this actually reaching? Check before we log anything as "sent".
    const targets = recipient ? [recipient] : players;
    const emails = [...new Set(targets.map(getParentEmail).filter(Boolean))];
    const missing = targets.length - emails.length;

    if (emails.length === 0) {
      alert(
        language === "es"
          ? "Ningún padre tiene un correo guardado todavía. Agrégalo desde la Plantilla."
          : "No parent has an email on file yet. Add one from the Roster."
      );
      return;
    }

    setSending(true);
    try {
      const subject = recipient
        ? `${language === "es" ? "Mensaje para" : "Message for"} ${recipient.first_name}`
        : language === "es"
        ? "Mensaje del Equipo"
        : "Team Message";

      // Insert message (the coach's own record of what was sent)
      const messageData = {
        sender_id: coachData.user_id,
        recipient_id: recipient?.parent?.user_id || null,
        recipient_player_id: recipient?.id || null,
        message_type: recipient ? "individual" : "team",
        subject,
        body: finalText,
        transcribed_text: messageText !== finalText ? messageText : null,
        ai_enhanced: !!(useEnhanced && enhancedText),
      };

      const { error } = await supabase.from("messages").insert([messageData]);
      if (error) throw error;

      // Actual delivery: open the coach's own email client, pre-addressed and ready.
      // No backend, no API key, no extra account to manage.
      const mailto = `mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(finalText)}`;
      window.location.href = mailto;

      if (missing > 0) {
        alert(
          language === "es"
            ? `Se abrió tu correo para ${emails.length}. ${missing} padre(s) sin correo guardado no lo recibieron.`
            : `Opened your email for ${emails.length}. ${missing} parent(s) with no email on file didn't get it.`
        );
      }

      // Reset form
      setShowCompose(false);
      resetComposeForm();
      fetchMessagesAndPlayers();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const resetComposeForm = () => {
    setRecipient(null);
    setMessageText("");
    setEnhancedText("");
    setUseEnhanced(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0075FF&color=fff&size=100`;

  // Every message the compose flow creates is sent immediately — there's no
  // draft-saving path in the UI, so drafts is honestly always empty for now.
  const sentMessages = messages;
  const draftMessages = [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {t("coach:messages.title")}
          </VuiTypography>
          <VuiButton color="info" onClick={() => setShowCompose(true)} startIcon={<IoMic />}>
            {t("coach:messages.compose")}
          </VuiButton>
        </VuiBox>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <VuiBox px={2}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              sx={{
                "& .MuiTab-root": { color: "rgba(255,255,255,0.7)" },
                "& .Mui-selected": { color: "#0075FF" },
                "& .MuiTabs-indicator": { backgroundColor: "#0075FF" },
              }}
            >
              <Tab label={`${t("coach:messages.sent")} (${sentMessages.length})`} />
              <Tab label={`${t("coach:messages.drafts")} (${draftMessages.length})`} />
            </Tabs>
          </VuiBox>
        </Card>

        {/* Messages List */}
        <Card>
          <VuiBox p={3}>
            {loading ? (
              <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
            ) : (activeTab === 0 ? sentMessages : draftMessages).length === 0 ? (
              <VuiBox textAlign="center" py={5}>
                <VuiTypography variant="h2" mb={2}>
                  💬
                </VuiTypography>
                <VuiTypography variant="h5" color="white" mb={1}>
                  {language === "es" ? "Sin mensajes" : "No messages yet"}
                </VuiTypography>
                <VuiTypography variant="body2" color="text" mb={3}>
                  {language === "es"
                    ? "Envía tu primer mensaje con voz o texto"
                    : "Send your first message with voice or text"}
                </VuiTypography>
                <VuiButton color="info" onClick={() => setShowCompose(true)}>
                  {t("coach:messages.compose")}
                </VuiButton>
              </VuiBox>
            ) : (
              <VuiBox>
                {(activeTab === 0 ? sentMessages : draftMessages).map((message) => (
                  <VuiBox
                    key={message.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.03)",
                      "&:hover": { background: "rgba(255, 255, 255, 0.06)" },
                    }}
                  >
                    <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start">
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
                            {message.message_type === "team"
                              ? language === "es"
                                ? "Equipo Completo"
                                : "Entire Team"
                              : message.recipient_player
                              ? `${message.recipient_player.first_name} ${message.recipient_player.last_name}`
                              : language === "es"
                              ? "Padre/Madre"
                              : "Parent"}
                          </VuiTypography>
                          <VuiTypography
                            variant="body2"
                            color="text"
                            sx={{
                              maxWidth: 400,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {message.body}
                          </VuiTypography>
                        </VuiBox>
                      </VuiBox>
                      <VuiBox textAlign="right">
                        <VuiTypography variant="caption" color="text">
                          {formatDate(message.created_at)}
                        </VuiTypography>
                        {message.ai_enhanced && (
                          <VuiBox display="flex" alignItems="center" justifyContent="flex-end" gap={0.5} mt={0.5}>
                            <IoSparkles size={12} color="#0075FF" />
                            <VuiTypography variant="caption" color="info">
                              AI
                            </VuiTypography>
                          </VuiBox>
                        )}
                      </VuiBox>
                    </VuiBox>
                  </VuiBox>
                ))}
              </VuiBox>
            )}
          </VuiBox>
        </Card>

        {/* Compose Modal */}
        <Modal open={showCompose} onClose={() => setShowCompose(false)}>
          <VuiBox
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "95%", md: 600 },
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <Card>
              <VuiBox p={3}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <VuiTypography variant="h5" color="white">
                    {t("coach:messages.newMessage")}
                  </VuiTypography>
                  <IconButton onClick={() => setShowCompose(false)}>
                    <IoClose color="white" />
                  </IconButton>
                </VuiBox>

                {/* Recipient Selection */}
                <VuiBox mb={3}>
                  <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                    {t("coach:messages.selectRecipient")}
                  </VuiTypography>
                  <VuiBox display="flex" flexWrap="wrap" gap={1}>
                    <VuiBox
                      onClick={() => setRecipient(null)}
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: recipient === null ? "#0075FF" : "rgba(255, 255, 255, 0.1)",
                        border: recipient === null ? "2px solid #0075FF" : "2px solid transparent",
                      }}
                    >
                      <VuiTypography variant="button" color="white">
                        <IoPeople size={16} style={{ marginRight: 4 }} />
                        {t("coach:messages.sendToTeam")}
                      </VuiTypography>
                    </VuiBox>
                    {players.map((player) => (
                      <VuiBox
                        key={player.id}
                        onClick={() => setRecipient(player)}
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: "8px",
                          cursor: "pointer",
                          background:
                            recipient?.id === player.id ? "#0075FF" : "rgba(255, 255, 255, 0.1)",
                          border:
                            recipient?.id === player.id ? "2px solid #0075FF" : "2px solid transparent",
                          opacity: getParentEmail(player) ? 1 : 0.5,
                        }}
                      >
                        <VuiTypography variant="button" color="white">
                          {player.first_name} {player.last_name}
                          {!getParentEmail(player) && (
                            <VuiTypography component="span" variant="caption" color="warning" ml={1}>
                              ({language === "es" ? "sin correo" : "no email"})
                            </VuiTypography>
                          )}
                        </VuiTypography>
                      </VuiBox>
                    ))}
                  </VuiBox>
                </VuiBox>

                {/* Voice Recording */}
                <VuiBox mb={3}>
                  <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                    {t("coach:messages.voiceNote")}
                  </VuiTypography>
                  <VuiBox
                    onClick={isRecording ? stopRecording : startRecording}
                    sx={{
                      p: 3,
                      borderRadius: "16px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: isRecording
                        ? "linear-gradient(135deg, #f44336 0%, #ff5722 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: "2px dashed",
                      borderColor: isRecording ? "#f44336" : "rgba(255, 255, 255, 0.2)",
                      transition: "all 0.3s",
                      "&:hover": {
                        background: isRecording
                          ? "linear-gradient(135deg, #d32f2f 0%, #e64a19 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    {isTranscribing ? (
                      <>
                        <VuiTypography variant="h5" color="white" mb={1}>
                          🎧
                        </VuiTypography>
                        <VuiTypography color="white">{t("coach:voice.processing")}</VuiTypography>
                      </>
                    ) : isRecording ? (
                      <>
                        <IoMicOff size={32} color="white" />
                        <VuiTypography variant="h6" color="white" mt={1}>
                          {formatTime(recordingTime)}
                        </VuiTypography>
                        <VuiTypography variant="caption" color="white">
                          {t("coach:voice.tapToStop")}
                        </VuiTypography>
                      </>
                    ) : (
                      <>
                        <IoMic size={32} color="#0075FF" />
                        <VuiTypography color="text" mt={1}>
                          {t("coach:messages.recordVoice")}
                        </VuiTypography>
                      </>
                    )}
                  </VuiBox>
                </VuiBox>

                {/* Message Text */}
                <VuiBox mb={2}>
                  <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                    {t("coach:voice.originalText")}
                  </VuiTypography>
                  <VuiInput
                    multiline
                    rows={3}
                    placeholder={
                      language === "es"
                        ? "Escribe o graba tu mensaje..."
                        : "Type or record your message..."
                    }
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      setUseEnhanced(false);
                    }}
                  />
                </VuiBox>

                {/* AI Enhance Button */}
                {messageText && !enhancedText && (
                  <VuiBox mb={2}>
                    <VuiButton
                      color="info"
                      variant="outlined"
                      fullWidth
                      onClick={() => handleEnhance()}
                      disabled={isEnhancing}
                      startIcon={<IoSparkles />}
                    >
                      {isEnhancing ? t("coach:messages.aiPolishing") : t("coach:messages.aiPolish")}
                    </VuiButton>
                  </VuiBox>
                )}

                {/* Enhanced Text */}
                {enhancedText && (
                  <VuiBox mb={3}>
                    <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                      {t("coach:voice.enhancedText")} <IoSparkles size={14} color="#0075FF" />
                    </VuiTypography>
                    <VuiBox
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        background: useEnhanced
                          ? "rgba(0, 117, 255, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                        border: useEnhanced ? "2px solid #0075FF" : "2px solid transparent",
                      }}
                    >
                      <VuiTypography variant="body2" color="white">
                        {enhancedText}
                      </VuiTypography>
                    </VuiBox>
                    <VuiBox display="flex" gap={1} mt={2}>
                      <VuiButton
                        color={useEnhanced ? "secondary" : "info"}
                        variant={useEnhanced ? "outlined" : "contained"}
                        size="small"
                        onClick={() => setUseEnhanced(false)}
                        startIcon={!useEnhanced ? <IoCheckmark /> : null}
                      >
                        {t("coach:voice.useOriginal")}
                      </VuiButton>
                      <VuiButton
                        color={useEnhanced ? "info" : "secondary"}
                        variant={useEnhanced ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setUseEnhanced(true)}
                        startIcon={useEnhanced ? <IoCheckmark /> : null}
                      >
                        {t("coach:voice.useEnhanced")}
                      </VuiButton>
                    </VuiBox>
                  </VuiBox>
                )}

                {/* Send Button */}
                <VuiButton
                  color="info"
                  fullWidth
                  onClick={handleSend}
                  disabled={sending || (!messageText && !enhancedText)}
                  startIcon={<IoSend />}
                >
                  {sending ? t("common:status.sending") : t("coach:messages.sendNow")}
                </VuiButton>
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

export default CoachMessages;

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

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
import { IoSave, IoColorPalette, IoLanguage, IoNotifications, IoDiamond } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";
import { DEV_MODE } from "devMode";

// ── PIPE A: the coach's team code (lean, per depth-cap ruling) ──
// Unambiguous alphabet — no 0/O/1/I
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeCode(teamName) {
  const slug = (teamName || "TEAM").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8) || "TEAM";
  let tail = "";
  for (let i = 0; i < 4; i++) tail += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return `${slug}-${tail}`;
}

function TeamCodeCard({ teamName, coachData, language }) {
  const [code, setCode] = useState(() => (DEV_MODE ? localStorage.getItem("csp_team_code") || "" : ""));
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (DEV_MODE || !coachData?.id) return;
    supabase
      .from("coach_codes")
      .select("code")
      .eq("coach_id", coachData.id)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => data && setCode(data.code));
  }, [coachData]);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    const next = makeCode(teamName);
    try {
      if (DEV_MODE) {
        localStorage.setItem("csp_team_code", next);
      } else {
        const { error } = await supabase
          .from("coach_codes")
          .insert([{ code: next, coach_id: coachData.id, active: true }]);
        if (error) throw error; // old code auto-deactivated by DB trigger
      }
      setCode(next);
    } catch (e) {
      console.error("Code generation failed:", e);
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card>
      <VuiBox p={3}>
        <VuiTypography variant="h6" color="white" mb={1}>
          {language === "es" ? "Tu Código de Equipo" : "Your Team Code"}
        </VuiTypography>
        <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2 }}>
          {language === "es"
            ? "Los padres lo usan al registrarse en SoccerMental: los conecta a tu plantilla y les da la tarifa de equipo. Cada familia activa reduce tu cuota mensual."
            : "Parents use it when signing up for SoccerMental: it attaches them to your roster and gets them the team rate. Every active family lowers your monthly fee."}
        </VuiTypography>
        {code ? (
          <VuiBox display="flex" gap="10px" alignItems="center" flexWrap="wrap">
            <span style={{
              background: "rgba(249,115,22,.12)", border: "1px solid rgba(249,115,22,.4)",
              color: "#f97316", borderRadius: 10, padding: "10px 18px",
              fontSize: 18, fontWeight: 800, letterSpacing: ".08em", fontFamily: "Inter,monospace",
            }}>
              {code}
            </span>
            <VuiButton color="info" size="small" onClick={copy}>
              {copied ? (language === "es" ? "✓ Copiado" : "✓ Copied") : (language === "es" ? "Copiar" : "Copy")}
            </VuiButton>
            <VuiButton color="secondary" size="small" onClick={generate} disabled={busy}>
              {language === "es" ? "Regenerar" : "Regenerate"}
            </VuiButton>
          </VuiBox>
        ) : (
          <VuiButton color="success" onClick={generate} disabled={busy}>
            {language === "es" ? "Generar mi código" : "Generate my code"}
          </VuiButton>
        )}
        {code && (
          <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: 1.5, fontSize: 10.5 }}>
            {language === "es"
              ? "Regenerar desactiva el código anterior — las familias ya conectadas no se ven afectadas."
              : "Regenerating deactivates the old code — families already attached are unaffected."}
          </VuiTypography>
        )}
      </VuiBox>
    </Card>
  );
}

function CoachSettings() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const { teamData, coachData, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Team settings
  const [teamName, setTeamName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0075FF");
  const [secondaryColor, setSecondaryColor] = useState("#00D4FF");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // White label
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);
  const [customLogo, setCustomLogo] = useState(null);

  // Subscription
  const [subscriptionPlan, setSubscriptionPlan] = useState("standard");

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id) {
      loadSettings();
    }
  }, [teamData]);

  const loadSettings = async () => {
    try {
      setTeamName(teamData.name || "");
      setPrimaryColor(teamData.primary_color || "#0075FF");
      setSecondaryColor(teamData.secondary_color || "#00D4FF");
      setIsWhiteLabel(teamData.is_white_label || false);
      setCustomLogo(teamData.custom_logo_url || null);

      // Load coach preferences
      if (coachData?.id) {
        const { data } = await supabase
          .from("coaches")
          .select("email_notifications, push_notifications, subscription_plan")
          .eq("id", coachData.id)
          .single();

        if (data) {
          setEmailNotifications(data.email_notifications ?? true);
          setPushNotifications(data.push_notifications ?? true);
          setSubscriptionPlan(data.subscription_plan || "standard");
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      // Update team settings
      await supabase
        .from("teams")
        .update({
          name: teamName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          is_white_label: isWhiteLabel,
        })
        .eq("id", teamData.id);

      // Update coach preferences
      await supabase
        .from("coaches")
        .update({
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
        })
        .eq("id", coachData.id);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const handleUpgradePlan = () => {
    // In production, this would redirect to Stripe checkout
    alert(
      language === "es"
        ? "La actualización del plan se configurará pronto."
        : "Plan upgrade will be set up soon."
    );
  };

  const colorPresets = [
    { name: "Blue", primary: "#0075FF", secondary: "#00D4FF" },
    { name: "Green", primary: "#f97316", secondary: "#8BC34A" },
    { name: "Purple", primary: "#9C27B0", secondary: "#E040FB" },
    { name: "Orange", primary: "#FF9800", secondary: "#FFEB3B" },
    { name: "Red", primary: "#f44336", secondary: "#FF5722" },
    { name: "Teal", primary: "#009688", secondary: "#4DB6AC" },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {t("coach:settings.title")}
          </VuiTypography>
          <VuiButton
            color={saved ? "success" : "info"}
            onClick={handleSave}
            disabled={saving}
            startIcon={<IoSave />}
          >
            {saving
              ? t("common:status.saving")
              : saved
              ? language === "es"
                ? "¡Guardado!"
                : "Saved!"
              : t("common:buttons.save")}
          </VuiButton>
        </VuiBox>

        <Grid container spacing={3}>
          {/* PIPE A — Team Code (SoccerMental attribution) */}
          <Grid item xs={12}>
            <TeamCodeCard teamName={teamName || teamData?.name} coachData={coachData} language={language} />
          </Grid>

          {/* Team Profile */}
          <Grid item xs={12} lg={6}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" mb={3}>
                  {t("coach:settings.teamProfile")}
                </VuiTypography>

                <VuiBox mb={3}>
                  <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                    {t("coach:settings.teamName")}
                  </VuiTypography>
                  <VuiInput
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={language === "es" ? "FC Barcelona U12" : "FC Barcelona U12"}
                  />
                </VuiBox>

                <VuiBox mb={3}>
                  <VuiTypography variant="button" color="white" fontWeight="medium" mb={2} display="block">
                    <IoColorPalette size={16} style={{ marginRight: 8 }} />
                    {language === "es" ? "Colores del Equipo" : "Team Colors"}
                  </VuiTypography>

                  <VuiBox display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {colorPresets.map((preset) => (
                      <VuiBox
                        key={preset.name}
                        onClick={() => {
                          setPrimaryColor(preset.primary);
                          setSecondaryColor(preset.secondary);
                        }}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "10px",
                          background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
                          cursor: "pointer",
                          border:
                            primaryColor === preset.primary
                              ? "3px solid white"
                              : "3px solid transparent",
                          transition: "all 0.2s",
                          "&:hover": {
                            transform: "scale(1.1)",
                          },
                        }}
                      />
                    ))}
                  </VuiBox>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <VuiTypography variant="caption" color="text">
                        {t("coach:settings.primaryColor")}
                      </VuiTypography>
                      <VuiInput
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        sx={{ height: 40 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <VuiTypography variant="caption" color="text">
                        {t("coach:settings.secondaryColor")}
                      </VuiTypography>
                      <VuiInput
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        sx={{ height: 40 }}
                      />
                    </Grid>
                  </Grid>
                </VuiBox>
              </VuiBox>
            </Card>
          </Grid>

          {/* Language & Notifications */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ mb: 3 }}>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" mb={3}>
                  <IoLanguage size={18} style={{ marginRight: 8 }} />
                  {t("coach:settings.language")}
                </VuiTypography>

                <VuiBox display="flex" gap={2}>
                  <VuiButton
                    color={language === "en" ? "info" : "secondary"}
                    variant={language === "en" ? "contained" : "outlined"}
                    onClick={() => handleLanguageChange("en")}
                    fullWidth
                  >
                    🇺🇸 English
                  </VuiButton>
                  <VuiButton
                    color={language === "es" ? "info" : "secondary"}
                    variant={language === "es" ? "contained" : "outlined"}
                    onClick={() => handleLanguageChange("es")}
                    fullWidth
                  >
                    🇪🇸 Español
                  </VuiButton>
                </VuiBox>
              </VuiBox>
            </Card>

            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" mb={3}>
                  <IoNotifications size={18} style={{ marginRight: 8 }} />
                  {t("coach:settings.notifications")}
                </VuiTypography>

                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <VuiTypography variant="button" color="white">
                    {t("coach:settings.emailNotifications")}
                  </VuiTypography>
                  <VuiSwitch
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                </VuiBox>

                <VuiBox display="flex" justifyContent="space-between" alignItems="center">
                  <VuiTypography variant="button" color="white">
                    {t("coach:settings.pushNotifications")}
                  </VuiTypography>
                  <VuiSwitch
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                  />
                </VuiBox>
              </VuiBox>
            </Card>
          </Grid>

          {/* Subscription */}
          <Grid item xs={12}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" mb={3}>
                  {t("coach:settings.subscription")}
                </VuiTypography>

                <Grid container spacing={3}>
                  {/* Standard Plan */}
                  <Grid item xs={12} md={6}>
                    <VuiBox
                      sx={{
                        p: 3,
                        borderRadius: "16px",
                        background:
                          subscriptionPlan === "standard"
                            ? "linear-gradient(135deg, rgba(0, 117, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)"
                            : "rgba(255, 255, 255, 0.03)",
                        border:
                          subscriptionPlan === "standard"
                            ? "2px solid #0075FF"
                            : "2px solid transparent",
                      }}
                    >
                      <VuiTypography variant="h5" color="white" mb={1}>
                        Standard
                      </VuiTypography>
                      <VuiTypography variant="h4" color="info" mb={2}>
                        $79<VuiTypography component="span" variant="caption" color="text">/mo</VuiTypography>
                      </VuiTypography>
                      <VuiTypography variant="body2" color="text" mb={2}>
                        {language === "es"
                          ? "• Todas las funciones principales\n• Hasta 30 jugadores\n• Mensajes con IA\n• Insignias y tabla de posiciones"
                          : "• All core features\n• Up to 30 players\n• AI messaging\n• Badges and leaderboard"}
                      </VuiTypography>
                      {subscriptionPlan === "standard" && (
                        <VuiButton color="success" fullWidth disabled>
                          {t("coach:settings.currentPlan")}
                        </VuiButton>
                      )}
                    </VuiBox>
                  </Grid>

                  {/* White Label Plan */}
                  <Grid item xs={12} md={6}>
                    <VuiBox
                      sx={{
                        p: 3,
                        borderRadius: "16px",
                        background:
                          subscriptionPlan === "white_label"
                            ? "linear-gradient(135deg, rgba(157, 78, 221, 0.2) 0%, rgba(224, 64, 251, 0.1) 100%)"
                            : "rgba(255, 255, 255, 0.03)",
                        border:
                          subscriptionPlan === "white_label"
                            ? "2px solid #9D4EDD"
                            : "2px solid transparent",
                      }}
                    >
                      <VuiBox display="flex" alignItems="center" gap={1} mb={1}>
                        <IoDiamond color="#9D4EDD" />
                        <VuiTypography variant="h5" color="white">
                          {t("coach:settings.whiteLabel")}
                        </VuiTypography>
                      </VuiBox>
                      <VuiTypography variant="h4" color="white" mb={2}>
                        $149<VuiTypography component="span" variant="caption" color="text">/mo</VuiTypography>
                      </VuiTypography>
                      <VuiTypography variant="body2" color="text" mb={2}>
                        {language === "es"
                          ? "• Todo lo del plan Standard\n• Tu propio logo\n• Colores personalizados\n• Sin marca CoachSoccerPro"
                          : "• Everything in Standard\n• Your own logo\n• Custom colors\n• No CoachSoccerPro branding"}
                      </VuiTypography>
                      {subscriptionPlan === "white_label" ? (
                        <VuiButton color="success" fullWidth disabled>
                          {t("coach:settings.currentPlan")}
                        </VuiButton>
                      ) : (
                        <VuiButton
                          color="info"
                          fullWidth
                          onClick={handleUpgradePlan}
                          startIcon={<IoDiamond />}
                        >
                          {t("coach:settings.upgradePlan")}
                        </VuiButton>
                      )}
                    </VuiBox>
                  </Grid>
                </Grid>
              </VuiBox>
            </Card>
          </Grid>
        </Grid>

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default CoachSettings;

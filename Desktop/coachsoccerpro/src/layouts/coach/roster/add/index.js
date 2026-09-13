import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import VuiSelect from "components/VuiSelect";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

function AddPlayer() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const navigate = useNavigate();
  const { teamData, coachData } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [position, setPosition] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const language = i18n.language || "en";

  const positions = [
    { value: "goalkeeper", label: language === "es" ? "Portero" : "Goalkeeper" },
    { value: "defender", label: language === "es" ? "Defensa" : "Defender" },
    { value: "midfielder", label: language === "es" ? "Centrocampista" : "Midfielder" },
    { value: "winger", label: language === "es" ? "Extremo" : "Winger" },
    { value: "forward", label: language === "es" ? "Delantero" : "Forward" },
    { value: "striker", label: language === "es" ? "Delantero Centro" : "Striker" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName) {
      setError(language === "es" ? "Nombre y apellido son requeridos" : "First and last name are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create player
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert([
          {
            team_id: teamData.id,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth || null,
            position: position || null,
            jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
          },
        ])
        .select()
        .single();

      if (playerError) throw playerError;

      // If parent email provided, create parent invite
      if (parentEmail) {
        const inviteToken = Math.random().toString(36).substring(2, 15);

        // Create parent record with invite
        const { data: parentData, error: parentError } = await supabase
          .from("parents")
          .insert([
            {
              team_id: teamData.id,
              invited_by_coach_id: coachData.id,
              invite_token: inviteToken,
              invite_status: "pending",
              email: parentEmail,
              phone: parentPhone || null,
            },
          ])
          .select()
          .single();

        if (parentError) {
          console.error("Error creating parent invite:", parentError);
        } else {
          // Link the player back to this parent record — without this, roster/
          // messages/payments can never find the parent from the player.
          const { error: linkError } = await supabase
            .from("players")
            .update({ parent_id: parentData.id })
            .eq("id", playerData.id);
          if (linkError) console.error("Error linking player to parent:", linkError);
        }
      }

      // Award "First Practice" badge automatically
      const { data: firstPracticeBadge } = await supabase
        .from("badge_definitions")
        .select("id")
        .eq("key", "firstPractice")
        .single();

      if (firstPracticeBadge) {
        await supabase.from("player_badges").insert([
          {
            player_id: playerData.id,
            badge_id: firstPracticeBadge.id,
            awarded_by_coach_id: coachData.id,
          },
        ]);
      }

      // Create first journey milestone
      await supabase.from("journey_milestones").insert([
        {
          player_id: playerData.id,
          milestone_key: "firstPractice",
        },
      ]);

      setSuccess(true);
      setTimeout(() => {
        navigate("/coach/roster");
      }, 1500);
    } catch (err) {
      console.error("Error adding player:", err);
      setError(err.message || (language === "es" ? "Error al agregar jugador" : "Error adding player"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setPosition("");
    setJerseyNumber("");
    setParentEmail("");
    setParentPhone("");
    setSuccess(false);
    setError("");
  };

  if (success) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <VuiBox py={3}>
          <Card>
            <VuiBox p={5} textAlign="center">
              <VuiTypography variant="h1" mb={2}>
                🎉
              </VuiTypography>
              <VuiTypography variant="h4" color="white" mb={2}>
                {language === "es" ? "¡Jugador Agregado!" : "Player Added!"}
              </VuiTypography>
              <VuiTypography variant="body2" color="text" mb={3}>
                {firstName} {lastName}{" "}
                {language === "es" ? "ahora es parte del equipo" : "is now part of the team"}
              </VuiTypography>
              <VuiBox display="flex" justifyContent="center" gap={2}>
                <VuiButton color="info" onClick={handleAddAnother}>
                  {language === "es" ? "Agregar Otro" : "Add Another"}
                </VuiButton>
                <VuiButton color="secondary" onClick={() => navigate("/coach/roster")}>
                  {language === "es" ? "Ver Plantilla" : "View Roster"}
                </VuiButton>
              </VuiBox>
            </VuiBox>
          </Card>
        </VuiBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {t("coach:roster.addPlayer")}
          </VuiTypography>
        </VuiBox>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <VuiBox p={3}>
                {error && (
                  <VuiBox mb={2} p={2} sx={{ background: "rgba(244, 67, 54, 0.1)", borderRadius: "10px" }}>
                    <VuiTypography variant="caption" color="error">
                      {error}
                    </VuiTypography>
                  </VuiBox>
                )}

                <VuiBox component="form" onSubmit={handleSubmit}>
                  {/* Player Info Section */}
                  <VuiTypography variant="h6" color="white" mb={2}>
                    {language === "es" ? "Información del Jugador" : "Player Information"}
                  </VuiTypography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <VuiBox mb={2}>
                        <VuiTypography variant="button" color="white" fontWeight="medium">
                          {t("coach:player.firstName")} *
                        </VuiTypography>
                        <VuiInput
                          type="text"
                          placeholder={language === "es" ? "Carlos" : "Michael"}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </VuiBox>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <VuiBox mb={2}>
                        <VuiTypography variant="button" color="white" fontWeight="medium">
                          {t("coach:player.lastName")} *
                        </VuiTypography>
                        <VuiInput
                          type="text"
                          placeholder={language === "es" ? "García" : "Johnson"}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </VuiBox>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <VuiBox mb={2}>
                        <VuiTypography variant="button" color="white" fontWeight="medium">
                          {t("coach:player.dateOfBirth")}
                        </VuiTypography>
                        <VuiInput
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </VuiBox>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <VuiBox mb={2}>
                        <VuiTypography variant="button" color="white" fontWeight="medium">
                          {t("coach:player.position")}
                        </VuiTypography>
                        <VuiSelect
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          options={positions}
                          placeholder={language === "es" ? "Seleccionar..." : "Select..."}
                        />
                      </VuiBox>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <VuiBox mb={2}>
                        <VuiTypography variant="button" color="white" fontWeight="medium">
                          {t("coach:player.jerseyNumber")}
                        </VuiTypography>
                        <VuiInput
                          type="number"
                          placeholder="10"
                          value={jerseyNumber}
                          onChange={(e) => setJerseyNumber(e.target.value)}
                          min="1"
                          max="99"
                        />
                      </VuiBox>
                    </Grid>
                  </Grid>

                  {/* Parent Info Section */}
                  <VuiBox mt={4} mb={2}>
                    <VuiTypography variant="h6" color="white">
                      {t("coach:roster.parentInfo")}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {language === "es"
                        ? "Opcional - enviaremos una invitación para conectarse"
                        : "Optional - we'll send an invite to connect"}
                    </VuiTypography>
                  </VuiBox>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <VuiBox mb={2}>
                        <VuiTypography variant="button" color="white" fontWeight="medium">
                          {t("coach:player.parentEmail")}
                        </VuiTypography>
                        <VuiInput
                          type="email"
                          placeholder="parent@email.com"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                        />
                      </VuiBox>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <VuiBox mb={2}>
                        <VuiTypography variant="button" color="white" fontWeight="medium">
                          {t("coach:player.parentPhone")}
                        </VuiTypography>
                        <VuiInput
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                        />
                      </VuiBox>
                    </Grid>
                  </Grid>

                  {/* Actions */}
                  <VuiBox mt={4} display="flex" justifyContent="flex-end" gap={2}>
                    <VuiButton color="secondary" onClick={() => navigate("/coach/roster")}>
                      {t("common:buttons.cancel")}
                    </VuiButton>
                    <VuiButton color="info" type="submit" disabled={loading}>
                      {loading ? t("common:status.saving") : t("common:buttons.save")}
                    </VuiButton>
                  </VuiBox>
                </VuiBox>
              </VuiBox>
            </Card>
          </Grid>

          {/* Tips Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="h6" color="white" mb={2}>
                  💡 {language === "es" ? "Consejos" : "Tips"}
                </VuiTypography>
                <VuiBox mb={2}>
                  <VuiTypography variant="body2" color="text">
                    {language === "es"
                      ? "• El jugador recibirá automáticamente la insignia 'Primer Entrenamiento'"
                      : "• Player will automatically receive the 'First Practice' badge"}
                  </VuiTypography>
                </VuiBox>
                <VuiBox mb={2}>
                  <VuiTypography variant="body2" color="text">
                    {language === "es"
                      ? "• Si agregas el email del padre, le enviaremos una invitación"
                      : "• If you add parent email, we'll send them an invite"}
                  </VuiTypography>
                </VuiBox>
                <VuiBox mb={2}>
                  <VuiTypography variant="body2" color="text">
                    {language === "es"
                      ? "• Puedes agregar la foto después desde el perfil del jugador"
                      : "• You can add photo later from the player profile"}
                  </VuiTypography>
                </VuiBox>
              </VuiBox>
            </Card>
          </Grid>
        </Grid>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AddPlayer;

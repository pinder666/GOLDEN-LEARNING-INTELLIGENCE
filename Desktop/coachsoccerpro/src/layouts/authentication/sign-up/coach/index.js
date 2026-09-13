import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

// Auth
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

// Logo
import logo from "assets/images/logos/coachsoccerpro-logo.png";
import signupHero from "assets/images/signup-hero.jpg";

function CoachSignUp() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const language = i18n.language || "en";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password || !teamName) {
      setError(language === "es" ? "Completa todos los campos" : "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError(language === "es" ? "Mínimo 6 caracteres" : "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: "coach",
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: "coach",
          preferred_language: language,
        },
      ]);

      if (profileError) throw profileError;

      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert([{ name: teamName, age_group: "U12", season: "2026", invite_code: inviteCode }])
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: coachError } = await supabase.from("coaches").insert([
        { user_id: authData.user.id, team_id: teamData.id, is_head_coach: true, subscription_status: "trialing" },
      ]);

      if (coachError) throw coachError;

      navigate("/coach/dashboard");
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VuiBox
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Green accent shapes */}
      <VuiBox
        sx={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          opacity: 0.1,
        }}
      />
      <VuiBox
        sx={{
          position: "absolute",
          bottom: -50,
          left: -50,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          opacity: 0.08,
        }}
      />

      <Grid container sx={{ minHeight: "100vh" }}>
        {/* Left - Image placeholder */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            backgroundImage: `url(${signupHero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
        </Grid>

        {/* Right - Form */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: { xs: 3, md: 6 },
          }}
        >
          {/* Logo above form - tight pill */}
          <VuiBox
            sx={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              borderRadius: "40px",
              px: 2,
              py: 0.5,
              mb: 4,
              border: "2px solid #22c55e",
              boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)",
            }}
          >
            <VuiBox
              component="img"
              src={logo}
              alt="CoachSoccerPro"
              sx={{
                width: { xs: 280, md: 400 },
                display: "block",
              }}
            />
          </VuiBox>

          <VuiBox sx={{ width: "100%", maxWidth: 400 }}>
            <VuiTypography variant="h3" sx={{ color: "#1f2937", fontWeight: "bold", mb: 1 }}>
              {language === "es" ? "Crear Cuenta" : "Get Started"}
            </VuiTypography>
            <VuiTypography variant="body2" sx={{ color: "#6b7280", mb: 4 }}>
              {language === "es" ? "Gratis por 14 días. Sin tarjeta." : "Free for 14 days. No card needed."}
            </VuiTypography>

            {error && (
              <VuiBox mb={2} p={2} sx={{ background: "#fef2f2", borderRadius: 2, border: "1px solid #fecaca" }}>
                <VuiTypography variant="caption" sx={{ color: "#dc2626" }}>
                  {error}
                </VuiTypography>
              </VuiBox>
            )}

            <VuiBox component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <VuiTypography variant="caption" sx={{ color: "#374151", fontWeight: 600, mb: 0.5, display: "block" }}>
                    {language === "es" ? "Nombre" : "First Name"}
                  </VuiTypography>
                  <VuiInput
                    type="text"
                    placeholder={language === "es" ? "Juan" : "John"}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    sx={{
                      "& input": {
                        py: 1.5,
                        background: "white !important",
                        border: "1px solid #e5e7eb !important",
                        color: "#1f2937 !important",
                        "&::placeholder": { color: "#9ca3af !important" }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <VuiTypography variant="caption" sx={{ color: "#374151", fontWeight: 600, mb: 0.5, display: "block" }}>
                    {language === "es" ? "Apellido" : "Last Name"}
                  </VuiTypography>
                  <VuiInput
                    type="text"
                    placeholder={language === "es" ? "García" : "Smith"}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    sx={{
                      "& input": {
                        py: 1.5,
                        background: "white !important",
                        border: "1px solid #e5e7eb !important",
                        color: "#1f2937 !important",
                        "&::placeholder": { color: "#9ca3af !important" }
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <VuiBox mt={2}>
                <VuiTypography variant="caption" sx={{ color: "#374151", fontWeight: 600, mb: 0.5, display: "block" }}>
                  Email
                </VuiTypography>
                <VuiInput
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    "& input": {
                      py: 1.5,
                      background: "white !important",
                      border: "1px solid #e5e7eb !important",
                      color: "#1f2937 !important",
                      "&::placeholder": { color: "#9ca3af !important" }
                    }
                  }}
                />
              </VuiBox>

              <VuiBox mt={2}>
                <VuiTypography variant="caption" sx={{ color: "#374151", fontWeight: 600, mb: 0.5, display: "block" }}>
                  {language === "es" ? "Contraseña" : "Password"}
                </VuiTypography>
                <VuiInput
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    "& input": {
                      py: 1.5,
                      background: "white !important",
                      border: "1px solid #e5e7eb !important",
                      color: "#1f2937 !important",
                      "&::placeholder": { color: "#9ca3af !important" }
                    }
                  }}
                />
              </VuiBox>

              <VuiBox mt={2}>
                <VuiTypography variant="caption" sx={{ color: "#374151", fontWeight: 600, mb: 0.5, display: "block" }}>
                  {language === "es" ? "Nombre del Equipo" : "Team Name"}
                </VuiTypography>
                <VuiInput
                  type="text"
                  placeholder={language === "es" ? "Los Tigres FC" : "Thunder FC"}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  sx={{
                    "& input": {
                      py: 1.5,
                      background: "white !important",
                      border: "1px solid #e5e7eb !important",
                      color: "#1f2937 !important",
                      "&::placeholder": { color: "#9ca3af !important" }
                    }
                  }}
                />
              </VuiBox>

              <VuiButton
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.5,
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  borderRadius: 2,
                  boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                    boxShadow: "0 6px 20px rgba(34, 197, 94, 0.5)",
                  },
                }}
              >
                {loading
                  ? (language === "es" ? "Creando..." : "Creating...")
                  : (language === "es" ? "Crear Mi Equipo" : "Create My Team")}
              </VuiButton>
            </VuiBox>

            <VuiBox mt={3} textAlign="center">
              <VuiTypography variant="body2" sx={{ color: "#6b7280" }}>
                {language === "es" ? "¿Ya tienes cuenta?" : "Already have an account?"}{" "}
                <VuiTypography
                  component={Link}
                  to="/auth/sign-in"
                  variant="body2"
                  sx={{ color: "#16a34a", fontWeight: 600, cursor: "pointer" }}
                >
                  {language === "es" ? "Entrar" : "Sign In"}
                </VuiTypography>
              </VuiTypography>
            </VuiBox>
          </VuiBox>
        </Grid>
      </Grid>
    </VuiBox>
  );
}

export default CoachSignUp;

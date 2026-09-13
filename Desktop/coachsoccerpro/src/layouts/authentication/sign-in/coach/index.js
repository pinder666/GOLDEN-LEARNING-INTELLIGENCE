import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

// Auth
import { useAuth } from "context/AuthContext";

// Logo
import logo from "assets/images/logos/coachsoccerpro-logo.png";
import signinHero from "assets/images/signin-hero.jpg";

function CoachSignIn() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const language = i18n.language || "en";

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError(language === "es" ? "Ingresa tu correo y contraseña" : "Please enter your email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate("/coach/dashboard");
    } catch (err) {
      setError(err.message || (language === "es" ? "Error al iniciar sesión" : "Failed to sign in"));
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
            backgroundImage: `url(${signinHero})`,
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
              {language === "es" ? "Entrar" : "Sign In"}
            </VuiTypography>
            <VuiTypography variant="body2" sx={{ color: "#6b7280", mb: 4 }}>
              {language === "es" ? "Ingresa a tu cuenta" : "Access your account"}
            </VuiTypography>

            {error && (
              <VuiBox mb={2} p={2} sx={{ background: "#fef2f2", borderRadius: 2, border: "1px solid #fecaca" }}>
                <VuiTypography variant="caption" sx={{ color: "#dc2626" }}>
                  {error}
                </VuiTypography>
              </VuiBox>
            )}

            <VuiBox component="form" onSubmit={handleSignIn}>
              <VuiBox mb={2}>
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

              <VuiBox mb={2}>
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

              <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <VuiBox display="flex" alignItems="center">
                  <Switch
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#22c55e" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#22c55e" },
                    }}
                    size="small"
                  />
                  <VuiTypography variant="caption" sx={{ color: "#6b7280", ml: 1 }}>
                    {language === "es" ? "Recuérdame" : "Remember me"}
                  </VuiTypography>
                </VuiBox>
                <VuiTypography
                  component={Link}
                  to="/auth/forgot-password"
                  variant="caption"
                  sx={{ color: "#16a34a", cursor: "pointer" }}
                >
                  {language === "es" ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
                </VuiTypography>
              </VuiBox>

              <VuiButton
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 2,
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
                  ? (language === "es" ? "Entrando..." : "Signing in...")
                  : (language === "es" ? "Entrar" : "Sign In")}
              </VuiButton>
            </VuiBox>

            <VuiBox mt={3} textAlign="center">
              <VuiTypography variant="body2" sx={{ color: "#6b7280" }}>
                {language === "es" ? "¿No tienes cuenta?" : "Don't have an account?"}{" "}
                <VuiTypography
                  component={Link}
                  to="/auth/sign-up/coach"
                  variant="body2"
                  sx={{ color: "#16a34a", fontWeight: 600, cursor: "pointer" }}
                >
                  {language === "es" ? "Crear Cuenta" : "Sign Up"}
                </VuiTypography>
              </VuiTypography>
            </VuiBox>
          </VuiBox>
        </Grid>
      </Grid>
    </VuiBox>
  );
}

export default CoachSignIn;

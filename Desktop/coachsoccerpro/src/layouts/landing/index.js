import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Container from "@mui/material/Container";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

// Icons
import { IoGlobe } from "react-icons/io5";

// Logo
import logo from "assets/images/logos/coachsoccerpro-logo.png";

function LandingPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language || "en";

  const handleLanguageToggle = () => {
    const newLang = language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const content = {
    en: {
      headline: "THE AI ASSISTANT",
      headline2: "EVERY COACH DESERVES.",
      line1: "Talk after practice. We send professional messages to parents.",
      line2: "Request payment once. We chase it until it's paid.",
      cta: "START FREE",
      signin: "Sign In",
    },
    es: {
      headline: "EL ASISTENTE AI",
      headline2: "QUE TODO ENTRENADOR MERECE.",
      line1: "Habla después de la práctica. Nosotros enviamos mensajes profesionales a los padres.",
      line2: "Solicita el pago una vez. Nosotros lo perseguimos hasta que se pague.",
      cta: "EMPEZAR GRATIS",
      signin: "Entrar",
    },
  };

  const c = content[language] || content.en;

  return (
    <VuiBox
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating Soccer Ball */}
      <VuiBox
        sx={{
          position: "absolute",
          top: "50%",
          left: 0,
          fontSize: "3rem",
          opacity: 0.15,
          animation: "kickBall 20s ease-in-out infinite",
          "@keyframes kickBall": {
            "0%": { left: "-5%", top: "30%", transform: "rotate(0deg)" },
            "25%": { left: "40%", top: "60%", transform: "rotate(360deg)" },
            "50%": { left: "85%", top: "40%", transform: "rotate(720deg)" },
            "75%": { left: "50%", top: "20%", transform: "rotate(1080deg)" },
            "100%": { left: "-5%", top: "30%", transform: "rotate(1440deg)" },
          },
          pointerEvents: "none",
        }}
      >
        ⚽
      </VuiBox>

      {/* Navigation - Top Bar */}
      <VuiBox
        sx={{
          position: "absolute",
          top: 15,
          left: 30,
          right: 30,
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Big Logo - Top Left */}
        <VuiBox
          component="img"
          src={logo}
          alt="CoachSoccerPro"
          sx={{
            width: { xs: 200, md: 350 },
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
          }}
        />

        {/* Nav items - Top Right */}
        <VuiBox display="flex" alignItems="center" gap={2}>
          <VuiButton
            variant="text"
            size="small"
            onClick={handleLanguageToggle}
            sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "white" } }}
          >
            <IoGlobe size={18} style={{ marginRight: 6 }} />
            {language === "en" ? "ES" : "EN"}
          </VuiButton>
          <VuiButton
            variant="text"
            size="small"
            onClick={() => navigate("/auth/sign-in")}
            sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "white" } }}
          >
            {c.signin}
          </VuiButton>
        </VuiBox>
      </VuiBox>

      {/* Hero Section */}
      <Container maxWidth="lg">
        <VuiBox
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          textAlign="center"
        >
          {/* Main Headline */}
          <VuiTypography
            sx={{
              color: "white",
              fontWeight: 900,
              fontSize: { xs: "2rem", md: "3.5rem", lg: "4rem" },
              lineHeight: 1,
              textShadow: "0 4px 30px rgba(0,0,0,0.4)",
              letterSpacing: -1,
            }}
          >
            {c.headline}
          </VuiTypography>
          <VuiTypography
            sx={{
              background: "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 900,
              fontSize: { xs: "2rem", md: "3.5rem", lg: "4rem" },
              lineHeight: 1,
              mb: 4,
            }}
          >
            {c.headline2}
          </VuiTypography>

          {/* Value Props */}
          <VuiBox mb={5}>
            <VuiTypography
              sx={{
                color: "rgba(255,255,255,0.85)",
                fontWeight: 400,
                fontSize: { xs: "1rem", md: "1.2rem" },
                mb: 1,
              }}
            >
              {c.line1}
            </VuiTypography>
            <VuiTypography
              sx={{
                color: "rgba(255,255,255,0.85)",
                fontWeight: 400,
                fontSize: { xs: "1rem", md: "1.2rem" },
              }}
            >
              {c.line2}
            </VuiTypography>
          </VuiBox>

          {/* CTA Button */}
          <VuiButton
            size="large"
            onClick={() => navigate("/auth/sign-up/coach")}
            sx={{
              px: { xs: 5, md: 8 },
              py: 2,
              fontSize: { xs: "1rem", md: "1.2rem" },
              fontWeight: 800,
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: "white",
              borderRadius: "8px",
              boxShadow: "0 8px 30px rgba(34, 197, 94, 0.4)",
              letterSpacing: 2,
              "&:hover": {
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                transform: "translateY(-3px)",
                boxShadow: "0 12px 40px rgba(34, 197, 94, 0.5)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {c.cta}
          </VuiButton>
        </VuiBox>
      </Container>

      {/* Footer */}
      <VuiBox
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          py: 2,
          textAlign: "center",
        }}
      >
        <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
          © 2026 CoachSoccerPro
        </VuiTypography>
      </VuiBox>
    </VuiBox>
  );
}

export default LandingPage;

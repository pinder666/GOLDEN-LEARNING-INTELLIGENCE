import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Card from "@mui/material/Card";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

// Vision UI Dashboard layout
import CoverLayout from "layouts/authentication/components/CoverLayout";

// Auth
import { useAuth } from "context/AuthContext";

// Background
import bgSignIn from "assets/images/signInImage.png";

function ParentSignIn() {
  const { t, i18n } = useTranslation(["common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();

  const inviteToken = searchParams.get("invite");
  const [isNewUser, setIsNewUser] = useState(!!inviteToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const language = i18n.language || "en";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isNewUser) {
        // Sign up new parent
        const { error: signUpError } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          role: "parent",
          invite_token: inviteToken,
        });

        if (signUpError) throw signUpError;
        navigate("/parent/dashboard");
      } else {
        // Sign in existing parent
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        navigate("/parent/dashboard");
      }
    } catch (err) {
      setError(err.message || (language === "es" ? "Error de autenticación" : "Authentication error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CoverLayout
      title={
        isNewUser
          ? language === "es"
            ? "¡Bienvenido!"
            : "Welcome!"
          : language === "es"
          ? "Iniciar Sesión"
          : "Sign In"
      }
      description={
        isNewUser
          ? language === "es"
            ? "Crea tu cuenta para conectarte con el equipo de tu hijo"
            : "Create your account to connect with your child's team"
          : language === "es"
          ? "Ingresa tu correo y contraseña"
          : "Enter your email and password"
      }
      image={bgSignIn}
    >
      <VuiBox component="form" onSubmit={handleSubmit}>
        {error && (
          <VuiBox mb={2} p={2} sx={{ background: "rgba(244, 67, 54, 0.1)", borderRadius: "10px" }}>
            <VuiTypography variant="caption" color="error">
              {error}
            </VuiTypography>
          </VuiBox>
        )}

        {isNewUser && (
          <>
            <VuiBox mb={2}>
              <VuiTypography variant="button" color="white" fontWeight="medium">
                {language === "es" ? "Nombre" : "First Name"}
              </VuiTypography>
              <VuiInput
                type="text"
                placeholder={language === "es" ? "María" : "Maria"}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </VuiBox>
            <VuiBox mb={2}>
              <VuiTypography variant="button" color="white" fontWeight="medium">
                {language === "es" ? "Apellido" : "Last Name"}
              </VuiTypography>
              <VuiInput
                type="text"
                placeholder={language === "es" ? "García" : "Garcia"}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </VuiBox>
            <VuiBox mb={2}>
              <VuiTypography variant="button" color="white" fontWeight="medium">
                {language === "es" ? "Teléfono" : "Phone"}
              </VuiTypography>
              <VuiInput
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </VuiBox>
          </>
        )}

        <VuiBox mb={2}>
          <VuiTypography variant="button" color="white" fontWeight="medium">
            {language === "es" ? "Correo Electrónico" : "Email"}
          </VuiTypography>
          <VuiInput
            type="email"
            placeholder="parent@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </VuiBox>

        <VuiBox mb={2}>
          <VuiTypography variant="button" color="white" fontWeight="medium">
            {language === "es" ? "Contraseña" : "Password"}
          </VuiTypography>
          <VuiInput
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </VuiBox>

        <VuiBox mt={4} mb={1}>
          <VuiButton color="info" fullWidth type="submit" disabled={loading}>
            {loading
              ? t("common:status.loading")
              : isNewUser
              ? language === "es"
                ? "Crear Cuenta"
                : "Create Account"
              : language === "es"
              ? "Iniciar Sesión"
              : "Sign In"}
          </VuiButton>
        </VuiBox>

        {!inviteToken && (
          <VuiBox mt={3} textAlign="center">
            <VuiTypography variant="button" color="text">
              {isNewUser
                ? language === "es"
                  ? "¿Ya tienes cuenta?"
                  : "Already have an account?"
                : language === "es"
                ? "¿Primera vez aquí?"
                : "First time here?"}
              <VuiTypography
                component="span"
                variant="button"
                color="info"
                fontWeight="medium"
                sx={{ cursor: "pointer", ml: 1 }}
                onClick={() => setIsNewUser(!isNewUser)}
              >
                {isNewUser
                  ? language === "es"
                    ? "Inicia sesión"
                    : "Sign in"
                  : language === "es"
                  ? "Regístrate"
                  : "Sign up"}
              </VuiTypography>
            </VuiTypography>
          </VuiBox>
        )}
      </VuiBox>
    </CoverLayout>
  );
}

export default ParentSignIn;

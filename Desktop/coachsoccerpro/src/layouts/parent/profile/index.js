import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const SM_ID_REGEX = /^SM-[A-Z0-9]{8}$/;

function ParentProfile() {
  const { i18n, user } = useTranslation ? useTranslation() : { i18n: { language: "en" } };
  const { userProfile } = useAuth();
  const lang = (i18n?.language || "en").slice(0, 2);

  const t = (en, es) => lang === "es" ? es : en;

  // SM ID state
  const [smId, setSmId] = useState("");
  const [smInput, setSmInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load current SM ID from the parent's linked player row
  useEffect(() => {
    if (!userProfile?.id) return;
    supabase
      .from("players")
      .select("sm_user_id")
      .eq("parent_id", userProfile.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        const val = data?.sm_user_id || "";
        setSmId(val);
        setSmInput(val);
      });
  }, [userProfile]);

  const handleSave = async () => {
    setError("");
    const val = smInput.trim().toUpperCase();
    if (val && !SM_ID_REGEX.test(val)) {
      setError(t(
        "Format must be SM- followed by 8 characters, e.g. SM-AD28F6B8",
        "El formato debe ser SM- seguido de 8 caracteres, ej. SM-AD28F6B8"
      ));
      return;
    }
    setSaving(true);
    try {
      await supabase
        .from("players")
        .update({ sm_user_id: val || null })
        .eq("parent_id", userProfile.id);
      setSmId(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || t("Could not save. Try again.", "No se pudo guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  };

  const unchanged = smInput.trim().toUpperCase() === smId;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>

        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {t("My Profile", "Mi Perfil")}
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            {t("Manage your account and connected apps.", "Administra tu cuenta y aplicaciones conectadas.")}
          </VuiTypography>
        </VuiBox>

        {/* Account info */}
        <div style={{
          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14, padding: "20px 24px", marginBottom: 16,
        }}>
          <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: 2 }}>
            {t("Account", "Cuenta")}
          </VuiTypography>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: t("Name", "Nombre"), val: userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : "—" },
              { label: t("Email", "Email"), val: userProfile?.email || "—" },
              { label: t("Role", "Rol"), val: t("Parent / Guardian", "Padre / Tutor") },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ color: "rgba(255,255,255,.4)", fontSize: 12, fontFamily: "Inter,sans-serif", width: 56, flexShrink: 0 }}>{row.label}</span>
                <span style={{ color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif" }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SoccerMental Family ID */}
        <div style={{
          background: "rgba(249,115,22,.05)", border: "1px solid rgba(249,115,22,.2)",
          borderRadius: 14, padding: "20px 24px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>⚽</span>
            <VuiTypography variant="button" color="white" fontWeight="bold">
              SM {t("Family ID", "ID de Familia")}
            </VuiTypography>
            {smId && (
              <span style={{
                background: "rgba(34,197,94,.15)", color: "#22c55e",
                border: "1px solid rgba(34,197,94,.3)", borderRadius: 20,
                fontSize: 10, fontWeight: 700, padding: "2px 10px", fontFamily: "Inter,sans-serif",
              }}>
                {t("✓ Linked", "✓ Vinculado")}
              </span>
            )}
          </div>

          <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2, lineHeight: 1.6 }}>
            {t(
              "Open SoccerMental on your phone, go to your account page, and copy your Family ID (e.g. SM-AD28F6B8). Paste it here so your child's coach can see that home training is active. No personal data is shared — the ID is all the coach sees.",
              "Abre SoccerMental en tu teléfono, ve a tu página de cuenta y copia tu ID de familia (ej. SM-AD28F6B8). Pégalo aquí para que el entrenador de tu hijo pueda ver que el entrenamiento en casa está activo. No se comparten datos personales — el ID es todo lo que ve el entrenador."
            )}
          </VuiTypography>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input
                type="text"
                value={smInput}
                onChange={e => { setSmInput(e.target.value.toUpperCase()); setSaved(false); setError(""); }}
                placeholder="SM-XXXXXXXX"
                maxLength={11}
                style={{
                  width: "100%", background: "rgba(255,255,255,.08)",
                  border: error ? "1px solid #ef4444" : smId ? "1px solid rgba(249,115,22,.4)" : "1px solid rgba(255,255,255,.15)",
                  borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14,
                  fontFamily: "monospace", outline: "none", boxSizing: "border-box",
                  letterSpacing: "0.06em",
                }}
              />
              {error && (
                <p style={{ color: "#ef4444", fontSize: 11, fontFamily: "Inter,sans-serif", marginTop: 6 }}>{error}</p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || unchanged}
              style={{
                background: saved ? "#22c55e" : "#f97316",
                border: "none", borderRadius: 8, padding: "10px 20px",
                color: "#000", fontWeight: 800, fontSize: 13,
                cursor: saving || unchanged ? "default" : "pointer",
                fontFamily: "Inter,sans-serif",
                opacity: unchanged ? 0.4 : 1,
                transition: "background .2s, opacity .2s",
                whiteSpace: "nowrap",
              }}
            >
              {saved
                ? t("✓ Saved!", "✓ Guardado!")
                : saving
                ? t("Saving…", "Guardando…")
                : smId
                ? t("Update", "Actualizar")
                : t("Save", "Guardar")}
            </button>
          </div>

          {smId && !error && (
            <p style={{ marginTop: 10, color: "rgba(255,255,255,.4)", fontSize: 11, fontFamily: "Inter,sans-serif" }}>
              {t("Your coach can now see that home training is active for your child. They cannot see your SoccerMental data.", "Tu entrenador puede ver que el entrenamiento en casa está activo para tu hijo. No puede ver tus datos de SoccerMental.")}
            </p>
          )}
        </div>

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default ParentProfile;

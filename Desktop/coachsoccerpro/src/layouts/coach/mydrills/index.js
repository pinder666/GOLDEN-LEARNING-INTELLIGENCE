import { useState, useRef } from "react";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

function MyDrills() {
  const [lang, setLang] = useState("en");
  const [myDrills, setMyDrills] = useState([]);
  const [creating, setCreating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [newDrill, setNewDrill] = useState({
    title: "",
    description: "",
    equipment: "",
    duration: 10,
    ageGroup: "U10",
  });

  const t = (en, es) => lang === "es" ? es : en;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      alert(t("Microphone access denied", "Acceso al micrófono denegado"));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const saveDrill = () => {
    if (!newDrill.title.trim()) return;

    const drill = {
      id: Date.now(),
      ...newDrill,
      audioUrl,
      createdAt: new Date().toISOString(),
    };

    setMyDrills(prev => [drill, ...prev]);
    setNewDrill({ title: "", description: "", equipment: "", duration: 10, ageGroup: "U10" });
    setAudioBlob(null);
    setAudioUrl(null);
    setCreating(false);
  };

  const deleteDrill = (id) => {
    setMyDrills(prev => prev.filter(d => d.id !== id));
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <VuiBox mb={1} display="flex" justifyContent="space-between" alignItems="center">
          <VuiBox>
            <VuiTypography variant="h5" color="white" fontWeight="bold">
              {t("My Drills", "Mis Ejercicios")}
            </VuiTypography>
            <VuiTypography variant="caption" color="text">
              {t(`${myDrills.length} custom drills`, `${myDrills.length} ejercicios personalizados`)}
            </VuiTypography>
          </VuiBox>

          <VuiBox display="flex" gap="8px" alignItems="center">
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.08)", borderRadius: 20, padding: 3 }}>
              {["en", "es"].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  background: lang === l ? "#4ade80" : "transparent",
                  color: lang === l ? "#000" : "rgba(255,255,255,.6)",
                  border: "none", borderRadius: 18, padding: "4px 14px",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {!creating && (
              <button onClick={() => setCreating(true)} style={{
                background: "#4ade80", color: "#000", border: "none", borderRadius: 8,
                padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "Inter,sans-serif",
              }}>
                + {t("New Drill", "Nuevo Ejercicio")}
              </button>
            )}
          </VuiBox>
        </VuiBox>

        {/* Create form */}
        {creating && (
          <VuiBox mb={2} sx={{
            background: "rgba(255,255,255,.05)", border: "1px solid rgba(74,222,128,.3)",
            borderRadius: "12px", padding: "16px",
          }}>
            <VuiTypography variant="button" color="white" fontWeight="bold" mb={1} sx={{ display: "block" }}>
              {t("Create New Drill", "Crear Nuevo Ejercicio")}
            </VuiTypography>

            <VuiBox display="flex" gap="12px" flexWrap="wrap" mb={2}>
              <input
                placeholder={t("Drill name", "Nombre del ejercicio")}
                value={newDrill.title}
                onChange={(e) => setNewDrill(p => ({ ...p, title: e.target.value }))}
                style={{
                  flex: 2, minWidth: 200, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif",
                }}
              />
              <select
                value={newDrill.ageGroup}
                onChange={(e) => setNewDrill(p => ({ ...p, ageGroup: e.target.value }))}
                style={{
                  background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif",
                }}
              >
                {["U8", "U10", "U12", "U14+"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input
                type="number"
                placeholder={t("Duration (min)", "Duración (min)")}
                value={newDrill.duration}
                onChange={(e) => setNewDrill(p => ({ ...p, duration: parseInt(e.target.value) || 10 }))}
                style={{
                  width: 100, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif",
                }}
              />
            </VuiBox>

            <textarea
              placeholder={t("Description — how to run this drill", "Descripción — cómo ejecutar este ejercicio")}
              value={newDrill.description}
              onChange={(e) => setNewDrill(p => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{
                width: "100%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif",
                resize: "vertical", marginBottom: 12,
              }}
            />

            <input
              placeholder={t("Equipment needed", "Equipamiento necesario")}
              value={newDrill.equipment}
              onChange={(e) => setNewDrill(p => ({ ...p, equipment: e.target.value }))}
              style={{
                width: "100%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif",
                marginBottom: 12,
              }}
            />

            {/* Voice recording */}
            <VuiBox sx={{
              background: "rgba(0,0,0,.2)", borderRadius: 10, padding: "14px 16px",
              border: "1px solid rgba(255,255,255,.1)", marginBottom: 12,
            }}>
              <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.5)", display: "block", marginBottom: 8 }}>
                🎤 {t("Record your voice explaining this drill", "Graba tu voz explicando este ejercicio")}
              </VuiTypography>

              <VuiBox display="flex" gap="10px" alignItems="center">
                {!recording ? (
                  <button onClick={startRecording} style={{
                    background: "#ef4444", color: "#fff", border: "none", borderRadius: 8,
                    padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    ⏺ {t("Start Recording", "Iniciar Grabación")}
                  </button>
                ) : (
                  <button onClick={stopRecording} style={{
                    background: "#fbbf24", color: "#000", border: "none", borderRadius: 8,
                    padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: "Inter,sans-serif", animation: "pulse 1s infinite",
                  }}>
                    ⏹ {t("Stop Recording", "Detener Grabación")}
                  </button>
                )}

                {audioUrl && (
                  <audio controls src={audioUrl} style={{ height: 36 }} />
                )}

                {audioUrl && (
                  <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }} style={{
                    background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)",
                    border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 11,
                    cursor: "pointer", fontFamily: "Inter,sans-serif",
                  }}>
                    {t("Clear", "Borrar")}
                  </button>
                )}
              </VuiBox>
            </VuiBox>

            <VuiBox display="flex" gap="10px">
              <button onClick={saveDrill} disabled={!newDrill.title.trim()} style={{
                background: newDrill.title.trim() ? "#4ade80" : "rgba(255,255,255,.1)",
                color: newDrill.title.trim() ? "#000" : "rgba(255,255,255,.4)",
                border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13,
                fontWeight: 700, cursor: newDrill.title.trim() ? "pointer" : "not-allowed",
                fontFamily: "Inter,sans-serif",
              }}>
                {t("Save Drill", "Guardar Ejercicio")}
              </button>
              <button onClick={() => { setCreating(false); setAudioUrl(null); setAudioBlob(null); }} style={{
                background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)",
                border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13,
                cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}>
                {t("Cancel", "Cancelar")}
              </button>
            </VuiBox>
          </VuiBox>
        )}

        {/* Drill list */}
        <VuiBox sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: "10px" }}>
          {myDrills.length === 0 && !creating ? (
            <VuiBox sx={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: "12px", opacity: 0.5,
            }}>
              <span style={{ fontSize: 48 }}>📝</span>
              <VuiTypography variant="button" color="text">
                {t("No custom drills yet. Create your first!", "Sin ejercicios personalizados. ¡Crea el primero!")}
              </VuiTypography>
            </VuiBox>
          ) : (
            myDrills.map(drill => (
              <VuiBox key={drill.id} sx={{
                background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                borderRadius: "12px", padding: "14px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <VuiBox sx={{ flex: 1 }}>
                  <VuiBox display="flex" alignItems="center" gap="8px" mb={0.5}>
                    <VuiTypography variant="button" color="white" fontWeight="bold">
                      {drill.title}
                    </VuiTypography>
                    <span style={{
                      background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "2px 8px",
                      fontSize: 10, color: "rgba(255,255,255,.6)",
                    }}>
                      {drill.ageGroup}
                    </span>
                    <span style={{
                      background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "2px 8px",
                      fontSize: 10, color: "rgba(255,255,255,.6)",
                    }}>
                      {drill.duration} min
                    </span>
                  </VuiBox>
                  <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.5)", display: "block", marginBottom: 6 }}>
                    {drill.description || t("No description", "Sin descripción")}
                  </VuiTypography>
                  {drill.audioUrl && (
                    <audio controls src={drill.audioUrl} style={{ height: 32 }} />
                  )}
                </VuiBox>

                <button onClick={() => deleteDrill(drill.id)} style={{
                  background: "rgba(239,68,68,.15)", color: "#ef4444",
                  border: "none", borderRadius: 6, padding: "6px 10px",
                  fontSize: 11, cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}>
                  {t("Delete", "Eliminar")}
                </button>
              </VuiBox>
            ))
          )}
        </VuiBox>

      </VuiBox>
    </DashboardLayout>
  );
}

export default MyDrills;

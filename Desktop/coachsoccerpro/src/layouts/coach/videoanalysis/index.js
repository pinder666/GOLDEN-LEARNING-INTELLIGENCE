import { useState, useRef } from "react";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import {
  analyzeVideoElement,
  buildInsights,
  buildPenaltyInsights,
  buildShareCard,
  playAnalysisLine,
  drawSkeleton,
} from "services/videoAnalysis";

function VideoAnalysis() {
  const [lang, setLang] = useState("en");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [scenario, setScenario] = useState("open");
  const [keeperNote, setKeeperNote] = useState(null);
  const [shareBusy, setShareBusy] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const overlayRef = useRef(null);
  const outcomeRef = useRef(null);

  const t = (en, es) => lang === "es" ? es : en;

  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // Coach voice reads the verdicts in sequence.
  const speakKeys = (keys, language) => {
    stopVoice();
    let idx = 0;
    const playNext = () => {
      if (idx >= keys.length) return;
      const audio = playAnalysisLine(keys[idx], language);
      audioRef.current = audio;
      idx += 1;
      audio.onended = playNext;
    };
    playNext();
  };

  const speakOne = (insight) => {
    stopVoice();
    audioRef.current = playAnalysisLine(insight.audioKey, lang);
  };

  // Live skeleton overlay during analysis
  const drawOverlay = (poses) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    poses.forEach((lm, i) =>
      drawSkeleton(ctx, lm, canvas.width, canvas.height, i === 0 ? "#4ade80" : "#60a5fa")
    );
  };

  const clearOverlay = () => {
    const canvas = overlayRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setResults(null);
      setAnalysisError(null);
    }
  };

  const analyzeVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    setAnalyzing(true);
    setProgress(0);
    setResults(null);
    setKeeperNote(null);
    setAnalysisError(null);

    try {
      const outcome = await analyzeVideoElement(video, (p) => setProgress(p), {
        scenario,
        onFrame: drawOverlay,
      });
      outcomeRef.current = outcome;

      if (outcome.error) {
        setAnalysisError(
          outcome.error === "no-player"
            ? t(
                "No player detected in the clip. Make sure the players are clearly visible.",
                "No se detectó ningún jugador en el clip. Asegúrate de que los jugadores sean claramente visibles."
              )
            : t("Could not read this video. Try a different clip.", "No se pudo leer este video. Prueba otro clip.")
        );
      } else if (scenario === "penalty") {
        const { cards, keeperNote: kn } = buildPenaltyInsights(outcome.metrics, lang);
        setResults(cards);
        setKeeperNote(kn);
        const keys = ["intro-penalty", ...cards.map((c) => c.audioKey)];
        if (kn) keys.push(kn.audioKey);
        speakKeys(keys, lang);
      } else {
        const insights = buildInsights(outcome.metrics);
        setResults(insights);
        speakKeys(["intro", ...insights.map((i) => i.audioKey)], lang);
      }

      // Benchmark seed: every analysis logged locally (future: Supabase + age group)
      try {
        const log = JSON.parse(localStorage.getItem("csp_analysis_log") || "[]");
        log.push({ at: new Date().toISOString(), scenario, metrics: outcome.metrics || null });
        localStorage.setItem("csp_analysis_log", JSON.stringify(log.slice(-200)));
      } catch { /* non-critical */ }
    } catch (err) {
      console.error("Video analysis failed:", err);
      setAnalysisError(t("Analysis failed. Try a shorter clip.", "El análisis falló. Prueba un clip más corto."));
    } finally {
      setAnalyzing(false);
    }
  };

  // Parent-facing share card (SoccerMental-stamped) — downloads a PNG
  const sendToParent = async () => {
    const video = videoRef.current;
    const outcome = outcomeRef.current;
    if (!video || !results || !outcome) return;
    setShareBusy(true);
    try {
      const frameT = outcome.strikeT ?? (outcome.duration ? outcome.duration / 2 : 0);
      const dataUrl = await buildShareCard(video, frameT, results, { scenario, lang });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `analysis-${scenario}-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error("Share card failed:", err);
    } finally {
      setShareBusy(false);
    }
  };

  const clearVideo = () => {
    stopVoice();
    clearOverlay();
    outcomeRef.current = null;
    setVideoFile(null);
    setVideoUrl(null);
    setResults(null);
    setKeeperNote(null);
    setAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#4ade80";
    if (score >= 60) return "#fbbf24";
    return "#ef4444";
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <VuiBox mb={1} display="flex" justifyContent="space-between" alignItems="center">
          <VuiBox>
            <VuiTypography variant="h5" color="white" fontWeight="bold">
              {t("Video Analysis", "Análisis de Video")}
            </VuiTypography>
            <VuiTypography variant="caption" color="text">
              {t("Upload a clip. AI analyzes player movement.", "Sube un clip. La IA analiza el movimiento del jugador.")}
            </VuiTypography>
          </VuiBox>

          <VuiBox display="flex" gap="10px" alignItems="center">
            {/* Scenario picker */}
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.08)", borderRadius: 20, padding: 3 }}>
              {[
                { key: "open", en: "Open Play", es: "Juego" },
                { key: "penalty", en: "Penalty", es: "Penal" },
              ].map(s => (
                <button key={s.key} onClick={() => setScenario(s.key)} disabled={analyzing} style={{
                  background: scenario === s.key ? "#60a5fa" : "transparent",
                  color: scenario === s.key ? "#000" : "rgba(255,255,255,.6)",
                  border: "none", borderRadius: 18, padding: "4px 14px",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}>
                  {lang === "es" ? s.es : s.en}
                </button>
              ))}
            </div>

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
          </VuiBox>
        </VuiBox>

        {/* Main content */}
        <VuiBox sx={{ flex: 1, display: "flex", gap: "16px", overflow: "hidden" }}>

          {/* Video panel */}
          <VuiBox sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Upload / Video */}
            <VuiBox sx={{
              flex: 1, background: "rgba(255,255,255,.04)", borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px dashed rgba(255,255,255,.15)", position: "relative", overflow: "hidden",
            }}>
              {videoUrl ? (
                <VuiBox sx={{ position: "relative", maxWidth: "100%", maxHeight: "100%", display: "flex" }}>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    crossOrigin="anonymous"
                    playsInline
                    style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 10 }}
                  />
                  <canvas
                    ref={overlayRef}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      pointerEvents: "none", borderRadius: 10,
                    }}
                  />
                </VuiBox>
              ) : (
                <VuiBox sx={{ textAlign: "center", padding: "40px" }}>
                  <span style={{ fontSize: 48, opacity: 0.3 }}>🎥</span>
                  <VuiTypography variant="button" sx={{ color: "rgba(255,255,255,.4)", display: "block", marginTop: 12 }}>
                    {t("Drop video here or click to upload", "Suelta un video aquí o haz clic para subir")}
                  </VuiTypography>
                  <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.25)", display: "block", marginTop: 4 }}>
                    {t("MP4, MOV, or WEBM • Max 100MB", "MP4, MOV o WEBM • Máx 100MB")}
                  </VuiTypography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    style={{
                      position: "absolute", inset: 0, opacity: 0, cursor: "pointer",
                    }}
                  />
                </VuiBox>
              )}
            </VuiBox>

            {/* Controls */}
            {videoUrl && (
              <VuiBox display="flex" gap="10px">
                <button onClick={analyzeVideo} disabled={analyzing} style={{
                  background: analyzing ? "rgba(255,255,255,.1)" : "#4ade80",
                  color: analyzing ? "rgba(255,255,255,.5)" : "#000",
                  border: "none", borderRadius: 8, padding: "10px 24px",
                  fontSize: 13, fontWeight: 700, cursor: analyzing ? "not-allowed" : "pointer",
                  fontFamily: "Inter,sans-serif",
                }}>
                  {analyzing
                    ? `${t("Analyzing", "Analizando")} ${Math.round(progress * 100)}%`
                    : t("🧠 Analyze Video", "🧠 Analizar Video")}
                </button>
                {results && (
                  <button onClick={sendToParent} disabled={shareBusy} style={{
                    background: shareBusy ? "rgba(255,255,255,.1)" : "#60a5fa",
                    color: shareBusy ? "rgba(255,255,255,.5)" : "#000",
                    border: "none", borderRadius: 8, padding: "10px 20px",
                    fontSize: 13, fontWeight: 700, cursor: shareBusy ? "wait" : "pointer",
                    fontFamily: "Inter,sans-serif",
                  }}>
                    {shareBusy ? t("Building...", "Creando...") : t("📤 Send to Parent", "📤 Enviar a Padre")}
                  </button>
                )}
                <button onClick={clearVideo} style={{
                  background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)",
                  border: "none", borderRadius: 8, padding: "10px 16px",
                  fontSize: 13, cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}>
                  {t("Clear", "Limpiar")}
                </button>
              </VuiBox>
            )}
          </VuiBox>

          {/* Results panel */}
          <VuiBox sx={{
            width: 340, flexShrink: 0, background: "rgba(255,255,255,.04)",
            borderRadius: "12px", padding: "14px 16px", overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <VuiTypography variant="button" color="white" fontWeight="bold" mb={1.5}>
              {t("Analysis Results", "Resultados del Análisis")}
            </VuiTypography>

            {results ? (
              <VuiBox sx={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflow: "hidden" }}>
                {results.map((insight, i) => (
                  <VuiBox key={i} sx={{
                    background: "rgba(0,0,0,.2)", borderRadius: "10px", padding: "12px",
                    borderLeft: `3px solid ${getScoreColor(insight.score)}`,
                  }}>
                    <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                        {lang === "es" ? insight.labelEs : insight.label}
                      </VuiTypography>
                      <VuiBox display="flex" alignItems="center" gap="6px">
                        <button
                          onClick={() => speakOne(insight)}
                          title={lang === "es" ? "Escuchar" : "Listen"}
                          style={{
                            background: "rgba(255,255,255,.08)", border: "none",
                            borderRadius: 10, padding: "2px 8px", fontSize: 12,
                            cursor: "pointer", lineHeight: 1.4,
                          }}
                        >
                          🔊
                        </button>
                        <span style={{
                          background: getScoreColor(insight.score) + "20",
                          color: getScoreColor(insight.score),
                          borderRadius: 12, padding: "2px 8px", fontSize: 12, fontWeight: 800,
                        }}>
                          {insight.score}
                        </span>
                      </VuiBox>
                    </VuiBox>
                    <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.7)", fontSize: 11, lineHeight: 1.5 }}>
                      {lang === "es" ? insight.feedbackEs : insight.feedback}
                    </VuiTypography>
                  </VuiBox>
                ))}

                {keeperNote && (
                  <VuiBox sx={{
                    background: "rgba(96,165,250,.10)", border: "1px solid rgba(96,165,250,.25)",
                    borderRadius: "8px", padding: "10px 12px",
                    display: "flex", alignItems: "flex-start", gap: "8px",
                  }}>
                    <button
                      onClick={() => { stopVoice(); audioRef.current = playAnalysisLine(keeperNote.audioKey, lang); }}
                      style={{
                        background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8,
                        padding: "2px 7px", fontSize: 11, cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      🔊
                    </button>
                    <VuiTypography variant="caption" sx={{ color: "#60a5fa", fontSize: 11, lineHeight: 1.5 }}>
                      🧤 {lang === "es" ? keeperNote.textEs : keeperNote.text}
                    </VuiTypography>
                  </VuiBox>
                )}

                <VuiBox mt="auto" sx={{
                  background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)",
                  borderRadius: "8px", padding: "10px 12px",
                }}>
                  <VuiTypography variant="caption" sx={{ color: "#4ade80", fontSize: 11 }}>
                    {scenario === "penalty"
                      ? t(
                          "💡 Film penalties from behind or beside the taker, with the keeper in frame.",
                          "💡 Graba los penales desde atrás o al lado del lanzador, con el portero en cuadro."
                        )
                      : t(
                          "💡 Tip: Record 5-10 second clips of specific moments for best results.",
                          "💡 Tip: Graba clips de 5-10 segundos de momentos específicos para mejores resultados."
                        )}
                  </VuiTypography>
                </VuiBox>
              </VuiBox>
            ) : analyzing ? (
              <VuiBox sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 10, height: 10, borderRadius: "50%", background: "#4ade80",
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.5)" }}>
                  {t("Analyzing player movement", "Analizando movimiento del jugador")} — {Math.round(progress * 100)}%
                </VuiTypography>
              </VuiBox>
            ) : analysisError ? (
              <VuiBox sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", px: 2 }}>
                <span style={{ fontSize: 40 }}>🔍</span>
                <VuiTypography variant="caption" sx={{ color: "#fbbf24", textAlign: "center", lineHeight: 1.6 }}>
                  {analysisError}
                </VuiTypography>
              </VuiBox>
            ) : (
              <VuiBox sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", opacity: 0.4 }}>
                <span style={{ fontSize: 40 }}>📊</span>
                <VuiTypography variant="caption" color="text" sx={{ textAlign: "center" }}>
                  {t("Upload a video and click 'Analyze' to see AI insights", "Sube un video y haz clic en 'Analizar' para ver insights de IA")}
                </VuiTypography>
              </VuiBox>
            )}
          </VuiBox>

        </VuiBox>

        {/* Info banner */}
        <VuiBox mt={1} sx={{
          background: "rgba(96,165,250,.08)", border: "1px solid rgba(96,165,250,.2)",
          borderRadius: "10px", padding: "10px 14px",
        }}>
          <VuiTypography variant="caption" sx={{ color: "#60a5fa", fontSize: 11 }}>
            {t(
              "🔒 Videos are processed locally and never uploaded to external servers. Analysis uses on-device AI.",
              "🔒 Los videos se procesan localmente y nunca se suben a servidores externos. El análisis usa IA en el dispositivo."
            )}
          </VuiTypography>
        </VuiBox>

      </VuiBox>
    </DashboardLayout>
  );
}

export default VideoAnalysis;

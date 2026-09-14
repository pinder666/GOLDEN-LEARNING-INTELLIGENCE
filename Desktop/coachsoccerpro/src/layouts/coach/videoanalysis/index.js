import { useState, useRef, useEffect } from "react";
import { useLang } from "useLang";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import {
  analyzeVideoElement,
  buildInsights,
  buildPenaltyInsights,
  buildDuelInsights,
  buildShareCard,
  playAnalysisLine,
  drawSkeleton,
  lockPlayerAt,
  computeAutoCrop,
  guideDetect,
  exportWalkthroughVideo,
} from "services/videoAnalysis";

// Dev roster for tagging (production: the coach's real roster from Supabase)
const ROSTER = [
  { id: 1, name: "Marcus J." },
  { id: 2, name: "Sofia G." },
  { id: 3, name: "Liam S." },
  { id: 4, name: "Emma W." },
  { id: 5, name: "Noah B." },
  { id: 6, name: "Olivia D." },
];

const LOCK_COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#fbbf24"];

// ─── LIVE CAPTURE — film through the app, the blinker coaches the filmer ───
function LiveCapture({ scenario, lang, onDone, onCancel }) {
  const camRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const busyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [hint, setHint] = useState({ text: "", color: "#4ade80", good: true });

  const t = (en, es) => (lang === "es" ? es : en);
  const cap = scenario === "open" ? 90 : 30;

  useEffect(() => {
    let guideTimer = null;
    let secTimer = null;
    let alive = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!alive) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        streamRef.current = stream;
        const v = camRef.current;
        v.srcObject = stream;
        await v.play();
        setReady(true);

        // The blinker: live pose reads coach the FILMER
        guideTimer = setInterval(async () => {
          if (busyRef.current || !v.videoWidth) return;
          busyRef.current = true;
          try {
            const people = await guideDetect(v);
            if (!alive) return;
            const maxTorso = people.length ? Math.max(...people.map((p) => p.torso)) : 0;
            const nearEdge = people.some(
              (p) => p.hipX < 0.07 || p.hipX > 0.93 || p.hipY > 0.96
            );
            if (!people.length) {
              setHint({ text: t("POINT AT THE ACTION", "APUNTA A LA ACCIÓN"), color: "#ef4444", good: false });
            } else if (maxTorso < 0.11) {
              setHint({ text: t("MOVE CLOSER", "ACÉRCATE"), color: "#fbbf24", good: false });
            } else if (nearEdge) {
              setHint({ text: t("KEEP PLAYERS IN FRAME", "MANTÉN A LOS JUGADORES EN CUADRO"), color: "#fbbf24", good: false });
            } else if (scenario !== "open" && people.length < 2) {
              setHint({ text: t("GET BOTH PLAYERS IN", "INCLUYE A AMBOS JUGADORES"), color: "#60a5fa", good: false });
            } else {
              setHint({ text: t("✓ GOOD — FILM THE MOMENT", "✓ BIEN — GRABA EL MOMENTO"), color: "#4ade80", good: true });
            }
          } catch { /* guidance is best-effort */ } finally {
            busyRef.current = false;
          }
        }, 160);

        secTimer = setInterval(() => {
          setSecs((s) => {
            if (recRef.current?.state === "recording") {
              if (s + 1 >= cap) stopRec();
              return s + 1;
            }
            return s;
          });
        }, 1000);
      } catch {
        onCancel("nocam"); // no camera permission → parent falls back
      }
    })();

    return () => {
      alive = false;
      if (guideTimer) clearInterval(guideTimer);
      if (secTimer) clearInterval(secTimer);
      try { recRef.current?.state === "recording" && recRef.current.stop(); } catch { /* noop */ }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line
  }, []);

  const pickMime = () => {
    const opts = ["video/mp4", "video/webm;codecs=vp9", "video/webm"];
    for (const m of opts) {
      try { if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m; } catch { /* noop */ }
    }
    return "";
  };

  const startRec = () => {
    const mime = pickMime();
    const mr = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime || "video/webm" });
      onDone(blob);
    };
    recRef.current = mr;
    mr.start(250);
    setSecs(0);
    setRec(true);
  };

  const stopRec = () => {
    try { recRef.current?.state === "recording" && recRef.current.stop(); } catch { /* noop */ }
    setRec(false);
  };

  return (
    <VuiBox sx={{ position: "fixed", inset: 0, zIndex: 2000, background: "#000", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes blinker { 50% { opacity: .35; } }`}</style>

      {/* Blinker — the filming coach */}
      {ready && (
        <VuiBox sx={{
          position: "absolute", top: 18, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 3,
        }}>
          <span style={{
            background: hint.color, color: "#000", borderRadius: 24,
            padding: "10px 22px", fontSize: 15, fontWeight: 900, letterSpacing: ".04em",
            fontFamily: "Inter,sans-serif",
            animation: hint.good ? "none" : "blinker 0.9s linear infinite",
            boxShadow: `0 0 24px ${hint.color}80`,
          }}>
            {hint.text}
          </span>
        </VuiBox>
      )}

      <video
        ref={camRef}
        playsInline
        muted
        style={{ flex: 1, minHeight: 0, width: "100%", objectFit: "contain", background: "#000" }}
      />

      {/* Controls */}
      <VuiBox sx={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 20px 26px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(transparent, rgba(0,0,0,.75))", zIndex: 3,
      }}>
        <button onClick={() => { stopRec(); onCancel("user"); }} style={{
          background: "rgba(255,255,255,.15)", color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "Inter,sans-serif",
        }}>
          {t("Cancel", "Cancelar")}
        </button>

        <button
          onClick={rec ? stopRec : startRec}
          disabled={!ready}
          style={{
            width: 74, height: 74, borderRadius: "50%",
            border: rec ? "4px solid #ef4444" : "4px solid rgba(255,255,255,.85)",
            background: "transparent", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{
            width: rec ? 30 : 56, height: rec ? 30 : 56,
            borderRadius: rec ? 8 : "50%", background: "#ef4444",
            transition: "all .2s",
            animation: rec ? "blinker 1.2s linear infinite" : "none",
          }} />
        </button>

        <span style={{
          color: rec ? "#ef4444" : "rgba(255,255,255,.7)", fontSize: 15, fontWeight: 800,
          fontFamily: "Inter,sans-serif", minWidth: 74, textAlign: "right",
        }}>
          {rec ? `● ${secs}s / ${cap}s` : `${t("max", "máx")} ${cap}s`}
        </span>
      </VuiBox>
    </VuiBox>
  );
}

function VideoAnalysis() {
  const [lang, setLang] = useLang();
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [scenario, setScenario] = useState("open");
  const [keeperNote, setKeeperNote] = useState(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0); // which tapped player the report focuses on
  const [anchors, setAnchors] = useState([]);        // coach-tapped player targets
  const [ballAnchor, setBallAnchor] = useState(null);
  // The ritual: upload → tap players → tap ball → analyze
  const [step, setStep] = useState("idle");          // "idle" | "players" | "ball" | "ready"
  const [capturing, setCapturing] = useState(false); // in-app camera with the blinker
  const [exporting, setExporting] = useState(0);     // 0 = idle, else progress 0..1
  const [taggedPlayer, setTaggedPlayer] = useState("");
  const [tagSaved, setTagSaved] = useState(false);
  // THE ARENA: analysis is blind outside this box. Auto-built around the
  // locked players; a finger-drag on the video overrides it.
  const [cropRect, setCropRect] = useState(null);
  const manualCropRef = useRef(false);
  const cropRef = useRef(null);
  cropRef.current = cropRect;
  const dragRef = useRef(null); // {x0,y0} while dragging
  const [reviewing, setReviewing] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const overlayRef = useRef(null);
  const outcomeRef = useRef(null);
  const reviewRef = useRef({ active: false });

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

  // Live skeleton overlay during analysis (+ tracked ball when tapped)
  const drawOverlay = (poses, _t, ball) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawArena(ctx, cropRef.current, canvas.width, canvas.height);
    poses.forEach((lm, i) =>
      drawSkeleton(ctx, lm, canvas.width, canvas.height, LOCK_COLORS[i % LOCK_COLORS.length])
    );
    if (ball && ball.conf > 0.25) {
      const r = Math.max(8, canvas.width / 70);
      ctx.beginPath();
      ctx.arc(ball.x * canvas.width, ball.y * canvas.height, r, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fb923c";
      ctx.stroke();
    }
  };

  const clearOverlay = () => {
    const canvas = overlayRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const loadVideo = (fileOrBlob) => {
    setVideoFile(fileOrBlob);
    setVideoUrl(URL.createObjectURL(fileOrBlob));
    setResults(null);
    setKeeperNote(null);
    setAnalysisError(null);
    setTargetIndex(0);
    setAnchors([]);
    setBallAnchor(null);
    setCropRect(null);
    manualCropRef.current = false;
    setStep("players"); // the ritual begins
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) loadVideo(file);
  };

  // BODY-SCAN LOCK: each tap scans that spot on the frozen frame, finds the
  // body under it, flashes its skeleton — locked BEFORE analysis ever runs.
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState(false);

  const toNorm = (e) => {
    const video = videoRef.current;
    if (!video) return null;
    const rect = video.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  };

  // Drag = draw the arena by hand. Tap = lock a player/ball.
  const handlePointerDown = (e) => {
    if (analyzing || reviewing || locking) return;
    if (step !== "players" && step !== "ball") return;
    const p = toNorm(e);
    if (!p) return;
    dragRef.current = { x0: p.x, y0: p.y, moved: false };
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toNorm(e);
    if (!p) return;
    if (!d.moved && Math.hypot(p.x - d.x0, p.y - d.y0) < 0.015) return;
    d.moved = true;
    const live = {
      x: Math.min(d.x0, p.x), y: Math.min(d.y0, p.y),
      w: Math.abs(p.x - d.x0), h: Math.abs(p.y - d.y0),
    };
    drawMarkers(anchors, ballAnchor, targetIndex, live);
  };

  const handlePointerUp = async (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const p = toNorm(e) || { x: d.x0, y: d.y0 };

    if (d.moved) {
      const box = {
        x: Math.min(d.x0, p.x), y: Math.min(d.y0, p.y),
        w: Math.abs(p.x - d.x0), h: Math.abs(p.y - d.y0),
      };
      if (box.w > 0.06 && box.h > 0.06) {
        manualCropRef.current = true;
        setCropRect(box);
        drawMarkers(anchors, ballAnchor, targetIndex, box);
      } else {
        drawMarkers(anchors, ballAnchor, targetIndex, cropRef.current);
      }
      return;
    }
    await handleVideoTap(p);
  };

  const handleVideoTap = async ({ x, y }) => {
    const video = videoRef.current;
    if (!video || analyzing || reviewing || locking) return;
    if (step !== "players" && step !== "ball") return;
    video.pause();

    const refreshCrop = (nextAnchors, nextBall) => {
      const box = manualCropRef.current
        ? cropRef.current
        : computeAutoCrop(nextAnchors, nextBall, scenario);
      setCropRect(box);
      return box;
    };

    if (step === "ball") {
      const box = refreshCrop(anchors, { x, y });
      setBallAnchor({ x, y });
      drawMarkers(anchors, { x, y }, targetIndex, box);
      setStep("ready"); // ball locked → ritual complete
      return;
    }

    // Tap near an existing lock removes it
    const hit = anchors.findIndex((a) => Math.hypot(a.x - x, a.y - y) < 0.035);
    if (hit >= 0) {
      const next = anchors.filter((_, i) => i !== hit);
      setAnchors(next);
      setTargetIndex(0);
      drawMarkers(next, ballAnchor, 0, refreshCrop(next, ballAnchor));
      return;
    }
    if (anchors.length >= 4) return;

    // Scan for the body under the tap — zoom scan, then wider search.
    // A failed scan NEVER blocks: the tap stays as a manual mark and the
    // lock happens during analysis across every frame.
    setLocking(true);
    setLockError(false);
    try {
      const lock = await lockPlayerAt(video, { x, y });
      const next = lock
        ? [...anchors, { x: lock.hip.x, y: lock.hip.y, lm: lock.lm }]
        : [...anchors, { x, y, manual: true }];
      if (!lock) {
        setLockError(true); // shown as info, not a stop
        setTimeout(() => setLockError(false), 2500);
      }
      setAnchors(next);
      setTargetIndex(0);
      drawMarkers(next, ballAnchor, 0, refreshCrop(next, ballAnchor));
    } finally {
      setLocking(false);
    }
  };

  const drawArena = (ctx, crop, w, h) => {
    if (!crop) return;
    ctx.save();
    ctx.strokeStyle = "rgba(34,211,238,0.9)";
    ctx.lineWidth = Math.max(2, w / 400);
    ctx.setLineDash([10, 7]);
    ctx.strokeRect(crop.x * w, crop.y * h, crop.w * w, crop.h * h);
    // dim everything outside the arena
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(5,8,20,0.45)";
    ctx.fillRect(0, 0, w, crop.y * h);
    ctx.fillRect(0, (crop.y + crop.h) * h, w, h - (crop.y + crop.h) * h);
    ctx.fillRect(0, crop.y * h, crop.x * w, crop.h * h);
    ctx.fillRect((crop.x + crop.w) * w, crop.y * h, w - (crop.x + crop.w) * w, crop.h * h);
    ctx.restore();
  };

  const drawMarkers = (marks, ball, picked = targetIndex, crop = cropRef.current) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawArena(ctx, crop, canvas.width, canvas.height);
    // Small marks — players can stand shoulder to shoulder
    const r = Math.max(9, canvas.width / 80);
    marks.forEach((p, i) => {
      const color = LOCK_COLORS[i % LOCK_COLORS.length];
      // The lock confirmation: the scanned body's skeleton in this
      // player's color — "got you"
      if (p.lm) drawSkeleton(ctx, p.lm, canvas.width, canvas.height, color);
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = i === picked ? color : "rgba(10,14,35,0.85)";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.fillStyle = i === picked ? "#000" : "#fff";
      ctx.font = `800 ${Math.round(r * 1.1)}px Inter, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), x, y + 1);
    });
    if (ball) {
      const x = ball.x * canvas.width;
      const y = ball.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fb923c";
      ctx.stroke();
      ctx.font = `${Math.round(r)}px Inter, Arial, sans-serif`;
      ctx.fillText("⚽", x, y + 1);
    }
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  };

  const clearTaps = () => {
    setAnchors([]);
    setBallAnchor(null);
    setTargetIndex(0);
    setCropRect(null);
    manualCropRef.current = false;
    clearOverlay();
    setStep("players"); // restart the ritual from the tap step
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
        targetIndex,
        anchors: anchors.length ? anchors : undefined,
        ballAnchor: ballAnchor || undefined,
        crop: cropRect || undefined,
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
        outcome.voiceKeys = keys;
      } else if (scenario === "duel") {
        const { cards, duelNote } = buildDuelInsights(outcome.metrics);
        setResults(cards);
        setKeeperNote(duelNote);
        outcome.voiceKeys = ["intro-duel", ...cards.map((c) => c.audioKey), duelNote.audioKey];
      } else {
        const insights = buildInsights(outcome.metrics);
        setResults(insights);
        outcome.voiceKeys = ["intro", ...insights.map((i) => i.audioKey)];
      }

      // The result IS the walkthrough: slow motion, skeletons live, the
      // coach voice delivering verdicts at the moment they apply.
      if (!outcome.error) {
        setTimeout(() => startReview(), 350);
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

  // Parent-facing share card (SoccerMental-stamped).
  // On the phone: opens the native share sheet (WhatsApp/SMS) straight from
  // the pitch. On desktop: downloads the PNG.
  const sendToParent = async () => {
    const video = videoRef.current;
    const outcome = outcomeRef.current;
    if (!video || !results || !outcome) return;
    setShareBusy(true);
    try {
      const frameT = outcome.strikeT ?? (outcome.duration ? outcome.duration / 2 : 0);
      const dataUrl = await buildShareCard(video, frameT, results, { scenario, lang });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `analysis-${Date.now()}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("Video Analysis", "Análisis de Video"),
          text: t(
            "Here's today's analysis of your child's play.",
            "Aquí está el análisis de hoy del juego de tu hijo."
          ),
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
      }
    } catch (err) {
      if (err?.name !== "AbortError") console.error("Share card failed:", err);
    } finally {
      setShareBusy(false);
    }
  };

  // Export the walkthrough as a real VIDEO (skeletons + voice + SM stamp)
  const exportVideo = async () => {
    const video = videoRef.current;
    const outcome = outcomeRef.current;
    if (!video || !outcome || exporting) return;
    stopReviewIfRunning();
    stopVoice();
    setExporting(0.01);
    try {
      const { blob, ext } = await exportWalkthroughVideo(video, outcome, {
        lang, scenario,
        voiceKeys: outcome.voiceKeys || [],
        onProgress: (p) => setExporting(Math.max(0.01, p)),
      });
      const file = new File([blob], `analysis-${Date.now()}.${ext}`, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("Video Analysis", "Análisis de Video"),
          text: t("Today's analysis of your child's play.", "El análisis de hoy del juego de tu hijo."),
        });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
      }
    } catch (err) {
      if (err?.name !== "AbortError") console.error("Video export failed:", err);
    } finally {
      setExporting(0);
    }
  };

  // Tag this analysis to a roster player → their season history + benchmarks
  const saveTag = () => {
    if (!taggedPlayer || !outcomeRef.current) return;
    try {
      const log = JSON.parse(localStorage.getItem("csp_analysis_log") || "[]");
      if (log.length) {
        log[log.length - 1].player = taggedPlayer;
        localStorage.setItem("csp_analysis_log", JSON.stringify(log));
      }
      setTagSaved(true);
      setTimeout(() => setTagSaved(false), 2500);
    } catch { /* non-critical */ }
  };

  // ANALYST REPLAY: slow-motion playback with live skeletons; pauses at the
  // key moment and lets the coach voice deliver the verdicts, then rolls on.
  const startReview = () => {
    const video = videoRef.current;
    const outcome = outcomeRef.current;
    if (!video || !outcome?.allFrames?.length || reviewing) return;

    stopVoice();
    setReviewing(true);
    const state = { active: true, paused: false };
    reviewRef.current = state;

    const frames = outcome.allFrames;
    const momentT = outcome.strikeT ?? (outcome.duration ? outcome.duration / 2 : 0);
    let momentDone = false;

    const ballPath = outcome.ballPath || null;
    const drawAt = (time) => {
      let best = frames[0];
      for (const f of frames) if (Math.abs(f.t - time) < Math.abs(best.t - time)) best = f;
      let ball = null;
      if (ballPath) {
        ball = ballPath.reduce((p, c) => (Math.abs(c.t - time) < Math.abs(p.t - time) ? c : p));
      }
      drawOverlay(best.poses, time, ball);
    };

    const onTime = () => {
      if (!state.active) return;
      drawAt(video.currentTime);
      if (!momentDone && video.currentTime >= momentT) {
        momentDone = true;
        video.pause();
        drawAt(momentT);
        // Speak the verdicts over the frozen key moment, then resume
        const keys = outcome.voiceKeys
          || [...(results || []).map((c) => c.audioKey), ...(keeperNote ? [keeperNote.audioKey] : [])];
        let idx = 0;
        const next = () => {
          if (!state.active) return;
          if (idx >= keys.length) {
            video.play().catch(() => {});
            return;
          }
          const audio = playAnalysisLine(keys[idx], lang);
          audioRef.current = audio;
          idx += 1;
          audio.onended = next;
        };
        next();
      }
    };

    const onEnded = () => stopReview();

    const stopReview = () => {
      state.active = false;
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
      video.playbackRate = 1;
      video.pause();
      stopVoice();
      setReviewing(false);
      if (anchors.length) drawMarkers(anchors, ballAnchor);
      else clearOverlay();
    };
    reviewRef.current.stop = stopReview;

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    video.currentTime = Math.max(0, momentT - 3);
    video.playbackRate = 0.35;
    video.muted = true;
    video.play().catch(() => {});
  };

  const stopReviewIfRunning = () => {
    if (reviewRef.current?.stop) reviewRef.current.stop();
  };

  const clearVideo = () => {
    stopReviewIfRunning();
    stopVoice();
    clearOverlay();
    outcomeRef.current = null;
    setVideoFile(null);
    setVideoUrl(null);
    setResults(null);
    setKeeperNote(null);
    setAnalysisError(null);
    setTargetIndex(0);
    setAnchors([]);
    setBallAnchor(null);
    setCropRect(null);
    manualCropRef.current = false;
    setStep("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#4ade80";
    if (score >= 60) return "#fbbf24";
    return "#ef4444";
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {/* In-app camera: the blinker coaches the filmer live */}
      {capturing && (
        <LiveCapture
          scenario={scenario}
          lang={lang}
          onDone={(blob) => {
            setCapturing(false);
            loadVideo(blob);
          }}
          onCancel={(reason) => {
            setCapturing(false);
            // No camera permission → native capture input as fallback
            if (reason === "nocam") cameraInputRef.current?.click();
          }}
        />
      )}

      <VuiBox py={1} sx={{
        height: { xs: "auto", md: "calc(100vh - 100px)" },
        minHeight: { xs: "calc(100vh - 100px)", md: "auto" },
        display: "flex", flexDirection: "column",
        overflow: { xs: "visible", md: "hidden" },
      }}>

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
                { key: "duel", en: "Duel", es: "Duelo" },
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
        <VuiBox sx={{
          flex: 1, display: "flex", gap: "16px",
          flexDirection: { xs: "column", md: "row" },
          overflow: { xs: "visible", md: "hidden" },
        }}>

          {/* Video panel */}
          <VuiBox sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Upload / Video */}
            <VuiBox sx={{
              flex: 1, background: "rgba(255,255,255,.04)", borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px dashed rgba(255,255,255,.15)", position: "relative", overflow: "hidden",
            }}>
              {videoUrl ? (
                <VuiBox
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  sx={{ position: "relative", maxWidth: "100%", maxHeight: "100%", display: "flex", cursor: analyzing || reviewing ? "default" : "crosshair", touchAction: step === "players" || step === "ball" ? "none" : "auto" }}
                >
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls={step === "ready" || !!results}
                    crossOrigin="anonymous"
                    playsInline
                    onLoadedData={(e) => { e.target.pause(); e.target.currentTime = 0.05; }}
                    style={{
                      maxWidth: "100%", maxHeight: "100%", borderRadius: 10,
                      // Frozen and untouchable while the coach is tapping marks
                      pointerEvents: step === "players" || step === "ball" ? "none" : "auto",
                    }}
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

                  {/* Film straight from the phone camera — in-app, with the
                      live blinker coaching the shot */}
                  <button
                    onClick={() => setCapturing(true)}
                    style={{
                      position: "relative", zIndex: 2, marginTop: 18,
                      background: "#4ade80", color: "#000", border: "none",
                      borderRadius: 10, padding: "12px 26px", fontSize: 14,
                      fontWeight: 800, cursor: "pointer", fontFamily: "Inter,sans-serif",
                    }}
                  >
                    📹 {t("Film Now", "Grabar Ahora")}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    style={{
                      position: "absolute", inset: 0, opacity: 0, cursor: "pointer",
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </VuiBox>
              )}
            </VuiBox>

            {/* THE RITUAL — step prompts, no toggles, no memory needed */}
            {videoUrl && !analyzing && !results && (step === "players" || step === "ball") && (
              <VuiBox sx={{
                background: step === "players" ? "rgba(74,222,128,.10)" : "rgba(251,146,60,.10)",
                border: `1px solid ${step === "players" ? "rgba(74,222,128,.35)" : "rgba(251,146,60,.35)"}`,
                borderRadius: "10px", padding: "12px 16px",
                display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
              }}>
                <VuiTypography variant="button" sx={{ color: step === "players" ? "#4ade80" : "#fb923c", fontWeight: 800 }}>
                  {step === "players"
                    ? `1/3 — ${t("Tap a player to lock on", "Toca un jugador para fijarlo")}`
                    : `2/3 — ${t("Now tap the ball", "Ahora toca el balón")}`}
                </VuiTypography>
                <VuiTypography variant="caption" sx={{
                  color: lockError ? "#fbbf24" : "rgba(255,255,255,.55)",
                  fontSize: 11, flex: 1, fontWeight: lockError ? 700 : 400,
                }}>
                  {locking
                    ? t("Scanning...", "Escaneando...")
                    : lockError
                    ? t("Marked — couldn't confirm the body yet, I'll lock on during analysis", "Marcado — no pude confirmar el cuerpo aún, lo fijaré durante el análisis")
                    : step === "players"
                    ? anchors.length
                      ? t(`🔒 ${anchors.length} locked — skeleton confirms each lock. Tap a mark to remove.`, `🔒 ${anchors.length} fijados — el esqueleto confirma cada uno. Toca una marca para quitarla.`)
                      : scenario === "duel"
                        ? t("Lock YOUR player — lock the opponent too for the full duel verdict", "Fija a TU jugador — fija también al oponente para el veredicto completo")
                        : scenario === "penalty"
                          ? t("Lock the kicker — lock the keeper too for the keeper read", "Fija al lanzador — fija también al portero para su lectura")
                          : t("Lock 1-4 players — or drag a box to set the arena first", "Fija 1-4 jugadores — o arrastra un recuadro para definir el área primero")
                    : t("The orange ring will follow it", "El anillo naranja lo seguirá")}
                </VuiTypography>
                {step === "players" && (
                  <button
                    onClick={() => setStep("ball")}
                    disabled={anchors.length < 1}
                    style={{
                      background: anchors.length >= 1 ? "#4ade80" : "rgba(255,255,255,.1)",
                      color: anchors.length >= 1 ? "#000" : "rgba(255,255,255,.4)",
                      border: "none", borderRadius: 8, padding: "8px 18px",
                      fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "Inter,sans-serif",
                    }}
                  >
                    {t("Next →", "Siguiente →")}
                  </button>
                )}
                {step === "ball" && (
                  <button
                    onClick={() => {
                      if (!manualCropRef.current) {
                        const box = computeAutoCrop(anchors, null, scenario);
                        setCropRect(box);
                        drawMarkers(anchors, null, targetIndex, box);
                      }
                      setStep("ready");
                    }}
                    style={{
                      background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)",
                      border: "none", borderRadius: 8, padding: "8px 14px",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
                    }}
                  >
                    {t("Skip ball", "Sin balón")}
                  </button>
                )}
              </VuiBox>
            )}

            {/* Focus picker — which tapped player the report is about */}
            {videoUrl && anchors.length > 1 && (step === "ready" || results) && scenario === "open" && (
              <VuiBox display="flex" gap="8px" alignItems="center" flexWrap="wrap">
                <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>
                  {t("Report focuses on:", "El informe se enfoca en:")}
                </VuiTypography>
                {anchors.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { setTargetIndex(i); drawMarkers(anchors, ballAnchor, i); }}
                    disabled={analyzing}
                    style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: targetIndex === i ? "#4ade80" : "rgba(255,255,255,.1)",
                      color: targetIndex === i ? "#000" : "#fff",
                      border: targetIndex === i ? "none" : "1px solid rgba(255,255,255,.25)",
                      fontSize: 14, fontWeight: 800, cursor: "pointer",
                      fontFamily: "Inter,sans-serif",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </VuiBox>
            )}

            {/* Controls — appear once the ritual is complete */}
            {videoUrl && (step === "ready" || results || analyzing) && (
              <VuiBox display="flex" gap="10px" flexWrap="wrap">
                <button onClick={analyzeVideo} disabled={analyzing} style={{
                  background: analyzing ? "rgba(255,255,255,.1)" : "#4ade80",
                  color: analyzing ? "rgba(255,255,255,.5)" : "#000",
                  border: "none", borderRadius: 8, padding: "10px 24px",
                  fontSize: 13, fontWeight: 700, cursor: analyzing ? "not-allowed" : "pointer",
                  fontFamily: "Inter,sans-serif",
                }}>
                  {analyzing
                    ? `${t("Analyzing", "Analizando")} ${Math.round(progress * 100)}%`
                    : `3/3 — ${t("🧠 Analyze", "🧠 Analizar")}`}
                </button>
                {!analyzing && (
                  <button onClick={clearTaps} style={{
                    background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)",
                    border: "none", borderRadius: 8, padding: "10px 14px",
                    fontSize: 12, cursor: "pointer", fontFamily: "Inter,sans-serif",
                  }}>
                    ↺ {t("Re-mark", "Re-marcar")}
                  </button>
                )}
                {results && !analyzing && (
                  <button
                    onClick={reviewing ? stopReviewIfRunning : startReview}
                    style={{
                      background: reviewing ? "#fbbf24" : "rgba(255,255,255,.12)",
                      color: reviewing ? "#000" : "#fff",
                      border: "1px solid rgba(255,255,255,.2)", borderRadius: 8,
                      padding: "10px 20px", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "Inter,sans-serif",
                    }}
                  >
                    {reviewing ? t("⏹ Stop Review", "⏹ Parar Revisión") : t("🎬 Analyst Replay", "🎬 Repetición Analista")}
                  </button>
                )}
                {results && !analyzing && (
                  <button onClick={exportVideo} disabled={!!exporting} style={{
                    background: exporting ? "rgba(255,255,255,.1)" : "#f472b6",
                    color: exporting ? "rgba(255,255,255,.5)" : "#000",
                    border: "none", borderRadius: 8, padding: "10px 20px",
                    fontSize: 13, fontWeight: 700, cursor: exporting ? "wait" : "pointer",
                    fontFamily: "Inter,sans-serif",
                  }}>
                    {exporting
                      ? `${t("Exporting", "Exportando")} ${Math.round(exporting * 100)}%`
                      : t("🎥 Export Video", "🎥 Exportar Video")}
                  </button>
                )}
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
            width: { xs: "100%", md: 340 }, flexShrink: 0, background: "rgba(255,255,255,.04)",
            borderRadius: "12px", padding: "14px 16px",
            overflow: { xs: "visible", md: "hidden" },
            display: "flex", flexDirection: "column",
            minHeight: { xs: 300, md: "auto" },
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

                {/* Tag to roster: this clip becomes part of a kid's story */}
                <VuiBox display="flex" gap="6px" alignItems="center">
                  <select
                    value={taggedPlayer}
                    onChange={(e) => setTaggedPlayer(e.target.value)}
                    style={{
                      flex: 1, background: "rgba(255,255,255,.08)", color: "#fff",
                      border: "1px solid rgba(255,255,255,.15)", borderRadius: 8,
                      padding: "7px 10px", fontSize: 12, fontFamily: "Inter,sans-serif",
                    }}
                  >
                    <option value="" style={{ color: "#000" }}>
                      {t("Tag a player…", "Etiquetar jugador…")}
                    </option>
                    {ROSTER.map((p) => (
                      <option key={p.id} value={p.name} style={{ color: "#000" }}>{p.name}</option>
                    ))}
                  </select>
                  <button onClick={saveTag} disabled={!taggedPlayer} style={{
                    background: tagSaved ? "#4ade80" : taggedPlayer ? "rgba(74,222,128,.25)" : "rgba(255,255,255,.08)",
                    color: tagSaved ? "#000" : taggedPlayer ? "#4ade80" : "rgba(255,255,255,.35)",
                    border: "none", borderRadius: 8, padding: "7px 12px",
                    fontSize: 12, fontWeight: 700, cursor: taggedPlayer ? "pointer" : "default",
                    fontFamily: "Inter,sans-serif", whiteSpace: "nowrap",
                  }}>
                    {tagSaved ? t("✓ Saved", "✓ Guardado") : t("Save", "Guardar")}
                  </button>
                </VuiBox>

                {/* Honest tracking confidence + the filming lesson */}
                {outcomeRef.current?.coverage && (
                  <VuiBox sx={{
                    background: "rgba(255,255,255,.05)", borderRadius: "8px", padding: "8px 12px",
                  }}>
                    <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.65)", fontSize: 10.5, lineHeight: 1.5 }}>
                      🎯 {outcomeRef.current.coverage.map((c, i) =>
                        `${t("Player", "Jugador")} ${i + 1}: ${c}%`).join(" · ")}
                      {" "}{t("of the clip tracked", "del clip rastreado")}
                      {Math.min(...outcomeRef.current.coverage) < 70 && (
                        <span style={{ color: "#fbbf24", display: "block", marginTop: 2 }}>
                          {t(
                            "For a stronger read: film closer, keep players in frame, steady phone.",
                            "Para una mejor lectura: graba más cerca, mantén a los jugadores en cuadro, teléfono firme."
                          )}
                        </span>
                      )}
                    </VuiTypography>
                  </VuiBox>
                )}

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

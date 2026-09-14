import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useLang } from "useLang";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { PitchCanvas, loadCustomDrills } from "layouts/coach/drills";
import { generateDrill } from "services/drillAI";
import { CAT_COLORS } from "data/drills";

// ─── Editor constants ───────────────────────────────────────────────────────
const W = 720, H = 480;
const PLAYER_COLS = [
  { col: "#4ade80", name: "Attacker", nameEs: "Atacante" },
  { col: "#ef4444", name: "Defender", nameEs: "Defensor" },
  { col: "#fbbf24", name: "Coach", nameEs: "Entrenador" },
];
const CONE_COLS = ["#ef4444", "#3b82f6", "#f59e0b", "#a855f7", "rgba(255,255,255,.5)"];
const CATS_LIST = Object.keys(CAT_COLORS);

// ─── The editable pitch (same look as the library pitch) ────────────────────
function EditorPitch({ players, cones, arrows, positions, tool, tempArrow, onPitchEvent }) {
  const svgRef = useRef(null);

  const toPitch = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      onPointerDown={(e) => onPitchEvent("down", toPitch(e))}
      onPointerMove={(e) => onPitchEvent("move", toPitch(e))}
      onPointerUp={(e) => onPitchEvent("up", toPitch(e))}
      style={{
        width: "100%", height: "100%", display: "block",
        background: "#1a4a2a", borderRadius: 10, touchAction: "none",
        cursor: tool === "move" ? "grab" : "crosshair",
      }}
    >
      <rect x={0} y={0} width={W} height={H} fill="#1a4a2a" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={30} y={30 + i * 27} width={620} height={27}
          fill={i % 2 === 0 ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.04)"} />
      ))}
      <rect x={30} y={30} width={620} height={380} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={2} />
      <line x1={340} y1={30} x2={340} y2={410} stroke="rgba(255,255,255,.4)" strokeWidth={1.5} />
      <circle cx={340} cy={220} r={55} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5} />
      <circle cx={340} cy={220} r={3} fill="rgba(255,255,255,.5)" />
      <rect x={30} y={140} width={100} height={160} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5} />
      <rect x={30} y={167} width={55} height={106} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1} />
      <rect x={550} y={140} width={100} height={160} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5} />
      <rect x={595} y={167} width={55} height={106} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1} />
      <rect x={14} y={187} width={16} height={66} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5} />
      <rect x={650} y={187} width={16} height={66} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5} />

      {cones.map((c, i) => (
        <polygon key={`c${i}`} points={`${c.x},${c.y - 8} ${c.x - 5},${c.y + 4} ${c.x + 5},${c.y + 4}`}
          fill={c.col} stroke="rgba(0,0,0,.3)" strokeWidth={0.5} />
      ))}
      {arrows.map((a, i) => (
        <line key={`a${i}`} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
          stroke={a.col || "#4ade80"} strokeWidth={1.8} strokeOpacity={0.7} markerEnd="url(#edAh)" />
      ))}
      {tempArrow && (
        <line x1={tempArrow.x1} y1={tempArrow.y1} x2={tempArrow.x2} y2={tempArrow.y2}
          stroke="#4ade80" strokeWidth={1.8} strokeOpacity={0.5} strokeDasharray="5,3" />
      )}
      <defs>
        <marker id="edAh" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#4ade80" />
        </marker>
      </defs>

      {players.map((p) => {
        const pos = positions[p.id] || { x: 340, y: 220 };
        return (
          <g key={p.id} transform={`translate(${pos.x},${pos.y})`}>
            <circle r={11} fill={p.col} fillOpacity={0.25} />
            <circle r={8} fill={p.col} />
            <text textAnchor="middle" dy={4} fontSize={8} fontFamily="Inter,sans-serif" fontWeight="700" fill="#000">
              {p.lbl}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
function MyDrills() {
  const [lang, setLang] = useLang();
  const t = (en, es) => (lang === "es" ? es : en);

  // Board state
  const [players, setPlayers] = useState([]);
  const [cones, setCones] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [steps, setSteps] = useState([{}]); // per step: { playerId: {x,y} }
  const [curStep, setCurStep] = useState(0);
  const [tool, setTool] = useState("move");
  const [playerColIdx, setPlayerColIdx] = useState(0);
  const [coneColIdx, setConeColIdx] = useState(0);
  const [tempArrow, setTempArrow] = useState(null);
  const dragRef = useRef(null);
  const idRef = useRef(1);

  // Preview
  const [preview, setPreview] = useState(false);

  // Meta
  const [meta, setMeta] = useState({ title: "", cat: "Technical", age: "U10", dur: 10, desc: "", equipment: "" });

  // AI
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState(null);

  // Voice
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Saved
  const [saved, setSaved] = useState(loadCustomDrills);
  const [savedMsg, setSavedMsg] = useState(false);

  // The Assistant sent a drill request → build it on arrival
  useEffect(() => {
    const p = sessionStorage.getItem("csp_drill_prompt");
    if (p) {
      sessionStorage.removeItem("csp_drill_prompt");
      setAiText(p);
      setTimeout(() => buildWithAI(p), 400);
    }
    // eslint-disable-next-line
  }, []);

  const positions = steps[curStep] || {};

  // ── Board interactions ──
  const hitPlayer = (pt) =>
    players.find((p) => {
      const pos = positions[p.id];
      return pos && Math.hypot(pos.x - pt.x, pos.y - pt.y) < 16;
    });
  const hitConeIdx = (pt) => cones.findIndex((c) => Math.hypot(c.x - pt.x, c.y - pt.y) < 14);
  const hitArrowIdx = (pt) =>
    arrows.findIndex((a) => {
      const dx = a.x2 - a.x1, dy = a.y2 - a.y1;
      const len2 = dx * dx + dy * dy || 1;
      const s = Math.max(0, Math.min(1, ((pt.x - a.x1) * dx + (pt.y - a.y1) * dy) / len2));
      return Math.hypot(a.x1 + s * dx - pt.x, a.y1 + s * dy - pt.y) < 10;
    });

  const onPitchEvent = useCallback((kind, pt) => {
    if (preview) return;

    if (kind === "down") {
      if (tool === "move") {
        const p = hitPlayer(pt);
        if (p) { dragRef.current = { type: "player", id: p.id }; return; }
        const ci = hitConeIdx(pt);
        if (ci >= 0) { dragRef.current = { type: "cone", idx: ci }; return; }
      } else if (tool === "player") {
        const n = idRef.current++;
        const pc = PLAYER_COLS[playerColIdx];
        const id = `M${n}`;
        setPlayers((prev) => [...prev, { id, col: pc.col, lbl: String(prev.filter(x=>x.col===pc.col).length + 1) }]);
        setSteps((prev) => prev.map((s) => ({ ...s, [id]: { x: pt.x, y: pt.y } })));
      } else if (tool === "cone") {
        setCones((prev) => [...prev, { x: pt.x, y: pt.y, col: CONE_COLS[coneColIdx] }]);
      } else if (tool === "arrow") {
        dragRef.current = { type: "arrow", x1: pt.x, y1: pt.y };
        setTempArrow({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
      } else if (tool === "erase") {
        const p = hitPlayer(pt);
        if (p) {
          setPlayers((prev) => prev.filter((x) => x.id !== p.id));
          setSteps((prev) => prev.map((s) => { const n = { ...s }; delete n[p.id]; return n; }));
          return;
        }
        const ci = hitConeIdx(pt);
        if (ci >= 0) { setCones((prev) => prev.filter((_, i) => i !== ci)); return; }
        const ai = hitArrowIdx(pt);
        if (ai >= 0) setArrows((prev) => prev.filter((_, i) => i !== ai));
      }
    }

    if (kind === "move") {
      const d = dragRef.current;
      if (!d) return;
      if (d.type === "player") {
        setSteps((prev) => prev.map((s, i) => (i === curStep ? { ...s, [d.id]: { x: pt.x, y: pt.y } } : s)));
      } else if (d.type === "cone") {
        setCones((prev) => prev.map((c, i) => (i === d.idx ? { ...c, x: pt.x, y: pt.y } : c)));
      } else if (d.type === "arrow") {
        setTempArrow({ x1: d.x1, y1: d.y1, x2: pt.x, y2: pt.y });
      }
    }

    if (kind === "up") {
      const d = dragRef.current;
      dragRef.current = null;
      if (d?.type === "arrow") {
        setTempArrow(null);
        if (Math.hypot(pt.x - d.x1, pt.y - d.y1) > 15) {
          setArrows((prev) => [...prev, { x1: d.x1, y1: d.y1, x2: pt.x, y2: pt.y, col: "#4ade80" }]);
        }
      }
    }
  }, [tool, preview, players, cones, arrows, curStep, positions, playerColIdx, coneColIdx]);

  // ── Steps ──
  const addStep = () => {
    setSteps((prev) => [...prev, { ...prev[curStep] }]);
    setCurStep(steps.length);
  };
  const deleteStep = () => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== curStep));
    setCurStep((s) => Math.max(0, s - 1));
  };

  // ── Preview drill object (library schema) ──
  const previewDrill = useMemo(() => {
    if (!players.length) return null;
    const useSteps = steps.length > 1 ? steps : [...steps, ...steps];
    return {
      id: "preview",
      cat: meta.cat,
      players, cones, arrows,
      frames: useSteps.map((s, i) => ({
        t: i * 900,
        ps: players.map((p) => ({ id: p.id, x: s[p.id]?.x ?? 340, y: s[p.id]?.y ?? 220 })),
      })),
    };
  }, [players, cones, arrows, steps, meta.cat]);

  // ── AI build ──
  const buildWithAI = async (promptOverride) => {
    const prompt = (typeof promptOverride === "string" ? promptOverride : aiText).trim();
    if (!prompt || aiBusy) return;
    setAiBusy(true);
    setAiMsg(null);
    try {
      const d = await generateDrill(prompt, lang);
      setPlayers(d.players);
      setCones(d.cones);
      setArrows(d.arrows);
      setSteps(d.frames.map((f) => Object.fromEntries(f.ps.map((p) => [p.id, { x: p.x, y: p.y }]))));
      setCurStep(0);
      idRef.current = d.players.length + 1;
      setMeta({
        title: lang === "es" ? d.titleEs : d.title,
        cat: CATS_LIST.includes(d.cat) ? d.cat : "Technical",
        age: d.ages?.[0] || "U10",
        dur: d.dur || 10,
        desc: lang === "es" ? d.descEs : d.desc,
        equipment: lang === "es" ? d.equipmentEs : d.equipment,
        _ai: d, // keep the full bilingual payload for save
      });
      setAiMsg({ ok: true, text: t("Built — now drag pieces to make it yours", "Creado — ahora arrastra las piezas para hacerlo tuyo") });
    } catch (err) {
      setAiMsg({
        ok: false,
        text: err.message === "no-key"
          ? t("AI key not set — draw the drill by hand", "Clave de IA no configurada — dibuja el ejercicio a mano")
          : t("AI couldn't build that one — try rewording, or draw it", "La IA no pudo crear ese — reformula o dibújalo"),
      });
    } finally {
      setAiBusy(false);
    }
  };

  // ── Voice (unchanged behaviour) ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((tr) => tr.stop());
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch {
      alert(t("Microphone access denied", "Acceso al micrófono denegado"));
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // ── Save ──
  const saveDrill = async () => {
    if (!meta.title.trim() || !players.length) return;
    let audio = null;
    if (audioBlob) {
      audio = await new Promise((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result);
        r.readAsDataURL(audioBlob);
      });
    }
    const ai = meta._ai;
    const useSteps = steps.length > 1 ? steps : [...steps, ...steps];
    const drill = {
      id: `my_${Date.now()}`,
      custom: true,
      cat: meta.cat,
      ages: [meta.age],
      dur: Number(meta.dur) || 10,
      title: meta.title,
      titleEs: ai?.titleEs || meta.title,
      desc: meta.desc || "",
      descEs: ai?.descEs || meta.desc || "",
      coaching: ai?.coaching || "",
      coachingEs: ai?.coachingEs || "",
      equipment: meta.equipment || "",
      equipmentEs: ai?.equipmentEs || meta.equipment || "",
      parentMsg: ai?.parentMsg || "",
      parentMsgEs: ai?.parentMsgEs || "",
      players, cones, arrows,
      frames: useSteps.map((s, i) => ({
        t: i * 900,
        ps: players.map((p) => ({ id: p.id, x: s[p.id]?.x ?? 340, y: s[p.id]?.y ?? 220 })),
      })),
      audio,
      createdAt: new Date().toISOString(),
    };
    const next = [drill, ...loadCustomDrills()];
    localStorage.setItem("csp_my_drills", JSON.stringify(next));
    setSaved(next);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const deleteSaved = (id) => {
    const next = loadCustomDrills().filter((d) => d.id !== id);
    localStorage.setItem("csp_my_drills", JSON.stringify(next));
    setSaved(next);
  };

  const loadSaved = (d) => {
    setPlayers(d.players);
    setCones(d.cones || []);
    setArrows(d.arrows || []);
    setSteps(d.frames.map((f) => Object.fromEntries(f.ps.map((p) => [p.id, { x: p.x, y: p.y }]))));
    setCurStep(0);
    idRef.current = d.players.length + 100;
    setMeta({ title: d.title, cat: d.cat, age: d.ages?.[0] || "U10", dur: d.dur, desc: d.desc, equipment: d.equipment });
    setPreview(false);
  };

  const clearBoard = () => {
    setPlayers([]); setCones([]); setArrows([]);
    setSteps([{}]); setCurStep(0); setPreview(false);
    setMeta({ title: "", cat: "Technical", age: "U10", dur: 10, desc: "", equipment: "" });
    setAudioBlob(null); setAudioUrl(null);
  };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
    borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif",
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <VuiBox mb={0.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="8px">
          <VuiBox>
            <VuiTypography variant="h5" color="white" fontWeight="bold">
              {t("My Drills", "Mis Ejercicios")}
            </VuiTypography>
            <VuiTypography variant="caption" color="text">
              {t("Your board. Draw it — or tell the AI what to work on.", "Tu pizarra. Dibújalo — o dile a la IA qué trabajar.")}
            </VuiTypography>
          </VuiBox>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.08)", borderRadius: 20, padding: 3 }}>
            {["en", "es"].map((l) => (
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

        {/* AI bar */}
        <VuiBox mb={1} sx={{
          background: "rgba(96,165,250,.08)", border: "1px solid rgba(96,165,250,.25)",
          borderRadius: "10px", padding: "7px 10px", display: "flex", gap: "10px", alignItems: "center",
          flexShrink: 0,
        }}>
          <input
            placeholder={t("e.g. U10, work on scanning before receiving, 8 players, 15 minutes", "ej. U10, trabajar el escaneo antes de recibir, 8 jugadores, 15 minutos")}
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buildWithAI()}
            style={{ ...inputStyle, flex: 1, minWidth: 220 }}
          />
          <button onClick={buildWithAI} disabled={aiBusy || !aiText.trim()} style={{
            background: aiBusy ? "rgba(255,255,255,.1)" : "#60a5fa",
            color: aiBusy ? "rgba(255,255,255,.5)" : "#000",
            border: "none", borderRadius: 8, padding: "9px 18px",
            fontSize: 13, fontWeight: 800, cursor: aiBusy ? "wait" : "pointer", fontFamily: "Inter,sans-serif",
          }}>
            {aiBusy ? t("Building...", "Creando...") : t("✨ Build with AI", "✨ Crear con IA")}
          </button>
          {aiMsg && (
            <VuiTypography variant="caption" sx={{ color: aiMsg.ok ? "#4ade80" : "#fbbf24", fontSize: 11, fontWeight: 700 }}>
              {aiMsg.text}
            </VuiTypography>
          )}
        </VuiBox>

        {/* Board + tools + side panel — everything fits one screen, no scroll */}
        <VuiBox sx={{ flex: 1, minHeight: 0, display: "flex", gap: "12px", alignItems: "stretch" }}>

          {/* Board column */}
          <VuiBox sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* Pitch — scales to the space, never scrolls */}
            <VuiBox sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <VuiBox sx={{ height: "100%", maxWidth: "100%", aspectRatio: "3 / 2" }}>
                {preview && previewDrill ? (
                  <PitchCanvas drill={previewDrill} playing speed={1} />
                ) : (
                  <EditorPitch
                    players={players} cones={cones} arrows={arrows}
                    positions={positions} tool={tool} tempArrow={tempArrow}
                    onPitchEvent={onPitchEvent}
                  />
                )}
              </VuiBox>
            </VuiBox>

            {/* Steps + preview */}
            <VuiBox display="flex" gap="6px" mt={0.5} alignItems="center" flexWrap="wrap" sx={{ flexShrink: 0 }}>
              <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>
                {t("Steps:", "Pasos:")}
              </VuiTypography>
              {steps.map((_, i) => (
                <button key={i} onClick={() => { setCurStep(i); setPreview(false); }} style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: curStep === i && !preview ? "#4ade80" : "rgba(255,255,255,.08)",
                  color: curStep === i && !preview ? "#000" : "#fff",
                  border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={addStep} style={{
                height: 30, borderRadius: 8, background: "rgba(255,255,255,.08)", color: "#fff",
                border: "1px dashed rgba(255,255,255,.3)", fontSize: 12, padding: "0 10px",
                cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}>
                + {t("Step", "Paso")}
              </button>
              {steps.length > 1 && (
                <button onClick={deleteStep} style={{
                  height: 30, borderRadius: 8, background: "transparent", color: "rgba(255,255,255,.4)",
                  border: "none", fontSize: 12, cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}>
                  ✕ {t("step", "paso")}
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={() => setPreview((p) => !p)} disabled={!players.length} style={{
                background: preview ? "#fbbf24" : players.length ? "#4ade80" : "rgba(255,255,255,.08)",
                color: preview || players.length ? "#000" : "rgba(255,255,255,.4)",
                border: "none", borderRadius: 8, padding: "8px 18px",
                fontSize: 13, fontWeight: 800, cursor: players.length ? "pointer" : "not-allowed", fontFamily: "Inter,sans-serif",
              }}>
                {preview ? t("✏️ Back to editing", "✏️ Volver a editar") : t("▶ Preview", "▶ Vista previa")}
              </button>
            </VuiBox>

          </VuiBox>

          {/* Vertical tool strip — tools live beside the pitch, no scroll */}
          <VuiBox sx={{ width: 48, flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
            {[
              { key: "move", icon: "✋", en: "Move", es: "Mover" },
              { key: "player", icon: "👤", en: "Add player", es: "Añadir jugador" },
              { key: "cone", icon: "🔺", en: "Add cone", es: "Añadir cono" },
              { key: "arrow", icon: "↗", en: "Draw arrow", es: "Dibujar flecha" },
              { key: "erase", icon: "🧹", en: "Erase", es: "Borrar" },
            ].map((tb) => (
              <button key={tb.key} onClick={() => setTool(tb.key)} title={lang === "es" ? tb.es : tb.en} style={{
                width: 40, height: 40, borderRadius: 10,
                background: tool === tb.key ? "#4ade80" : "rgba(255,255,255,.08)",
                border: "none", fontSize: 17, cursor: "pointer",
              }}>
                {tb.icon}
              </button>
            ))}
            {tool === "player" && (
              <button onClick={() => setPlayerColIdx((i) => (i + 1) % PLAYER_COLS.length)}
                title={lang === "es" ? PLAYER_COLS[playerColIdx].nameEs : PLAYER_COLS[playerColIdx].name}
                style={{
                  width: 26, height: 26, borderRadius: "50%", border: "2px solid rgba(255,255,255,.5)",
                  background: PLAYER_COLS[playerColIdx].col, cursor: "pointer",
                }} />
            )}
            {tool === "cone" && (
              <button onClick={() => setConeColIdx((i) => (i + 1) % CONE_COLS.length)}
                title={t("Change colour", "Cambiar color")}
                style={{
                  width: 26, height: 26, borderRadius: 6, border: "2px solid rgba(255,255,255,.5)",
                  background: CONE_COLS[coneColIdx], cursor: "pointer",
                }} />
            )}
            <div style={{ flex: 1 }} />
            <button onClick={clearBoard} title={t("Clear board", "Limpiar pizarra")} style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(239,68,68,.15)", border: "none", fontSize: 16, cursor: "pointer",
            }}>
              🗑
            </button>
          </VuiBox>

          {/* Side panel */}
          <VuiBox sx={{
            width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px",
            minHeight: 0, overflowY: "auto",
            scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
          }}>
            <input placeholder={t("Drill name *", "Nombre del ejercicio *")} value={meta.title}
              onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} style={inputStyle} />
            <VuiBox display="flex" gap="8px">
              <select value={meta.cat} onChange={(e) => setMeta((m) => ({ ...m, cat: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}>
                {CATS_LIST.map((c) => <option key={c} value={c} style={{ color: "#000" }}>{c}</option>)}
              </select>
              <select value={meta.age} onChange={(e) => setMeta((m) => ({ ...m, age: e.target.value }))}
                style={{ ...inputStyle, width: 90 }}>
                {["U8", "U10", "U12", "U14+"].map((a) => <option key={a} value={a} style={{ color: "#000" }}>{a}</option>)}
              </select>
              <input type="number" min={5} max={30} value={meta.dur}
                onChange={(e) => setMeta((m) => ({ ...m, dur: e.target.value }))}
                style={{ ...inputStyle, width: 70 }} title={t("Minutes", "Minutos")} />
            </VuiBox>
            <textarea rows={2} placeholder={t("How to run it (optional)", "Cómo ejecutarlo (opcional)")}
              value={meta.desc} onChange={(e) => setMeta((m) => ({ ...m, desc: e.target.value }))}
              style={{ ...inputStyle, resize: "vertical" }} />
            <input placeholder={t("Equipment (optional)", "Equipamiento (opcional)")} value={meta.equipment}
              onChange={(e) => setMeta((m) => ({ ...m, equipment: e.target.value }))} style={inputStyle} />

            {/* Voice */}
            <VuiBox sx={{ background: "rgba(0,0,0,.2)", borderRadius: "10px", padding: "10px 12px", border: "1px solid rgba(255,255,255,.1)" }}>
              <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.5)", display: "block", mb: 1 }}>
                🎤 {t("Your voice on this drill (plays in the library)", "Tu voz en este ejercicio (suena en la biblioteca)")}
              </VuiTypography>
              <VuiBox display="flex" gap="8px" alignItems="center" flexWrap="wrap">
                {!recording ? (
                  <button onClick={startRecording} style={{
                    background: "#ef4444", color: "#fff", border: "none", borderRadius: 8,
                    padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
                  }}>
                    ⏺ {t("Record", "Grabar")}
                  </button>
                ) : (
                  <button onClick={stopRecording} style={{
                    background: "#fbbf24", color: "#000", border: "none", borderRadius: 8,
                    padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
                  }}>
                    ⏹ {t("Stop", "Detener")}
                  </button>
                )}
                {audioUrl && <audio controls src={audioUrl} style={{ height: 32, maxWidth: 180 }} />}
                {audioUrl && (
                  <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }} style={{
                    background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", border: "none",
                    borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontFamily: "Inter,sans-serif",
                  }}>
                    {t("Clear", "Borrar")}
                  </button>
                )}
              </VuiBox>
            </VuiBox>

            <button onClick={saveDrill} disabled={!meta.title.trim() || !players.length} style={{
              background: meta.title.trim() && players.length ? "#4ade80" : "rgba(255,255,255,.1)",
              color: meta.title.trim() && players.length ? "#000" : "rgba(255,255,255,.4)",
              border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 800,
              cursor: meta.title.trim() && players.length ? "pointer" : "not-allowed", fontFamily: "Inter,sans-serif",
            }}>
              {savedMsg ? t("✓ Saved — it's in your Drill Library", "✓ Guardado — está en tu Biblioteca") : t("💾 Save Drill", "💾 Guardar Ejercicio")}
            </button>

            {/* Saved list */}
            {saved.length > 0 && (
              <VuiBox sx={{ background: "rgba(255,255,255,.04)", borderRadius: "10px", padding: "10px 12px" }}>
                <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.5)", display: "block", mb: 1 }}>
                  {t(`My drills (${saved.length}) — also in the Drill Library under "Mine"`, `Mis ejercicios (${saved.length}) — también en la Biblioteca bajo "Míos"`)}
                </VuiTypography>
                {saved.map((d) => (
                  <VuiBox key={d.id} display="flex" alignItems="center" gap="8px" sx={{ py: 0.5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[d.cat] || "#4ade80", flexShrink: 0 }} />
                    <VuiTypography
                      variant="caption" color="white"
                      sx={{ flex: 1, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                      onClick={() => loadSaved(d)}
                    >
                      {d.title} {d.audio ? "🎤" : ""}
                    </VuiTypography>
                    <button onClick={() => deleteSaved(d.id)} style={{
                      background: "transparent", color: "rgba(239,68,68,.7)", border: "none",
                      fontSize: 12, cursor: "pointer",
                    }}>
                      ✕
                    </button>
                  </VuiBox>
                ))}
              </VuiBox>
            )}
          </VuiBox>
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default MyDrills;

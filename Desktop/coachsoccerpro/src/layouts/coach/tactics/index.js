import { useState, useRef, useCallback, useEffect } from "react";
import { useLang } from "useLang";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { COACH_PLAYS as BASE_PLAYS } from "data/drills";
import { MANAGER_PLAYS } from "data/classroom";
import { comparePlay } from "services/compareAI";

// Elite plays = what the greats do on a board: the 8 signature plays + the 17
// manager formation-signatures. This is the BOARD (formations + a one-line
// read), NOT the class — the full stepped lessons live in the Classroom. The
// board also lets a coach play their own football against a manager in Compare.
const SIGNATURE_PLAYS = [...BASE_PLAYS, ...MANAGER_PLAYS];

const W = 680, H = 440;

function PitchBg() {
  return (
    <>
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
      <circle cx={90} cy={220} r={3} fill="rgba(255,255,255,.5)" />
      <circle cx={590} cy={220} r={3} fill="rgba(255,255,255,.5)" />
    </>
  );
}

function Defs() {
  return (
    <defs>
      {["#f97316", "#ef4444", "#fbbf24", "#60a5fa", "#ffffff"].map((col, i) => (
        <marker key={i} id={`tm${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={col} />
        </marker>
      ))}
      <filter id="glow2">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}
function arrowMarker(col) {
  const cols = ["#f97316", "#ef4444", "#fbbf24", "#60a5fa", "#ffffff"];
  const i = cols.indexOf(col);
  return `url(#tm${i < 0 ? 4 : i})`;
}

function TacticsBoard() {
  const [mode, setMode] = useState("coach"); // "coach" | "custom" | "compare"
  const [selectedPlay, setSelectedPlay] = useState(SIGNATURE_PLAYS[0] || null);
  const [lang, setLang] = useLang();
  const [showRole, setShowRole] = useState(null);

  // Custom play state
  const [customPlayers, setCustomPlayers] = useState([
    { id: "cp1", x: 100, y: 220, col: "#f97316", lbl: "1", role: "Player 1" },
    { id: "cp2", x: 200, y: 180, col: "#f97316", lbl: "2", role: "Player 2" },
    { id: "cp3", x: 200, y: 260, col: "#f97316", lbl: "3", role: "Player 3" },
    { id: "cp4", x: 300, y: 220, col: "#f97316", lbl: "4", role: "Player 4" },
    { id: "cp5", x: 400, y: 200, col: "#f97316", lbl: "5", role: "Player 5" },
    { id: "cp6", x: 400, y: 240, col: "#f97316", lbl: "6", role: "Player 6" },
    { id: "cd1", x: 450, y: 180, col: "#ef4444", lbl: "D", role: "Defender 1" },
    { id: "cd2", x: 450, y: 260, col: "#ef4444", lbl: "D", role: "Defender 2" },
    { id: "cgk", x: 615, y: 220, col: "#f59e0b", lbl: "GK", role: "Goalkeeper" },
  ]);
  const [customArrows, setCustomArrows] = useState([]);
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [arrowColor, setArrowColor] = useState("#f97316");
  const [savedPlays, setSavedPlays] = useState(() => {
    try { return JSON.parse(localStorage.getItem("csp_custom_plays") || "[]"); } catch { return []; }
  });
  const [customName, setCustomName] = useState("My Play");

  // Compare-game state
  const [cmpSource, setCmpSource] = useState(null);   // null = current My Play, else a saved play
  const [cmpManager, setCmpManager] = useState(MANAGER_PLAYS[0] || null);
  const [mindset, setMindset] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const svgRef = useRef(null);
  const draggingRef = useRef(null);

  const T = (en, es) => (lang === "es" ? es : en);

  // ── Drag logic (custom mode) ───────────────────────────────────────────────
  const getSvgPos = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * H };
  }, []);

  const onMouseDown = useCallback((e, id) => {
    if (drawMode) return;
    e.preventDefault();
    draggingRef.current = id;
  }, [drawMode]);

  const onMouseMove = useCallback((e) => {
    if (!draggingRef.current || drawMode) return;
    const pos = getSvgPos(e);
    setCustomPlayers((ps) => ps.map((p) =>
      p.id === draggingRef.current
        ? { ...p, x: Math.max(20, Math.min(W - 20, pos.x)), y: Math.max(20, Math.min(H - 20, pos.y)) }
        : p
    ));
  }, [drawMode, getSvgPos]);

  const onMouseUp = useCallback(() => { draggingRef.current = null; }, []);
  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);
    return () => { window.removeEventListener("mouseup", onMouseUp); window.removeEventListener("touchend", onMouseUp); };
  }, [onMouseUp]);

  const handleSvgClick = useCallback((e) => {
    if (!drawMode) return;
    const pos = getSvgPos(e);
    if (!drawStart) setDrawStart(pos);
    else { setCustomArrows((arr) => [...arr, { x1: drawStart.x, y1: drawStart.y, x2: pos.x, y2: pos.y, col: arrowColor }]); setDrawStart(null); }
  }, [drawMode, drawStart, arrowColor, getSvgPos]);

  const savePlay = () => {
    const play = {
      id: Date.now().toString(), name: customName,
      players: JSON.parse(JSON.stringify(customPlayers)),
      arrows: JSON.parse(JSON.stringify(customArrows)),
      savedAt: new Date().toLocaleDateString(),
    };
    const updated = [play, ...savedPlays].slice(0, 10);
    setSavedPlays(updated);
    localStorage.setItem("csp_custom_plays", JSON.stringify(updated));
  };
  const loadPlay = (play) => { setCustomPlayers(play.players); setCustomArrows(play.arrows); setCustomName(play.name); };
  const deletePlay = (id) => {
    const updated = savedPlays.filter((p) => p.id !== id);
    setSavedPlays(updated);
    localStorage.setItem("csp_custom_plays", JSON.stringify(updated));
  };
  const clearArrows = () => setCustomArrows([]);

  // ── Compare game ───────────────────────────────────────────────────────────
  const cmpPlay = cmpSource || { name: customName, players: customPlayers, arrows: customArrows };
  const runCompare = async () => {
    if (!cmpManager) return;
    setAnalyzing(true); setAnalysis(null);
    try {
      const out = await comparePlay({
        playName: cmpPlay.name, players: cmpPlay.players, arrows: cmpPlay.arrows,
        mindset, manager: cmpManager, lang,
      });
      setAnalysis(out);
    } catch (e) {
      setAnalysis({ error: true });
    } finally { setAnalyzing(false); }
  };

  // ── What the pitch shows ───────────────────────────────────────────────────
  let displayPlayers, displayArrows;
  if (mode === "coach") {
    displayPlayers = selectedPlay ? selectedPlay.players : [];
    displayArrows = selectedPlay ? selectedPlay.arrows : [];
  } else if (mode === "custom") {
    displayPlayers = customPlayers; displayArrows = customArrows;
  } else {
    displayPlayers = cmpPlay.players; displayArrows = cmpPlay.arrows;
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", overflow: "hidden" }}>

        {/* Header */}
        <VuiBox mb={1} display="flex" alignItems="center" gap="14px" flexWrap="wrap" sx={{ flexShrink: 0 }}>
          <VuiTypography variant="h5" color="white" fontWeight="bold">{T("Tactics Board", "Tablero Táctico")}</VuiTypography>
          {[["coach", T("🏆 Elite Plays", "🏆 Juegos de Élite")],
            ["custom", T("✏️ My Play", "✏️ Mi Juego")],
            ["compare", T("🎮 Compare", "🎮 Comparar")]].map(([m, lbl]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              background: mode === m ? "#f97316" : "rgba(255,255,255,.08)",
              color: mode === m ? "#000" : "#fff", border: "none", borderRadius: 20,
              padding: "6px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
            }}>{lbl}</button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.08)", borderRadius: 20, padding: 3 }}>
            {["en", "es"].map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? "#f97316" : "transparent",
                color: lang === l ? "#000" : "rgba(255,255,255,.6)", border: "none",
                borderRadius: 18, padding: "4px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </VuiBox>

        <VuiBox display="flex" gap="16px" sx={{ flex: 1, minHeight: 0 }}>

          {/* ── Left panel ── */}
          <VuiBox sx={{
            width: 230, flexShrink: 0, background: "rgba(255,255,255,.04)", borderRadius: "12px",
            padding: "12px", overflowY: "auto", minHeight: 0,
            scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
          }}>
            {mode === "coach" && (
              <>
                <div style={{ color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, fontWeight: 700, marginBottom: 8, fontFamily: "Inter,sans-serif" }}>
                  {T("ELITE PLAYS", "JUEGOS DE ÉLITE")}
                </div>
                {SIGNATURE_PLAYS.map((play) => (
                  <VuiBox key={play.id} mb={1}>
                    <button onClick={() => setSelectedPlay(play)} style={{
                      display: "block", width: "100%", textAlign: "left",
                      background: selectedPlay?.id === play.id ? "rgba(251,191,36,.1)" : "transparent",
                      border: selectedPlay?.id === play.id ? "1px solid rgba(251,191,36,.3)" : "1px solid transparent",
                      borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontFamily: "Inter,sans-serif",
                    }}>
                      {play.coach ? <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{play.coach}</div> : null}
                      <div style={{ color: "rgba(255,255,255,.85)", fontSize: 12, fontWeight: 600 }}>{play.name}</div>
                      {(play.team || play.system) ? <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10, marginTop: 2 }}>{[play.team, play.system].filter(Boolean).join(" · ")}</div> : null}
                    </button>
                  </VuiBox>
                ))}
                <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10, lineHeight: 1.5, marginTop: 10, fontFamily: "Inter,sans-serif" }}>
                  {T("Want the full lessons behind these ideas? Open the Classroom.", "¿Quieres las lecciones completas detrás de estas ideas? Abre el Aula.")}
                </div>
              </>
            )}

            {mode === "custom" && (
              <>
                <div style={{ color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, fontWeight: 700, marginBottom: 8, fontFamily: "Inter,sans-serif" }}>{T("TOOLS", "HERRAMIENTAS")}</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "rgba(255,255,255,.5)", fontSize: 10, fontWeight: 700, marginBottom: 4, fontFamily: "Inter,sans-serif", textTransform: "uppercase" }}>{T("Arrow Color", "Color de Flecha")}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["#f97316", "#ef4444", "#fbbf24", "#60a5fa", "#ffffff"].map((col) => (
                      <button key={col} onClick={() => setArrowColor(col)} style={{
                        width: 22, height: 22, borderRadius: "50%", background: col,
                        border: arrowColor === col ? "3px solid #fff" : "2px solid rgba(255,255,255,.2)", cursor: "pointer", padding: 0,
                      }} />
                    ))}
                  </div>
                </div>
                <button onClick={() => { setDrawMode((d) => !d); setDrawStart(null); }} style={{
                  width: "100%", background: drawMode ? "rgba(251,191,36,.15)" : "rgba(255,255,255,.06)",
                  color: drawMode ? "#fbbf24" : "rgba(255,255,255,.7)",
                  border: `1px solid ${drawMode ? "rgba(251,191,36,.4)" : "rgba(255,255,255,.12)"}`,
                  borderRadius: 8, padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif", marginBottom: 6,
                }}>
                  {drawMode ? T("✏️ Click 2 points", "✏️ Click 2 puntos") : T("➕ Draw Arrow", "➕ Dibujar Flecha")}
                </button>
                {drawStart && <div style={{ color: "#fbbf24", fontSize: 11, textAlign: "center", marginBottom: 6, fontFamily: "Inter,sans-serif" }}>{T("Click to finish arrow", "Click para terminar flecha")}</div>}
                <button onClick={clearArrows} style={{
                  width: "100%", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.5)",
                  border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "6px", fontSize: 11, cursor: "pointer", fontFamily: "Inter,sans-serif", marginBottom: 12,
                }}>{T("Clear Arrows", "Borrar Flechas")}</button>

                <div style={{ color: "rgba(255,255,255,.5)", fontSize: 10, fontWeight: 700, marginBottom: 4, fontFamily: "Inter,sans-serif", textTransform: "uppercase" }}>{T("Save Play", "Guardar")}</div>
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={T("Play name", "Nombre del juego")} style={{
                  width: "100%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 6,
                  padding: "5px 8px", color: "#fff", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 6,
                }} />
                <button onClick={savePlay} style={{
                  width: "100%", background: "#f97316", color: "#000", border: "none", borderRadius: 8, padding: "7px",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif", marginBottom: 12,
                }}>{T("💾 Save Play", "💾 Guardar Juego")}</button>

                {savedPlays.length > 0 && (
                  <>
                    <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, marginBottom: 6, fontFamily: "Inter,sans-serif", textTransform: "uppercase" }}>{T("Saved Plays", "Guardados")}</div>
                    {savedPlays.map((p) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,.04)", borderRadius: 6, padding: "5px 8px", marginBottom: 4 }}>
                        <button onClick={() => loadPlay(p)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.8)", fontSize: 11, cursor: "pointer", fontFamily: "Inter,sans-serif", flex: 1, textAlign: "left", padding: 0 }}>
                          {p.name}<span style={{ color: "rgba(255,255,255,.3)", fontSize: 9, display: "block" }}>{p.savedAt}</span>
                        </button>
                        <button onClick={() => deletePlay(p.id)} style={{ background: "none", border: "none", color: "rgba(239,68,68,.5)", fontSize: 14, cursor: "pointer", padding: "0 4px" }}>×</button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {mode === "compare" && (
              <>
                <div style={{ color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, fontWeight: 700, marginBottom: 8, fontFamily: "Inter,sans-serif" }}>{T("1 · YOUR PLAY", "1 · TU JUEGO")}</div>
                <button onClick={() => setCmpSource(null)} style={{
                  display: "block", width: "100%", textAlign: "left", marginBottom: 4,
                  background: !cmpSource ? "rgba(249,115,22,.12)" : "transparent",
                  border: !cmpSource ? "1px solid rgba(249,115,22,.35)" : "1px solid rgba(255,255,255,.08)",
                  borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontFamily: "Inter,sans-serif",
                  color: "rgba(255,255,255,.85)", fontSize: 12, fontWeight: 600,
                }}>{T("Current My Play", "Mi Juego actual")}</button>
                {savedPlays.map((p) => (
                  <button key={p.id} onClick={() => setCmpSource(p)} style={{
                    display: "block", width: "100%", textAlign: "left", marginBottom: 4,
                    background: cmpSource?.id === p.id ? "rgba(249,115,22,.12)" : "transparent",
                    border: cmpSource?.id === p.id ? "1px solid rgba(249,115,22,.35)" : "1px solid rgba(255,255,255,.08)",
                    borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontFamily: "Inter,sans-serif",
                    color: "rgba(255,255,255,.85)", fontSize: 12, fontWeight: 600,
                  }}>{p.name}</button>
                ))}

                <div style={{ color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, fontWeight: 700, margin: "14px 0 8px", fontFamily: "Inter,sans-serif" }}>{T("2 · YOUR MINDSET", "2 · TU MENTALIDAD")}</div>
                <textarea value={mindset} onChange={(e) => setMindset(e.target.value)}
                  placeholder={T("e.g. I want to dominate possession and press high", "p.ej. Quiero dominar la posesión y presionar alto")}
                  rows={3} style={{
                    width: "100%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 6,
                    padding: "6px 8px", color: "#fff", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box", resize: "none",
                  }} />

                <div style={{ color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, fontWeight: 700, margin: "14px 0 8px", fontFamily: "Inter,sans-serif" }}>{T("3 · PLAY AGAINST", "3 · JUGAR CONTRA")}</div>
                <select value={cmpManager?.id || ""} onChange={(e) => setCmpManager(MANAGER_PLAYS.find((m) => m.id === e.target.value))} style={{
                  width: "100%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 6,
                  padding: "7px 8px", color: "#fff", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", marginBottom: 12,
                }}>
                  {MANAGER_PLAYS.map((m) => <option key={m.id} value={m.id} style={{ color: "#000" }}>{m.coach} — {m.name}</option>)}
                </select>

                <button onClick={runCompare} disabled={analyzing} style={{
                  width: "100%", background: analyzing ? "rgba(249,115,22,.4)" : "#f97316", color: "#000", border: "none", borderRadius: 8,
                  padding: "9px", fontSize: 13, fontWeight: 800, cursor: analyzing ? "default" : "pointer", fontFamily: "Inter,sans-serif",
                }}>{analyzing ? T("Analyzing…", "Analizando…") : T("⚡ Analyze My Play", "⚡ Analizar Mi Juego")}</button>
              </>
            )}
          </VuiBox>

          {/* ── Pitch + info ── */}
          <VuiBox sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", marginBottom: 8, flex: 1, minHeight: 0, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
              <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{
                maxWidth: "100%", maxHeight: "100%", height: "100%", display: "block",
                background: "#1a4a2a", borderRadius: 12, cursor: drawMode ? "crosshair" : "default",
              }}
                onMouseMove={onMouseMove}
                onTouchMove={(e) => { e.preventDefault(); onMouseMove(e); }}
                onClick={handleSvgClick}
              >
                <Defs />
                <PitchBg />

                {displayArrows && displayArrows.map((a, i) => (
                  <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                    stroke={a.col || "#f97316"} strokeWidth={2} strokeOpacity={0.75}
                    strokeDasharray={a.dash ? "6,3" : "none"} markerEnd={arrowMarker(a.col || "#f97316")} />
                ))}

                {drawStart && <circle cx={drawStart.x} cy={drawStart.y} r={5} fill={arrowColor} fillOpacity={0.7} stroke="#fff" strokeWidth={1} />}

                {displayPlayers && displayPlayers.map((p) => (
                  <g key={p.id} filter="url(#glow2)" transform={`translate(${p.x},${p.y})`}
                    style={{ cursor: mode === "custom" && !drawMode ? "grab" : "default" }}
                    onMouseDown={mode === "custom" ? (e) => onMouseDown(e, p.id) : undefined}
                    onTouchStart={mode === "custom" ? (e) => onMouseDown(e, p.id) : undefined}
                    onClick={(e) => { if (mode !== "custom") { e.stopPropagation(); setShowRole(showRole === p.id ? null : p.id); } }}
                  >
                    <circle r={11} fill={p.col} fillOpacity={0.25} />
                    <circle r={8} fill={p.col} />
                    <text textAnchor="middle" dy={4} fontSize={8} fontFamily="Inter,sans-serif" fontWeight="700" fill="#000">{p.lbl}</text>
                    {showRole === p.id && p.role && (
                      <g>
                        <rect x={-60} y={-34} width={120} height={22} rx={4} fill="rgba(0,0,0,.85)" stroke="rgba(255,255,255,.2)" strokeWidth={.5} />
                        <text x={0} y={-20} textAnchor="middle" fontSize={8} fontFamily="Inter,sans-serif" fill="rgba(255,255,255,.9)">
                          {p.role.length > 24 ? p.role.slice(0, 24) + "…" : p.role}
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>

              {mode === "coach" && (
                <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,.5)", borderRadius: 6, padding: "4px 8px", color: "rgba(255,255,255,.5)", fontSize: 10, fontFamily: "Inter,sans-serif" }}>{T("Click player to see role", "Click jugador para ver rol")}</div>
              )}
              {mode === "custom" && !drawMode && (
                <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,.5)", borderRadius: 6, padding: "4px 8px", color: "rgba(255,255,255,.5)", fontSize: 10, fontFamily: "Inter,sans-serif" }}>{T("Drag players", "Arrastra jugadores")}</div>
              )}
            </div>

            {/* ── Elite play info ── */}
            {mode === "coach" && selectedPlay && (
              <VuiBox sx={{
                background: "rgba(255,255,255,.05)", borderRadius: "12px", padding: "12px 16px",
                borderLeft: "3px solid #fbbf24", flexShrink: 0, maxHeight: "34%", overflowY: "auto",
                scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
              }}>
                <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif", marginBottom: 2 }}>
                  {[selectedPlay.coach, selectedPlay.team, selectedPlay.system].filter(Boolean).join(" · ")}
                </div>
                <VuiTypography variant="h6" color="white" fontWeight="bold">{selectedPlay.name}</VuiTypography>
                <p style={{ color: "rgba(255,255,255,.75)", fontSize: 13, lineHeight: 1.6, margin: "6px 0 12px", fontFamily: "Inter,sans-serif" }}>
                  {lang === "es" ? (selectedPlay.descriptionEs || selectedPlay.description) : selectedPlay.description}
                </p>
                {selectedPlay.smUnits && selectedPlay.smUnits.length > 0 && (
                  <VuiBox style={{ background: "rgba(249,115,22,.07)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(249,115,22,.2)" }}>
                    <div style={{ color: "#f97316", fontSize: 10, fontWeight: 700, fontFamily: "Inter,sans-serif", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>⚽ {T("SoccerMental Units", "Unidades SoccerMental relacionadas")}</div>
                    {selectedPlay.smUnits.map((u, i) => (
                      <div key={i} style={{ color: "rgba(255,255,255,.7)", fontSize: 12, fontFamily: "Inter,sans-serif", padding: "3px 0", borderBottom: i < selectedPlay.smUnits.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>{u}</div>
                    ))}
                  </VuiBox>
                )}
              </VuiBox>
            )}

            {mode === "custom" && (
              <VuiBox sx={{ background: "rgba(255,255,255,.04)", borderRadius: "12px", padding: "10px 14px", border: "1px solid rgba(255,255,255,.08)", flexShrink: 0 }}>
                <VuiTypography variant="caption" color="text">
                  {T("Drag players to position them. Use Draw Arrow to show movement. Save your plays, then head to Compare to play them against an elite manager.",
                     "Arrastra jugadores para posicionarlos. Usa Dibujar Flecha para el movimiento. Guarda tus juegos y ve a Comparar para enfrentarlos a un entrenador de élite.")}
                </VuiTypography>
              </VuiBox>
            )}

            {/* ── Compare-game scorecard ── */}
            {mode === "compare" && (
              <VuiBox sx={{
                background: "rgba(255,255,255,.05)", borderRadius: "12px", padding: "14px 18px",
                borderLeft: "3px solid #f97316", flexShrink: 0, maxHeight: "42%", overflowY: "auto",
                scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
              }}>
                {!analysis && !analyzing && (
                  <VuiTypography variant="caption" color="text">
                    {T(`Set up your play, write your mindset, pick a manager to play against — then hit Analyze. You'll get a match score, what you're already doing like ${cmpManager?.coach || "the master"}, the biggest gap, and one drill to close it.`,
                       `Prepara tu juego, escribe tu mentalidad, elige un entrenador contra quien jugar — y pulsa Analizar. Recibirás una puntuación, lo que ya haces como ${cmpManager?.coach || "el maestro"}, el mayor hueco y un ejercicio para cerrarlo.`)}
                  </VuiTypography>
                )}
                {analyzing && <VuiTypography variant="button" color="white">{T("Reading your football…", "Leyendo tu fútbol…")}</VuiTypography>}
                {analysis && analysis.error && <VuiTypography variant="button" color="error">{T("Couldn't analyze — try again.", "No se pudo analizar — inténtalo de nuevo.")}</VuiTypography>}
                {analysis && !analysis.error && (
                  <>
                    <VuiBox display="flex" alignItems="center" gap="16px" mb={1.5} flexWrap="wrap">
                      <div style={{ position: "relative", width: 66, height: 66, flexShrink: 0 }}>
                        <svg viewBox="0 0 36 36" style={{ width: 66, height: 66 }}>
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${(analysis.score / 100) * 97.4} 97.4`} transform="rotate(-90 18 18)" />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#f97316", fontSize: 18, fontWeight: 800, fontFamily: "Inter,sans-serif" }}>{analysis.score}</div>
                      </div>
                      <VuiBox flex={1} minWidth={0}>
                        <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "Inter,sans-serif", lineHeight: 1.3 }}>{analysis.verdict}</div>
                        <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, fontFamily: "Inter,sans-serif", marginTop: 2 }}>
                          {cmpPlay.name} {T("vs", "vs")} {cmpManager?.coach}
                          {analysis.source === "heuristic" ? " · " + T("offline read", "lectura sin conexión") : ""}
                        </div>
                      </VuiBox>
                    </VuiBox>

                    {analysis.mindsetRead && <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12, fontStyle: "italic", margin: "0 0 10px", fontFamily: "Inter,sans-serif" }}>{analysis.mindsetRead}</p>}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div style={{ background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ color: "#4ade80", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4, fontFamily: "Inter,sans-serif" }}>✓ {T("Already aligned", "Ya alineado")}</div>
                        {(analysis.aligned || []).map((a, i) => <div key={i} style={{ color: "rgba(255,255,255,.75)", fontSize: 11, lineHeight: 1.5, fontFamily: "Inter,sans-serif" }}>• {a}</div>)}
                      </div>
                      <div style={{ background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4, fontFamily: "Inter,sans-serif" }}>△ {T("Biggest gap", "Mayor hueco")}</div>
                        <div style={{ color: "rgba(255,255,255,.75)", fontSize: 11, lineHeight: 1.5, fontFamily: "Inter,sans-serif" }}>{analysis.gap}</div>
                      </div>
                    </div>

                    <div style={{ background: "rgba(249,115,22,.1)", border: "1px solid rgba(249,115,22,.3)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ color: "#f97316", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4, fontFamily: "Inter,sans-serif" }}>⚡ {T("Do this next", "Haz esto ahora")}</div>
                      <div style={{ color: "rgba(255,255,255,.9)", fontSize: 12, lineHeight: 1.5, fontFamily: "Inter,sans-serif", marginBottom: 6 }}>{analysis.improve}</div>
                      {analysis.drill && (
                        <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, fontFamily: "Inter,sans-serif" }}>
                          🥅 <b style={{ color: "rgba(255,255,255,.85)" }}>{lang === "es" ? (analysis.drill.titleEs || analysis.drill.title) : analysis.drill.title}</b> — {lang === "es" ? (analysis.drill.descEs || analysis.drill.desc) : analysis.drill.desc}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </VuiBox>
            )}
          </VuiBox>
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default TacticsBoard;

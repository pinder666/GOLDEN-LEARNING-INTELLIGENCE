import { useState, useEffect, useRef, useCallback } from "react";
import { useLang } from "useLang";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { DRILLS, CATS, CAT_COLORS } from "data/drills";
import { speakDrill, stop as coachStop, isMuted } from "services/voice";

// ─── Pitch renderer ────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }

export function PitchCanvas({ drill, playing, speed }) {
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const pausedAtRef = useRef(0);
  const svgRef = useRef(null);

  const duration = drill ? (drill.frames[drill.frames.length - 1].t * (1 / speed)) : 3000;

  const render = useCallback((elapsed) => {
    if (!drill || !svgRef.current) return;
    const t = elapsed % (duration + 600);
    const rawT = t * speed;
    let fi = 0;
    for (let i = 0; i < drill.frames.length - 1; i++) {
      if (rawT >= drill.frames[i].t && rawT <= drill.frames[i + 1].t) { fi = i; break; }
      if (rawT > drill.frames[i + 1].t) fi = i + 1;
    }
    const frameA = drill.frames[Math.min(fi, drill.frames.length - 1)];
    const frameB = drill.frames[Math.min(fi + 1, drill.frames.length - 1)];
    const span = frameB.t - frameA.t;
    const frac = span > 0 ? Math.max(0, Math.min(1, (rawT - frameA.t) / span)) : 1;

    drill.players.forEach(p => {
      const pA = frameA.ps.find(x => x.id === p.id);
      const pB = frameB.ps.find(x => x.id === p.id);
      if (!pA || !pB) return;
      const g = svgRef.current.querySelector(`[data-player="${p.id}"]`);
      if (g) g.setAttribute("transform", `translate(${lerp(pA.x,pB.x,frac)},${lerp(pA.y,pB.y,frac)})`);
    });
  }, [drill, speed, duration]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pausedAtRef.current = Date.now() - (startRef.current || Date.now());
      return;
    }
    startRef.current = Date.now() - pausedAtRef.current;
    const loop = () => { render(Date.now() - startRef.current); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, render]);

  useEffect(() => { pausedAtRef.current = 0; startRef.current = Date.now(); }, [drill]);

  if (!drill) return null;
  // Canvas cropped to equal 30px green on ALL sides of the pitch
  // (pitch rect is x30–650, y30–410). Players/cones/frames unchanged.
  const W = 680, H = 440;

  const markerFill = (col) => {
    if (!col) return "#4ade80";
    if (col.includes("4ade80")) return "#4ade80";
    if (col.includes("ef4444")) return "#ef4444";
    if (col.includes("fbbf24")) return "#fbbf24";
    if (col.includes("60a5fa")) return "#60a5fa";
    if (col.includes("a78bfa")) return "#a78bfa";
    return "rgba(255,255,255,.7)";
  };

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
      style={{ width:"100%", height:"100%", maxHeight:"100%", display:"block", background:"#1a4a2a", borderRadius:10 }}>
      {/* Green background with equal padding around pitch */}
      <rect x={0} y={0} width={W} height={H} fill="#1a4a2a"/>
      <defs>
        {["#4ade80","#ef4444","#fbbf24","#60a5fa","#a78bfa","rgba(255,255,255,.7)"].map((col,i) => (
          <marker key={i} id={`ah${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={col} />
          </marker>
        ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {Array.from({length:14},(_,i)=>(
        <rect key={i} x={30} y={30+i*27} width={620} height={27}
          fill={i%2===0?"rgba(255,255,255,.03)":"rgba(0,0,0,.04)"} />
      ))}
      <rect x={30} y={30} width={620} height={380} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={2}/>
      <line x1={340} y1={30} x2={340} y2={410} stroke="rgba(255,255,255,.4)" strokeWidth={1.5}/>
      <circle cx={340} cy={220} r={55} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5}/>
      <circle cx={340} cy={220} r={3} fill="rgba(255,255,255,.5)"/>
      <rect x={30} y={140} width={100} height={160} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5}/>
      <rect x={30} y={167} width={55} height={106} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1}/>
      <rect x={550} y={140} width={100} height={160} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5}/>
      <rect x={595} y={167} width={55} height={106} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1}/>
      <rect x={14} y={187} width={16} height={66} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5}/>
      <rect x={650} y={187} width={16} height={66} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5}/>
      <circle cx={90} cy={220} r={3} fill="rgba(255,255,255,.5)"/>
      <circle cx={590} cy={220} r={3} fill="rgba(255,255,255,.5)"/>
      {[[30,30],[650,30],[30,410],[650,410]].map(([cx,cy],i)=>(
        <path key={i} d={`M ${cx+(i%2===0?10:-10)},${cy} A 10,10 0 0 ${i%2===0?0:1} ${cx},${cy+(i<2?10:-10)}`}
          fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1}/>
      ))}

      {drill.zones && drill.zones.map((z,i)=>(
        <g key={i}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={z.col} stroke={z.border} strokeWidth={1} strokeDasharray="4,3"/>
          <text x={z.x+z.w/2} y={z.y-6} textAnchor="middle" fill="rgba(251,191,36,.6)" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="700">{z.lbl}</text>
        </g>
      ))}
      {drill.offsideLine && (
        <line x1={450} y1={30} x2={450} y2={410} stroke="rgba(251,191,36,.5)" strokeWidth={1.5} strokeDasharray="6,4"/>
      )}
      {drill.cones && drill.cones.map((c,i)=>(
        <polygon key={i} points={`${c.x},${c.y-8} ${c.x-5},${c.y+4} ${c.x+5},${c.y+4}`}
          fill={c.col} stroke="rgba(0,0,0,.3)" strokeWidth={.5}/>
      ))}
      {drill.arrows && drill.arrows.map((a,i)=>{
        const col = a.col||"#4ade80";
        const mFill = markerFill(col);
        const mId = ["#4ade80","#ef4444","#fbbf24","#60a5fa","#a78bfa","rgba(255,255,255,.7)"].indexOf(mFill);
        return (
          <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke={col} strokeWidth={1.8} strokeOpacity={0.7}
            strokeDasharray={a.dash?"5,3":"none"}
            markerEnd={`url(#ah${mId<0?5:mId})`}/>
        );
      })}
      {drill.players.map(p=>(
        <g key={p.id} data-player={p.id} filter="url(#glow)">
          <circle r={11} fill={p.col} fillOpacity={0.25}/>
          <circle r={8} fill={p.col}/>
          <text textAnchor="middle" dy={4} fontSize={8} fontFamily="Inter,sans-serif" fontWeight="700" fill="#000">{p.lbl}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Voice (ElevenLabs via SoccerMental, device fallback) ─────────────────

// ─── Main ────────────────────────────────────────────────────────────────────
export function loadCustomDrills() {
  try {
    return JSON.parse(localStorage.getItem("csp_my_drills") || "[]");
  } catch {
    return [];
  }
}

function CoachDrills() {
  const [activeCat, setActiveCat] = useState("All");
  const [activeDrill, setActiveDrill] = useState(DRILLS[0]);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [ageFilter, setAgeFilter] = useState("All");
  const [lang, setLang] = useLang();
  const [parentOpen, setParentOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [customs, setCustoms] = useState(loadCustomDrills);
  const customAudioRef = useRef(null);

  // PIPE C — assign a vetted library drill to players' FROM YOUR COACH shelf
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSel, setAssignSel] = useState(new Set());
  const [assignMsg, setAssignMsg] = useState(null);
  const SEAT_PLAYERS = [ // dev roster; production reads sm_roster_cache seats
    { ref: "PLR-8347", name: "Marcus J." },
    { ref: "PLR-2210", name: "Sofia G." },
    { ref: "PLR-9921", name: "Liam S." },
    { ref: "PLR-4470", name: "Emma W." },
  ];

  const sendAssignment = async (players) => {
    const payload = { drill_id: activeDrill.id, players };
    try {
      if (process.env.NODE_ENV === "development") {
        const log = JSON.parse(localStorage.getItem("csp_assignments") || "[]");
        log.push({ ...payload, ts: new Date().toISOString() });
        localStorage.setItem("csp_assignments", JSON.stringify(log));
      } else {
        const { error } = await (await import("services/supabase")).supabase
          .functions.invoke("pipe-c", { body: payload });
        if (error) throw error;
      }
      setAssignMsg(t("✓ Sent to their FROM YOUR COACH shelf", "✓ Enviado a su estante DE TU ENTRENADOR"));
    } catch {
      setAssignMsg(t("Couldn't send — try again", "No se pudo enviar — intenta de nuevo"));
    }
    setAssignOpen(false);
    setAssignSel(new Set());
    setTimeout(() => setAssignMsg(null), 3000);
  };

  // Coach's own drills refresh when returning from My Drills
  useEffect(() => {
    const refresh = () => setCustoms(loadCustomDrills());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const ages = ["All", "U8", "U10", "U12", "U14+"];
  const allDrills = [...customs, ...DRILLS];

  const filtered = allDrills.filter(d => {
    const catOk =
      activeCat === "All" ? true :
      activeCat === "Mine" ? !!d.custom :
      d.cat === activeCat;
    const ageOk = ageFilter === "All" || (d.ages && d.ages.includes(ageFilter));
    return catOk && ageOk;
  });

  const catColor = CAT_COLORS[activeDrill?.cat] || "#4ade80";

  const t = (en, es) => lang === "es" ? (es || en) : en;

  const handleSpeak = () => {
    if (!activeDrill) return;
    if (speaking) {
      coachStop();
      if (customAudioRef.current) { customAudioRef.current.pause(); customAudioRef.current = null; }
      setSpeaking(false);
      return;
    }

    if (isMuted()) return; // global mute
    setSpeaking(true);
    if (activeDrill.custom) {
      // Coach's own drill: their recorded voice IS the audio
      if (activeDrill.audio) {
        const a = new Audio(activeDrill.audio);
        customAudioRef.current = a;
        a.onended = () => setSpeaking(false);
        a.play().catch(() => setSpeaking(false));
      } else {
        setSpeaking(false);
      }
      return;
    }
    speakDrill(activeDrill.id, lang, {
      onEnd: () => setSpeaking(false),
    });
  };

  const handleCopyParent = () => {
    const msg = lang === "es"
      ? (activeDrill?.parentMsgEs || activeDrill?.parentMsg || "")
      : (activeDrill?.parentMsg || "");
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => { setSpeaking(false); coachStop(); }, [activeDrill, lang]);

  return (
    <DashboardLayout>
      <DashboardNavbar/>
      <VuiBox py={1} sx={{height:"calc(100vh - 100px)", display:"flex", flexDirection:"column", overflow:"hidden"}}>

        {/* Header */}
        <VuiBox mb={1} display="flex" justifyContent="space-between" alignItems="center">
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              {t("Drill Library", "Ejercicios")}
            </VuiTypography>
            <VuiTypography variant="body2" color="text">
              {t("Live animated drills. Select, play, coach.", "Ejercicios animados en vivo. Selecciona, reproduce, entrena.")}
            </VuiTypography>
          </VuiBox>

          {/* Language toggle */}
          <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,.08)", borderRadius:20, padding:3 }}>
            {["en","es"].map(l=>(
              <button key={l} onClick={()=>setLang(l)} style={{
                background: lang===l ? "#4ade80" : "transparent",
                color: lang===l ? "#000" : "rgba(255,255,255,.6)",
                border:"none", borderRadius:18, padding:"4px 14px",
                fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif",
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </VuiBox>

        {/* Filters */}
        <VuiBox display="flex" gap="6px" flexWrap="wrap" mb={1}>
          {["All", ...(customs.length ? ["Mine"] : []), ...CATS].map(cat=>(
            <button key={cat} onClick={()=>setActiveCat(cat)} style={{
              background: activeCat===cat ? (cat==="Mine" ? "#22d3ee" : (CAT_COLORS[cat]||"#4ade80")) : "rgba(255,255,255,.08)",
              color: activeCat===cat ? "#000" : "#fff",
              border:"none", borderRadius:20, padding:"5px 14px",
              fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif",
            }}>
              {cat==="All" ? t("All","Todos") : cat==="Mine" ? t("Mine","Míos") : cat}
            </button>
          ))}
          <div style={{width:1,background:"rgba(255,255,255,.12)",margin:"0 4px"}}/>
          {ages.map(a=>(
            <button key={a} onClick={()=>setAgeFilter(a)} style={{
              background: ageFilter===a ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.05)",
              color:"#fff", border:"1px solid rgba(255,255,255,.15)",
              borderRadius:20, padding:"5px 12px",
              fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif",
            }}>
              {a}
            </button>
          ))}
        </VuiBox>

        {/* Main layout */}
        <VuiBox display="flex" gap="12px" sx={{flex:1, minHeight:0, overflow:"hidden"}}>

          {/* Sidebar — scrolls internally, no visible scrollbar */}
          <VuiBox sx={{
            width:200, flexShrink:0, background:"rgba(255,255,255,.04)",
            borderRadius:"10px", padding:"10px", overflowY:"auto", minHeight:0,
            scrollbarWidth:"none", "&::-webkit-scrollbar":{display:"none"},
          }}>
            {CATS.map(cat=>{
              const catDrills = filtered.filter(d=>d.cat===cat);
              if (!catDrills.length) return null;
              return (
                <VuiBox key={cat} mb={1.5}>
                  <VuiTypography variant="caption" fontWeight="bold" style={{
                    color:CAT_COLORS[cat]||"#4ade80", textTransform:"uppercase",
                    letterSpacing:".06em", fontSize:10, display:"block", marginBottom:4,
                  }}>
                    {cat}
                  </VuiTypography>
                  {catDrills.map(d=>(
                    <button key={d.id} onClick={()=>{
                      setActiveDrill(d);
                      setPlaying(true);
                      setParentOpen(false);
                      setSpeaking(true);
                      speakDrill(d.id, lang, { onEnd: () => setSpeaking(false) });
                    }} style={{
                      display:"block", width:"100%", textAlign:"left",
                      background:activeDrill?.id===d.id?"rgba(255,255,255,.12)":"transparent",
                      border:"none", borderRadius:8, padding:"7px 10px",
                      color:"#fff", fontSize:12, fontWeight:activeDrill?.id===d.id?700:400,
                      cursor:"pointer", fontFamily:"Inter,sans-serif", marginBottom:2,
                      borderLeft:activeDrill?.id===d.id?`3px solid ${CAT_COLORS[d.cat]||"#4ade80"}`:"3px solid transparent",
                    }}>
                      {lang==="es" ? (d.titleEs||d.title) : d.title}
                    </button>
                  ))}
                </VuiBox>
              );
            })}
            {filtered.length===0 && (
              <VuiTypography variant="caption" color="text">
                {t("No drills match this filter.","Ningún ejercicio coincide con este filtro.")}
              </VuiTypography>
            )}
          </VuiBox>

          {/* Pitch + info */}
          <VuiBox sx={{flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden"}}>
            {/* pitch takes the space it can and fits by HEIGHT — no page scroll */}
            <VuiBox sx={{flex:1, minHeight:0, display:"flex", alignItems:"center", justifyContent:"center"}}>
              <PitchCanvas drill={activeDrill} playing={playing} speed={speed}/>
            </VuiBox>

            {/* Controls */}
            <VuiBox display="flex" alignItems="center" gap="6px" mb={1} flexWrap="wrap" sx={{flexShrink:0}}>
              <button onClick={()=>setPlaying(p=>!p)} style={{
                background: playing?"rgba(255,255,255,.15)":"#4ade80",
                color: playing?"#fff":"#000",
                border:"none", borderRadius:8, padding:"7px 18px",
                fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif", minWidth:80,
              }}>
                {playing ? t("⏸ Pause","⏸ Pausa") : t("▶ Play","▶ Reproducir")}
              </button>
              {[1,1.5,2].map(s=>(
                <button key={s} onClick={()=>setSpeed(s)} style={{
                  background:speed===s?"rgba(255,255,255,.2)":"transparent",
                  color:"#fff", border:"1px solid rgba(255,255,255,.15)",
                  borderRadius:6, padding:"5px 12px",
                  fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif",
                }}>
                  {s}×
                </button>
              ))}

              {/* Voice button */}
              <button onClick={handleSpeak} title={t("Read aloud","Leer en voz alta")} style={{
                background: speaking ? "rgba(251,191,36,.2)" : "rgba(255,255,255,.06)",
                color: speaking ? "#fbbf24" : "rgba(255,255,255,.6)",
                border:`1px solid ${speaking?"rgba(251,191,36,.4)":"rgba(255,255,255,.12)"}`,
                borderRadius:8, padding:"7px 14px",
                fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif",
              }}>
                {speaking ? t("🔊 Stop","🔊 Parar") : t("🔊 Read","🔊 Leer")}
              </button>

              {/* Assign to players (Pipe C) — vetted library drills only */}
              {activeDrill && !activeDrill.custom && (
                <button onClick={()=>setAssignOpen(o=>!o)} style={{
                  background: assignOpen ? "rgba(74,222,128,.15)" : "rgba(255,255,255,.06)",
                  color: assignOpen ? "#4ade80" : "rgba(255,255,255,.6)",
                  border:`1px solid ${assignOpen?"rgba(74,222,128,.35)":"rgba(255,255,255,.12)"}`,
                  borderRadius:8, padding:"7px 14px",
                  fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif",
                }}>
                  {t("📤 Assign to Players","📤 Asignar a Jugadores")}
                </button>
              )}
              {assignMsg && (
                <span style={{color:"#4ade80",fontSize:11,fontWeight:700,fontFamily:"Inter,sans-serif"}}>
                  {assignMsg}
                </span>
              )}

              {/* Parent message button */}
              {activeDrill?.parentMsg && (
                <button onClick={()=>setParentOpen(o=>!o)} style={{
                  background: parentOpen ? "rgba(96,165,250,.15)" : "rgba(255,255,255,.06)",
                  color: parentOpen ? "#60a5fa" : "rgba(255,255,255,.6)",
                  border:`1px solid ${parentOpen?"rgba(96,165,250,.3)":"rgba(255,255,255,.12)"}`,
                  borderRadius:8, padding:"7px 14px",
                  fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif",
                }}>
                  {t("📣 Parent Message","📣 Mensaje a Padres")}
                </button>
              )}
            </VuiBox>

            {/* Assign panel — ALL or a selected set (ruled payload) */}
            {assignOpen && activeDrill && !activeDrill.custom && (
              <VuiBox mb={1} style={{
                background:"rgba(74,222,128,.07)", border:"1px solid rgba(74,222,128,.25)",
                borderRadius:12, padding:"12px 16px",
              }}>
                <VuiBox display="flex" alignItems="center" gap="8px" flexWrap="wrap">
                  <button onClick={()=>sendAssignment("all")} style={{
                    background:"#4ade80", color:"#000", border:"none", borderRadius:8,
                    padding:"7px 16px", fontSize:12, fontWeight:800, cursor:"pointer",
                    fontFamily:"Inter,sans-serif",
                  }}>
                    {t("Send to ALL players","Enviar a TODOS")}
                  </button>
                  <span style={{color:"rgba(255,255,255,.4)",fontSize:11}}>{t("or pick:","o elige:")}</span>
                  {SEAT_PLAYERS.map(p=>(
                    <button key={p.ref} onClick={()=>setAssignSel(s=>{
                      const n = new Set(s); n.has(p.ref)?n.delete(p.ref):n.add(p.ref); return n;
                    })} style={{
                      background: assignSel.has(p.ref)?"rgba(74,222,128,.25)":"rgba(255,255,255,.06)",
                      color: assignSel.has(p.ref)?"#4ade80":"rgba(255,255,255,.7)",
                      border:`1px solid ${assignSel.has(p.ref)?"rgba(74,222,128,.5)":"rgba(255,255,255,.15)"}`,
                      borderRadius:16, padding:"5px 12px", fontSize:11, fontWeight:600,
                      cursor:"pointer", fontFamily:"Inter,sans-serif",
                    }}>
                      {p.name}
                    </button>
                  ))}
                  {assignSel.size>0 && (
                    <button onClick={()=>sendAssignment([...assignSel])} style={{
                      background:"rgba(74,222,128,.2)", color:"#4ade80",
                      border:"1px solid rgba(74,222,128,.5)", borderRadius:8,
                      padding:"7px 14px", fontSize:12, fontWeight:800, cursor:"pointer",
                      fontFamily:"Inter,sans-serif",
                    }}>
                      {t(`Send to ${assignSel.size}`,`Enviar a ${assignSel.size}`)}
                    </button>
                  )}
                </VuiBox>
                <VuiTypography variant="caption" color="text" sx={{display:"block",mt:1,fontSize:10}}>
                  {t(
                    "Lands on their FROM YOUR COACH shelf in SoccerMental — optional for them, no pressure.",
                    "Llega a su estante DE TU ENTRENADOR en SoccerMental — opcional para ellos, sin presión."
                  )}
                </VuiTypography>
              </VuiBox>
            )}

            {/* Parent message panel */}
            {parentOpen && activeDrill?.parentMsg && (
              <VuiBox mb={2} style={{
                background:"rgba(96,165,250,.08)", border:"1px solid rgba(96,165,250,.2)",
                borderRadius:12, padding:"14px 16px",
              }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <VuiTypography variant="caption" fontWeight="bold" style={{color:"#60a5fa"}}>
                    {t("SEND TO PARENTS AFTER SESSION","ENVIAR A PADRES DESPUÉS DE LA SESIÓN")}
                  </VuiTypography>
                  <button onClick={handleCopyParent} style={{
                    background: copied ? "#4ade80" : "rgba(96,165,250,.2)",
                    color: copied ? "#000" : "#60a5fa",
                    border:"none", borderRadius:6, padding:"4px 12px",
                    fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif",
                  }}>
                    {copied ? t("✓ Copied!","✓ Copiado!") : t("Copy","Copiar")}
                  </button>
                </VuiBox>
                <p style={{
                  color:"rgba(255,255,255,.85)", fontSize:13, lineHeight:1.6,
                  margin:0, fontFamily:"Inter,sans-serif",
                }}>
                  {lang==="es"
                    ? (activeDrill.parentMsgEs || activeDrill.parentMsg)
                    : activeDrill.parentMsg}
                </p>
              </VuiBox>
            )}

            {/* Drill info — fixed slice, scrolls inside if long, no page scroll */}
            {activeDrill && (
              <VuiBox sx={{
                background:"rgba(255,255,255,.05)", borderRadius:"10px",
                padding:"12px 14px", borderLeft:`3px solid ${catColor}`,
                flexShrink:0, maxHeight:"38%", overflowY:"auto",
                scrollbarWidth:"none", "&::-webkit-scrollbar":{display:"none"},
              }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                  <VuiTypography variant="h6" color="white" fontWeight="bold">
                    {lang==="es" ? (activeDrill.titleEs||activeDrill.title) : activeDrill.title}
                  </VuiTypography>
                  <VuiBox display="flex" gap="6px" flexWrap="wrap">
                    <span style={{background:catColor+"22",color:catColor,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700}}>
                      {activeDrill.cat}
                    </span>
                    <span style={{background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:600}}>
                      {activeDrill.ages?.join(" · ")}
                    </span>
                    <span style={{background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:600}}>
                      {activeDrill.dur} min
                    </span>
                  </VuiBox>
                </VuiBox>

                <VuiTypography variant="caption" color="text" mb={0.5} sx={{lineHeight:1.5}}>
                  {lang==="es" ? (activeDrill.descEs||activeDrill.desc) : activeDrill.desc}
                </VuiTypography>

                <VuiBox style={{
                  background:"rgba(0,0,0,.2)", borderRadius:6, padding:"8px 10px", marginBottom:6,
                  borderLeft:"3px solid rgba(251,191,36,.5)",
                }}>
                  <VuiTypography variant="caption" fontWeight="bold" style={{color:"#fbbf24",display:"block",marginBottom:2}}>
                    {t("COACHING POINT","PUNTO DE ENTRENAMIENTO")}
                  </VuiTypography>
                  <VuiTypography variant="caption" color="white">
                    {lang==="es" ? (activeDrill.coachingEs||activeDrill.coaching) : activeDrill.coaching}
                  </VuiTypography>
                </VuiBox>

                {activeDrill.equipment && (
                  <VuiTypography variant="caption" color="text" style={{display:"block",marginBottom:4,fontSize:11}}>
                    <span style={{color:"rgba(255,255,255,.4)"}}>
                      {t("Equipment: ","Equipo: ")}
                    </span>
                    {lang==="es" ? (activeDrill.equipmentEs||activeDrill.equipment) : activeDrill.equipment}
                  </VuiTypography>
                )}

                {/* With your squad — the diagram shows the PATTERN, this
                    line shows how to scale it to a real group */}
                {activeDrill.players && (() => {
                  const unit = activeDrill.players.filter(p => p.col !== "#fbbf24").length || activeDrill.players.length;
                  const stationsFor10 = Math.max(2, Math.round(10 / unit));
                  return (
                    <VuiBox style={{
                      background:"rgba(96,165,250,.07)", borderRadius:6, padding:"6px 10px",
                      border:"1px solid rgba(96,165,250,.2)", marginBottom:4,
                    }}>
                      <VuiTypography variant="caption" style={{color:"#60a5fa",fontSize:10.5,lineHeight:1.5}}>
                        👥 {t("WITH YOUR SQUAD: ","CON TU GRUPO: ")}
                        {unit <= 1
                          ? t(
                              "1 player works at a time — run it as a rotation so nobody waits more than one turn.",
                              "Trabaja 1 jugador a la vez — hazlo en rotación para que nadie espere más de un turno."
                            )
                          : t(
                              `This pattern uses ${unit} players. With 10 kids, run ~${stationsFor10} stations side by side, or rotate groups every 2 minutes. Nobody stands in line longer than one round.`,
                              `Este patrón usa ${unit} jugadores. Con 10 niños, monta ~${stationsFor10} estaciones en paralelo, o rota grupos cada 2 minutos. Nadie espera más de una ronda.`
                            )}
                      </VuiTypography>
                    </VuiBox>
                  );
                })()}

                {activeDrill.sm && (
                  <VuiBox style={{
                    background:"rgba(74,222,128,.07)", borderRadius:6, padding:"6px 10px",
                    border:"1px solid rgba(74,222,128,.2)", marginTop:4,
                  }}>
                    <VuiTypography variant="caption" style={{color:"#4ade80",fontSize:10}}>
                      ⚽ SoccerMental — {activeDrill.smUnit}
                    </VuiTypography>
                  </VuiBox>
                )}
              </VuiBox>
            )}
          </VuiBox>
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default CoachDrills;

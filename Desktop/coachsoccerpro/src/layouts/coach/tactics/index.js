import { useState, useRef, useCallback, useEffect } from "react";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { COACH_PLAYS } from "data/drills";

const W = 680, H = 440;

// ─── Pitch background (same markings as drill board) ────────────────────────
function PitchBg() {
  return (
    <>
      {Array.from({length:14},(_,i)=>(
        <rect key={i} x={30} y={30+i*27} width={620} height={27}
          fill={i%2===0?"rgba(255,255,255,.03)":"rgba(0,0,0,.04)"}/>
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
    </>
  );
}

// ─── Arrow markers ───────────────────────────────────────────────────────────
function Defs() {
  return (
    <defs>
      {["#4ade80","#ef4444","#fbbf24","#60a5fa","#ffffff"].map((col,i)=>(
        <marker key={i} id={`tm${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={col}/>
        </marker>
      ))}
      <filter id="glow2">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  );
}

function arrowMarker(col) {
  const cols = ["#4ade80","#ef4444","#fbbf24","#60a5fa","#ffffff"];
  const i = cols.indexOf(col);
  return `url(#tm${i<0?4:i})`;
}

// ─── Tactics Board ───────────────────────────────────────────────────────────
function TacticsBoard() {
  const [mode, setMode] = useState("coach"); // "coach" | "custom"
  const [selectedPlay, setSelectedPlay] = useState((COACH_PLAYS && COACH_PLAYS.length) ? COACH_PLAYS[0] : null);
  const [lang, setLang] = useState("en");

  // Custom play state
  const [customPlayers, setCustomPlayers] = useState([
    {id:"cp1",x:100,y:220,col:"#4ade80",lbl:"1",role:"Player 1"},
    {id:"cp2",x:200,y:180,col:"#4ade80",lbl:"2",role:"Player 2"},
    {id:"cp3",x:200,y:260,col:"#4ade80",lbl:"3",role:"Player 3"},
    {id:"cp4",x:300,y:220,col:"#4ade80",lbl:"4",role:"Player 4"},
    {id:"cp5",x:400,y:200,col:"#4ade80",lbl:"5",role:"Player 5"},
    {id:"cp6",x:400,y:240,col:"#4ade80",lbl:"6",role:"Player 6"},
    {id:"cd1",x:450,y:180,col:"#ef4444",lbl:"D",role:"Defender 1"},
    {id:"cd2",x:450,y:260,col:"#ef4444",lbl:"D",role:"Defender 2"},
    {id:"cgk",x:615,y:220,col:"#f59e0b",lbl:"GK",role:"Goalkeeper"},
  ]);
  const [customArrows, setCustomArrows] = useState([]);
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [arrowColor, setArrowColor] = useState("#4ade80");
  const [savedPlays, setSavedPlays] = useState(() => {
    try { return JSON.parse(localStorage.getItem("csp_custom_plays") || "[]"); } catch { return []; }
  });
  const [customName, setCustomName] = useState("My Play");
  const [comparing, setComparing] = useState(null);
  const [showRole, setShowRole] = useState(null);

  const svgRef = useRef(null);
  const draggingRef = useRef(null);

  // ── Drag logic ──────────────────────────────────────────────────────────
  const getSvgPos = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return {x:0,y:0};
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }, []);

  const onMouseDown = useCallback((e, id) => {
    if (drawMode) return;
    e.preventDefault();
    draggingRef.current = id;
  }, [drawMode]);

  const onMouseMove = useCallback((e) => {
    if (!draggingRef.current || drawMode) return;
    const pos = getSvgPos(e);
    setCustomPlayers(ps => ps.map(p =>
      p.id === draggingRef.current
        ? {...p, x:Math.max(20,Math.min(W-20,pos.x)), y:Math.max(20,Math.min(H-20,pos.y))}
        : p
    ));
  }, [drawMode, getSvgPos]);

  const onMouseUp = useCallback(() => { draggingRef.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [onMouseUp]);

  // ── Draw arrows ──────────────────────────────────────────────────────────
  const handleSvgClick = useCallback((e) => {
    if (!drawMode) return;
    const pos = getSvgPos(e);
    if (!drawStart) {
      setDrawStart(pos);
    } else {
      setCustomArrows(arr => [...arr, {x1:drawStart.x,y1:drawStart.y,x2:pos.x,y2:pos.y,col:arrowColor}]);
      setDrawStart(null);
    }
  }, [drawMode, drawStart, arrowColor, getSvgPos]);

  // ── Save / Load ──────────────────────────────────────────────────────────
  const savePlay = () => {
    const play = {
      id: Date.now().toString(),
      name: customName,
      players: JSON.parse(JSON.stringify(customPlayers)),
      arrows: JSON.parse(JSON.stringify(customArrows)),
      savedAt: new Date().toLocaleDateString(),
    };
    const updated = [play, ...savedPlays].slice(0, 10);
    setSavedPlays(updated);
    localStorage.setItem("csp_custom_plays", JSON.stringify(updated));
  };

  const loadPlay = (play) => {
    setCustomPlayers(play.players);
    setCustomArrows(play.arrows);
    setCustomName(play.name);
  };

  const deletePlay = (id) => {
    const updated = savedPlays.filter(p => p.id !== id);
    setSavedPlays(updated);
    localStorage.setItem("csp_custom_plays", JSON.stringify(updated));
  };

  const clearArrows = () => setCustomArrows([]);

  const activePlay = mode === "coach" ? selectedPlay : null;
  const coachSource = comparing || selectedPlay;
  const displayPlayers = mode === "coach" ? (coachSource ? coachSource.players : []) : customPlayers;
  const displayArrows = mode === "coach" ? (coachSource ? coachSource.arrows : []) : customArrows;

  return (
    <DashboardLayout>
      <DashboardNavbar/>
      <VuiBox py={1} sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", overflow: "hidden" }}>

        {/* Header — single row so the pitch gets the vertical space */}
        <VuiBox mb={1} display="flex" alignItems="center" gap="14px" flexWrap="wrap" sx={{ flexShrink: 0 }}>
          <VuiTypography variant="h5" color="white" fontWeight="bold">
            {lang==="es" ? "Tablero Táctico" : "Tactics Board"}
          </VuiTypography>
          {[["coach", lang==="es"?"🏆 Juegos de Élite":"🏆 Elite Plays"],
            ["custom", lang==="es"?"✏️ Mi Juego":"✏️ My Play"]].map(([m,lbl])=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              background:mode===m?"#4ade80":"rgba(255,255,255,.08)",
              color:mode===m?"#000":"#fff",
              border:"none",borderRadius:20,padding:"6px 18px",
              fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif",
            }}>{lbl}</button>
          ))}
          <div style={{flex:1}}/>
          <div style={{display:"flex",gap:4,background:"rgba(255,255,255,.08)",borderRadius:20,padding:3}}>
            {["en","es"].map(l=>(
              <button key={l} onClick={()=>setLang(l)} style={{
                background:lang===l?"#4ade80":"transparent",
                color:lang===l?"#000":"rgba(255,255,255,.6)",
                border:"none",borderRadius:18,padding:"4px 14px",
                fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif",
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </VuiBox>

        <VuiBox display="flex" gap="16px" sx={{ flex: 1, minHeight: 0 }}>

          {/* ── Left panel ── */}
          <VuiBox sx={{
            width:230,flexShrink:0,background:"rgba(255,255,255,.04)",
            borderRadius:"12px",padding:"12px",overflowY:"auto",minHeight:0,
            scrollbarWidth:"none","&::-webkit-scrollbar":{display:"none"},
          }}>
            {mode==="coach" ? (
              <>
                <VuiTypography variant="caption" fontWeight="bold" style={{
                  color:"rgba(255,255,255,.4)",textTransform:"uppercase",
                  letterSpacing:".06em",fontSize:10,display:"block",marginBottom:8,
                }}>
                  {lang==="es"?"JUEGOS DE ÉLITE":"ELITE PLAYS"}
                </VuiTypography>
                {COACH_PLAYS.map(play=>(
                  <VuiBox key={play.id} mb={1}>
                    <button
                      onClick={()=>{setSelectedPlay(play);setComparing(null);}}
                      style={{
                        display:"block",width:"100%",textAlign:"left",
                        background:selectedPlay?.id===play.id?"rgba(251,191,36,.1)":"transparent",
                        border:selectedPlay?.id===play.id?"1px solid rgba(251,191,36,.3)":"1px solid transparent",
                        borderRadius:8,padding:"8px 10px",
                        cursor:"pointer",fontFamily:"Inter,sans-serif",
                      }}
                    >
                      <div style={{color:"#fbbf24",fontSize:11,fontWeight:700,marginBottom:2}}>{play.coach}</div>
                      <div style={{color:"rgba(255,255,255,.8)",fontSize:12,fontWeight:600}}>{play.name}</div>
                      <div style={{color:"rgba(255,255,255,.4)",fontSize:10,marginTop:2}}>{play.team} · {play.system}</div>
                    </button>
                  </VuiBox>
                ))}
              </>
            ) : (
              <>
                {/* Custom play tools */}
                <VuiTypography variant="caption" fontWeight="bold" style={{
                  color:"rgba(255,255,255,.4)",textTransform:"uppercase",
                  letterSpacing:".06em",fontSize:10,display:"block",marginBottom:8,
                }}>
                  {lang==="es"?"HERRAMIENTAS":"TOOLS"}
                </VuiTypography>

                <div style={{marginBottom:12}}>
                  <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700,marginBottom:4,fontFamily:"Inter,sans-serif",textTransform:"uppercase"}}>
                    {lang==="es"?"Color de Flecha":"Arrow Color"}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {["#4ade80","#ef4444","#fbbf24","#60a5fa","#ffffff"].map(col=>(
                      <button key={col} onClick={()=>setArrowColor(col)} style={{
                        width:22,height:22,borderRadius:"50%",background:col,
                        border:arrowColor===col?"3px solid #fff":"2px solid rgba(255,255,255,.2)",
                        cursor:"pointer",padding:0,
                      }}/>
                    ))}
                  </div>
                </div>

                <button onClick={()=>{setDrawMode(d=>!d);setDrawStart(null);}} style={{
                  width:"100%",background:drawMode?"rgba(251,191,36,.15)":"rgba(255,255,255,.06)",
                  color:drawMode?"#fbbf24":"rgba(255,255,255,.7)",
                  border:`1px solid ${drawMode?"rgba(251,191,36,.4)":"rgba(255,255,255,.12)"}`,
                  borderRadius:8,padding:"7px",fontSize:12,fontWeight:700,
                  cursor:"pointer",fontFamily:"Inter,sans-serif",marginBottom:6,
                }}>
                  {drawMode ? (lang==="es"?"✏️ Click 2 puntos":"✏️ Click 2 points") : (lang==="es"?"➕ Dibujar Flecha":"➕ Draw Arrow")}
                </button>
                {drawStart && (
                  <div style={{color:"#fbbf24",fontSize:11,textAlign:"center",marginBottom:6,fontFamily:"Inter,sans-serif"}}>
                    {lang==="es"?"Click para terminar flecha":"Click to finish arrow"}
                  </div>
                )}
                <button onClick={clearArrows} style={{
                  width:"100%",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.5)",
                  border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"6px",
                  fontSize:11,cursor:"pointer",fontFamily:"Inter,sans-serif",marginBottom:12,
                }}>
                  {lang==="es"?"Borrar Flechas":"Clear Arrows"}
                </button>

                <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700,marginBottom:4,fontFamily:"Inter,sans-serif",textTransform:"uppercase"}}>
                  {lang==="es"?"Guardar":"Save Play"}
                </div>
                <input
                  value={customName}
                  onChange={e=>setCustomName(e.target.value)}
                  placeholder={lang==="es"?"Nombre del juego":"Play name"}
                  style={{
                    width:"100%",background:"rgba(255,255,255,.08)",
                    border:"1px solid rgba(255,255,255,.15)",borderRadius:6,
                    padding:"5px 8px",color:"#fff",fontSize:12,
                    fontFamily:"Inter,sans-serif",outline:"none",
                    boxSizing:"border-box",marginBottom:6,
                  }}
                />
                <button onClick={savePlay} style={{
                  width:"100%",background:"#4ade80",color:"#000",
                  border:"none",borderRadius:8,padding:"7px",
                  fontSize:12,fontWeight:700,cursor:"pointer",
                  fontFamily:"Inter,sans-serif",marginBottom:12,
                }}>
                  {lang==="es"?"💾 Guardar Juego":"💾 Save Play"}
                </button>

                {savedPlays.length > 0 && (
                  <>
                    <div style={{color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:700,marginBottom:6,fontFamily:"Inter,sans-serif",textTransform:"uppercase"}}>
                      {lang==="es"?"Guardados":"Saved Plays"}
                    </div>
                    {savedPlays.map(p=>(
                      <div key={p.id} style={{
                        display:"flex",alignItems:"center",justifyContent:"space-between",
                        background:"rgba(255,255,255,.04)",borderRadius:6,
                        padding:"5px 8px",marginBottom:4,
                      }}>
                        <button onClick={()=>loadPlay(p)} style={{
                          background:"none",border:"none",color:"rgba(255,255,255,.8)",
                          fontSize:11,cursor:"pointer",fontFamily:"Inter,sans-serif",
                          flex:1,textAlign:"left",padding:0,
                        }}>
                          {p.name}
                          <span style={{color:"rgba(255,255,255,.3)",fontSize:9,display:"block"}}>{p.savedAt}</span>
                        </button>
                        <button onClick={()=>deletePlay(p.id)} style={{
                          background:"none",border:"none",color:"rgba(239,68,68,.5)",
                          fontSize:14,cursor:"pointer",padding:"0 4px",
                        }}>×</button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </VuiBox>

          {/* ── Pitch ── */}
          <VuiBox sx={{flex:1, minWidth:0, minHeight:0, display:"flex", flexDirection:"column"}}>
            <div style={{position:"relative",marginBottom:8, flex:1, minHeight:0, display:"flex", alignItems:"flex-start", justifyContent:"center"}}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                style={{
                  maxWidth:"100%",maxHeight:"100%",height:"100%",display:"block",
                  background:"#1a4a2a",borderRadius:12,
                  cursor:drawMode?"crosshair":"default",
                }}
                onMouseMove={onMouseMove}
                onTouchMove={e=>{e.preventDefault();onMouseMove(e);}}
                onClick={handleSvgClick}
              >
                <Defs/>
                <PitchBg/>

                {/* Arrows */}
                {displayArrows && displayArrows.map((a,i)=>(
                  <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                    stroke={a.col||"#4ade80"} strokeWidth={2} strokeOpacity={0.75}
                    strokeDasharray={a.dash?"6,3":"none"}
                    markerEnd={arrowMarker(a.col||"#4ade80")}/>
                ))}

                {/* Draw preview */}
                {drawStart && (
                  <circle cx={drawStart.x} cy={drawStart.y} r={5}
                    fill={arrowColor} fillOpacity={0.7} stroke="#fff" strokeWidth={1}/>
                )}

                {/* Players */}
                {displayPlayers && displayPlayers.map(p=>(
                  <g key={p.id} filter="url(#glow2)"
                    transform={`translate(${p.x},${p.y})`}
                    style={{cursor:mode==="custom"&&!drawMode?"grab":"default"}}
                    onMouseDown={mode==="custom"?e=>onMouseDown(e,p.id):undefined}
                    onTouchStart={mode==="custom"?e=>onMouseDown(e,p.id):undefined}
                    onClick={e=>{
                      if (mode==="coach") { e.stopPropagation(); setShowRole(showRole===p.id?null:p.id); }
                    }}
                  >
                    <circle r={11} fill={p.col} fillOpacity={0.25}/>
                    <circle r={8} fill={p.col}/>
                    <text textAnchor="middle" dy={4} fontSize={8} fontFamily="Inter,sans-serif" fontWeight="700" fill="#000">
                      {p.lbl}
                    </text>
                    {showRole===p.id && p.role && (
                      <g>
                        <rect x={-60} y={-34} width={120} height={22} rx={4}
                          fill="rgba(0,0,0,.85)" stroke="rgba(255,255,255,.2)" strokeWidth={.5}/>
                        <text x={0} y={-20} textAnchor="middle" fontSize={8}
                          fontFamily="Inter,sans-serif" fill="rgba(255,255,255,.9)">
                          {p.role.length>24?p.role.slice(0,24)+"…":p.role}
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>

              {mode==="coach" && (
                <div style={{
                  position:"absolute",bottom:10,right:10,
                  background:"rgba(0,0,0,.5)",borderRadius:6,padding:"4px 8px",
                  color:"rgba(255,255,255,.5)",fontSize:10,fontFamily:"Inter,sans-serif",
                }}>
                  {lang==="es"?"Click jugador para ver rol":"Click player to see role"}
                </div>
              )}
              {mode==="custom" && !drawMode && (
                <div style={{
                  position:"absolute",bottom:10,right:10,
                  background:"rgba(0,0,0,.5)",borderRadius:6,padding:"4px 8px",
                  color:"rgba(255,255,255,.5)",fontSize:10,fontFamily:"Inter,sans-serif",
                }}>
                  {lang==="es"?"Arrastra jugadores":"Drag players"}
                </div>
              )}
            </div>

            {/* Coach play info */}
            {mode==="coach" && selectedPlay && (
              <VuiBox sx={{
                background:"rgba(255,255,255,.05)",borderRadius:"12px",padding:"12px 16px",
                borderLeft:"3px solid #fbbf24",
                flexShrink:0,maxHeight:"34%",overflowY:"auto",
                scrollbarWidth:"none","&::-webkit-scrollbar":{display:"none"},
              }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <VuiBox>
                    <div style={{color:"#fbbf24",fontSize:11,fontWeight:700,fontFamily:"Inter,sans-serif",marginBottom:2}}>
                      {selectedPlay.coach} · {selectedPlay.team} · {selectedPlay.system}
                    </div>
                    <VuiTypography variant="h6" color="white" fontWeight="bold">
                      {selectedPlay.name}
                    </VuiTypography>
                  </VuiBox>
                </VuiBox>

                <p style={{
                  color:"rgba(255,255,255,.75)",fontSize:13,lineHeight:1.6,
                  margin:"0 0 12px",fontFamily:"Inter,sans-serif",
                }}>
                  {lang==="es" ? (selectedPlay.descriptionEs||selectedPlay.description) : selectedPlay.description}
                </p>

                {selectedPlay.smUnits && selectedPlay.smUnits.length > 0 && (
                  <VuiBox style={{
                    background:"rgba(74,222,128,.07)",borderRadius:8,padding:"10px 12px",
                    border:"1px solid rgba(74,222,128,.2)",
                  }}>
                    <div style={{color:"#4ade80",fontSize:10,fontWeight:700,fontFamily:"Inter,sans-serif",marginBottom:6,textTransform:"uppercase",letterSpacing:".04em"}}>
                      ⚽ {lang==="es"?"Unidades SoccerMental relacionadas":"SoccerMental Units"}
                    </div>
                    {selectedPlay.smUnits.map((u,i)=>(
                      <div key={i} style={{
                        color:"rgba(255,255,255,.7)",fontSize:12,fontFamily:"Inter,sans-serif",
                        padding:"3px 0",borderBottom:i<selectedPlay.smUnits.length-1?"1px solid rgba(255,255,255,.06)":"none",
                      }}>
                        {u}
                      </div>
                    ))}
                  </VuiBox>
                )}

                {/* Compare button */}
                <VuiBox mt={2}>
                  <div style={{color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:700,marginBottom:6,fontFamily:"Inter,sans-serif",textTransform:"uppercase"}}>
                    {lang==="es"?"Comparar con otro juego:":"Compare with:"}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {COACH_PLAYS.filter(p=>p.id!==selectedPlay.id).map(p=>(
                      <button key={p.id}
                        onClick={()=>setComparing(comparing?.id===p.id?null:p)}
                        style={{
                          background:comparing?.id===p.id?"rgba(251,191,36,.15)":"rgba(255,255,255,.06)",
                          color:comparing?.id===p.id?"#fbbf24":"rgba(255,255,255,.6)",
                          border:`1px solid ${comparing?.id===p.id?"rgba(251,191,36,.3)":"rgba(255,255,255,.1)"}`,
                          borderRadius:20,padding:"4px 12px",
                          fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",
                        }}
                      >
                        {p.coach}
                      </button>
                    ))}
                  </div>
                  {comparing && (
                    <div style={{
                      marginTop:8,color:"rgba(255,255,255,.6)",fontSize:12,
                      fontFamily:"Inter,sans-serif",fontStyle:"italic",
                    }}>
                      {lang==="es"?"Mostrando":"Showing"}: {comparing.name} — {comparing.coach}
                    </div>
                  )}
                </VuiBox>
              </VuiBox>
            )}

            {mode==="custom" && (
              <VuiBox sx={{
                background:"rgba(255,255,255,.04)",borderRadius:"12px",padding:"10px 14px",
                border:"1px solid rgba(255,255,255,.08)",flexShrink:0,
              }}>
                <VuiTypography variant="caption" color="text">
                  {lang==="es"
                    ? "Arrastra jugadores para posicionarlos. Usa 'Dibujar Flecha' para añadir movimiento. Guarda y compara con los juegos de los mejores entrenadores."
                    : "Drag players to position them. Use Draw Arrow to show movement. Save your plays and compare them against elite coach patterns."}
                </VuiTypography>
              </VuiBox>
            )}
          </VuiBox>
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default TacticsBoard;

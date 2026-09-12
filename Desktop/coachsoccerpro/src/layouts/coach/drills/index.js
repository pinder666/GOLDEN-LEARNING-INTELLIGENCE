import { useState, useEffect, useRef, useCallback } from "react";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

// Layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { DRILLS, CATS } from "data/drills";

// ─── Animated pitch renderer ───────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }

function PitchCanvas({ drill, playing, speed }) {
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const pausedAtRef = useRef(0);
  const svgRef = useRef(null);

  const duration = drill ? (drill.frames[drill.frames.length - 1].t * (1 / speed)) : 3000;

  const render = useCallback((elapsed) => {
    if (!drill || !svgRef.current) return;
    const t = elapsed % (duration + 600);

    // find surrounding frames
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
      const px = lerp(pA.x, pB.x, frac);
      const py = lerp(pA.y, pB.y, frac);
      const g = svgRef.current.querySelector(`[data-player="${p.id}"]`);
      if (g) g.setAttribute("transform", `translate(${px},${py})`);
    });
  }, [drill, speed, duration]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pausedAtRef.current = Date.now() - (startRef.current || Date.now());
      return;
    }
    startRef.current = Date.now() - pausedAtRef.current;
    const loop = () => {
      render(Date.now() - startRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, render]);

  // reset on drill change
  useEffect(() => {
    pausedAtRef.current = 0;
    startRef.current = Date.now();
  }, [drill]);

  if (!drill) return null;

  const W = 680, H = 440;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", background: "#1a4a2a", borderRadius: 12 }}
    >
      <defs>
        <marker id="ah-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#4ade80" />
        </marker>
        <marker id="ah-w" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,.7)" />
        </marker>
        <marker id="ah-y" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#fbbf24" />
        </marker>
        <marker id="ah-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
        </marker>
        <marker id="ah-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#60a5fa" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Pitch grass stripes */}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={30} y={30 + i * 27} width={620} height={27}
          fill={i % 2 === 0 ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.04)"} />
      ))}

      {/* Boundary */}
      <rect x={30} y={30} width={620} height={380} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={2} />

      {/* Centre line */}
      <line x1={340} y1={30} x2={340} y2={410} stroke="rgba(255,255,255,.4)" strokeWidth={1.5} />

      {/* Centre circle */}
      <circle cx={340} cy={220} r={55} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5} />
      <circle cx={340} cy={220} r={3} fill="rgba(255,255,255,.5)" />

      {/* Penalty boxes */}
      <rect x={30} y={140} width={100} height={160} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5} />
      <rect x={30} y={167} width={55} height={106} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1} />
      <rect x={550} y={140} width={100} height={160} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1.5} />
      <rect x={595} y={167} width={55} height={106} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1} />

      {/* Goals */}
      <rect x={14} y={187} width={16} height={66} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5} />
      <rect x={650} y={187} width={16} height={66} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5} />

      {/* Penalty spots */}
      <circle cx={90} cy={220} r={3} fill="rgba(255,255,255,.5)" />
      <circle cx={590} cy={220} r={3} fill="rgba(255,255,255,.5)" />

      {/* Corner arcs */}
      {[[30,30],[650,30],[30,410],[650,410]].map(([cx,cy],i) => (
        <path key={i} d={`M ${cx + (i%2===0?10:-10)},${cy} A 10,10 0 0 ${i%2===0?0:1} ${cx},${cy+(i<2?10:-10)}`}
          fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1} />
      ))}

      {/* Zone overlays */}
      {drill.zones && drill.zones.map((z, i) => (
        <g key={i}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h}
            fill={z.col} stroke={z.border} strokeWidth={1} strokeDasharray="4,3" />
          <text x={z.x + z.w / 2} y={z.y - 6} textAnchor="middle"
            fill="rgba(251,191,36,.6)" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="700">
            {z.label}
          </text>
        </g>
      ))}

      {/* Offside line */}
      {drill.offsideLine && (
        <line x1={450} y1={30} x2={450} y2={410}
          stroke="rgba(251,191,36,.5)" strokeWidth={1.5} strokeDasharray="6,4" />
      )}

      {/* Cones */}
      {drill.cones && drill.cones.map((c, i) => (
        <polygon key={i} points={`${c.x},${c.y - 8} ${c.x - 5},${c.y + 4} ${c.x + 5},${c.y + 4}`}
          fill={c.col} stroke="rgba(0,0,0,.3)" strokeWidth={.5} />
      ))}

      {/* Arrows */}
      {drill.arrows && drill.arrows.map((a, i) => {
        const col = a.col || "#4ade80";
        const markerId = col.includes("4ade80") ? "ah-g"
          : col.includes("ef4444") ? "ah-r"
          : col.includes("fbbf24") ? "ah-y"
          : col.includes("60a5fa") ? "ah-b"
          : "ah-w";
        return (
          <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke={col} strokeWidth={1.8} strokeOpacity={0.7}
            strokeDasharray={a.dash ? "5,3" : "none"}
            markerEnd={`url(#${markerId})`} />
        );
      })}

      {/* Players — positioned via transform, updated by rAF */}
      {drill.players.map(p => (
        <g key={p.id} data-player={p.id} filter="url(#glow)">
          <circle r={11} fill={p.col} fillOpacity={0.25} />
          <circle r={8} fill={p.col} />
          <text textAnchor="middle" dy={4} fontSize={8}
            fontFamily="Inter,sans-serif" fontWeight="700" fill="#000">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
const catColors = {
  "Scanning": "#4ade80",
  "Decision Making": "#60a5fa",
  "Positioning": "#a78bfa",
  "Awareness": "#fbbf24",
  "Technical": "#f97316",
  "Tactical": "#f43f5e",
};

function CoachDrills() {
  const [activeCat, setActiveCat] = useState("All");
  const [activeDrill, setActiveDrill] = useState(DRILLS[0]);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [ageFilter, setAgeFilter] = useState("All");

  const ages = ["All", "U8", "U10", "U12", "U14+"];

  const filtered = DRILLS.filter(d => {
    const catOk = activeCat === "All" || d.cat === activeCat;
    const ageOk = ageFilter === "All" || (d.ages && d.ages.includes(ageFilter));
    return catOk && ageOk;
  });

  const catColor = catColors[activeDrill?.cat] || "#4ade80";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>

        {/* Header */}
        <VuiBox mb={2}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            Drill Library
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            Live animated drills. Select a drill, hit play.
          </VuiTypography>
        </VuiBox>

        {/* Filter row */}
        <VuiBox display="flex" gap="8px" flexWrap="wrap" mb={2}>
          {["All", ...CATS].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              style={{
                background: activeCat === cat ? (catColors[cat] || "#4ade80") : "rgba(255,255,255,.08)",
                color: activeCat === cat ? "#000" : "#fff",
                border: "none", borderRadius: 20, padding: "5px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}
            >
              {cat}
            </button>
          ))}
          <div style={{ width: 1, background: "rgba(255,255,255,.12)", margin: "0 4px" }} />
          {ages.map(a => (
            <button
              key={a}
              onClick={() => setAgeFilter(a)}
              style={{
                background: ageFilter === a ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.05)",
                color: "#fff", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 20, padding: "5px 12px",
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}
            >
              {a}
            </button>
          ))}
        </VuiBox>

        {/* Main layout */}
        <VuiBox display="flex" gap="16px" style={{ minHeight: 480 }}>

          {/* Sidebar drill list */}
          <VuiBox
            style={{
              width: 220, flexShrink: 0, background: "rgba(255,255,255,.04)",
              borderRadius: 12, padding: 12, overflowY: "auto", maxHeight: 580,
            }}
          >
            {CATS.map(cat => {
              const catDrills = filtered.filter(d => d.cat === cat);
              if (!catDrills.length) return null;
              return (
                <VuiBox key={cat} mb={1.5}>
                  <VuiTypography
                    variant="caption" fontWeight="bold"
                    style={{ color: catColors[cat], textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, display: "block", marginBottom: 4 }}
                  >
                    {cat}
                  </VuiTypography>
                  {catDrills.map(d => (
                    <button
                      key={d.id}
                      onClick={() => { setActiveDrill(d); setPlaying(true); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: activeDrill?.id === d.id ? "rgba(255,255,255,.12)" : "transparent",
                        border: "none", borderRadius: 8, padding: "7px 10px",
                        color: "#fff", fontSize: 12, fontWeight: activeDrill?.id === d.id ? 700 : 400,
                        cursor: "pointer", fontFamily: "Inter,sans-serif", marginBottom: 2,
                        borderLeft: activeDrill?.id === d.id ? `3px solid ${catColors[d.cat]}` : "3px solid transparent",
                      }}
                    >
                      {d.title}
                    </button>
                  ))}
                </VuiBox>
              );
            })}
            {filtered.length === 0 && (
              <VuiTypography variant="caption" color="text">No drills match this filter.</VuiTypography>
            )}
          </VuiBox>

          {/* Pitch + info */}
          <VuiBox style={{ flex: 1 }}>

            {/* Pitch */}
            <VuiBox mb={1.5}>
              <PitchCanvas drill={activeDrill} playing={playing} speed={speed} />
            </VuiBox>

            {/* Controls */}
            <VuiBox display="flex" alignItems="center" gap="10px" mb={2}>
              <button
                onClick={() => setPlaying(p => !p)}
                style={{
                  background: playing ? "rgba(255,255,255,.15)" : "#4ade80",
                  color: playing ? "#fff" : "#000",
                  border: "none", borderRadius: 8, padding: "7px 18px",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
                  minWidth: 80,
                }}
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
              {[1, 1.5, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    background: speed === s ? "rgba(255,255,255,.2)" : "transparent",
                    color: "#fff", border: "1px solid rgba(255,255,255,.15)",
                    borderRadius: 6, padding: "5px 12px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif",
                  }}
                >
                  {s}×
                </button>
              ))}
            </VuiBox>

            {/* Drill info */}
            {activeDrill && (
              <VuiBox
                style={{
                  background: "rgba(255,255,255,.05)", borderRadius: 12,
                  padding: 16, borderLeft: `3px solid ${catColor}`,
                }}
              >
                <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <VuiTypography variant="h6" color="white" fontWeight="bold">
                    {activeDrill.title}
                  </VuiTypography>
                  <VuiBox display="flex" gap="6px">
                    <span style={{ background: catColor + "22", color: catColor, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>
                      {activeDrill.cat}
                    </span>
                    <span style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                      {activeDrill.ages?.join(" · ")}
                    </span>
                    <span style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                      {activeDrill.dur} min
                    </span>
                  </VuiBox>
                </VuiBox>

                <VuiTypography variant="body2" color="text" mb={1}>
                  {activeDrill.desc}
                </VuiTypography>

                <VuiBox
                  style={{
                    background: "rgba(0,0,0,.2)", borderRadius: 8, padding: "10px 12px", marginBottom: 8,
                    borderLeft: "3px solid rgba(251,191,36,.5)",
                  }}
                >
                  <VuiTypography variant="caption" fontWeight="bold" style={{ color: "#fbbf24", display: "block", marginBottom: 2 }}>
                    COACHING POINT
                  </VuiTypography>
                  <VuiTypography variant="caption" color="white">
                    {activeDrill.coaching}
                  </VuiTypography>
                </VuiBox>

                {activeDrill.equipment && (
                  <VuiTypography variant="caption" color="text">
                    <span style={{ color: "rgba(255,255,255,.4)" }}>Equipment: </span>
                    {activeDrill.equipment}
                  </VuiTypography>
                )}

                {activeDrill.sm && (
                  <VuiBox mt={1.5} style={{
                    background: "rgba(74,222,128,.07)", borderRadius: 8, padding: "8px 12px",
                    border: "1px solid rgba(74,222,128,.2)",
                  }}>
                    <VuiTypography variant="caption" style={{ color: "#4ade80" }}>
                      ⚽ SoccerMental — {activeDrill.smUnit}
                    </VuiTypography>
                  </VuiBox>
                )}
              </VuiBox>
            )}
          </VuiBox>
        </VuiBox>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default CoachDrills;

import { useState, useRef, useCallback, useEffect } from "react";
import { useLang } from "useLang";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { MANAGER_PLAYS, TACTICS_LESSONS, WORLD_LESSONS } from "data/classroom";
import { isMuted } from "services/voice";

// The SoccerMental classroom, ported verbatim (same cinema stage, same draw()
// engine) and reskinned for CoachSoccerPro. Three wings the coach picks.
const WINGS = [
  { key: "manager", label: { en: "Managers", es: "Entrenadores" }, icon: "👔", items: MANAGER_PLAYS },
  { key: "tactic", label: { en: "Tactics", es: "Tácticas" }, icon: "⚙️", items: TACTICS_LESSONS },
  { key: "world", label: { en: "World of Football", es: "Mundo del Fútbol" }, icon: "🌍", items: WORLD_LESSONS },
];

// ── SoccerMental's exact cinema pitch (viewBox 140x90, landscape broadcast) ──
const PITCH_SVG = `
<svg id="cr-svg" viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
  <defs>
    <filter id="cr-glow-gold" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="cr-glow-blue" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="cr-glow-green" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="cr-glow-red" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <marker id="cr-arr-gold" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#FFD700"/></marker>
    <marker id="cr-arr-green" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#00FF88"/></marker>
    <marker id="cr-arr-blue" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#00CFFF"/></marker>
    <marker id="cr-arr-red" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#FF3355"/></marker>
  </defs>
  <rect x="0" y="0" width="140" height="90" fill="#0a5c2e"/>
  <rect x="0" y="0" width="20" height="90" fill="#094f27"/>
  <rect x="40" y="0" width="20" height="90" fill="#094f27"/>
  <rect x="80" y="0" width="20" height="90" fill="#094f27"/>
  <rect x="120" y="0" width="20" height="90" fill="#094f27"/>
  <rect x="3" y="3" width="134" height="84" fill="none" stroke="rgba(242,238,226,.22)" stroke-width=".6"/>
  <line x1="70" y1="3" x2="70" y2="87" stroke="rgba(242,238,226,.22)" stroke-width=".6"/>
  <circle cx="70" cy="45" r="11" fill="none" stroke="rgba(242,238,226,.22)" stroke-width=".6"/>
  <circle cx="70" cy="45" r=".7" fill="rgba(242,238,226,.35)"/>
  <rect x="3" y="24" width="21" height="42" fill="none" stroke="rgba(242,238,226,.22)" stroke-width=".6"/>
  <rect x="3" y="35" width="7" height="20" fill="none" stroke="rgba(242,238,226,.16)" stroke-width=".5"/>
  <rect x="0" y="38" width="3" height="14" fill="rgba(255,255,255,.08)" stroke="rgba(242,238,226,.3)" stroke-width=".6"/>
  <circle cx="17" cy="45" r=".7" fill="rgba(242,238,226,.35)"/>
  <path d="M24,36 A11,11 0 0,1 24,54" fill="none" stroke="rgba(242,238,226,.18)" stroke-width=".5"/>
  <rect x="116" y="24" width="21" height="42" fill="none" stroke="rgba(242,238,226,.22)" stroke-width=".6"/>
  <rect x="130" y="35" width="7" height="20" fill="none" stroke="rgba(242,238,226,.16)" stroke-width=".5"/>
  <rect x="137" y="38" width="3" height="14" fill="rgba(255,255,255,.08)" stroke="rgba(242,238,226,.3)" stroke-width=".6"/>
  <circle cx="123" cy="45" r=".7" fill="rgba(242,238,226,.35)"/>
  <path d="M116,36 A11,11 0 0,0 116,54" fill="none" stroke="rgba(242,238,226,.18)" stroke-width=".5"/>
  <g id="cr-lyr-zones"></g><g id="cr-lyr-conn"></g><g id="cr-lyr-arrows"></g>
  <g id="cr-lyr-players"></g><g id="cr-lyr-labels"></g><g id="cr-lyr-ball"></g><g id="cr-lyr-overlay"></g>
</svg>`;

// ── SoccerMental's exact draw helpers (operate on the layer <g> ids above) ──
const NS = "http://www.w3.org/2000/svg";
function crel(tag, attrs) { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); return e; }
function ctxt(x, y, str, size, fill, weight, anchor) {
  const t = crel("text", { x, y, "text-anchor": anchor || "middle", "dominant-baseline": "middle",
    "font-size": size || 3, fill: fill || "#F2EEE2", "font-weight": weight || "700",
    "font-family": "Arial Rounded MT Bold,Arial,sans-serif" });
  t.textContent = str; return t;
}
function clrLayer(id) { const e = document.getElementById(id); if (e) while (e.firstChild) e.removeChild(e.firstChild); }
function clearAll() { ["cr-lyr-zones", "cr-lyr-conn", "cr-lyr-arrows", "cr-lyr-players", "cr-lyr-labels", "cr-lyr-ball", "cr-lyr-overlay"].forEach(clrLayer); }
function animLine(layer, x1, y1, x2, y2, stroke, sw, delay, marker, dashed) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const attrs = { x1, y1, x2, y2, stroke, "stroke-width": sw || 1.2, fill: "none", "stroke-linecap": "round" };
  if (marker) attrs["marker-end"] = `url(#cr-arr-${marker})`;
  if (dashed) attrs["stroke-dasharray"] = "4 3";
  else { attrs["stroke-dasharray"] = len; attrs["stroke-dashoffset"] = len; }
  const l = crel("line", attrs);
  if (!dashed) { l.style.transition = `stroke-dashoffset ${0.45 + len * 0.007}s ease ${delay || 0}s`; setTimeout(() => l.setAttribute("stroke-dashoffset", "0"), 60); }
  const p = document.getElementById(layer); if (p) p.appendChild(l); return l;
}
function crPlayer(cx, cy, color, label, sub, delay, gf) {
  const g = crel("g", {}); g.style.opacity = "0"; g.style.transition = `opacity .3s ease ${delay || 0}s`;
  const ring = crel("circle", { cx, cy, r: "5.5", fill: "none", stroke: color, "stroke-width": "1.2", opacity: ".5" });
  ring.setAttribute("filter", `url(#cr-glow-${gf || "gold"})`); g.appendChild(ring);
  const dot = crel("circle", { cx, cy, r: "4", fill: "rgba(0,0,0,.8)", stroke: color, "stroke-width": "1.8" });
  dot.setAttribute("filter", `url(#cr-glow-${gf || "gold"})`); g.appendChild(dot);
  if (label) g.appendChild(ctxt(cx, cy, label, "3.2", color, "900"));
  if (sub) g.appendChild(ctxt(cx, cy + 7.5, sub, "2.3", "rgba(242,238,226,.65)", "700"));
  const p = document.getElementById("cr-lyr-players"); if (p) p.appendChild(g);
  setTimeout(() => { g.style.opacity = "1"; }, 60); return g;
}
function crZone(x, y, w, h, fill, stroke, delay) {
  const r = crel("rect", { x, y, width: w, height: h, fill, stroke: stroke || "none", "stroke-width": ".8", rx: "1" });
  r.style.opacity = "0"; r.style.transition = `opacity .4s ease ${delay || 0}s`;
  const p = document.getElementById("cr-lyr-zones"); if (p) p.appendChild(r);
  setTimeout(() => { r.style.opacity = "1"; }, 60); return r;
}
function crBall(cx, cy, delay) {
  const g = crel("g", {}); g.style.opacity = "0"; g.style.transition = `opacity .25s ease ${delay || 0}s`;
  const c = crel("circle", { cx, cy, r: "2.2", fill: "#fff", stroke: "rgba(0,0,0,.4)", "stroke-width": ".5" });
  c.setAttribute("filter", "url(#cr-glow-gold)"); g.appendChild(c);
  const p = document.getElementById("cr-lyr-ball"); if (p) p.appendChild(g);
  setTimeout(() => { g.style.opacity = "1"; }, 60);
}
function crTri(pts, color, delay) { pts.forEach((pt, i) => { const n = pts[(i + 1) % 3]; animLine("cr-lyr-conn", pt[0], pt[1], n[0], n[1], color, 1.5, delay + i * 0.15, "gold"); }); }
function crLabel(x, y, str, color, delay) {
  const g = crel("g", {}); g.style.opacity = "0"; g.style.transition = `opacity .3s ease ${delay || 0}s`;
  const bg = crel("rect", { x: x - 13, y: y - 2.8, width: "26", height: "5.8", fill: "rgba(0,0,0,.85)", stroke: color, "stroke-width": ".5", rx: "1.5" });
  g.appendChild(bg); g.appendChild(ctxt(x, y + 0.3, str, "2.9", color, "900"));
  const p = document.getElementById("cr-lyr-overlay"); if (p) p.appendChild(g);
  setTimeout(() => { g.style.opacity = "1"; }, 60);
}

function Classroom() {
  const [lang, setLang] = useLang();
  const [wing, setWing] = useState("manager");
  const wingObj = WINGS.find((w) => w.key === wing) || WINGS[0];
  const [lesson, setLesson] = useState(WINGS[0].items[0] || null);
  const [beat, setBeat] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [subtitle, setSubtitle] = useState("");
  const [paused, setPaused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);   // the closable lesson-notes tab
  const autoplayRef = useRef(true);
  const audioRef = useRef(null);
  const tokenRef = useRef(0);       // audio queue token
  const drawTokenRef = useRef(0);   // draw() setTimeout token
  const pitchRef = useRef(null);
  const pausedRef = useRef(false);
  const queueRef = useRef([]);
  const qIdxRef = useRef(0);
  const gapTimerRef = useRef(null);
  const holdTimerRef = useRef(null);
  const playCurRef = useRef(null);
  useEffect(() => { autoplayRef.current = autoplay; }, [autoplay]);

  const T = (en, es) => (lang === "es" ? es : en);
  const beats = lesson && Array.isArray(lesson.beats) ? lesson.beats : [];
  const curBeat = beats[Math.min(beat, beats.length - 1)] || null;

  // Mount the cinema pitch once.
  useEffect(() => { if (pitchRef.current) pitchRef.current.innerHTML = PITCH_SVG; }, []);

  // Run the beat's verbatim draw() whenever the beat changes.
  useEffect(() => {
    if (!curBeat || !pitchRef.current) return;
    if (!pitchRef.current.querySelector("#cr-svg")) pitchRef.current.innerHTML = PITCH_SVG;
    const myTok = (drawTokenRef.current += 1);
    const guardedTimeout = (fn, ms) => window.setTimeout(() => { if (drawTokenRef.current === myTok) { try { fn(); } catch (e) {} } }, ms);
    try { clearAll(); } catch (e) {}
    if (curBeat.draw) {
      try {
        // draw() is verbatim SoccerMental content (bundled, trusted). Some beats
        // build custom elements with crel/ctxt, so those are in scope too.
        // eslint-disable-next-line no-new-func
        const run = new Function("clearAll", "crPlayer", "animLine", "crZone", "crTri", "crBall", "crLabel", "crel", "ctxt", "setTimeout", curBeat.draw);
        run(clearAll, crPlayer, animLine, crZone, crTri, crBall, crLabel, crel, ctxt, guardedTimeout);
      } catch (e) { /* a malformed draw never breaks the page */ }
    }
  }, [curBeat]);

  // ── Audio + subtitle ────────────────────────────────────────────────────
  // ONLY the real owned coach voice (EN) / SM voice (ES). NEVER robotic device
  // TTS — if a line has no owned file, it holds the subtitle silently. Pause
  // freezes the current clip and RESUMES from the same spot (never restarts).
  const clearTimers = useCallback(() => {
    if (gapTimerRef.current) { clearTimeout(gapTimerRef.current); gapTimerRef.current = null; }
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }, []);
  const stopAll = useCallback(() => {
    tokenRef.current += 1;
    clearTimers();
    if (audioRef.current) { try { audioRef.current.pause && audioRef.current.pause(); } catch (e) {} audioRef.current = null; }
    pausedRef.current = false; setPaused(false); setSpeaking(false);
  }, [clearTimers]);

  // queue of {file, text}: the subtitle switches to each item's text as it speaks
  const buildQueue = useCallback((idx) => {
    const b = beats[idx]; if (!b) return [];
    const q = [];
    if (lang === "es") {
      if (b.audioEsHead || b.headEs || b.head) q.push({ file: b.audioEsHead, text: b.headEs || b.head });
      if (b.audioEsBody) q.push({ file: b.audioEsBody, text: b.bodyEs || b.body });
      else if (b.bodyEs) q.push({ file: null, text: b.bodyEs });
      else if (b.body) q.push({ file: null, text: b.body });
    } else {
      if (idx === 0 && lesson.audioEnIntro) q.push({ file: lesson.audioEnIntro, text: lesson.introText });
      const sents = b.audioEnSentences || [];
      if (sents.length) sents.forEach((s) => q.push({ file: s.file, text: s.text }));
      else if (b.body) q.push({ file: null, text: b.body });
    }
    return q;
  }, [beats, lang, lesson]);

  const playBeatAt = useCallback((idx) => {
    const items = buildQueue(idx);
    queueRef.current = items; qIdxRef.current = 0;
    const myToken = (tokenRef.current += 1);
    clearTimers();
    if (audioRef.current) { try { audioRef.current.pause && audioRef.current.pause(); } catch (e) {} audioRef.current = null; }
    pausedRef.current = false; setPaused(false); setSpeaking(true);

    const advance = () => { qIdxRef.current += 1; if (!pausedRef.current) playCur(); };
    const playCur = () => {
      if (tokenRef.current !== myToken || pausedRef.current) return;
      const it = queueRef.current[qIdxRef.current];
      if (!it) {  // beat finished
        if (autoplayRef.current && idx < beats.length - 1) { setBeat(idx + 1); playBeatAt(idx + 1); }
        else { setSpeaking(false); }
        return;
      }
      setSubtitle(it.text || "");
      if (isMuted()) { gapTimerRef.current = setTimeout(advance, 60); return; }
      if (it.file) {
        const a = new Audio(it.file); audioRef.current = a;
        a.onended = () => { if (tokenRef.current !== myToken) return; qIdxRef.current += 1; gapTimerRef.current = setTimeout(() => { if (!pausedRef.current) playCur(); }, 280); };
        a.onerror = () => { if (tokenRef.current === myToken) advance(); };     // missing file → silent skip
        a.play().catch(() => { if (tokenRef.current === myToken) advance(); });  // blocked → silent skip
      } else {  // no owned audio (untranslated ES) — hold readable, silent
        audioRef.current = null;
        holdTimerRef.current = setTimeout(() => { if (tokenRef.current === myToken) advance(); }, 2600);
      }
    };
    playCurRef.current = playCur;
    playCur();
  }, [buildQueue, beats.length, clearTimers]);

  const pausePlay = useCallback(() => {
    pausedRef.current = true; setPaused(true); setSpeaking(false);
    clearTimers();
    const a = audioRef.current;
    if (a && typeof a.pause === "function") { try { a.pause(); } catch (e) {} }
  }, [clearTimers]);

  const resumePlay = useCallback(() => {
    pausedRef.current = false; setPaused(false); setSpeaking(true);
    const a = audioRef.current;
    if (a && typeof a.play === "function" && a.paused && !a.ended) { a.play().catch(() => {}); return; }
    if (playCurRef.current) playCurRef.current();  // continue from the current cursor
  }, []);

  const toggleSpeak = () => {
    if (speaking) pausePlay();
    else if (paused) resumePlay();
    else playBeatAt(Math.min(beat, beats.length - 1));
  };
  const gotoBeat = (idx) => { stopAll(); setBeat(Math.max(0, Math.min(beats.length - 1, idx))); };

  // Show the full beat body as the subtitle when fully idle (not paused).
  useEffect(() => {
    if (!curBeat) return;
    if (!speaking && !paused) setSubtitle(lang === "es" ? (curBeat.bodyEs || curBeat.body) : curBeat.body);
  }, [curBeat, lang, speaking, paused]);

  // Reset on lesson change — DON'T auto-start (browser blocks audio without a
  // user gesture, which is what forced the robotic fallback). The coach presses
  // Play; that gesture lets the real voice through.
  useEffect(() => { stopAll(); setBeat(0); }, [lesson, stopAll]);
  useEffect(() => () => stopAll(), [stopAll]);

  const selectWing = (k) => { const wo = WINGS.find((w) => w.key === k); setWing(k); setLesson(wo && wo.items[0] ? wo.items[0] : null); };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", overflow: "hidden" }}>

        {/* Header — wing tabs */}
        <VuiBox mb={1} display="flex" alignItems="center" gap="12px" flexWrap="wrap" sx={{ flexShrink: 0 }}>
          <VuiTypography variant="h5" color="white" fontWeight="bold">{T("Classroom", "Aula")}</VuiTypography>
          {WINGS.map((w) => (
            <button key={w.key} onClick={() => selectWing(w.key)} style={{
              background: wing === w.key ? "#f97316" : "rgba(255,255,255,.08)", color: wing === w.key ? "#000" : "#fff",
              border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
            }}>{w.icon} {w.label[lang] || w.label.en}</button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.08)", borderRadius: 20, padding: 3 }}>
            {["en", "es"].map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? "#f97316" : "transparent", color: lang === l ? "#000" : "rgba(255,255,255,.6)",
                border: "none", borderRadius: 18, padding: "4px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </VuiBox>

        <VuiBox display="flex" gap="14px" sx={{ flex: 1, minHeight: 0 }}>

          {/* ── Lesson list ── */}
          <VuiBox sx={{
            width: 220, flexShrink: 0, background: "rgba(255,255,255,.04)", borderRadius: "12px", padding: "12px",
            overflowY: "auto", minHeight: 0, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
          }}>
            <div style={{ color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, fontWeight: 700, marginBottom: 8, fontFamily: "Inter,sans-serif" }}>
              {wingObj.icon} {(wingObj.label[lang] || wingObj.label.en).toUpperCase()} <span style={{ color: "rgba(255,255,255,.25)" }}>· {wingObj.items.length}</span>
            </div>
            {wingObj.items.map((it) => (
              <VuiBox key={it.id} mb={1}>
                <button onClick={() => setLesson(it)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  background: lesson?.id === it.id ? "rgba(249,115,22,.14)" : "transparent",
                  border: lesson?.id === it.id ? "1px solid rgba(249,115,22,.4)" : "1px solid transparent",
                  borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}>
                  {it.coach && wing === "manager" ? <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{it.coach}</div> : null}
                  <div style={{ color: "rgba(255,255,255,.9)", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{lang === "es" ? (it.nameEs || it.name) : it.name}</div>
                  <div style={{ color: "rgba(249,115,22,.7)", fontSize: 9, marginTop: 3, fontWeight: 700 }}>📖 {(it.beats || []).length} {T("beats", "capítulos")}</div>
                </button>
              </VuiBox>
            ))}
          </VuiBox>

          {/* ── Cinema stage ── */}
          <VuiBox sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", background: "#030a06", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,215,0,.1)" }}>
            {!lesson || !curBeat ? (
              <VuiBox sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <VuiTypography variant="button" color="text">{T("Pick a lesson", "Elige una lección")}</VuiTypography>
              </VuiBox>
            ) : (
              <>
                {/* Top bar */}
                <div style={{ flex: "0 0 auto", padding: "10px 16px", background: "rgba(0,0,0,.9)", borderBottom: "1px solid rgba(255,215,0,.12)" }}>
                  <div style={{ fontSize: 9, letterSpacing: ".2em", color: "#FFD700", textTransform: "uppercase", fontFamily: "Inter,sans-serif" }}>
                    {T("THE CLASSROOM", "EL AULA")} · {(wingObj.label.en || "").toUpperCase()}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#F2EEE2", lineHeight: 1.15, fontFamily: "Inter,sans-serif" }}>
                    {lang === "es" ? (lesson.titleEs || lesson.title) : lesson.title}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {beats.map((b, i) => (
                      <button key={i} onClick={() => gotoBeat(i)} title={`${T("Beat", "Capítulo")} ${i + 1}`} style={{
                        flex: 1, height: 4, borderRadius: 2, border: "none", cursor: "pointer", padding: 0,
                        background: i === beat ? "#f97316" : i < beat ? "rgba(249,115,22,.4)" : "rgba(255,255,255,.14)",
                      }} />
                    ))}
                  </div>
                </div>

                {/* Pitch — big, dominant */}
                <div ref={pitchRef} style={{ flex: "1 1 auto", minHeight: 0, width: "100%", position: "relative", overflow: "hidden", background: "#0a5c2e" }} />

                {/* Lesson notes — a CLOSABLE tab. X collapses it (pitch grows);
                    the slim bar reopens it. Optional knowledge, not a class. */}
                {panelOpen ? (
                  <div style={{ flex: "0 0 auto", maxHeight: "40%", overflowY: "auto", background: "#000", padding: "12px 18px 12px", display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                    <button onClick={() => setPanelOpen(false)} title={T("Close notes", "Cerrar notas")} style={{
                      position: "absolute", top: 8, right: 10, width: 24, height: 24, borderRadius: 6,
                      background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.14)",
                      cursor: "pointer", fontSize: 14, fontWeight: 700, lineHeight: 1, fontFamily: "Inter,sans-serif",
                    }}>×</button>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#FFD700", letterSpacing: ".06em", textTransform: "uppercase", fontFamily: "Inter,sans-serif", paddingRight: 30 }}>
                      {lang === "es" ? (curBeat.headEs || curBeat.head) : curBeat.head}
                    </div>
                    <div style={{ fontSize: "clamp(15px,1.7vw,21px)", fontWeight: 600, color: "#F2EEE2", lineHeight: 1.5, fontFamily: "Inter,sans-serif", minHeight: 46 }}>
                      {subtitle}
                    </div>

                    {curBeat.stats && curBeat.stats.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
                        {curBeat.stats.map((s, i) => (
                          <div key={i} style={{ background: "rgba(249,115,22,.1)", border: "1px solid rgba(249,115,22,.25)", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ color: "#f97316", fontSize: 14, fontWeight: 800, fontFamily: "Inter,sans-serif" }}>{s[0]}</div>
                            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11, lineHeight: 1.35, fontFamily: "Inter,sans-serif" }}>{s[1]}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {curBeat.src && <div style={{ fontSize: 9, opacity: .4, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: "Inter,sans-serif" }}>{T("Source", "Fuente")}: {curBeat.src}</div>}
                  </div>
                ) : (
                  <button onClick={() => setPanelOpen(true)} style={{
                    flex: "0 0 auto", display: "flex", alignItems: "center", gap: 8, width: "100%",
                    background: "#000", border: "none", borderTop: "1px solid rgba(255,255,255,.06)",
                    padding: "8px 18px", cursor: "pointer", textAlign: "left", fontFamily: "Inter,sans-serif",
                  }}>
                    <span style={{ color: "#FFD700", fontSize: 11, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase" }}>
                      {lang === "es" ? (curBeat.headEs || curBeat.head) : curBeat.head}
                    </span>
                    <span style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>▸ {T("open notes", "abrir notas")}</span>
                  </button>
                )}

                {/* Controls */}
                <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(0,0,0,.85)", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <button onClick={() => gotoBeat(beat - 1)} disabled={beat === 0} style={ctlBtn(beat === 0)}>‹ {T("Prev", "Ant.")}</button>
                  <button onClick={toggleSpeak} style={{ ...ctlBtn(false), minWidth: 108, background: speaking ? "rgba(239,68,68,.18)" : "#f97316", color: speaking ? "#ef4444" : "#000", border: speaking ? "1px solid rgba(239,68,68,.4)" : "none", fontWeight: 800 }}>
                    {speaking ? "⏸ " + T("Pause", "Pausa") : (paused ? "▶ " + T("Resume", "Seguir") : "▶ " + T("Play", "Reproducir"))}
                  </button>
                  <button onClick={() => gotoBeat(beat + 1)} disabled={beat >= beats.length - 1} style={ctlBtn(beat >= beats.length - 1)}>{T("Next", "Sig.")} ›</button>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,.6)", fontSize: 11, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>
                    <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} style={{ accentColor: "#f97316" }} />
                    {T("Auto-play", "Auto")}
                  </label>
                  <div style={{ flex: 1 }} />
                  <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, fontFamily: "Inter,sans-serif" }}>{T("Beat", "Capítulo")} {beat + 1}/{beats.length}</div>
                </div>
              </>
            )}
          </VuiBox>
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

function ctlBtn(disabled) {
  return {
    background: "rgba(255,255,255,.08)", color: disabled ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.8)",
    border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "7px 14px",
    fontSize: 12, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: "Inter,sans-serif",
  };
}

export default Classroom;

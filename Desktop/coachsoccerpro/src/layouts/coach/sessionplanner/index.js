import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";

// Layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Drill data (no external API needed)
import { DRILLS } from "data/drills";

// ── Local session builder — no Claude, no API, no credits ───────────────────
const KEYWORD_CATS = [
  { keys: ["scan","heads up","head up","look before","see before","scanning"], cats: ["Scanning","Awareness"] },
  { keys: ["decision","choose","press","quick","react","read the game","think fast"], cats: ["Decision Making"] },
  { keys: ["space","position","width","wide","narrow","run","movement","bunch","spread","runs"], cats: ["Positioning"] },
  { keys: ["aware","peripheral","communicate","call","talk","voice","goalkeeper communicat"], cats: ["Awareness","Scanning"] },
  { keys: ["touch","control","technique","dribble","pass","receive","ball control","body shape"], cats: ["Technical"] },
  { keys: ["tactic","shape","offside","formation","press high","pressing","system"], cats: ["Tactical"] },
  { keys: ["goalkeeper","keeper","gk","save","distribut","communication"], cats: ["Goalkeeping"] },
  { keys: ["defend","tackle","jockey","block","1v1","mark","marking"], cats: ["Defending"] },
  { keys: ["finish","shoot","goal","striker","shot","score","attack"], cats: ["Finishing"] },
];

const THEMES = {
  "Scanning": "Scan First, Play Second",
  "Decision Making": "Decision Speed Under Pressure",
  "Positioning": "Movement Off the Ball",
  "Awareness": "Game Awareness & Communication",
  "Technical": "Technical Foundation",
  "Tactical": "Tactical Shape & Discipline",
  "Goalkeeping": "Goalkeeper Intelligence",
  "Defending": "Defending with Patience",
  "Finishing": "Clinical Finishing",
  "Warm-Up": "Activation & Competition",
};

const INSIGHTS = {
  "Scanning": "Players who scan before the ball arrives always have more time — the work happens before the touch, not after.",
  "Decision Making": "Decision-making is trained before the ball moves — the best players decide first, then execute.",
  "Positioning": "Space is created by movement off the ball. If only the ball moves, the team stands still.",
  "Awareness": "Awareness is the skill underneath every other skill. Train it and everything else improves.",
  "Technical": "The quality of the first touch determines the quality of everything that follows.",
  "Tactical": "Shape without discipline collapses under pressure. Walk it first — then add speed.",
  "Goalkeeping": "A goalkeeper who reads the game starts attacks before they happen.",
  "Defending": "Patience in defence is not passive — it is a weapon. The best defenders make attackers commit first.",
  "Finishing": "Finishers know where they are shooting before the ball arrives. The decision comes first, then the shot.",
  "Warm-Up": "Energy in the first minute sets the session. Win the warm-up, win the session.",
};

const PROGRESSIONS = {
  "Scanning": "Shrink the scanning window — coach signals later and later until it is simultaneous with the touch.",
  "Decision Making": "Add a live defender — decisions must now be made against real pressure.",
  "Positioning": "Remove the ball for one rep — movement only, then reintroduce it to confirm understanding.",
  "Awareness": "Add a second signal source — two coaches calling simultaneously, player must prioritise.",
  "Technical": "Remove the setup — player receives from a random height and direction, same technical requirement.",
  "Tactical": "Add a pressing trigger — team must recognise the trigger before shape shifts.",
  "Goalkeeping": "Add a live outfield player — GK must now read and choose, not just execute.",
  "Defending": "Add a 30-second time limit — defender must force an error or the attacker scores.",
  "Finishing": "Add a defender 5 yards behind — finisher must shoot before being closed down.",
  "Warm-Up": "Reduce to 2-touch — same exercise, higher tempo, more mistakes = more learning.",
};

const CLOSE_NOTES = {
  "Scanning": "Finish with one rep each where they name what they saw before the ball arrived — end on a win.",
  "Decision Making": "Close with a quick 2v2 where every decision must be called aloud before acting.",
  "Positioning": "End with a walk-through of the movement pattern without a ball — confirm understanding, not just execution.",
  "Awareness": "Cool down with 60 seconds of free juggling while calling the number of fingers a partner holds up.",
  "Technical": "Finish with 10 clean repetitions per player — perfect, not fast.",
  "Tactical": "Close with a team huddle — ask one player to explain the session theme in their own words.",
  "Goalkeeping": "End with 5 distribution decisions in real time — short, medium, long — two at their best range.",
  "Defending": "Close with a jockey competition — who can hold their ground the longest without diving in?",
  "Finishing": "Finish with a shooting competition from today's positions — first to 3 clean finishes wins.",
  "Warm-Up": "Close the rondo with a 2-minute final — the losing team sets up for tomorrow.",
};

function localGenerate(q, count = 6) {
  const text = (q || "").toLowerCase();

  // Score categories
  const catScores = {};
  for (const { keys, cats } of KEYWORD_CATS) {
    for (const key of keys) {
      if (text.includes(key)) {
        for (const cat of cats) catScores[cat] = (catScores[cat] || 0) + 1;
      }
    }
  }

  // Score each drill
  const scored = DRILLS.map(d => {
    let score = (catScores[d.cat] || 0) * 3;
    const dText = ((d.title || "") + " " + (d.desc || "") + " " + (d.coaching || "")).toLowerCase();
    for (const { keys } of KEYWORD_CATS) {
      for (const key of keys) {
        if (text.includes(key) && dText.includes(key)) score += 2;
      }
    }
    return { d, score };
  }).sort((a, b) => b.score - a.score);

  // Take top N — simple, no variety logic that can silently drop drills
  const picked = scored.slice(0, count).map(x => x.d);

  const topCat = Object.entries(catScores).sort((a, b) => b[1] - a[1])[0]?.[0] || picked[0]?.cat || "Technical";
  const dur = [8, 10, 12, 12, 14, 15];

  return {
    theme: THEMES[topCat] || "Session Plan",
    keyInsight: INSIGHTS[topCat] || "The best players solve the problem before it arrives.",
    drills: picked.map((d, i) => ({
      drillId: d.id,
      drill: d,
      duration: dur[i] || 12,
      focus: (d.coaching || "").split(".")[0] + ".",
      progression: PROGRESSIONS[d.cat] || "Add one defender — same exercise, real pressure.",
    })),
    closeNote: CLOSE_NOTES[topCat] || "End on a successful repetition — leave them feeling they have got it.",
  };
}

const QUICK_PROMPTS = [
  "My U10s can't keep their heads up when receiving.",
  "My team loses the ball too quickly under pressure.",
  "My strikers don't make runs before the ball is played.",
  "Players bunch together and don't use the width.",
  "My goalkeeper rarely communicates with defenders.",
  "The team doesn't press high enough or fast enough.",
  "My defenders keep diving in instead of jockeying.",
  "Players panic in 1v1 situations going forward.",
  "We can't keep the ball in a rondo for more than 5 passes.",
  "My wingers don't track back when we lose the ball.",
];

function SessionPlanner() {
  const navigate = useNavigate();
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  const generate = (prompt) => {
    const q = prompt || problem;
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSession(null);
    // Defer one tick so the loading state renders before the sync work runs
    setTimeout(() => {
      try {
        setSession(localGenerate(q));
      } catch (e) {
        setError("Couldn't build a session right now. Try again.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 0);
  };

  const catColors = {
    "Scanning": "#f97316", "Decision Making": "#60a5fa",
    "Positioning": "#a78bfa", "Awareness": "#fbbf24",
    "Technical": "#f97316", "Tactical": "#f43f5e",
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>

        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            Session Planner
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            Describe your team's problem. Get a 3-drill session in seconds.
          </VuiTypography>
        </VuiBox>

        {/* Input */}
        <VuiBox mb={2} style={{
          background: "rgba(255,255,255,.05)", borderRadius: 12, padding: 20,
        }}>
          <VuiTypography variant="caption" fontWeight="bold" color="white" mb={1} style={{ display: "block" }}>
            WHAT'S THE PROBLEM?
          </VuiTypography>
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="E.g. My U12s don't scan before receiving the ball..."
            rows={3}
            style={{
              width: "100%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
              borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14,
              fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* Quick prompts */}
          <VuiBox mt={1.5} mb={2} display="flex" flexWrap="wrap" gap="8px">
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                onClick={() => { setProblem(q); generate(q); }}
                style={{
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 20, padding: "5px 12px", color: "rgba(255,255,255,.7)",
                  fontSize: 11, cursor: "pointer", fontFamily: "Inter,sans-serif",
                }}
              >
                {q}
              </button>
            ))}
          </VuiBox>

          <VuiButton
            color="success"
            onClick={() => generate(null)}
            disabled={loading || !problem.trim()}
            style={{ minWidth: 160 }}
          >
            {loading ? "Building session..." : "Build my session"}
          </VuiButton>

          {error && (
            <VuiTypography variant="caption" style={{ color: "#ef4444", display: "block", marginTop: 8 }}>
              {error}
            </VuiTypography>
          )}
        </VuiBox>

        {/* Session output */}
        {session && (
          <VuiBox>

            {/* Theme + insight — single compact bar */}
            <VuiBox mb={1.5} style={{
              background: "rgba(249,115,22,.07)", border: "1px solid rgba(249,115,22,.2)",
              borderRadius: 10, padding: "10px 14px",
              display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap",
            }}>
              <VuiTypography variant="button" color="white" fontWeight="bold" style={{ flexShrink: 0 }}>
                {session.theme}
              </VuiTypography>
              <VuiTypography variant="caption" style={{ color: "rgba(255,255,255,.6)" }}>
                {session.keyInsight}
              </VuiTypography>
            </VuiBox>

            {/* Drills — 3-col grid: 2 rows × 3 = all 6 on screen */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}>
              {session.drills.map((item, idx) => {
                const d = item.drill;
                const col = d ? (catColors[d.cat] || "#f97316") : "#f97316";
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(`/coach/drills?drill=${item.drillId}`)}
                    style={{
                      background: "rgba(255,255,255,.05)",
                      border: `1px solid ${col}30`,
                      borderTop: `3px solid ${col}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        background: col + "22", color: col,
                        borderRadius: 20, padding: "1px 8px",
                        fontSize: 9, fontWeight: 800, fontFamily: "Inter,sans-serif",
                      }}>
                        {idx + 1} · {d?.cat || "Drill"}
                      </span>
                      <span style={{ color: "rgba(255,255,255,.35)", fontSize: 9, fontFamily: "Inter,sans-serif" }}>
                        {item.duration} min
                      </span>
                    </div>
                    <div style={{
                      color: "#fff", fontSize: 12, fontWeight: 700,
                      fontFamily: "Inter,sans-serif", lineHeight: 1.3,
                    }}>
                      {d ? d.title : item.drillId}
                    </div>
                    <div style={{
                      color: "rgba(255,255,255,.5)", fontSize: 10,
                      fontFamily: "Inter,sans-serif", lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {item.focus}
                    </div>
                    <div style={{ color: col, fontSize: 9, fontWeight: 600, fontFamily: "Inter,sans-serif", marginTop: 2 }}>
                      Watch animation →
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Close note */}
            {session.closeNote && (
              <VuiBox style={{
                background: "rgba(255,255,255,.04)", borderRadius: 12,
                padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.08)", marginTop: 8,
              }}>
                <VuiTypography variant="caption" style={{ color: "rgba(255,255,255,.5)", fontStyle: "italic" }}>
                  Close: {session.closeNote}
                </VuiTypography>
              </VuiBox>
            )}

            {/* SEND TO SM */}
            <VuiBox mt={2} style={{
              background: "rgba(249,115,22,.06)", border: "1px solid rgba(249,115,22,.15)",
              borderRadius: 12, padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            }}>
              <VuiTypography variant="caption" style={{ color: "#f97316", flex: 1 }}>
                ⚽ Want your players to train these concepts at home? 20 minutes a day, 294 training units.
              </VuiTypography>
              <button style={{
                background: "#f97316", border: "none", borderRadius: 8,
                padding: "8px 16px", color: "#000", fontWeight: 800, fontSize: 12,
                cursor: "pointer", fontFamily: "Inter,sans-serif", whiteSpace: "nowrap",
                letterSpacing: "0.04em",
              }}>
                SEND TO SM
              </button>
            </VuiBox>

            {/* Try again */}
            <VuiBox mt={2}>
              <VuiButton variant="outlined" color="light" size="small" onClick={() => { setSession(null); setProblem(""); }}>
                Plan another session
              </VuiButton>
            </VuiBox>
          </VuiBox>
        )}

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default SessionPlanner;

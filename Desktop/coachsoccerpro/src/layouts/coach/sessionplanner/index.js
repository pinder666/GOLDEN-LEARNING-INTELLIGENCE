import { useState } from "react";

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

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

const QUICK_PROMPTS = [
  "My U10s can't keep their heads up when receiving.",
  "My team loses the ball too quickly under pressure.",
  "My strikers don't make runs before the ball is played.",
  "Players bunch together and don't use the width.",
  "My goalkeeper rarely communicates with defenders.",
  "The team doesn't press high enough or fast enough.",
];

function SessionPlanner() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  const buildContext = () => {
    const drillSummaries = DRILLS.map(d =>
      `${d.id}: "${d.title}" [${d.cat}] (${d.ages.join(",")}) — ${d.desc}`
    ).join("\n");
    return drillSummaries;
  };

  const generate = async (prompt) => {
    setLoading(true);
    setError(null);
    setSession(null);
    const q = prompt || problem;
    if (!q.trim()) { setLoading(false); return; }

    const drillContext = buildContext();

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-calls": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: `You are a youth soccer coach assistant. Given a coaching problem, select 3 drills from the library and create a session plan.

Available drills (id: title [category] ages — description):
${drillContext}

Respond ONLY with valid JSON in this exact shape:
{
  "theme": "short session theme",
  "keyInsight": "one-sentence insight about why this problem occurs",
  "drills": [
    { "drillId": "drill_id", "duration": 10, "focus": "what to watch for", "progression": "how to make it harder" },
    { "drillId": "drill_id", "duration": 12, "focus": "...", "progression": "..." },
    { "drillId": "drill_id", "duration": 15, "focus": "...", "progression": "..." }
  ],
  "closeNote": "one sentence to end the session"
}`,
          messages: [{ role: "user", content: `Coaching problem: ${q}` }],
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const json = JSON.parse(text);
      // Hydrate drills
      json.drills = json.drills.map(item => ({
        ...item,
        drill: DRILLS.find(d => d.id === item.drillId) || null,
      }));
      setSession(json);
    } catch (e) {
      setError("Couldn't generate a session right now. Try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
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

            {/* Theme + insight */}
            <VuiBox mb={2} style={{
              background: "rgba(249,115,22,.07)", border: "1px solid rgba(249,115,22,.2)",
              borderRadius: 12, padding: 16,
            }}>
              <VuiTypography variant="h6" color="white" fontWeight="bold" mb={0.5}>
                {session.theme}
              </VuiTypography>
              <VuiTypography variant="body2" style={{ color: "rgba(255,255,255,.7)" }}>
                {session.keyInsight}
              </VuiTypography>
            </VuiBox>

            {/* Drills */}
            {session.drills.map((item, idx) => {
              const d = item.drill;
              const col = d ? (catColors[d.cat] || "#f97316") : "#f97316";
              return (
                <VuiBox
                  key={idx}
                  mb={1.5}
                  style={{
                    background: "rgba(255,255,255,.05)", borderRadius: 12, padding: 16,
                    borderLeft: `3px solid ${col}`,
                    display: "flex", gap: 16, alignItems: "flex-start",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: col + "22", color: col,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 14, flexShrink: 0, fontFamily: "Inter,sans-serif",
                  }}>
                    {idx + 1}
                  </div>
                  <VuiBox style={{ flex: 1 }}>
                    <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <VuiTypography variant="button" color="white" fontWeight="bold">
                        {d ? d.title : item.drillId}
                      </VuiTypography>
                      <span style={{
                        background: "rgba(255,255,255,.08)", borderRadius: 20,
                        padding: "2px 10px", fontSize: 10, color: "rgba(255,255,255,.5)",
                        fontFamily: "Inter,sans-serif",
                      }}>
                        {item.duration} min
                      </span>
                    </VuiBox>
                    {d && (
                      <VuiTypography variant="caption" color="text" style={{ display: "block", marginBottom: 6 }}>
                        {d.desc}
                      </VuiTypography>
                    )}
                    <VuiBox
                      style={{
                        background: "rgba(0,0,0,.2)", borderRadius: 8, padding: "8px 10px", marginBottom: 6,
                      }}
                    >
                      <span style={{ color: "#fbbf24", fontSize: 10, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>
                        WATCH FOR: </span>
                      <span style={{ color: "rgba(255,255,255,.8)", fontSize: 11, fontFamily: "Inter,sans-serif" }}>
                        {item.focus}
                      </span>
                    </VuiBox>
                    <VuiBox
                      style={{
                        background: "rgba(0,0,0,.15)", borderRadius: 8, padding: "8px 10px",
                      }}
                    >
                      <span style={{ color: "#60a5fa", fontSize: 10, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>
                        PROGRESSION: </span>
                      <span style={{ color: "rgba(255,255,255,.8)", fontSize: 11, fontFamily: "Inter,sans-serif" }}>
                        {item.progression}
                      </span>
                    </VuiBox>
                  </VuiBox>
                </VuiBox>
              );
            })}

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

            {/* SoccerMental link */}
            <VuiBox mt={2} style={{
              background: "rgba(249,115,22,.06)", border: "1px solid rgba(249,115,22,.15)",
              borderRadius: 12, padding: "12px 16px",
            }}>
              <VuiTypography variant="caption" style={{ color: "#f97316" }}>
                ⚽ Want your players to train these concepts at home? Send them to{" "}
                <strong>SoccerMental</strong> — 20 minutes a day, 294 training units.
              </VuiTypography>
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

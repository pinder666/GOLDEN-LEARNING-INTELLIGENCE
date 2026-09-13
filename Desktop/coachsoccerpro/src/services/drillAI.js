/**
 * AI drill builder — creation-time only. The coach describes what they want
 * to work on; Claude returns a drill in the EXACT library schema, which
 * lands on the editor pitch for the coach to tweak. Playback stays
 * zero-API forever (this is never called when a drill runs).
 */

const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

const SYSTEM = `You are a youth soccer drill designer for ages U8-U14. You output ONLY valid JSON, no markdown fences, no commentary.

The JSON schema (all fields required):
{
  "cat": one of "Scanning","Decision Making","Positioning","Awareness","Technical","Tactical","Goalkeeping","Defending","Finishing","Warm-Up",
  "ages": array from ["U8","U10","U12","U14+"],
  "dur": minutes (integer 5-20),
  "title": string, "titleEs": Spanish title (written natively, not literal translation),
  "desc": 1-2 sentence drill description, "descEs": Spanish,
  "coaching": 1-2 sentence coaching point, "coachingEs": Spanish,
  "equipment": string, "equipmentEs": Spanish,
  "parentMsg": warm 2-sentence message a coach sends parents about what their child worked on today and one thing to try at home, "parentMsgEs": Spanish,
  "players": array (3-8) of {"id": short unique string, "col": "#4ade80" for attackers, "#ef4444" for defenders, "#fbbf24" for coach/neutral, "lbl": 1-2 chars},
  "cones": array (0-10) of {"x","y","col"} using cone colors "#ef4444","#3b82f6","#f59e0b","#a855f7" or "rgba(255,255,255,.3)" for grid corners,
  "arrows": array (0-8) of {"x1","y1","x2","y2","col"} showing ball/run paths,
  "frames": array of 3-5 keyframes {"t": milliseconds starting 0 step 900, "ps": [{"id","x","y"} for EVERY player]} animating realistic drill movement.

Coordinate space: the pitch is 720x480; keep ALL x between 150-560 and y between 110-360 so pieces sit inside the pitch. Movement between frames should be small and realistic (10-60 units per step). Every player id in "players" must appear in every frame's "ps".`;

export async function generateDrill(description, lang = "en") {
  if (!API_KEY) throw new Error("no-key");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 3000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Design a drill for: ${description}\n(The coach wrote this in ${lang === "es" ? "Spanish" : "English"}.) Output the JSON only.`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`api-${response.status}`);
  const data = await response.json();
  let text = data?.content?.[0]?.text || "";
  text = text.replace(/```json|```/g, "").trim();
  const drill = JSON.parse(text);

  // Basic shape guard — a malformed drill never reaches the board
  if (!Array.isArray(drill.players) || !Array.isArray(drill.frames) || drill.frames.length < 2) {
    throw new Error("bad-shape");
  }
  drill.cones = drill.cones || [];
  drill.arrows = drill.arrows || [];
  return drill;
}

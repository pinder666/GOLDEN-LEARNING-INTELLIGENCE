/**
 * Assistant free-form fallback — only fires when the local brain (cheat
 * sheet / navigation / reminders / drill-builder) has no answer. Same
 * creation-time-only law as the drill builder: no API call is ever part
 * of a page's normal operation.
 */

const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

const SYSTEM = `You are the in-app assistant for CoachSoccerPro, a youth soccer coach's app. Be warm, brief (2-4 sentences), and practical. Answer in the same language the coach writes in (English or Spanish).

The app's features (all in the left sidebar): Dashboard (overview, birthdays, quick actions), Roster (players, Add Player with photo + birthday), Media, Calendar (events, attendance), Messages (voice-to-professional-message for parents), Badges (award 40+ badges), Pro Habits (105 real pro habits to send kids), Leaderboard (every kid always on it), Payments (requests + tracking), Drill Library (40 animated drills with coach voice, EN/ES, 'Mine' filter for the coach's own), My Drills (draw drills on a pitch board or Build with AI), Tactics Board (elite plays + own plays), Session Planner, Checkmatch (thinking game), Automation (birthday messages, payment reminders, weekly parent reports), How To Use (guides), Video Analysis (film through the app with live filming guidance, tap players to lock, penalty/duel/open modes, slow-mo walkthrough with coach voice, export video for parents), Settings.

If asked something outside the app (soccer coaching questions), answer helpfully as a knowledgeable youth soccer assistant.`;

export async function askAssistant(question, { page = "", lang = "en" } = {}) {
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
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `(Coach is currently on the "${page}" page, app language ${lang}.)\n${question}`,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`api-${response.status}`);
  const data = await response.json();
  return data?.content?.[0]?.text || "";
}

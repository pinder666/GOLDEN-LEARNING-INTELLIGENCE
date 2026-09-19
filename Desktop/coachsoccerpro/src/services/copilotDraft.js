/**
 * Copilot drafting — turns a spoken thought into a polished parent message.
 * The AI drafts; the coach approves and sends from his own WhatsApp/SMS.
 * Degrades safely: no key → returns the spoken text lightly cleaned.
 */
const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

export async function polishParentMessage(spoken, lang = "en") {
  const fallback = String(spoken || "").trim();
  if (!API_KEY) return fallback;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
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
        system:
          "You are a youth soccer coach's writing assistant. Turn the coach's rough spoken note into ONE warm, professional, concise message to a parent about their child. Keep the coach's meaning and any specifics (names, what to practise). No greeting placeholder like [Name] unless the coach named someone. Output ONLY the message text — no quotes, no preamble. " +
          (lang === "es" ? "Write in natural Spanish." : "Write in natural English."),
        messages: [{ role: "user", content: `Coach said: "${spoken}"` }],
      }),
    });
    if (!r.ok) return fallback;
    const data = await r.json();
    const text = (data?.content?.[0]?.text || "").trim();
    return text || fallback;
  } catch (e) { return fallback; }
}

// Pull a likely recipient name out of the spoken phrase, e.g.
// "message Marcus's mum ..." → "Marcus's mum". Best-effort; coach can fix.
export function guessRecipient(spoken) {
  const m = String(spoken || "").match(
    /(?:message|text|tell|whats ?app|mensaje|dile|manda(?:le)?|env[ií]a(?:le)?)\s+(?:to\s+|a\s+)?([A-Za-zÀ-ÿ'’]+(?:\s+(?:mum|mom|mother|dad|father|parent|madre|padre|mam[áa]|pap[áa]))?)/i
  );
  return m ? m[1].trim() : "";
}

export default { polishParentMessage, guessRecipient };

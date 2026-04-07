require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.get('/api/images', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query parameter required' });

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    const data = await response.json();
    if (!data.photos || data.photos.length === 0) {
      return res.status(404).json({ error: 'No photos found' });
    }
    res.json({ src: data.photos[0].src });
  } catch (err) {
    console.error('Pexels error:', err);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.post('/api/quiz', async (req, res) => {
  const { messages = [] } = req.body;

  const systemPrompt = `You are the SilkCat House dining intelligence system. You help fine dining restaurants understand their guests through elegant conversational discovery. Generate one warm intelligent concierge-style question per round to understand this guest. Base each new question on their previous answers building a picture of their perfect evening. Return only valid JSON — no other text no markdown. For questions return exactly: question string and options array of exactly 4 strings. After the 5th user response instead return: complete true, identity_title string such as The Devoted Palate or The Midnight Romantic or The Convivial Host or The Quiet Epicurean or The Grand Occasionist, identity_description string of two elegant paragraphs describing their perfect evening based on everything they revealed. Never mention AI or technology. Always sound like a knowledgeable human host.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.length > 0 ? messages : [{ role: 'user', content: 'Begin' }]
    });

    const text = response.content[0].text;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { error: 'Invalid response' };
    }
    res.json(parsed);
  } catch (err) {
    console.error('Anthropic error:', err);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

app.post('/api/briefing', async (req, res) => {
  const { reservations = [] } = req.body;
  if (!reservations.length) return res.status(400).json({ error: 'reservations array required' });

  const systemPrompt = `You are the SilkCat House intelligence system generating a pre-service briefing for restaurant staff. Write in the voice of a highly intelligent concierge briefing a world class team before service. For each guest provide: who is coming and why, what they love and what to avoid, what the server should know before approaching the table, what the sommelier should have ready, and one specific unrequested gesture that will make this guest feel known. Write with precision and warmth. Never be generic. Every sentence should feel like it was written specifically for this guest tonight. Return as clean HTML formatted for email. Generate a beautiful HTML email briefing that the GM receives at 9am. Style it with inline CSS using a black background (#0D0D0D), gold (#C9A84C) accents, white body text, Cormorant Garamond and Jost typeface references in font-family stacks. Make it feel like a luxury intelligence document, not a report.`;

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate a pre-service intelligence briefing for tonight's reservations. Date: ${today}.\n\nReservations:\n${JSON.stringify(reservations, null, 2)}`
      }]
    });
    const html = response.content[0].text;
    res.json({ subject: `SilkCat House — Tonight's Intelligence Brief — ${today}`, html });
  } catch (err) {
    console.error('Briefing error:', err);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

app.post('/api/noshow-sequence', async (req, res) => {
  const reservation = req.body;

  const systemPrompt = `You are the SilkCat House guest relations intelligence. Generate four perfectly timed pre-arrival messages that build emotional commitment to the reservation through warmth and anticipation — not reminders or warnings. Message 1: immediate after booking — warm personal welcome that makes them feel expected and the evening already beginning. Message 2: sent 72 hours before — builds anticipation, mentions something specific about their occasion, asks one question about dietary needs. Message 3: sent 24 hours before — makes the evening feel real and imminent, one tap confirm, one tap reschedule, framed as excitement not admin. Message 4: sent 4 hours before — final intimate touch, parking, what to expect, something that makes tonight feel inevitable. Each message under 160 characters for SMS version and full version for email. Language is warm, intelligent, personal — never corporate. Return valid JSON only — no markdown, no other text — with this exact structure: { "messages": [ { "timing": string, "sms_version": string, "email_version": string, "subject_line": string }, ... ] }`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate the no-show prevention sequence for this reservation:\n${JSON.stringify(reservation, null, 2)}`
      }]
    });

    const text = response.content[0].text;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { error: 'Invalid response' };
    }
    res.json(parsed);
  } catch (err) {
    console.error('No-show sequence error:', err);
    res.status(500).json({ error: 'Failed to generate sequence' });
  }
});

app.get('/api/contact', (req, res) => {
  console.log('Contact form submission:', req.query);
  res.json({ success: true, message: 'Introduction received. You will hear from us within 48 hours.' });
});

app.post('/api/contact', (req, res) => {
  console.log('Contact form submission:', req.body);
  res.json({ success: true, message: 'Introduction received. You will hear from us within 48 hours.' });
});

app.listen(PORT, () => {
  console.log(`SilkCat House server running on http://localhost:${PORT}`);
});

/**
 * REASONING SESSION ENGINE
 *
 * Three modes:
 * 1. SOLO — Child reasons WITH AI classmates, mic on
 * 2. JOINT — Both kids reason TOGETHER with AI classmates
 * 3. HARKNESS — Full simulated classroom with AI students
 *
 * The AI never gives answers. It asks "Why?" and challenges reasoning.
 * AI CLASSMATES make the child feel like they're in a real class.
 */

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic.default();

// Session types that REQUIRE voice (no typing allowed)
const VOICE_REQUIRED = new Set([
  'opening_talk',
  'reasoning_solo',
  'reasoning_joint',
  'harkness_table',
  'the_stage',
  'the_forum',
]);

// ============================================================
// AI CLASSMATES — Virtual students at the Harkness table
// ============================================================

const AI_CLASSMATES = {
  marcus: {
    name: 'Marcus',
    age: 13,
    personality: 'The Challenger',
    traits: 'Plays devil\'s advocate. Always asks "But what if the opposite is true?" Competitive but fair.',
    voice: 'confident, slightly provocative',
    thinking_style: 'contrarian',
    phrases: [
      "I'm not sure I agree with that...",
      "But what about...",
      "That's one way to look at it, but...",
      "Can you prove that?",
    ],
  },
  sophia: {
    name: 'Sophia',
    age: 12,
    personality: 'The Philosopher',
    traits: 'Connects everything to bigger ideas. Asks "Why does this matter?" Thoughtful and deep.',
    voice: 'calm, reflective',
    thinking_style: 'philosophical',
    phrases: [
      "That reminds me of something...",
      "But why does that matter?",
      "There's a bigger idea here...",
      "What would happen if everyone thought that way?",
    ],
  },
  chen: {
    name: 'Chen',
    age: 14,
    personality: 'The Scientist',
    traits: 'Wants data and evidence. Asks "How do we know?" Precise and logical.',
    voice: 'analytical, curious',
    thinking_style: 'empirical',
    phrases: [
      "Do we have evidence for that?",
      "Let's break this down step by step...",
      "The numbers say something different...",
      "That's a hypothesis, but how would we test it?",
    ],
  },
  amara: {
    name: 'Amara',
    age: 11,
    personality: 'The Clarifier',
    traits: 'Asks the "dumb" questions that are actually smart. Makes everyone explain clearly.',
    voice: 'friendly, genuinely curious',
    thinking_style: 'clarifying',
    phrases: [
      "Wait, can you explain that again?",
      "I don't get it yet...",
      "What do you mean by that word?",
      "So basically you're saying...",
    ],
  },
  raj: {
    name: 'Raj',
    age: 13,
    personality: 'The Connector',
    traits: 'Sees patterns and links between ideas. Bridges different viewpoints.',
    voice: 'enthusiastic, quick',
    thinking_style: 'associative',
    phrases: [
      "Oh! That's like when...",
      "This connects to what Sophia said earlier...",
      "I see a pattern here...",
      "Both of you are actually saying the same thing differently...",
    ],
  },
  luna: {
    name: 'Luna',
    age: 12,
    personality: 'The Creative',
    traits: 'Thinks outside the box. Proposes wild ideas. Not afraid to be wrong.',
    voice: 'playful, imaginative',
    thinking_style: 'divergent',
    phrases: [
      "What if we tried something completely different?",
      "Hear me out, this might sound crazy but...",
      "Nobody's mentioned this yet...",
      "Let's flip the question around...",
    ],
  },
};

// Wing personas — each tutor has a distinct personality
const WING_PERSONAS = {
  numbers_room: {
    name: 'The Numbers Room',
    persona: 'Patient and precise. Never moves past a wrong answer without finding where the reasoning broke. Asks "Walk me through your thinking step by step."',
    bestClassmates: ['chen', 'amara', 'marcus'], // Math benefits from precision + challenge
  },
  the_library: {
    name: 'The Library',
    persona: 'Warm and well-read. Always asks "What does the author want you to believe?" Never accepts surface-level answers.',
    bestClassmates: ['sophia', 'luna', 'amara'], // Literature benefits from philosophy + creativity
  },
  the_lab: {
    name: 'The Lab',
    persona: 'Curious and rigorous. Treats every claim as a hypothesis to test. Asks "How would we know if that\'s true?"',
    bestClassmates: ['chen', 'marcus', 'raj'], // Science benefits from evidence + challenge
  },
  the_forum: {
    name: 'The Forum',
    persona: 'The Socratic moderator. Poses hard questions, gets out of the way. "What would someone who disagrees say?"',
    bestClassmates: ['marcus', 'sophia', 'luna'], // Philosophy benefits from all perspectives
  },
  the_boardroom: {
    name: 'The Boardroom',
    persona: 'Direct and practical. Talks like a real operator. "What would actually happen if we did that?"',
    bestClassmates: ['chen', 'marcus', 'raj'], // Business benefits from evidence + patterns
  },
  the_court: {
    name: 'The Court',
    persona: 'Analytical and competitive. Uses real tennis data. "What pattern do you see in these numbers?"',
    bestClassmates: ['chen', 'raj', 'marcus'], // Sports analysis benefits from data + competition
  },
  the_workshop: {
    name: 'The Workshop',
    persona: 'Hands-on and iterative. "Okay, you built that. What breaks? What would you change?"',
    bestClassmates: ['luna', 'chen', 'amara'], // Making benefits from creativity + precision
  },
  the_studio: {
    name: 'The Studio',
    persona: 'Creative but precise. "Why did you choose that? What does it communicate?"',
    bestClassmates: ['luna', 'sophia', 'amara'], // Art benefits from creativity + meaning
  },
  tok_room: {
    name: 'Theory of Knowledge',
    persona: 'Questions everything. "How do we KNOW we know?" The hardest questions of all.',
    bestClassmates: ['sophia', 'marcus', 'chen'], // TOK needs philosophy + challenge + evidence
  },
};

/**
 * Select which AI classmates join this session
 */
function selectClassmates(wingKey, sessionType, childAge) {
  const wing = WING_PERSONAS[wingKey] || WING_PERSONAS.the_forum;
  const preferredClassmates = wing.bestClassmates || ['marcus', 'sophia', 'chen'];

  // For solo sessions: 2-3 classmates
  // For joint sessions: 1-2 classmates (the real kids already have each other)
  const count = sessionType === 'reasoning_joint' ? 2 : 3;

  // Pick classmates close to the child's age
  const allClassmates = Object.entries(AI_CLASSMATES)
    .filter(([key]) => preferredClassmates.includes(key))
    .sort((a, b) => Math.abs(a[1].age - childAge) - Math.abs(b[1].age - childAge));

  return allClassmates.slice(0, count).map(([key, classmate]) => ({
    key,
    ...classmate,
  }));
}

/**
 * Build the system prompt for a reasoning session with AI classmates
 */
function buildReasoningPrompt({ wingKey, childName, childAge, sessionType, keyConcept, globalContext, classmates }) {
  const wing = WING_PERSONAS[wingKey] || WING_PERSONAS.the_forum;

  // Build classmate descriptions
  const classmateDescriptions = classmates.map(c =>
    `- ${c.name} (${c.age}): ${c.personality}. ${c.traits} Voice: ${c.voice}. Often says things like: "${c.phrases[0]}"`
  ).join('\n');

  const basePrompt = `You are running a Harkness Table discussion in ${wing.name} at Golden Learning Intelligence.

YOUR ROLE: The Teacher/Moderator (mostly silent, guiding when needed)

THE REAL STUDENT: ${childName} (age ${childAge || 12})

AI CLASSMATES IN THIS SESSION:
${classmateDescriptions}

SESSION TYPE: ${sessionType === 'reasoning_joint' ? 'Joint session with two real students + AI classmates' : 'Solo session with one real student + AI classmates'}

${keyConcept ? `KEY CONCEPT: ${keyConcept}` : ''}
${globalContext ? `GLOBAL CONTEXT: ${globalContext}` : ''}

THE HARKNESS METHOD:
This is a round-table discussion. Everyone is equal. The teacher rarely speaks.

HOW TO RESPOND:
1. When ${childName} speaks, have 1-2 AI classmates respond BEFORE you (the teacher) say anything
2. AI classmates should CHALLENGE, ASK QUESTIONS, or BUILD ON what the real student said
3. AI classmates disagree with each other sometimes
4. Only YOU (the teacher) can ask the final "Why?" or "What would you say to that?"
5. NEVER give answers — even AI classmates don't know the "right" answer

FORMAT YOUR RESPONSES LIKE THIS:
**[Classmate Name]:** "Their response in quotes"

**[Another Classmate]:** "Their response"

**[Teacher]:** Your short question or redirect

VOICE RULES (this is spoken aloud via TTS):
- Each classmate has a distinct voice/personality
- Keep each classmate's response under 30 words
- Teacher's comments under 20 words
- Total response under 150 words
- Make it feel like a REAL classroom debate

${sessionType === 'reasoning_joint' ? `
JOINT SESSION RULES:
- Jus and Uni are BOTH in the room
- AI classmates address them by name
- Sometimes a classmate sides with Jus, sometimes with Uni
- Encourage the real kids to debate EACH OTHER
- "Uni, Marcus makes a good point. What do you think?"
` : `
SOLO SESSION RULES:
- ${childName} is the only real student
- AI classmates make ${childName} feel part of a group
- Classmates sometimes agree with ${childName}, sometimes challenge
- Never let ${childName} feel alone — they have classmates!
`}

IMPORTANT: The AI classmates are NOT yes-men. They challenge, question, and debate. A boring discussion where everyone agrees is a FAILED session.`;

  return basePrompt;
}

/**
 * Run a turn in a reasoning session with AI classmates
 */
async function runReasoningTurn({
  wingKey,
  childName,
  childAge = 12,
  sessionType,
  keyConcept,
  globalContext,
  conversationHistory,
  childInput,
}) {
  // Select appropriate AI classmates for this session
  const classmates = selectClassmates(wingKey, sessionType, childAge);

  // Try real API first, fall back to mock responses
  try {
    const systemPrompt = buildReasoningPrompt({
      wingKey,
      childName,
      childAge,
      sessionType,
      keyConcept,
      globalContext,
      classmates,
    });

    const messages = [
      ...conversationHistory,
      { role: 'user', content: `${childName} says: "${childInput}"` },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0]?.text || '';
    const shouldContinue = !text.toLowerCase().includes('summarize what you learned');

    return {
      text,
      shouldContinue,
      classmates: classmates.map(c => ({ name: c.name, personality: c.personality })),
    };
  } catch (error) {
    console.error('API error, using mock response:', error.message);

    // Generate mock Harkness discussion
    const mockResponse = generateMockResponse(childInput, classmates, childName, wingKey);

    return {
      text: mockResponse,
      shouldContinue: true,
      classmates: classmates.map(c => ({ name: c.name, personality: c.personality })),
    };
  }
}

/**
 * Generate mock Harkness responses when API unavailable
 */
function generateMockResponse(childInput, classmates, childName, wingKey) {
  const input = childInput.toLowerCase();
  const c1 = classmates[0]?.name || 'Marcus';
  const c2 = classmates[1]?.name || 'Sophia';

  // Topic-aware responses based on wing
  const wingResponses = {
    numbers_room: [
      `**[${c1}]:** "That's interesting, but can you show me the steps you used to get there?"

**[${c2}]:** "I got a different answer... let me think about why."

**[Teacher]:** "${childName}, walk us through your reasoning step by step."`,

      `**[${c1}]:** "What if we tried a different approach? Like breaking it into smaller parts?"

**[${c2}]:** "Oh! I see a pattern here..."

**[Teacher]:** "Good observation. ${childName}, what do you think about ${c2}'s pattern?"`,
    ],
    the_library: [
      `**[${c1}]:** "But what does the author actually want us to believe?"

**[${c2}]:** "I think there's a deeper meaning here. It's not just about the surface."

**[Teacher]:** "${childName}, why do you think the author chose those specific words?"`,

      `**[${c1}]:** "That's one interpretation, but couldn't it also mean...?"

**[${c2}]:** "This reminds me of something we read before."

**[Teacher]:** "Interesting connection, ${c2}. ${childName}, do you see the link?"`,
    ],
    the_forum: [
      `**[${c1}]:** "I'm not sure I agree. What's your evidence for that?"

**[${c2}]:** "There's a bigger question here about what's right and wrong."

**[Teacher]:** "${childName}, what would someone who disagrees with you say?"`,

      `**[${c1}]:** "But is that always true? Can you think of an exception?"

**[${c2}]:** "This connects to ethics... what SHOULD happen vs what DOES happen."

**[Teacher]:** "That's the heart of it. ${childName}, where do you stand?"`,
    ],
    the_lab: [
      `**[${c1}]:** "How would we test that hypothesis?"

**[${c2}]:** "We need evidence. What data would prove you right or wrong?"

**[Teacher]:** "${childName}, design an experiment to find out."`,

      `**[${c1}]:** "The data says something different though..."

**[${c2}]:** "Maybe there's a variable we're not considering?"

**[Teacher]:** "Good scientific thinking. ${childName}, what might we be missing?"`,
    ],
  };

  const responses = wingResponses[wingKey] || wingResponses.the_forum;
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generate the opening of a Harkness session
 * AI classmates introduce themselves and the topic
 */
async function generateOpeningQuestion({
  wingKey,
  keyConcept,
  globalContext,
  topic,
  childName,
  childAge = 12,
}) {
  const wing = WING_PERSONAS[wingKey] || WING_PERSONAS.the_forum;
  const classmates = selectClassmates(wingKey, 'reasoning_solo', childAge);

  const classmateNames = classmates.map(c => c.name).join(', ');

  const prompt = `You are starting a Harkness Table discussion in ${wing.name}.

The real student is ${childName} (age ${childAge}).
AI classmates present: ${classmateNames}

Topic: ${topic}
Key Concept: ${keyConcept || 'Systems'}
Global Context: ${globalContext || 'Scientific and Technical Innovation'}

Generate an opening that:
1. Welcomes ${childName} to the discussion
2. Has ONE classmate pose the opening question (not the teacher)
3. The question cannot be answered with a simple fact
4. Another classmate expresses interest/curiosity about the question

Format:
**[Teacher]:** "Brief welcome, under 15 words"

**[Classmate Name]:** "Poses the opening question"

**[Another Classmate]:** "Brief reaction to the question"

Keep it under 100 words total. Make it feel like ${childName} just walked into a classroom where something interesting is about to happen.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      text: response.content[0]?.text || generateMockOpening(childName, classmates, topic, wingKey),
      classmates: classmates.map(c => ({ name: c.name, personality: c.personality })),
    };
  } catch (error) {
    console.error('Opening question API error, using mock:', error.message);
    return {
      text: generateMockOpening(childName, classmates, topic, wingKey),
      classmates: classmates.map(c => ({ name: c.name, personality: c.personality })),
    };
  }
}

/**
 * Generate mock opening for Harkness session
 */
function generateMockOpening(childName, classmates, topic, wingKey) {
  const c1 = classmates[0]?.name || 'Marcus';
  const c2 = classmates[1]?.name || 'Sophia';

  const openings = {
    numbers_room: `**[Teacher]:** "Good morning, ${childName}. Let's think together."

**[${c1}]:** "I've been wondering... why does math even work? Like, why do the rules we made up actually describe real things?"

**[${c2}]:** "Ooh, that's a big one. I want to hear what ${childName} thinks."`,

    the_library: `**[Teacher]:** "Welcome, ${childName}. We have much to discuss."

**[${c1}]:** "I was reading something last night, and I couldn't figure out WHY the author made the main character do that. It seemed wrong."

**[${c2}]:** "Wait, wrong how? Like morally wrong, or just... unexpected?"`,

    the_forum: `**[Teacher]:** "${childName}, join us. We're debating something important."

**[${c1}]:** "Here's what I can't figure out: when is it okay to break a rule? Like, are rules always good, or just... usually?"

**[${c2}]:** "That depends on WHY the rule exists, doesn't it?"`,

    the_lab: `**[Teacher]:** "Perfect timing, ${childName}. We need your input."

**[${c1}]:** "So here's my question: how do scientists know when they're actually RIGHT? Like, what if they're just seeing what they want to see?"

**[${c2}]:** "That's literally the whole point of experiments though... right?"`,
  };

  return openings[wingKey] || openings.the_forum;
}

/**
 * Generate a classmate interjection
 * Use when the discussion needs energy or a new direction
 */
async function generateClassmateInterjection({
  wingKey,
  conversationHistory,
  childName,
  lastStatement,
}) {
  const classmates = selectClassmates(wingKey, 'reasoning_solo', 12);
  const randomClassmate = classmates[Math.floor(Math.random() * classmates.length)];

  const prompt = `You are ${randomClassmate.name}, an AI classmate in a Harkness discussion.

Your personality: ${randomClassmate.personality}
Your traits: ${randomClassmate.traits}
Your voice: ${randomClassmate.voice}

${childName} just said: "${lastStatement}"

Generate a SHORT interjection (under 25 words) that:
- Stays in character as ${randomClassmate.name}
- Either challenges, builds on, or asks for clarity about what ${childName} said
- Feels natural, like a real kid jumping into a conversation

Just give the interjection, nothing else. Speak as ${randomClassmate.name}.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 50,
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    classmate: randomClassmate.name,
    text: response.content[0]?.text || "That's interesting, but I'm not sure I agree...",
  };
}

/**
 * Transcribe audio using Deepgram
 */
async function transcribeAudio(audioBuffer, apiKey) {
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  const response = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en&punctuate=true',
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBuffer,
    }
  );

  if (!response.ok) {
    throw new Error('Transcription failed');
  }

  const data = await response.json();
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

  return transcript;
}

/**
 * Generate TTS audio for AI response using ElevenLabs
 * Different voice for each classmate
 */
async function speakResponse(text, voiceId, apiKey) {
  if (!apiKey || !voiceId) {
    return null; // Fall back to browser TTS on client
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  return await response.arrayBuffer();
}

// Voice IDs for different classmates (ElevenLabs)
const CLASSMATE_VOICES = {
  marcus: 'onwK4e9ZLuTAKqWW03F9', // Adam - confident male
  sophia: 'EXAVITQu4vr4xnSDxMaL', // Sarah - calm female
  chen: 'TxGEqnHWrfWFTfGW9XjX', // Josh - analytical male
  amara: 'XB0fDUnXU5powFXDhCwa', // Charlotte - friendly female
  raj: 'CYw3kZ02Hs0563khs1Fj', // Dave - enthusiastic male
  luna: 'jsCqWAovK2LkecY7zXl4', // Freya - playful female
  teacher: 'pNInz6obpgDQGcFmaJgB', // Antoni - authoritative
};

module.exports = {
  VOICE_REQUIRED,
  WING_PERSONAS,
  AI_CLASSMATES,
  CLASSMATE_VOICES,
  selectClassmates,
  buildReasoningPrompt,
  runReasoningTurn,
  generateOpeningQuestion,
  generateClassmateInterjection,
  transcribeAudio,
  speakResponse,
};

/**
 * GOLDEN LEARNING INTELLIGENCE — BACKEND SERVER
 *
 * TWO-LAYER DAILY FLOW:
 * 1. BASICS (15 min) — Math + ELA standards practice. Gate to elite content.
 * 2. ELITE (20+ min) — Opening talk, Harkness discussion, personalized wings.
 *
 * The basics layer keeps Bridgecrest happy. The elite layer is the real education.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const {
  buildIndividualSessionPrompt,
  buildJointSessionPrompt,
  buildScoringPrompt,
  buildChallengeDebriefPrompt,
  buildOpeningTalkPrompt,
  buildPersonalityLayer,
  buildStandardsPracticePrompt,
  callClaude,
} = require('./harkness_engine');
const { WING_AGENTS, runVoicedTurn, requiresVoice } = require('./voice_agents');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// ===============================================================
// HELPERS
// ===============================================================

async function getRapportFacts(childId) {
  const { data, error } = await supabase
    .from('child_rapport')
    .select('content')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) { console.error(error); return []; }
  return data.map(r => r.content);
}

async function getWeakStandards(childId, subject) {
  const { data, error } = await supabase
    .from('child_standard_mastery')
    .select('standard_id, mastery_level, state_standards(standard_code, description)')
    .eq('child_id', childId)
    .lt('mastery_level', 3) // below proficient
    .limit(5);
  if (error) { console.error(error); return []; }
  return data.map(d => ({
    code: d.state_standards?.standard_code,
    description: d.state_standards?.description,
    level: d.mastery_level
  }));
}

async function checkDailyReadiness(childId) {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_readiness')
    .select('*')
    .eq('child_id', childId)
    .eq('check_date', today)
    .single();
  return data;
}

async function updateDailyReadiness(childId, subject, passed) {
  const today = new Date().toISOString().split('T')[0];

  // Upsert the readiness record
  const field = subject === 'math' ? 'math_ready' : 'ela_ready';
  const { data: existing } = await supabase
    .from('daily_readiness')
    .select('*')
    .eq('child_id', childId)
    .eq('check_date', today)
    .single();

  if (existing) {
    const update = { [field]: passed };
    // Check if both are now ready
    const mathReady = subject === 'math' ? passed : existing.math_ready;
    const elaReady = subject === 'ela' ? passed : existing.ela_ready;
    if (mathReady && elaReady) {
      update.elite_unlocked = true;
      update.unlock_time = new Date().toISOString();
    }
    await supabase
      .from('daily_readiness')
      .update(update)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('daily_readiness')
      .insert({
        child_id: childId,
        check_date: today,
        [field]: passed
      });
  }
}

// ===============================================================
// LAYER 1: THE BASICS (Standards Practice)
// ===============================================================

/**
 * POST /api/basics/start
 * { childId, childName, gradeLevel, subject: 'math' | 'ela' }
 *
 * Starts a quick standards practice session. Must pass before elite unlocks.
 */
app.post('/api/basics/start', async (req, res) => {
  const { childId, childName, gradeLevel, subject } = req.body;

  try {
    const weakStandards = await getWeakStandards(childId, subject);

    const prompt = buildStandardsPracticePrompt({
      childName,
      gradeLevel,
      subject: subject === 'math' ? 'Math' : 'Reading & Writing',
      weakStandards,
      recentMistakes: [] // TODO: pull from daily_standards_practice
    });

    const reply = await callClaude(prompt, [], ANTHROPIC_API_KEY);

    res.json({
      sessionType: 'basics',
      subject,
      tutorReply: reply,
      message: `${subject === 'math' ? 'Math' : 'Reading'} basics started. Complete to unlock elite track.`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'basics session failed to start' });
  }
});

/**
 * POST /api/basics/turn
 * { childId, subject, conversationHistory, childInput }
 */
app.post('/api/basics/turn', async (req, res) => {
  const { childId, childName, gradeLevel, subject, conversationHistory, childInput } = req.body;

  try {
    const weakStandards = await getWeakStandards(childId, subject);

    const prompt = buildStandardsPracticePrompt({
      childName,
      gradeLevel,
      subject: subject === 'math' ? 'Math' : 'Reading & Writing',
      weakStandards,
      recentMistakes: []
    });

    const reply = await callClaude(prompt, [
      ...conversationHistory,
      { role: 'user', content: childInput }
    ], ANTHROPIC_API_KEY);

    // Check if session complete (look for PRACTICE_RESULT in reply)
    const resultMatch = reply.match(/PRACTICE_RESULT:\s*(\{[\s\S]*?\})/);
    if (resultMatch) {
      try {
        const result = JSON.parse(resultMatch[1]);
        if (result.ready_for_elite) {
          await updateDailyReadiness(childId, subject, true);
        }
        return res.json({
          tutorReply: reply.replace(/PRACTICE_RESULT:[\s\S]*$/, '').trim(),
          complete: true,
          result,
          eliteUnlocked: result.ready_for_elite
        });
      } catch (e) {
        // JSON parse failed, continue session
      }
    }

    res.json({ tutorReply: reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'basics turn failed' });
  }
});

/**
 * GET /api/basics/status/:childId
 * Check if child has completed basics today and can access elite track.
 */
app.get('/api/basics/status/:childId', async (req, res) => {
  const { childId } = req.params;

  try {
    const readiness = await checkDailyReadiness(childId);

    if (!readiness) {
      return res.json({
        mathReady: false,
        elaReady: false,
        eliteUnlocked: false,
        message: 'Start your morning basics to unlock the elite track.'
      });
    }

    res.json({
      mathReady: readiness.math_ready,
      elaReady: readiness.ela_ready,
      eliteUnlocked: readiness.elite_unlocked,
      unlockTime: readiness.unlock_time,
      message: readiness.elite_unlocked
        ? 'Elite track unlocked! Ready for real learning.'
        : `Complete ${!readiness.math_ready ? 'Math' : ''}${!readiness.math_ready && !readiness.ela_ready ? ' and ' : ''}${!readiness.ela_ready ? 'Reading' : ''} basics first.`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'status check failed' });
  }
});

// ===============================================================
// LAYER 2: THE ELITE TRACK (requires basics complete)
// ===============================================================

// Middleware to check elite access
async function requireEliteAccess(req, res, next) {
  const childId = req.body.childId || req.body.children?.[0]?.id;
  if (!childId) return res.status(400).json({ error: 'childId required' });

  const readiness = await checkDailyReadiness(childId);
  if (!readiness?.elite_unlocked) {
    return res.status(403).json({
      error: 'Elite track locked',
      message: 'Complete morning basics (Math + Reading) to unlock.',
      mathReady: readiness?.math_ready || false,
      elaReady: readiness?.ela_ready || false
    });
  }
  next();
}

/**
 * POST /api/opening-talk/start
 * { childId, childName }
 */
app.post('/api/opening-talk/start', requireEliteAccess, async (req, res) => {
  const { childId, childName } = req.body;

  try {
    const rapportFacts = await getRapportFacts(childId);
    const prompt = buildOpeningTalkPrompt({ childName, rapportFacts });
    const reply = await callClaude(prompt, [], ANTHROPIC_API_KEY);

    const { data: talk, error } = await supabase
      .from('opening_talks')
      .insert({ child_id: childId, question: reply })
      .select()
      .single();
    if (error) throw error;

    res.json({ talkId: talk.id, tutorReply: reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'opening talk failed to start' });
  }
});

/**
 * POST /api/session/individual/turn
 * { childId, childName, unit, gradeLevel, conversationHistory, childInput }
 */
app.post('/api/session/individual/turn', requireEliteAccess, async (req, res) => {
  const { childId, childName, unit, gradeLevel, conversationHistory, childInput } = req.body;

  try {
    const rapportFacts = await getRapportFacts(childId);
    const basePrompt = buildIndividualSessionPrompt({ childName, gradeLevel, unit });
    const personality = buildPersonalityLayer({ childName, rapportFacts });
    const reply = await callClaude(basePrompt + personality, [
      ...conversationHistory,
      { role: 'user', content: childInput },
    ], ANTHROPIC_API_KEY);
    res.json({ tutorReply: reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'individual session turn failed' });
  }
});

/**
 * POST /api/session/joint/turn
 * { children: [{id, name, gradeLevel, entryLevel}], unit, conversationHistory, childInput }
 */
app.post('/api/session/joint/turn', requireEliteAccess, async (req, res) => {
  const { children, unit, conversationHistory, childInput } = req.body;

  try {
    const prompt = buildJointSessionPrompt({ children, unit });
    const reply = await callClaude(prompt, [
      ...conversationHistory,
      { role: 'user', content: childInput },
    ], ANTHROPIC_API_KEY);
    res.json({ tutorReply: reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'joint session turn failed' });
  }
});

/**
 * POST /api/challenge/debrief
 */
app.post('/api/challenge/debrief', requireEliteAccess, async (req, res) => {
  const { childName, strand, challengeTitle, challengeBrief, selfReport, conversationHistory, childInput } = req.body;

  try {
    const prompt = buildChallengeDebriefPrompt({ childName, strand, challengeTitle, challengeBrief, selfReport });
    const reply = await callClaude(prompt, [
      ...conversationHistory,
      { role: 'user', content: childInput },
    ], ANTHROPIC_API_KEY);
    res.json({ tutorReply: reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'challenge debrief failed' });
  }
});

/**
 * POST /api/session/score
 * { sessionId, childId, transcript, childName }
 */
app.post('/api/session/score', async (req, res) => {
  const { sessionId, childId, transcript, childName } = req.body;

  try {
    const scoringPrompt = buildScoringPrompt({ transcript, childName });
    const raw = await callClaude(scoringPrompt, [], ANTHROPIC_API_KEY);
    const scores = JSON.parse(raw.replace(/```json|```/g, '').trim());

    const { error } = await supabase.from('atl_scores').insert({
      session_id: sessionId,
      child_id: childId,
      thinking_score: scores.thinking_score,
      communication_score: scores.communication_score,
      social_score: scores.social_score,
      self_management_score: scores.self_management_score,
      research_score: scores.research_score,
      notes: scores.notes,
    });
    if (error) throw error;

    res.json({ scores });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'scoring pass failed' });
  }
});

/**
 * POST /api/voice/turn
 */
app.post('/api/voice/turn', requireEliteAccess, async (req, res) => {
  const { wingKey, systemPrompt, conversationHistory, childInput, sessionType } = req.body;

  try {
    if (requiresVoice(sessionType) && !req.body.fromVoiceInput) {
      return res.status(400).json({ error: 'this session type requires voice input, not text' });
    }

    const { text, audioBuffer, agentName } = await runVoicedTurn({
      wingKey,
      systemPrompt,
      conversationHistory,
      childInput,
      apiKey: ANTHROPIC_API_KEY,
      elevenlabsKey: ELEVENLABS_API_KEY
    });

    res.json({
      text,
      agentName,
      audioBase64: audioBuffer ? Buffer.from(audioBuffer).toString('base64') : null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'voiced turn failed' });
  }
});

/**
 * GET /api/results-day/:termId
 */
app.get('/api/results-day/:termId', async (req, res) => {
  const { termId } = req.params;

  try {
    const { data, error } = await supabase
      .from('results_day_records')
      .select('*, children(name)')
      .eq('term_id', termId);
    if (error) throw error;
    res.json({ records: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'results day fetch failed' });
  }
});

// ===============================================================
// REASONING SESSIONS (Voice-based, La Rosey method)
// ===============================================================

const {
  VOICE_REQUIRED,
  runReasoningTurn,
  generateOpeningQuestion,
  transcribeAudio,
  speakResponse,
} = require('./reasoning_session');

/**
 * GET /api/schedule/:childId
 * Get today's schedule for a child
 */
app.get('/api/schedule/:childId', async (req, res) => {
  const { childId } = req.params;
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 5=Fri
  const isFriday = dayOfWeek === 5;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    return res.json({ schedule: [], message: 'Weekend — no school today.' });
  }

  // Check if basics are completed
  const readiness = await checkDailyReadiness(childId);
  const basicsComplete = readiness?.elite_unlocked || false;

  // Build schedule based on day
  const schedule = [];

  // PRE-SCHOOL: State compliance (before 10am)
  schedule.push({
    id: 'pre_math',
    block: 'PRE-SCHOOL',
    time: 'Before 10:00',
    title: 'Math Basics',
    duration: 15,
    wing: 'state_compliance',
    status: readiness?.math_ready ? 'completed' : 'available',
    voiceRequired: false,
  });
  schedule.push({
    id: 'pre_reading',
    block: 'PRE-SCHOOL',
    time: 'Before 10:00',
    title: 'Reading Basics',
    duration: 15,
    wing: 'state_compliance',
    status: readiness?.ela_ready ? 'completed' : 'available',
    voiceRequired: false,
  });

  if (isFriday) {
    // FRIDAY REVIEW DAY
    schedule.push(
      { id: 'review_recap', block: '1', time: '10:00', title: 'Week Recap', duration: 30, wing: 'the_forum', status: basicsComplete ? 'available' : 'locked', voiceRequired: true },
      { id: 'review_words', block: '2', time: '10:30', title: 'Word Bank Review', duration: 60, wing: 'the_library', status: basicsComplete ? 'available' : 'locked', voiceRequired: false },
      { id: 'review_challenge', block: '3', time: '11:30', title: 'Weekly Challenge Debrief', duration: 60, wing: 'the_forum', status: basicsComplete ? 'available' : 'locked', voiceRequired: true },
      { id: 'review_goals', block: '4', time: '13:30', title: 'Set Goals for Next Week', duration: 30, wing: 'the_forum', status: basicsComplete ? 'available' : 'locked', voiceRequired: true }
    );
  } else {
    // REGULAR DAY (Mon-Thu)
    const rotatingWings = {
      1: 'the_lab',      // Monday
      2: 'the_forum',    // Tuesday
      3: 'personal',     // Wednesday (Workshop for Jus, Court/Studio for Uni)
      4: 'the_world',    // Thursday
    };
    const todayWing = rotatingWings[dayOfWeek] || 'the_forum';

    schedule.push(
      { id: 'opening', block: '1', time: '10:00', title: 'Opening Talk', duration: 20, wing: 'the_forum', status: basicsComplete ? 'available' : 'locked', voiceRequired: true, sessionType: 'reasoning_solo' },
      { id: 'numbers', block: '2', time: '10:20', title: 'Numbers Room', duration: 40, wing: 'numbers_room', status: basicsComplete ? 'available' : 'locked', voiceRequired: true, sessionType: 'reasoning_solo' },
      { id: 'library', block: '3', time: '11:10', title: 'The Library', duration: 40, wing: 'the_library', status: basicsComplete ? 'available' : 'locked', voiceRequired: true, sessionType: 'reasoning_solo' },
      { id: 'rotating', block: '4', time: '12:30', title: todayWing.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), duration: 40, wing: todayWing, status: basicsComplete ? 'available' : 'locked', voiceRequired: true, sessionType: 'reasoning_solo' },
      { id: 'project', block: '5', time: '13:20', title: 'Project Time', duration: 40, wing: 'personal', status: basicsComplete ? 'available' : 'locked', voiceRequired: false }
    );
  }

  res.json({
    childId,
    date: today.toISOString().split('T')[0],
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
    isFriday,
    basicsComplete,
    schedule,
  });
});

/**
 * POST /api/reasoning/start
 * Start a reasoning session (voice-based)
 */
app.post('/api/reasoning/start', async (req, res) => {
  const { childId, childName, wingKey, sessionType, keyConcept, globalContext, topic } = req.body;

  try {
    // Generate opening question
    const openingQuestion = await generateOpeningQuestion({
      wingKey,
      keyConcept,
      globalContext,
      topic,
    });

    // Generate audio if ElevenLabs key exists
    let audioBase64 = null;
    if (process.env.ELEVENLABS_API_KEY) {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
      const audioBuffer = await speakResponse(openingQuestion, voiceId, process.env.ELEVENLABS_API_KEY);
      if (audioBuffer) {
        audioBase64 = Buffer.from(audioBuffer).toString('base64');
      }
    }

    res.json({
      sessionId: `reasoning_${Date.now()}`,
      openingQuestion,
      audioBase64,
      voiceRequired: VOICE_REQUIRED.has(sessionType),
      message: 'Session started. Mic is on. Speak your reasoning.',
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to start reasoning session' });
  }
});

/**
 * POST /api/reasoning/turn
 * Submit a turn in a reasoning session (transcribed speech or text)
 */
app.post('/api/reasoning/turn', async (req, res) => {
  const {
    sessionId,
    childName,
    wingKey,
    sessionType,
    keyConcept,
    globalContext,
    conversationHistory,
    childInput,
  } = req.body;

  try {
    const result = await runReasoningTurn({
      wingKey,
      childName,
      sessionType,
      keyConcept,
      globalContext,
      conversationHistory,
      childInput,
    });

    // Generate audio response
    let audioBase64 = null;
    if (process.env.ELEVENLABS_API_KEY) {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
      const audioBuffer = await speakResponse(result.text, voiceId, process.env.ELEVENLABS_API_KEY);
      if (audioBuffer) {
        audioBase64 = Buffer.from(audioBuffer).toString('base64');
      }
    }

    res.json({
      tutorResponse: result.text,
      audioBase64,
      shouldContinue: result.shouldContinue,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Reasoning turn failed' });
  }
});

/**
 * POST /api/reasoning/transcribe
 * Transcribe audio from the child's mic
 */
app.post('/api/reasoning/transcribe', async (req, res) => {
  try {
    const audioBuffer = req.body;
    const transcript = await transcribeAudio(audioBuffer, process.env.DEEPGRAM_API_KEY);
    res.json({ transcript });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Transcription failed', transcript: '' });
  }
});

/**
 * POST /api/reasoning/joint/turn
 * Joint reasoning session (both kids together)
 */
app.post('/api/reasoning/joint/turn', async (req, res) => {
  const {
    sessionId,
    children, // [{name: 'Jus'}, {name: 'Uni'}]
    wingKey,
    keyConcept,
    globalContext,
    conversationHistory,
    childInput,
    speakerName, // Who said this turn
  } = req.body;

  try {
    const childNames = children.map(c => c.name).join(' and ');
    const inputWithSpeaker = `${speakerName}: ${childInput}`;

    const result = await runReasoningTurn({
      wingKey,
      childName: childNames,
      sessionType: 'reasoning_joint',
      keyConcept,
      globalContext,
      conversationHistory,
      childInput: inputWithSpeaker,
    });

    // Generate audio response
    let audioBase64 = null;
    if (process.env.ELEVENLABS_API_KEY) {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
      const audioBuffer = await speakResponse(result.text, voiceId, process.env.ELEVENLABS_API_KEY);
      if (audioBuffer) {
        audioBase64 = Buffer.from(audioBuffer).toString('base64');
      }
    }

    res.json({
      tutorResponse: result.text,
      audioBase64,
      shouldContinue: result.shouldContinue,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Joint reasoning turn failed' });
  }
});

// ===============================================================
// TEXT-TO-SPEECH — Edge TTS (Microsoft Neural Voices)
// ===============================================================

const fs = require('fs');
const path = require('path');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

// Voice options - good natural voices for kids
const VOICE_OPTIONS = [
  { id: 'en-US-AriaNeural', name: 'Aria', gender: 'Female', style: 'Friendly teacher' },
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'Male', style: 'Calm narrator' },
  { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'Female', style: 'Warm & clear' },
  { id: 'en-US-DavisNeural', name: 'Davis', gender: 'Male', style: 'Natural speaker' },
  { id: 'en-US-SaraNeural', name: 'Sara', gender: 'Female', style: 'Young & bright' },
  { id: 'en-US-TonyNeural', name: 'Tony', gender: 'Male', style: 'Engaging tutor' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'Female', style: 'British accent' },
  { id: 'en-GB-RyanNeural', name: 'Ryan', gender: 'Male', style: 'British accent' },
];

// Get available voices
app.get('/api/tts/voices', (req, res) => {
  res.json({ voices: VOICE_OPTIONS });
});

// Generate speech — uses ElevenLabs if key is present, falls back to Edge TTS
app.post('/api/tts/speak', async (req, res) => {
  const { text, voice = 'en-US-AriaNeural' } = req.body;

  if (!text || text.length > 5000) {
    return res.status(400).json({ error: 'Text required (max 5000 chars)' });
  }

  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const elevenVoiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

  // Use ElevenLabs if API key is set
  if (elevenKey) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return res.json({ audio: base64, format: 'audio/mp3', voice: 'elevenlabs', textLength: text.length });
      }
      console.warn('ElevenLabs failed, falling back to Edge TTS');
    } catch (e) {
      console.warn('ElevenLabs error, falling back to Edge TTS:', e.message);
    }
  }

  // Fallback: Edge TTS
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const readable = tts.toStream(text);
    const chunks = [];

    for await (const chunk of readable) {
      chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);
    const base64 = audioBuffer.toString('base64');

    res.json({ audio: base64, format: 'audio/mp3', voice, textLength: text.length });
  } catch (e) {
    console.error('TTS Error:', e);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

// ===============================================================
// CURRICULUM LOADER — Open Source Content (Mathigon, Khan, etc.)
// ===============================================================

const CONTENT_SPINE = path.join(__dirname, '..', 'content-spine');

// List available topics from Mathigon
app.get('/api/curriculum/topics', (req, res) => {
  const mathigonPath = path.join(CONTENT_SPINE, 'mathigon_textbooks', 'content');

  try {
    const topics = fs.readdirSync(mathigonPath)
      .filter(f => {
        const stat = fs.statSync(path.join(mathigonPath, f));
        return stat.isDirectory() && !f.startsWith('_') && f !== 'shared';
      })
      .map(topic => {
        const contentPath = path.join(mathigonPath, topic, 'content.md');
        let title = topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        let description = '';

        if (fs.existsSync(contentPath)) {
          const content = fs.readFileSync(contentPath, 'utf-8');
          const titleMatch = content.match(/^#\s+(.+)$/m);
          const descMatch = content.match(/>\s*description:\s*(.+)$/m);
          if (titleMatch) title = titleMatch[1];
          if (descMatch) description = descMatch[1];
        }

        return { id: topic, title, description };
      });

    res.json({ source: 'mathigon', topics });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list topics' });
  }
});

// Get a specific lesson from Mathigon
app.get('/api/curriculum/lesson/:topic', (req, res) => {
  const { topic } = req.params;
  const contentPath = path.join(CONTENT_SPINE, 'mathigon_textbooks', 'content', topic, 'content.md');

  try {
    if (!fs.existsSync(contentPath)) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const raw = fs.readFileSync(contentPath, 'utf-8');
    const sections = parseMathigonContent(raw);

    // Get title from first line
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic;

    res.json({
      topic,
      title,
      sections,
      sectionCount: sections.length,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load lesson' });
  }
});

// Parse Mathigon Markdown into sections
function parseMathigonContent(markdown) {
  const sections = [];
  const lines = markdown.split('\n');

  let currentSection = null;
  let currentText = '';
  let sectionIndex = 0;

  for (const line of lines) {
    // New section header
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentSection && currentText.trim()) {
        currentSection.content = cleanMathigonText(currentText);
        if (currentSection.content.length > 30) {
          sections.push(currentSection);
        }
      }
      currentSection = {
        id: `section-${sectionIndex++}`,
        title: line.replace(/^#+\s+/, ''),
        content: '',
      };
      currentText = '';
    } else if (line.startsWith('---')) {
      // Section break - save current and start new sub-section
      if (currentSection && currentText.trim()) {
        currentSection.content = cleanMathigonText(currentText);
        if (currentSection.content.length > 30) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `section-${sectionIndex++}`,
          title: currentSection.title + ' (continued)',
          content: '',
        };
        currentText = '';
      }
    } else if (!line.startsWith('>') && !line.startsWith(':::') && !line.startsWith('    x-') && !line.startsWith('    include')) {
      // Regular text (skip directives and code blocks)
      currentText += line + '\n';
    }
  }

  // Don't forget the last section
  if (currentSection && currentText.trim()) {
    currentSection.content = cleanMathigonText(currentText);
    if (currentSection.content.length > 30) {
      sections.push(currentSection);
    }
  }

  return sections;
}

// Clean Mathigon-specific syntax for TTS
function cleanMathigonText(text) {
  return text
    .replace(/\[__([^_]+)__\]\([^)]+\)/g, '$1') // [__term__](gloss:term) -> term
    .replace(/__([^_]+)__/g, '$1') // __bold__ -> bold
    .replace(/_([^_]+)_/g, '$1') // _italic_ -> italic
    .replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g, '(answer: $1)') // [[answer|hint]] -> (answer: ...)
    .replace(/\{[^}]+\}/g, '') // {.class} -> remove
    .replace(/\*\{[^}]+\}\*/g, '') // *{span}* -> remove
    .replace(/`([^`]+)`/g, '$1') // `code` -> code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url) -> link
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .replace(/^\s*[-*]\s+/gm, '• ') // List items
    .trim();
}

// Get Khan Academy exercises for a topic
app.get('/api/curriculum/exercises/:topic', (req, res) => {
  const { topic } = req.params;
  const exercisesPath = path.join(CONTENT_SPINE, 'Khan_khan-exercises', 'exercises');

  try {
    const files = fs.readdirSync(exercisesPath)
      .filter(f => f.includes(topic.replace(/-/g, '_')) && f.endsWith('.html'))
      .slice(0, 10); // Max 10 exercises

    const exercises = files.map(f => ({
      id: f.replace('.html', ''),
      name: f.replace('.html', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }));

    res.json({ topic, exercises });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load exercises' });
  }
});

// ===============================================================
// HEALTH + START
// ===============================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'golden-learning-intelligence' });
});

app.get('/', async (req, res) => {
  const { data: children } = await supabase.from('children').select('id, name, grade_level');
  const { data: standards } = await supabase.from('state_standards').select('grade_level, subject');
  const { data: units } = await supabase.from('units').select('wing_key, title, inquiry_question');
  const { data: keyConcepts } = await supabase.from('key_concepts').select('name, tier');
  const { data: globalContexts } = await supabase.from('global_contexts').select('name');

  // Count standards per grade/subject
  const g5math = standards?.filter(s => s.grade_level === 5 && s.subject === 'math').length || 0;
  const g5ela = standards?.filter(s => s.grade_level === 5 && s.subject === 'ela').length || 0;
  const g8math = standards?.filter(s => s.grade_level === 8 && s.subject === 'math').length || 0;
  const g8ela = standards?.filter(s => s.grade_level === 8 && s.subject === 'ela').length || 0;

  // Group units by wing
  const wings = {};
  units?.forEach(u => {
    if (!wings[u.wing_key]) wings[u.wing_key] = [];
    wings[u.wing_key].push(u);
  });

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Golden Learning Intelligence</title>
      <style>
        body { font-family: Georgia, serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #fefefe; color: #222; }
        h1 { color: #b8860b; border-bottom: 3px solid #b8860b; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        h3 { color: #666; margin-top: 20px; }
        .student { background: #f9f5e8; padding: 15px; margin: 10px 0; border-left: 4px solid #b8860b; }
        .student h3 { margin: 0 0 10px 0; color: #b8860b; }
        .wing { background: #f5f5f5; padding: 12px; margin: 8px 0; border-radius: 5px; }
        .wing-title { font-weight: bold; color: #444; }
        .unit { margin: 5px 0 5px 20px; font-size: 0.95em; }
        .inquiry { color: #666; font-style: italic; font-size: 0.9em; }
        .concepts { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
        .concept { background: #e8e0d0; padding: 4px 10px; border-radius: 15px; font-size: 0.85em; }
        .context { background: #d0e0d8; padding: 4px 10px; border-radius: 15px; font-size: 0.85em; }
        .status { color: green; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f0e0; }
        .btn { display: inline-block; background: #b8860b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px; }
        .btn:hover { background: #8b6508; }
      </style>
    </head>
    <body>
      <h1>Golden Learning Intelligence</h1>
      <p class="status">System Running</p>

      <h2>Students</h2>
      ${children?.map(c => `
        <div class="student">
          <h3>${c.name}</h3>
          <p>Grade ${c.grade_level} |
          ${c.grade_level === 5 ? `${g5math} Math + ${g5ela} ELA standards` : `${g8math} Math + ${g8ela} ELA standards`}</p>
          <a class="btn" href="/api/basics/status/${c.id}">Check Status</a>
        </div>
      `).join('') || '<p>No students</p>'}

      <h2>Daily Flow</h2>
      <table>
        <tr><th>Layer</th><th>Duration</th><th>Content</th></tr>
        <tr><td><strong>1. Basics</strong></td><td>15 min</td><td>Math + ELA standards practice (gate to elite)</td></tr>
        <tr><td><strong>2. Elite Track</strong></td><td>20+ min</td><td>Harkness discussions, personalized wings</td></tr>
      </table>

      <h2>IB Key Concepts</h2>
      <p><strong>Jus (younger):</strong></p>
      <div class="concepts">
        ${keyConcepts?.filter(k => k.tier === 'younger').map(k => `<span class="concept">${k.name}</span>`).join('') || 'None'}
      </div>
      <p><strong>Uni (older):</strong></p>
      <div class="concepts">
        ${keyConcepts?.filter(k => k.tier === 'older').map(k => `<span class="concept">${k.name}</span>`).join('') || 'None'}
      </div>

      <h2>IB Global Contexts</h2>
      <div class="concepts">
        ${[...new Set(globalContexts?.map(g => g.name))].slice(0,6).map(g => `<span class="context">${g}</span>`).join('') || 'None'}
      </div>

      <h2>Elite Units (${units?.length || 0})</h2>
      ${Object.entries(wings).map(([wing, unitList]) => `
        <div class="wing">
          <div class="wing-title">${wing.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
          ${unitList.map(u => `
            <div class="unit">
              <strong>${u.title}</strong>
              <div class="inquiry">${u.inquiry_question}</div>
            </div>
          `).join('')}
        </div>
      `).join('')}

      <h2>State Standards (${standards?.length || 0})</h2>
      <table>
        <tr><th>Student</th><th>Math</th><th>ELA</th></tr>
        <tr><td>Jus (Grade 5)</td><td>${g5math} standards</td><td>${g5ela} standards</td></tr>
        <tr><td>Uni (Grade 8)</td><td>${g8math} standards</td><td>${g8ela} standards</td></tr>
      </table>
    </body>
    </html>
  `);
});

// ===============================================================
// CHESS LEAGUE — Daily games between Jus and Uni
// ===============================================================

const {
  createGame: createChessGame,
  getCurrentGame,
  makeMove,
  endGame,
  getStandings,
  getGameHistory,
  getPendingMove,
  getDailyChessStatus,
  getDailyPuzzle,
  getThinkingPrompts,
} = require('./chess_league');

/**
 * GET /api/chess/status/:playerId
 * Get chess status for dashboard (active game, standings, etc.)
 */
app.get('/api/chess/status/:playerId', async (req, res) => {
  const { playerId } = req.params;

  try {
    const status = await getDailyChessStatus(playerId);
    res.json(status);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get chess status' });
  }
});

/**
 * GET /api/chess/pending/:playerId
 * Check if it's this player's turn
 */
app.get('/api/chess/pending/:playerId', async (req, res) => {
  const { playerId } = req.params;

  try {
    const pending = await getPendingMove(playerId);
    res.json(pending);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to check pending move' });
  }
});

/**
 * POST /api/chess/game/new
 * Start a new game (alternates who plays white)
 */
app.post('/api/chess/game/new', async (req, res) => {
  const { whitePlayerId } = req.body;

  try {
    // Check if there's already an active game
    const current = await getCurrentGame();
    if (current) {
      return res.status(400).json({
        error: 'Active game exists',
        message: 'Finish the current game first!',
        game: current,
      });
    }

    const game = await createChessGame(whitePlayerId || 'jus');
    res.json({
      success: true,
      game,
      message: `New game started! ${whitePlayerId === 'jus' ? 'Jus' : 'Uni'} plays white.`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

/**
 * POST /api/chess/move
 * Make a move in the current game
 */
app.post('/api/chess/move', async (req, res) => {
  const { gameId, playerId, move } = req.body;

  try {
    const result = await makeMove(gameId, playerId, move);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Get a thinking prompt for the opponent
    const thinkingPrompt = getThinkingPrompts('middlegame');

    res.json({
      ...result,
      thinkingPromptForOpponent: thinkingPrompt,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to make move' });
  }
});

/**
 * POST /api/chess/game/end
 * End the current game with a result
 */
app.post('/api/chess/game/end', async (req, res) => {
  const { gameId, result, reason } = req.body;

  try {
    const endResult = await endGame(gameId, result, reason);
    res.json(endResult);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

/**
 * GET /api/chess/standings
 * Get current season standings
 */
app.get('/api/chess/standings', async (req, res) => {
  try {
    const standings = await getStandings();
    res.json({ standings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get standings' });
  }
});

/**
 * GET /api/chess/history
 * Get game history
 */
app.get('/api/chess/history', async (req, res) => {
  const { season } = req.query;

  try {
    const history = await getGameHistory(season ? parseInt(season) : null);
    res.json({ games: history });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

/**
 * GET /api/chess/puzzle
 * Get today's chess puzzle
 */
app.get('/api/chess/puzzle', (req, res) => {
  const puzzle = getDailyPuzzle();
  res.json({ puzzle });
});

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         GOLDEN LEARNING INTELLIGENCE                         ║
║         Backend running on port ${PORT}                          ║
╠══════════════════════════════════════════════════════════════╣
║  LAYER 1: Basics (Math + ELA) — unlock gate                  ║
║  LAYER 2: Elite Track — Harkness, Wings, Real Learning       ║
║  CHESS LEAGUE: Daily games between Jus and Uni               ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // For client-side usage
});

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Transcribe audio using OpenAI Whisper
 */
export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en'); // Will detect Spanish automatically

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.text;
};

/**
 * Enhance a coach's message to be more professional
 */
export const enhanceMessage = async (originalText, context = {}) => {
  const { coachName, teamName, language = 'en' } = context;

  const systemPrompt = language === 'es'
    ? `Eres un asistente de comunicación para entrenadores de fútbol juvenil.
       Tu trabajo es tomar mensajes informales de voz y convertirlos en comunicaciones profesionales
       pero cálidas para los padres. Mantén el mensaje corto y claro. No agregues información que
       el entrenador no mencionó. Mantén un tono positivo y profesional.`
    : `You are a communication assistant for youth soccer coaches.
       Your job is to take informal voice messages and convert them into professional
       but warm communications for parents. Keep the message short and clear. Don't add
       information the coach didn't mention. Maintain a positive, professional tone.`;

  const userPrompt = language === 'es'
    ? `El Entrenador ${coachName || ''} del equipo ${teamName || ''} dijo esto:

"${originalText}"

Convierte esto en un mensaje profesional para los padres. Mantén el mismo significado pero hazlo más pulido.`
    : `Coach ${coachName || ''} from team ${teamName || ''} said this:

"${originalText}"

Convert this into a professional message for parents. Keep the same meaning but make it more polished.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  return {
    enhanced: message.content[0].text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
};

/**
 * Generate a draft message based on a prompt
 */
export const draftMessage = async (prompt, context = {}) => {
  const { coachName, teamName, language = 'en' } = context;

  const systemPrompt = language === 'es'
    ? `Eres un asistente de comunicación para entrenadores de fútbol juvenil.
       Escribe mensajes claros, profesionales y cálidos para los padres.
       Mantén los mensajes concisos - no más de 2-3 oraciones a menos que sea necesario más.`
    : `You are a communication assistant for youth soccer coaches.
       Write clear, professional, and warm messages for parents.
       Keep messages concise - no more than 2-3 sentences unless more is needed.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: systemPrompt,
  });

  return {
    draft: message.content[0].text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
};

/**
 * Summarize a player's development over time
 */
export const summarizePlayerDevelopment = async (notes, playerName, language = 'en') => {
  const systemPrompt = language === 'es'
    ? `Eres un entrenador de fútbol juvenil experimentado. Resume las notas de desarrollo de un jugador
       en un párrafo breve y positivo que destaque el progreso y las áreas de mejora.`
    : `You are an experienced youth soccer coach. Summarize a player's development notes
       into a brief, positive paragraph highlighting progress and areas of growth.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Summarize these development notes for ${playerName}:\n\n${notes.join('\n\n')}`,
      },
    ],
    system: systemPrompt,
  });

  return {
    summary: message.content[0].text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
};

/**
 * Suggest practice drills based on areas to improve
 */
export const suggestDrills = async (areasToImprove, ageGroup, language = 'en') => {
  const systemPrompt = language === 'es'
    ? `Eres un entrenador de fútbol juvenil experimentado. Sugiere ejercicios apropiados para la edad
       que sean divertidos y efectivos. Mantén las descripciones simples y prácticas.`
    : `You are an experienced youth soccer coach. Suggest age-appropriate drills
       that are fun and effective. Keep descriptions simple and practical.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `Suggest 3 practice drills for ${ageGroup} players to improve: ${areasToImprove.join(', ')}`,
      },
    ],
    system: systemPrompt,
  });

  return {
    drills: message.content[0].text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
};

/**
 * Generate AI insight for coach dashboard
 */
export const generateCoachInsight = async (teamData, language = 'en') => {
  const { playersWithoutNotes, upcomingEvents, lowAttendanceRisk } = teamData;

  const systemPrompt = language === 'es'
    ? `Eres un asistente de entrenador de fútbol. Da una recomendación breve y accionable
       basada en los datos del equipo. Una oración máximo.`
    : `You are a soccer coach assistant. Give one brief, actionable insight
       based on team data. One sentence max.`;

  let prompt = '';
  if (playersWithoutNotes?.length > 0) {
    prompt = `${playersWithoutNotes.length} players haven't received a personal note in 2+ weeks: ${playersWithoutNotes.join(', ')}`;
  } else if (lowAttendanceRisk?.length > 0) {
    prompt = `${lowAttendanceRisk.length} players are at risk of losing their attendance streak`;
  } else if (upcomingEvents?.length > 0) {
    prompt = `Next event is ${upcomingEvents[0].title} with ${upcomingEvents[0].rsvpCount} RSVPs`;
  } else {
    prompt = 'Team is doing well. No urgent items.';
  }

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: systemPrompt,
  });

  return {
    insight: message.content[0].text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
};

export default {
  transcribeAudio,
  enhanceMessage,
  draftMessage,
  summarizePlayerDevelopment,
  suggestDrills,
  generateCoachInsight,
};

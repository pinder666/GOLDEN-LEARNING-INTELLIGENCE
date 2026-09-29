// Edge TTS - Microsoft Neural Voices (via backend)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

export interface Voice {
  id: string
  name: string
  gender: string
  style: string
}

export async function getVoices(): Promise<Voice[]> {
  try {
    const res = await fetch(`${API_URL}/api/tts/voices`)
    if (!res.ok) throw new Error('Failed to load voices')
    const data = await res.json()
    return data.voices
  } catch (e) {
    console.error('Failed to load voices:', e)
    return []
  }
}

export async function speak(text: string, voiceId: string = 'en-US-AriaNeural'): Promise<HTMLAudioElement | null> {
  try {
    const res = await fetch(`${API_URL}/api/tts/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: voiceId }),
    })

    if (!res.ok) throw new Error('TTS failed')

    const data = await res.json()
    const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
    return audio
  } catch (e) {
    console.error('TTS Error:', e)
    return null
  }
}

export function stopAll() {
  // Stop any playing audio by removing src
  const audios = document.querySelectorAll('audio')
  audios.forEach(a => {
    a.pause()
    a.currentTime = 0
  })
}

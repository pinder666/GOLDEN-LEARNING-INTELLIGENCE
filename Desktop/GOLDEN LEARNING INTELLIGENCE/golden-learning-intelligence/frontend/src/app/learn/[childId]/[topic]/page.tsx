'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Pause,
  Play,
  SkipForward,
  Home,
  CheckCircle,
  Settings,
  User,
} from 'lucide-react'
import { getVoices, speak, stopAll, Voice } from '@/lib/tts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

interface Section {
  id: string
  title: string
  content: string
}

interface Lesson {
  topic: string
  title: string
  sections: Section[]
  sectionCount: number
}

export default function LearnPage() {
  const params = useParams()
  const childId = params.childId as string
  const topic = params.topic as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // TTS state
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('en-US-AriaNeural')
  const [speaking, setSpeaking] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [showVoicePicker, setShowVoicePicker] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load voices
  useEffect(() => {
    getVoices().then(v => {
      setVoices(v)
      // Load saved voice preference
      const saved = localStorage.getItem(`voice_${childId}`)
      if (saved && v.find(voice => voice.id === saved)) {
        setSelectedVoice(saved)
      }
    })
  }, [childId])

  // Load lesson
  useEffect(() => {
    async function loadLesson() {
      try {
        const res = await fetch(`${API_URL}/api/curriculum/lesson/${topic}`)
        if (!res.ok) throw new Error('Failed to load lesson')
        const data = await res.json()
        setLesson(data)
      } catch (e) {
        setError('Could not load lesson. Make sure backend is running.')
      } finally {
        setLoading(false)
      }
    }
    loadLesson()
  }, [topic])

  // Speak current section
  const speakSection = useCallback(async () => {
    if (!lesson || !autoPlay) return

    const section = lesson.sections[currentIndex]
    if (!section) return

    const textToSpeak = `${section.title}. ${section.content}`
    setLoadingAudio(true)

    try {
      const audio = await speak(textToSpeak, selectedVoice)
      if (audio) {
        audioRef.current = audio
        audio.onplay = () => {
          setLoadingAudio(false)
          setSpeaking(true)
        }
        audio.onended = () => {
          setSpeaking(false)
          // Auto-advance
          if (autoPlay && currentIndex < lesson.sections.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 1500)
          }
        }
        audio.onerror = () => {
          setLoadingAudio(false)
          setSpeaking(false)
        }
        audio.play()
      } else {
        setLoadingAudio(false)
      }
    } catch (e) {
      setLoadingAudio(false)
    }
  }, [lesson, currentIndex, selectedVoice, autoPlay])

  // Play when section changes
  useEffect(() => {
    if (lesson && autoPlay) {
      stopPlayback()
      speakSection()
    }
    return () => stopPlayback()
  }, [currentIndex, lesson, autoPlay, speakSection])

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setSpeaking(false)
    setLoadingAudio(false)
  }

  const handlePauseResume = () => {
    if (audioRef.current) {
      if (speaking) {
        audioRef.current.pause()
        setSpeaking(false)
      } else {
        audioRef.current.play()
        setSpeaking(true)
      }
    }
  }

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId)
    localStorage.setItem(`voice_${childId}`, voiceId)
    setShowVoicePicker(false)
    // Replay current section with new voice
    if (autoPlay) {
      stopPlayback()
      setTimeout(() => speakSection(), 100)
    }
  }

  const handlePrevious = () => {
    stopPlayback()
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    stopPlayback()
    if (lesson && currentIndex < lesson.sections.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const toggleAutoPlay = () => {
    if (autoPlay) {
      stopPlayback()
    }
    setAutoPlay(!autoPlay)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading lesson...</div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
        <div className="text-red-400 text-xl mb-4">{error || 'Lesson not found'}</div>
        <Link href={`/dashboard/${childId}`}>
          <button className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl">
            Back to Dashboard
          </button>
        </Link>
      </div>
    )
  }

  const currentSection = lesson.sections[currentIndex]
  const isComplete = currentIndex >= lesson.sections.length - 1 && !speaking && !loadingAudio
  const progress = ((currentIndex + 1) / lesson.sections.length) * 100
  const currentVoice = voices.find(v => v.id === selectedVoice)

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={`/dashboard/${childId}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
            onClick={stopPlayback}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>

          <div className="text-center">
            <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
            <p className="text-sm text-gray-400">
              Section {currentIndex + 1} of {lesson.sections.length}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Voice Picker Button */}
            <button
              onClick={() => setShowVoicePicker(!showVoicePicker)}
              className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center gap-1"
              title="Change voice"
            >
              <User className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">{currentVoice?.name || 'Voice'}</span>
            </button>

            {/* Auto-play toggle */}
            <button
              onClick={toggleAutoPlay}
              className={`p-2 rounded-lg ${autoPlay ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}
              title={autoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
            >
              {autoPlay ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Voice Picker Dropdown */}
      {showVoicePicker && (
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-white font-bold mb-3">Choose a Voice</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {voices.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    voice.id === selectedVoice
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  <div className="font-bold">{voice.name}</div>
                  <div className="text-xs opacity-75">{voice.style}</div>
                  <div className="text-xs opacity-50">{voice.gender}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {isComplete ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-900 flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Lesson Complete!</h2>
              <p className="text-gray-400 mb-8">
                You finished all {lesson.sections.length} sections of {lesson.title}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentIndex(0)}
                  className="px-6 py-3 bg-gray-700 text-white font-bold rounded-xl"
                >
                  Review Again
                </button>
                <Link href={`/learn/${childId}`}>
                  <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold rounded-xl">
                    More Topics
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Section Title */}
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                {(speaking || loadingAudio) && (
                  <span className={`w-3 h-3 rounded-full ${loadingAudio ? 'bg-blue-400' : 'bg-yellow-400'} animate-pulse`} />
                )}
                {currentSection?.title}
              </h2>

              {/* Loading indicator */}
              {loadingAudio && (
                <div className="mb-4 text-blue-400 text-sm">Generating audio...</div>
              )}

              {/* Section Content */}
              <div className="bg-gray-900 rounded-2xl p-8">
                <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-line">
                  {currentSection?.content}
                </p>
              </div>

              {/* Section dots */}
              <div className="flex justify-center gap-2 mt-8 flex-wrap">
                {lesson.sections.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      stopPlayback()
                      setCurrentIndex(i)
                    }}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i === currentIndex
                        ? 'bg-yellow-400 scale-125'
                        : i < currentIndex
                        ? 'bg-green-500'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom Controls */}
      {!isComplete && (
        <footer className="bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex items-center gap-4">
              {(speaking || audioRef.current) && (
                <button
                  onClick={handlePauseResume}
                  className="p-3 bg-yellow-500 text-black rounded-full"
                >
                  {speaking ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold rounded-xl"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                stopPlayback()
                setCurrentIndex(lesson.sections.length - 1)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg"
            >
              <SkipForward className="w-5 h-5" />
              Skip
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

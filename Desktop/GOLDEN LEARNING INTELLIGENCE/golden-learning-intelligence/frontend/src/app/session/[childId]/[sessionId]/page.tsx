'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Users, Brain, Lightbulb, Zap } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

const CHILD_INFO: Record<string, { name: string; age: number }> = {
  jus: { name: 'Jus', age: 11 },
  uni: { name: 'Uni', age: 13 },
}

const CLASSMATE_COLORS: Record<string, string> = {
  Marcus: 'from-red-400 to-rose-500',
  Sophia: 'from-purple-400 to-indigo-500',
  Chen: 'from-blue-400 to-cyan-500',
  Amara: 'from-green-400 to-emerald-500',
  Raj: 'from-orange-400 to-amber-500',
  Luna: 'from-pink-400 to-fuchsia-500',
  Teacher: 'from-slate-600 to-gray-700',
}

const SESSION_META: Record<string, { title: string; topic: string; wingKey: string; keyConcept: string; globalContext: string }> = {
  opening: {
    title: 'Morning Circle',
    topic: 'Philosophy & Reflection',
    wingKey: 'the_forum',
    keyConcept: 'Identity and Purpose',
    globalContext: 'Personal and Cultural Expression',
  },
  numbers: {
    title: 'Numbers Room',
    topic: 'Mathematics & Logic',
    wingKey: 'numbers_room',
    keyConcept: 'Patterns and Systems',
    globalContext: 'Scientific and Technical Innovation',
  },
  library: {
    title: 'The Library',
    topic: 'Literature & Ideas',
    wingKey: 'the_library',
    keyConcept: 'Communication and Language',
    globalContext: 'Personal and Cultural Expression',
  },
  lab: {
    title: 'The Lab',
    topic: 'Scientific Thinking',
    wingKey: 'the_lab',
    keyConcept: 'Evidence and Inquiry',
    globalContext: 'Scientific and Technical Innovation',
  },
  world: {
    title: 'The World',
    topic: 'Languages & Cultures',
    wingKey: 'the_forum',
    keyConcept: 'Connections and Perspectives',
    globalContext: 'Globalization and Sustainability',
  },
  project: {
    title: 'The Workshop',
    topic: 'Creation & Design',
    wingKey: 'the_workshop',
    keyConcept: 'Form and Function',
    globalContext: 'Scientific and Technical Innovation',
  },
  ai: {
    title: 'AI & The Future',
    topic: 'AI Literacy & Prompting',
    wingKey: 'the_forum',
    keyConcept: 'Human and Machine Intelligence',
    globalContext: 'Scientific and Technical Innovation',
  },
  money: {
    title: 'The Money Room',
    topic: 'Finance, Wealth & Decision-Making',
    wingKey: 'the_forum',
    keyConcept: 'Assets, Compound Growth & Financial Independence',
    globalContext: 'Business and Economic Systems',
  },
  tok: {
    title: 'Theory of Knowledge',
    topic: 'How Do We Know What We Know?',
    wingKey: 'tok_room',
    keyConcept: 'Knowledge, Certainty, and the Limits of What We Can Know',
    globalContext: 'Epistemology and Critical Thinking',
  },
  law: {
    title: 'The Court Room',
    topic: 'Law, Rights & Justice',
    wingKey: 'the_forum',
    keyConcept: 'How Laws Are Made, Rights You Hold, and How Contracts Work',
    globalContext: 'Governance and Civic Life',
  },
  econ: {
    title: 'The Market',
    topic: 'Economics, Investing & Trade',
    wingKey: 'the_forum',
    keyConcept: 'Supply & Demand, Markets, and How Wealth is Created',
    globalContext: 'Business and Economic Systems',
  },
  phil: {
    title: 'The Agora',
    topic: 'Ethics & Philosophy of Mind',
    wingKey: 'tok_room',
    keyConcept: 'What is Real, What is Right, and What Makes a Good Life',
    globalContext: 'Epistemology and Critical Thinking',
  },
  body: {
    title: 'The Body Lab',
    topic: 'Human Biology, Nutrition & Sports Science',
    wingKey: 'the_lab',
    keyConcept: 'How the Body Works, What It Needs, and How to Optimize It',
    globalContext: 'Health, Wellness and Human Performance',
  },
}

interface Message {
  id: string
  speaker: string
  text: string
  isUser: boolean
}

interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
}

function parseHarknessText(text: string): Message[] {
  const messages: Message[] = []
  // Match **[Name]:** "text" or **[Name]:** text
  const pattern = /\*\*\[(.+?)\]:\*\*\s*"?([^*\n]+?)"?\s*(?=\n|$)/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    const speaker = match[1].trim()
    const content = match[2].trim().replace(/^"|"$/g, '')
    if (content) {
      messages.push({
        id: crypto.randomUUID(),
        speaker,
        text: content,
        isUser: false,
      })
    }
  }
  // Fallback: if nothing matched, show the whole text as Teacher
  if (messages.length === 0 && text.trim()) {
    messages.push({
      id: crypto.randomUUID(),
      speaker: 'Teacher',
      text: text.trim(),
      isUser: false,
    })
  }
  return messages
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const childId = params.childId as string
  const sessionId = params.sessionId as string
  const child = CHILD_INFO[childId] || { name: 'Student', age: 12 }
  const meta = SESSION_META[sessionId] || SESSION_META.opening

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeClassmates, setActiveClassmates] = useState<string[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [serverSessionId, setServerSessionId] = useState<string>('')
  const [history, setHistory] = useState<ConversationTurn[]>([])
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start the real session on mount
  useEffect(() => {
    async function startSession() {
      try {
        const res = await fetch(`${API_URL}/api/reasoning/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId,
            childName: child.name,
            childAge: child.age,
            wingKey: meta.wingKey,
            sessionType: 'reasoning_solo',
            keyConcept: meta.keyConcept,
            globalContext: meta.globalContext,
            topic: meta.topic,
          }),
        })

        if (!res.ok) throw new Error('Session start failed')
        const data = await res.json()

        setServerSessionId(data.sessionId)

        // openingQuestion is {text, classmates} from the engine
        const openingText = typeof data.openingQuestion === 'object'
          ? data.openingQuestion.text
          : data.openingQuestion

        const openingClassmates = typeof data.openingQuestion === 'object'
          ? (data.openingQuestion.classmates || []).map((c: { name: string }) => c.name)
          : []

        if (openingClassmates.length > 0) {
          setActiveClassmates(openingClassmates)
        } else {
          setActiveClassmates(['Marcus', 'Sophia', 'Chen'])
        }

        const parsed = parseHarknessText(openingText || '')
        setMessages(parsed)
        setHistory([{ role: 'assistant', content: openingText || '' }])
      } catch (e) {
        setError('Could not connect to the school server. Make sure the backend is running on port 4500.')
        // Fallback mock opening so the session isn't blank
        setActiveClassmates(['Marcus', 'Sophia', 'Chen'])
        setMessages([{
          id: '1',
          speaker: 'Teacher',
          text: `Welcome, ${child.name}. Today we're discussing ${meta.topic}.`,
          isUser: false,
        }, {
          id: '2',
          speaker: 'Marcus',
          text: "Before we start — what do you already think you know about this? And how confident are you in that?",
          isUser: false,
        }])
      } finally {
        setIsLoading(false)
      }
    }

    startSession()
  }, [])

  const animateMessages = useCallback(async (newMessages: Message[]) => {
    for (const msg of newMessages) {
      setCurrentSpeaker(msg.speaker)
      await new Promise(r => setTimeout(r, 400))
      setMessages(prev => [...prev, msg])
      await new Promise(r => setTimeout(r, 600))
    }
    setCurrentSpeaker(null)
  }, [])

  async function handleSubmit() {
    if (!inputText.trim() || isProcessing) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      speaker: child.name,
      text: inputText.trim(),
      isUser: true,
    }

    const userInput = inputText.trim()
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsProcessing(true)

    const newHistory: ConversationTurn[] = [
      ...history,
      { role: 'user', content: `${child.name} says: "${userInput}"` },
    ]

    try {
      const res = await fetch(`${API_URL}/api/reasoning/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: serverSessionId,
          childName: child.name,
          childAge: child.age,
          wingKey: meta.wingKey,
          keyConcept: meta.keyConcept,
          globalContext: meta.globalContext,
          conversationHistory: newHistory,
          childInput: userInput,
          sessionType: 'reasoning_solo',
        }),
      })

      if (!res.ok) throw new Error('Turn failed')
      const data = await res.json()

      const responseText = data.text || ''
      const parsed = parseHarknessText(responseText)

      if (data.classmates) {
        setActiveClassmates(data.classmates.map((c: { name: string }) => c.name))
      }

      setHistory([...newHistory, { role: 'assistant', content: responseText }])
      await animateMessages(parsed)
    } catch (e) {
      // Fallback if API fails mid-session
      await animateMessages([{
        id: crypto.randomUUID(),
        speaker: 'Marcus',
        text: "I want to push back on that — can you say more?",
        isUser: false,
      }, {
        id: crypto.randomUUID(),
        speaker: 'Teacher',
        text: `${child.name}, what's your strongest argument?`,
        isUser: false,
      }])
    } finally {
      setIsProcessing(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const allAtTable = [...activeClassmates, 'Teacher']

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            {['Marcus', 'Sophia', 'Chen'].map((name, i) => (
              <div
                key={name}
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${CLASSMATE_COLORS[name]} flex items-center justify-center text-white font-bold text-sm animate-pulse`}
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {name[0]}
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-sm">The classmates are gathering...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={`/dashboard/${childId}`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>

          <div className="text-center">
            <h1 className="text-lg font-bold text-white">{meta.title}</h1>
            <p className="text-xs text-slate-400">{meta.topic}</p>
          </div>

          <Link
            href="/table"
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Joint table</span>
          </Link>
        </div>
      </header>

      {/* Classmates Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4 overflow-x-auto pb-1">
          {/* This child */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold border-2 border-slate-700 shadow-lg">
              {child.name[0]}
            </div>
            <span className="text-xs text-slate-400 mt-1 font-medium">You</span>
          </div>
          <div className="h-6 w-px bg-slate-700 flex-shrink-0" />

          {/* AI Classmates */}
          {activeClassmates.map((name) => (
            <div key={name} className="flex flex-col items-center flex-shrink-0">
              <div className={`
                w-11 h-11 rounded-full bg-gradient-to-br ${CLASSMATE_COLORS[name] || 'from-gray-400 to-gray-500'}
                flex items-center justify-center text-white font-bold border-2 border-slate-700 shadow-lg
                transition-all duration-300
                ${currentSpeaker === name ? 'ring-2 ring-amber-400 scale-110' : ''}
              `}>
                {name[0]}
              </div>
              <span className="text-xs text-slate-400 mt-1">{name}</span>
            </div>
          ))}

          <div className="h-6 w-px bg-slate-700 flex-shrink-0" />

          {/* Teacher */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`
              w-11 h-11 rounded-full bg-gradient-to-br from-slate-600 to-slate-700
              flex items-center justify-center text-white border-2 border-slate-700 shadow-lg
              transition-all duration-300
              ${currentSpeaker === 'Teacher' ? 'ring-2 ring-amber-400 scale-110' : ''}
            `}>
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 mt-1">Teacher</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-950/50 border-b border-amber-800/50 px-6 py-2">
          <p className="text-xs text-amber-400 max-w-4xl mx-auto">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`
                max-w-[78%] rounded-2xl px-5 py-3 shadow-sm
                ${message.isUser
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white rounded-br-sm'
                  : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                }
              `}>
                {!message.isUser && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0
                      bg-gradient-to-br ${CLASSMATE_COLORS[message.speaker] || 'from-slate-500 to-slate-600'}
                    `}>
                      {message.speaker === 'Teacher' ? <Brain className="w-2.5 h-2.5" /> : message.speaker[0]}
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{message.speaker}</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-sm text-slate-400">
                    {currentSpeaker ? `${currentSpeaker} is thinking...` : 'Classmates are thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-900/80 backdrop-blur border-t border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What do you think?"
                rows={1}
                disabled={isProcessing}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 disabled:opacity-50"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSubmit}
                disabled={!inputText.trim() || isProcessing}
                className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-center text-slate-600 mt-2">Enter to send · The table is yours</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Brain, Lightbulb, ChevronDown } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

const CHILDREN = [
  { id: 'jus', name: 'Jus', age: 11, colors: 'from-yellow-400 to-amber-500' },
  { id: 'uni', name: 'Uni', age: 13, colors: 'from-blue-400 to-indigo-500' },
]

const CLASSMATE_COLORS: Record<string, string> = {
  Marcus: 'from-red-400 to-rose-500',
  Sophia: 'from-purple-400 to-indigo-500',
  Chen: 'from-blue-400 to-cyan-500',
  Amara: 'from-green-400 to-emerald-500',
  Raj: 'from-orange-400 to-amber-500',
  Luna: 'from-pink-400 to-fuchsia-500',
  Teacher: 'from-slate-500 to-slate-700',
}

const TOPIC_OPTIONS = [
  { label: "Today's Math", wingKey: 'numbers_room', topic: 'Mathematics & Logic', keyConcept: 'Patterns and Proof', globalContext: 'Scientific and Technical Innovation' },
  { label: 'Science & How Things Work', wingKey: 'the_lab', topic: 'Scientific Thinking', keyConcept: 'Evidence and Inquiry', globalContext: 'Scientific and Technical Innovation' },
  { label: 'Reading & Ideas', wingKey: 'the_library', topic: 'Literature & Ideas', keyConcept: 'Narrative and Meaning', globalContext: 'Personal and Cultural Expression' },
  { label: 'AI & The Future', wingKey: 'the_forum', topic: 'Artificial Intelligence and Human Thinking', keyConcept: 'Human vs Machine Intelligence', globalContext: 'Scientific and Technical Innovation' },
  { label: 'Right & Wrong', wingKey: 'the_forum', topic: 'Ethics and Decision-Making', keyConcept: 'Values and Consequences', globalContext: 'Fairness and Development' },
  { label: 'How the World Works', wingKey: 'the_forum', topic: 'History, Power, and Change', keyConcept: 'Cause and Effect', globalContext: 'Globalization and Sustainability' },
  { label: 'Money & Wealth', wingKey: 'the_forum', topic: 'Finance, Assets, and Wealth-Building', keyConcept: 'Compound Growth and Financial Independence', globalContext: 'Business and Economic Systems' },
  { label: 'Big Question of the Day', wingKey: 'the_forum', topic: 'Open Discussion', keyConcept: 'Critical Thinking', globalContext: 'Identities and Relationships' },
]

interface Message {
  id: string
  speaker: string
  text: string
  isUser: boolean
  childId?: string
}

interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
}

function parseHarknessText(text: string, childColors: Record<string, string>): Message[] {
  const messages: Message[] = []
  const pattern = /\*\*\[(.+?)\]:\*\*\s*"?([^*\n]+?)"?\s*(?=\n|$)/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    const speaker = match[1].trim()
    const content = match[2].trim().replace(/^"|"$/g, '')
    if (content) {
      messages.push({ id: crypto.randomUUID(), speaker, text: content, isUser: false })
    }
  }
  if (messages.length === 0 && text.trim()) {
    messages.push({ id: crypto.randomUUID(), speaker: 'Teacher', text: text.trim(), isUser: false })
  }
  return messages
}

export default function JointTablePage() {
  const [phase, setPhase] = useState<'pick' | 'session'>('pick')
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_OPTIONS[0])
  const [activeSpeaker, setActiveSpeaker] = useState<'jus' | 'uni'>('jus')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeClassmates, setActiveClassmates] = useState<string[]>(['Marcus', 'Sophia'])
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [serverSessionId, setServerSessionId] = useState('')
  const [history, setHistory] = useState<ConversationTurn[]>([])
  const [error, setError] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const childColors = { jus: 'from-yellow-400 to-amber-500', uni: 'from-blue-400 to-indigo-500' }

  async function startSession() {
    setIsLoading(true)
    setPhase('session')

    const topicToUse = showCustom && customTopic.trim()
      ? customTopic.trim()
      : selectedTopic.topic

    try {
      const res = await fetch(`${API_URL}/api/reasoning/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: 'joint',
          childName: 'Jus and Uni',
          childAge: 12,
          wingKey: selectedTopic.wingKey,
          sessionType: 'reasoning_joint',
          keyConcept: selectedTopic.keyConcept,
          globalContext: selectedTopic.globalContext,
          topic: topicToUse,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setServerSessionId(data.sessionId)

      const openingText = typeof data.openingQuestion === 'object'
        ? data.openingQuestion.text
        : data.openingQuestion

      const openingClassmates = typeof data.openingQuestion === 'object'
        ? (data.openingQuestion.classmates || []).map((c: { name: string }) => c.name)
        : []

      if (openingClassmates.length > 0) setActiveClassmates(openingClassmates)

      const parsed = parseHarknessText(openingText || '', childColors)
      setMessages(parsed)
      setHistory([{ role: 'assistant', content: openingText || '' }])
    } catch {
      setError('Backend not reachable — make sure port 4500 is running')
      setActiveClassmates(['Marcus', 'Sophia'])
      setMessages([{
        id: '1',
        speaker: 'Teacher',
        text: `Welcome, Jus and Uni. Today: ${topicToUse}.`,
        isUser: false,
      }, {
        id: '2',
        speaker: 'Marcus',
        text: "Before we start — who wants to go first? And what's your gut take on this?",
        isUser: false,
      }])
    } finally {
      setIsLoading(false)
    }
  }

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

    const child = CHILDREN.find(c => c.id === activeSpeaker)!
    const userMessage: Message = {
      id: crypto.randomUUID(),
      speaker: child.name,
      text: inputText.trim(),
      isUser: true,
      childId: activeSpeaker,
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
      const res = await fetch(`${API_URL}/api/reasoning/joint/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: serverSessionId,
          children: [{ name: 'Jus', age: 11 }, { name: 'Uni', age: 13 }],
          wingKey: selectedTopic.wingKey,
          keyConcept: selectedTopic.keyConcept,
          globalContext: selectedTopic.globalContext,
          conversationHistory: newHistory,
          childInput: `${child.name} says: "${userInput}"`,
          sessionType: 'reasoning_joint',
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const data = await res.json()

      const responseText = data.text || ''
      if (data.classmates) setActiveClassmates(data.classmates.map((c: { name: string }) => c.name))

      setHistory([...newHistory, { role: 'assistant', content: responseText }])
      await animateMessages(parseHarknessText(responseText, childColors))
    } catch {
      await animateMessages([{
        id: crypto.randomUUID(),
        speaker: 'Marcus',
        text: "Hold on — what did the other one think about that?",
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

  // ── PHASE 1: Topic picker ─────────────────────────────────
  if (phase === 'pick') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <header className="bg-slate-900/80 border-b border-slate-800 px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Link href="/dashboard/jus" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">The Joint Table</h1>
              <p className="text-xs text-slate-400">Jus + Uni + AI classmates</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            {/* Two kids at the table */}
            <div className="flex justify-center gap-6 mb-10">
              {CHILDREN.map(child => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${child.colors} flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-slate-700`}>
                    {child.name[0]}
                  </div>
                  <span className="text-sm text-white font-medium mt-2">{child.name}</span>
                  <span className="text-xs text-slate-400">Age {child.age}</span>
                </div>
              ))}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-600">
                  <span className="text-slate-500 text-2xl">+</span>
                </div>
                <span className="text-sm text-slate-500 mt-2">Classmates</span>
                <span className="text-xs text-slate-600">2–3 join</span>
              </div>
            </div>

            <h2 className="text-white font-semibold text-center mb-6 text-lg">What are we discussing today?</h2>

            <div className="space-y-2 mb-4">
              {TOPIC_OPTIONS.map((option, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedTopic(option); setShowCustom(false) }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                    selectedTopic === option && !showCustom
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <button
                onClick={() => setShowCustom(true)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                  showCustom
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                Something else... (type your topic)
              </button>
            </div>

            {showCustom && (
              <input
                type="text"
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                placeholder="e.g. Why do people follow leaders they disagree with?"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4 text-sm"
                autoFocus
              />
            )}

            <button
              onClick={startSession}
              disabled={showCustom && !customTopic.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-base hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              Open the table
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── PHASE 2: Live session ─────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setPhase('pick')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Change topic</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">The Joint Table</h1>
            <p className="text-xs text-slate-400">{selectedTopic.topic}</p>
          </div>
          <div className="flex gap-2">
            {CHILDREN.map(c => (
              <div key={c.id} className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.colors} flex items-center justify-center text-white text-xs font-bold`}>
                {c.name[0]}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Seats */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4 overflow-x-auto pb-1">
          {CHILDREN.map(child => (
            <div key={child.id} className="flex flex-col items-center flex-shrink-0">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${child.colors} flex items-center justify-center text-white font-bold border-2 ${activeSpeaker === child.id ? 'border-white' : 'border-slate-700'} shadow-lg`}>
                {child.name[0]}
              </div>
              <span className="text-xs text-slate-400 mt-1">{child.name}</span>
            </div>
          ))}
          <div className="h-6 w-px bg-slate-700 flex-shrink-0" />
          {activeClassmates.map(name => (
            <div key={name} className="flex flex-col items-center flex-shrink-0">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${CLASSMATE_COLORS[name] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold border-2 border-slate-700 shadow-lg transition-all ${currentSpeaker === name ? 'ring-2 ring-amber-400 scale-110' : ''}`}>
                {name[0]}
              </div>
              <span className="text-xs text-slate-400 mt-1">{name}</span>
            </div>
          ))}
          <div className="h-6 w-px bg-slate-700 flex-shrink-0" />
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white border-2 border-slate-700 transition-all ${currentSpeaker === 'Teacher' ? 'ring-2 ring-amber-400 scale-110' : ''}`}>
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 mt-1">Teacher</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-950/40 border-b border-amber-800/40 px-6 py-2">
          <p className="text-xs text-amber-400 max-w-4xl mx-auto">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-3 text-slate-400">
                <Lightbulb className="w-5 h-5 animate-pulse text-amber-400" />
                <span className="text-sm">Opening the table...</span>
              </div>
            </div>
          )}
          {messages.map((message) => {
            const isJus = message.childId === 'jus' || message.speaker === 'Jus'
            const isUni = message.childId === 'uni' || message.speaker === 'Uni'
            const isRealChild = isJus || isUni
            const childColor = isJus ? 'from-yellow-400 to-amber-500' : 'from-blue-400 to-indigo-500'

            return (
              <div key={message.id} className={`flex ${isRealChild ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[78%] rounded-2xl px-5 py-3 shadow-sm ${
                  isRealChild
                    ? `bg-gradient-to-br ${childColor} text-white rounded-br-sm`
                    : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                }`}>
                  {!isRealChild && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${CLASSMATE_COLORS[message.speaker] || 'from-slate-500 to-slate-600'}`}>
                        {message.speaker === 'Teacher' ? <Brain className="w-2.5 h-2.5" /> : message.speaker[0]}
                      </div>
                      <span className="text-xs font-semibold text-slate-400">{message.speaker}</span>
                    </div>
                  )}
                  {isRealChild && (
                    <p className="text-xs font-semibold text-white/60 mb-1">{message.speaker}</p>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            )
          })}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-sm text-slate-400">
                    {currentSpeaker ? `${currentSpeaker}...` : 'Thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input with speaker toggle */}
      <div className="bg-slate-900/80 backdrop-blur border-t border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Speaker selector */}
          <div className="flex gap-2 mb-3">
            {CHILDREN.map(child => (
              <button
                key={child.id}
                onClick={() => setActiveSpeaker(child.id as 'jus' | 'uni')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeSpeaker === child.id
                    ? `bg-gradient-to-r ${child.colors} text-black`
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${child.colors} flex items-center justify-center text-white text-xs font-bold`}>
                  {child.name[0]}
                </div>
                {child.name} is speaking
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${CHILDREN.find(c => c.id === activeSpeaker)?.name}, what do you think?`}
                rows={1}
                disabled={isProcessing || isLoading}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-slate-500 disabled:opacity-50"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSubmit}
                disabled={!inputText.trim() || isProcessing || isLoading}
                className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 text-black flex items-center justify-center disabled:opacity-40 hover:shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-center text-slate-600 mt-2">Tap the name above to switch who's speaking</p>
        </div>
      </div>
    </div>
  )
}

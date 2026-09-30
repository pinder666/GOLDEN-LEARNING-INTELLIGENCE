'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, RotateCcw, BookOpen, MessageCircle, Layers } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

const LANGUAGES = [
  { id: 'french',   label: 'French',   flag: '🇫🇷', hello: 'Bonjour', school: 'La Rosey' },
  { id: 'spanish',  label: 'Spanish',  flag: '🇪🇸', hello: 'Hola',    school: 'Eton' },
  { id: 'german',   label: 'German',   flag: '🇩🇪', hello: 'Hallo',   school: 'La Rosey' },
  { id: 'mandarin', label: 'Mandarin', flag: '🇨🇳', hello: '你好',    school: 'Global' },
  { id: 'latin',    label: 'Latin',    flag: '🏛️',   hello: 'Salve',   school: 'Eton' },
  { id: 'japanese', label: 'Japanese', flag: '🇯🇵', hello: 'こんにちは', school: 'Global' },
]

const GRAMMAR_TOPICS: Record<string, string[]> = {
  french:   ['Present tense verbs', 'Gender of nouns', 'Definite vs indefinite articles', 'Negation with ne...pas', 'Numbers 1-100'],
  spanish:  ['Present tense -ar verbs', 'Ser vs Estar', 'Definite articles el/la/los/las', 'Question words', 'Reflexive verbs'],
  german:   ['Definite articles der/die/das', 'Present tense regular verbs', 'Word order in statements', 'Plural nouns', 'Modal verbs'],
  mandarin: ['Tones (1st-4th)', 'Sentence structure SVO', 'Measure words', 'Numbers and counting', 'Question particles'],
  latin:    ['First declension nouns', 'Present tense sum', 'First conjugation verbs', 'Basic sentence structure', 'Nominative vs accusative'],
  japanese: ['Hiragana alphabet', 'Basic sentence structure', 'Desu and です', 'Numbers 1-10', 'Greetings and phrases'],
}

const LEVEL_BY_GRADE: Record<number, string> = {
  5: 'beginner', 6: 'beginner', 7: 'elementary', 8: 'elementary', 9: 'intermediate',
}

interface VocabWord { word: string; pronunciation: string; translation: string; example: string }
interface ChatMsg { role: 'user' | 'ai'; text: string }

export default function LanguagesPage() {
  const params = useParams()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 6 }
  const level = LEVEL_BY_GRADE[child.grade] || 'beginner'

  const [activeLang, setActiveLang] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar' | 'conversation'>('vocab')

  // vocab state
  const [vocab, setVocab] = useState<VocabWord[]>([])
  const [vocabLoading, setVocabLoading] = useState(false)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})

  // grammar state
  const [grammarTopic, setGrammarTopic] = useState<string>('')
  const [grammarData, setGrammarData] = useState<{ explanation: string; examples: { [k: string]: string }[]; tip: string } | null>(null)
  const [grammarLoading, setGrammarLoading] = useState(false)

  // conversation state
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // progress per language
  const [progress, setProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(`lang_${childId}`)
    if (saved) { try { setProgress(JSON.parse(saved)) } catch { /**/ } }
  }, [childId])

  function saveProgress(lang: string, add: number) {
    setProgress(prev => {
      const next = { ...prev, [lang]: (prev[lang] || 0) + add }
      localStorage.setItem(`lang_${childId}`, JSON.stringify(next))
      return next
    })
  }

  async function loadVocab() {
    if (!activeLang) return
    setVocabLoading(true)
    setFlipped({})
    try {
      const r = await fetch(`${API}/api/language/vocab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: activeLang, level, count: 10 }),
      })
      const data = await r.json()
      setVocab(data.words || [])
      saveProgress(activeLang, 1)
    } catch { setVocab([]) }
    setVocabLoading(false)
  }

  async function loadGrammar(topic: string) {
    if (!activeLang) return
    setGrammarTopic(topic)
    setGrammarLoading(true)
    setGrammarData(null)
    try {
      const r = await fetch(`${API}/api/language/grammar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: activeLang, level, topic }),
      })
      const data = await r.json()
      setGrammarData(data)
      saveProgress(activeLang, 2)
    } catch { setGrammarData(null) }
    setGrammarLoading(false)
  }

  async function sendChat() {
    if (!chatInput.trim() || !activeLang) return
    const msg = chatInput.trim()
    setChatInput('')
    const userMsg: ChatMsg = { role: 'user', text: msg }
    setChatHistory(h => [...h, userMsg])
    setChatLoading(true)
    try {
      const r = await fetch(`${API}/api/language/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: activeLang, userMessage: msg, history: chatHistory, level }),
      })
      const data = await r.json()
      setChatHistory(h => [...h, { role: 'ai', text: data.reply || 'Error' }])
      saveProgress(activeLang, 1)
    } catch { setChatHistory(h => [...h, { role: 'ai', text: 'Connection error.' }]) }
    setChatLoading(false)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  function selectLang(id: string) {
    setActiveLang(id)
    setActiveTab('vocab')
    setVocab([])
    setGrammarData(null)
    setGrammarTopic('')
    setChatHistory([])
  }

  const lang = LANGUAGES.find(l => l.id === activeLang)

  if (!activeLang) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800 px-6 py-5">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Link href={`/dashboard/${childId}`} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Languages Wing</h1>
              <p className="text-xs text-slate-500">La Rosey · Eton · Global fluency — choose your language</p>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {LANGUAGES.map(l => {
              const pts = progress[l.id] || 0
              return (
                <button
                  key={l.id}
                  onClick={() => selectLang(l.id)}
                  className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6 text-left hover:border-slate-500 hover:bg-slate-800 transition-all group"
                >
                  <div className="text-4xl mb-3">{l.flag}</div>
                  <p className="font-bold text-lg text-white">{l.label}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{l.hello}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{l.school} tradition</span>
                    {pts > 0 && <span className="text-xs text-amber-400 font-semibold">{pts} pts</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => setActiveLang(null)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-2xl">{lang?.flag}</div>
          <div>
            <h1 className="text-xl font-bold">{lang?.label}</h1>
            <p className="text-xs text-slate-500">{level} level · {child.name}</p>
          </div>
          <div className="ml-auto flex gap-1">
            {(['vocab', 'grammar', 'conversation'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* VOCAB TAB */}
        {activeTab === 'vocab' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-400" /> Vocabulary</h2>
                <p className="text-xs text-slate-500 mt-0.5">10 words · click cards to reveal translation</p>
              </div>
              <button
                onClick={loadVocab}
                disabled={vocabLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-50 transition-all"
              >
                {vocabLoading ? 'Loading...' : <><RotateCcw className="w-3.5 h-3.5" /> New words</>}
              </button>
            </div>

            {vocab.length === 0 && !vocabLoading && (
              <div className="text-center py-20 text-slate-500">
                <div className="text-4xl mb-3">{lang?.flag}</div>
                <p>Press "New words" to load your vocabulary set</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vocab.map((w, i) => (
                <div
                  key={i}
                  onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
                  className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800/60 hover:border-amber-500/50 transition-all p-4 min-h-[120px] flex flex-col justify-between"
                >
                  {!flipped[i] ? (
                    <>
                      <p className="font-bold text-lg text-white">{w.word}</p>
                      <p className="text-xs text-slate-500">{w.pronunciation}</p>
                      <p className="text-xs text-amber-400 mt-2">tap to reveal</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-amber-300">{w.translation}</p>
                      <p className="text-xs text-slate-400 mt-1 italic">{w.example}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GRAMMAR TAB */}
        {activeTab === 'grammar' && (
          <div>
            <div className="mb-6">
              <h2 className="font-bold text-white flex items-center gap-2 mb-1"><Layers className="w-4 h-4 text-amber-400" /> Grammar</h2>
              <p className="text-xs text-slate-500">Choose a topic to study</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {(GRAMMAR_TOPICS[activeLang] || []).map(topic => (
                <button
                  key={topic}
                  onClick={() => loadGrammar(topic)}
                  className={`text-left rounded-xl border p-4 transition-all text-sm font-semibold ${grammarTopic === topic ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-700 bg-slate-800/60 text-white hover:border-slate-500'}`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {grammarLoading && <p className="text-slate-400 text-center py-6">Loading explanation...</p>}

            {grammarData && !grammarLoading && (
              <div className="rounded-2xl bg-slate-800/60 border border-amber-500/30 p-6 space-y-5">
                <h3 className="font-bold text-amber-300 text-lg">{grammarTopic}</h3>
                <p className="text-slate-200 leading-relaxed">{grammarData.explanation}</p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Examples</p>
                  {grammarData.examples?.map((ex, i) => {
                    const [langText, engText] = Object.values(ex)
                    return (
                      <div key={i} className="rounded-lg bg-slate-700/40 px-4 py-2.5">
                        <p className="font-semibold text-white">{langText as string}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{engText as string}</p>
                      </div>
                    )
                  })}
                </div>

                {grammarData.tip && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                    <p className="text-xs text-amber-400 font-semibold mb-1">PRO TIP</p>
                    <p className="text-sm text-slate-200">{grammarData.tip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CONVERSATION TAB */}
        {activeTab === 'conversation' && (
          <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="mb-4">
              <h2 className="font-bold text-white flex items-center gap-2"><MessageCircle className="w-4 h-4 text-amber-400" /> Conversation</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chat in {lang?.label} — AI responds in the language first, then English</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 rounded-xl bg-slate-900/50 border border-slate-800 p-4">
              {chatHistory.length === 0 && (
                <p className="text-slate-600 text-sm text-center pt-8">Start with "{lang?.hello}!" and the AI will respond in {lang?.label}</p>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-amber-500 text-black font-semibold' : 'bg-slate-700 text-white'}`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 rounded-2xl px-4 py-2.5 text-sm text-slate-400">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder={`Say something in ${lang?.label} or English...`}
                className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="rounded-xl bg-amber-500 text-black px-4 py-3 hover:bg-amber-400 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

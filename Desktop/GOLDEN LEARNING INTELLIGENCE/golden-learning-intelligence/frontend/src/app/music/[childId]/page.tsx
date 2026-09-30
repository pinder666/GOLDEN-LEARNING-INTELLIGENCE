'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Music, BookOpen, Clock } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

const THEORY_TOPICS = [
  { id: 'notes',    title: 'Notes & the Staff',        desc: 'Reading the language of music',   abc: 'X:1\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |' },
  { id: 'rhythm',   title: 'Rhythm & Time Signatures', desc: 'The pulse behind every piece',     abc: 'X:1\nM:4/4\nL:1/4\nK:C\nc2 cd | e2 dc |' },
  { id: 'scales',   title: 'Scales & Keys',            desc: 'The building blocks of melody',    abc: 'X:1\nM:4/4\nL:1/4\nK:G\nG A B c | d e f g |' },
  { id: 'harmony',  title: 'Harmony & Chords',         desc: 'Multiple notes working together',  abc: 'X:1\nM:4/4\nL:1/4\nK:C\n[CEG] [FAC] [GBD] [CEG] |' },
  { id: 'form',     title: 'Musical Form',             desc: 'How pieces are structured',        abc: 'X:1\nM:4/4\nL:1/4\nK:C\nCDEF | GABC | CBAG | FEDC |' },
  { id: 'dynamics', title: 'Dynamics & Expression',    desc: 'The loudness and feeling of music', abc: 'X:1\nM:4/4\nL:1/4\nK:C\nCDEF | GABC |' },
]

const ERAS = [
  { id: 'baroque',       title: 'Baroque',         years: '1600–1750', composers: 'Bach, Handel, Vivaldi',   desc: 'Ornate, polyphonic, harpsichord-driven. Music as mathematical beauty.' },
  { id: 'classical',     title: 'Classical',        years: '1750–1820', composers: 'Mozart, Haydn, Beethoven', desc: 'Balance, clarity, the symphony and string quartet emerge.' },
  { id: 'romantic',      title: 'Romantic',         years: '1820–1900', composers: 'Chopin, Brahms, Wagner',  desc: 'Emotion unleashed — nationalism, program music, virtuosity.' },
  { id: '20th',          title: '20th Century',     years: '1900–1975', composers: 'Stravinsky, Debussy, Shostakovich', desc: 'Modernism fragments tonality — jazz, atonality, minimalism.' },
  { id: 'contemporary',  title: 'Contemporary',     years: '1975–now',  composers: 'Glass, Pärt, Williams',   desc: 'Film scoring, minimalism, electronics — all music converges.' },
]

interface LessonData { title: string; explanation: string; abc: string; exercises: string[]; historyNote: string }

declare global {
  interface Window { ABCJS?: { renderAbc: (el: string | HTMLElement, abc: string, options?: object) => void } }
}

export default function MusicPage() {
  const params = useParams()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 6 }

  const [activeTab, setActiveTab] = useState<'theory' | 'history' | 'listen'>('theory')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [abcjsReady, setAbcjsReady] = useState(false)
  const notationRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState<Record<string, boolean>>({})

  // Load ABCJS from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.ABCJS) { setAbcjsReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/abcjs@6.4.3/dist/abcjs-basic-min.js'
    script.onload = () => setAbcjsReady(true)
    document.head.appendChild(script)

    const saved = localStorage.getItem(`music_${childId}`)
    if (saved) { try { setProgress(JSON.parse(saved)) } catch { /**/ } }
  }, [childId])

  // Render ABC notation whenever lesson changes and abcjs is ready
  useEffect(() => {
    if (!abcjsReady || !notationRef.current || !lesson?.abc) return
    try {
      window.ABCJS?.renderAbc(notationRef.current, lesson.abc, { responsive: 'resize', add_classes: true })
    } catch { /**/ }
  }, [abcjsReady, lesson])

  async function loadLesson(topicId: string, topicTitle: string) {
    setSelectedTopic(topicId)
    setLessonLoading(true)
    setLesson(null)
    try {
      const r = await fetch(`${API}/api/music/lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicTitle, childName: child.name, grade: child.grade }),
      })
      const data = await r.json()
      setLesson(data)
      setProgress(prev => {
        const next = { ...prev, [topicId]: true }
        localStorage.setItem(`music_${childId}`, JSON.stringify(next))
        return next
      })
    } catch { setLesson({ title: topicTitle, explanation: 'Connection error.', abc: '', exercises: [], historyNote: '' }) }
    setLessonLoading(false)
  }

  const theoryDone = THEORY_TOPICS.filter(t => progress[t.id]).length
  const eraDone = ERAS.filter(e => progress[e.id]).length

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href={`/dashboard/${childId}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Music Wing</h1>
            <p className="text-xs text-slate-500">Theory · History · Notation — Eton & Royal Academy standard</p>
          </div>
          <div className="ml-auto flex gap-1">
            {(['theory', 'history', 'listen'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* THEORY TAB */}
        {activeTab === 'theory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Topic list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-violet-400" /> Theory</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{theoryDone}/{THEORY_TOPICS.length} completed</p>
                </div>
              </div>
              <div className="space-y-2">
                {THEORY_TOPICS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => loadLesson(t.id, t.title)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${selectedTopic === t.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-semibold text-sm ${selectedTopic === t.id ? 'text-violet-300' : 'text-white'}`}>{t.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                      </div>
                      {progress[t.id] && <span className="text-green-400 text-xs font-bold flex-shrink-0">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson panel */}
            <div>
              {!selectedTopic && !lessonLoading && (
                <div className="rounded-2xl border border-slate-700 bg-slate-800/40 flex flex-col items-center justify-center text-center p-10 h-full min-h-[300px]">
                  <Music className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-slate-500">Select a topic to load your lesson</p>
                </div>
              )}

              {lessonLoading && (
                <div className="rounded-2xl border border-slate-700 bg-slate-800/40 flex items-center justify-center p-10 min-h-[300px]">
                  <p className="text-slate-400">Loading lesson...</p>
                </div>
              )}

              {lesson && !lessonLoading && (
                <div className="rounded-2xl border border-violet-500/30 bg-slate-800/60 p-6 space-y-5">
                  <h3 className="font-bold text-violet-300 text-lg">{lesson.title}</h3>
                  <p className="text-slate-200 leading-relaxed text-sm">{lesson.explanation}</p>

                  {/* ABC Notation */}
                  {(lesson.abc || THEORY_TOPICS.find(t => t.id === selectedTopic)?.abc) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notation</p>
                      <div className="rounded-lg bg-white p-3">
                        <div ref={notationRef} />
                        {!abcjsReady && (
                          <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">
                            {lesson.abc || THEORY_TOPICS.find(t => t.id === selectedTopic)?.abc}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {lesson.exercises?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Exercises</p>
                      <ul className="space-y-1">
                        {lesson.exercises.map((ex, i) => (
                          <li key={i} className="text-sm text-slate-300 flex gap-2">
                            <span className="text-violet-400 font-bold flex-shrink-0">{i + 1}.</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lesson.historyNote && (
                    <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-4 py-3">
                      <p className="text-xs text-violet-400 font-semibold mb-1">HISTORY NOTE</p>
                      <p className="text-sm text-slate-200">{lesson.historyNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            <div className="mb-6">
              <h2 className="font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-violet-400" /> Music History</h2>
              <p className="text-xs text-slate-500 mt-0.5">{eraDone}/{ERAS.length} eras studied</p>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
              <div className="space-y-6 pl-12">
                {ERAS.map((era, i) => (
                  <div key={era.id} className="relative">
                    <div className={`absolute -left-8 w-4 h-4 rounded-full border-2 ${progress[era.id] ? 'bg-violet-500 border-violet-500' : 'bg-slate-900 border-slate-600'}`} />
                    <button
                      onClick={() => loadLesson(era.id, `${era.title} period (${era.years}): ${era.desc}`)}
                      className={`w-full text-left rounded-xl border p-5 transition-all ${selectedTopic === era.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-white">{era.title}</p>
                            <span className="text-xs text-slate-500 font-mono">{era.years}</span>
                          </div>
                          <p className="text-sm text-slate-400">{era.desc}</p>
                          <p className="text-xs text-violet-400 mt-1">{era.composers}</p>
                        </div>
                        {progress[era.id] && <span className="text-green-400 text-sm font-bold">✓</span>}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Lesson popup when era selected */}
            {(lesson || lessonLoading) && (
              <div className="mt-8 rounded-2xl border border-violet-500/30 bg-slate-800/60 p-6 space-y-4">
                {lessonLoading ? (
                  <p className="text-slate-400">Loading era deep-dive...</p>
                ) : lesson ? (
                  <>
                    <h3 className="font-bold text-violet-300 text-lg">{lesson.title}</h3>
                    <p className="text-slate-200 leading-relaxed text-sm">{lesson.explanation}</p>
                    {lesson.exercises?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Listen & Think</p>
                        <ul className="space-y-1">
                          {lesson.exercises.map((ex, i) => (
                            <li key={i} className="text-sm text-slate-300 flex gap-2">
                              <span className="text-violet-400 font-bold flex-shrink-0">{i + 1}.</span>
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* LISTEN TAB */}
        {activeTab === 'listen' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-bold text-white text-xl mb-2">Listening Room</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Spotify + YouTube Music open source playlists by era — Bach to Beethoven to Bowie.
              Coming next: curated playlists per theory topic.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto mt-8">
              {[
                { label: 'IMSLP', desc: 'Free classical scores', href: 'https://imslp.org' },
                { label: 'Musescore', desc: 'Free sheet music', href: 'https://musescore.com/sheetmusic' },
                { label: 'Open Music Library', desc: 'Academic music texts', href: 'https://openmusic.library.ucla.edu' },
                { label: 'Musopen', desc: 'Free recordings', href: 'https://musopen.org' },
                { label: 'BBC Music Guides', desc: 'Era introductions', href: 'https://www.bbc.co.uk/music' },
                { label: 'Classical Archives', desc: 'MIDI & scores', href: 'https://www.classicalarchives.com' },
              ].map(r => (
                <a
                  key={r.label}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-left hover:border-violet-500/50 transition-all"
                >
                  <p className="font-bold text-white text-sm">{r.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

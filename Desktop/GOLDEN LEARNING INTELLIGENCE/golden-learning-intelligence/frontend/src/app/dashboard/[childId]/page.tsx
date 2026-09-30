'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calculator, BookOpen, FlaskConical, Cpu, DollarSign, Scale, Heart, Code2,
  CheckCircle2, Clock,
  Crown, Swords, Users, Zap, ArrowRight, Puzzle,
} from 'lucide-react'

const CHILD_INFO: Record<string, { name: string; age: number; grade: number; color: string }> = {
  jus: { name: 'Jus', age: 11, grade: 5, color: 'from-yellow-400 to-amber-500' },
  uni: { name: 'Uni', age: 13, grade: 8, color: 'from-blue-400 to-indigo-500' },
}

const CLASSMATES = [
  { name: 'Marcus', color: 'from-red-400 to-rose-500' },
  { name: 'Sophia', color: 'from-purple-400 to-indigo-500' },
  { name: 'Chen', color: 'from-blue-400 to-cyan-500' },
  { name: 'Amara', color: 'from-green-400 to-emerald-500' },
  { name: 'Raj', color: 'from-orange-400 to-amber-500' },
  { name: 'Luna', color: 'from-pink-400 to-fuchsia-500' },
]

const MORNING_BLOCKS = [
  {
    id: 'math',
    label: 'Math',
    desc: 'Problem-solving & reasoning',
    icon: Calculator,
    color: 'from-blue-500 to-cyan-500',
    minutes: 20,
  },
  {
    id: 'reading',
    label: 'Reading & Writing',
    desc: 'Comprehension & expression',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-500',
    minutes: 20,
  },
  {
    id: 'science',
    label: 'Science',
    desc: 'Concepts & inquiry',
    icon: FlaskConical,
    color: 'from-green-500 to-emerald-500',
    minutes: 20,
  },
  {
    id: 'ai',
    label: 'AI Literacy',
    desc: 'Prompting & verification',
    icon: Cpu,
    color: 'from-purple-500 to-violet-500',
    minutes: 20,
  },
  {
    id: 'finance',
    label: 'Finance',
    desc: 'Money, decisions & wealth',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-500',
    minutes: 20,
  },
  {
    id: 'law',
    label: 'Law & Rights',
    desc: 'Justice, contracts & your rights',
    icon: Scale,
    color: 'from-slate-500 to-zinc-600',
    minutes: 20,
  },
  {
    id: 'health',
    label: 'Health & Body',
    desc: 'Your body, food & sports science',
    icon: Heart,
    color: 'from-red-500 to-rose-500',
    minutes: 20,
  },
]

const HARKNESS_SESSIONS = [
  { id: 'numbers', title: 'Numbers Room', desc: 'Math & Logic', color: 'from-blue-500 to-cyan-500' },
  { id: 'library', title: 'The Library', desc: 'Literature & Ideas', color: 'from-amber-500 to-orange-500' },
  { id: 'lab', title: 'The Lab', desc: 'Scientific Thinking', color: 'from-green-500 to-emerald-500' },
  { id: 'opening', title: 'Open Forum', desc: 'Philosophy & Debate', color: 'from-purple-500 to-indigo-500' },
  { id: 'ai', title: 'AI & The Future', desc: 'Machines & Minds', color: 'from-violet-500 to-fuchsia-500' },
  { id: 'money', title: 'The Money Room', desc: 'Finance & Wealth', color: 'from-emerald-500 to-teal-500' },
  { id: 'tok', title: 'Theory of Knowledge', desc: 'How do we know what we know?', color: 'from-rose-500 to-pink-600' },
  { id: 'law', title: 'The Court Room', desc: 'Law, Rights & Justice', color: 'from-slate-500 to-zinc-600' },
  { id: 'econ', title: 'The Market', desc: 'Economics, Investing & Trade', color: 'from-cyan-500 to-sky-600' },
  { id: 'phil', title: 'The Agora', desc: 'Ethics & Philosophy of Mind', color: 'from-rose-400 to-pink-500' },
  { id: 'body', title: 'The Body Lab', desc: 'Anatomy, Nutrition & Sports Science', color: 'from-red-500 to-rose-500' },
]

function todayKey(childId: string) {
  const d = new Date()
  return `daily_${childId}_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function greet(name: string) {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}`
  if (h < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

export default function DashboardPage() {
  const params = useParams()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', age: 12, grade: 6, color: 'from-yellow-400 to-amber-500' }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = days[new Date().getDay()]

  // Daily progress: { math: false, reading: false, science: false, ai: false }
  const [progress, setProgress] = useState<Record<string, boolean>>({
    math: false, reading: false, science: false, ai: false, finance: false, law: false, health: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = todayKey(childId)
    const saved = localStorage.getItem(key)
    if (saved) {
      try { setProgress(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [childId])

  const allDone = MORNING_BLOCKS.every(b => progress[b.id])
  const completedCount = MORNING_BLOCKS.filter(b => progress[b.id]).length

  // First incomplete block is the active one
  const activeBlockId = MORNING_BLOCKS.find(b => !progress[b.id])?.id || null

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{greet(child.name)}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{today} · Grade {child.grade}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {MORNING_BLOCKS.map(b => (
                <div
                  key={b.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    progress[b.id] ? 'bg-green-400' : b.id === activeBlockId ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">{completedCount}/7</span>
            <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 ml-2">sign out</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── MORNING BLOCKS ──────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <h2 className="font-bold text-white">Morning Work</h2>
              <p className="text-xs text-slate-500">7 subjects · 20 minutes each · complete in order</p>
            </div>
            {allDone && (
              <div className="ml-auto flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                All done
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {MORNING_BLOCKS.map((block, i) => {
              const Icon = block.icon
              const done = progress[block.id]
              const isNext = block.id === activeBlockId

              return (
                <Link key={block.id} href={`/basics/${childId}/${block.id}`}>
                  <div className={`
                    rounded-2xl p-4 transition-all h-full flex flex-col gap-3 relative overflow-hidden cursor-pointer
                    ${done ? 'bg-green-950/40 border border-green-800/50 hover:border-green-600' :
                      isNext ? 'bg-slate-800 border border-amber-500/50 shadow-lg shadow-amber-500/10 hover:border-amber-400' :
                      'bg-slate-800/60 border border-slate-700 hover:border-slate-500'}
                  `}>
                    <span className="absolute top-2.5 right-3 text-xs font-mono text-slate-600">{i + 1}</span>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${block.color}`}>
                      {done
                        ? <CheckCircle2 className="w-5 h-5 text-white" />
                        : <Icon className="w-5 h-5 text-white" />}
                    </div>

                    <div>
                      <p className={`font-semibold text-sm ${done ? 'text-green-400' : 'text-white'}`}>
                        {block.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{block.desc}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs mt-auto">
                      {done
                        ? <span className="text-green-600">Complete</span>
                        : <><Clock className="w-3 h-3 text-slate-500" /><span className="text-slate-500">{block.minutes} min</span><ArrowRight className="w-3 h-3 ml-auto text-slate-600" /></>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── HARKNESS TABLE ──────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Crown className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="font-bold text-white">The Harkness Table</h2>
              <p className="text-xs text-slate-500">
                {completedCount > 0 ? `${completedCount}/6 morning subjects done` : 'Open — choose your session'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Joint table — featured */}
            <Link href="/table">
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 p-5 flex items-center gap-4 hover:border-amber-400 transition-all cursor-pointer group">
                <div className="flex -space-x-2 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-black font-bold border-2 border-slate-950">J</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold border-2 border-slate-950">U</div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-300 text-base">Joint Table</p>
                  <p className="text-sm text-slate-400">Jus + Uni + AI classmates — discuss together</p>
                </div>
                <Users className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
            </Link>

            {/* Solo sessions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {HARKNESS_SESSIONS.map(s => (
                <Link key={s.id} href={`/session/${childId}/${s.id}`}>
                  <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 hover:border-slate-500 transition-all cursor-pointer">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-semibold text-sm text-white">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM ROW ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Puzzles */}
          <Link href={`/puzzles/${childId}`}>
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 hover:border-violet-500/50 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3">
                <Puzzle className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-white">Puzzle Room</p>
              <p className="text-xs text-slate-500 mt-0.5">41 logic games · MIT licensed</p>
            </div>
          </Link>

          {/* Chess */}
          <Link href={`/chess/${childId}`}>
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 hover:border-slate-500 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center mb-3">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-white">Chess League</p>
              <p className="text-xs text-slate-500 mt-0.5">vs {childId === 'jus' ? 'Uni' : 'Jus'}</p>
            </div>
          </Link>

          {/* Library */}
          <Link href={`/learn/${childId}`}>
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 hover:border-slate-500 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-white">Learning Library</p>
              <p className="text-xs text-slate-500 mt-0.5">35+ topics · auto-play lessons</p>
            </div>
          </Link>

          {/* Coding Lab */}
          <Link href={`/coding/${childId}`}>
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 hover:border-green-500/50 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-white">Coding Lab</p>
              <p className="text-xs text-slate-500 mt-0.5">Blockly · TF.js · Google AI</p>
            </div>
          </Link>

          {/* Classmates */}
          <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5">
            <p className="font-bold text-white mb-3">Your Classmates</p>
            <div className="flex -space-x-2 mb-2">
              {CLASSMATES.map(c => (
                <div key={c.name} className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800`}>
                  {c.name[0]}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">{CLASSMATES.map(c => c.name).join(' · ')}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

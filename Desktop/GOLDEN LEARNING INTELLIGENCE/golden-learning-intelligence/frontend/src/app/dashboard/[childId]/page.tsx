'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calculator, BookOpen, FlaskConical, Cpu, DollarSign, Scale, Heart, Code2, Activity,
  CheckCircle2, Clock, Crown, Swords, Users, Zap, ArrowRight, Puzzle, Globe,
  Lightbulb, Music, Wrench, Brain, Landmark, TreePine,
} from 'lucide-react'

const CHILD_INFO: Record<string, { name: string; age: number; grade: number; initial: string }> = {
  jus: { name: 'Jus',  age: 11, grade: 5, initial: 'J' },
  uni: { name: 'Uni',  age: 13, grade: 8, initial: 'U' },
}

const CLASSMATES = [
  { name: 'Marcus', bg: '#EF4444' },
  { name: 'Sophia', bg: '#8B5CF6' },
  { name: 'Chen',   bg: '#3B82F6' },
  { name: 'Amara',  bg: '#10B981' },
  { name: 'Raj',    bg: '#F59E0B' },
  { name: 'Luna',   bg: '#EC4899' },
]

const ACADEMIC_BLOCKS = [
  { id: 'math',    label: 'Mathematics',       icon: Calculator,   color: '#3B82F6', minutes: 20 },
  { id: 'reading', label: 'Reading & Writing', icon: BookOpen,     color: '#F59E0B', minutes: 20 },
  { id: 'science', label: 'Science',           icon: FlaskConical, color: '#10B981', minutes: 20 },
  { id: 'ai',      label: 'AI Literacy',       icon: Cpu,          color: '#8B5CF6', minutes: 20 },
  { id: 'finance', label: 'Finance',           icon: DollarSign,   color: '#059669', minutes: 20 },
  { id: 'law',     label: 'Law & Rights',      icon: Scale,        color: '#475569', minutes: 20 },
  { id: 'health',  label: 'Health & Body',     icon: Heart,        color: '#EF4444', minutes: 20 },
]

const HARKNESS_SESSIONS = [
  { id: 'numbers', title: 'Numbers Room',        desc: 'Math · Logic · Proof',           color: '#3B82F6' },
  { id: 'library', title: 'The Library',         desc: 'Literature · Ideas',             color: '#F59E0B' },
  { id: 'lab',     title: 'The Lab',             desc: 'Scientific Thinking',            color: '#10B981' },
  { id: 'tok',     title: 'Theory of Knowledge', desc: 'How do we know what we know?',   color: '#EC4899' },
  { id: 'opening', title: 'Open Forum',          desc: 'Philosophy · Debate',            color: '#8B5CF6' },
  { id: 'ai',      title: 'AI & The Future',     desc: 'Machines · Minds · Ethics',      color: '#7C3AED' },
  { id: 'money',   title: 'The Money Room',      desc: 'Finance · Wealth · Investing',   color: '#059669' },
  { id: 'law',     title: 'The Court Room',      desc: 'Law · Rights · Justice',         color: '#475569' },
  { id: 'econ',    title: 'The Market',          desc: 'Economics · Trade',              color: '#0EA5E9' },
  { id: 'body',    title: 'The Body Lab',        desc: 'Anatomy · Nutrition · Sport',    color: '#EF4444' },
  { id: 'phil',    title: 'The Agora',           desc: 'Ethics · Philosophy of Mind',    color: '#D97706' },
]

const SCHOOL_WINGS = [
  { id: 'coding',    label: 'Coding Lab',        icon: Code2,     color: '#10B981', desc: 'freeCodeCamp · Blockly · TF.js',     path: (id: string) => `/coding/${id}` },
  { id: 'chess',     label: 'Chess League',      icon: Swords,    color: '#475569', desc: 'Strategy · Tactics',                  path: (id: string) => `/chess/${id}` },
  { id: 'puzzles',   label: 'Puzzle Room',       icon: Puzzle,    color: '#8B5CF6', desc: '41 logic games · MIT licensed',       path: (id: string) => `/puzzles/${id}` },
  { id: 'tennis',    label: 'Tennis Wing',       icon: Activity,  color: '#F59E0B', desc: 'Reaction · Tactics · 3D Court',       path: (id: string) => `/tennis/${id}` },
  { id: 'philosophy',label: 'Philosophy',        icon: Lightbulb, color: '#D97706', desc: 'OpenStax · 76 modules',               path: (id: string) => `/basics/${id}/philosophy` },
  { id: 'history',   label: 'World History',     icon: Globe,     color: '#0EA5E9', desc: 'OpenStax · 162 modules',              path: (id: string) => `/basics/${id}/history` },
  { id: 'sociology', label: 'Society & Poverty', icon: Users,     color: '#EC4899', desc: 'OpenStax Sociology · 96 modules',     path: (id: string) => `/basics/${id}/sociology` },
  { id: 'arduino',   label: 'Arduino / Making',  icon: Wrench,    color: '#EF4444', desc: 'Electronics · Circuits · Build',      path: (id: string) => `/basics/${id}/arduino` },
  { id: 'deeplearn', label: 'Deep Learning',     icon: Brain,     color: '#7C3AED', desc: 'D2L textbook · Neural nets · ML',     path: (id: string) => `/basics/${id}/deeplearn` },
  { id: 'arts',      label: 'Arts & Culture',    icon: Music,     color: '#DB2777', desc: 'MIT · Stanford · Open access',        path: (id: string) => `/basics/${id}/arts` },
  { id: 'library',   label: 'Learning Library',  icon: BookOpen,  color: '#3B82F6', desc: '35+ topics · auto-play',              path: (id: string) => `/learn/${id}` },
  { id: 'political', label: 'Political Science', icon: Landmark,  color: '#1D4ED8', desc: 'OpenStax Government & Power',         path: (id: string) => `/basics/${id}/political` },
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

const cream   = '#F9F4EC'
const navy    = '#1A3050'
const navyMid = '#2A4A6B'
const card    = '#FFFFFF'
const border  = '#E8E0D4'

export default function DashboardPage() {
  const params = useParams()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', age: 12, grade: 6, initial: 'S' }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const now = new Date()
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`

  const [progress, setProgress] = useState<Record<string, boolean>>(
    Object.fromEntries(ACADEMIC_BLOCKS.map(b => [b.id, false]))
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(todayKey(childId))
    if (saved) {
      try { setProgress(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [childId])

  const completedCount = ACADEMIC_BLOCKS.filter(b => progress[b.id]).length
  const allDone = completedCount === ACADEMIC_BLOCKS.length
  const pct = Math.round((completedCount / ACADEMIC_BLOCKS.length) * 100)
  const activeBlockId = ACADEMIC_BLOCKS.find(b => !progress[b.id])?.id || null

  return (
    <div style={{ background: cream, height: '100vh', fontFamily: "'Nunito', sans-serif", color: navy, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{
        background: navy, color: '#fff', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '58px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 15, color: navy,
          }}>{child.initial}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{greet(child.name)}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Grade {child.grade} · Golden Learning Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {ACADEMIC_BLOCKS.map(b => (
              <div key={b.id} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: progress[b.id] ? '#4ADE80' : b.id === activeBlockId ? '#FCD34D' : 'rgba(255,255,255,0.2)',
              }} />
            ))}
            <span style={{ fontSize: 11, opacity: 0.55, marginLeft: 4 }}>{completedCount}/{ACADEMIC_BLOCKS.length}</span>
          </div>
          <Link href="/" style={{ fontSize: 11, opacity: 0.45, color: '#fff', textDecoration: 'none' }}>sign out</Link>
        </div>
      </header>

      {/* ── THREE EQUAL DEPARTMENTS + SIDEBAR ─────────────── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 172px',
        gap: 14,
        padding: '14px',
        overflow: 'hidden',
      }}>

        {/* ════════════════════════════════════
            COLUMN 1 · ACADEMIC BLOCK
        ════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {/* Column header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            background: card, border: `1.5px solid ${border}`, borderRadius: 12,
            padding: '8px 12px',
          }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={13} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: navy }}>Academic Block</div>
              <div style={{ fontSize: 10, color: navyMid, opacity: 0.65 }}>Complete in order · 20 min each</div>
            </div>
            {allDone && <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#10B981', fontSize: 10, fontWeight: 700 }}><CheckCircle2 size={12} />Done</div>}
          </div>

          {/* Subject list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto', flex: 1 }}>
            {ACADEMIC_BLOCKS.map((block, i) => {
              const Icon = block.icon
              const done = progress[block.id]
              const isNext = block.id === activeBlockId
              return (
                <Link key={block.id} href={`/basics/${childId}/${block.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: done ? '#F0FDF4' : isNext ? '#FFFBEB' : card,
                    border: `1.5px solid ${done ? '#86EFAC' : isNext ? '#FCD34D' : border}`,
                    borderRadius: 12,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: isNext ? '0 2px 8px rgba(251,191,36,0.18)' : 'none',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: done ? '#DCFCE7' : `${block.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done ? <CheckCircle2 size={17} color="#16A34A" /> : <Icon size={17} color={block.color} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: done ? '#16A34A' : navy }}>{block.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.55, color: navyMid }}>
                        {done ? 'Complete' : isNext ? '↑ Up next' : `${block.minutes} min`}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, opacity: 0.3, color: navyMid, flexShrink: 0 }}>{i + 1}</span>
                    {!done && <ArrowRight size={13} color={isNext ? '#F59E0B' : navyMid} style={{ opacity: 0.5, flexShrink: 0 }} />}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ════════════════════════════════════
            COLUMN 2 · HARKNESS TABLE
        ════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {/* Column header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            background: card, border: `1.5px solid ${border}`, borderRadius: 12,
            padding: '8px 12px',
          }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={13} color={navy} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: navy }}>Harkness Table</div>
              <div style={{ fontSize: 10, color: navyMid, opacity: 0.65 }}>Open — choose any room</div>
            </div>
          </div>

          {/* Joint table */}
          <Link href="/table" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              background: '#FFFBEB', border: `1.5px solid #FCD34D`,
              borderRadius: 12, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex' }}>
                {['J','U'].map((l, i) => (
                  <div key={l} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i === 0 ? '#F59E0B' : '#3B82F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 11, color: '#fff',
                    border: '2px solid #FFFBEB',
                    marginLeft: i > 0 ? -8 : 0,
                  }}>{l}</div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#92400E' }}>Joint Table</div>
                <div style={{ fontSize: 10, color: '#A16207' }}>Jus + Uni + AI classmates</div>
              </div>
              <Users size={13} color="#F59E0B" />
            </div>
          </Link>

          {/* Sessions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1 }}>
            {HARKNESS_SESSIONS.map(s => (
              <Link key={s.id} href={`/session/${childId}/${s.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: card, border: `1.5px solid ${border}`,
                  borderRadius: 11, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: navy }}>{s.title}</div>
                    <div style={{ fontSize: 10, color: navyMid, opacity: 0.55 }}>{s.desc}</div>
                  </div>
                  <Zap size={11} color={s.color} style={{ opacity: 0.65, flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════
            COLUMN 3 · SCHOOL WINGS
        ════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {/* Column header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            background: card, border: `1.5px solid ${border}`, borderRadius: 12,
            padding: '8px 12px',
          }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={13} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: navy }}>School Wings</div>
              <div style={{ fontSize: 10, color: navyMid, opacity: 0.65 }}>Labs · Clubs · Open subjects</div>
            </div>
          </div>

          {/* Wings grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 7, overflowY: 'auto', flex: 1, alignContent: 'start',
          }}>
            {SCHOOL_WINGS.map(wing => {
              const Icon = wing.icon
              return (
                <Link key={wing.id} href={wing.path(childId)} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: card, border: `1.5px solid ${border}`,
                    borderRadius: 11, padding: '9px 10px',
                    cursor: 'pointer', height: '100%', boxSizing: 'border-box',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${wing.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 6,
                    }}>
                      <Icon size={14} color={wing.color} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 11, color: navy, lineHeight: 1.3 }}>{wing.label}</div>
                    <div style={{ fontSize: 9.5, color: navyMid, opacity: 0.55, marginTop: 2, lineHeight: 1.3 }}>{wing.desc}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ════════════════════════════════════
            SIDEBAR · DATE / PROGRESS / MATES
        ════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

          <div style={{ background: navy, borderRadius: 12, padding: '12px 14px', color: '#fff', flexShrink: 0 }}>
            <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 3 }}>Today</div>
            <div style={{ fontWeight: 800, fontSize: 12 }}>{dateStr}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Grade {child.grade}</div>
          </div>

          <div style={{ background: card, border: `1.5px solid ${border}`, borderRadius: 12, padding: '11px 13px', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 11, color: navy, marginBottom: 7 }}>Today&apos;s Progress</div>
            <div style={{ background: '#EDE9E0', borderRadius: 99, height: 7, overflow: 'hidden', marginBottom: 5 }}>
              <div style={{
                height: '100%', borderRadius: 99, width: `${pct}%`,
                background: allDone ? '#10B981' : '#3B82F6',
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: 10, color: navyMid, opacity: 0.65, marginBottom: 7 }}>{completedCount}/{ACADEMIC_BLOCKS.length} subjects</div>
            {ACADEMIC_BLOCKS.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: progress[b.id] ? '#10B981' : '#E2D9CE', flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, color: progress[b.id] ? '#16A34A' : navyMid, opacity: progress[b.id] ? 1 : 0.5 }}>{b.label}</span>
              </div>
            ))}
          </div>

          <div style={{ background: card, border: `1.5px solid ${border}`, borderRadius: 12, padding: '11px 13px', flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 11, color: navy, marginBottom: 9 }}>Classmates</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {CLASSMATES.map(c => (
                <div key={c.name} style={{
                  width: 30, height: 30, borderRadius: '50%', background: c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 11, color: '#fff',
                  border: `2px solid ${cream}`,
                }}>{c.name[0]}</div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 9.5, color: navyMid, opacity: 0.55, lineHeight: 1.6 }}>
              {CLASSMATES.map(c => c.name).join(' · ')}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

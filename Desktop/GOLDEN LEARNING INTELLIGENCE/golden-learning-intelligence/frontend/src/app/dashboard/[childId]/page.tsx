'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const CHILD_INFO: Record<string, { name: string; age: number; grade: number; initial: string }> = {
  jus: { name: 'Jus',  age: 11, grade: 5, initial: 'J' },
  uni: { name: 'Uni',  age: 13, grade: 8, initial: 'U' },
}

type SlotType = 'academic' | 'language' | 'wing' | 'harkness' | 'break' | 'quiz' | 'free'

interface Slot {
  time: string
  label: string
  sub?: string
  color: string
  path: (id: string) => string
  type: SlotType
  key?: string
}

const WEEKLY_SCHEDULE: Record<number, Slot[]> = {
  1: [ // Monday
    { time: '10:00', label: 'Mathematics',       color: '#3B82F6', path: id => `/basics/${id}/math`,        type: 'academic',  key: 'math'       },
    { time: '10:20', label: 'Languages',         color: '#0EA5E9', path: id => `/languages/${id}`,          type: 'language',  key: 'languages'  },
    { time: '10:40', label: 'World History',     color: '#0EA5E9', path: id => `/basics/${id}/history`,     type: 'wing',      key: 'history'    },
    { time: '11:00', label: 'Break',             color: '#6B7280', path: _ => '',                           type: 'break'                        },
    { time: '11:10', label: 'Science',           color: '#10B981', path: id => `/basics/${id}/science`,     type: 'academic',  key: 'science'    },
    { time: '11:30', label: 'Music — Theory',    color: '#8B5CF6', path: id => `/music/${id}`,              type: 'wing',      key: 'music'      },
    { time: '11:50', label: 'Critical Thinking', color: '#EC4899', path: id => `/session/${id}`,            type: 'harkness',  key: 'harkness'   },
    { time: '12:10', label: 'Lunch',             color: '#6B7280', path: _ => '',                           type: 'break'                        },
    { time: '12:40', label: 'Chess League',      color: '#475569', path: id => `/chess/${id}`,              type: 'wing',      key: 'chess'      },
    { time: '1:00',  label: 'Free Choice', sub: 'Pick your lesson', color: '#6B7280', path: id => `/learn/${id}`, type: 'free', key: 'free'     },
    { time: '1:20',  label: 'CA State Quiz',     color: '#6366F1', path: id => `/test-prep/${id}`,          type: 'quiz',      key: 'testprep'   },
  ],
  2: [ // Tuesday
    { time: '10:00', label: 'Finance',              color: '#059669', path: id => `/basics/${id}/finance`,   type: 'academic',  key: 'finance'    },
    { time: '10:20', label: 'Coding Lab',           color: '#10B981', path: id => `/coding/${id}`,           type: 'wing',      key: 'coding'     },
    { time: '10:40', label: 'Languages',            color: '#0EA5E9', path: id => `/languages/${id}`,        type: 'language',  key: 'languages'  },
    { time: '11:00', label: 'Break',                color: '#6B7280', path: _ => '',                         type: 'break'                        },
    { time: '11:10', label: 'Philosophy',           color: '#D97706', path: id => `/basics/${id}/philosophy`,type: 'wing',      key: 'philosophy' },
    { time: '11:30', label: 'Brain Lab',            color: '#F59E0B', path: id => `/brain-lab/${id}`,        type: 'wing',      key: 'brainlab'   },
    { time: '11:50', label: 'Debate: Money & Power',color: '#EC4899', path: id => `/session/${id}`,           type: 'harkness',  key: 'harkness'   },
    { time: '12:10', label: 'Lunch',                color: '#6B7280', path: _ => '',                         type: 'break'                        },
    { time: '12:40', label: 'AI Literacy',          color: '#8B5CF6', path: id => `/basics/${id}/ai`,        type: 'academic',  key: 'ai'         },
    { time: '1:00',  label: 'Free Choice', sub: 'Pick your lesson', color: '#6B7280', path: id => `/learn/${id}`, type: 'free', key: 'free'     },
    { time: '1:20',  label: 'CA State Quiz',        color: '#6366F1', path: id => `/test-prep/${id}`,        type: 'quiz',      key: 'testprep'   },
  ],
  3: [ // Wednesday
    { time: '10:00', label: 'Reading & Writing', color: '#F59E0B', path: id => `/basics/${id}/reading`,     type: 'academic',  key: 'reading'    },
    { time: '10:20', label: 'Music — History',   color: '#8B5CF6', path: id => `/music/${id}`,              type: 'wing',      key: 'music'      },
    { time: '10:40', label: 'Languages',         color: '#0EA5E9', path: id => `/languages/${id}`,          type: 'language',  key: 'languages'  },
    { time: '11:00', label: 'Break',             color: '#6B7280', path: _ => '',                           type: 'break'                        },
    { time: '11:10', label: 'Science',           color: '#10B981', path: id => `/basics/${id}/science`,     type: 'academic',  key: 'science'    },
    { time: '11:30', label: 'Arts & Culture',    color: '#DB2777', path: id => `/basics/${id}/arts`,        type: 'wing',      key: 'arts'       },
    { time: '11:50', label: 'Open Forum',        color: '#EC4899', path: id => `/session/${id}`,            type: 'harkness',  key: 'harkness'   },
    { time: '12:10', label: 'Lunch',             color: '#6B7280', path: _ => '',                           type: 'break'                        },
    { time: '12:40', label: 'Mathematics',       color: '#3B82F6', path: id => `/basics/${id}/math`,        type: 'academic',  key: 'math'       },
    { time: '1:00',  label: 'Free Choice', sub: 'Pick your lesson', color: '#6B7280', path: id => `/learn/${id}`, type: 'free', key: 'free'     },
    { time: '1:20',  label: 'CA State Quiz',     color: '#6366F1', path: id => `/test-prep/${id}`,          type: 'quiz',      key: 'testprep'   },
  ],
  4: [ // Thursday
    { time: '10:00', label: 'Law & Rights',       color: '#475569', path: id => `/basics/${id}/law`,         type: 'academic',  key: 'law'        },
    { time: '10:20', label: 'Languages',          color: '#0EA5E9', path: id => `/languages/${id}`,          type: 'language',  key: 'languages'  },
    { time: '10:40', label: 'Arduino / Making',   color: '#EF4444', path: id => `/basics/${id}/arduino`,     type: 'wing',      key: 'arduino'    },
    { time: '11:00', label: 'Break',              color: '#6B7280', path: _ => '',                           type: 'break'                        },
    { time: '11:10', label: 'Deep Learning & AI', color: '#7C3AED', path: id => `/basics/${id}/deeplearn`,   type: 'wing',      key: 'deeplearn'  },
    { time: '11:30', label: 'Society & Poverty',  color: '#EC4899', path: id => `/basics/${id}/sociology`,   type: 'wing',      key: 'sociology'  },
    { time: '11:50', label: 'AI & The Future',    color: '#EC4899', path: id => `/session/${id}`,             type: 'harkness',  key: 'harkness'   },
    { time: '12:10', label: 'Lunch',              color: '#6B7280', path: _ => '',                           type: 'break'                        },
    { time: '12:40', label: 'Health & Body',      color: '#EF4444', path: id => `/basics/${id}/health`,      type: 'academic',  key: 'health'     },
    { time: '1:00',  label: 'Free Choice', sub: 'Pick your lesson', color: '#6B7280', path: id => `/learn/${id}`, type: 'free', key: 'free'     },
    { time: '1:20',  label: 'CA State Quiz',      color: '#6366F1', path: id => `/test-prep/${id}`,           type: 'quiz',      key: 'testprep'   },
  ],
  5: [ // Friday — Test & Review Day
    { time: '10:00', label: 'Word & Concept Test',    color: '#6366F1', path: id => `/test-prep/${id}`,         type: 'quiz',      key: 'testprep'   },
    { time: '10:20', label: 'Word & Concept Test',    color: '#6366F1', path: id => `/test-prep/${id}`,         type: 'quiz',      key: 'testprep2'  },
    { time: '10:40', label: 'CA State Practice',      color: '#6366F1', path: id => `/test-prep/${id}`,         type: 'quiz',      key: 'capractice' },
    { time: '11:00', label: 'Break',                  color: '#6B7280', path: _ => '',                          type: 'break'                        },
    { time: '11:10', label: 'Review: Mathematics',    color: '#3B82F6', path: id => `/basics/${id}/math`,       type: 'academic',  key: 'math'       },
    { time: '11:30', label: 'Review: Science',        color: '#10B981', path: id => `/basics/${id}/science`,    type: 'academic',  key: 'science'    },
    { time: '11:50', label: 'Review: Reading',        color: '#F59E0B', path: id => `/basics/${id}/reading`,    type: 'academic',  key: 'reading'    },
    { time: '12:10', label: 'Lunch',                  color: '#6B7280', path: _ => '',                          type: 'break'                        },
    { time: '12:40', label: 'Free Choice', sub: 'Pick your lesson', color: '#6B7280', path: id => `/learn/${id}`, type: 'free', key: 'free'     },
    { time: '1:00',  label: 'Free Choice', sub: 'Pick your lesson', color: '#6B7280', path: id => `/learn/${id}`, type: 'free', key: 'free2'    },
    { time: '1:20',  label: 'CA State Quiz',          color: '#6366F1', path: id => `/test-prep/${id}`,          type: 'quiz',      key: 'testprep3'  },
  ],
  6: [ // Saturday
    { time: '10:00', label: 'Languages',         color: '#0EA5E9', path: id => `/languages/${id}`,           type: 'language',  key: 'languages'  },
    { time: '10:20', label: 'Music — History',   color: '#8B5CF6', path: id => `/music/${id}`,               type: 'wing',      key: 'music'      },
    { time: '10:40', label: 'Arts & Culture',    color: '#DB2777', path: id => `/basics/${id}/arts`,         type: 'wing',      key: 'arts'       },
    { time: '11:00', label: 'Break',             color: '#6B7280', path: _ => '',                            type: 'break'                        },
    { time: '11:10', label: 'Philosophy',        color: '#D97706', path: id => `/basics/${id}/philosophy`,   type: 'wing',      key: 'philosophy' },
    { time: '11:30', label: 'Free Choice', sub: 'Pick your lesson', color: '#6B7280', path: id => `/learn/${id}`, type: 'free', key: 'free'    },
    { time: '11:50', label: 'CA State Quiz',     color: '#6366F1', path: id => `/test-prep/${id}`,           type: 'quiz',      key: 'testprep'   },
  ],
  0: [ // Sunday
    { time: '10:00', label: 'Free Choice', sub: 'Your day, your lesson', color: '#6B7280', path: id => `/learn/${id}`, type: 'free', key: 'free' },
  ],
}

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

function parseTimeToMinutes(t: string): number {
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr)
  const m = parseInt(mStr)
  if (h >= 1 && h <= 9) h += 12
  return h * 60 + m
}

const cream   = '#F9F4EC'
const navy    = '#1A3050'
const navyMid = '#2A4A6B'
const card    = '#FFFFFF'
const border  = '#E8E0D4'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TYPE_LABELS: Record<SlotType, string> = {
  academic: 'Academic',
  language: 'Language',
  wing: 'Wing',
  harkness: 'Discussion',
  break: '',
  quiz: 'Quiz',
  free: 'Your choice',
}

const DAY_TITLE: Record<number, string> = {
  0: 'Sunday — Free Day',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Test & Review — Friday',
  6: 'Saturday',
}

export default function DashboardPage() {
  const params = useParams()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', age: 12, grade: 6, initial: 'S' }

  const now = new Date()
  const dayOfWeek = now.getDay()
  const dateStr = `${DAY_NAMES[dayOfWeek]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const todaySlots = WEEKLY_SCHEDULE[dayOfWeek] || WEEKLY_SCHEDULE[1]
  const slotMinutes = todaySlots.map(s => parseTimeToMinutes(s.time))

  const [progress, setProgress] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(todayKey(childId))
    if (saved) {
      try { setProgress(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [childId])

  // Active slot by clock
  let activeIdx = -1
  for (let i = 0; i < slotMinutes.length; i++) {
    const end = i < slotMinutes.length - 1 ? slotMinutes[i + 1] : slotMinutes[i] + 20
    if (currentMinutes >= slotMinutes[i] && currentMinutes < end) {
      activeIdx = i
      break
    }
  }

  const beforeSchool = currentMinutes < slotMinutes[0]
  const lastEnd = slotMinutes[slotMinutes.length - 1] + 20
  const afterSchool = currentMinutes >= lastEnd

  const completable = todaySlots.filter(s => s.type !== 'break' && s.key)
  const completedToday = completable.filter(s => s.key && progress[s.key]).length
  const pct = completable.length ? Math.round((completedToday / completable.length) * 100) : 0

  function slotDuration(i: number): number {
    if (i >= slotMinutes.length - 1) return 20
    return slotMinutes[i + 1] - slotMinutes[i]
  }

  return (
    <div style={{ background: cream, height: '100vh', fontFamily: "'Nunito', sans-serif", color: navy, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* HEADER */}
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
          <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700 }}>{completedToday}/{completable.length} done</div>
          <Link href="/" style={{ fontSize: 11, opacity: 0.45, color: '#fff', textDecoration: 'none' }}>sign out</Link>
        </div>
      </header>

      {/* DAY STRIP + PROGRESS BAR */}
      <div style={{
        background: card, borderBottom: `1px solid ${border}`,
        padding: '9px 20px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: navy }}>{DAY_TITLE[dayOfWeek]} · {MONTHS[now.getMonth()]} {now.getDate()}</div>
          <div style={{ fontSize: 10, color: navyMid, opacity: 0.6 }}>
            {beforeSchool ? 'School starts at 10:00' : afterSchool ? 'School day complete' : `${completedToday} of ${completable.length} subjects complete`}
          </div>
        </div>
        <div style={{ flex: 1, height: 6, background: '#EDE9E0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99, width: `${pct}%`,
            background: pct === 100 ? '#10B981' : '#3B82F6',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? '#10B981' : navyMid, opacity: 0.8, flexShrink: 0 }}>
          {pct}%
        </div>
      </div>

      {/* SCHEDULE TIMELINE */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 6 }}>

          {todaySlots.map((slot, i) => {
            const isActive = i === activeIdx
            const isDone = !!(slot.key && progress[slot.key])
            const isBreak = slot.type === 'break'
            const dur = slotDuration(i)
            const isPast = !isActive && !isBreak && currentMinutes > slotMinutes[i] + dur

            const cardBg   = isBreak ? '#F5F0E8' : isDone ? '#F0FDF4' : card
            const cardBorderColor = isBreak ? border : isDone ? '#86EFAC' : isActive ? slot.color : border
            const leftColor = isBreak ? '#DDD4C0' : slot.color
            const rowOpacity = isPast && !isDone ? 0.4 : 1

            const rowContent = (
              <div style={{
                background: cardBg,
                border: `1.5px solid ${cardBorderColor}`,
                borderLeft: `4px solid ${leftColor}`,
                borderRadius: 10,
                padding: isBreak ? '7px 14px 7px 12px' : '11px 14px 11px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: rowOpacity,
                boxShadow: isActive ? '0 0 0 2px #F59E0B40, 0 2px 10px rgba(0,0,0,0.07)' : 'none',
                cursor: isBreak ? 'default' : 'pointer',
                transition: 'box-shadow 0.2s, border-color 0.2s',
              }}>

                {/* Time */}
                <div style={{ width: 46, flexShrink: 0, textAlign: 'right' }}>
                  <span style={{
                    fontSize: isBreak ? 10 : 12,
                    fontWeight: 700,
                    color: isBreak ? navyMid : navy,
                    opacity: isBreak ? 0.5 : 0.8,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{slot.time}</span>
                </div>

                {/* Subject name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: isBreak ? 600 : 800,
                    fontSize: isBreak ? 12 : 14,
                    color: isBreak ? navyMid : isDone ? '#16A34A' : navy,
                    opacity: isBreak ? 0.55 : 1,
                    lineHeight: 1.2,
                  }}>
                    {slot.label}{slot.sub ? ` — ${slot.sub}` : ''}
                  </div>
                  {!isBreak && (
                    <div style={{ fontSize: 10, color: navyMid, opacity: 0.5, marginTop: 2 }}>
                      {isDone ? 'Complete ✓' : isActive ? '▸ Now' : TYPE_LABELS[slot.type]}
                    </div>
                  )}
                </div>

                {/* Right: duration or check */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isDone ? (
                    <CheckCircle2 size={17} color="#16A34A" />
                  ) : isActive ? (
                    <ArrowRight size={15} color={slot.color} />
                  ) : !isBreak ? (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: navyMid, opacity: 0.45,
                      background: '#EDE9E0', borderRadius: 6, padding: '2px 8px',
                    }}>{dur} min</span>
                  ) : null}
                </div>
              </div>
            )

            if (isBreak) {
              return <div key={i}>{rowContent}</div>
            }
            return (
              <Link key={i} href={slot.path(childId)} style={{ textDecoration: 'none', display: 'block' }}>
                {rowContent}
              </Link>
            )
          })}

          {afterSchool && (
            <div style={{
              marginTop: 12, textAlign: 'center', padding: '16px 20px',
              background: '#F0FDF4', border: '1.5px solid #86EFAC',
              borderRadius: 12, color: '#16A34A', fontWeight: 800, fontSize: 14,
            }}>
              School day complete · {completedToday} of {completable.length} subjects done
            </div>
          )}

          {beforeSchool && (
            <div style={{
              marginTop: 4, textAlign: 'center', padding: '10px 20px',
              background: '#FFFBEB', border: '1.5px solid #FCD34D',
              borderRadius: 10, color: '#92400E', fontWeight: 700, fontSize: 12, opacity: 0.8,
            }}>
              School starts at 10:00 — first up: {todaySlots.find(s => s.type !== 'break')?.label}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

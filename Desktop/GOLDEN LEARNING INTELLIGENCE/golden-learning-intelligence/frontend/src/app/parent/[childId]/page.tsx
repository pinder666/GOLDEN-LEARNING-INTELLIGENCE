'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, Share2, TrendingUp, BookOpen, Brain } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

const CHILD_INFO: Record<string, { name: string; grade: number; gradeLabel: string }> = {
  jus: { name: 'Jus', grade: 5, gradeLabel: 'Grade 5 · Age 11' },
  uni: { name: 'Uni', grade: 8, gradeLabel: 'Grade 8 · Age 13' },
}

const SUBJECTS = [
  { id: 'math', label: 'Mathematics', icon: '🔢' },
  { id: 'reading', label: 'Reading & Writing', icon: '📖' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'ai', label: 'AI Literacy', icon: '🤖' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'law', label: 'Law & Rights', icon: '⚖️' },
  { id: 'health', label: 'Health & Body', icon: '🫀' },
]

const SUBJECT_ACTIONS: Record<string, string> = {
  math: 'Assign 2 more word problems from the Math module.',
  reading: 'Review a writing exercise together — ask them to explain their main idea.',
  science: 'Watch a 5-minute PhET simulation together on the topic they\'re studying.',
  ai: 'Have a conversation about AI: ask "what is a prompt?" and see what they say.',
  finance: 'Ask them to explain compound interest using a real-life example.',
  law: 'Discuss a contract they\'ve seen (phone terms, sports team agreement, school rules).',
  health: 'Review today\'s nutrition — ask them what they ate and why it matters.',
}

function todayKey(childId: string) {
  const d = new Date()
  return `daily_${childId}_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

interface MasteryRecord {
  standard_id: string
  mastery_level: number
  state_standards?: { standard_code: string; description: string }
}

export default function ParentReportPage() {
  const params = useParams()
  const router = useRouter()
  const childId = (params.childId as string) || 'jus'
  const child = CHILD_INFO[childId] || CHILD_INFO.jus

  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [mastery, setMastery] = useState<MasteryRecord[]>([])
  const [rapport, setRapport] = useState<{ content: string; created_at: string }[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(todayKey(childId))
    if (saved) {
      try { setProgress(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [childId])

  useEffect(() => {
    fetch(`${API_URL}/api/progress/${childId}`)
      .then(r => r.json())
      .then(data => {
        setMastery(data.mastery || [])
        setRapport(data.rapport || [])
      })
      .catch(() => { /* no data yet */ })
  }, [childId])

  const doneCount = SUBJECTS.filter(s => progress[s.id]).length
  const incomplete = SUBJECTS.filter(s => !progress[s.id])
  const lowMastery = mastery.filter(m => m.mastery_level < 3)

  const masteryBySubject: Record<string, number> = {}
  mastery.forEach(m => {
    const code = m.state_standards?.standard_code || m.standard_id || ''
    if (code.includes('MATH') || code.includes('math')) masteryBySubject['math'] = Math.max(masteryBySubject['math'] || 0, m.mastery_level)
    else if (code.includes('ELA') || code.includes('read')) masteryBySubject['reading'] = Math.max(masteryBySubject['reading'] || 0, m.mastery_level)
  })

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const S = {
    page: { minHeight: '100vh', background: '#F9F4EC', fontFamily: 'Nunito, sans-serif' },
    hdr: { background: '#1A3050', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    hdrTitle: { color: '#FFF8EE', fontWeight: 800, fontSize: 15 },
    hdrSub: { color: 'rgba(255,248,238,.5)', fontSize: 11, marginTop: 2 },
    main: { maxWidth: 720, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column' as const, gap: 16 },
    card: { background: '#FFFCF7', border: '1.5px solid #DDD4C0', borderRadius: 16 },
    cardHdr: { background: '#EDE5D3', borderBottom: '1.5px solid #DDD4C0', borderRadius: '14px 14px 0 0', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { fontSize: 10, fontWeight: 900, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: '#4A3F35' },
    body: { padding: '14px 16px' },
    label: { fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8A7D70', marginBottom: 3 },
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/dashboard/${childId}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,248,238,.5)' }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <div style={S.hdrTitle}>Parent Report — {child.name}</div>
            <div style={S.hdrSub}>{child.gradeLabel} · {formatDate()}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Child switcher */}
          {(['jus', 'uni'] as const).map(id => (
            <Link key={id} href={`/parent/${id}`}>
              <button style={{
                background: childId === id ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.07)',
                color: '#FFF8EE', border: childId === id ? '1.5px solid rgba(255,255,255,.3)' : '1.5px solid transparent',
                borderRadius: 999, padding: '4px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer'
              }}>
                {CHILD_INFO[id].name}
              </button>
            </Link>
          ))}
          <button onClick={handleShare} style={{ background: 'rgba(255,255,255,.1)', color: '#FFF8EE', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Share2 style={{ width: 13, height: 13 }} /> {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </header>

      <main style={S.main}>

        {/* Today summary */}
        <div style={S.card}>
          <div style={S.cardHdr}>
            <span style={S.cardTitle}>📋 Today&apos;s Progress</span>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#DDD4C0', borderRadius: 6, padding: '2px 8px', color: '#4A3F35' }}>{doneCount} / 7 done</span>
          </div>
          <div style={S.body}>
            {/* Progress bar */}
            <div style={{ height: 8, background: '#EDE5D3', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: `${(doneCount / 7) * 100}%`, background: '#4ADE80', borderRadius: 4, transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {SUBJECTS.map(s => {
                const done = progress[s.id]
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: done ? '#F0FFF4' : '#F9F4EC', border: `1.5px solid ${done ? '#86EFAC' : '#DDD4C0'}` }}>
                    <span style={{ fontSize: 15 }}>{s.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: done ? '#166534' : '#4A3F35', flex: 1 }}>{s.label}</span>
                    {done
                      ? <CheckCircle2 style={{ color: '#4ADE80', width: 14, height: 14, flexShrink: 0 }} />
                      : <Clock style={{ color: '#BFB4A8', width: 13, height: 13, flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Subject mastery */}
        <div style={S.card}>
          <div style={S.cardHdr}>
            <span style={S.cardTitle}>📊 Subject Mastery</span>
          </div>
          <div style={S.body}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SUBJECTS.map(s => {
                const level = masteryBySubject[s.id]
                const pct = level ? (level / 5) * 100 : 0
                const hasData = level !== undefined
                return (
                  <div key={s.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1C1410' }}>{s.icon} {s.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: hasData ? '#1A3050' : '#BFB4A8' }}>{hasData ? `${Math.round(pct)}%` : 'No data yet'}</span>
                    </div>
                    <div style={{ height: 6, background: '#EDE5D3', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: hasData ? `${pct}%` : '0%', background: pct >= 80 ? '#4ADE80' : pct >= 60 ? '#F59E0B' : '#1A3050', borderRadius: 3, transition: 'width .4s' }} />
                    </div>
                    {!hasData && <div style={{ fontSize: 9, color: '#BFB4A8', marginTop: 2 }}>Completing lessons builds this score</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Attention needed */}
        {(incomplete.length > 0 || lowMastery.length > 0) && (
          <div style={{ ...S.card, border: '1.5px solid #FCD34D' }}>
            <div style={{ ...S.cardHdr, background: '#FEF3C7', borderBottom: '1.5px solid #FCD34D', borderRadius: '14px 14px 0 0' }}>
              <span style={{ ...S.cardTitle, color: '#92400E' }}>⚠️ Attention Needed</span>
            </div>
            <div style={S.body}>
              {incomplete.length > 0 && (
                <>
                  <div style={S.label}>Not completed today</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {incomplete.map(s => (
                      <Link key={s.id} href={`/basics/${childId}/${s.id}`}>
                        <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 8, cursor: 'pointer', display: 'inline-block' }}>
                          {s.icon} {s.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
              {lowMastery.length > 0 && (
                <>
                  <div style={S.label}>Low mastery standards</div>
                  {lowMastery.slice(0, 3).map((m, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#4A3F35', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: '#991B1B' }}>{m.state_standards?.standard_code || m.standard_id}</span>
                      {' — '}{m.state_standards?.description || 'Needs practice'}
                      {' '}<span style={{ color: '#BFB4A8' }}>(level {m.mastery_level}/5)</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* What to do */}
        {incomplete.length > 0 && (
          <div style={S.card}>
            <div style={S.cardHdr}>
              <span style={S.cardTitle}>💡 Suggested Actions</span>
            </div>
            <div style={S.body}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {incomplete.slice(0, 3).map(s => (
                  <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', background: '#F9F4EC', borderRadius: 10, border: '1px solid #DDD4C0' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1C1410', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#8A7D70', lineHeight: 1.4 }}>{SUBJECT_ACTIONS[s.id]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent notes */}
        {rapport.length > 0 && (
          <div style={S.card}>
            <div style={S.cardHdr}>
              <span style={S.cardTitle}>📝 Recent Session Notes</span>
            </div>
            <div style={S.body}>
              {rapport.slice(0, 5).map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: '#4A3F35', padding: '6px 0', borderBottom: i < rapport.length - 1 ? '1px solid #EDE5D3' : 'none', lineHeight: 1.5 }}>
                  <span style={{ color: '#BFB4A8', fontSize: 10, marginRight: 6 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                  {r.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All good state */}
        {doneCount === 7 && (
          <div style={{ ...S.card, background: '#DCFCE7', border: '1.5px solid #86EFAC', textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#166534', marginBottom: 4 }}>All 7 subjects complete!</div>
            <div style={{ fontSize: 13, color: '#065F46' }}>{child.name} finished every morning block today.</div>
          </div>
        )}

        {/* Nav back */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={() => router.push(`/dashboard/${childId}`)}
            style={{ flex: 1, background: '#1A3050', color: '#FFF8EE', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
            Back to {child.name}&apos;s Dashboard
          </button>
        </div>

      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

interface Step { hint: string; solution: string }
interface Question { id: number; question: string; steps: Step[]; answer: string }
interface Result { qIdx: number; userAnswer: string; correct: boolean }

function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[,\s$]/g, '')
    .replace(/dollars?/g, '')
    .replace(/cents?/g, '')
    .replace(/miles?/g, '')
    .replace(/hours?/g, '')
    .replace(/minutes?/g, '')
    .replace(/pounds?/g, '')
    .replace(/feet|foot/g, '')
    .replace(/[^0-9.\-]/g, '')
    .trim()
}

function answersMatch(user: string, correct: string): boolean {
  const u = normalizeAnswer(user)
  const c = normalizeAnswer(correct)
  if (u === c) return true
  const uNum = parseFloat(u)
  const cNum = parseFloat(c)
  if (!isNaN(uNum) && !isNaN(cNum)) return Math.abs(uNum - cNum) < 0.01
  return false
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function TestPrepPage() {
  const params = useParams()
  const router = useRouter()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 5 }

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [qIdx, setQIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [timeLeft, setTimeLeft] = useState(1200)
  const [sessionDone, setSessionDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const grade = child.grade
    fetch(`${API_URL}/api/curriculum/exam-prep?subject=math&grade=${grade}&count=20`)
      .then(r => r.json())
      .then(data => { setQuestions(data.problems || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [childId])

  useEffect(() => {
    if (sessionDone || loading || !questions.length) return
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { setSessionDone(true); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(t)
  }, [sessionDone, loading, questions.length])

  useEffect(() => {
    if (!submitted && !sessionDone && inputRef.current) {
      inputRef.current.focus()
    }
  }, [qIdx, submitted, sessionDone])

  const handleSubmit = useCallback(() => {
    if (!userAnswer.trim() || submitted) return
    const q = questions[qIdx]
    const correct = answersMatch(userAnswer, q.answer)
    setIsCorrect(correct)
    setSubmitted(true)
    setResults(prev => [...prev, { qIdx, userAnswer, correct }])
  }, [userAnswer, submitted, questions, qIdx])

  const handleNext = useCallback(() => {
    const nextIdx = qIdx + 1
    if (nextIdx >= questions.length) {
      setSessionDone(true)
    } else {
      setQIdx(nextIdx)
      setUserAnswer('')
      setSubmitted(false)
      setIsCorrect(null)
    }
  }, [qIdx, questions.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!submitted) handleSubmit()
      else handleNext()
    }
  }

  const score = results.filter(r => r.correct).length
  const attempted = results.length
  const pct = attempted > 0 ? Math.round((score / attempted) * 100) : 0

  const timerColor = timeLeft < 120 ? '#EF4444' : timeLeft < 300 ? '#F59E0B' : '#1A3050'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F4EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#8A7D70' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
          <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Loading test questions…</div>
        </div>
      </div>
    )
  }

  if (sessionDone) {
    const wrongResults = results.filter(r => !r.correct)
    const unattempted = questions.length - attempted
    return (
      <div style={{ minHeight: '100vh', background: '#F9F4EC', fontFamily: 'Nunito, sans-serif' }}>
        {/* Header */}
        <header style={{ background: '#1A3050', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy style={{ color: '#FCD34D', width: 22, height: 22 }} />
            <span style={{ color: '#FFF8EE', fontWeight: 800, fontSize: 16 }}>Test Complete — {child.name}</span>
          </div>
          <button onClick={() => router.push(`/dashboard/${childId}`)}
            style={{ background: 'rgba(255,255,255,.12)', color: '#FFF8EE', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Dashboard
          </button>
        </header>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
          {/* Score card */}
          <div style={{ background: '#FFFCF7', border: '1.5px solid #DDD4C0', borderRadius: 18, padding: '28px 32px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: pct >= 80 ? '#166534' : pct >= 60 ? '#B45309' : '#991B1B', lineHeight: 1 }}>
              {score} / {attempted}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4A3F35', marginTop: 8 }}>{pct}% correct</div>
            {unattempted > 0 && <div style={{ fontSize: 12, color: '#8A7D70', marginTop: 6 }}>{unattempted} question{unattempted > 1 ? 's' : ''} not reached (time ran out)</div>}
            <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'center' }}>
              <div style={{ background: '#DCFCE7', borderRadius: 8, padding: '8px 18px' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#166534' }}>{score}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Correct</div>
              </div>
              <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '8px 18px' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#991B1B' }}>{attempted - score}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wrong</div>
              </div>
              <div style={{ background: '#EDE5D3', borderRadius: 8, padding: '8px 18px' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#4A3F35' }}>{unattempted}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#4A3F35', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Missed</div>
              </div>
            </div>
          </div>

          {/* Review wrong answers */}
          {wrongResults.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A3F35', marginBottom: 12 }}>Review — Incorrect Answers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {wrongResults.map(r => {
                  const q = questions[r.qIdx]
                  return (
                    <div key={r.qIdx} style={{ background: '#FFFCF7', border: '1.5px solid #DDD4C0', borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7D70', marginBottom: 6 }}>Q{r.qIdx + 1}</div>
                      <div style={{ fontSize: 13, color: '#1C1410', marginBottom: 10, lineHeight: 1.5 }}>{q.question}</div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6 }}>
                          Your answer: {r.userAnswer}
                        </span>
                        <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6 }}>
                          Correct: {q.answer}
                        </span>
                      </div>
                      {q.steps.length > 0 && (
                        <div style={{ marginTop: 10, borderTop: '1px solid #EDE5D3', paddingTop: 10 }}>
                          {q.steps.map((s, i) => (
                            <div key={i} style={{ fontSize: 11, color: '#4A3F35', marginBottom: 4 }}>
                              <span style={{ fontWeight: 800 }}>Step {i + 1}:</span> {s.hint} {s.solution && <span style={{ color: '#1A3050' }}>→ {s.solution}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push(`/dashboard/${childId}`)}
              style={{ flex: 1, background: '#1A3050', color: '#FFF8EE', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              Back to Dashboard
            </button>
            <button onClick={() => { setQuestions([]); setResults([]); setQIdx(0); setUserAnswer(''); setSubmitted(false); setIsCorrect(null); setTimeLeft(1200); setSessionDone(false); setLoading(true);
              const grade = child.grade;
              fetch(`${API_URL}/api/curriculum/exam-prep?subject=math&grade=${grade}&count=20`)
                .then(r => r.json()).then(data => { setQuestions(data.problems || []); setLoading(false); }).catch(() => setLoading(false)) }}
              style={{ background: '#EDE5D3', color: '#1C1410', border: '1.5px solid #DDD4C0', borderRadius: 12, padding: '14px 20px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw style={{ width: 16, height: 16 }} /> Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[qIdx]
  if (!currentQ) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F9F4EC', fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#1A3050', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/dashboard/${childId}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,248,238,.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
          <span style={{ color: '#FFF8EE', fontWeight: 800, fontSize: 15 }}>Test Practice · {child.name} · Gr {child.grade}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {questions.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < results.length ? (results[i]?.correct ? '#4ADE80' : '#F87171') : i === qIdx ? '#FCD34D' : 'rgba(255,255,255,.2)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: timerColor === '#EF4444' ? '#FCA5A5' : '#FFF8EE', background: 'rgba(255,255,255,.1)', borderRadius: 8, padding: '4px 10px' }}>
            <Clock style={{ width: 14, height: 14 }} />
            <span style={{ fontWeight: 900, fontSize: 15, fontVariantNumeric: 'tabular-nums', color: timeLeft < 120 ? '#FCA5A5' : '#FFF8EE' }}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          {/* Question counter */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A7D70' }}>
              Question {qIdx + 1} of {questions.length}
            </span>
          </div>

          {/* Question card */}
          <div style={{ background: '#FFFCF7', border: '1.5px solid #DDD4C0', borderRadius: 20, padding: '28px 32px', marginBottom: 16 }}>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: '#1C1410', fontWeight: 600 }}>{currentQ.question}</p>
          </div>

          {/* Answer input */}
          {!submitted && (
            <div style={{ background: '#FFFCF7', border: '1.5px solid #DDD4C0', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer…"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#1C1410' }}
              />
              <button onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                style={{ background: userAnswer.trim() ? '#1A3050' : '#EDE5D3', color: userAnswer.trim() ? '#FFF8EE' : '#BFB4A8', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: userAnswer.trim() ? 'pointer' : 'default', transition: 'all .15s' }}>
                Submit
              </button>
            </div>
          )}

          {/* Result reveal */}
          {submitted && isCorrect !== null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: isCorrect ? '#DCFCE7' : '#FEE2E2', border: `1.5px solid ${isCorrect ? '#86EFAC' : '#FCA5A5'}`, borderRadius: 14, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {isCorrect
                    ? <CheckCircle2 style={{ color: '#166534', width: 20, height: 20 }} />
                    : <XCircle style={{ color: '#991B1B', width: 20, height: 20 }} />}
                  <span style={{ fontWeight: 900, fontSize: 14, color: isCorrect ? '#166534' : '#991B1B' }}>
                    {isCorrect ? 'Correct!' : `Not quite — answer: ${currentQ.answer}`}
                  </span>
                </div>
                {!isCorrect && currentQ.steps.length > 0 && (
                  <div style={{ borderTop: `1px solid ${isCorrect ? '#86EFAC' : '#FCA5A5'}`, paddingTop: 10 }}>
                    {currentQ.steps.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#4A3F35', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800 }}>Step {i + 1}:</span> {s.hint} {s.solution && <span style={{ color: '#1A3050' }}>→ {s.solution}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleNext}
                style={{ background: '#1A3050', color: '#FFF8EE', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {qIdx + 1 < questions.length ? 'Next Question' : 'See Results'}
                <ChevronRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

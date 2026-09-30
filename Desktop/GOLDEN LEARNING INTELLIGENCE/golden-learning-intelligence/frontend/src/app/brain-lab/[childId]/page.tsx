'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Zap, Hash, Calculator, Grid3X3, Trophy, RotateCcw } from 'lucide-react'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

type Drill = 'menu' | 'reaction' | 'numflash' | 'mathsprint' | 'pattern'

const S = {
  page: { minHeight: '100vh', background: '#F9F4EC', fontFamily: 'Nunito, sans-serif' },
  hdr: { background: '#1A3050', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 },
  hdrTitle: { color: '#FFF8EE', fontWeight: 900, fontSize: 16 },
  hdrSub: { color: 'rgba(255,248,238,.5)', fontSize: 11, marginTop: 1 },
  main: { maxWidth: 700, margin: '0 auto', padding: '24px 20px' },
  card: { background: '#FFFCF7', border: '1.5px solid #DDD4C0', borderRadius: 18 },
  cardHdr: { background: '#EDE5D3', borderBottom: '1.5px solid #DDD4C0', borderRadius: '16px 16px 0 0', padding: '10px 18px' },
  cardTitle: { fontSize: 10, fontWeight: 900, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: '#4A3F35' },
  body: { padding: '20px 18px' },
  btn: (color = '#1A3050') => ({
    background: color, color: '#FFF8EE', border: 'none', borderRadius: 12,
    padding: '13px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-block',
  }),
  ghost: { background: 'none', border: '2px solid #DDD4C0', borderRadius: 12, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#4A3F35' },
  big: { fontSize: 48, fontWeight: 900, color: '#1A3050', textAlign: 'center' as const, margin: '12px 0' },
  label: { fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8A7D70', marginBottom: 4 },
}

function pbKey(childId: string, drill: string) {
  return `brain_pb_${childId}_${drill}`
}

function getPB(childId: string, drill: string): number | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(pbKey(childId, drill))
  return v ? Number(v) : null
}

function setPB(childId: string, drill: string, value: number) {
  if (typeof window === 'undefined') return
  const cur = getPB(childId, drill)
  if (cur === null || value < cur) {
    localStorage.setItem(pbKey(childId, drill), String(value))
  }
}

// ── Reaction Timer ─────────────────────────────────────────────────────────
function ReactionDrill({ childId, onBack }: { childId: string; onBack: () => void }) {
  const [state, setState] = useState<'wait' | 'ready' | 'go' | 'done' | 'toosoon'>('wait')
  const [times, setTimes] = useState<number[]>([])
  const [startTime, setStartTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ROUNDS = 5

  const pb = getPB(childId, 'reaction')

  const next = useCallback(() => {
    setState('ready')
    const delay = 1500 + Math.random() * 2500
    timerRef.current = setTimeout(() => {
      setStartTime(Date.now())
      setState('go')
    }, delay)
  }, [])

  const handleClick = () => {
    if (state === 'wait') {
      next()
    } else if (state === 'ready') {
      if (timerRef.current) clearTimeout(timerRef.current)
      setState('toosoon')
    } else if (state === 'toosoon') {
      next()
    } else if (state === 'go') {
      const rt = Date.now() - startTime
      const newTimes = [...times, rt]
      setTimes(newTimes)
      if (newTimes.length >= ROUNDS) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length)
        setPB(childId, 'reaction', avg)
        setState('done')
      } else {
        setState('ready')
        const delay = 1500 + Math.random() * 2500
        timerRef.current = setTimeout(() => {
          setStartTime(Date.now())
          setState('go')
        }, delay)
      }
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
  const bgColor = state === 'go' ? '#22C55E' : state === 'toosoon' ? '#EF4444' : state === 'ready' ? '#94A3B8' : '#1A3050'
  const label = state === 'wait' ? 'TAP TO BEGIN' : state === 'ready' ? 'WAIT FOR GREEN…' : state === 'go' ? 'TAP NOW!' : state === 'toosoon' ? 'TOO SOON — TAP AGAIN' : ''

  return (
    <div>
      <div style={S.cardHdr}><span style={S.cardTitle}>⚡ Reaction Timer</span></div>
      <div style={S.body}>
        {state !== 'done' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#8A7D70', fontWeight: 700 }}>Round {Math.min(times.length + 1, ROUNDS)} of {ROUNDS}</span>
            </div>
            <div
              onClick={handleClick}
              style={{
                background: bgColor, borderRadius: 20, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background .15s', userSelect: 'none',
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>{label}</span>
            </div>
            {times.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                {times.map((t, i) => (
                  <span key={i} style={{ background: '#EDE5D3', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 800, color: '#1A3050' }}>
                    {t}ms
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#8A7D70', marginBottom: 4 }}>AVERAGE</div>
            <div style={S.big}>{avg}ms</div>
            {pb !== null && avg < pb && (
              <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '8px 16px', marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#166534' }}>
                🏆 New personal best! (was {pb}ms)
              </div>
            )}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
              {times.map((t, i) => (
                <span key={i} style={{ background: '#EDE5D3', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 800, color: '#1A3050' }}>{t}ms</span>
              ))}
            </div>
            {pb !== null && avg >= pb && <div style={{ fontSize: 12, color: '#8A7D70', marginBottom: 12 }}>Personal best: {pb}ms</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={S.btn()} onClick={() => { setTimes([]); setState('wait') }}>Play Again</button>
              <button style={S.ghost} onClick={onBack}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Number Flash ────────────────────────────────────────────────────────────
function NumFlashDrill({ childId, onBack }: { childId: string; onBack: () => void }) {
  const [phase, setPhase] = useState<'show' | 'input' | 'result' | 'done'>('show')
  const [span, setSpan] = useState(4)
  const [sequence, setSequence] = useState<string>('')
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const pb = getPB(childId, 'numflash')

  const generate = useCallback((len: number) => {
    const digits = Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('')
    setSequence(digits)
    setPhase('show')
    setTimeout(() => {
      setPhase('input')
      setTimeout(() => inputRef.current?.focus(), 50)
    }, 1800 + len * 150)
  }, [])

  useEffect(() => { generate(span) }, [])

  const submit = () => {
    const trimmed = input.trim().replace(/\s/g, '')
    if (trimmed === sequence) {
      const newSpan = span + 1
      const newStreak = streak + 1
      setCorrect(c => c + 1)
      setStreak(newStreak)
      setSpan(newSpan)
      if (correct + 1 >= 8) {
        setPB(childId, 'numflash', newSpan)
        setPhase('done')
        return
      }
      setInput('')
      generate(newSpan)
    } else {
      const newWrong = wrong + 1
      setWrong(newWrong)
      setStreak(0)
      setPhase('result')
    }
  }

  return (
    <div>
      <div style={S.cardHdr}><span style={S.cardTitle}>🔢 Number Flash</span></div>
      <div style={S.body}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: '#8A7D70', fontWeight: 700 }}>Span: {span} digits</span>
          <span style={{ fontSize: 12, color: '#8A7D70', fontWeight: 700 }}>✅ {correct} &nbsp; ❌ {wrong}</span>
        </div>

        {phase === 'show' && (
          <div style={{ background: '#1A3050', borderRadius: 16, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: '#FFF8EE', letterSpacing: 10 }}>{sequence}</span>
          </div>
        )}

        {phase === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#EDE5D3', borderRadius: 16, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 18, fontWeight: 800, color: '#8A7D70' }}>
              Type the numbers you saw
            </div>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ fontSize: 36, fontWeight: 900, textAlign: 'center', width: '100%', border: '2.5px solid #DDD4C0', borderRadius: 12, padding: '12px', background: '#FFFCF7', color: '#1A3050', outline: 'none', letterSpacing: 6 }}
              maxLength={span + 2}
              autoComplete="off"
              inputMode="numeric"
            />
            <div style={{ marginTop: 14 }}>
              <button style={S.btn()} onClick={submit}>Submit</button>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginBottom: 6 }}>The sequence was</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#1A3050', letterSpacing: 8 }}>{sequence}</div>
              <div style={{ fontSize: 14, color: '#8A7D70', marginTop: 6 }}>You typed: <strong>{input}</strong></div>
            </div>
            <button style={S.btn()} onClick={() => { setInput(''); generate(Math.max(4, span - 1)) }}>Try Again (+1 harder)</button>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#8A7D70', marginBottom: 4 }}>TOP SPAN REACHED</div>
            <div style={S.big}>{span} digits</div>
            {pb !== null && span > pb && (
              <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '8px 16px', marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#166534' }}>
                🏆 New personal best!
              </div>
            )}
            {pb !== null && span <= pb && <div style={{ fontSize: 12, color: '#8A7D70', marginBottom: 12 }}>Personal best: {pb} digits</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={S.btn()} onClick={() => { setSpan(4); setCorrect(0); setWrong(0); setStreak(0); setInput(''); generate(4) }}>Play Again</button>
              <button style={S.ghost} onClick={onBack}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Math Sprint ─────────────────────────────────────────────────────────────
function MathSprintDrill({ childId, grade, onBack }: { childId: string; grade: number; onBack: () => void }) {
  const DURATION = 90
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [q, setQ] = useState<{ text: string; answer: number } | null>(null)
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pb = getPB(childId, 'mathsprint')

  function genQuestion() {
    const ops = grade >= 7 ? ['+', '-', '×', '÷'] : ['+', '-', '×']
    const op = ops[Math.floor(Math.random() * ops.length)]
    let a: number, b: number, answer: number, text: string
    if (op === '+') { a = Math.floor(Math.random() * (grade >= 7 ? 200 : 50)) + 10; b = Math.floor(Math.random() * (grade >= 7 ? 200 : 50)) + 10; answer = a + b; text = `${a} + ${b}` }
    else if (op === '-') { a = Math.floor(Math.random() * 90) + 20; b = Math.floor(Math.random() * a); answer = a - b; text = `${a} − ${b}` }
    else if (op === '×') { a = Math.floor(Math.random() * (grade >= 7 ? 15 : 12)) + 2; b = Math.floor(Math.random() * (grade >= 7 ? 15 : 12)) + 2; answer = a * b; text = `${a} × ${b}` }
    else { b = Math.floor(Math.random() * 11) + 2; answer = Math.floor(Math.random() * 11) + 2; a = answer * b; text = `${a} ÷ ${b}` }
    return { text, answer }
  }

  const start = () => {
    setPhase('playing')
    setQ(genQuestion())
    setTimeout(() => inputRef.current?.focus(), 50)
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const submit = () => {
    const val = parseInt(input.trim())
    if (isNaN(val) || !q) return
    if (val === q.answer) {
      setScore(s => s + 1)
      setFlash('correct')
    } else {
      setWrong(w => w + 1)
      setFlash('wrong')
    }
    setInput('')
    setQ(genQuestion())
    setTimeout(() => setFlash(null), 200)
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const finalScore = score
  useEffect(() => {
    if (phase === 'done') setPB(childId, 'mathsprint', -finalScore)
  }, [phase])

  const pct = (timeLeft / DURATION) * 100
  const timerColor = pct > 50 ? '#22C55E' : pct > 25 ? '#F59E0B' : '#EF4444'

  return (
    <div>
      <div style={S.cardHdr}><span style={S.cardTitle}>🧮 90-Second Math Sprint</span></div>
      <div style={S.body}>
        {phase === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: '#4A3F35', lineHeight: 1.6, marginBottom: 20 }}>
              Answer as many math problems as you can in 90 seconds.<br />
              <strong>Grade {grade} level</strong> — addition, subtraction, multiplication{grade >= 7 ? ', division' : ''}.
            </div>
            {pb !== null && <div style={{ fontSize: 13, color: '#8A7D70', marginBottom: 16 }}>Your best: {-pb} correct</div>}
            <button style={S.btn()} onClick={start}>Start!</button>
          </div>
        )}

        {phase === 'playing' && q && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1A3050' }}>✅ {score}</span>
            </div>
            <div style={{ height: 6, background: '#EDE5D3', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: timerColor, borderRadius: 3, transition: 'width 1s linear, background .3s' }} />
            </div>
            <div style={{
              background: flash === 'correct' ? '#DCFCE7' : flash === 'wrong' ? '#FEF2F2' : '#EDE5D3',
              borderRadius: 16, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s', marginBottom: 16,
            }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#1A3050' }}>{q.text}</span>
            </div>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ fontSize: 32, fontWeight: 900, textAlign: 'center', width: '100%', border: '2.5px solid #DDD4C0', borderRadius: 12, padding: '10px', background: '#FFFCF7', color: '#1A3050', outline: 'none' }}
              autoComplete="off"
              inputMode="numeric"
              placeholder="?"
            />
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#8A7D70', marginBottom: 4 }}>SCORE</div>
            <div style={S.big}>{score}</div>
            <div style={{ fontSize: 14, color: '#8A7D70', marginBottom: 16 }}>{wrong} wrong · {score + wrong} attempted</div>
            {pb !== null && score > -pb && (
              <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '8px 16px', marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#166534' }}>
                🏆 New personal best!
              </div>
            )}
            {pb !== null && score <= -pb && <div style={{ fontSize: 12, color: '#8A7D70', marginBottom: 12 }}>Personal best: {-pb} correct</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={S.btn()} onClick={() => { setScore(0); setWrong(0); setTimeLeft(DURATION); setInput(''); setQ(null); setPhase('ready') }}>Play Again</button>
              <button style={S.ghost} onClick={onBack}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Pattern Memory ──────────────────────────────────────────────────────────
function PatternDrill({ childId, onBack }: { childId: string; onBack: () => void }) {
  const SIZE = 4
  const CELLS = SIZE * SIZE
  const [phase, setPhase] = useState<'show' | 'recall' | 'result' | 'done'>('show')
  const [round, setRound] = useState(1)
  const [lit, setLit] = useState<boolean[]>([])
  const [guess, setGuess] = useState<boolean[]>(Array(CELLS).fill(false))
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<Array<{ correct: number; total: number }>>([])

  const pb = getPB(childId, 'pattern')

  function genPattern(count: number) {
    const arr = Array(CELLS).fill(false)
    const indices = Array.from({ length: CELLS }, (_, i) => i).sort(() => Math.random() - .5).slice(0, count)
    indices.forEach(i => { arr[i] = true })
    return arr
  }

  function startRound(r: number) {
    const count = Math.min(4 + Math.floor(r / 2), 12)
    const pattern = genPattern(count)
    setLit(pattern)
    setGuess(Array(CELLS).fill(false))
    setPhase('show')
    setTimeout(() => setPhase('recall'), 2000 + r * 100)
  }

  useEffect(() => { startRound(1) }, [])

  function toggle(i: number) {
    if (phase !== 'recall') return
    setGuess(g => { const n = [...g]; n[i] = !n[i]; return n })
  }

  function submit() {
    let correct = 0
    for (let i = 0; i < CELLS; i++) {
      if (guess[i] === lit[i]) correct++
    }
    const total = lit.filter(Boolean).length
    const matched = lit.filter((v, i) => v && guess[i]).length
    setResults(r => [...r, { correct: matched, total }])
    const newScore = score + matched
    setScore(newScore)
    setPhase('result')
    if (round >= 6) {
      setTimeout(() => {
        setPB(childId, 'pattern', -newScore)
        setPhase('done')
      }, 1200)
    } else {
      setTimeout(() => {
        setRound(r => r + 1)
        startRound(round + 1)
      }, 1200)
    }
  }

  const cellBg = (i: number) => {
    if (phase === 'show') return lit[i] ? '#1A3050' : '#EDE5D3'
    if (phase === 'recall') return guess[i] ? '#1A3050' : '#EDE5D3'
    if (phase === 'result') {
      if (lit[i] && guess[i]) return '#22C55E'
      if (lit[i] && !guess[i]) return '#EF4444'
      if (!lit[i] && guess[i]) return '#F59E0B'
      return '#EDE5D3'
    }
    return '#EDE5D3'
  }

  return (
    <div>
      <div style={S.cardHdr}><span style={S.cardTitle}>🟦 Pattern Memory</span></div>
      <div style={S.body}>
        {phase !== 'done' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#8A7D70' }}>Round {round}/6</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1A3050' }}>Score: {score}</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: phase === 'show' ? '#1A3050' : phase === 'recall' ? '#B45309' : '#166534', marginBottom: 12, letterSpacing: 1 }}>
              {phase === 'show' ? 'MEMORISE THE PATTERN' : phase === 'recall' ? 'TAP WHAT YOU SAW' : 'RESULT'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: 8, marginBottom: 16 }}>
              {Array(CELLS).fill(0).map((_, i) => (
                <div
                  key={i}
                  onClick={() => toggle(i)}
                  style={{
                    height: 64, borderRadius: 10, background: cellBg(i),
                    cursor: phase === 'recall' ? 'pointer' : 'default',
                    transition: 'background .15s',
                    border: '2px solid rgba(0,0,0,.06)',
                  }}
                />
              ))}
            </div>
            {phase === 'recall' && (
              <div style={{ textAlign: 'center' }}>
                <button style={S.btn()} onClick={submit}>Submit</button>
              </div>
            )}
          </>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#8A7D70', marginBottom: 4 }}>TOTAL SCORE</div>
            <div style={S.big}>{score}</div>
            {pb !== null && score > -pb && (
              <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '8px 16px', marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#166534' }}>
                🏆 New personal best!
              </div>
            )}
            {pb !== null && score <= -pb && <div style={{ fontSize: 12, color: '#8A7D70', marginBottom: 12 }}>Personal best: {-pb} points</div>}
            <div style={{ marginBottom: 16, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              {results.map((r, i) => (
                <span key={i} style={{ background: '#EDE5D3', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 800, color: '#1A3050' }}>
                  R{i + 1}: {r.correct}/{r.total}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={S.btn()} onClick={() => { setRound(1); setScore(0); setResults([]); setGuess(Array(CELLS).fill(false)); startRound(1) }}>Play Again</button>
              <button style={S.ghost} onClick={onBack}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Menu ───────────────────────────────────────────────────────────────────
const DRILLS = [
  { id: 'reaction' as Drill, icon: '⚡', label: 'Reaction Timer', desc: 'How fast is your brain? Test your reaction speed across 5 rounds.', color: '#FEF3C7', border: '#FCD34D' },
  { id: 'numflash' as Drill, icon: '🔢', label: 'Number Flash', desc: 'See a sequence, then type it back. Can you reach 10 digits?', color: '#EFF6FF', border: '#BFDBFE' },
  { id: 'mathsprint' as Drill, icon: '🧮', label: 'Math Sprint', desc: '90 seconds, as many problems as you can. Beat your score.', color: '#F0FDF4', border: '#86EFAC' },
  { id: 'pattern' as Drill, icon: '🟦', label: 'Pattern Memory', desc: 'Memorise the grid, then recreate it. 6 rounds, increasing complexity.', color: '#FAF5FF', border: '#D8B4FE' },
]

export default function BrainLabPage() {
  const params = useParams()
  const router = useRouter()
  const childId = (params.childId as string) || 'jus'
  const child = CHILD_INFO[childId as keyof typeof CHILD_INFO] || CHILD_INFO.jus

  const [drill, setDrill] = useState<Drill>('menu')

  const reactionPB = getPB(childId, 'reaction')
  const numflashPB = getPB(childId, 'numflash')
  const mathsprintPB = getPB(childId, 'mathsprint')
  const patternPB = getPB(childId, 'pattern')

  const pbMap: Record<string, string> = {
    reaction: reactionPB !== null ? `Best: ${reactionPB}ms` : '',
    numflash: numflashPB !== null ? `Best: ${numflashPB} digits` : '',
    mathsprint: mathsprintPB !== null ? `Best: ${-mathsprintPB} correct` : '',
    pattern: patternPB !== null ? `Best: ${-patternPB} pts` : '',
  }

  return (
    <div style={S.page}>
      <header style={S.hdr}>
        <button onClick={() => drill === 'menu' ? router.push(`/dashboard/${childId}`) : setDrill('menu')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,248,238,.5)', padding: 0 }}>
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </button>
        <div>
          <div style={S.hdrTitle}>⚡ Brain Lab — {child.name}</div>
          <div style={S.hdrSub}>Speed · Memory · Focus</div>
        </div>
      </header>

      <main style={S.main}>
        {drill === 'menu' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              {DRILLS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDrill(d.id)}
                  style={{
                    background: d.color, border: `2px solid ${d.border}`, borderRadius: 18,
                    padding: '18px 16px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{d.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#1C1410' }}>{d.label}</span>
                  <span style={{ fontSize: 12, color: '#8A7D70', lineHeight: 1.4 }}>{d.desc}</span>
                  {pbMap[d.id] && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#1A3050', marginTop: 2, background: 'rgba(26,48,80,.08)', borderRadius: 6, padding: '2px 8px', display: 'inline-block' }}>
                      🏆 {pbMap[d.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ ...S.card, textAlign: 'center' }}>
              <div style={S.cardHdr}><span style={S.cardTitle}>About Brain Lab</span></div>
              <div style={{ ...S.body, fontSize: 13, color: '#8A7D70', lineHeight: 1.7 }}>
                Daily drills train the same cognitive systems that power fast reading, quick calculation, and focused learning.
                Personal bests are saved so you can track improvement over time.
              </div>
            </div>
          </>
        )}

        {drill !== 'menu' && (
          <div style={S.card}>
            {drill === 'reaction' && <ReactionDrill childId={childId} onBack={() => setDrill('menu')} />}
            {drill === 'numflash' && <NumFlashDrill childId={childId} onBack={() => setDrill('menu')} />}
            {drill === 'mathsprint' && <MathSprintDrill childId={childId} grade={child.grade} onBack={() => setDrill('menu')} />}
            {drill === 'pattern' && <PatternDrill childId={childId} onBack={() => setDrill('menu')} />}
          </div>
        )}
      </main>
    </div>
  )
}

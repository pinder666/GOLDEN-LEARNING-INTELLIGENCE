'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Zap, Target, Brain, Trophy, RotateCcw, Play, X } from 'lucide-react'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

// ─── TYPES ──────────────────────────────────────────────────────────────────

type ReactionPhase = 'idle' | 'wait' | 'go' | 'result' | 'done'
type ServeZone = 'T' | 'Wide' | 'Body'
type ReturnDir = 'cross-court' | 'down-the-line' | 'middle'
type TacticalChoice = { id: string; label: string; correct: boolean; explanation: string }

// ─── TACTICAL IQ SCENARIOS ───────────────────────────────────────────────────

const TACTICAL_SCENARIOS = [
  {
    situation: 'Your opponent hits a wide serve out wide to your backhand on deuce court. You return — where do you hit?',
    score: '4-4, 30-30',
    court: 'Deuce court',
    choices: [
      { id: 'a', label: 'Cross-court backhand', correct: true, explanation: 'Cross-court is the highest percentage return — longest part of the net, most court to hit into, and it neutralizes the angle.' },
      { id: 'b', label: 'Down-the-line to their forehand', correct: false, explanation: 'Down-the-line from a wide position means hitting over the highest part of the net with almost no court to land in. Very low percentage.' },
      { id: 'c', label: 'Short angle drop shot', correct: false, explanation: 'Aggressive but risky on a return when you\'re pulled wide. Your opponent has time to run it down.' },
    ],
  },
  {
    situation: 'You\'re at net after a solid approach shot. Your opponent throws up a high lob over your backhand side.',
    score: '5-5, 40-30',
    court: 'Ad court',
    choices: [
      { id: 'a', label: 'Let it bounce and hit an overhead', correct: false, explanation: 'Sometimes fine, but a high backhand lob that lands past you is a lost point if you don\'t move.' },
      { id: 'b', label: 'Turn, sprint back, hit a topspin lob back', correct: false, explanation: 'Can work but very difficult. If you don\'t get depth, your opponent has an easy putaway.' },
      { id: 'c', label: 'Scissor kick overhead smash (or retreat and reset)', correct: true, explanation: 'If you can reach it — scissors kick overhead. If not — reset to the baseline and re-build the point. Don\'t panic-swing from mid-court.' },
    ],
  },
  {
    situation: 'You\'re serving at 30-40 (break point against you). You\'ve hit two double faults this game. What do you serve?',
    score: '5-6 third set',
    court: 'Deuce',
    choices: [
      { id: 'a', label: 'Flat bomb to the T — go for it', correct: false, explanation: 'High risk on a break point. One double fault could lose the match. Not the right time to gamble.' },
      { id: 'b', label: 'Kick serve high to the backhand', correct: true, explanation: 'A kick serve is heavy and high — hardest ball to attack. Goes to the backhand (usually weaker). Gets you IN the point safely. At 30-40, staying in the point beats gambling.' },
      { id: 'c', label: 'Slow spinner to the body', correct: false, explanation: 'Too passive. Gives your opponent an easy ball to attack, especially if they\'re returning well today.' },
    ],
  },
  {
    situation: 'The score is tied in a tiebreak at 6-6. Your opponent is standing 2 feet behind the baseline. Where do you aim your serve?',
    score: 'Tiebreak 6-6',
    court: 'First serve',
    choices: [
      { id: 'a', label: 'Hard and flat to the T — force them to move laterally', correct: false, explanation: 'Good option normally, but they\'re already deep — they can handle pace more easily from there.' },
      { id: 'b', label: 'Kick serve that bounces high and pushes them even further back', correct: false, explanation: 'More depth doesn\'t hurt them much since they\'re already back.' },
      { id: 'c', label: 'Slice serve wide to pull them off the court', correct: true, explanation: 'A wide slice serve stretches them sideways — their defensive position behind the baseline can\'t help them run wide AND cover the open court on the return. Opens the court perfectly.' },
    ],
  },
  {
    situation: 'You\'re winning 5-3 in the third set. Your opponent is starting to go for more on every shot — more errors but more winners too. What do you do?',
    score: '5-3 third set',
    court: 'Your serve',
    choices: [
      { id: 'a', label: 'Match their aggression — hit bigger yourself', correct: false, explanation: 'This plays into their gameplan. When a player is going for broke, don\'t trade bombs with them.' },
      { id: 'b', label: 'Keep the ball in play — let them miss', correct: true, explanation: 'When an opponent is gambling to come back, play percentage tennis. Make them win the points — don\'t give them the chance to go for it on a short ball. Consistency under pressure closes out matches.' },
      { id: 'c', label: 'Slow everything down with lots of drop shots', correct: false, explanation: 'Drop shots take energy and concentration — risky to add new patterns when you\'re closing out a match. Stick to what got you to 5-3.' },
    ],
  },
]

// ─── REACTION TRAINER ────────────────────────────────────────────────────────

function ReactionTrainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<ReactionPhase>('idle')
  const [serveZone, setServeZone] = useState<ServeZone>('T')
  const [reactionMs, setReactionMs] = useState<number | null>(null)
  const [scores, setScores] = useState<number[]>([])
  const [round, setRound] = useState(0)
  const goTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const TOTAL_ROUNDS = 10
  const ZONES: ServeZone[] = ['T', 'Wide', 'Body']
  const RETURN_MAP: Record<ServeZone, ReturnDir> = {
    T: 'cross-court',
    Wide: 'down-the-line',
    Body: 'middle',
  }

  function drawCourt(zone?: ServeZone, hit?: boolean) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width, h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Court background
    ctx.fillStyle = '#1a5c2a'
    ctx.fillRect(0, 0, w, h)

    // Court lines
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2

    const ml = 40, mr = w - 40, mt = 20, mb = h - 20
    const midY = (mt + mb) / 2
    const svcLine = mt + (mb - mt) * 0.4

    // Baselines
    ctx.strokeRect(ml, mt, mr - ml, mb - mt)
    // Net
    ctx.beginPath(); ctx.moveTo(ml, midY); ctx.lineTo(mr, midY); ctx.stroke()
    // Centre line (opponent side)
    const midX = (ml + mr) / 2
    ctx.beginPath(); ctx.moveTo(midX, mt); ctx.lineTo(midX, svcLine); ctx.stroke()
    // Service boxes
    ctx.beginPath(); ctx.moveTo(ml, svcLine); ctx.lineTo(mr, svcLine); ctx.stroke()
    // Sidelines (singles)
    const sl = ml + 20, sr = mr - 20
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath(); ctx.moveTo(sl, mt); ctx.lineTo(sl, mb); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(sr, mt); ctx.lineTo(sr, mb); ctx.stroke()

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('OPPONENT', midX, mt + 14)
    ctx.fillText('YOU', midX, mb - 8)

    if (zone) {
      // Serve flash
      const zoneColors: Record<ServeZone, string> = { T: '#fbbf24', Wide: '#60a5fa', Body: '#f87171' }
      const color = hit ? '#4ade80' : zoneColors[zone]
      ctx.font = 'bold 13px monospace'
      ctx.fillStyle = color
      ctx.textAlign = 'center'

      const positions: Record<ServeZone, [number, number]> = {
        T: [midX, svcLine - 12],
        Wide: [sl + 8, svcLine - 12],
        Body: [midX + 30, svcLine - 12],
      }
      const [zx, zy] = positions[zone]

      ctx.beginPath()
      ctx.arc(zx, zy, 14, 0, Math.PI * 2)
      ctx.fillStyle = color + '30'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = color
      ctx.font = 'bold 11px monospace'
      ctx.fillText(zone, zx, zy + 4)

      // Return hint arrow
      const returnDir = RETURN_MAP[zone]
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '10px monospace'
      ctx.fillText(`→ ${returnDir}`, midX, mb - 26)
    }
  }

  useEffect(() => { drawCourt() }, [])

  function startRound() {
    const zone = ZONES[Math.floor(Math.random() * 3)]
    setServeZone(zone)
    setPhase('wait')
    setReactionMs(null)

    drawCourt()

    const delay = 800 + Math.random() * 1500
    timeoutRef.current = setTimeout(() => {
      setPhase('go')
      goTimeRef.current = Date.now()
      drawCourt(zone)
    }, delay)
  }

  function handleResponse() {
    if (phase !== 'go') return
    const ms = Date.now() - goTimeRef.current
    setReactionMs(ms)
    setPhase('result')
    const newScores = [...scores, ms]
    setScores(newScores)
    drawCourt(serveZone, true)

    setTimeout(() => {
      const nextRound = round + 1
      setRound(nextRound)
      if (nextRound >= TOTAL_ROUNDS) {
        setPhase('done')
      } else {
        startRound()
      }
    }, 1200)
  }

  function reset() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setPhase('idle')
    setScores([])
    setRound(0)
    setReactionMs(null)
    drawCourt()
  }

  const avgMs = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const bestMs = scores.length ? Math.min(...scores) : null

  function getRating(ms: number) {
    if (ms < 250) return { label: 'ELITE', color: 'text-yellow-400' }
    if (ms < 350) return { label: 'PRO', color: 'text-green-400' }
    if (ms < 450) return { label: 'GOOD', color: 'text-blue-400' }
    return { label: 'TRAIN MORE', color: 'text-slate-400' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold">Serve Reaction Trainer</p>
          <p className="text-xs text-slate-400">See the serve zone — tap immediately — build sub-400ms reactions</p>
        </div>
        <div className="flex gap-3 text-xs text-slate-400">
          {avgMs && <span>Avg <span className="text-white font-mono">{avgMs}ms</span></span>}
          {bestMs && <span>Best <span className="text-green-400 font-mono">{bestMs}ms</span></span>}
        </div>
      </div>

      {/* Court canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700">
        <canvas
          ref={canvasRef}
          width={500}
          height={320}
          className="w-full cursor-pointer"
          style={{ maxHeight: '320px' }}
          onClick={handleResponse}
        />
        {/* Overlay prompts */}
        {phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <button
              onClick={startRound}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-base flex items-center gap-2"
            >
              <Play className="w-5 h-5" /> Start Session ({TOTAL_ROUNDS} serves)
            </button>
            <p className="text-slate-400 text-xs mt-3">Tap the canvas the moment you see the serve zone</p>
          </div>
        )}
        {phase === 'wait' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-slate-900/80 rounded-2xl px-6 py-3 text-slate-300 font-mono text-sm animate-pulse">
              Ready... watch the court
            </div>
          </div>
        )}
        {phase === 'go' && (
          <div className="absolute top-3 right-3 bg-red-500 text-white font-bold text-xs px-2 py-1 rounded-lg animate-pulse">
            TAP NOW
          </div>
        )}
        {phase === 'result' && reactionMs && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="bg-slate-900/90 rounded-xl px-5 py-2.5 text-center">
              <span className={`font-mono font-bold text-lg ${getRating(reactionMs).color}`}>{reactionMs}ms</span>
              <span className={`ml-2 text-xs font-bold ${getRating(reactionMs).color}`}>{getRating(reactionMs).label}</span>
            </div>
          </div>
        )}
        {phase === 'done' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="bg-slate-800 rounded-2xl p-6 text-center max-w-xs">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <p className="text-white font-bold text-lg mb-1">Session Complete</p>
              {avgMs && <p className="text-slate-300 text-sm">Average: <span className={`font-mono font-bold ${getRating(avgMs).color}`}>{avgMs}ms — {getRating(avgMs).label}</span></p>}
              {bestMs && <p className="text-slate-300 text-sm mt-1">Best: <span className="text-green-400 font-mono font-bold">{bestMs}ms</span></p>}
              <p className="text-xs text-slate-500 mt-2 mb-4">Pro players react at 180–250ms. Under 350ms is good training range.</p>
              <button onClick={reset} className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-sm">
                <RotateCcw className="w-4 h-4" /> Train Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zone legend */}
      <div className="flex gap-3 text-xs">
        {([['T', '#fbbf24', 'Centre of service box — return cross-court'], ['Wide', '#60a5fa', 'Pulls you wide — return down-the-line'], ['Body', '#f87171', 'Jams into your hip — return up the middle']] as const).map(([z, c, tip]) => (
          <div key={z} className="flex items-start gap-1.5 flex-1">
            <div className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{ background: c }} />
            <div>
              <span className="font-bold text-white">{z}</span>
              <span className="text-slate-500 ml-1">{tip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TACTICAL IQ ─────────────────────────────────────────────────────────────

function TacticalIQ() {
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const scenario = TACTICAL_SCENARIOS[idx]

  function choose(id: string) {
    if (chosen) return
    setChosen(id)
    const correct = scenario.choices.find(c => c.id === id)?.correct
    if (correct) setScore(s => s + 1)
  }

  function next() {
    if (idx + 1 >= TACTICAL_SCENARIOS.length) {
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setChosen(null)
    }
  }

  function reset() {
    setIdx(0); setChosen(null); setScore(0); setDone(false)
  }

  if (done) {
    const pct = Math.round((score / TACTICAL_SCENARIOS.length) * 100)
    return (
      <div className="text-center py-8">
        <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <p className="text-white font-bold text-xl mb-1">Tactical IQ: {pct}%</p>
        <p className="text-slate-400 text-sm mb-1">{score}/{TACTICAL_SCENARIOS.length} correct decisions</p>
        <p className="text-xs text-slate-500 mb-6">
          {pct >= 80 ? 'Strong tactical brain. Pro-level decision making.' :
           pct >= 60 ? 'Good instincts. Study the explanations for the ones you missed.' :
           'Keep training — tactical IQ builds with match experience and deliberate study.'}
        </p>
        <button onClick={reset} className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm flex items-center gap-2 mx-auto">
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold">Tactical IQ</p>
          <p className="text-xs text-slate-400">Real match situations — make the right call</p>
        </div>
        <span className="text-xs text-slate-500">{idx + 1}/{TACTICAL_SCENARIOS.length} · {score} correct</span>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <div className="flex gap-2 mb-3">
          <span className="text-xs bg-purple-900/60 border border-purple-800/50 text-purple-300 px-2 py-0.5 rounded-full">{scenario.score}</span>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{scenario.court}</span>
        </div>
        <p className="text-white text-sm leading-relaxed">{scenario.situation}</p>
      </div>

      <div className="space-y-2">
        {scenario.choices.map(c => {
          const isChosen = chosen === c.id
          const isCorrect = c.correct
          let style = 'bg-slate-800/60 border-slate-700 text-slate-200'
          if (chosen) {
            if (isChosen && isCorrect) style = 'bg-green-950/60 border-green-700 text-green-200'
            else if (isChosen && !isCorrect) style = 'bg-red-950/60 border-red-700 text-red-200'
            else if (!isChosen && isCorrect) style = 'bg-green-950/40 border-green-800/40 text-green-300'
          }
          return (
            <button
              key={c.id}
              onClick={() => choose(c.id)}
              disabled={!!chosen}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${style} disabled:cursor-default`}
            >
              <p className="font-medium">{c.label}</p>
              {chosen && isChosen && (
                <p className="text-xs mt-1.5 opacity-80">{c.explanation}</p>
              )}
              {chosen && !isChosen && isCorrect && (
                <p className="text-xs mt-1.5 opacity-70">{c.explanation}</p>
              )}
            </button>
          )
        })}
      </div>

      {chosen && (
        <button
          onClick={next}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm"
        >
          {idx + 1 < TACTICAL_SCENARIOS.length ? 'Next Situation' : 'See Results'}
        </button>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    id: 'reaction',
    name: 'Reaction Trainer',
    tag: 'Built for GLI',
    desc: 'Sub-400ms serve reactions. See the zone — tap immediately. 10-round sessions with rating.',
    icon: Zap,
    color: 'from-yellow-400 to-amber-500',
    custom: true,
  },
  {
    id: 'tactical',
    name: 'Tactical IQ',
    tag: 'Built for GLI',
    desc: 'Real match situations. Make the right call — kick serve vs flat, cross-court vs DTL, close out vs gamble.',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    custom: true,
  },
  {
    id: 'tennisgame',
    name: 'Tennis Game',
    tag: 'Open Source · itsparthmerai',
    desc: 'Playable tennis with topspin, slice, lob, and drive mechanics. HTML5 canvas, no install.',
    icon: Play,
    color: 'from-green-500 to-emerald-600',
    url: '/tennis-games/tennisgame/index.html',
    embed: true,
  },
  {
    id: 'spacetennis',
    name: '3D Court (SpaceTennis)',
    tag: 'Open Source · rui-exe · MIT',
    desc: 'Three.js rendered 3D tennis court. Court geometry fully reskinnable with any textures.',
    icon: Target,
    color: 'from-blue-500 to-cyan-600',
    url: '/tennis-games/spacetennis/index.html',
    embed: true,
  },
  {
    id: 'courthive',
    name: 'CourtHive / TMX',
    tag: 'Open Source · TypeScript · MIT',
    desc: 'Full tournament management — draws, brackets, scheduling, live scoring. Real tournament software.',
    icon: Trophy,
    color: 'from-orange-500 to-amber-600',
    url: 'https://courthive.com/',
    embed: false,
    external: true,
  },
  {
    id: 'matchchart',
    name: 'Match Charting Data',
    tag: 'JeffSackmann · CC BY-NC-SA',
    desc: 'Every shot from thousands of pro matches — direction, type, depth. The dataset the pros use for analysis.',
    icon: Target,
    color: 'from-slate-500 to-zinc-600',
    url: 'https://github.com/JeffSackmann/tennis_MatchChartingProject',
    embed: false,
    external: true,
  },
]

export default function TennisWingPage() {
  const params = useParams()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 8 }
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeTool = TOOLS.find(t => t.id === activeId)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${childId}`} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-white font-bold">Tennis Wing</h1>
              <p className="text-slate-400 text-xs mt-0.5">{child.name} · Reaction · Tactics · Games · Data</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-300 text-xs font-semibold">Going Pro</span>
          </div>
        </div>
      </header>

      {/* Fullscreen embed for open-source games */}
      {activeId && activeTool && !activeTool.custom && activeTool.embed && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveId(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <p className="text-white font-bold text-sm">{activeTool.name}</p>
              <span className="text-xs text-slate-500">{activeTool.tag}</span>
            </div>
            <a href={activeTool.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
              <ExternalLink className="w-4 h-4" /> Open in tab
            </a>
          </div>
          <iframe src={activeTool.url} className="flex-1 w-full border-0" title={activeTool.name} />
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── TOOL GRID ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(tool => {
            const Icon = tool.icon
            return (
              <div key={tool.id} className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 flex flex-col gap-3 hover:border-slate-500 transition-all">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-slate-600">{tool.tag}</span>
                </div>
                <div>
                  <p className="font-bold text-white">{tool.name}</p>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{tool.desc}</p>
                </div>
                <button
                  onClick={() => {
                    if (tool.custom) setActiveId(activeId === tool.id ? null : tool.id)
                    else if (tool.embed) setActiveId(tool.id)
                    else if (tool.external && tool.url) window.open(tool.url, '_blank')
                  }}
                  className={`mt-auto w-full py-2.5 rounded-xl bg-gradient-to-r ${tool.color} text-black font-semibold text-sm flex items-center justify-center gap-2`}
                >
                  {tool.external ? <><ExternalLink className="w-4 h-4" /> Open</> : <><Play className="w-4 h-4" /> {activeId === tool.id && tool.custom ? 'Close' : 'Launch'}</>}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── ACTIVE CUSTOM TOOL ───────────────────────── */}
        {activeId === 'reaction' && (
          <div className="bg-slate-800/60 border border-yellow-500/30 rounded-2xl p-6">
            <ReactionTrainer />
          </div>
        )}
        {activeId === 'tactical' && (
          <div className="bg-slate-800/60 border border-purple-500/30 rounded-2xl p-6">
            <TacticalIQ />
          </div>
        )}

        {/* ── PRO CONTEXT ──────────────────────────────── */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">What the pros actually train</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              { title: 'Reaction Time', stat: '180–250ms', note: 'Average serve reaction time for top 100 WTA/ATP players. Ball at 120mph gives you 0.4 seconds.' },
              { title: 'Tactical Decisions', stat: '40% more rally wins', note: 'Players who hit cross-court returns win 40% more return games than those who go DTL by default (JeffSackmann data).' },
              { title: 'Pattern Recognition', stat: '3–5 shots ahead', note: 'Elite players are 3–5 shots ahead in their mental model. They\'re already planning the winner when they hit the approach.' },
            ].map(item => (
              <div key={item.title} className="bg-slate-900/60 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{item.title}</p>
                <p className="text-white font-bold text-lg font-mono mb-1">{item.stat}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}

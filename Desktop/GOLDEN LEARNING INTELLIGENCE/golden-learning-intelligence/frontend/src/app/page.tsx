'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Access codes — change these to whatever you want
const ACCESS_CODES: Record<string, string> = {
  // code → childId
  'JUS': 'jus',
  'UNI': 'uni',
}

const CHILD_DISPLAY: Record<string, { name: string; color: string; bg: string }> = {
  jus: { name: 'Jus', color: 'from-yellow-400 to-amber-500', bg: 'bg-amber-500/10' },
  uni: { name: 'Uni', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-500/10' },
}

export default function LandingPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [matched, setMatched] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleCodeChange(val: string) {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(upper)
    setError('')

    const childId = ACCESS_CODES[upper]
    if (childId) {
      setMatched(childId)
    } else {
      setMatched(null)
    }
  }

  function handleEnter() {
    const childId = ACCESS_CODES[code]
    if (childId) {
      // Save in session so the app knows who's logged in
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('activeChild', childId)
      }
      router.push(`/dashboard/${childId}`)
    } else {
      setError('That code doesn\'t match anyone. Try again.')
      setCode('')
      setMatched(null)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleEnter()
  }

  const child = matched ? CHILD_DISPLAY[matched] : null

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-12">
        <img
          src="/logo.jpg"
          alt="Golden Learning Intelligence"
          className="w-28 h-28 rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>

      <h1 className="text-white text-2xl font-bold mb-1 tracking-tight">Golden Learning Intelligence</h1>
      <p className="text-slate-500 text-sm mb-10">Enter your access code to begin</p>

      {/* Code input */}
      <div className="w-full max-w-xs">
        <div className={`relative rounded-2xl border-2 transition-all duration-200 ${
          matched
            ? 'border-amber-500 bg-amber-500/5'
            : error
            ? 'border-red-500/60 bg-red-500/5'
            : 'border-slate-700 bg-slate-900'
        }`}>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={e => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={6}
            placeholder="YOUR CODE"
            className="w-full px-6 py-5 bg-transparent text-center text-3xl font-bold tracking-widest text-white placeholder-slate-700 focus:outline-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </div>

        {/* Match feedback */}
        {child && (
          <div className={`mt-4 rounded-xl ${child.bg} border border-white/10 px-5 py-3 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${child.color} flex items-center justify-center text-white font-bold text-lg`}>
              {child.name[0]}
            </div>
            <div>
              <p className="text-white font-semibold">{child.name}</p>
              <p className="text-slate-400 text-xs">Press Enter to start your day</p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleEnter}
          disabled={!matched}
          className="mt-5 w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-base disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
        >
          {matched ? `Start ${child?.name}'s day →` : 'Enter your code'}
        </button>
      </div>

      <p className="mt-8 text-slate-700 text-xs text-center max-w-xs">
        Don't know your code? Ask a parent.
      </p>
    </main>
  )
}

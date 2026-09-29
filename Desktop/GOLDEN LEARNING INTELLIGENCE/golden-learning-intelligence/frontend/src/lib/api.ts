const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.message || error.error || 'API Error')
  }

  return res.json()
}

// Schedule
export const getSchedule = (childId: string) =>
  fetchAPI(`/api/schedule/${childId}`)

// Basics
export const getBasicsStatus = (childId: string) =>
  fetchAPI(`/api/basics/status/${childId}`)

export const submitBasicsTurn = (data: {
  childId: string
  subject: 'math' | 'ela'
  response: string
  conversationHistory: any[]
}) => fetchAPI('/api/basics/turn', {
  method: 'POST',
  body: JSON.stringify(data),
})

// Reasoning Sessions (Harkness)
export const startReasoningSession = (data: {
  childId: string
  childName: string
  childAge: number
  wingKey: string
  sessionType: string
  keyConcept?: string
  globalContext?: string
  topic?: string
}) => fetchAPI('/api/reasoning/start', {
  method: 'POST',
  body: JSON.stringify(data),
})

export const submitReasoningTurn = (data: {
  wingKey: string
  childName: string
  childAge: number
  sessionType: string
  keyConcept?: string
  globalContext?: string
  conversationHistory: any[]
  childInput: string
}) => fetchAPI('/api/reasoning/turn', {
  method: 'POST',
  body: JSON.stringify(data),
})

// Chess
export const getChessStatus = (playerId: string) =>
  fetchAPI(`/api/chess/status/${playerId}`)

export const getChessPending = (playerId: string) =>
  fetchAPI(`/api/chess/pending/${playerId}`)

export const createChessGame = (whitePlayerId: string) =>
  fetchAPI('/api/chess/game/new', {
    method: 'POST',
    body: JSON.stringify({ whitePlayerId }),
  })

export const makeChessMove = (data: {
  gameId: string
  playerId: string
  move: { from: string; to: string; fen: string }
}) => fetchAPI('/api/chess/move', {
  method: 'POST',
  body: JSON.stringify(data),
})

export const getChessStandings = () =>
  fetchAPI('/api/chess/standings')

export const getChessPuzzle = () =>
  fetchAPI('/api/chess/puzzle')

// Curriculum check
export const getCurriculumStatus = () =>
  fetchAPI('/api/curriculum-status')

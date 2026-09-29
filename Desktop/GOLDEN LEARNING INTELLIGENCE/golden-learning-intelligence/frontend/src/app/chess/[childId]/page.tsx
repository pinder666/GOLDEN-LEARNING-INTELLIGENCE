'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Trophy,
  Clock,
  Lightbulb,
  RotateCcw,
  Flag,
  Swords,
} from 'lucide-react'
import { Chess, Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import {
  getChessStatus,
  getChessPending,
  createChessGame,
  makeChessMove,
  getChessStandings,
  getChessPuzzle,
} from '@/lib/api'

const CHILD_INFO: Record<string, { name: string }> = {
  jus: { name: 'Jus' },
  uni: { name: 'Uni' },
}

interface GameState {
  id: string
  white: string
  black: string
  fen: string
  current_turn: string
  status: string
  moves: any[]
}

export default function ChessPage() {
  const params = useParams()
  const router = useRouter()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Player' }
  const opponent = childId === 'jus' ? 'Uni' : 'Jus'

  const [game, setGame] = useState<Chess>(new Chess())
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [standings, setStandings] = useState<any>(null)
  const [puzzle, setPuzzle] = useState<any>(null)
  const [isYourTurn, setIsYourTurn] = useState(false)
  const [thinkingPrompt, setThinkingPrompt] = useState('')
  const [moveFrom, setMoveFrom] = useState<Square | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPuzzle, setShowPuzzle] = useState(false)

  const THINKING_PROMPTS = [
    "What is your opponent threatening?",
    "Can you improve your worst-placed piece?",
    "Look for checks, captures, and threats — in that order.",
    "Which of their pieces is undefended?",
    "If you could move twice, what would you do?",
  ]

  useEffect(() => {
    async function loadChessData() {
      try {
        const [statusData, standingsData, puzzleData] = await Promise.all([
          getChessPending(childId).catch(() => null),
          getChessStandings().catch(() => null),
          getChessPuzzle().catch(() => null),
        ])

        if (statusData?.game) {
          setGameState(statusData.game)
          const chess = new Chess(statusData.game.fen)
          setGame(chess)
          setIsYourTurn(statusData.hasPendingMove)
        }

        if (standingsData?.standings) {
          setStandings(standingsData.standings)
        }

        if (puzzleData?.puzzle) {
          setPuzzle(puzzleData.puzzle)
        }

        // Set random thinking prompt
        setThinkingPrompt(THINKING_PROMPTS[Math.floor(Math.random() * THINKING_PROMPTS.length)])
      } catch (e) {
        console.error('Failed to load chess data:', e)
      } finally {
        setLoading(false)
      }
    }

    loadChessData()
  }, [childId])

  const onSquareClick = useCallback((square: Square) => {
    if (!isYourTurn || !gameState) return

    // If we already selected a piece, try to move it
    if (moveFrom) {
      const move = game.move({
        from: moveFrom,
        to: square,
        promotion: 'q', // Always promote to queen for simplicity
      })

      if (move) {
        // Valid move made
        const newFen = game.fen()
        setGame(new Chess(newFen))

        // Send move to server
        makeChessMove({
          gameId: gameState.id,
          playerId: childId,
          move: {
            from: moveFrom,
            to: square,
            fen: newFen,
          },
        }).then(() => {
          setIsYourTurn(false)
        }).catch(console.error)

        setMoveFrom(null)
        return
      }

      // Invalid move, deselect
      setMoveFrom(null)
    }

    // Select new piece if it's the player's piece
    const piece = game.get(square)
    if (piece) {
      const isPlayerWhite = gameState.white === childId
      const isPieceWhite = piece.color === 'w'
      if (isPlayerWhite === isPieceWhite) {
        setMoveFrom(square)
      }
    }
  }, [game, gameState, childId, isYourTurn, moveFrom])

  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square) => {
    if (!isYourTurn || !gameState) return false

    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    })

    if (move === null) return false

    const newFen = game.fen()
    setGame(new Chess(newFen))

    // Send move to server
    makeChessMove({
      gameId: gameState.id,
      playerId: childId,
      move: {
        from: sourceSquare,
        to: targetSquare,
        fen: newFen,
      },
    }).then(() => {
      setIsYourTurn(false)
    }).catch(console.error)

    return true
  }, [game, gameState, childId, isYourTurn])

  async function handleNewGame() {
    try {
      const response = await createChessGame(childId)
      if (response.game) {
        setGameState(response.game)
        setGame(new Chess())
        setIsYourTurn(response.game.current_turn === childId)
        setShowPuzzle(false)
      }
    } catch (e: any) {
      alert(e.message || 'Failed to create game')
    }
  }

  const playerStanding = standings?.find((s: any) => s.player_id === childId)
  const opponentStanding = standings?.find((s: any) => s.player_id !== childId)

  // Board orientation - show player's pieces at bottom
  const boardOrientation = gameState?.white === childId ? 'white' : 'black'

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-navy-500 hover:text-navy-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2 justify-center">
              <Swords className="w-6 h-6" />
              Chess League
            </h1>
            <p className="text-sm text-navy-500">{child.name} vs {opponent}</p>
          </div>

          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-6"
            >
              {/* Turn Indicator */}
              <div className={`mb-4 p-3 rounded-xl text-center font-semibold ${
                isYourTurn
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isYourTurn ? "Your turn! Take your time and think." : `Waiting for ${opponent}...`}
              </div>

              {/* Board */}
              <div className="chess-board-wrapper rounded-xl overflow-hidden">
                {gameState ? (
                  <Chessboard
                    position={game.fen()}
                    onSquareClick={onSquareClick}
                    onPieceDrop={onDrop}
                    boardOrientation={boardOrientation}
                    customBoardStyle={{
                      borderRadius: '8px',
                    }}
                    customDarkSquareStyle={{ backgroundColor: '#4338ca' }}
                    customLightSquareStyle={{ backgroundColor: '#e0e8ff' }}
                    arePiecesDraggable={isYourTurn}
                  />
                ) : showPuzzle && puzzle ? (
                  <div>
                    <Chessboard
                      position={puzzle.fen}
                      boardOrientation="white"
                      customBoardStyle={{ borderRadius: '8px' }}
                      customDarkSquareStyle={{ backgroundColor: '#4338ca' }}
                      customLightSquareStyle={{ backgroundColor: '#e0e8ff' }}
                    />
                    <div className="mt-4 p-4 bg-amber-50 rounded-xl">
                      <p className="font-semibold text-amber-800 mb-1">{puzzle.theme}</p>
                      <p className="text-amber-700 text-sm">{puzzle.hint}</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <div className="text-center p-8">
                      <Swords className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-navy-700 mb-2">No active game</p>
                      <button
                        onClick={handleNewGame}
                        className="px-6 py-2 bg-gradient-to-r from-gold-400 to-gold-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Start New Game
                      </button>
                      <button
                        onClick={() => setShowPuzzle(true)}
                        className="block mx-auto mt-3 text-sm text-indigo-600 hover:underline"
                      >
                        Or try today's puzzle
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Thinking Prompt */}
              {isYourTurn && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-amber-50 rounded-xl flex items-start gap-3"
                >
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Think before you move</p>
                    <p className="text-amber-700 text-sm">{thinkingPrompt}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Standings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-gold-500" />
                <h3 className="font-bold text-navy-800">Season Standings</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-white font-bold text-sm">
                      {child.name[0]}
                    </div>
                    <span className="font-medium text-navy-700">{child.name} (You)</span>
                  </div>
                  <span className="font-bold text-navy-800">{playerStanding?.points || 0} pts</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {opponent[0]}
                    </div>
                    <span className="font-medium text-navy-700">{opponent}</span>
                  </div>
                  <span className="font-bold text-navy-800">{opponentStanding?.points || 0} pts</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Win: 1 pt · Draw: 0.5 pts
                </p>
              </div>
            </motion.div>

            {/* Game Controls */}
            {gameState && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-5"
              >
                <h3 className="font-bold text-navy-800 mb-4">Game Options</h3>

                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <RotateCcw className="w-5 h-5 text-navy-400" />
                    <span className="text-navy-700">Offer Draw</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <Flag className="w-5 h-5 text-red-400" />
                    <span className="text-navy-700">Resign</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Move History */}
            {(gameState?.moves?.length ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-navy-400" />
                  <h3 className="font-bold text-navy-800">Move History</h3>
                </div>

                <div className="max-h-40 overflow-y-auto text-sm font-mono text-navy-600 space-y-1">
                  {(gameState?.moves ?? []).map((move: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-400">{Math.floor(i/2) + 1}.</span>
                      <span>{move.move?.from}{move.move?.to}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, X, ExternalLink } from 'lucide-react'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

interface Puzzle {
  id: string
  name: string
  desc: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: string
  url: string
}

const PUZZLES: Puzzle[] = [
  {
    id: 'net',
    name: 'Net',
    desc: 'Rotate tiles to connect the network. No dead ends allowed.',
    difficulty: 'easy',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/net.html',
  },
  {
    id: 'towers',
    name: 'Towers',
    desc: 'Place skyscrapers so each row/column has 1 to N, and matches the visibility clues.',
    difficulty: 'medium',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/towers.html',
  },
  {
    id: 'solo',
    name: 'Solo (Sudoku)',
    desc: 'Fill the grid so every row, column, and region contains each number exactly once.',
    difficulty: 'medium',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/solo.html',
  },
  {
    id: 'bridges',
    name: 'Bridges',
    desc: 'Connect islands with bridges — each island has an exact count of bridges it needs.',
    difficulty: 'medium',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/bridges.html',
  },
  {
    id: 'galaxies',
    name: 'Galaxies',
    desc: 'Divide the grid into rotationally symmetric regions, each centred on a dot.',
    difficulty: 'hard',
    type: 'Spatial',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/galaxies.html',
  },
  {
    id: 'pearl',
    name: 'Pearl',
    desc: 'Draw a loop through the grid following black and white circle rules.',
    difficulty: 'hard',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/pearl.html',
  },
  {
    id: 'magnets',
    name: 'Magnets',
    desc: 'Place magnets in a grid so poles match the edge counts and no like poles touch.',
    difficulty: 'hard',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/magnets.html',
  },
  {
    id: 'untangle',
    name: 'Untangle',
    desc: 'Move the dots until no lines cross. A spatial reasoning classic.',
    difficulty: 'easy',
    type: 'Spatial',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/untangle.html',
  },
  {
    id: 'loopy',
    name: 'Loopy',
    desc: 'Draw a single closed loop that satisfies the number clues on each cell.',
    difficulty: 'medium',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/loopy.html',
  },
  {
    id: 'pattern',
    name: 'Pattern (Nonogram)',
    desc: 'Fill cells to match row and column number clues. A pixel-art logic puzzle.',
    difficulty: 'medium',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/pattern.html',
  },
  {
    id: 'tents',
    name: 'Tents',
    desc: 'Place tents next to trees — one per tree — matching edge counts. No tents touch.',
    difficulty: 'easy',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/tents.html',
  },
  {
    id: 'slant',
    name: 'Slant',
    desc: 'Fill each square with a diagonal line so corners have the right number of lines meeting.',
    difficulty: 'easy',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/slant.html',
  },
  {
    id: 'blackbox',
    name: 'Black Box',
    desc: 'Shoot rays into a box to find hidden balls using reflection and absorption clues.',
    difficulty: 'hard',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/blackbox.html',
  },
  {
    id: 'cube',
    name: 'Cube',
    desc: 'Roll a cube across the board to paint every square — a 3D spatial challenge.',
    difficulty: 'medium',
    type: 'Spatial',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/cube.html',
  },
  {
    id: 'dominosa',
    name: 'Dominosa',
    desc: 'Fill the grid with a complete set of dominoes — no guessing, pure logic.',
    difficulty: 'medium',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/dominosa.html',
  },
  {
    id: 'fifteen',
    name: 'Fifteen',
    desc: 'Slide tiles into order — the classic 15-puzzle. Fewest moves wins.',
    difficulty: 'easy',
    type: 'Spatial',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/fifteen.html',
  },
  {
    id: 'flip',
    name: 'Flip',
    desc: 'Flip rows and columns to turn all lights on. Think about consequences.',
    difficulty: 'medium',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/flip.html',
  },
  {
    id: 'guess',
    name: 'Guess (Mastermind)',
    desc: 'Crack the hidden colour code using logical deduction from feedback.',
    difficulty: 'easy',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/guess.html',
  },
  {
    id: 'inertia',
    name: 'Inertia',
    desc: 'Slide the ball to collect all gems — it keeps moving until it hits a wall.',
    difficulty: 'medium',
    type: 'Spatial',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/inertia.html',
  },
  {
    id: 'keen',
    name: 'Keen',
    desc: 'Like KenKen: fill digits so each row and column is unique, and cages match math.',
    difficulty: 'medium',
    type: 'Math',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/keen.html',
  },
  {
    id: 'lightup',
    name: 'Light Up',
    desc: 'Place light bulbs to illuminate every cell — black squares show how many bulbs touch.',
    difficulty: 'medium',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/lightup.html',
  },
  {
    id: 'map',
    name: 'Map',
    desc: 'Colour a map using exactly 4 colours so no adjacent regions share a colour.',
    difficulty: 'easy',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/map.html',
  },
  {
    id: 'mines',
    name: 'Mines',
    desc: 'Classic Minesweeper — deduce where the mines are from the number clues.',
    difficulty: 'medium',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/mines.html',
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    desc: 'Fill squares so each numbered cell\'s neighbourhood has exactly that many filled cells.',
    difficulty: 'easy',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/mosaic.html',
  },
  {
    id: 'range',
    name: 'Range',
    desc: 'Black out cells so each white number can see exactly that many white cells in its row and column.',
    difficulty: 'hard',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/range.html',
  },
  {
    id: 'rect',
    name: 'Rectangles',
    desc: 'Divide the grid into rectangles — each rectangle must contain exactly one number showing its area.',
    difficulty: 'medium',
    type: 'Math',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/rect.html',
  },
  {
    id: 'samegame',
    name: 'Same Game',
    desc: 'Remove groups of matching tiles to clear the board — groups of 1 are stuck.',
    difficulty: 'easy',
    type: 'Strategy',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/samegame.html',
  },
  {
    id: 'signpost',
    name: 'Signpost',
    desc: 'Chain the arrows to create one continuous path from 1 to the end.',
    difficulty: 'medium',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/signpost.html',
  },
  {
    id: 'singles',
    name: 'Singles',
    desc: 'Circle or cross out numbers so each row/column has one of each digit — no pairs adjacent.',
    difficulty: 'hard',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/singles.html',
  },
  {
    id: 'sixteen',
    name: 'Sixteen',
    desc: 'Shift rows and columns to order the tiles — harder than Fifteen.',
    difficulty: 'medium',
    type: 'Spatial',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/sixteen.html',
  },
  {
    id: 'twiddle',
    name: 'Twiddle',
    desc: 'Rotate groups of four tiles to put numbers in order.',
    difficulty: 'medium',
    type: 'Spatial',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/twiddle.html',
  },
  {
    id: 'unequal',
    name: 'Unequal',
    desc: 'Futoshiki: place digits so each row/column is unique and inequality signs are satisfied.',
    difficulty: 'medium',
    type: 'Math',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/unequal.html',
  },
  {
    id: 'unruly',
    name: 'Unruly',
    desc: 'Fill with two colours: each row and column balanced, no run of 3 same colour.',
    difficulty: 'easy',
    type: 'Logic',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/unruly.html',
  },
  {
    id: 'filling',
    name: 'Filling',
    desc: 'Fill the grid with digits — every group of same digits must match in count.',
    difficulty: 'hard',
    type: 'Deduction',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/filling.html',
  },
  {
    id: 'group',
    name: 'Group',
    desc: 'A Cayley table puzzle — fill digits to form a valid mathematical group.',
    difficulty: 'hard',
    type: 'Math',
    url: 'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/group.html',
  },
]

const DIFFICULTY_COLORS = {
  easy: 'text-green-400 bg-green-900/40 border-green-800/50',
  medium: 'text-amber-400 bg-amber-900/40 border-amber-800/50',
  hard: 'text-red-400 bg-red-900/40 border-red-800/50',
}

const TYPE_COLORS: Record<string, string> = {
  Logic: 'text-blue-400',
  Deduction: 'text-purple-400',
  Spatial: 'text-cyan-400',
  Math: 'text-yellow-400',
  Strategy: 'text-orange-400',
}

const ALL_TYPES = ['All', 'Logic', 'Deduction', 'Spatial', 'Math', 'Strategy']
const ALL_DIFFS = ['All', 'easy', 'medium', 'hard']

export default function PuzzlesPage() {
  const params = useParams()
  const router = useRouter()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 5 }

  const [activeType, setActiveType] = useState('All')
  const [activeDiff, setActiveDiff] = useState('All')
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null)

  const filtered = PUZZLES.filter(p =>
    (activeType === 'All' || p.type === activeType) &&
    (activeDiff === 'All' || p.difficulty === activeDiff)
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push(`/dashboard/${childId}`)} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Puzzle Room</h1>
            <p className="text-slate-500 text-xs mt-0.5">{child.name} · {PUZZLES.length} logic games · MIT licensed · no account needed</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex gap-1.5 flex-wrap">
            {ALL_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeType === t
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {ALL_DIFFS.map(d => (
              <button
                key={d}
                onClick={() => setActiveDiff(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  activeDiff === d
                    ? 'bg-slate-300 text-black border-slate-300'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(puzzle => (
            <button
              key={puzzle.id}
              onClick={() => setActivePuzzle(puzzle)}
              className="text-left rounded-2xl bg-slate-800/60 border border-slate-700 p-4 hover:border-violet-500/50 hover:bg-slate-800 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                  {puzzle.name[0]}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[puzzle.difficulty]}`}>
                  {puzzle.difficulty}
                </span>
              </div>
              <p className="font-bold text-white text-sm mb-1 group-hover:text-violet-300 transition-colors">{puzzle.name}</p>
              <p className={`text-xs font-medium mb-2 ${TYPE_COLORS[puzzle.type] || 'text-slate-400'}`}>{puzzle.type}</p>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{puzzle.desc}</p>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No puzzles match those filters.
          </div>
        )}
      </main>

      {/* Puzzle Modal */}
      {activePuzzle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button onClick={() => setActivePuzzle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div>
                <p className="font-bold text-white text-sm">{activePuzzle.name}</p>
                <p className="text-slate-500 text-xs">{activePuzzle.desc}</p>
              </div>
            </div>
            <a
              href={activePuzzle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in tab
            </a>
          </div>
          <div className="flex-1 relative">
            <iframe
              key={activePuzzle.id}
              src={activePuzzle.url}
              className="w-full h-full border-none bg-white"
              title={activePuzzle.name}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  )
}

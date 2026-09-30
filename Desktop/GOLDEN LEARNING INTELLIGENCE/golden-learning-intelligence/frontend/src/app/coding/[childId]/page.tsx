'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Code2, Brain, Palette, Zap, Play } from 'lucide-react'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

const TOOLS = [
  {
    id: 'blockly',
    name: 'Blockly Games',
    maker: 'Google · Apache 2.0',
    desc: 'Learn to code by solving puzzles with visual blocks. Maze, Bird, Turtle, Movie, Music — 8 progressive games.',
    icon: Code2,
    color: 'from-green-500 to-emerald-600',
    url: 'https://blockly.games/',
    embed: 'https://blockly.games/maze',
    canEmbed: true,
    grade: 'Grade 5+',
  },
  {
    id: 'tfjs',
    name: 'Neural Network Playground',
    maker: 'TensorFlow · Apache 2.0',
    desc: 'Watch a neural network learn in real time. Change layers, neurons, and data. See how AI actually trains.',
    icon: Brain,
    color: 'from-orange-500 to-amber-600',
    url: 'https://playground.tensorflow.org/',
    embed: 'https://playground.tensorflow.org/',
    canEmbed: true,
    grade: 'Grade 8+',
  },
  {
    id: 'teachable',
    name: 'Teachable Machine',
    maker: 'Google · Apache 2.0',
    desc: 'Train your own image, sound, or pose recognition model in minutes. No code. Real machine learning.',
    icon: Zap,
    color: 'from-blue-500 to-cyan-600',
    url: 'https://teachablemachine.withgoogle.com/',
    embed: null,
    canEmbed: false,
    grade: 'Grade 5+',
  },
  {
    id: 'quickdraw',
    name: 'Quick, Draw!',
    maker: 'Google · Apache 2.0',
    desc: 'Google AI guesses your doodles in 20 seconds. 50M+ drawings trained the model.',
    icon: Palette,
    color: 'from-purple-500 to-violet-600',
    url: 'https://quickdraw.withgoogle.com/',
    embed: 'https://quickdraw.withgoogle.com/',
    canEmbed: false,
    grade: 'Grade 5+',
  },
  {
    id: 'magenta',
    name: 'Piano Genie',
    maker: 'Google Magenta · Apache 2.0',
    desc: 'Press 1–8 keys and AI plays real piano music. A machine learning experiment in music composition.',
    icon: Play,
    color: 'from-pink-500 to-rose-600',
    url: 'https://piano-genie.glitch.me/',
    embed: 'https://piano-genie.glitch.me/',
    canEmbed: true,
    grade: 'Grade 5+',
  },
]

export default function CodingLabPage() {
  const params = useParams()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 5 }
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const active = TOOLS.find(t => t.id === activeTool)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${childId}`} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-white font-bold">Coding Lab</h1>
              <p className="text-slate-400 text-xs mt-0.5">{child.name} · Google Open Source AI Tools</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
        </div>
      </header>

      {/* Fullscreen embed */}
      {activeTool && active?.canEmbed && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveTool(null)} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <p className="text-white font-bold text-sm">{active.name}</p>
              <span className="text-xs text-slate-500">{active.maker}</span>
            </div>
            <a href={active.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
              <ExternalLink className="w-4 h-4" /> Open in tab
            </a>
          </div>
          <iframe
            src={active.embed!}
            className="flex-1 w-full border-0"
            allow="camera; microphone"
            title={active.name}
          />
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-slate-300 text-sm leading-relaxed">
            Five Google open-source tools, all Apache 2.0 licensed. Each one lets you interact with real AI and real code — not a simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(tool => {
            const Icon = tool.icon
            return (
              <div key={tool.id} className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 flex flex-col gap-4 hover:border-slate-500 transition-all">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-slate-600 font-mono">{tool.grade}</span>
                </div>
                <div>
                  <p className="font-bold text-white text-base">{tool.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{tool.maker}</p>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">{tool.desc}</p>
                </div>
                <div className="flex gap-2 mt-auto">
                  {tool.canEmbed && (
                    <button
                      onClick={() => setActiveTool(tool.id)}
                      className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${tool.color} text-white font-semibold text-sm flex items-center justify-center gap-2`}
                    >
                      <Play className="w-4 h-4" /> Launch
                    </button>
                  )}
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${tool.canEmbed ? '' : 'flex-1'} px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:border-slate-400 transition-all`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {tool.canEmbed ? '' : 'Open'}
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-3">What you can build with these</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { action: 'Train a model that recognizes hand gestures', tool: 'Teachable Machine' },
              { action: 'Build a maze-solving algorithm step by step', tool: 'Blockly Games' },
              { action: 'Watch how changing a neural network\'s depth affects learning', tool: 'TF.js Playground' },
              { action: 'Understand how 50M doodles trained a classification model', tool: 'Quick Draw' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-green-900/60 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-slate-200 text-sm">{item.action}</p>
                  <p className="text-xs text-slate-500">via {item.tool}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

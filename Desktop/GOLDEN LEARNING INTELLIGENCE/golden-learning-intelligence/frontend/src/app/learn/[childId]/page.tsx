'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Play, Search } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

interface Topic {
  id: string
  title: string
  description: string
}

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

// Grade-appropriate topic recommendations
const GRADE_RECOMMENDATIONS: Record<number, string[]> = {
  5: ['divisibility', 'probability', 'polygons', 'statistics', 'basic-probability', 'shapes'],
  6: ['sequences', 'divisibility', 'probability', 'statistics', 'triangles'],
  7: ['triangles', 'circles', 'transformations', 'probability', 'statistics'],
  8: ['functions', 'quadratics', 'linear-functions', 'circles', 'euclidean-geometry', 'graph-theory'],
}

export default function TopicBrowserPage() {
  const params = useParams()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 5 }

  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await fetch(`${API_URL}/api/curriculum/topics`)
        if (!res.ok) throw new Error('Failed to load topics')
        const data = await res.json()
        setTopics(data.topics)
      } catch (e) {
        setError('Could not load topics. Make sure backend is running on port 4500.')
      } finally {
        setLoading(false)
      }
    }
    loadTopics()
  }, [])

  const recommendations = GRADE_RECOMMENDATIONS[child.grade] || []
  const recommendedTopics = topics.filter(t => recommendations.includes(t.id))
  const otherTopics = topics.filter(t => !recommendations.includes(t.id))

  const filteredRecommended = recommendedTopics.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  const filteredOther = otherTopics.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading curriculum...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href={`/dashboard/${childId}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Learning Library</h1>
            <p className="text-gray-400">Grade {child.grade} · {topics.length} topics available</p>
          </div>
          <div className="w-20" />
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {/* Recommended for Grade */}
        {filteredRecommended.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
              Recommended for Grade {child.grade}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {filteredRecommended.map(topic => (
                <TopicCard key={topic.id} topic={topic} childId={childId} recommended />
              ))}
            </div>
          </>
        )}

        {/* All Topics */}
        <h2 className="text-lg font-bold text-gray-400 mb-4">All Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOther.map(topic => (
            <TopicCard key={topic.id} topic={topic} childId={childId} />
          ))}
        </div>

        {filteredRecommended.length === 0 && filteredOther.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No topics found matching "{search}"
          </div>
        )}
      </div>
    </div>
  )
}

function TopicCard({ topic, childId, recommended }: { topic: Topic; childId: string; recommended?: boolean }) {
  return (
    <Link href={`/learn/${childId}/${topic.id}`}>
      <div className={`
        rounded-xl p-5 transition-all cursor-pointer
        ${recommended
          ? 'bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-700/50 hover:border-yellow-500'
          : 'bg-gray-900 border border-gray-800 hover:border-gray-600'
        }
      `}>
        <div className="flex items-start gap-4">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            ${recommended ? 'bg-yellow-500/20' : 'bg-gray-800'}
          `}>
            <BookOpen className={`w-6 h-6 ${recommended ? 'text-yellow-400' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white mb-1">{topic.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{topic.description || 'Explore this topic'}</p>
          </div>
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${recommended ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}
          `}>
            <Play className="w-5 h-5" />
          </div>
        </div>
      </div>
    </Link>
  )
}

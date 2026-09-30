'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const CHILD_INFO: Record<string, { name: string; grade: number; initial: string }> = {
  jus: { name: 'Jus', grade: 5, initial: 'J' },
  uni: { name: 'Uni', grade: 8, initial: 'U' },
}

const CATALOG = [
  { label: 'Mathematics',       desc: 'Algebra · Numbers · Problem solving',       color: '#3B82F6', path: (id: string) => `/basics/${id}/math`        },
  { label: 'Reading & Writing', desc: 'Essays · Literature · Composition',          color: '#F59E0B', path: (id: string) => `/basics/${id}/reading`     },
  { label: 'Science',           desc: 'Biology · Physics · The natural world',      color: '#10B981', path: (id: string) => `/basics/${id}/science`     },
  { label: 'Finance',           desc: 'Money · Investing · How markets work',       color: '#059669', path: (id: string) => `/basics/${id}/finance`     },
  { label: 'Law & Rights',      desc: 'Justice · Courts · How laws are made',       color: '#475569', path: (id: string) => `/basics/${id}/law`         },
  { label: 'AI Literacy',       desc: 'Machines · Neural nets · The future',        color: '#8B5CF6', path: (id: string) => `/basics/${id}/ai`          },
  { label: 'Health & Body',     desc: 'Anatomy · Nutrition · Movement',             color: '#EF4444', path: (id: string) => `/basics/${id}/health`      },
  { label: 'Languages',         desc: 'French · Spanish · German · Mandarin · Latin · Japanese', color: '#0EA5E9', path: (id: string) => `/languages/${id}` },
  { label: 'Music',             desc: 'Theory · History · Notation · Ear training', color: '#8B5CF6', path: (id: string) => `/music/${id}`             },
  { label: 'Chess League',      desc: 'Strategy · Tactics · Pattern recognition',   color: '#475569', path: (id: string) => `/chess/${id}`             },
  { label: 'Coding Lab',        desc: 'Block code · JavaScript · AI tools',         color: '#10B981', path: (id: string) => `/coding/${id}`            },
  { label: 'Brain Lab',         desc: 'Reaction speed · Number memory · Math sprint', color: '#F59E0B', path: (id: string) => `/brain-lab/${id}`      },
  { label: 'Tennis Wing',       desc: 'Reaction · Tactics · 3D court',              color: '#F59E0B', path: (id: string) => `/tennis/${id}`            },
  { label: 'Puzzle Room',       desc: '41 logic games',                             color: '#8B5CF6', path: (id: string) => `/puzzles/${id}`           },
  { label: 'World History',     desc: '162 lessons across civilisations',           color: '#0EA5E9', path: (id: string) => `/basics/${id}/history`    },
  { label: 'Philosophy',        desc: 'Ethics · Epistemology · Great thinkers',     color: '#D97706', path: (id: string) => `/basics/${id}/philosophy` },
  { label: 'Society & Poverty', desc: 'Sociology · Power · Inequality',             color: '#EC4899', path: (id: string) => `/basics/${id}/sociology`  },
  { label: 'Arts & Culture',    desc: 'Visual arts · Architecture · Culture',       color: '#DB2777', path: (id: string) => `/basics/${id}/arts`       },
  { label: 'Political Science', desc: 'Government · Power · How countries work',    color: '#1D4ED8', path: (id: string) => `/basics/${id}/political`  },
  { label: 'Arduino / Making',  desc: 'Electronics · Circuits · Build things',      color: '#EF4444', path: (id: string) => `/basics/${id}/arduino`    },
  { label: 'Deep Learning',     desc: 'Neural networks · Machine learning',         color: '#7C3AED', path: (id: string) => `/basics/${id}/deeplearn`  },
  { label: 'CA State Quiz',     desc: '20 minutes · 8,500 real problems',           color: '#6366F1', path: (id: string) => `/test-prep/${id}`         },
]

const cream  = '#F9F4EC'
const navy   = '#1A3050'
const navyMid = '#2A4A6B'
const card   = '#FFFFFF'
const border = '#E8E0D4'

export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const childId = params.childId as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 5, initial: 'S' }

  return (
    <div style={{ background: cream, minHeight: '100vh', fontFamily: "'Nunito', sans-serif", color: navy, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        background: navy, color: '#fff', padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        height: '58px', flexShrink: 0,
      }}>
        <button
          onClick={() => router.push(`/dashboard/${childId}`)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.6, padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Free Choice</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>What do you want to learn today?</div>
        </div>
      </header>

      {/* Grid */}
      <div style={{ flex: 1, padding: '16px 20px 24px', overflowY: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {CATALOG.map(item => (
            <Link key={item.label} href={item.path(childId)} style={{ textDecoration: 'none' }}>
              <div style={{
                background: card,
                border: `1.5px solid ${border}`,
                borderLeft: `4px solid ${item.color}`,
                borderRadius: 12,
                padding: '14px 16px',
                cursor: 'pointer',
                height: '100%',
                boxSizing: 'border-box',
                transition: 'box-shadow 0.15s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: `${item.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: navy, lineHeight: 1.3, marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 10.5, color: navyMid, opacity: 0.6, lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

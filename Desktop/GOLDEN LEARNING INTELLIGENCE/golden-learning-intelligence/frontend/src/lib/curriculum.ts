// Curriculum loader - reads from open source repos

// Math topics from Mathigon (already cloned)
export const MATHIGON_TOPICS = {
  'divisibility': { title: 'Divisibility & Primes', level: 'foundations' },
  'sequences': { title: 'Sequences & Patterns', level: 'intermediate' },
  'triangles': { title: 'Triangles & Trigonometry', level: 'intermediate' },
  'circles': { title: 'Circles & Pi', level: 'intermediate' },
  'probability': { title: 'Probability', level: 'foundations' },
  'statistics': { title: 'Statistics & Data', level: 'foundations' },
  'quadratics': { title: 'Quadratic Equations', level: 'advanced' },
  'functions': { title: 'Functions', level: 'intermediate' },
  'polygons': { title: 'Polygons & Polyhedra', level: 'intermediate' },
  'fractals': { title: 'Fractals', level: 'advanced' },
  'graph-theory': { title: 'Graphs & Networks', level: 'advanced' },
  'transformations': { title: 'Transformations & Symmetry', level: 'intermediate' },
  'euclidean-geometry': { title: 'Euclidean Geometry', level: 'advanced' },
}

// Grade mapping
export const GRADE_CURRICULUM = {
  5: {
    math: ['divisibility', 'probability', 'polygons', 'statistics'],
    reading: ['main-idea', 'inference', 'vocabulary', 'comprehension'],
  },
  6: {
    math: ['sequences', 'statistics', 'probability', 'divisibility'],
    reading: ['main-idea', 'inference', 'figurative-language', 'theme'],
  },
  7: {
    math: ['triangles', 'circles', 'transformations', 'statistics'],
    reading: ['authors-purpose', 'inference', 'argument', 'compare-contrast'],
  },
  8: {
    math: ['functions', 'quadratics', 'euclidean-geometry', 'graph-theory'],
    reading: ['thesis', 'rhetoric', 'figurative-language', 'critical-analysis'],
  },
}

// Parse Mathigon content.md to extract lesson sections
export function parseMathigonContent(markdown: string): LessonSection[] {
  const sections: LessonSection[] = []
  const lines = markdown.split('\n')

  let currentSection: LessonSection | null = null
  let currentText = ''

  for (const line of lines) {
    // New section header
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentSection && currentText.trim()) {
        currentSection.content = cleanMathigonText(currentText)
        sections.push(currentSection)
      }
      currentSection = {
        title: line.replace(/^#+\s+/, ''),
        content: '',
        type: 'teach',
      }
      currentText = ''
    } else if (line.startsWith('---')) {
      // Section break
      if (currentSection && currentText.trim()) {
        currentSection.content = cleanMathigonText(currentText)
        sections.push(currentSection)
        currentSection = { ...(currentSection as object), content: '' } as typeof currentSection
        currentText = ''
      }
    } else if (!line.startsWith('>') && !line.startsWith(':::') && !line.startsWith('    ')) {
      // Regular text (skip directives and code)
      currentText += line + '\n'
    }
  }

  if (currentSection && currentText.trim()) {
    currentSection.content = cleanMathigonText(currentText)
    sections.push(currentSection)
  }

  return sections.filter(s => s.content.length > 50) // Only substantial sections
}

// Clean Mathigon-specific syntax
function cleanMathigonText(text: string): string {
  return text
    .replace(/\[__([^_]+)__\]\([^)]+\)/g, '$1') // [__term__](gloss:term) -> term
    .replace(/__([^_]+)__/g, '$1') // __bold__ -> bold
    .replace(/_([^_]+)_/g, '$1') // _italic_ -> italic
    .replace(/\[\[([^\]]+)\]\]/g, '(answer: $1)') // [[answer]] -> (answer: ...)
    .replace(/\{[^}]+\}/g, '') // {.class} -> remove
    .replace(/\*\{[^}]+\}\*/g, '') // *{span}* -> remove
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim()
}

export interface LessonSection {
  title: string
  content: string
  type: 'teach' | 'example' | 'practice' | 'quiz'
  question?: string
  answer?: string
}

export interface Lesson {
  id: string
  title: string
  description: string
  level: string
  sections: LessonSection[]
}

// Playlist for a grade/subject
export interface CurriculumPlaylist {
  grade: number
  subject: 'math' | 'reading'
  topics: string[]
  currentIndex: number
  progress: Record<string, number> // topic -> section index
}

export function createPlaylist(grade: number, subject: 'math' | 'reading'): CurriculumPlaylist {
  const topics = GRADE_CURRICULUM[grade as keyof typeof GRADE_CURRICULUM]?.[subject] || []
  return {
    grade,
    subject,
    topics,
    currentIndex: 0,
    progress: {},
  }
}

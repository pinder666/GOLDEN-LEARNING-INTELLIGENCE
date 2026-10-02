# CoachSoccerPro

A mentorship platform disguised as a youth soccer app. The soccer is the hook. The real product is confidence, habit formation, and making every child feel seen.

## The Problem We're Solving

| Statistic | Data | Source |
|-----------|------|--------|
| Admin burden | **16-20 hours/week** on tasks that have nothing to do with coaching | Project Play / Aspen Institute |
| First-year quit rate | **40% of volunteer coaches quit within year 1** | Project Play |
| Volunteer shortage | **82% of youth league leaders** have difficulty finding volunteers | NRPA Survey 2024 |
| Player dropout | **70% of kids quit sports by age 13** | Forbes / Aspen Institute |
| Payment collection | Online = **98%** collected, Offline = **84%** (14-point gap) | Centro Research |

**270 million people play football worldwide.** Latin America alone has 12M+ organized youth players but only 8% software penetration. The opportunity is massive.

## What This Is

**For coaches:** An amplification system. Takes a coach who cares and gives them tools to have 10x impact — voice-to-AI messaging, one-tap encouragement, development tracking, professional presence with parents.

**For parents:** A window into their child's growth. Not game scores — real development. Badges, streaks, coach notes, progress.

**For children:** A pride machine. Their living player card. Badges they earned. Leaderboard where they ALWAYS appear (no one invisible). Pro habits from Messi and Ronaldo. A journey they own.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React (Vision UI Dashboard Pro) |
| Database | Supabase (Postgres + Auth + Storage) |
| Payments | Stripe Connect (1.5% platform fee) |
| AI Assistant | Anthropic Claude API |
| Voice Transcription | OpenAI Whisper |
| i18n | react-i18next (English + Spanish as CORE) |

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Coach | $79.97/month | Voice-to-AI messaging, roster, calendar, payments, badges, parent dashboard |
| White Label | $149/month | Everything + custom logo, colors · Powered by SoccerMental |
| Dues | Reminder-only | Coach's own payment link + mark-paid; CSP never processes family money |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Access dashboard
http://localhost:3010/coach/dashboard

# Access landing page (start server first)
python -m http.server 5557
http://localhost:5557/landing-page.html
```

## Project Structure

```
coachsoccerpro/
├── src/
│   ├── layouts/coach/           # Coach dashboard pages
│   │   ├── dashboard/           # Main dashboard
│   │   ├── roster/              # Player management
│   │   ├── calendar/            # Events & schedule
│   │   ├── payments/            # Payment tracking
│   │   ├── messages/            # Voice-to-AI messaging
│   │   ├── badges/              # Badge management
│   │   ├── prohabits/           # Pro habits library
│   │   ├── leaderboard/         # Team leaderboard
│   │   ├── drills/              # Drill library
│   │   ├── tactics-board/       # Tactics board
│   │   ├── classroom/           # Educational content
│   │   └── video-analyst/       # Video analysis (BETA)
│   ├── components/              # Reusable UI components
│   ├── context/                 # React context providers
│   ├── i18n/                    # Translation files (en/es)
│   └── assets/                  # Images, logos, icons
├── landing-page.html            # Public landing page (EN/ES)
├── RESEARCH_COACH_PAIN_POINTS.md # Market research & data
├── CLAUDE.md                    # Project rules & context
└── package.json
```

## Features

### Coach Features
- **Voice → AI Messaging**: Record a voice note, AI polishes it into a professional message
- **Roster Management**: Player profiles with parent contact info
- **Calendar**: Practice, games, tournaments with one-tap RSVP tracking
- **Attendance**: One-tap present/absent for all players
- **Badge System**: 50+ pre-built badges, custom creation
- **Pro Habits**: Real quotes from Messi, Ronaldo, real players with sources
- **Payment Tracking**: Stripe Connect, automated reminders
- **Video Analysis**: Upload clips, AI-assisted analysis (BETA)
- **Drill Library**: Searchable drill database with animations
- **Tactics Board**: Draw formations, plays, share with team
- **Classroom**: Educational content for coaches

### Parent Features
- Dashboard with child's player card
- Schedule with one-tap RSVP
- Badge collection view
- Development notes from coach
- Pay dues via Stripe
- Message coach

### Child Features
- Living animated player card (Bronze → Silver → Gold → Platinum → Diamond)
- Badge collection (earned vs locked)
- Full team leaderboard (their rank highlighted, EVERYONE visible)
- Streak indicators with flames
- Pro habit of the day
- Daily habit tracker (water, sleep, food, stretch)
- Journey path (visual milestone progression)

## Non-Negotiable Rules

1. **Every child on the leaderboard** — no top 5 only. If you're #15 of 15, you're still ON the board.
2. **Badges are the emotional core** — collectible, earnable, visible. Multiple paths to earn.
3. **Pro habits from real players** — with sources. Kids copy heroes.
4. **Spanish is core** — not translated. Written natively from day 1.
5. **Never send from "the app"** — always from Coach.
6. **Never show nutrition/mentorship from app** — always from Coach.

## Bilingual Support

CoachSoccerPro is built Spanish-first, not translated after. Every string, every badge name, every pro habit, every coach template — written in both English and Spanish from day one.

```javascript
// i18n usage
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<span>{t('dashboard.welcome')}</span>
```

## Database Schema (Supabase)

```sql
-- Core tables
coaches           -- Coach accounts
players           -- Player profiles  
parents           -- Parent accounts (linked to players)
teams             -- Team management
events            -- Calendar events
attendance        -- Attendance records
badges            -- Badge definitions
player_badges     -- Badges awarded to players
messages          -- Coach messages
payments          -- Payment records
```

## Environment Variables

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
REACT_APP_ANTHROPIC_API_KEY=your_claude_key
REACT_APP_OPENAI_API_KEY=your_whisper_key
```

## Competitors

| Platform | Focus | Gap CSP Fills |
|----------|-------|---------------|
| Planet.training | Drills, session plans | No child experience, no mentorship |
| 360Player | Club admin, video | Europe-focused, no voice-to-AI |
| The Coaching Manual | Drill library | Content only, no team management |
| Cupello | Online coaching | No parent/child dashboards |
| Tactics Manager | Diagrams, animations | Tactics only, no admin tools |

**What none of them have:**
- Voice-to-AI professional messaging
- Child player cards with badge collection
- Leaderboard where EVERY child appears
- Pro habits from real players
- Parent dashboard that reduces coach burden
- Native Spanish (not translated)

## Market Opportunity

| Region | Players | Software Penetration |
|--------|---------|---------------------|
| Worldwide | 270 million | Growing |
| USA (2025) | 16.8 million (all-time high) | Moderate |
| Latin America | 12+ million organized youth | **Under 8%** |
| Europe | 62 million | Growing (9.2% CAGR) |

## Development

```bash
# Run tests
npm test

# Build for production
npm run build

# Lint
npm run lint
```

## Contributing

This is a private commercial project. Contact the development team for contribution guidelines.

## License

Proprietary. All rights reserved.

---

Built with purpose. For coaches who care. For kids who deserve to be seen.

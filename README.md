# Family Glitch

A mobile-first pass-and-play family game powered by AI. Perfect for restaurants, road trips, or family game night.

## Overview

Family Glitch is a 10-15 minute interactive game where players learn about each other through AI-generated prompts, then compete in clever mini-games using that knowledge.

### Game Structure

- **Act 1: Fact Gathering** - Players answer personalized questions about themselves
- **Act 2: Mini-Games** - Use gathered facts to play engaging cartridges (caption contests, trivia, word games)
- **Act 3: Final Reveal** - Reveal hidden answers, show highlights, and declare a winner

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **AI**: OpenAI API (GPT-4o-mini + DALL-E 3)
- **State Management**: React hooks + localStorage
- **Deployment**: Vercel

## Project Structure

```
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── api/               # API routes (LLM integration)
├── components/            # React components
│   ├── GameOrchestrator.tsx  # Main game controller
│   ├── SetupScreen.tsx       # Player setup
│   └── ...                   # Screen components
├── lib/                   # Core game systems
│   ├── stateMachine.ts    # State flow logic
│   ├── eventLog.ts        # Event history
│   ├── persistence.ts     # localStorage wrapper
│   ├── turnManager.ts     # Fair turn distribution
│   ├── factsDB.ts         # Knowledge database
│   ├── pacing.ts          # Session timing
│   └── constants.ts       # Configuration constants
├── types/                 # TypeScript definitions
│   └── game.ts            # All game types
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- OpenAI API key

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local

# Add your OpenAI API key to .env.local
OPENAI_API_KEY=sk-...

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to play!

### Build for Production

```bash
npm run build
npm start
```

## Configuration

All game parameters are centralized in `lib/constants.ts`. You can adjust:

- Session duration (default: 15 minutes)
- Act timing thresholds
- Scoring rules
- Input module constraints
- LLM behavior (temperature, token limits)
- Feature flags

## Architecture Highlights

### State Machine

The game uses a strict state machine with validated transitions. See `lib/stateMachine.ts` for the complete flow.

### Event Log

Every action generates an event (append-only log). This enables:
- Game replay
- Debugging
- Analytics
- Undo/redo (future feature)

### Facts Database

Act 1 builds a "knowledge base" about players. This is indexed by player and category for efficient cartridge queries.

### Pacing System

Adaptively manages session length to hit the 10-15 minute target. Decides when to transition between acts based on time and content.

### LLM Integration

Strict JSON schema enforced via OpenAI function calling. The LLM cannot produce invalid responses.

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Key Development Commands

```bash
# Clear localStorage (reset game state)
localStorage.clear()

# View current session
JSON.parse(localStorage.getItem('family-glitch-last-session'))
```

## Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/family-glitch)

Make sure to add your `OPENAI_API_KEY` environment variable in Vercel settings.

## Roadmap

### MVP (Current Focus)
- [x] Core state machine
- [x] Player setup flow
- [x] Act 1 fact gathering (LLM-powered)
- [x] LLM integration (OpenAI function calling)
- [x] Turn management and pacing
- [ ] Act 2 cartridges (text-based)
- [ ] Act 3 reveals and scoring
- [ ] Scoring UI (judge/group-vote)

### Future Features
- [ ] Image generation (DALL-E)
- [ ] Voice recording answers
- [ ] Player profiles (cross-session)
- [ ] Custom cartridge creation
- [ ] Multi-language support
- [ ] Achievements and streaks

## Contributing

This is a personal project, but suggestions are welcome! Open an issue to discuss major changes.

## License

MIT License - see LICENSE file for details

---

Built with ❤️ for families who want to have fun together

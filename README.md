# Family Glitch

A 10-minute, pass-and-play browser game designed for families waiting at restaurants. An AI-powered "Game Master" called **The Glitch** improvises questions, judges answers with fuzzy logic, and generates a personalized roast poem finale.

**Live Demo:** https://family-glitch.vercel.app

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Game Flow](#game-flow)
- [Mini-Games](#mini-games)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Family Glitch transforms a single smartphone into a chaotic, AI-driven game show. Instead of a static database of trivia questions, the game uses OpenAI's GPT-4o as a live Game Master that:

- Improvises personalized questions based on player context
- Judges answers using semantic matching ("Coke" = "Coca-Cola")
- Dynamically switches between mini-games to keep energy high
- Secretly collects "shadow data" for a finale roast poem

### The Core Loop

1. **The Handoff:** Screen displays "Pass to [Player]"
2. **The Shadow Phase:** Quick, secret word collection (e.g., "One adjective for Dad's hair")
3. **The Mini-Game:** AI selects a random "Cartridge" and presents a challenge
4. **The Judgment:** AI scores based on humor, accuracy, or consensus
5. **Repeat:** For ~10 turns until the Finale poem

---

## Features

- **5 Mini-Game Cartridges:** Hive Mind, Letter Chaos, Ventriloquist, Wager, Tribunal
- **Shadow Collector:** Secretly gathers words throughout the game for the finale
- **Fuzzy AI Judging:** Semantic matching, not exact strings
- **Style Points:** Bonus points for clever/funny answers
- **Personalized Finale:** AI-generated roast poem using collected data
- **Mobile-First UI:** Large tap targets, high contrast, single-column layout
- **Glitch Aesthetic:** Cyan/magenta color scheme, animated text effects
- **Offline UI:** Interface loads without internet (API calls require connection)
- **State Persistence:** Game state saved to localStorage

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State Management | Zustand (with localStorage persistence) |
| AI | OpenAI GPT-4o |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/family-glitch.git
cd family-glitch

# Install dependencies
npm install

# Create environment file
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env.local
# Edit .env.local and add your actual OpenAI API key

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

Create a `.env.local` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

---

## Project Structure

```
family-glitch/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── turn/
│   │   │       └── route.ts      # OpenAI API endpoint
│   │   ├── globals.css           # Tailwind + glitch animations
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main game page
│   ├── components/
│   │   ├── GameScreen.tsx        # Main game controller/router
│   │   ├── SetupPhase.tsx        # Player name entry
│   │   ├── HandoffScreen.tsx     # "Pass to [Player]" transition
│   │   ├── ShadowPhase.tsx       # Quick word collection
│   │   ├── PlayPhase.tsx         # Mini-game challenge display
│   │   ├── JudgmentPhase.tsx     # Score reveal
│   │   ├── FinalePhase.tsx       # Poem + final scoreboard
│   │   └── GlitchLoader.tsx      # Loading animation
│   ├── lib/
│   │   ├── gameStore.ts          # Zustand state management
│   │   └── prompts.ts            # AI system prompt
│   └── types/
│       └── game.ts               # TypeScript interfaces
├── .env.local                    # Environment variables (gitignored)
├── AGENTS.md                     # AI agent instructions
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Game Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         SETUP                                │
│  Enter player names, set the "vibe" (location context)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        HANDOFF                               │
│  "Pass the phone to [Player]" - builds anticipation         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SHADOW                                │
│  Quick secret word collection: "An adjective for the food!" │
│  Stored for finale poem - other players shouldn't see       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         PLAY                                 │
│  AI selects random mini-game, presents personalized         │
│  challenge based on players and context                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       JUDGMENT                               │
│  AI evaluates answer with fuzzy logic, awards points,       │
│  provides snarky commentary                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [Turn < 10?] ──Yes──► Back to HANDOFF
                              │
                             No
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        FINALE                                │
│  AI generates personalized roast poem using shadow data,    │
│  game history, and final scores                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mini-Games

### Hive Mind
**Goal:** Match answers with other players

- All players secretly answer the same question
- Points awarded for matches: 2-player = 100pts, 3-player = 300pts
- "The Snitch" bonus for embarrassing items others forgot

### Letter Chaos
**Goal:** Create funny phrases with letter constraints

- Complete sentences with words starting with specific letters
- Example: "Beth's superhero name is The [S]____ [P]____"
- Points for valid English (50) + humor bonus (up to 150)

### Ventriloquist
**Goal:** Predict exactly what another player would say

- Impersonate another player in a specific scenario
- Target player rates accuracy 1-5 stars
- Points = Stars × 50

### Wager
**Goal:** Bet on your own knowledge

- AI announces a trivia topic
- Player bids 1-5 confidence points
- Correct = bid × 100, Wrong = -bid × 50

### Tribunal
**Goal:** Predict group consensus

- "Most likely to" style questions
- Physical pointing, then enter the winner
- Majority gets 100pts, dissenters lose 50pts

---

## Architecture

### State Management

The game uses a "God Object" pattern - a single JSON state object passed to the AI each turn:

```typescript
interface GameState {
  meta: {
    turn: number;
    maxTurns: number;
    phase: GamePhase;
    currentPlayer: string;
    currentMiniGame: MiniGame | null;
    vibe: string;
  };
  players: Record<string, Player>;
  shadowData: {
    adjectives: string[];
    verbs: string[];
    nouns: string[];
    observations: string[];
  };
  history: string[];
  currentChallenge: Challenge | null;
  pendingAnswers: Record<string, string>;
}
```

### AI Integration

The AI acts as a stateless Game Master. Each turn:

1. Frontend sends current `gameState` + user input to `/api/turn`
2. API builds a system prompt with game rules and persona
3. GPT-4o returns JSON with display content, challenge, and score updates
4. Frontend applies updates and renders next phase

### Fuzzy Judging

The AI uses semantic matching rather than exact string comparison:
- "Coke" matches "Coca-Cola"
- "fridge" matches "refrigerator"
- "Style Points" awarded for creative answers that aren't technically correct

---

## API Reference

### POST /api/turn

Processes a game turn through the AI.

**Request Body:**

```typescript
{
  gameState: GameState;    // Current full game state
  userInput?: string;      // Player's answer/input
  inputType?: string;      // Type of input (text, choice, rating, bid)
}
```

**Response:**

```typescript
{
  display: {
    title: string;         // Header text
    message: string;       // Main content
    subtext?: string;      // Secondary text
  };
  challenge?: {
    type: 'input' | 'choice' | 'rating' | 'bid';
    prompt: string;
    options?: string[];    // For choice type
    targetPlayer?: string; // For ventriloquist
  };
  scoreUpdates?: Array<{
    player: string;
    points: number;
    reason: string;
  }>;
  nextPhase?: GamePhase;
  gameStateUpdates?: {
    history?: string[];
    shadowData?: Partial<ShadowData>;
  };
  poem?: string;           // Finale only
}
```

---

## Configuration

### Game Settings

Modify in `src/lib/gameStore.ts`:

```typescript
const createInitialState = (): GameState => ({
  meta: {
    maxTurns: 10,          // Number of turns before finale
    // ...
  },
  // ...
});
```

### AI Personality

Modify the system prompt in `src/lib/prompts.ts`:

```typescript
export function buildSystemPrompt(gameState: GameState): string {
  return `You are "The Glitch", a snarky, witty game show host...`;
}
```

### Styling

- Colors: Edit CSS variables in `src/app/globals.css`
- Animations: Glitch effects defined in `globals.css`
- Components: Tailwind classes throughout `src/components/`

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add OPENAI_API_KEY production

# Deploy to production
vercel --prod
```

### Other Platforms

The app is a standard Next.js application. Deploy to any platform that supports Next.js:

1. Set the `OPENAI_API_KEY` environment variable
2. Build: `npm run build`
3. Start: `npm start`

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## License

MIT License - feel free to use this for your own family game nights!

---

## Credits

- Built with [Next.js](https://nextjs.org/)
- AI powered by [OpenAI GPT-4o](https://openai.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- State management by [Zustand](https://zustand-demo.pmnd.rs/)

---

*Made with chaos and love for the Bayouth family*

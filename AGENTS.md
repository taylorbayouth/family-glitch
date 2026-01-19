# AGENTS.md

AI agent context for the Family Glitch project.

## Project Overview

**Family Glitch** is a Next.js 15 application with:
- GPT-5.2 AI integration with tool use (function calling)
- Google OAuth authentication (NextAuth.js)
- TypeScript throughout
- Vercel deployment

**Live Site:** https://family-glitch.vercel.app
**Repository:** https://github.com/taylorbayouth/family-glitch

## Tech Stack

- **Framework:** Next.js 15.1.3 (App Router)
- **Language:** TypeScript 5.7.2
- **Runtime:** React 19.0.0
- **AI:** OpenAI SDK 4.77.3 (GPT-5.2)
- **Auth:** NextAuth.js 5.0.0-beta.25
- **State:** Zustand 5.0.2 (with persist middleware)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS 4.1.18 (CSS-based config)
- **Animations:** Framer Motion 12.x
- **Package Manager:** npm

## Tailwind CSS v4 Configuration

### Important: CSS-Based Config
This project uses **Tailwind CSS v4**, which uses CSS-based configuration instead of JavaScript config files. The `tailwind.config.ts` file is **NOT used** and is kept only for reference.

**All theme configuration is in:** `app/globals.css`

### Theme Configuration
Colors, fonts, and design tokens are defined using the `@theme` directive:

```css
@import "tailwindcss";

@theme {
  /* Colors - Digital Noir Palette */
  --color-void: #0A0A0F;
  --color-void-light: #141419;
  --color-glitch: #6C5CE7;
  --color-glitch-bright: #A29BFE;
  --color-frost: #F8F9FA;
  --color-mint: #00FFA3;
  --color-alert: #FF3B5C;
  --color-steel-500: #ADB5BD;
  --color-steel-800: #343A40;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Shadows */
  --shadow-glow: 0 0 20px rgba(108, 92, 231, 0.3);
}
```

### Using Theme Colors
Tailwind v4 automatically generates utility classes from `@theme` variables:

```tsx
// Background colors
<div className="bg-void" />        // #0A0A0F
<div className="bg-glitch" />      // #6C5CE7
<div className="bg-frost" />       // #F8F9FA

// Text colors
<p className="text-frost" />       // #F8F9FA
<p className="text-steel-500" />   // #ADB5BD

// With opacity
<div className="bg-glitch/50" />   // 50% opacity

// Borders
<div className="border-steel-800" />
```

### Design System Colors

| Name | Hex | Usage |
|------|-----|-------|
| `void` | #0A0A0F | Main background |
| `void-light` | #141419 | Cards, inputs |
| `glitch` | #6C5CE7 | Primary accent (purple) |
| `glitch-bright` | #A29BFE | Hover states |
| `frost` | #F8F9FA | Primary text |
| `mint` | #00FFA3 | Success, interactive |
| `alert` | #FF3B5C | Errors, destructive |
| `steel-*` | Various | Grays (100-900) |

### Custom Component Classes
Defined in `@layer components` in globals.css:

```css
/* Glass morphism effect */
.glass {
  backdrop-filter: blur(12px);
  background-color: rgba(20, 20, 25, 0.8);
  border: 1px solid var(--color-steel-800);
}

/* Animated scan line */
.scan-line { ... }

/* Glitch text effect */
.glitch-text { ... }

/* Grid pattern background */
.bg-grid-pattern { ... }
```

### Adding New Theme Values
To add new colors or values, edit `app/globals.css`:

```css
@theme {
  /* Add new color */
  --color-accent: #FF6B6B;

  /* Add new shadow */
  --shadow-custom: 0 4px 20px rgba(0, 0, 0, 0.3);
}
```

Then use in components:
```tsx
<div className="bg-accent shadow-custom" />
```

### PostCSS Configuration
The PostCSS config (`postcss.config.mjs`) uses the Tailwind v4 plugin:

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

### Migration Notes
- `tailwind.config.ts` is deprecated in v4
- All `extend` values go in `@theme { }`
- Custom utilities go in `@layer utilities { }`
- Custom components go in `@layer components { }`
- Content paths are auto-detected in v4

## Setup Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys

# Start development server
npm run dev
```

### Build & Deploy
```bash
# Production build
npm run build

# Start production server
npm start

# Deploy to Vercel
git push origin main  # Auto-deploys
```

## Environment Variables

### Required (All Environments)
- `OPENAI_API_KEY` - OpenAI API key for GPT-5.2
- `AUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- `AUTH_GOOGLE_ID` - Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth client secret

### Environment-Specific
- **Local:** `NEXTAUTH_URL=http://localhost:3000`
- **Production:** `NEXTAUTH_URL=https://family-glitch.vercel.app`

### Vercel Setup
Add all environment variables in: Project Settings → Environment Variables
Changes require redeployment to take effect.

## Project Structure

```
family-glitch/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/[...nextauth]/  # NextAuth endpoints
│   │   ├── chat/             # AI chat API (GPT-5.2)
│   │   └── health/           # Health check endpoint
│   ├── auth/signin/          # Sign-in page
│   ├── chat/                 # AI chat demo page (testing only)
│   ├── setup/                # Game setup page (after auth)
│   ├── layout.tsx            # Root layout with SessionProvider
│   └── page.tsx              # Home page (redirects to /setup if authenticated)
├── components/               # React components
│   ├── Header.tsx            # Nav header with auth status
│   ├── HamburgerMenu.tsx     # Main navigation menu (logged-in users)
│   ├── SessionProvider.tsx   # NextAuth session wrapper
│   └── index.ts              # Component exports
├── lib/                      # Shared utilities
│   ├── ai/                   # AI system (modular)
│   │   ├── types.ts          # TypeScript definitions
│   │   ├── config.ts         # AI configuration & defaults
│   │   ├── tools.ts          # Tool registry & definitions
│   │   ├── client.ts         # Client hooks & utilities
│   │   └── README.md         # AI system documentation
│   ├── store/                # State management (Zustand)
│   │   ├── game-store.ts     # Game state with localStorage persist
│   │   ├── player-store.ts   # Player roster (persistent across games)
│   │   ├── use-hydration.ts  # SSR-safe hydration hook
│   │   └── index.ts          # Store exports
│   └── constants.ts          # Global constants
├── auth.ts                   # NextAuth configuration
├── .env.local                # Local environment variables (git-ignored)
├── .env.example              # Template for environment variables
└── AGENTS.md                 # This file
```

## AI System Architecture

### Core Concepts
The AI system is **modular and type-safe**, designed for GPT-5.2 with tool use (function calling).

### Key Files
- **types.ts** - All TypeScript interfaces
- **config.ts** - Model settings, temperature presets
- **tools.ts** - Tool registry for function calling
- **client.ts** - React hooks (`useChat`) and utilities
- **route.ts** - API endpoint with tool execution loop

### Adding New AI Tools

1. **Define the tool** in `lib/ai/tools.ts`:
```typescript
registerTool<{ city: string }>(
  {
    type: 'function',
    name: 'get_weather',
    description: 'Get current weather for a city',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' }
      },
      required: ['city'],
      additionalProperties: false,
    },
  },
  async ({ city }) => {
    // Your implementation
    return { city, temp: 72, condition: 'sunny' };
  }
);
```

2. **Tool executes server-side** in the API route automatically
3. **Strict schemas required** - Never allow arbitrary properties
4. **Type-safe** - Use TypeScript generics for args

### AI Configuration
Configure via `lib/ai/config.ts` or per-request:
```typescript
{
  model: 'gpt-5.2',           // or gpt-5.2-instant, gpt-5.2-thinking
  temperature: 0.7,            // 0.0 (precise) to 1.0 (creative)
  maxTokens: 4096,
  tools: ['tool_name'],        // empty = all tools
  reasoningEffort: 'medium',   // low, medium, high, xhigh
}
```

### Using the AI System

**React Hook:**
```typescript
const { messages, sendMessage } = useChat({ temperature: 0.7 });
await sendMessage('What time is it?');
```

**Direct API:**
```typescript
const response = await sendChatRequest(
  [{ role: 'user', content: 'Hello' }],
  { temperature: 0.5 }
);
```

## Authentication System

### NextAuth.js 5.0 Setup
- **Provider:** Google OAuth only
- **Session:** JWT-based, persists across page loads
- **Protected routes:** Check `await auth()` in server components

### OAuth Flow
1. User clicks "Sign In" → `/auth/signin`
2. Form submits → `signIn('google')`
3. Redirects to Google → User authenticates
4. Google redirects → `/api/auth/callback/google`
5. NextAuth creates session → Redirect to home

### Checking Auth Status

**Server Component:**
```typescript
import { auth } from '@/auth';

export default async function Page() {
  const session = await auth();
  if (!session) redirect('/auth/signin');
  // ...
}
```

**Client Component:**
```typescript
import { useSession } from 'next-auth/react';

export function Component() {
  const { data: session } = useSession();
  if (!session) return <div>Please sign in</div>;
  // ...
}
```

### Sign Out
```typescript
import { signOut } from 'next-auth/react';
await signOut({ redirectTo: '/' });
```

## Navigation & UI

### Hamburger Menu
The app uses a fixed hamburger menu in the top-right corner for logged-in users. The menu is globally available across all authenticated pages.

**Location:** `components/HamburgerMenu.tsx`

**Features:**
- Only visible when user is authenticated
- Smooth slide-in animation from right
- Glassmorphism design matching app aesthetic
- Three menu options:
  1. **How to Play** - Opens modal with game instructions
  2. **Start a New Game** - Resets game data (keeps players), requires confirmation
  3. **Log Out** - Signs user out of Google auth

**Usage:**
The component is automatically included in the root layout and requires no additional setup:

```typescript
// Already included in app/layout.tsx
import { HamburgerMenu } from '@/components/HamburgerMenu';

<SessionProvider>
  <HamburgerMenu />
  {children}
</SessionProvider>
```

**Integrations:**
- Uses `useSession()` from NextAuth to check auth status
- Uses `useGameStore()` to access `startNewGame()` action
- Uses Framer Motion for animations
- Matches Digital Noir design system (glass, frost, steel colors)

### Setup Page
After authentication, users are redirected to the setup page where they configure their player roster.

**Location:** `app/setup/page.tsx`
**Route:** `/setup`

**Features:**
- Add 3-7 players (defaults to 3 empty slots)
- Collect player information:
  - **Name** (required)
  - **Role** (Dad, Mom, Son, Daughter, Brother, Sister, Grandpa, Grandma, Uncle, Aunt, Cousin, Friend, Other)
  - **Age** (required, 1-120)
  - **Avatar** (select from 20 emoji options)
- Add/remove players dynamically
- Form validation with error display
- Smooth animations with Framer Motion
- Data saved to `usePlayerStore` (persists across games)

**Player Avatars:**
The page provides 20 emoji avatars in a grid layout:
👨 👩 👦 👧 🧔 👴 👵 👱‍♂️ 👱‍♀️ 🧑 👨‍🦰 👩‍🦰 👨‍🦱 👩‍🦱 👨‍🦲 👩‍🦲 👨‍🦳 👩‍🦳 🧒 👶

**Design:**
- Glass cards with border-steel-800
- Glitch-themed accent colors
- Responsive grid layout optimized for mobile
- Animated "Continue" button with gradient border
- Player count indicator (X of 7 players)

## State Management & Local Storage

### Zustand with Persist Middleware
The app uses **Zustand** for state management with localStorage persistence, optimized for smartphone gameplay where players pass a single device around.

**Key Features:**
- SSR-safe with Next.js
- Tiny bundle size (~1KB)
- Auto-syncs across tabs
- Type-safe with TypeScript
- Persists state to localStorage with separate keys
- Handles hydration mismatches

### Two-Store Architecture

The app uses **two separate stores** with different persistence strategies:

1. **Player Store** (`player-store.ts`) - Player roster that persists across games
2. **Game Store** (`game-store.ts`) - Current game state that resets between games

This separation ensures player information (names, roles, ages, avatars) is never lost when starting a new game, while game progress can be reset independently.

### Player Store

**Location:** `lib/store/player-store.ts`
**localStorage key:** `family-glitch-players`
**Purpose:** Persistent player roster (survives "Start New Game")

```typescript
export interface Player {
  id: string;
  name: string;
  role: PlayerRole; // Dad, Mom, Son, Daughter, etc.
  age: number;
  avatar: number; // 1-20
}

interface PlayerState {
  players: Player[];
  addPlayer: (player: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id'>>) => void;
  removePlayer: (id: string) => void;
  clearAllPlayers: () => void;
}
```

**Usage:**
```typescript
import { usePlayerStore } from '@/lib/store';

const players = usePlayerStore((state) => state.players);
const addPlayer = usePlayerStore((state) => state.addPlayer);

addPlayer({
  name: 'John',
  role: 'Dad',
  age: 42,
  avatar: 1,
});
```

### Game Store

**Location:** `lib/store/game-store.ts`
**localStorage key:** `family-glitch-game`
**Purpose:** Current game progress (resets with "Start New Game")

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface GameState {
  players: Player[];
  currentRound: number;
  gameStarted: boolean;

  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  startGame: () => void;
  resetGame: () => void;
  nextRound: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Initial state
      players: [],
      currentRound: 0,
      gameStarted: false,

      // Actions
      addPlayer: (player) =>
        set((state) => ({
          players: [...state.players, player],
        })),

      removePlayer: (playerId) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== playerId),
        })),

      startGame: () =>
        set({
          gameStarted: true,
          currentRound: 1,
        }),

      resetGame: () =>
        set({
          players: [],
          currentRound: 0,
          gameStarted: false,
        }),

      nextRound: () =>
        set((state) => ({
          currentRound: state.currentRound + 1,
        })),
    }),
    {
      name: 'family-glitch-game', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Using the Store

**Basic Usage:**
```typescript
'use client';

import { useGameStore } from '@/lib/store/game-store';

export function GameComponent() {
  const players = useGameStore((state) => state.players);
  const addPlayer = useGameStore((state) => state.addPlayer);

  const handleAddPlayer = () => {
    addPlayer({ id: crypto.randomUUID(), name: 'Player 1' });
  };

  return (
    <div>
      <button onClick={handleAddPlayer}>Add Player</button>
      <ul>
        {players.map((player) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**SSR-Safe Usage:**
```typescript
'use client';

import { useHydration } from '@/lib/store/use-hydration';
import { useGameStore } from '@/lib/store/game-store';

export function GameComponent() {
  const hasHydrated = useHydration();
  const players = useGameStore((state) => state.players);

  // Prevent hydration mismatch
  if (!hasHydrated) {
    return <div>Loading...</div>;
  }

  return <div>{players.length} players</div>;
}
```

### Best Practices

1. **Use selectors** - Only subscribe to state you need:
   ```typescript
   const playerCount = useGameStore((state) => state.players.length);
   ```

2. **Batch updates** - Use single `set()` call for multiple changes:
   ```typescript
   set({ players: newPlayers, currentRound: 1, gameStarted: true });
   ```

3. **Partial persistence** - Only persist necessary fields:
   ```typescript
   partialize: (state) => ({
     players: state.players,
     currentRound: state.currentRound
   })
   ```

4. **Handle hydration** - Use `useHydration()` hook to prevent mismatches

5. **Clear on sign out** - Call `resetGame()` when user signs out

### Local Storage Key
Game state is stored in localStorage under the key: `family-glitch-game`

### Migration Support
To handle schema changes across app versions:
```typescript
{
  name: 'family-glitch-game',
  version: 1,
  migrate: (persistedState: any, version: number) => {
    if (version === 0) {
      // Migrate from v0 to v1
      persistedState.newField = 'default';
    }
    return persistedState;
  },
}
```

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - All types must be explicit
- **No `any` types** - Use proper typing or `unknown`
- **Interfaces over types** for objects
- **Export types separately** from implementation

### React Components
- **Server components by default** - Only add `'use client'` when needed
- **Functional components** - No class components
- **Props interfaces** - Define and export for reusable components
- **Inline styles** - Currently using inline styles (no CSS framework yet)

### API Routes
- **Export runtime** - Add `export const runtime = 'nodejs'` for Node features
- **Error handling** - Always wrap in try-catch
- **Type request/response** - Use typed interfaces
- **Return NextResponse.json()** - Never plain Response

### Naming Conventions
- **Files:** kebab-case (`user-profile.tsx`)
- **Components:** PascalCase (`UserProfile`)
- **Functions:** camelCase (`getUserProfile`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces:** PascalCase (`UserSession`)

## Testing

**Currently:** No test framework configured
**TODO:** Add Jest + React Testing Library

## Security Considerations

### API Keys
- **Never commit** `.env.local` - Git-ignored by default
- **Server-side only** - API keys must never reach the client
- **Validate at build** - OpenAI client fails gracefully if key missing

### Tool Execution
- **Server-side only** - Tools execute in API routes, never client
- **Strict schemas** - All tools use `additionalProperties: false`
- **Error handling** - Tool failures return error messages, not crashes
- **Rate limiting** - TODO: Add Vercel KV or Upstash rate limiting

### Authentication
- **Secure sessions** - NextAuth handles JWT signing/verification
- **HTTPS only in prod** - Vercel enforces HTTPS
- **OAuth state validation** - NextAuth prevents CSRF

## Deployment

### Vercel Setup
1. **Connect GitHub repo** - Auto-deploys on push to `main`
2. **Add environment variables** - Required for production
3. **Configure OAuth redirect** - Add to Google Cloud Console:
   - `https://family-glitch.vercel.app/api/auth/callback/google`

### Build Process
1. Vercel detects push to `main`
2. Runs `npm install`
3. Runs `npm run build`
4. Deploys if successful
5. Automatically invalidates CDN cache

### Checking Deployment
- **Status:** Vercel Dashboard → Deployments
- **Logs:** Click deployment → Build Logs / Runtime Logs
- **Health check:** `https://family-glitch.vercel.app/api/health`

## API Endpoints

### `/api/chat` (POST)
AI chat with tool use. Requires OpenAI API key.

**Request:**
```json
{
  "messages": [{"role": "user", "content": "Hello"}],
  "config": {
    "temperature": 0.7,
    "model": "gpt-5.2"
  }
}
```

**Response:**
```json
{
  "text": "Hello! How can I help you?",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  }
}
```

### `/api/auth/[...nextauth]` (GET/POST)
NextAuth endpoints. Handled automatically by NextAuth.js.

### `/api/health` (GET)
Diagnostic endpoint. Returns environment info without calling OpenAI.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T...",
  "environment": {
    "nodeVersion": "v20.x.x",
    "hasApiKey": true,
    "apiKeyPrefix": "sk-proj"
  }
}
```

## Common Issues & Solutions

### Build Fails
- **Check TypeScript errors** - Run `npm run build` locally first
- **Missing env vars** - Ensure all required vars are set in Vercel
- **Import errors** - Use `@/` alias for absolute imports

### OAuth Not Working
- **Check redirect URIs** - Must match exactly in Google Cloud Console
- **Check env vars** - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`
- **Check NEXTAUTH_URL** - Must match deployment URL

### AI Chat 500 Errors
- **Check API key** - Visit `/api/health` to verify it's detected
- **Check model name** - GPT-5.2 parameters differ from GPT-4
- **Check logs** - Vercel Runtime Logs show actual error

### Session Not Persisting
- **Check AUTH_SECRET** - Must be set and consistent
- **Check cookies** - Ensure browser allows cookies
- **Check NEXTAUTH_URL** - Must match current domain

## Git Workflow

### Commit Messages
Follow conventional commits format:
```
feat: add user profile page
fix: resolve OAuth redirect issue
docs: update AGENTS.md
refactor: simplify AI tool registry
```

### Co-authored Commits
All commits include:
```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Branch Strategy
- **main** - Production branch, auto-deploys to Vercel
- Feature branches not currently used (direct to main)

## Recent Updates (2026-01-19)

### Critical Fixes
- **Fixed circular dependency error** - Lazy-loaded template tools to avoid `toolRegistry` initialization race condition
- **Fixed JSON parse error** - Added `toolChoice: 'required'` to force AI to use template tools; API now returns template results immediately as JSON
- **Fixed player name in questions** - Strengthened prompt rules and added client-side sanitization to remove player names from question text
- **Fixed player selection bug** - Resolved race condition where commentary button showed wrong player name (moved state update to button click handler)
- **Fixed React render error** - Moved `router.push()` into `useEffect` on home page

### AI Prompt Improvements
- **Simplified question format** - Removed multi-part questions, made prompts shorter and punchier
- **Reframed rules positively** - Changed from "don't do this" to "do this" format
- **Strategic question design** - Questions now focus on gathering data that can be referenced/contradicted later
- **Shorter commentary** - AI now provides 1-2 punchy sentences instead of verbose responses
- **Better examples** - Replaced silly questions (geese, etc.) with meaningful, character-revealing questions

### Game Flow Enhancements
- **Manual progression** - Replaced auto-timer with "Pass to {NextPlayer}" button after commentary
- **Consistent state management** - Player index only updates when transitioning to next player, not during commentary

## Future Enhancements

### Planned Features
- [ ] Add streaming support to AI chat
- [ ] Implement rate limiting
- [ ] Add database (Vercel Postgres or similar)
- [ ] Create actual game mechanics (scoring, end conditions)
- [ ] Add test suite
- [ ] Add error tracking (Sentry)
- [ ] Add analytics

### Architecture Improvements
- [x] Implement state management with Zustand + persist
- [x] Configure Tailwind CSS v4 with custom theme
- [x] Fix AI tool calling and template system
- [x] Optimize question quality and game flow
- [ ] Add component library (shadcn/ui or similar)
- [ ] Add API middleware for auth checks
- [ ] Create shared UI components

## Resources

- **Next.js Docs:** https://nextjs.org/docs
- **NextAuth.js Docs:** https://next-auth.js.org
- **OpenAI API Docs:** https://platform.openai.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **GPT-5.2 Guide:** https://openai.com/index/introducing-gpt-5-2/

## Questions?

For agent-specific questions about implementation details, check:
- `lib/ai/README.md` - Comprehensive AI system docs
- `lib/constants.ts` - All global constants
- `.env.example` - Required environment variables

This project follows Vercel/Next.js best practices and uses OpenAI's recommended patterns for GPT-5.2 integration.

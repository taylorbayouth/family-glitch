# Family Glitch

Family Glitch is a pass-and-play party game where a snarky AI host runs short rounds, asks players questions, and triggers mini-games. The app is built with Next.js 15, GPT-5.2 tool calling, and Google OAuth.

Live Site: https://family-glitch.vercel.app
Repository: https://github.com/taylorbayouth/family-glitch

## Features

- Next.js 15 App Router with React 19 and TypeScript
- Google OAuth via NextAuth v5
- GPT-5.2 chat completions with server-side tool execution
- Template-driven input system (6 templates)
- Mini-game registry (Trivia Challenge, Personality Match, Mad Libs, Cryptic Connection, Hard Trivia)
- End-game announcer results (AI rankings and blurbs)
- Zustand stores with localStorage persistence
- Tailwind CSS v4 theme tokens in `app/globals.css`
- Framer Motion animations

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Required variables:
- `OPENAI_API_KEY`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL` (local: `http://localhost:3000`)

3. Start the dev server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Key Routes

- `/` Home and sign-in entry
- `/setup` Player roster setup (3-7 players)
- `/play` Main game flow
- `/chat` AI chat demo page (development/testing)

## AI System

See `lib/ai/README.md` for:
- Tool registry details
- Template tools and mini-game triggers
- Chat API usage
- Configuration options

## Deployment

```bash
npm run build
npm start
```

Vercel deployment is configured to auto-deploy from `main`.

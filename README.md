# Family Glitch

A Next.js application for Vercel deployment with GPT-5.2 integration.

**Live Site:** [family-glitch.vercel.app](https://family-glitch.vercel.app)
**Repository:** [github.com/taylorbayouth/family-glitch](https://github.com/taylorbayouth/family-glitch)

## Features

- Next.js 15 with React 19
- TypeScript
- GPT-5.2 with OpenAI Responses API
- Modular tool system for AI function calling
- Type-safe AI utilities and React hooks

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## AI System

See [lib/ai/README.md](lib/ai/README.md) for complete documentation on:
- Using the chat API
- Creating custom tools
- Configuration options
- React hooks

**Demo:** Visit `/chat` to try the AI system with tool use.

## Deployment

Deploy to Vercel via the Vercel CLI:

```bash
vercel
```

Make sure to add `OPENAI_API_KEY` to your Vercel project environment variables.

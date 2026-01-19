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
- **Deployment:** Vercel
- **Package Manager:** npm

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
│   ├── chat/                 # AI chat demo page
│   ├── layout.tsx            # Root layout with SessionProvider
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── Header.tsx            # Nav header with auth status
│   └── SessionProvider.tsx   # NextAuth session wrapper
├── lib/                      # Shared utilities
│   ├── ai/                   # AI system (modular)
│   │   ├── types.ts          # TypeScript definitions
│   │   ├── config.ts         # AI configuration & defaults
│   │   ├── tools.ts          # Tool registry & definitions
│   │   ├── client.ts         # Client hooks & utilities
│   │   └── README.md         # AI system documentation
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

## Future Enhancements

### Planned Features
- [ ] Add streaming support to AI chat
- [ ] Implement rate limiting
- [ ] Add database (Vercel Postgres or similar)
- [ ] Add more AI tools (weather, calendar, etc.)
- [ ] Create actual game mechanics
- [ ] Add test suite
- [ ] Add error tracking (Sentry)
- [ ] Add analytics

### Architecture Improvements
- [ ] Move inline styles to Tailwind CSS
- [ ] Add component library (shadcn/ui or similar)
- [ ] Implement proper state management if needed
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

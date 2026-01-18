# AGENTS.md - Family Glitch

Instructions for AI agents working on this codebase.

---

## Project Overview

Family Glitch is a pass-and-play browser game using OpenAI's GPT-4o as a live Game Master. The game is designed for mobile-first usage at restaurant tables.

**Key Insight:** Most game logic lives in the AI system prompt, not in JavaScript. The frontend is primarily a display layer that renders AI responses.

---

## Architecture Principles

### The "God Object" Pattern

All game state is stored in a single Zustand store (`src/lib/gameStore.ts`). This state object is passed to the AI on every turn. The AI returns updates which are applied to this state.

```
User Action → API Call (with full state) → AI Response → State Update → Re-render
```

### AI as Game Master

The AI handles:
- Mini-game selection and question generation
- Answer evaluation with fuzzy/semantic matching
- Score calculation and commentary
- Finale poem generation

The frontend handles:
- Phase routing and display
- User input collection
- Animations and transitions
- State persistence

### Phase-Based UI

The game has 6 phases: `SETUP`, `HANDOFF`, `SHADOW`, `PLAY`, `JUDGMENT`, `FINALE`. Each phase has a dedicated component in `src/components/`.

---

## Code Conventions

### TypeScript

- All types defined in `src/types/game.ts`
- Use strict typing - avoid `any`
- Prefer interfaces over type aliases for objects
- Export types that are used across multiple files

### React/Next.js

- Use `'use client'` directive for all components (this is a client-heavy app)
- Prefer functional components with hooks
- Use Zustand for state, not React Context
- Keep components focused - one phase per component

### Styling

- Tailwind CSS for all styling
- Mobile-first approach (base styles for mobile, `sm:` for larger)
- Glitch aesthetic: cyan (`#00ffff`), magenta (`#ff00ff`), black backgrounds
- Minimum tap target: 48px (use `py-3` or `py-4` on buttons)
- Custom animations in `src/app/globals.css`

### File Organization

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components (one per phase)
├── lib/           # Utilities, store, prompts
└── types/         # TypeScript type definitions
```

---

## Working with the AI System Prompt

The system prompt in `src/lib/prompts.ts` is critical. Changes here affect all game behavior.

### Structure

1. **Persona:** Defines "The Glitch" personality
2. **Player Context:** Injected from game state
3. **Mini-Game Rules:** Full descriptions of each cartridge
4. **Phase Logic:** What to do in each phase
5. **Output Format:** JSON schema the AI must follow
6. **Fuzzy Judging Rules:** How to match answers semantically

### Modifying Mini-Games

To add or modify a mini-game:

1. Add the type to `MiniGame` in `src/types/game.ts`
2. Update the system prompt in `src/lib/prompts.ts`
3. No frontend changes needed (unless new input type required)

### JSON Response Contract

The AI must return valid JSON matching `AIResponse` type. The `response_format: { type: 'json_object' }` setting in the API route enforces JSON output.

---

## Common Tasks

### Adding a New Mini-Game

1. Add to `MiniGame` type in `src/types/game.ts`
2. Add rules to system prompt in `src/lib/prompts.ts` under "THE MINI-GAMES"
3. Test by playing through - the AI will select it randomly

### Adding a New Phase

1. Add to `GamePhase` type in `src/types/game.ts`
2. Create component in `src/components/[PhaseName]Phase.tsx`
3. Add case to `GameScreen.tsx` switch statement
4. Update phase transitions in `GameScreen.tsx` handlers
5. Update system prompt phase logic if AI-driven

### Modifying Scoring

All scoring logic is in the system prompt. Search for "Scoring:" in `src/lib/prompts.ts` to find point values.

### Changing Game Length

Modify `maxTurns` in `src/lib/gameStore.ts`:

```typescript
const createInitialState = (): GameState => ({
  meta: {
    maxTurns: 10,  // Change this
    // ...
  },
});
```

### Debugging AI Responses

1. Check browser DevTools Network tab for `/api/turn` requests
2. Look at request payload (includes full game state)
3. Look at response JSON for AI output
4. Add `console.log` in `src/app/api/turn/route.ts` for server-side debugging

---

## Testing

### Manual Testing Checklist

- [ ] Start new game with 2-3 players
- [ ] Verify all 5 mini-games appear (may need multiple playthroughs)
- [ ] Check shadow data collection
- [ ] Complete full game to finale
- [ ] Verify poem references shadow words and game events
- [ ] Test fuzzy matching (type variations of correct answers)
- [ ] Test on mobile device
- [ ] Test page refresh mid-game (state should persist)

### Build Verification

```bash
npm run build  # Should complete without errors
npm run lint   # Should pass
```

---

## Environment Setup

Required environment variable:

```env
OPENAI_API_KEY=sk-...
```

For local development, create `.env.local`. For Vercel, set via dashboard or CLI.

---

## Deployment

### Vercel

```bash
vercel --prod
```

The project is configured for Vercel. Environment variables must be set in Vercel dashboard.

### Important: API Route

The API route at `src/app/api/turn/route.ts` lazy-loads the OpenAI client to prevent build failures when the API key isn't available during static generation.

---

## Known Limitations

1. **No real-time sync:** Single device, pass-and-play only
2. **API dependency:** Requires internet for AI calls
3. **Token usage:** ~2-3K tokens per turn (system prompt + state + response)
4. **No authentication:** Anyone with the URL can play

---

## Troubleshooting

### "The Glitch encountered a temporal anomaly"

- Check browser console for errors
- Verify `OPENAI_API_KEY` is set
- Check OpenAI API status
- Look at `/api/turn` network response for details

### State seems corrupted

Clear localStorage:
```javascript
localStorage.removeItem('family-glitch-storage');
```

### AI responses are wrong/weird

- Check system prompt formatting
- Ensure JSON schema is clear
- Temperature is set to 0.9 for creativity - lower for more consistent responses

---

## Dependencies

| Package | Purpose | Update Caution |
|---------|---------|----------------|
| `next` | Framework | Major versions may break App Router |
| `openai` | AI SDK | API changes may affect response parsing |
| `zustand` | State | Stable, safe to update |
| `framer-motion` | Animation | Generally safe |

---

## Contact

For questions about game design intent or family-specific features, consult the original design document or ask Taylor.

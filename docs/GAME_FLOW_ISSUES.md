# Game Flow Issues & Fixes

This document tracks critical bugs and robustness issues found during the complete game flow audit.

## Status: ✅ CRITICAL BUGS FIXED

All 4 critical bugs have been fixed (2026-01-19). The game should now be playable from start through multiple turns.

---

## Critical Issues (Must Fix)

### 1. ✅ Initial Phase Never Transitions to 'pass'
**Severity:** CRITICAL - Game is unplayable
**Location:** `app/play/page.tsx:59-82`
**Status:** ✅ FIXED

**Problem:**
After initial `loadQuestion()` completes, the phase remains `'loading'`, so the pass screen never appears. User is stuck on "Initializing game..." forever.

**Root Cause:**
```typescript
useEffect(() => {
  // ...
  loadQuestion(); // Completes successfully
  // ❌ Phase is never set to 'pass'
}, []);
```

**Fix:**
```typescript
useEffect(() => {
  // ... existing validation ...

  // Load first question, then show pass screen
  loadQuestion().then(() => {
    setPhase('pass'); // ✅ Show pass screen when ready
  });
}, []);
```

**Alternative Fix:**
Set phase to 'pass' at the end of loadQuestion:
```typescript
const loadQuestion = async () => {
  try {
    // ... existing question loading logic ...
    setPhase('pass'); // ✅ Transition to pass screen
  } finally {
    setIsLoadingQuestion(false);
  }
};
```

---

### 2. ✅ Turn ID Mismatch
**Severity:** CRITICAL - Breaks turn tracking
**Location:** `app/play/page.tsx:107-117`, `lib/store/game-store.ts:114-128`
**Status:** ✅ FIXED

**Problem:**
`addTurn()` generates a UUID internally, but the code creates a different `turnId` locally. The `currentTurnId` in state doesn't match any turn in the store.

**Current Code:**
```typescript
// play/page.tsx line 107
const turnId = crypto.randomUUID(); // ID #1
addTurn({ ... }); // Generates ID #2 internally (line 118 in game-store)
setCurrentTurnId(turnId); // ❌ Uses ID #1, but store has ID #2
```

**Fix Option 1:** Return the generated ID from addTurn
```typescript
// game-store.ts
addTurn: (turnInput) => {
  const turnId = crypto.randomUUID();
  const newTurn: Turn = {
    ...turnInput,
    turnId,
    timestamp: new Date(),
    status: 'pending',
    response: null,
  };

  set((state) => ({
    turns: [...state.turns, newTurn],
    currentTurnIndex: state.turns.length,
  }));

  return turnId; // ✅ Return the ID
},

// play/page.tsx
const turnId = addTurn({ ... }); // ✅ Use returned ID
setCurrentTurnId(turnId);
```

**Fix Option 2:** Accept turnId as parameter
```typescript
// play/page.tsx
const turnId = crypto.randomUUID();
addTurn({
  ...turnInput,
  turnId, // ✅ Pass ID explicitly
});
setCurrentTurnId(turnId);

// game-store.ts - Update type
export type CreateTurnInput = Omit<Turn, 'timestamp' | 'status' | 'response'>;
```

---

### 3. ✅ Player Selector Template Missing Required Data
**Severity:** CRITICAL - AI cannot use ask_player_vote tool
**Location:** `app/play/page.tsx:289-297`, `lib/ai/template-tools.ts:417-431`
**Status:** ✅ FIXED

**Problem:**
The `tpl_player_selector` template requires a `players` array and `currentPlayerId`, but the AI tool doesn't provide this data. When the template renders, it will fail.

**Template Requirements:**
```typescript
interface PlayerSelectorParams {
  prompt: string;
  players: Player[]; // ❌ Missing
  currentPlayerId: string; // ❌ Missing
  allowMultiple?: boolean;
  maxSelections?: number;
}
```

**AI Tool Returns:**
```typescript
{
  templateType: 'tpl_player_selector',
  prompt: "Who is most likely to...",
  params: {
    allowMultiple: false,
    maxSelections: 1,
    // ❌ No players array
  }
}
```

**Fix:** Inject player data when rendering
```typescript
// play/page.tsx line 289
<TemplateRenderer
  templateType={currentTemplate.templateType}
  params={{
    prompt: currentTemplate.prompt,
    subtitle: currentTemplate.subtitle,
    ...currentTemplate.params,
    // ✅ Inject players for player selector template
    ...(currentTemplate.templateType === 'tpl_player_selector' && {
      players: players,
      currentPlayerId: currentPlayer.id,
    }),
    onSubmit: handleResponse,
  }}
/>
```

---

### 4. ✅ Date Serialization Type Error
**Severity:** HIGH - Causes type errors after page reload
**Location:** `lib/store/game-store.ts:119`, `lib/types/game-state.ts:25`
**Status:** ✅ FIXED

**Problem:**
Turn timestamps are stored as `Date` objects but localStorage serializes them to strings. After page reload, types don't match.

**Type Definition:**
```typescript
interface Turn {
  timestamp: Date; // ❌ Becomes string after localStorage
}
```

**Storage:**
```typescript
addTurn: (turnInput) => {
  const newTurn: Turn = {
    ...turnInput,
    timestamp: new Date(), // ✅ Date object
  };
  // Stored to localStorage as ISO string
}
```

**After Reload:**
```typescript
// timestamp is now: "2026-01-19T12:34:56.789Z" (string)
// But type says: Date
```

**Fix Option 1:** Use ISO strings consistently
```typescript
// game-state.ts
export interface Turn {
  timestamp: string; // ✅ Always a string
}

// game-store.ts
addTurn: (turnInput) => {
  const newTurn: Turn = {
    ...turnInput,
    timestamp: new Date().toISOString(), // ✅ Store as string
  };
}
```

**Fix Option 2:** Add migration/rehydration
```typescript
// game-store.ts
persist(
  (set, get) => ({ ... }),
  {
    name: 'family-glitch-game',
    storage: createJSONStorage(() => localStorage),
    // ✅ Convert strings back to Dates on load
    onRehydrateStorage: () => (state) => {
      if (state?.turns) {
        state.turns = state.turns.map(turn => ({
          ...turn,
          timestamp: new Date(turn.timestamp),
        }));
      }
    },
  }
)
```

---

## Robustness Issues (Should Fix)

### 5. ⚠️ No Error Recovery on Initial Load
**Severity:** MEDIUM
**Location:** `app/play/page.tsx:81`
**Status:** ❌ Not Fixed

**Problem:** If initial `loadQuestion()` fails, user is stuck on loading screen with no way to retry except refresh.

**Fix:** Show retry button on error
```typescript
if (phase === 'loading' && !currentTemplate && !aiCommentary) {
  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="glass rounded-xl p-6 max-w-md text-center">
          <p className="text-alert mb-4">{error}</p>
          <button
            onClick={() => { setError(null); loadQuestion(); }}
            className="bg-glitch hover:bg-glitch-bright text-frost font-bold py-3 px-6 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  // ... existing loading screen
}
```

---

### 6. ⚠️ Messages State Race Condition
**Severity:** MEDIUM
**Location:** `app/play/page.tsx:94`
**Status:** ❌ Not Fixed

**Problem:** `loadQuestion()` uses `messages` state, but if called during initialization, messages might not include system prompt yet.

**Fix:** Pass messages explicitly
```typescript
const loadQuestion = async (currentMessages?: ChatMessage[]) => {
  const msgs = currentMessages || messages;
  const newMessages: ChatMessage[] = [
    ...msgs,
    { role: 'user', content: `It's ${currentPlayer?.name}'s turn...` },
  ];
  // ...
};

// In useEffect
useEffect(() => {
  const systemPrompt = buildGameMasterPrompt(players, { ... });
  const initialMessages = [{ role: 'system', content: systemPrompt }];
  setMessages(initialMessages);

  loadQuestion(initialMessages); // ✅ Pass explicitly
}, []);
```

---

### 7. ⚠️ Memory Leak from Unmounted setTimeout
**Severity:** MEDIUM
**Location:** `app/play/page.tsx:178`
**Status:** ❌ Not Fixed

**Problem:** If component unmounts during 2-second commentary delay, state update happens on unmounted component.

**Fix:** Clean up timeout on unmount
```typescript
const commentaryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  return () => {
    if (commentaryTimeoutRef.current) {
      clearTimeout(commentaryTimeoutRef.current);
    }
  };
}, []);

// In handleResponse
commentaryTimeoutRef.current = setTimeout(() => {
  setPhase('pass');
  loadQuestion();
}, 2000);
```

---

### 8. ⚠️ No Game End Condition
**Severity:** MEDIUM
**Location:** `app/play/page.tsx:169-173`
**Status:** ❌ Not Fixed

**Problem:** Game loops indefinitely with no end state.

**Fix:** Check turn count and end game
```typescript
// In handleResponse, after completeTurn
const totalTurns = players.length * (settings?.totalRounds || 10);
if (turnNumber >= totalTurns) {
  router.push('/results');
  return;
}
```

**Note:** Requires creating a results page (`app/results/page.tsx`).

---

### 9. ⚠️ AI Response Not Validated
**Severity:** MEDIUM
**Location:** `app/play/page.tsx:104`
**Status:** ❌ Not Fixed

**Problem:** No validation that AI's response matches expected template schema before rendering.

**Fix:** Validate before rendering
```typescript
import { validateTemplateParams } from '@/components/input-templates';

// After parsing AI response (line 104)
const templateConfig = JSON.parse(response.text);

const validation = validateTemplateParams(
  templateConfig.templateType,
  {
    prompt: templateConfig.prompt,
    ...templateConfig.params,
    onSubmit: () => {}, // Dummy for validation
  }
);

if (!validation.valid) {
  console.error('Invalid template params:', validation.errors);
  setError(`AI returned invalid question format. Please try again.`);
  return;
}
```

---

### 10. ⚠️ Players Check Happens Too Late
**Severity:** MEDIUM
**Location:** `app/play/page.tsx:60-63`
**Status:** ❌ Not Fixed

**Problem:** Player check happens after starting initialization. An AI call might start before the redirect.

**Fix:** Check immediately and return early
```typescript
useEffect(() => {
  // ✅ Check first
  if (players.length === 0) {
    router.push('/setup');
    return; // Stop initialization
  }

  // ... rest of initialization
}, [players, router]); // Add dependencies
```

---

## Minor Issues (Nice to Have)

### 11. No Visual Feedback for Points
**Location:** `app/play/page.tsx:149`
**Recommendation:** Show a "+10 points!" animation when points are awarded.

### 12. No Duplicate Name Check
**Location:** `app/setup/page.tsx:102-122`
**Recommendation:** Warn if multiple players have the same name.

### 13. Avatar Index Fragility
**Location:** Multiple files (PassToPlayerScreen, setup page)
**Recommendation:** Create a shared AVATARS constant and helper function.

---

## Testing Checklist

After fixes are applied, test:

- [ ] Initial load shows pass screen (not stuck on loading)
- [ ] First player can unlock and see their question
- [ ] First player can submit an answer
- [ ] AI commentary appears for 2 seconds
- [ ] Second player's pass screen appears automatically
- [ ] Second player's question is already loaded (instant)
- [ ] All 6 template types work correctly
- [ ] Player selector template shows all other players
- [ ] Scores update correctly after each turn
- [ ] Game ends after X turns (or loops as designed)
- [ ] Page reload preserves game state
- [ ] Timestamps display correctly after reload
- [ ] Error handling works (test with network offline)
- [ ] Retry button works after errors
- [ ] Component cleanup happens correctly (no warnings in console)

---

## Documentation Updates Needed

See [AGENTS.md](../AGENTS.md) - Missing:
- Input templates system overview
- Game master prompt architecture
- Play page flow diagram
- Template tools documentation
- Turn-based state management

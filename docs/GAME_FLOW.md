# Game Flow Documentation

Complete documentation of the Family Glitch game flow from setup to gameplay.

## Overview

Family Glitch uses a **pass-and-play** model where:
1. Questions are **preloaded** during the "pass" screen to minimize wait time
2. Players **slide to unlock** their question for privacy
3. Questions use one of **6 dynamic input templates** (or mini-games in Act 2+)
4. AI provides **witty commentary** (max 10 words) after each response
5. Game continues in rounds until complete

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  1. SETUP SCREEN (/setup)                               │
│  - Add 3-7 players                                      │
│  - Configure names, roles, ages, avatars               │
│  - Click "Continue" → /play                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. PASS TO PLAYER SCREEN (PassToPlayerScreen)         │
│  - Shows player avatar & name                          │
│  - Privacy message: "Pass phone to X"                  │
│  - AI PRELOADS QUESTION during this screen ⚡          │
│  - Slide to unlock mechanism                           │
└────────────────────┬────────────────────────────────────┘
                     │ (player slides)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. QUESTION SCREEN (TemplateRenderer)                 │
│  - Question already loaded (no wait!)                  │
│  - One of 6 input templates rendered                   │
│  - Player interacts and submits                        │
└────────────────────┬────────────────────────────────────┘
                     │ (onSubmit)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. AI COMMENTARY SCREEN                                │
│  - Shows AI's witty 10-word max response               │
│  - Points awarded (visible in header)                  │
│  - Tap "Pass to Next Player" to continue               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
                Back to Step 2 (next player)
```

## File Structure

```
app/
├── setup/
│   └── page.tsx                  # Player setup form
└── play/
    └── page.tsx                  # Main game flow controller

components/
├── PassToPlayerScreen.tsx        # Privacy screen between turns
├── SlideToUnlock.tsx             # Swipeable unlock mechanism
├── GameProgressBar.tsx           # Visual progress indicator with acts
├── input-templates/
│   ├── TextAreaTemplate.tsx      # All 6 templates...
│   └── index.tsx                 # TemplateRenderer
└── mini-games/
    ├── TriviaChallengeUI.tsx     # Trivia challenge mini-game UI
    ├── PersonalityMatchUI.tsx    # Personality match mini-game UI
    └── index.tsx                 # Mini-game exports

lib/
├── ai/
│   ├── game-master-prompt.ts    # System prompt with examples
│   ├── template-tools.ts        # 8 tools for AI to call
│   └── client.ts                # API communication
├── mini-games/
│   ├── index.ts                 # Mini-game exports
│   ├── eligibility.ts           # Turn eligibility for trivia
│   ├── trivia-challenge/
│   │   └── prompt.ts            # Quizmaster AI prompt
│   └── personality-match/
│       └── prompt.ts            # Analyst AI prompt
└── store/
    ├── player-store.ts          # Persistent player data
    └── game-store.ts            # Game state & turns
```

## Phase Breakdown

### Phase 1: Setup (`/setup`)

**Location:** [app/setup/page.tsx](../app/setup/page.tsx)

**What happens:**
1. User adds 3-7 players
2. Each player gets: name, role, age, avatar
3. Data stored in `player-store` (persists across games)
4. Click "Continue" navigates to `/play`

**Key features:**
- Expandable player cards
- Minimum 3, maximum 7 players
- Form validation
- Avatar selection (14 image avatars)

---

### Phase 2: Pass to Player (`PassToPlayerScreen`)

**Location:** [components/PassToPlayerScreen.tsx](../components/PassToPlayerScreen.tsx)

**What happens:**
1. Shows current player's avatar, name, role
2. Privacy message: "Pass the phone to [Name]"
3. **CRITICAL:** AI preloads question during this screen
4. Slide-to-unlock becomes active when question is loaded
5. Player slides to reveal their question

**Key features:**
- Privacy-focused design (large avatar, clear name)
- Loading indicator while question loads
- Smooth animations
- "Privacy Mode Active" warning

**Preloading logic:**
```typescript
// In app/play/page.tsx
const loadQuestion = async () => {
  setIsLoadingQuestion(true);

  // Call AI to get question + template
  const response = await sendChatRequest(messages);
  const templateConfig = JSON.parse(response.text);

  setCurrentTemplate(templateConfig);
  setIsLoadingQuestion(false);
};

// Called when showing pass screen
setPhase('pass');
loadQuestion(); // ⚡ Preload while showing pass screen
```

---

### Phase 3: Question Screen (`TemplateRenderer`)

**Location:** [app/play/page.tsx](../app/play/page.tsx) + [components/input-templates/](../components/input-templates/)

**What happens:**
1. Question is already loaded (instant reveal)
2. One of 6 templates is rendered based on AI's choice
3. Player interacts with template
4. Player taps submit button (varies by template)
5. Response collected and stored

**Template Selection:**
AI chooses from:
- `ask_for_text` → TextAreaTemplate
- `ask_for_list` → TextInputTemplate
- `ask_binary_choice` → TimedBinaryTemplate
- `ask_word_selection` → WordGridTemplate
- `ask_rating` → SliderTemplate
- `ask_player_vote` → PlayerSelectorTemplate

**Example flow:**
```typescript
// AI calls tool
{
  "tool_calls": [{
    "function": {
      "name": "ask_binary_choice",
      "arguments": {
        "prompt": "Quick! Pizza or Tacos?",
        "leftText": "Pizza 🍕",
        "rightText": "Tacos 🌮",
        "seconds": 5
      }
    }
  }]
}

// Tool returns config
{
  "templateType": "tpl_timed_binary",
  "prompt": "Quick! Pizza or Tacos?",
  "params": { "leftText": "Pizza 🍕", "rightText": "Tacos 🌮", "seconds": 5 }
}

// React renders
<TemplateRenderer
  templateType="tpl_timed_binary"
  params={{...config, onSubmit: handleResponse}}
/>
```

**Header shows:**
- Turn number
- Current player name
- Current score

---

### Phase 4: AI Commentary

**Location:** [app/play/page.tsx](../app/play/page.tsx)

**What happens:**
1. Player's response sent to AI
2. AI generates 10-word max witty commentary
3. Commentary displayed with robot emoji
4. Points awarded (10 base points)
5. Player taps to pass to the next player

**Commentary generation:**
```typescript
const handleResponse = async (response: any) => {
  // Store response
  completeTurn(currentTurnId, response, duration);

  // Get AI commentary
  const aiResponse = await sendChatRequest([
    ...messages,
    {
      role: 'user',
      content: `${currentPlayer.name} responded: ${JSON.stringify(response)}. React in MAX 10 WORDS. One killer line only.`
    }
  ]);

  setAiCommentary(aiResponse.text);
  // Wait for player to tap "Pass to Next Player" before advancing
};
```

---

## State Management

### Player Store (Persistent)
```typescript
// Stored in localStorage: 'family-glitch-players'
{
  players: [
    {
      id: "uuid",
      name: "Taylor",
      role: "Dad",
      age: 42,
      avatar: 5
    }
  ]
}
```

**Survives:**
- Page refreshes
- "Start Over" clicks
- Multiple game sessions

### Game Store (Session)
```typescript
// Stored in localStorage: 'family-glitch-game'
{
  gameId: "uuid",
  status: "playing",
  turns: [
    {
      turnId: "uuid",
      playerId: "player-uuid",
      playerName: "Taylor",
      templateType: "tpl_slider",
      prompt: "How hungry are you?",
      templateParams: { min: 0, max: 10 },
      response: { value: 8 },
      score: 10,
      duration: 5.2,
      timestamp: "2026-01-19T...",
      status: "completed"
    }
  ],
  scores: {
    "player-uuid": 50
  }
}
```

**Reset on:**
- "Start Over" button
- New game

---

## AI Integration

### System Prompt

Built dynamically with:
```typescript
buildGameMasterPrompt(players, gameState)
```

**Includes:**
- Game Master personality (snarky, witty)
- Family Glitch description
- Player roster with roles/ages
- Current scores
- Recent turns (for continuity)
- Question philosophy (dynamic vs static)
- 9 question categories with examples
- Example questions for all 6 templates

### Tool Calls

AI has access to 8 tools:
1. `ask_for_text` - Detailed paragraphs
2. `ask_for_list` - Multiple short answers
3. `ask_binary_choice` - Timed this-or-that
4. `ask_word_selection` - Grid selection
5. `ask_rating` - Scale ratings
6. `ask_player_vote` - Vote for another player
7. `trigger_trivia_challenge` - Mini-game (Act 2+ only)
8. `trigger_personality_match` - Mini-game (Act 2+ only)

**Tool selection is automatic** - AI chooses based on:
- Question type
- Context
- Tool descriptions in schema
- Current act (mini-games only available in Act 2+)

---

## Question Categories

### 1. Current Vibe (Context-Specific)
"Look at Dad. What is his exact 'tell' that he's hungry right now?"

### 2. Deep Lore (History)
"What was the specific name of Eliana's favorite stuffed animal at age 4?"

### 3. Tells & Triggers (Behavioral)
"What three-word phrase does Beth use when she's 'done' with a conversation?"

### 4. Hypotheticals (Scenarios)
"If the family was in a horror movie, who investigates the scary noise first?"

### 5. Cringe (Vulnerabilities)
"What slang word does Eliana use that Dad says wrong?"

### 6. Fermi Problems (Estimation)
"How many french fries are being eaten in this restaurant right now?"

### 7. The Great Filter (Evolution)
"If designing Human 2.0, what body part does Dad delete first?"

### 8. Quantum Entanglement (Thought Experiments)
"In the multiverse, what is the version of Taylor who didn't go into tech doing?"

### 9. Techno-Ethics (Black Mirror)
"Teleportation destroys you and prints a copy. Does Dad get in the machine?"

---

## Performance Optimizations

### 1. Question Preloading
Questions load **during** the pass screen, not after unlock.

**Result:** Zero perceived wait time

### 2. Conversation Context Management
Only last 3-5 turns included in system prompt to avoid token limits.

### 3. Local Storage
Both player and game data cached locally for instant loads.

### 4. Template Memoization
Templates use React.memo() for efficient re-renders.

---

## Error Handling

### Network Errors
- Try again button
- Fallback commentary: "Nice answer! Moving on..."

### API Errors
- Clear error messages
- Retry mechanism
- Graceful degradation

### Validation Errors
- Template params validated before render
- Schema validation for tool calls
- Type safety throughout

---

## Testing the Flow

1. **Setup:**
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:3000/setup
   ```

3. **Add 3 players:**
   - Name: Taylor, Role: Dad, Age: 42
   - Name: Beth, Role: Mom, Age: 40
   - Name: Eliana, Role: Daughter, Age: 16

4. **Click "Continue"**

5. **Pass phone to Taylor** (you!)

6. **Slide to unlock**

7. **Answer the question**

8. **See AI commentary**

9. **Pass to Beth** (question already loading)

10. **Repeat!**

---

## Game Progression System

### Round Tracking

The game uses a dynamic round calculation system:

**Formula:** `Total Rounds = Number of Players × AVERAGE_TURNS_PER_PLAYER`

**Tuning Variable:** [lib/constants.ts](../lib/constants.ts)
```typescript
export const AVERAGE_TURNS_PER_PLAYER = 4; // Change this to adjust game length
```

**Example:**
- 3 players × 4 turns = 12 total rounds
- 5 players × 4 turns = 20 total rounds
- Change to 6: 3 players × 6 turns = 18 rounds

### Act System

The game divides into three dramatic acts:

- **ACT I (0-33%)** - "Getting Started" (mint green)
- **ACT II (33-66%)** - "Rising Tension" (glitch purple)
- **ACT III (66-100%)** - "Final Round" (alert red)

Acts can be used by the AI to adjust question difficulty and tone.

### Progress Bar

Visual progress indicator showing:
- Current act with color coding
- Round counter (e.g., "Round 5 of 12")
- Progress percentage
- Visual markers at act boundaries (33%, 66%)

**Location:** Displayed in header during question phase

### Game Completion

The system automatically detects when all rounds are complete:
```typescript
isGameComplete = (currentRound >= totalRounds)
```

**Current behavior:** Shows "🎉 Game Complete! Thanks for playing!"

**Future:** Will transition to end-game summary screen

### Implementation Details

**Store Methods:**
- `getTotalRounds()` - Calculates total based on player count
- `getCurrentRound()` - Counts completed turns
- `getCurrentAct()` - Returns 1, 2, or 3
- `getProgressPercentage()` - Returns 0-100
- `isGameComplete()` - Boolean completion check

**Files:**
- [lib/constants.ts](../lib/constants.ts) - Calculation functions
- [lib/store/game-store.ts](../lib/store/game-store.ts) - Computed properties
- [components/GameProgressBar.tsx](../components/GameProgressBar.tsx) - Visual component

---

## Mini-Games System

### Overview

Mini-games add variety to the main question flow. They become available in **Act 2+** when there are enough completed turns to draw from.
Mini-games count as a completed turn and advance round/progress.

### Trivia Challenge

**What it does:** Quiz the current player about something another player said earlier.

**Requirements:**
- Game must be in Act 2 or later (33%+ complete)
- At least 3 eligible turns from other players
- AI decides when to trigger (roughly once every 4-5 turns)

**Flow:**
1. Game Master triggers `trigger_trivia_challenge` tool
2. Quizmaster AI (separate personality) generates a question
3. Player answers in text input
4. Quizmaster scores 0-5 points with witty commentary
5. Game continues to next player

**Quizmaster Personality:**
- Sharp and quick-witted
- Mocks low scores playfully
- Celebrates high scores with genuine surprise
- MAX 10 words commentary

### Personality Match

**What it does:** Have the current player select ALL words that describe another player.

**Requirements:**
- Game must be in Act 2 or later (33%+ complete)
- At least 3 eligible turns from other players
- AI decides when to trigger (roughly once every 4-5 turns)

**Flow:**
1. Game Master triggers `trigger_personality_match` tool
2. Analyst AI (separate personality) scores the word selections
3. Player earns 0-5 points with a 10-word max commentary
4. Game continues to next player

**Files:**
- [lib/mini-games/eligibility.ts](../lib/mini-games/eligibility.ts) - Turn selection
- [lib/mini-games/trivia-challenge/prompt.ts](../lib/mini-games/trivia-challenge/prompt.ts) - Quizmaster AI
- [lib/mini-games/personality-match/prompt.ts](../lib/mini-games/personality-match/prompt.ts) - Analyst AI
- [components/mini-games/TriviaChallengeUI.tsx](../components/mini-games/TriviaChallengeUI.tsx) - UI
- [components/mini-games/PersonalityMatchUI.tsx](../components/mini-games/PersonalityMatchUI.tsx) - UI

---

## Future Enhancements

- [x] Game progression tracking with acts
- [x] Visual progress bar
- [x] Game completion detection
- [x] Mini-games system (Trivia + Personality Match)
- [ ] End-game summary screen with winner announcement
- [ ] Leaderboard screen
- [ ] Share results feature
- [ ] Question difficulty progression based on acts
- [ ] Custom question categories
- [ ] Multiplayer simultaneous input
- [ ] Voice input for responses
- [ ] Game replay/history
- [ ] Additional mini-games

---

## Troubleshooting

**Issue:** Questions take too long to load
- Check internet connection
- Verify OpenAI API key
- Check browser console for errors

**Issue:** Slide to unlock doesn't work
- Try refreshing the page
- Check if question finished loading
- Try on different device/browser

**Issue:** AI responses are generic
- System prompt might need adjustment
- Add more context to game state
- Include more previous turns

**Issue:** Template won't render
- Check console for validation errors
- Verify templateType matches registry
- Check all required params provided

---

**Status:** ✅ Production Ready
**Version:** 1.1.0
**Last Updated:** 2026-01-19

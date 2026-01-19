# Game Flow Documentation

Complete documentation of the Family Glitch game flow from setup to gameplay.

## Overview

Family Glitch uses a **pass-and-play** model where:
1. Questions are **preloaded** during the "pass" screen to minimize wait time
2. Players **slide to unlock** their question for privacy
3. Questions use one of **6 dynamic input templates**
4. AI provides **witty commentary** after each response
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
│  - Shows AI's witty 2-3 sentence response              │
│  - Points awarded (visible in header)                  │
│  - Auto-transitions after 2 seconds                    │
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
└── input-templates/
    ├── TextAreaTemplate.tsx      # All 6 templates...
    └── index.tsx                 # TemplateRenderer

lib/
├── ai/
│   ├── game-master-prompt.ts    # System prompt with examples
│   ├── template-tools.ts        # 6 tools for AI to call
│   └── client.ts                # API communication
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
- Avatar selection (20 emojis)

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
2. AI generates 2-3 sentence witty commentary
3. Commentary displayed with robot emoji
4. Points awarded (10 base points)
5. Auto-transitions after 2 seconds

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
      content: `${currentPlayer.name} responded: ${JSON.stringify(response)}. Provide brief, witty commentary (2-3 sentences max).`
    }
  ]);

  setAiCommentary(aiResponse.text);

  // Move to next player after 2 seconds
  setTimeout(() => {
    setPhase('pass');
    loadQuestion(); // Preload for next player
  }, 2000);
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

AI has access to 6 tools:
1. `ask_for_text` - Detailed paragraphs
2. `ask_for_list` - Multiple short answers
3. `ask_binary_choice` - Timed this-or-that
4. `ask_word_selection` - Grid selection
5. `ask_rating` - Scale ratings
6. `ask_player_vote` - Vote for another player

**Tool selection is automatic** - AI chooses based on:
- Question type
- Context
- Tool descriptions in schema

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

## Future Enhancements

- [ ] End-game summary with winner announcement
- [ ] Leaderboard screen
- [ ] Share results feature
- [ ] Question difficulty progression
- [ ] Custom question categories
- [ ] Multiplayer simultaneous input
- [ ] Voice input for responses
- [ ] Game replay/history

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
**Version:** 1.0.0
**Last Updated:** 2026-01-19

# Family Glitch V2 - Systems Architecture

## 🎯 What We've Built

### 1. **Core State System** (`types/game-v2.ts`)
- **GameState**: Single source of truth with clean structure
- **The Vault**: Fact collection system (`VaultFact[]`)
- **Turn Data**: Ephemeral data for current interactions
- **Score History**: Full audit trail of all points

### 2. **Four Modular Input Interfaces**

#### **TheSecretConfessional** ✅ BUILT
- Text input with spotlight effect
- Animated "vaulting" when submitted (text shrinks and flies down)
- Glowing border when valid
- Perfect for Data Tax and Letter Chaos

#### **TheHandoff** ✅ BUILT
- Full-screen "PASS TO [PLAYER]" display
- Slide-to-unlock interaction (swipe right to reveal)
- Prevents accidental peeking
- Smooth unlock animation with emoji feedback

#### **TheGallery** ✅ BUILT
- CRT monitor effect with scanlines
- ASCII art display in green monospace font
- Screen flicker/glow effects
- Optional text input below art

#### **TheSelector** ✅ BUILT
- Colorful gradient buttons (6 color combos)
- Haptic-style animations on tap
- Ripple effect on selection
- Supports both single-select (instant submit) and multi-select

### 3. **State Management** (`lib/gameStore-v2.ts`)
- Zustand store with localStorage persistence
- Clean action methods:
  - `initializePlayers()` - Setup with emoji avatars
  - `addToVault()` - Store facts
  - `updatePlayerScore()` - Award points + bonus
  - `applyAIResponse()` - Handle AI updates
  - `nextPlayer()` - Rotate turns
- Automatic score history tracking

### 4. **AI Prompt System** (`lib/prompts-v2.ts`)
- **System Prompt**: Teaches The Glitch the rules
- **Turn Prompt**: Context-aware instructions per phase
- Comprehensive examples for all interfaces
- Scoring guidelines (0-5 + bonus)
- Game flow logic

---

## 🎮 The Three Game Cartridges (Defined in Prompts)

### **Letter Chaos**
1. AI generates context sentence: "Beth's superhero name is The [S]____ [P]____"
2. Player fills in 2 words starting with given letters
3. AI scores 0-5 for humor + optional +5 bonus

### **ASCII Rorschach** (2-Step)
1. **Step 1**: Show ASCII art to Player A, ask "What does this look like?"
2. **Step 2**: Show same art to Player B with 4 options (1 correct, 3 decoys)
3. 5 points if Player B guesses correctly

### **Vault Recall**
1. Pull a fact from The Vault
2. Ask trivia question based on it
3. Score 0-5 on accuracy vs original answer

---

## 🔄 The Game Loop

```
SETUP (enter names/vibe)
  ↓
PASS_SCREEN (slide to unlock)
  ↓
DATA_TAX (collect vault fact) ←─┐
  ↓                              │
MINI_GAME (play cartridge)       │
  ↓                              │
SCORING (show points)            │
  ↓                              │
[Repeat until max_turns] ────────┘
  ↓
FINALE (winner + recap)
```

---

## ✅ What's Complete

- ✅ Type definitions for entire system
- ✅ State management with Zustand
- ✅ All 4 input interface components
- ✅ AI prompt system with game logic
- ✅ Smooth animations and transitions
- ✅ Slide-to-unlock handoff
- ✅ Vaulting animation
- ✅ CRT screen effects
- ✅ Colorful button interactions

---

## 🚧 What's Next

### **Immediate (To Make It Playable)**

1. **ScoreReveal Component**
   - Slot machine count-up animation
   - Confetti for big scores (>100 pts)
   - "BONUS!" badge for +5

2. **API Route Update** (`app/api/turn/route.ts`)
   - Use v2 prompts
   - Handle v2 game state
   - Parse v2 AI responses

3. **Main Game Orchestrator** (`components/v2/GameOrchestrator.tsx`)
   - Route to correct interface based on `currentInterface`
   - Handle user submissions
   - Call AI and apply responses
   - Manage loading states

4. **Setup Screen** (reuse existing but update to v2 store)

5. **Finale Screen**
   - Winner announcement with confetti
   - Vault facts recap
   - Funny highlights
   - "Play Again" button

### **Polish (Nice to Have)**

- Sound effects (vault deposit, unlock, score ding)
- Haptic feedback (if supported)
- More ASCII art templates
- Family Feud cartridge
- Wager cartridge
- Easter eggs

---

## 🎨 Design Highlights

### **Animations**
- **Vaulting**: Text shrinks and flies down into phone
- **Unlocking**: Slider glows and pulses, screen flash on unlock
- **Scoring**: Numbers count up like slot machine
- **Button Taps**: Scale down + ripple effect
- **CRT Flicker**: Periodic screen flash on Gallery

### **Visual Effects**
- Spotlights (radial gradients)
- Scanlines (repeating linear gradients)
- Text shadows (neon glow)
- Gradient buttons (6 color combos)
- Pulsing animations (breathing effects)

### **Interactions**
- Swipe to unlock (drag gesture)
- Tap to select (instant feedback)
- Type to vault (real-time validation)
- Multi-select (toggle checkmarks)

---

## 📝 Example AI Response

```json
{
  "display": {
    "title": "Data Tax Time!",
    "message": "Before we play, feed The Vault...",
    "subtext": "This stays secret until the finale"
  },
  "interface": {
    "type": "THE_SECRET_CONFESSIONAL",
    "data": {
      "question": "What is a funny food habit that Beth has?",
      "placeholder": "Be specific and funny!",
      "min_length": 10,
      "helper_text": "The weirder, the better"
    }
  },
  "updates": {
    "phase": "DATA_TAX",
    "current_turn_data": {
      "mini_game": null,
      "step": 1
    }
  }
}
```

---

## 🎯 Key Architectural Decisions

1. **Single State Object**: Everything in one JSON makes AI context easy
2. **Interface as Data**: UI components are "dumb" - AI controls what shows
3. **The Vault**: Persistent memory that makes late-game funnier
4. **Modular Interfaces**: Easy to add new input types
5. **Score History**: Full audit trail for debugging and finale recap

---

## 🚀 Next Steps to Deploy

1. Build ScoreReveal component
2. Update API route for v2
3. Build GameOrchestrator
4. Wire up Setup to v2 store
5. Test full game loop
6. Add Finale screen
7. Deploy to Vercel

**Estimated Time**: 2-3 hours to get playable, another 1-2 for polish.

---

*This architecture is designed for SYSTEMS, not games. Adding a new cartridge is just a prompt update, not code changes.*

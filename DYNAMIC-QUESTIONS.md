# 🔄 Dynamic Question System - Infinite Replayability

## The Problem with Static Facts

**Before**: Questions like "What's your favorite color?" or "When's your birthday?"
- ❌ Run out after one game
- ❌ Generic and boring
- ❌ No connection to current context
- ❌ Can't be used for interesting callbacks

**After**: Dynamic observations that change with every game
- ✅ Context-dependent (where you are, what's happening NOW)
- ✅ Observation-based (behavioral tells, current mood)
- ✅ Infinite variations (hypotheticals, Fermi problems)
- ✅ Perfect for callbacks and cross-references

---

## The 7 Question Categories

### 1. 🍽️ Current Vibe (Context-Dependent)
**Changes every time you play because the context changes**

Examples:
- "Look at [Player]. What's their 'tell' that shows they're hungry RIGHT NOW?"
- "If [Player] ordered a drink now, exactly how many ice cubes would they want?"
- "What's the first thing [Player] will complain about THIS SPECIFIC restaurant?"
- "Predict: Who's going to spill something first tonight?"

**Why it works**: References the specific location (stored in `gameState.meta.vibe`)

**Tags**: `['current_vibe', 'observation', 'prediction', 'restaurant']`

### 2. 📚 Deep Lore (Specific Stories)
**Dig up stories that might not come up in normal conversation**

Examples:
- "Think of a vacation that went wrong. What SPECIFIC item was lost/broken?"
- "What movie has [Player] seen 100 times but [Other Player] secretly hates?"
- "What was [Child Player]'s favorite stuffed animal's NAME at age 4?"
- "What weird hobby did [Player] pick up during 2020 then quit after 2 weeks?"

**Why it works**: Asks for NAMES, SPECIFIC ITEMS, EXACT DETAILS (not generic "a trip")

**Tags**: `['deep_lore', 'specific_memory', 'family_history', 'vacation']`

### 3. 🧠 Behavioral Tells (Psychology)
**Build a profile of how each person behaves**

Examples:
- "What EXACT 3-word phrase does [Player] use when they're 'done' with a conversation?"
- "When [Player] is working on a problem, describe their face in 3 words."
- "What's [Player]'s 'guilt face' when hiding something?"
- "What sound (chewing, clicking, humming) instantly makes [Player] angry?"

**Why it works**: Creates a behavioral database for future callbacks

**Tags**: `['behavioral_tell', 'psychology', 'trigger', 'player_id']`

**Callback Example:**
- Turn 2: "Dad's hungry tell is 'The Silent Stare'"
- Turn 9: "Look at Dad RIGHT NOW. Is he doing 'The Silent Stare' from turn 2?"

### 4. 🧟 Hypotheticals (Character Traits)
**Reveals how the family views each other's competence**

Examples:
- "In a horror movie, who's the first to investigate the scary noise?"
- "Smuggling a puppy into a hotel: who's the distraction, who carries the bag?"
- "If [Player] became President, what's the first law they ban?"
- "If [Player] was a video game character, what's their Special Ability called?"

**Why it works**: Infinite variations, reveals family dynamics

**Tags**: `['hypothetical', 'zombie_scenario', 'character_trait', 'brave']`

**Callback Example:**
- Turn 3: "Eliana investigates the scary noise"
- Turn 10: "Given that Eliana is the brave one, who's SECOND to follow her?"

### 5. 😬 The Cringe (Vulnerabilities)
**Family games thrive on mild embarrassment**

Examples:
- "What slang does [Young Player] use that [Old Player] says wrong?"
- "Most embarrassing song on [Player]'s playlist RIGHT NOW?"
- "What food combo does [Player] eat that everyone thinks is gross?"
- "What did the family argue about last in the car?"

**Why it works**: Funny, memorable, great for ACT 3 reveals

**Tags**: `['cringe', 'embarrassing', 'vulnerability', 'slang']`

### 6. 🔬 Fermi Problems (Logic & Estimation)
**Named after physicist Enrico Fermi**

Examples:
- "Look around. How many french fries are being eaten in this building RIGHT NOW?"
- "If Earth was marble-sized, how far away would the Moon (also a marble) be?"
- "How many LEGO bricks to build a wall from table to ceiling?"
- "If [Player] could run at the speed of sound, how many seconds to get home?"

**Why it works**: No "correct" answer, tests logic and estimation

**Tags**: `['fermi_problem', 'estimation', 'logic', 'physics']`

### 7. 🤖 Techno-Ethics (Black Mirror)
**Moral dilemmas involving future tech**

Examples:
- "Robot butler programmed to never let you be sad: Utopia or Dystopia?"
- "Teleportation destroys you, prints a copy. Does [Player] get in? Yes/No."
- "Cure all diseases, but everyone wears a recording hat. Vote Yes/No?"

**Why it works**: Reveals values, philosophical differences

**Tags**: `['techno_ethics', 'moral_dilemma', 'future', 'ai']`

---

## How the AI Uses This Data

### ACT 1 (Turns 1-4): Collection
**Goal: Build a database of 6+ dynamic observations**

Example Turn 2:
```
AI Question: "Look at Dad. What's his 'tell' that shows he's hungry RIGHT NOW at Kitchen Table?"
Player Answer: "The Silent Stare"
Storage: {
  value: "The Silent Stare",
  question: "Dad's hungry tell",
  source_player_id: "p1",
  scope: "permanent",
  tags: ["behavioral_tell", "hungry", "dad", "observation"],
  turn_collected: 2
}
```

### ACT 2 (Turns 5-8): Callbacks Begin
**Goal: Cross-reference stored data with new questions**

Example Turn 6:
```
AI uses stored data from turn 2:
"Earlier you said Dad's hungry tell is 'The Silent Stare'. Is he doing it RIGHT NOW?"

Or in LETTER_CHAOS:
"When Dad is hungry, he activates the [S]_____ [S]_____"
Answer: "Silent Stare" = 5 base + 3 bonus for perfect callback
```

### ACT 3 (Turns 9-12): Pure Callbacks
**Goal: Zero new data collection, 100% using stored facts**

Example Turn 10:
```
CONSENSUS game using turn 2's data:
"Everyone answer: What was the EXACT phrase someone said was Dad's hungry tell on turn 2?"

Options:
A) The Silent Stare (correct, from storage)
B) The Angry Glare (fake)
C) The Distant Gaze (fake)

Points for matching stored fact.
```

Example Turn 11:
```
Cross-Player Test:
"On turn 3, Beth said Eliana investigates scary noises first. Eliana, is she right?"

If Eliana confirms: Both get bonus points
If Eliana denies: Debate and vote
```

---

## Tagging Strategy

### Good Tags (Specific, Searchable)
```typescript
{
  value: "The Silent Stare",
  tags: ["behavioral_tell", "hungry", "dad", "observation"]
}
// Can query: "Show me all behavioral tells about dad"
// Can query: "Show me all observations about being hungry"
```

### Bad Tags (Generic, Useless)
```typescript
{
  value: "Blue",
  tags: ["answer", "color", "question"]
}
// Can't differentiate from any other answer
// No context for future use
```

### Tag Patterns
- **Player-specific**: Always include player ID or relationship
- **Category**: Behavioral tell, hypothetical, fermi problem
- **Topic**: Hungry, conversation, scary, brave
- **Context**: Restaurant, home, car

---

## Scoring Based on Specificity

### High Score (4-5 base + 2-3 bonus)
- "The exact way he taps his foot 3 times when the waiter walks by"
- "Her 'I'm done' phrase is 'Anyway, moving on...'"
- "The stuffed animal's name was Mr. Wiggles"

**Why**: Hyper-specific, observable, memorable

### Medium Score (3-4 base + 0-1 bonus)
- "The Silent Stare"
- "He investigates first"
- "She hates that movie"

**Why**: Specific but could be more detailed

### Low Score (1-2 base + 0 bonus)
- "He looks hungry"
- "She's brave"
- "Blue"

**Why**: Vague, generic, no detail

---

## Example Full Game Flow

**Turn 1 (ACT 1)**
- Q: "Look at Dad. What's his hungry tell RIGHT NOW?"
- A: "The Silent Stare"
- Store: `['behavioral_tell', 'hungry', 'dad']`

**Turn 2 (ACT 1)**
- Q: "In a horror movie at THIS restaurant, who investigates first?"
- A: "Eliana"
- Store: `['hypothetical', 'zombie_scenario', 'brave', 'eliana']`

**Turn 3 (ACT 1)**
- Q: "What exact phrase does Mom use when she's done with a conversation?"
- A: "Anyway, moving on..."
- Store: `['behavioral_tell', 'conversation_ender', 'mom']`

**Turn 6 (ACT 2)**
- Q: "Earlier you said Dad does 'The Silent Stare' when hungry. Is he doing it NOW?"
- A: "Yes" → 5 base + 2 bonus (observation confirmed)

**Turn 7 (ACT 2)**
- Q: "LETTER_CHAOS: When [M]om is done talking, she says '[A]_______, [M]______ [O]__'"
- A: "Anyway, Moving On" → 5 base + 3 bonus (perfect recall)

**Turn 10 (ACT 3)**
- Q: "CONSENSUS: Who said on turn 2 that Eliana investigates scary noises?"
- Everyone votes → Points for matching

**Turn 11 (ACT 3)**
- Q: "Cross-check: Turn 1 said Dad does 'Silent Stare'. Dad, is that accurate?"
- Dad confirms → Both players get bonus points

---

## Key Takeaways

1. **No more static facts** - Questions must change with context
2. **Specificity = Points** - Reward detailed, observable answers
3. **Tag everything** - Use 3-5 specific, searchable tags per answer
4. **Reference location** - Always incorporate `gameState.meta.vibe`
5. **Cite turn numbers** - "On turn 3" not "Earlier"
6. **Cross-reference** - ACT 2-3 should build on ACT 1's data
7. **Zero new facts in ACT 3** - Only callbacks and testing stored data

---

**The result**: Infinite replayability because every game creates a unique behavioral database based on that specific moment, location, and family dynamic.

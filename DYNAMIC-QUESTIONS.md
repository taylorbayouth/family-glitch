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

## **The 7 Question Categories**

### **1\. 🍽️ Current Vibe (Context-Dependent)**

**Changes every time you play because the context changes.** *Focuses on sensory details, menu analysis, and "spy" work.*

* **The Spy Mission:** "Don't point, but look at the table to our left. Invent a dramatic backstory for why they are eating dinner together."  
* **The Menu Audit:** "Scan the menu. What is the *one* item that \[Player\] would refuse to eat, even for $100?"  
* **Sensory Overload:** "Close your eyes. What is the specific smell or sound in this restaurant that is slightly annoying \[Player\] right now?"  
* **The Prediction:** "Look at the waiter. Based on their walking speed, predict exactly how many minutes until our food arrives."

**Tags:** `['observation', 'sensory', 'spying', 'restaurant_meta']`

### **2\. 📚 Deep Lore (Specific History)**

**Digs up distinct eras: Early Marriage, Toddler Years, and "The Before Times."** *Focuses on the "Forbidden," the "Lost," and the "Glitchy" memories.*

* **The Banned Item:** "Think back to when \[Player\] was 5\. What specific toy or object was 'accidentally' thrown away or banned from the house?"  
* **The Glitch:** "What is one specific memory from a family vacation that Mom remembers one way, but Dad remembers completely differently?"  
* **The Origin Story:** "What was the exact username or character name of the first video game \[Player\] ever played seriously?"  
* **The Lost Artifact:** "Name a piece of technology (e.g., an old iPod, a specific controller) that the family owned but has mysteriously vanished."

**Tags:** `['family_mythology', 'disputed_memory', 'gaming_history', 'childhood']`

### **3\. 🧠 Behavioral Tells (Psychology)**

**Builds a user manual for each family member.** *Focuses on gaming posture, social masking, and stress signals.*

* **The Gamer Lean:** "Without looking, describe the exact change in \[Player\]'s posture when they are about to lose a boss battle."  
* **The Social Mask:** "What specific noise or face does \[Player\] make when they didn't hear what someone said but pretend to laugh anyway?"  
* **The 'Done' Signal:** "We are at a boring party. What is the subtle physical signal \[Player\] gives to say 'We need to leave immediately'?"  
* **The Lie Detector:** "When \[Player\] is trying to convince us of something that isn't true, what do their hands do?"

**Tags:** `['body_language', 'gaming_tells', 'social_cues', 'lie_detection']`

### **4\. 🧟 Hypotheticals (Roles & Scenarios)**

**Reveals competence, fears, and fantasy roles.** *Ranges from "Heist Movie" logic to "Video Game" logic.*

* **The Heist:** "We are stealing the Declaration of Independence. Who is the Hacker, who is the Getaway Driver, and who gets caught immediately?"  
* **The Isekai:** "The family gets sucked into Minecraft/Roblox. Who builds the shelter, and who immediately wanders off and dies?"  
* **The Body Swap:** "If \[Player\] woke up in the family cat's body for 24 hours, what is the first malicious thing they would do?"  
* **The Castaway:** "We are stranded on an island. We have to sacrifice one iPad to start a fire. Whose device gets thrown in?"

**Tags:** `['heist_roles', 'video_game_logic', 'survival', 'fantasy']`

### **5\. 😬 The Cringe (Vulnerabilities)**

**Playful embarrassment that bridges the generational gap.** *Focuses on weird fears, guilty pleasures, and "Phases."*

* **The 'Phase':** "Describe a specific outfit or haircut from 5 years ago that \[Player\] hopes no one has a photo of."  
* **The Irrational Fear:** "What is a normal object (e.g., balloons, cotton balls) that \[Player\] is weirdly afraid of or grossed out by?"  
* **The Guilty Pleasure:** "It's 2 AM. What terrible movie or YouTube channel is \[Player\] watching when no one is around?"  
* **The Mispronunciation:** "What is a word that \[Player\] insisted on saying wrong for years until they were corrected?"

**Tags:** `['mild_embarrassment', 'regret', 'irrational_fear', 'guilty_pleasure']`

### **6\. 🔬 Fermi Problems (Logic & Scale)**

**Visualizing math and physics in the real world.** *Focuses on volume, time, and "impossible" measurements.*

* **The Volume:** "Look at this room. If we filled it entirely with ping pong balls, would they all fit inside \[Player\]'s car? Yes or No?"  
* **The Lifespan:** "Calculate roughly how many hours \[Player\] has spent looking at a glowing screen in their entire life."  
* **The Stack:** "If we stacked every pancake \[Player\] has ever eaten, would it reach the ceiling of this restaurant?"  
* **The Speed:** "If we shrunk the family down to the size of ants, how many days would it take to walk from our table to the exit?"

**Tags:** `['fermi_estimation', 'scale', 'physics', 'thought_experiment']`

### **7\. 🤖 Techno-Ethics (Black Mirror for Kids)**

**Dilemmas about AI, Animals, and the Future.** *Focuses on values rather than dark dystopias.*

* **The Pet Collar:** "You can buy a collar that lets the cat talk, but the cat is brutally honest and mean. Do you buy it?"  
* **The AR Glasses:** "You can see a floating stat above everyone's head. You can only pick one: 'Happiness Level' or 'Truthfulness %'. Which does \[Player\] pick?"  
* **The Undo Button:** "You have a remote with an 'Undo' button that works on real life, but it only has 3 charges. What event from today does \[Player\] use a charge on?"  
* **The NPC Dilemma:** "We discover we are all NPCs in a video game. Who is the 'Main Character' player controlling us?"

**Tags:** `['future_tech', 'moral_choice', 'simulation_theory', 'animal_intelligence']`

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

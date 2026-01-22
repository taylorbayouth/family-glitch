/**
 * Act Transition Events Registry
 *
 * Declarative system for defining special events that trigger at act boundaries.
 * Add new events here - the game loop will automatically handle them.
 */

import type { Player } from '@/lib/store/player-store';
import type { TransitionResponse, TransitionEventState } from '@/lib/types/game-state';

/**
 * A question template with variants by age group
 */
export interface TransitionQuestion {
  /** Category tag for this question */
  category: string;
  /** Question for kids (age < 13) */
  kidVersion: string;
  /** Question for teens (age 13-17) */
  teenVersion: string;
  /** Question for adults (age 18+) */
  adultVersion: string;
  /** Placeholder text for input */
  placeholder: string;
}

/**
 * Definition of a transition event
 */
export interface TransitionEventDefinition {
  /** Unique identifier for this event */
  id: string;

  /** Human-readable name */
  name: string;

  /** When this event triggers */
  trigger: {
    afterAct: 1 | 2;
  };

  /** Whether to collect responses from all players */
  collectFromAllPlayers: boolean;

  /** Questions to ask (rotated per player) */
  questions: TransitionQuestion[];

  /** Message shown when transitioning to this event */
  transitionMessage: (playersRemaining: number) => string;

  /** Banner title shown on first player */
  bannerTitle: string;

  /** Subtitle shown in the question UI */
  questionSubtitle: string;

  /** How to format responses for prompt injection */
  formatForPrompt: (responses: TransitionResponse[]) => string;
}

// ============================================================================
// EVENT DEFINITIONS - Add new events here!
// ============================================================================

const ACT1_INSIGHTS: TransitionEventDefinition = {
  id: 'act1_insights',
  name: 'Act 1 Insights',
  trigger: { afterAct: 1 },
  collectFromAllPlayers: true,
  bannerTitle: 'Act 1 Complete',
  questionSubtitle: 'Act 1 Closing Question',
  transitionMessage: (remaining) =>
    remaining === 0
      ? "Time to unlock the real games..."
      : `Before we move to the games, let's learn a bit more about everyone. ${remaining} ${remaining === 1 ? 'person' : 'people'} to go.`,

  questions: [
    // INTERESTS - What they love
    {
      category: 'interests',
      kidVersion: "What are 3 things you LOVE to do or talk about?",
      teenVersion: "Name 3 topics you could talk about for hours without getting bored.",
      adultVersion: "What 3 subjects could you discuss endlessly and never tire of?",
      placeholder: "e.g., dinosaurs, video games, cooking...",
    },
    {
      category: 'interests',
      kidVersion: "If you could learn about ANYTHING, what would it be?",
      teenVersion: "What's something you wish you knew more about?",
      adultVersion: "What topic have you been meaning to dive deeper into?",
      placeholder: "e.g., space, history, music production...",
    },
    // LEARNING - Recent discoveries
    {
      category: 'learning',
      kidVersion: "What's something cool you learned recently that blew your mind?",
      teenVersion: "What's the most interesting thing you've learned lately?",
      adultVersion: "What's a fascinating fact or insight you've discovered recently?",
      placeholder: "Tell us what surprised you...",
    },
    {
      category: 'learning',
      kidVersion: "What's something you learned that you couldn't wait to tell someone?",
      teenVersion: "What's something you learned that made you say 'wait, really?'",
      adultVersion: "What's a piece of knowledge that changed how you see something?",
      placeholder: "Share your discovery...",
    },
    // FAMILY_FACT - Fun facts about family members
    {
      category: 'family_fact',
      kidVersion: "What's something funny or cool about someone in the family that you love?",
      teenVersion: "What's a fun fact about a family member that always makes you smile?",
      adultVersion: "What's an endearing quirk or fact about someone here that you appreciate?",
      placeholder: "e.g., Dad's secret talent, Mom's funny habit...",
    },
    {
      category: 'family_fact',
      kidVersion: "What's something nice you noticed someone in the family did recently?",
      teenVersion: "What's something a family member did recently that impressed you?",
      adultVersion: "What's a small but meaningful thing you've noticed about a family member lately?",
      placeholder: "Share what you noticed...",
    },
    // SECRET - Harmless secrets to share
    {
      category: 'secret',
      kidVersion: "What's a silly secret you don't mind sharing with the family?",
      teenVersion: "What's a harmless secret you're willing to reveal to everyone here?",
      adultVersion: "What's something you haven't told the family that you're okay sharing now?",
      placeholder: "A fun revelation for the family...",
    },
    {
      category: 'secret',
      kidVersion: "What's something you do that you think nobody knows about?",
      teenVersion: "What's a guilty pleasure or habit you've been keeping low-key?",
      adultVersion: "What's a small confession that would surprise people here?",
      placeholder: "Time to come clean...",
    },
    // FOCUS - What they want from the game
    {
      category: 'focus',
      kidVersion: "What kind of questions or games would be the most fun for you?",
      teenVersion: "What would make this game more interesting for you?",
      adultVersion: "What topics or themes would you enjoy seeing more of in this game?",
      placeholder: "e.g., more music questions, funny stories...",
    },
    {
      category: 'focus',
      kidVersion: "What's something you want everyone to know about you?",
      teenVersion: "What's something you wish people understood about you better?",
      adultVersion: "What aspect of yourself do you feel is often overlooked?",
      placeholder: "Something important to you...",
    },
  ],

  formatForPrompt: (responses) => {
    if (responses.length === 0) return '';

    const byPlayer = responses.reduce((acc, r) => {
      if (!acc[r.playerName]) acc[r.playerName] = [];
      acc[r.playerName].push(r);
      return acc;
    }, {} as Record<string, TransitionResponse[]>);

    let formatted = `## Player Insights (Collected at End of Act 1)\n\nUse this information to personalize questions and mini-games:\n\n`;

    for (const [playerName, playerResponses] of Object.entries(byPlayer)) {
      formatted += `**${playerName}:**\n`;
      for (const r of playerResponses) {
        formatted += `- [${r.category.toUpperCase()}] ${r.response}\n`;
      }
      formatted += '\n';
    }

    formatted += `Use these insights to craft MORE PERSONALIZED questions and make mini-games MORE RELEVANT to each player's interests and revelations.\n`;

    return formatted;
  },
};

// Example: Add more events here in the future
// const ACT2_REFLECTION: TransitionEventDefinition = { ... };

// ============================================================================
// REGISTRY
// ============================================================================

/**
 * All registered transition events, ordered by when they trigger
 */
export const TRANSITION_EVENTS: TransitionEventDefinition[] = [
  ACT1_INSIGHTS,
  // Add more events here...
];

/**
 * Get a transition event by ID
 */
export function getTransitionEvent(id: string): TransitionEventDefinition | undefined {
  return TRANSITION_EVENTS.find(e => e.id === id);
}

/**
 * Get all events that trigger after a specific act
 */
export function getEventsForAct(afterAct: 1 | 2): TransitionEventDefinition[] {
  return TRANSITION_EVENTS.filter(e => e.trigger.afterAct === afterAct);
}

/**
 * Get the appropriate question variant based on player age
 */
function getQuestionForAge(question: TransitionQuestion, age: number): string {
  if (age < 13) return question.kidVersion;
  if (age < 18) return question.teenVersion;
  return question.adultVersion;
}

/**
 * Select a question for a player from an event
 * Uses deterministic selection to ensure variety across players
 */
export function selectQuestionForPlayer(
  event: TransitionEventDefinition,
  player: Player,
  playerIndex: number
): { question: string; category: string; placeholder: string } {
  // Get unique categories
  const categories = [...new Set(event.questions.map(q => q.category))];
  const categoryIndex = playerIndex % categories.length;
  const targetCategory = categories[categoryIndex];

  // Find questions in the target category
  const categoryQuestions = event.questions.filter(q => q.category === targetCategory);

  // Pick a question variant
  const questionIndex = Math.floor(playerIndex / categories.length) % categoryQuestions.length;
  const selectedQuestion = categoryQuestions[questionIndex];

  return {
    question: getQuestionForAge(selectedQuestion, player.age),
    category: targetCategory,
    placeholder: selectedQuestion.placeholder,
  };
}

/**
 * Check if any transition event should trigger at the current game state
 */
export function getPendingTransitionEvent(
  currentRound: number,
  totalRounds: number,
  transitionEvents: Record<string, TransitionEventState>
): TransitionEventDefinition | null {
  if (totalRounds === 0) return null;

  // Calculate act boundaries
  const act1End = Math.floor(totalRounds / 3);
  const act2End = Math.floor((totalRounds * 2) / 3);

  // Check each event
  for (const event of TRANSITION_EVENTS) {
    const eventState = transitionEvents[event.id];
    const isComplete = eventState?.complete ?? false;

    if (isComplete) continue;

    // Check if we've reached the trigger point
    if (event.trigger.afterAct === 1 && currentRound >= act1End) {
      return event;
    }
    if (event.trigger.afterAct === 2 && currentRound >= act2End) {
      return event;
    }
  }

  return null;
}

/**
 * Format all responses from completed events for prompt injection
 */
export function formatAllTransitionResponses(
  responses: TransitionResponse[],
  transitionEvents: Record<string, TransitionEventState>
): string {
  let formatted = '';

  for (const event of TRANSITION_EVENTS) {
    const eventState = transitionEvents[event.id];
    if (!eventState?.complete) continue;

    const eventResponses = responses.filter(r => r.eventId === event.id);
    if (eventResponses.length > 0) {
      formatted += event.formatForPrompt(eventResponses);
    }
  }

  return formatted;
}

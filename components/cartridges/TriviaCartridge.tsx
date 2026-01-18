/**
 * ============================================================================
 * TRIVIA CARTRIDGE - "Who Said That?"
 * ============================================================================
 *
 * A trivia game where players guess who gave which answer in Act 1.
 * The LLM selects an interesting fact, shows the answer, and players
 * guess which player said it.
 *
 * Flow:
 * 1. Intro - Explain the game (public view)
 * 2. Show fact - Display a fact answer from Act 1 (public view)
 * 3. Collect guesses - Each player guesses privately (pass-around)
 * 4. Reveal & Score - Show who was right, award points (public view)
 *
 * This cartridge DOES award points and uses the ScoringReveal component.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  CartridgeDefinition,
  CartridgeProps,
  CartridgeContext,
  CartridgeResult,
  CartridgeSubmission,
  ScoringRevealData,
} from '@/types/cartridge';
import { FactCard } from '@/types/game';
import { ScoringReveal } from '@/components/ScoringReveal';

/**
 * Internal state for trivia cartridge
 */
type TriviaPhase = 'intro' | 'show-fact' | 'collect-guesses' | 'reveal-score';

interface TriviaState {
  phase: TriviaPhase;
  selectedFact: FactCard | null;
  submissions: CartridgeSubmission[];
  currentGuessingPlayerIndex: number;
  scoringData: ScoringRevealData | null;
}

/**
 * Trivia Cartridge Component
 */
function TriviaCartridgeComponent({ context, onComplete }: CartridgeProps) {
  // ===========================================================================
  // STATE
  // ===========================================================================

  const [state, setState] = useState<TriviaState>({
    phase: 'intro',
    selectedFact: null,
    submissions: [],
    currentGuessingPlayerIndex: 0,
    scoringData: null,
  });

  // ===========================================================================
  // INITIALIZATION - Select a fact
  // ===========================================================================

  useEffect(() => {
    async function selectFact() {
      // Use LLM to select an interesting fact
      try {
        const response = await context.requestLLM({
          purpose: 'generate-content',
          context: {
            cartridgeId: 'trivia',
            cartridgeName: 'Who Said That?',
            currentPhase: 'fact-selection',
            availableFacts: context.factsDB.facts.map((f) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
              targetPlayerId: f.targetPlayerId,
              authorPlayerId: f.authorPlayerId,
            })),
          },
          instructions: `Select the most interesting/funny fact for a trivia game.

The game works like this:
- Show the answer to a fact
- Players guess who gave that answer
- Award points for correct guesses

Choose a fact where:
1. The answer is distinctive/memorable
2. It's not obvious who said it
3. It's interesting enough to be fun

Respond with just the fact ID.`,
        });

        // Parse response to get fact ID
        const factId = response.screen?.body?.trim() || '';
        const fact = context.factsDB.facts.find((f) => f.id === factId);

        if (fact) {
          setState((s) => ({ ...s, selectedFact: fact }));
        } else {
          // Fallback: pick random fact
          const randomFact =
            context.factsDB.facts[
              Math.floor(Math.random() * context.factsDB.facts.length)
            ];
          setState((s) => ({ ...s, selectedFact: randomFact }));
        }
      } catch (error) {
        console.error('Failed to select fact:', error);
        // Fallback: pick random fact
        const randomFact =
          context.factsDB.facts[
            Math.floor(Math.random() * context.factsDB.facts.length)
          ];
        setState((s) => ({ ...s, selectedFact: randomFact }));
      }
    }

    if (state.phase === 'intro' && !state.selectedFact) {
      selectFact();
    }
  }, [state.phase, state.selectedFact, context]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleStartGame = () => {
    setState((s) => ({ ...s, phase: 'show-fact' }));
    context.recordEvent({
      type: 'CARTRIDGE_STARTED',
      actNumber: 2,
      activePlayerId: context.players[0].id,
      cartridgeId: 'trivia',
      cartridgeName: 'Who Said That?',
    } as any);
  };

  const handleStartGuessing = () => {
    setState((s) => ({ ...s, phase: 'collect-guesses', currentGuessingPlayerIndex: 0 }));
  };

  const handleSubmitGuess = (playerId: string, guessedAuthorId: string) => {
    const submission: CartridgeSubmission = {
      playerId,
      answer: guessedAuthorId,
      submittedAt: Date.now(),
    };

    setState((s) => {
      const newSubmissions = [...s.submissions, submission];
      const nextIndex = s.currentGuessingPlayerIndex + 1;

      if (nextIndex >= context.players.length) {
        // All players have guessed - time to score
        scoreSubmissions(newSubmissions);
        return {
          ...s,
          submissions: newSubmissions,
          phase: 'reveal-score',
        };
      } else {
        return {
          ...s,
          submissions: newSubmissions,
          currentGuessingPlayerIndex: nextIndex,
        };
      }
    });
  };

  const scoreSubmissions = async (submissions: CartridgeSubmission[]) => {
    if (!state.selectedFact) return;

    const correctAuthorId = state.selectedFact.authorPlayerId;

    // Calculate scores
    const scoreChanges: Record<string, number> = {};
    const reveals = submissions.map((sub) => {
      const guessedPlayer = context.players.find((p) => p.id === sub.answer)!;
      const isCorrect = sub.answer === correctAuthorId;
      const points = isCorrect ? 10 : 0;

      scoreChanges[sub.playerId] = points;

      return {
        playerId: sub.playerId,
        answer: `Guessed: ${guessedPlayer.name}`,
        points,
        explanation: isCorrect
          ? `🎯 Correct! ${guessedPlayer.name} did say that!`
          : `❌ Not quite. It was actually ${context.players.find((p) => p.id === correctAuthorId)!.name}.`,
        suspenseDelay: 2000,
      };
    });

    const correctAuthor = context.players.find((p) => p.id === correctAuthorId)!;

    const scoringData: ScoringRevealData = {
      mode: 'sequential',
      title: 'Who Said That?',
      subtitle: `The answer was: ${correctAuthor.name}`,
      reveals,
      summary: `${reveals.filter((r) => r.points > 0).length} out of ${reveals.length} players guessed correctly!`,
      celebration: reveals.filter((r) => r.points > 0).length === reveals.length ? 'confetti' : undefined,
    };

    setState((s) => ({ ...s, scoringData }));

    // Update scores
    context.updateScores(scoreChanges);
  };

  const handleComplete = () => {
    if (!state.selectedFact) return;

    // TODO: TurnPacket creation - optional for MVP
    // Commenting out until type structure is finalized
    /*
    const turnPacket = createTurnPacket({
      sessionId: context.sessionId,
      actNumber: 2,
      cartridgeId: 'trivia',
      cartridgeName: 'Who Said That?',
      prompt: {
        type: 'text',
        text: `Who said: "${state.selectedFact.answer}"?`,
      },
      relevance: {
        why: 'Testing players knowledge of each other',
        confidence: 0.9,
      },
      scoringConfig: {
        mode: 'auto',
        dimensions: ['correctness'],
        maxPoints: 10,
      },
    });

    state.submissions.forEach((sub) => {
      turnPacket.submissions.push({
        playerId: sub.playerId,
        submittedAt: sub.submittedAt,
        content: {
          text: sub.answer,
        },
      });
    });

    if (state.scoringData) {
      turnPacket.scoring = {
        scoredAt: Date.now(),
        mode: 'auto',
        entries: state.scoringData.reveals.map((r) => ({
          playerId: r.playerId,
          points: r.points,
        })),
      };
    }
    */

    const result: CartridgeResult = {
      completed: true,
      scoreChanges: state.scoringData?.reveals.reduce(
        (acc, r) => {
          acc[r.playerId] = r.points;
          return acc;
        },
        {} as Record<string, number>
      ) || {},
    };

    onComplete(result);
  };

  // ===========================================================================
  // RENDER - INTRO
  // ===========================================================================

  if (state.phase === 'intro') {
    return (
      <div className="viewport-container bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="card max-w-2xl text-center">
            <div className="text-8xl mb-6">🤔</div>
            <h1 className="text-4xl font-bold mb-4">Who Said That?</h1>
            <p className="text-xl text-neutral-700 mb-6 leading-relaxed">
              I'll show you an answer from Act 1. Can you remember who said it?
            </p>
            <p className="text-base text-neutral-600 mb-8">
              Guess correctly to earn 10 points!
            </p>
            {!state.selectedFact && (
              <div className="text-center">
                <div className="spinner mb-4" />
                <p className="text-neutral-600">Selecting a fact...</p>
              </div>
            )}
          </div>
        </div>

        {state.selectedFact && (
          <div className="px-6 py-4 safe-area-bottom">
            <button onClick={handleStartGame} className="btn-primary w-full text-lg">
              Start Game
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // RENDER - SHOW FACT
  // ===========================================================================

  if (state.phase === 'show-fact' && state.selectedFact) {
    return (
      <div className="viewport-container bg-gradient-to-br from-primary-500 to-secondary-500">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="card max-w-2xl text-center bg-white/95 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-primary-600">
              Who said this?
            </h2>

            <div className="bg-neutral-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-neutral-500 uppercase tracking-wide mb-3">
                The Question Was
              </p>
              <p className="text-lg text-neutral-700 mb-6 leading-relaxed">
                {state.selectedFact.question}
              </p>

              <p className="text-sm text-neutral-500 uppercase tracking-wide mb-3">
                The Answer Was
              </p>
              <p className="text-2xl text-neutral-900 font-semibold leading-relaxed">
                "{state.selectedFact.answer}"
              </p>
            </div>

            <p className="text-base text-neutral-600">
              Time to guess! Pass the phone around.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 safe-area-bottom">
          <button onClick={handleStartGuessing} className="btn-primary w-full text-lg">
            Start Guessing
          </button>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER - COLLECT GUESSES
  // ===========================================================================

  if (state.phase === 'collect-guesses') {
    const currentPlayer = context.players[state.currentGuessingPlayerIndex];

    return (
      <div className="viewport-container bg-primary-50">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-800">Who Said That?</h2>
            <div className="text-sm text-neutral-500">
              {state.currentGuessingPlayerIndex + 1} / {context.players.length}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col p-6">
          <div className="mb-6 text-center">
            <div className="text-6xl mb-3">{currentPlayer.avatarId}</div>
            <h3 className="text-2xl font-bold mb-2">{currentPlayer.name}'s Turn</h3>
            <p className="text-neutral-600">Who do you think said it?</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 max-w-md mx-auto w-full">
            {context.players.map((player) => (
              <button
                key={player.id}
                onClick={() => handleSubmitGuess(currentPlayer.id, player.id)}
                className="btn-outline text-left flex items-center gap-4 hover:bg-primary-50"
              >
                <span className="text-3xl">{player.avatarId}</span>
                <span className="text-lg font-semibold">{player.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER - REVEAL & SCORE
  // ===========================================================================

  if (state.phase === 'reveal-score' && state.scoringData) {
    return (
      <ScoringReveal
        data={state.scoringData}
        players={context.players}
        onComplete={handleComplete}
      />
    );
  }

  return null;
}

// ===========================================================================
// CARTRIDGE DEFINITION - Export
// ===========================================================================

/**
 * Trivia Cartridge Definition
 *
 * This is what gets registered with the cartridge registry.
 */
export const triviaCartridge: CartridgeDefinition = {
  // Metadata
  id: 'trivia',
  name: 'Who Said That?',
  description:
    'Players guess who gave which answer in Act 1. Tests memory and knowledge of each other.',
  icon: '🤔',
  estimatedDuration: 180000, // 3 minutes
  tags: ['trivia', 'memory', 'knowledge', 'competitive'],

  // Requirements
  minPlayers: 2,
  maxPlayers: 8,
  requiredFactCategories: ['observational'], // Need at least some observational facts
  minFacts: 3, // Need at least 3 facts to choose from

  // Selection logic
  canRun(context: CartridgeContext): boolean {
    // Can run if we have enough facts
    return context.factsDB.facts.length >= 3;
  },

  getRelevanceScore(context: CartridgeContext): number {
    let score = 0.7; // Base score

    // Bonus for lots of facts (more options)
    if (context.factsDB.facts.length >= 6) {
      score += 0.1;
    }

    // Bonus for observational facts (best for trivia)
    const observationalCount =
      context.factsDB.byCategory.observational?.length || 0;
    if (observationalCount >= 3) {
      score += 0.1;
    }

    // Penalty if played recently (check event log)
    const recentCartridges = context.eventLog.events
      .filter((e: any) => e.type === 'CARTRIDGE_STARTED')
      .slice(-2)
      .map((e: any) => e.cartridgeId);

    if (recentCartridges.includes('trivia')) {
      score *= 0.5; // 50% penalty
    }

    return Math.min(score, 1.0);
  },

  // Component
  Component: TriviaCartridgeComponent,
};

/**
 * ============================================================================
 * WOULD YOU RATHER CARTRIDGE - No Scoring, Just Fun
 * ============================================================================
 *
 * A "Would You Rather" game customized to the family using Act 1 facts.
 * The LLM generates two options based on what it learned about the family,
 * and everyone votes. No points awarded - just entertainment and learning
 * about each other's preferences.
 *
 * Flow:
 * 1. Intro - Explain the game (public view)
 * 2. Show question - LLM-generated "Would you rather" (public view)
 * 3. Collect votes - Each player picks an option privately (pass-around)
 * 4. Reveal results - Show who chose what (public view, NO SCORING)
 *
 * This cartridge does NOT award points - it's purely for fun.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  CartridgeDefinition,
  CartridgeProps,
  CartridgeContext,
  CartridgeResult,
  CartridgeSubmission,
} from '@/types/cartridge';

/**
 * Internal state for would-you-rather cartridge
 */
type WYRPhase = 'intro' | 'show-question' | 'collect-votes' | 'reveal';

interface WYRState {
  phase: WYRPhase;
  question: string;
  optionA: string;
  optionB: string;
  submissions: CartridgeSubmission[];
  currentVotingPlayerIndex: number;
}

/**
 * Would You Rather Cartridge Component
 */
function WouldYouRatherCartridgeComponent({
  context,
  onComplete,
}: CartridgeProps) {
  // ===========================================================================
  // STATE
  // ===========================================================================

  const [state, setState] = useState<WYRState>({
    phase: 'intro',
    question: '',
    optionA: '',
    optionB: '',
    submissions: [],
    currentVotingPlayerIndex: 0,
  });

  // ===========================================================================
  // INITIALIZATION - Generate question
  // ===========================================================================

  useEffect(() => {
    async function generateQuestion() {
      try {
        const response = await context.requestLLM({
          purpose: 'generate-content',
          context: {
            cartridgeId: 'would-you-rather',
            cartridgeName: 'Would You Rather',
            currentPhase: 'question-generation',
            relevantFacts: context.factsDB.facts.map((f) => `${f.question}: ${f.answer}`),
          },
          instructions: `Generate a fun "Would You Rather" question tailored to this family.

Use what you learned about them in Act 1 to make it personal and interesting.

The question should:
1. Be appropriate for the family's safety mode: ${context.safetyMode}
2. Reference their interests, hobbies, or experiences
3. Have two distinct, interesting options
4. Be fun to discuss (no "correct" answer)

Format your response as:
QUESTION: [The would you rather prompt]
OPTION A: [First choice]
OPTION B: [Second choice]

Example:
QUESTION: Based on what I learned about your family's love of weekend farm visits...
OPTION A: Visit a llama farm where the llamas are grumpy but hilarious
OPTION B: Visit a goat farm where the goats try to steal your snacks`,
        });

        // Parse response
        const body = response.screen?.body || '';
        const questionMatch = body.match(/QUESTION:\s*(.+)/);
        const optionAMatch = body.match(/OPTION A:\s*(.+)/);
        const optionBMatch = body.match(/OPTION B:\s*(.+)/);

        if (questionMatch && optionAMatch && optionBMatch) {
          setState((s) => ({
            ...s,
            question: questionMatch[1].trim(),
            optionA: optionAMatch[1].trim(),
            optionB: optionBMatch[1].trim(),
          }));
        } else {
          // Fallback question
          setState((s) => ({
            ...s,
            question: 'Would you rather...',
            optionA: 'Have the ability to fly but only 2 feet off the ground',
            optionB: 'Have the ability to turn invisible but only when nobody is looking',
          }));
        }
      } catch (error) {
        console.error('Failed to generate question:', error);
        // Fallback
        setState((s) => ({
          ...s,
          question: 'Would you rather...',
          optionA: 'Have the ability to fly but only 2 feet off the ground',
          optionB: 'Have the ability to turn invisible but only when nobody is looking',
        }));
      }
    }

    if (state.phase === 'intro' && !state.question) {
      generateQuestion();
    }
  }, [state.phase, state.question, context]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleStartGame = () => {
    setState((s) => ({ ...s, phase: 'show-question' }));
    context.recordEvent({
      type: 'CARTRIDGE_STARTED',
      actNumber: 2,
      activePlayerId: context.players[0].id,
      cartridgeId: 'would-you-rather',
      cartridgeName: 'Would You Rather',
    } as any);
  };

  const handleStartVoting = () => {
    setState((s) => ({ ...s, phase: 'collect-votes', currentVotingPlayerIndex: 0 }));
  };

  const handleSubmitVote = (playerId: string, choice: 'A' | 'B') => {
    const submission: CartridgeSubmission = {
      playerId,
      answer: choice,
      submittedAt: Date.now(),
    };

    setState((s) => {
      const newSubmissions = [...s.submissions, submission];
      const nextIndex = s.currentVotingPlayerIndex + 1;

      if (nextIndex >= context.players.length) {
        // All players have voted - reveal results
        return {
          ...s,
          submissions: newSubmissions,
          phase: 'reveal',
        };
      } else {
        return {
          ...s,
          submissions: newSubmissions,
          currentVotingPlayerIndex: nextIndex,
        };
      }
    });
  };

  const handleComplete = () => {
    // TODO: TurnPacket creation - optional for MVP
    // Commenting out until type structure is finalized
    /*
    const turnPacket = createTurnPacket({
      sessionId: context.sessionId,
      actNumber: 2,
      cartridgeId: 'would-you-rather',
      cartridgeName: 'Would You Rather',
      prompt: {
        type: 'text',
        text: state.question,
      },
      relevance: {
        why: 'Learning about family preferences in a fun way',
        confidence: 0.8,
      },
      // NO SCORING CONFIG - this cartridge doesn't score
    });

    state.submissions.forEach((sub) => {
      turnPacket.submissions.push({
        playerId: sub.playerId,
        submittedAt: sub.submittedAt,
        content: {
          text: sub.answer === 'A' ? state.optionA : state.optionB,
        },
      });
    });
    */

    const result: CartridgeResult = {
      completed: true,
      scoreChanges: {}, // NO SCORE CHANGES - this is an entertainment cartridge
    };

    onComplete(result);
  };

  // ===========================================================================
  // RENDER - INTRO
  // ===========================================================================

  if (state.phase === 'intro') {
    return (
      <div className="viewport-container bg-gradient-to-br from-warning-50 to-primary-50">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="card max-w-2xl text-center">
            <div className="text-8xl mb-6">🤷</div>
            <h1 className="text-4xl font-bold mb-4">Would You Rather</h1>
            <p className="text-xl text-neutral-700 mb-6 leading-relaxed">
              I'll give you two choices based on what I learned about your family.
              Pick your favorite!
            </p>
            <p className="text-base text-neutral-600 mb-8">
              No points, no pressure - just for fun! 🎉
            </p>
            {!state.question && (
              <div className="text-center">
                <div className="spinner mb-4" />
                <p className="text-neutral-600">Crafting a question for you...</p>
              </div>
            )}
          </div>
        </div>

        {state.question && (
          <div className="px-6 py-4 safe-area-bottom">
            <button onClick={handleStartGame} className="btn-primary w-full text-lg">
              Let's Go!
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // RENDER - SHOW QUESTION
  // ===========================================================================

  if (state.phase === 'show-question') {
    return (
      <div className="viewport-container bg-gradient-to-br from-warning-500 to-primary-500">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="card max-w-2xl text-center bg-white/95 backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-8 text-primary-600">
              {state.question}
            </h2>

            <div className="space-y-4 mb-8">
              <div className="bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl p-6 border-2 border-warning-300">
                <div className="text-6xl mb-3">🅰️</div>
                <p className="text-xl font-semibold text-neutral-800 leading-relaxed">
                  {state.optionA}
                </p>
              </div>

              <div className="text-3xl font-bold text-neutral-400">OR</div>

              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border-2 border-primary-300">
                <div className="text-6xl mb-3">🅱️</div>
                <p className="text-xl font-semibold text-neutral-800 leading-relaxed">
                  {state.optionB}
                </p>
              </div>
            </div>

            <p className="text-base text-neutral-600">
              Time to vote! Pass the phone around.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 safe-area-bottom">
          <button onClick={handleStartVoting} className="btn-primary w-full text-lg">
            Start Voting
          </button>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER - COLLECT VOTES
  // ===========================================================================

  if (state.phase === 'collect-votes') {
    const currentPlayer = context.players[state.currentVotingPlayerIndex];

    return (
      <div className="viewport-container bg-warning-50">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-800">Would You Rather</h2>
            <div className="text-sm text-neutral-500">
              {state.currentVotingPlayerIndex + 1} / {context.players.length}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col p-6">
          <div className="mb-6 text-center">
            <div className="text-6xl mb-3">{currentPlayer.avatarId}</div>
            <h3 className="text-2xl font-bold mb-2">{currentPlayer.name}'s Turn</h3>
            <p className="text-neutral-600">Which would you rather?</p>
          </div>

          <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full justify-center">
            <button
              onClick={() => handleSubmitVote(currentPlayer.id, 'A')}
              className="btn-outline text-left flex flex-col items-center gap-3 p-6 hover:bg-warning-50"
            >
              <span className="text-5xl">🅰️</span>
              <p className="text-lg font-semibold text-center">{state.optionA}</p>
            </button>

            <button
              onClick={() => handleSubmitVote(currentPlayer.id, 'B')}
              className="btn-outline text-left flex flex-col items-center gap-3 p-6 hover:bg-primary-50"
            >
              <span className="text-5xl">🅱️</span>
              <p className="text-lg font-semibold text-center">{state.optionB}</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER - REVEAL (NO SCORING)
  // ===========================================================================

  if (state.phase === 'reveal') {
    const votesA = state.submissions.filter((s) => s.answer === 'A');
    const votesB = state.submissions.filter((s) => s.answer === 'B');

    return (
      <div className="viewport-container bg-gradient-to-br from-warning-50 to-primary-50">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">The Results Are In!</h2>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Option A */}
            <div className="card bg-gradient-to-r from-warning-50 to-warning-100 border-2 border-warning-300">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">🅰️</div>
                <p className="text-lg font-semibold text-neutral-800 mb-4">
                  {state.optionA}
                </p>
                <div className="text-4xl font-bold text-warning-600">
                  {votesA.length} {votesA.length === 1 ? 'vote' : 'votes'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {votesA.map((vote) => {
                  const player = context.players.find((p) => p.id === vote.playerId)!;
                  return (
                    <div
                      key={vote.playerId}
                      className="bg-white rounded-full px-4 py-2 flex items-center gap-2"
                    >
                      <span className="text-2xl">{player.avatarId}</span>
                      <span className="font-semibold text-neutral-700">
                        {player.name}
                      </span>
                    </div>
                  );
                })}
                {votesA.length === 0 && (
                  <p className="text-neutral-500 text-sm">No one chose this option</p>
                )}
              </div>
            </div>

            {/* Option B */}
            <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-300">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">🅱️</div>
                <p className="text-lg font-semibold text-neutral-800 mb-4">
                  {state.optionB}
                </p>
                <div className="text-4xl font-bold text-primary-600">
                  {votesB.length} {votesB.length === 1 ? 'vote' : 'votes'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {votesB.map((vote) => {
                  const player = context.players.find((p) => p.id === vote.playerId)!;
                  return (
                    <div
                      key={vote.playerId}
                      className="bg-white rounded-full px-4 py-2 flex items-center gap-2"
                    >
                      <span className="text-2xl">{player.avatarId}</span>
                      <span className="font-semibold text-neutral-700">
                        {player.name}
                      </span>
                    </div>
                  );
                })}
                {votesB.length === 0 && (
                  <p className="text-neutral-500 text-sm">No one chose this option</p>
                )}
              </div>
            </div>

            {/* Fun summary */}
            <div className="text-center">
              <p className="text-lg text-neutral-600">
                {votesA.length === votesB.length
                  ? "It's a tie! You're all thinking differently! 🎉"
                  : votesA.length > votesB.length
                    ? '🅰️ wins this round!'
                    : '🅱️ wins this round!'}
              </p>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-6 py-4 bg-white border-t border-neutral-200">
          <button onClick={handleComplete} className="btn-primary w-full text-lg">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ===========================================================================
// CARTRIDGE DEFINITION - Export
// ===========================================================================

/**
 * Would You Rather Cartridge Definition
 *
 * This is what gets registered with the cartridge registry.
 */
export const wouldYouRatherCartridge: CartridgeDefinition = {
  // Metadata
  id: 'would-you-rather',
  name: 'Would You Rather',
  description:
    'Choose between two options based on what the LLM learned about your family. No points, just fun!',
  icon: '🤷',
  estimatedDuration: 120000, // 2 minutes
  tags: ['voting', 'preferences', 'casual', 'no-scoring'],

  // Requirements
  minPlayers: 2,
  maxPlayers: 10,
  minFacts: 2, // Need some facts to generate relevant questions

  // Selection logic
  canRun(context: CartridgeContext): boolean {
    return context.factsDB.facts.length >= 2;
  },

  getRelevanceScore(context: CartridgeContext): number {
    let score = 0.6; // Base score

    // Bonus for more facts (better customization)
    if (context.factsDB.facts.length >= 5) {
      score += 0.1;
    }

    // Good for all player counts
    score += 0.05;

    // Penalty if played recently
    const recentCartridges = context.eventLog.events
      .filter((e: any) => e.type === 'CARTRIDGE_STARTED')
      .slice(-2)
      .map((e: any) => e.cartridgeId);

    if (recentCartridges.includes('would-you-rather')) {
      score *= 0.4; // 60% penalty
    }

    return Math.min(score, 1.0);
  },

  // Component
  Component: WouldYouRatherCartridgeComponent,
};

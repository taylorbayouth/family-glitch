'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore, useGameStore } from '@/lib/store';
import { buildGameMasterPrompt } from '@/lib/ai/game-master-prompt';
import { sendChatRequest } from '@/lib/ai/client';
import { TemplateRenderer } from '@/components/input-templates';
import { PassToPlayerScreen } from '@/components/PassToPlayerScreen';
import { InsightsCollectionScreen } from '@/components/InsightsCollectionScreen';
import { EndGameResults } from '@/components/EndGameResults';
import { calculateCurrentAct, calculateTotalRounds } from '@/lib/constants';
import { selectQuestionForPlayer, type TransitionEventDefinition } from '@/lib/act-transitions';
// Import registry - this also triggers all mini-game registrations
import {
  getMiniGame,
  isMiniGame,
  getEligibleTurnsForPlayer,
  type MiniGameConfig,
} from '@/lib/mini-games';
import type { ChatMessage } from '@/lib/ai/types';
import type { MiniGameResult } from '@/lib/mini-games/types';

// Core game phases - mini-games are handled dynamically via 'minigame' phase
type GamePhase = 'pass' | 'question' | 'loading' | 'minigame' | 'endgame' | 'transition-pass' | 'transition-question';

// Active mini-game state
interface ActiveMiniGame {
  type: string;
  config: MiniGameConfig;
}

/**
 * Main Game Play Page
 *
 * Flow:
 * 1. Show "Pass to Player" screen (preload question during this)
 * 2. Player slides to unlock
 * 3. Show question with template (or mini-game if triggered)
 * 4. Player submits answer
 * 5. Back to "Pass to next Player"
 *
 * Mini-games are handled dynamically via the registry system.
 * Adding a new mini-game requires NO changes to this file!
 */
export default function PlayPage() {
  const router = useRouter();
  const { players, hasHydrated } = usePlayerStore();
  const {
    gameId,
    turns,
    scores,
    addTurn,
    completeTurn,
    startGame,
    isGameComplete,
    // Generic transition events
    transitionResponses,
    transitionEvents,
    addTransitionResponse,
    markTransitionEventComplete,
    getPendingTransitionEvent,
    getNextPlayerForEvent,
  } = useGameStore();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);

  // AI conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);

  // Loading states
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Current turn tracking
  const [currentTurnId, setCurrentTurnId] = useState<string>('');
  const [turnStartTime, setTurnStartTime] = useState<number>(0);

  // Mini-game state (unified for ALL mini-games via registry)
  const [activeMiniGame, setActiveMiniGame] = useState<ActiveMiniGame | null>(null);

  // Generic transition event state
  const [activeTransitionEvent, setActiveTransitionEvent] = useState<TransitionEventDefinition | null>(null);
  const [transitionPlayerIndex, setTransitionPlayerIndex] = useState(0);
  const [currentTransitionQuestion, setCurrentTransitionQuestion] = useState<{
    question: string;
    category: string;
    placeholder: string;
  } | null>(null);

  const currentPlayer = players[currentPlayerIndex];
  const transitionPlayer = players[transitionPlayerIndex];

  // Initialize game
  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    if (!hasHydrated) {
      return;
    }

    if (players.length === 0) {
      router.push('/setup');
      return;
    }

    // Start game in store if not started
    if (!gameId) {
      startGame(players.length);
    }

    // Initialize system prompt
    const systemPrompt = buildGameMasterPrompt(players, {
      gameId,
      turns,
      scores,
      status: 'playing',
    });

    setMessages([{ role: 'system', content: systemPrompt }]);

    // Load first question immediately, then show pass screen
    loadQuestion().then(() => {
      setPhase('pass');
    });
  }, [hasHydrated]);

  /**
   * Load a question from the AI
   * This happens during the "pass" phase to preload
   */
  const loadQuestion = async (playerIndex?: number) => {
    setIsLoadingQuestion(true);
    setError(null);

    try {
      // Use provided index or fall back to current state
      const targetPlayer = players[playerIndex ?? currentPlayerIndex];

      // Calculate eligible turns for trivia challenges
      const eligibleTurns = targetPlayer
        ? getEligibleTurnsForPlayer(turns, targetPlayer.id)
        : [];

      // Create a summary of eligible turns for the prompt
      const triviaEligibleTurns = eligibleTurns.length >= 1
        ? [...new Map(eligibleTurns.map(t => [t.playerId, t])).values()].map(t => ({
            playerId: t.playerId,
            playerName: t.playerName,
            turnId: t.turnId,
          }))
        : undefined;

      // Update system prompt with current game state, trivia eligibility, and transition responses
      const systemPrompt = buildGameMasterPrompt(
        players,
        { gameId, turns, scores, status: 'playing', transitionResponses, transitionEvents },
        { currentPlayerId: targetPlayer?.id, triviaEligibleTurns }
      );

      const newMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(1), // Keep conversation history, replace system prompt
        {
          role: 'user',
          content: `It's ${targetPlayer?.name || 'the player'}'s turn. Ask them ONE short, direct question.

CRITICAL RULES:
1. NO player names in the question text
2. ONE question only - no multi-part questions
3. Keep it under 20 words
4. VARY YOUR TOOLS - Don't use ask_for_text every time! Mix in ask_for_list, ask_binary_choice, ask_rating, ask_word_selection, ask_player_vote`,
        },
      ];

      // Calculate current act and enforce tool restrictions
      const completedTurns = turns.filter(t => t.status === 'completed').length;
      const totalRounds = calculateTotalRounds(players.length);
      const currentAct = calculateCurrentAct(completedTurns, totalRounds);

      // Define tool sets by act
      const act1Tools = [
        'ask_for_text',
        'ask_for_list',
        'ask_binary_choice',
        'ask_word_selection',
        'ask_rating',
        'ask_player_vote',
      ];

      const act2Tools = [
        'trigger_trivia_challenge',
        'trigger_personality_match',
        'trigger_hard_trivia',
        'trigger_the_filter',
      ];

      const act3Tools = [
        ...act2Tools,
        'trigger_madlibs_challenge',
        'trigger_cryptic_connection',
        'trigger_lighting_round',
      ];

      // Select tools based on current act
      const allowedTools = currentAct === 1 ? act1Tools : currentAct === 2 ? act2Tools : act3Tools;

      const response = await sendChatRequest(newMessages, {
        toolChoice: 'required', // Force AI to use one of the template tools
        tools: allowedTools, // Restrict to act-appropriate tools (enforced at API level)
        temperature: 0.9, // Increase variety for questions/mini-games
      });

      // Parse tool call result (template configuration)
      const templateConfig = JSON.parse(response.text);

      // Check if this is a mini-game (using the registry)
      if (isMiniGame(templateConfig.templateType)) {
        const miniGameDef = getMiniGame(templateConfig.templateType);

        if (miniGameDef) {
          // Extract config using the mini-game's own extraction logic
          const config = miniGameDef.extractConfig(templateConfig, {
            players: players.map(p => ({
              id: p.id,
              name: p.name,
              role: p.role,
              avatar: p.avatar,
            })),
            turns,
            currentPlayerId: targetPlayer.id,
          });

          if (config) {
            // Valid mini-game config - set it up
            setActiveMiniGame({
              type: templateConfig.templateType,
              config,
            });
            setCurrentTemplate(templateConfig);
            setMessages([...newMessages, { role: 'assistant', content: response.text }]);
            return; // Don't create a regular turn for mini-games
          }
        }
        // If config extraction failed, skip this turn and load a new question
        console.warn(`Mini-game "${templateConfig.templateType}" config extraction failed, retrying with new question`);
        return loadQuestion(playerIndex);
      }

      // Regular question - sanitize prompt
      if (!templateConfig.prompt) {
        console.error('No prompt in template config');
        return loadQuestion(playerIndex);
      }

      let sanitizedPrompt = templateConfig.prompt;
      players.forEach(player => {
        // Remove "PlayerName:" or "PlayerName (Role):" patterns at the start
        const namePattern = new RegExp(`^${player.name}\\s*(?:\\([^)]+\\))?:\\s*`, 'i');
        sanitizedPrompt = sanitizedPrompt.replace(namePattern, '');
      });
      templateConfig.prompt = sanitizedPrompt;

      // Create turn in game state and get the generated turnId
      const turnId = addTurn({
        playerId: targetPlayer.id,
        playerName: targetPlayer.name,
        templateType: templateConfig.templateType,
        prompt: templateConfig.prompt,
        templateParams: templateConfig.params,
      });

      setCurrentTurnId(turnId);
      setCurrentTemplate(templateConfig);
      setMessages([...newMessages, { role: 'assistant', content: response.text }]);
    } catch (err) {
      console.error('Failed to load question:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;

      setError('Failed to load question. Please try again.');
      setErrorDetails(`Error: ${errorMessage}\n\nPlayers: ${players.length}\nTurns: ${turns.length}\nStack: ${errorStack || 'N/A'}`);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  /**
   * Start a transition event (generic)
   * Called when a transition event is pending
   */
  const startTransitionEvent = (event: TransitionEventDefinition) => {
    setActiveTransitionEvent(event);

    // Find the first player who hasn't completed this event
    const nextPlayerId = getNextPlayerForEvent(event.id, players.map(p => p.id));

    if (!nextPlayerId) {
      // All players have completed - mark complete and continue
      markTransitionEventComplete(event.id);
      setActiveTransitionEvent(null);
      setPhase('pass');
      loadQuestion(currentPlayerIndex);
      return;
    }

    // Find the player index
    const playerIndex = players.findIndex(p => p.id === nextPlayerId);
    if (playerIndex === -1) {
      console.error('Could not find player for transition event:', nextPlayerId);
      return;
    }

    setTransitionPlayerIndex(playerIndex);

    // Select a question for this player
    const eventState = transitionEvents[event.id];
    const collectedCount = eventState?.collectedFrom.length || 0;
    const questionData = selectQuestionForPlayer(event, players[playerIndex], collectedCount);
    setCurrentTransitionQuestion(questionData);

    // Show the pass screen for transition event
    setPhase('transition-pass');
  };

  /**
   * Handle unlocking the transition question
   */
  const handleTransitionUnlock = () => {
    setPhase('transition-question');
  };

  /**
   * Handle submitting a transition response
   */
  const handleTransitionResponse = (response: string) => {
    if (!currentTransitionQuestion || !transitionPlayer || !activeTransitionEvent) return;

    // Store the response
    addTransitionResponse({
      eventId: activeTransitionEvent.id,
      playerId: transitionPlayer.id,
      playerName: transitionPlayer.name,
      question: currentTransitionQuestion.question,
      category: currentTransitionQuestion.category,
      response,
    });

    // Check if there are more players
    const nextPlayerId = getNextPlayerForEvent(activeTransitionEvent.id, players.map(p => p.id));

    if (!nextPlayerId) {
      // All players done - mark complete and resume normal gameplay
      markTransitionEventComplete(activeTransitionEvent.id);
      setActiveTransitionEvent(null);
      setCurrentTransitionQuestion(null);

      // Advance to next player (don't give same player consecutive turns)
      const nextIndex = (currentPlayerIndex + 1) % players.length;
      setCurrentPlayerIndex(nextIndex);
      setTurnNumber(turnNumber + 1);

      setPhase('pass');
      loadQuestion(nextIndex);
    } else {
      // Move to next player for this event
      const nextIndex = players.findIndex(p => p.id === nextPlayerId);
      setTransitionPlayerIndex(nextIndex);

      // Select their question
      const eventState = transitionEvents[activeTransitionEvent.id];
      const collectedCount = eventState?.collectedFrom.length || 0;
      const questionData = selectQuestionForPlayer(activeTransitionEvent, players[nextIndex], collectedCount);
      setCurrentTransitionQuestion(questionData);

      // Show pass screen for next player
      setPhase('transition-pass');
    }
  };

  /**
   * Handle player unlocking the question
   */
  const handleUnlock = () => {
    if (activeMiniGame) {
      setPhase('minigame');
    } else {
      setPhase('question');
    }
    setTurnStartTime(Date.now());
  };

  /**
   * Handle mini-game completion (generic for ALL mini-games)
   */
  const handleMiniGameComplete = (result: MiniGameResult | { score: number; commentary: string }) => {
    setActiveMiniGame(null);
    setCurrentTemplate(null);
    handleContinueToNext();
  };

  /**
   * Handle skipping a mini-game
   */
  const handleMiniGameSkip = () => {
    setActiveMiniGame(null);
    setCurrentTemplate(null);
    handleContinueToNext();
  };

  /**
   * Handle player submitting their response
   */
  const handleResponse = async (response: any) => {
    // Calculate turn duration
    const duration = (Date.now() - turnStartTime) / 1000;

    // Store response in game state
    completeTurn(currentTurnId, response, duration);

    // Note: Points are only awarded through mini-games (0-5 scoring system)

    // Reset template
    setCurrentTemplate(null);

    // Move directly to next player
    handleContinueToNext();
  };

  /**
   * Handle advancing to next player after commentary
   */
  const handleContinueToNext = () => {
    // Check if game is complete
    if (isGameComplete()) {
      setPhase('endgame');
      return;
    }

    // Check if we need to trigger a transition event
    const pendingEvent = getPendingTransitionEvent();
    if (pendingEvent) {
      startTransitionEvent(pendingEvent);
      return;
    }

    // NOW move to next player
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    setTurnNumber(turnNumber + 1);

    // Show pass screen
    setPhase('pass');

    // Preload next question while showing pass screen, passing the nextIndex explicitly
    loadQuestion(nextIndex);
  };

  // Error state
  if (error) {
    const [showDetails, setShowDetails] = useState(false);

    return (
      <div className="min-h-dvh bg-void flex items-center justify-center p-6">
        <div className="glass rounded-xl p-6 border border-alert max-w-2xl w-full">
          <h2 className="text-alert font-bold text-xl mb-4">Error</h2>
          <p className="text-frost mb-6">{error}</p>

          {errorDetails && (
            <div className="mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-steel-400 hover:text-frost text-sm underline mb-2"
              >
                {showDetails ? 'Hide' : 'Show'} error details
              </button>

              {showDetails && (
                <div className="mt-2 p-4 bg-void-light rounded-lg border border-steel-800">
                  <pre className="text-xs text-steel-400 whitespace-pre-wrap break-words font-mono">
                    {errorDetails}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(errorDetails);
                      alert('Error details copied to clipboard');
                    }}
                    className="mt-3 text-xs text-glitch hover:text-glitch-bright underline"
                  >
                    Copy error details
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                setErrorDetails(null);
                loadQuestion();
              }}
              className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-3 px-6 rounded-xl"
            >
              Try Again
            </button>

            <button
              onClick={() => router.push('/setup')}
              className="w-full bg-steel-800 hover:bg-steel-700 text-frost font-bold py-3 px-6 rounded-xl"
            >
              Back to Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial loading
  if (phase === 'loading' && !currentTemplate) {
    return (
      <div className="min-h-dvh bg-void flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-glitch animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
          <p className="text-frost font-mono">Initializing game...</p>
        </div>
      </div>
    );
  }

  // Pass to player screen
  if (phase === 'pass') {
    return (
      <PassToPlayerScreen
        player={currentPlayer}
        onUnlock={handleUnlock}
        isLoadingQuestion={isLoadingQuestion}
        turnNumber={turnNumber}
      />
    );
  }

  // Transition event pass screen
  if (phase === 'transition-pass' && transitionPlayer && activeTransitionEvent) {
    const eventState = transitionEvents[activeTransitionEvent.id];
    const playersRemaining = players.length - (eventState?.collectedFrom.length || 0);
    return (
      <InsightsCollectionScreen
        player={transitionPlayer}
        onUnlock={handleTransitionUnlock}
        transitionMessage={activeTransitionEvent.transitionMessage(playersRemaining)}
        isFirst={(eventState?.collectedFrom.length || 0) === 0}
      />
    );
  }

  // Transition event question screen
  if (phase === 'transition-question' && transitionPlayer && currentTransitionQuestion && activeTransitionEvent) {
    const eventState = transitionEvents[activeTransitionEvent.id];
    const collectedCount = eventState?.collectedFrom.length || 0;

    return (
      <div className="min-h-dvh h-dvh bg-void relative flex flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        {/* Header */}
        <div className="relative z-10 p-4 border-b border-steel-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-glitch to-glitch-bright flex items-center justify-center text-frost font-bold">
                {transitionPlayer.name[0]}
              </div>
              <div>
                <p className="text-frost font-medium">{transitionPlayer.name}</p>
                <p className="text-steel-400 text-sm">{activeTransitionEvent.questionSubtitle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-glitch text-sm font-mono">
                {collectedCount + 1} / {players.length}
              </p>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="relative z-10 flex-1 flex flex-col p-6">
          <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
            <p className="text-steel-400 text-sm mb-2 uppercase tracking-wider">
              {currentTransitionQuestion.category.replace('_', ' ')}
            </p>
            <h2 className="text-frost text-2xl font-bold mb-8">
              {currentTransitionQuestion.question}
            </h2>

            <textarea
              id="transition-response"
              className="w-full h-32 bg-void-light border border-steel-700 rounded-xl p-4 text-frost placeholder-steel-500 focus:border-glitch focus:outline-none resize-none"
              placeholder={currentTransitionQuestion.placeholder}
              autoFocus
            />

            <button
              onClick={() => {
                const textarea = document.getElementById('transition-response') as HTMLTextAreaElement;
                const response = textarea?.value?.trim();
                if (response) {
                  handleTransitionResponse(response);
                }
              }}
              className="mt-6 w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-4 px-6 rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question screen (regular templates)
  if (phase === 'question' && currentTemplate) {
    return (
      <div className="min-h-dvh h-dvh bg-void relative flex flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        {/* Template */}
        <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar">
          <TemplateRenderer
            templateType={currentTemplate.templateType}
            params={{
              prompt: currentTemplate.prompt,
              subtitle: currentTemplate.subtitle,
              ...currentTemplate.params,
              // Inject player data for player selector template
              ...(currentTemplate.templateType === 'tpl_player_selector' && {
                players: players,
                currentPlayerId: currentPlayer.id,
              }),
              onSubmit: handleResponse,
            }}
          />
        </div>
      </div>
    );
  }

  // Mini-game screen (dynamic via registry)
  if (phase === 'minigame' && activeMiniGame && currentPlayer) {
    const miniGameDef = getMiniGame(activeMiniGame.type);

    if (miniGameDef) {
      const MiniGameComponent = miniGameDef.component;

      return (
        <div className="min-h-dvh h-dvh bg-void flex flex-col overflow-hidden">
          {/* Mini-game content */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <MiniGameComponent
              targetPlayer={{
                id: currentPlayer.id,
                name: currentPlayer.name,
                role: currentPlayer.role,
                avatar: currentPlayer.avatar,
              }}
              allPlayers={players.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role,
                avatar: p.avatar,
              }))}
              onComplete={handleMiniGameComplete}
              onSkip={handleMiniGameSkip}
              turnNumber={turnNumber}
              {...activeMiniGame.config}
            />
          </div>
        </div>
      );
    }
  }

  // End game results screen
  if (phase === 'endgame') {
    return (
      <EndGameResults
        onPlayAgain={() => {
          // Reset game state and go to setup
          router.push('/setup');
        }}
      />
    );
  }

  return null;
}

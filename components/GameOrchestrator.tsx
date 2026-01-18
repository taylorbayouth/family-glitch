/**
 * ============================================================================
 * GAME ORCHESTRATOR - Main Game Controller
 * ============================================================================
 *
 * This is the "brain" of Family Glitch. It:
 * - Manages global game state
 * - Routes to the correct screen based on state machine
 * - Handles state transitions
 * - Auto-saves progress to localStorage
 * - Coordinates all subsystems (turn manager, facts DB, pacing, etc.)
 *
 * Architecture:
 * - Single source of truth for game state
 * - Immutable state updates (React-friendly)
 * - Event-driven (every action generates events)
 * - Screen components are "dumb" - they receive props and fire callbacks
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  PersistedSession,
  GameState,
  GameSetup,
  EventLog,
  FactsDB,
  GameStateType,
} from '@/types/game';
import {
  autoSaveSession,
  createPersistedSession,
} from '@/lib/persistence';
import { createEventLog, appendEvent, createAnswerSubmittedEvent, createFactStoredEvent } from '@/lib/eventLog';
import { createFactsDB, createFactCard, addFact } from '@/lib/factsDB';
import {
  transition,
  createInitialGameState,
} from '@/lib/stateMachine';
import { calculatePacing } from '@/lib/pacing';
import { TIMING } from '@/lib/constants';
import { advanceToNextPlayer, getActivePlayer, getNextPlayer } from '@/lib/turnManager';
import { LLMResponse } from '@/types/game';
import {
  CartridgeContext,
  CartridgeDefinition,
  CartridgeResult,
} from '@/types/cartridge';
import {
  cartridgeRegistry,
  registerAllCartridges,
} from '@/lib/cartridgeRegistry';
import { requestFactPrompt } from '@/lib/llmClient';

// Import screen components
import { SetupScreen } from '@/components/SetupScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { Act1FactPromptScreen } from '@/components/Act1FactPromptScreen';
import { Act1ConfirmScreen } from '@/components/Act1ConfirmScreen';

/**
 * Props for GameOrchestrator
 */
interface GameOrchestratorProps {
  /** Existing session to resume (optional) */
  existingSession: PersistedSession | null;

  /** Callback when starting a new game */
  onNewGame: () => void;
}

/**
 * Game Orchestrator Component
 *
 * This component manages the entire game lifecycle and renders
 * the appropriate screen based on the current game state.
 */
export function GameOrchestrator({
  existingSession,
  onNewGame,
}: GameOrchestratorProps) {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Core game state
   * - setup: Player configuration (immutable after start)
   * - state: Current position in state machine
   * - eventLog: Complete history of all events
   * - factsDB: Knowledge base built during Act 1
   * - scores: Denormalized scores for quick access
   */
  const [setup, setSetup] = useState<GameSetup | null>(
    existingSession?.setup || null
  );
  const [state, setState] = useState<GameState | null>(
    existingSession?.state || null
  );
  const [eventLog, setEventLog] = useState<EventLog>(
    existingSession?.eventLog || createEventLog('')
  );
  const [factsDB, setFactsDB] = useState<FactsDB>(
    existingSession?.factsDB || createFactsDB()
  );
  const [scores, setScores] = useState<Record<string, number>>(
    existingSession?.scores || {}
  );

  /**
   * UI state
   */
  const [_isTransitioning, _setIsTransitioning] = useState(false);

  /**
   * Act 2 state - current active cartridge
   */
  const [currentCartridge, setCurrentCartridge] = useState<CartridgeDefinition | null>(null);

  // ===========================================================================
  // AUTO-SAVE EFFECT
  // ===========================================================================

  /**
   * Auto-save session to localStorage whenever state changes
   *
   * This ensures players never lose progress on accidental refresh
   */
  useEffect(() => {
    // Only save if we have a valid session
    if (!setup || !state) return;

    const session: PersistedSession = createPersistedSession(
      setup,
      state,
      eventLog,
      factsDB,
      scores
    );

    // Auto-save (silently fails on error)
    autoSaveSession(session);
  }, [setup, state, eventLog, factsDB, scores]);

  // ===========================================================================
  // CARTRIDGE REGISTRATION
  // ===========================================================================

  /**
   * Register all cartridges on mount
   */
  useEffect(() => {
    registerAllCartridges();
  }, []);

  // ===========================================================================
  // GAME INITIALIZATION
  // ===========================================================================

  /**
   * Start a new game with player configuration
   *
   * Called from SetupScreen when players are ready to begin
   */
  const handleGameStart = useCallback((gameSetup: GameSetup) => {
    console.log('Starting new game:', gameSetup);

    // Initialize game state
    const playerIds = gameSetup.players.map((p) => p.id);
    const firstPlayerId = gameSetup.players[0].id;

    const initialState = createInitialGameState(
      gameSetup.sessionId,
      firstPlayerId,
      playerIds,
      TIMING.TARGET_DURATION_MS
    );

    // Initialize scores to 0
    const initialScores: Record<string, number> = {};
    playerIds.forEach((id) => {
      initialScores[id] = 0;
    });

    // Set all state
    setSetup(gameSetup);
    setState(initialState);
    setEventLog(createEventLog(gameSetup.sessionId));
    setFactsDB(createFactsDB());
    setScores(initialScores);

    // Notify parent that we're starting fresh
    onNewGame();
  }, [onNewGame]);

  /**
   * Resume existing game
   *
   * Called from WelcomeScreen when player chooses to continue
   */
  const handleResumeGame = useCallback(() => {
    console.log('Resuming existing game');
    // State is already loaded from existingSession prop
    // Just need to confirm we're continuing
  }, []);

  /**
   * Start a brand new game (discard existing session)
   *
   * Called from WelcomeScreen when player chooses to start fresh
   */
  const handleStartNewGame = useCallback(() => {
    console.log('Starting brand new game');

    // Clear all state
    setSetup(null);
    setState(null);
    setEventLog(createEventLog(''));
    setFactsDB(createFactsDB());
    setScores({});

    // Notify parent
    onNewGame();
  }, [onNewGame]);

  // ===========================================================================
  // STATE TRANSITIONS
  // ===========================================================================

  /**
   * Transition to a new game state
   *
   * This is the core function for moving through the game.
   * It validates transitions, updates state, and records events.
   *
   * @param nextState - Desired next state
   */
  const handleStateTransition = useCallback((nextState: GameStateType) => {
    setState((currentState) => {
      if (!currentState) {
        console.error('Cannot transition: no current state');
        return currentState;
      }

      try {
        // Perform transition (validates and generates event)
        const [updatedState, transitionEvent] = transition(
          currentState,
          nextState
        );

        // Record event
        setEventLog((log) => appendEvent(log, transitionEvent));

        console.log(
          `State transition: ${currentState.currentState} → ${nextState}`
        );

        return updatedState;
      } catch (error) {
        console.error('State transition failed:', error);
        return currentState;
      }
    });
  }, []);

  // ===========================================================================
  // ACT 1 HANDLERS
  // ===========================================================================

  /**
   * Handle fact submission from Act 1 prompt screen
   *
   * @param answer - Player's answer
   * @param llmResponse - LLM response that generated the prompt
   */
  const handleFactSubmit = useCallback((answer: string, llmResponse: LLMResponse) => {
    if (!state || !setup) return;

    // Create fact card
    const factToStore = llmResponse.factsToStore?.[0];
    if (!factToStore) {
      console.error('No fact template in LLM response');
      return;
    }

    const factCard = createFactCard(
      factToStore.targetPlayerId || state.activePlayerId || '',
      state.activePlayerId || '',
      factToStore.category,
      factToStore.question,
      answer,
      factToStore.privacyLevel
    );

    // Add to facts DB
    setFactsDB((db) => addFact(db, factCard));

    // Record events
    const answerEvent = createAnswerSubmittedEvent(
      factCard.id, // Use fact ID as prompt ID
      answer,
      'private',
      false,
      1, // Act 1
      state.activePlayerId || ''
    );

    const factEvent = createFactStoredEvent(
      factCard.id,
      factCard,
      1,
      state.activePlayerId
    );

    setEventLog((log) => {
      let newLog = appendEvent(log, answerEvent);
      newLog = appendEvent(newLog, factEvent);
      return newLog;
    });

    // Transition to confirmation screen
    handleStateTransition('ACT1_FACT_CONFIRM');
  }, [state, setup, handleStateTransition]);

  /**
   * Handle continuation from Act 1 confirmation screen
   *
   * Advances to next player or transitions to Act 2
   */
  const handleAct1Continue = useCallback(() => {
    if (!state || !setup) return;

    // Check if we should end Act 1
    const pacing = calculatePacing(state, eventLog, factsDB, setup.players);

    if (pacing.shouldEndAct1) {
      // Transition to Act 2
      handleStateTransition('ACT1_TRANSITION');
    } else {
      // Advance to next player
      setState((currentState) => {
        if (!currentState) return currentState;
        return advanceToNextPlayer(currentState, setup.players);
      });

      // Go back to fact prompt screen
      handleStateTransition('ACT1_FACT_PROMPT_PRIVATE');
    }
  }, [state, setup, eventLog, factsDB, handleStateTransition]);

  // ===========================================================================
  // ACT 2 HANDLERS
  // ===========================================================================

  /**
   * Build cartridge context from current game state
   */
  const buildCartridgeContext = useCallback((): CartridgeContext | null => {
    if (!state || !setup) return null;

    return {
      sessionId: state.sessionId,
      players: setup.players,
      factsDB,
      eventLog,
      currentScores: scores,
      safetyMode: setup.safetyMode,
      elapsedTime: Date.now() - state.startTime,
      remainingTime: Math.max(0, state.targetDurationMs - (Date.now() - state.startTime)),

      recordEvent: (event: any) => {
        setEventLog((log) => appendEvent(log, { ...event, id: crypto.randomUUID(), timestamp: Date.now() }));
      },

      updateScores: (deltas: Record<string, number>) => {
        setScores((current) => {
          const updated = { ...current };
          Object.entries(deltas).forEach(([playerId, delta]) => {
            updated[playerId] = (updated[playerId] || 0) + delta;
          });
          return updated;
        });
      },

      requestLLM: async (_request: any) => {
        // For now, delegate to requestFactPrompt
        // In the future, we'll have a more general LLM request handler
        return requestFactPrompt(state, eventLog, setup.players, scores, setup.safetyMode);
      },
    };
  }, [state, setup, factsDB, eventLog, scores]);

  /**
   * Select and load next cartridge
   */
  const handleSelectCartridge = useCallback(async () => {
    const context = buildCartridgeContext();
    if (!context) {
      console.error('Cannot select cartridge: no context');
      return;
    }

    try {
      // Select cartridge (use heuristic for now, LLM selection later)
      const selected = await cartridgeRegistry.selectNext(context, false);

      if (!selected) {
        console.warn('No cartridges available, ending Act 2');
        handleStateTransition('ACT2_TRANSITION');
        return;
      }

      console.log(`Selected cartridge: ${selected.name}`);
      setCurrentCartridge(selected);

      // Transition to active state
      handleStateTransition('ACT2_CARTRIDGE_ACTIVE');
    } catch (error) {
      console.error('Failed to select cartridge:', error);
      // Fall back to ending Act 2
      handleStateTransition('ACT2_TRANSITION');
    }
  }, [buildCartridgeContext, handleStateTransition]);

  /**
   * Handle cartridge completion
   */
  const handleCartridgeComplete = useCallback((result: CartridgeResult) => {
    if (!result.completed) {
      console.warn('Cartridge did not complete successfully');
      return;
    }

    console.log('Cartridge completed:', result);

    // Update scores if provided
    if (Object.keys(result.scoreChanges).length > 0) {
      setScores((current) => {
        const updated = { ...current };
        Object.entries(result.scoreChanges).forEach(([playerId, points]) => {
          updated[playerId] = (updated[playerId] || 0) + points;
        });
        return updated;
      });
    }

    // Record completion event
    setEventLog((log) =>
      appendEvent(log, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'CARTRIDGE_COMPLETED' as any,
        actNumber: 2,
        activePlayerId: state?.activePlayerId || '',
        cartridgeId: currentCartridge?.id || '',
      })
    );

    // Clear current cartridge
    setCurrentCartridge(null);

    // Check if we should end Act 2 or select next cartridge
    if (!state || !setup) return;

    const pacing = calculatePacing(state, eventLog, factsDB, setup.players);

    if (pacing.shouldEndAct2) {
      // End Act 2
      handleStateTransition('ACT2_TRANSITION');
    } else {
      // Select next cartridge
      handleSelectCartridge();
    }
  }, [state, setup, eventLog, factsDB, currentCartridge, handleStateTransition, handleSelectCartridge]);

  // ===========================================================================
  // SCREEN RENDERING
  // ===========================================================================

  /**
   * Render the appropriate screen based on current game state
   *
   * This is the routing logic - each state maps to a screen component
   */
  const renderCurrentScreen = () => {
    // If no setup, show setup screen
    if (!setup || !state) {
      // Check if we have an existing session to resume
      if (existingSession) {
        return (
          <WelcomeScreen
            session={existingSession}
            onResume={handleResumeGame}
            onNewGame={handleStartNewGame}
          />
        );
      }

      // No existing session - show setup
      return <SetupScreen onStart={handleGameStart} />;
    }

    // Calculate current pacing for context
    // TODO: Use pacing data in cartridge context
    // const pacing = calculatePacing(state, eventLog, factsDB, setup.players);

    // Route based on current state
    switch (state.currentState) {
      case 'SETUP':
        // This shouldn't happen (setup is complete), but handle it
        return <SetupScreen onStart={handleGameStart} />;

      case 'ACT1_FACT_PROMPT_PRIVATE':
        return (
          <Act1FactPromptScreen
            state={state}
            players={setup.players}
            eventLog={eventLog}
            factsDB={factsDB}
            scores={scores}
            safetyMode={setup.safetyMode}
            onSubmit={handleFactSubmit}
          />
        );

      case 'ACT1_FACT_CONFIRM':
        const activePlayer = getActivePlayer(state, setup.players);
        const nextPlayer = getNextPlayer(state, setup.players);

        return (
          <Act1ConfirmScreen
            currentPlayer={activePlayer!}
            nextPlayer={nextPlayer}
            onContinue={handleAct1Continue}
          />
        );

      case 'ACT1_TRANSITION':
        return (
          <div className="viewport-container flex-center bg-gradient-to-br from-primary-500 to-secondary-500">
            <div className="card text-center">
              <h1 className="text-3xl font-bold mb-4">Ready for the games?</h1>
              <p className="text-neutral-600 mb-6">
                You've learned a lot about each other. Time to put it to use!
              </p>
              <button
                onClick={handleSelectCartridge}
                className="btn-primary"
              >
                Let's Go!
              </button>
            </div>
          </div>
        );

      case 'ACT2_CARTRIDGE_ACTIVE':
        // Render active cartridge
        if (!currentCartridge) {
          return (
            <div className="viewport-container flex-center bg-secondary-50">
              <div className="card text-center">
                <div className="spinner mb-4" />
                <p className="text-neutral-600">Loading game...</p>
              </div>
            </div>
          );
        }

        const context = buildCartridgeContext();
        if (!context) {
          return (
            <div className="viewport-container flex-center bg-danger-50">
              <div className="card text-center">
                <h1 className="text-xl font-bold text-danger-600 mb-4">Error</h1>
                <p className="text-neutral-600">Failed to build game context</p>
              </div>
            </div>
          );
        }

        const CartridgeComponent = currentCartridge.Component;
        return (
          <CartridgeComponent
            context={context}
            onComplete={handleCartridgeComplete}
          />
        );

      case 'ACT2_TRANSITION':
        return (
          <div className="viewport-container flex-center bg-gradient-to-br from-secondary-500 to-warning-500">
            <div className="card text-center">
              <h1 className="text-3xl font-bold mb-4">Great job!</h1>
              <p className="text-neutral-600 mb-6">
                Time for the final reveal...
              </p>
              <button
                onClick={() => handleStateTransition('ACT3_FINAL_REVEAL')}
                className="btn-primary"
              >
                See the Results
              </button>
            </div>
          </div>
        );

      case 'ACT3_FINAL_REVEAL':
      case 'ACT3_HIGHLIGHTS':
      case 'ACT3_TALLY':
        return (
          <div className="viewport-container flex-center bg-warning-50">
            <div className="card">
              <h1 className="text-2xl font-bold mb-4">Act 3: Finale</h1>
              <p className="text-sm text-neutral-500 mb-4">
                State: {state.currentState}
              </p>
              <p className="text-neutral-600 mb-4">Final reveals coming soon!</p>
              <button
                onClick={() => handleStateTransition('END')}
                className="btn-primary"
              >
                End Game (Debug)
              </button>
            </div>
          </div>
        );

      case 'END':
        return (
          <div className="viewport-container flex-center bg-gradient-to-br from-success-500 to-primary-500">
            <div className="card text-center">
              <h1 className="text-3xl font-bold mb-4">Thanks for Playing!</h1>
              <p className="text-neutral-600 mb-6">
                Session complete. Ready to play again?
              </p>
              <button onClick={handleStartNewGame} className="btn-primary">
                New Game
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="viewport-container flex-center bg-danger-50">
            <div className="card">
              <h1 className="text-2xl font-bold text-danger-600 mb-4">
                Unknown State
              </h1>
              <p className="text-neutral-600 mb-4">
                State: {state.currentState}
              </p>
              <button onClick={handleStartNewGame} className="btn-danger">
                Reset Game
              </button>
            </div>
          </div>
        );
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="game-orchestrator">
      {/* Debug overlay (development only) */}
      {process.env.NODE_ENV === 'development' && state && (
        <div className="debug-overlay">
          State: {state.currentState} | Act: {state.currentAct} | Players:{' '}
          {setup?.players.length}
        </div>
      )}

      {/* Main screen rendering */}
      {renderCurrentScreen()}
    </div>
  );
}

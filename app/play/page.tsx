'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore, useGameStore } from '@/lib/store';
import { buildGameMasterPrompt } from '@/lib/ai/game-master-prompt';
import { sendChatRequest } from '@/lib/ai/client';
import { TemplateRenderer } from '@/components/input-templates';
import { PassToPlayerScreen } from '@/components/PassToPlayerScreen';
import { GameProgressBar } from '@/components/GameProgressBar';
import { TriviaChallengeUI, PersonalityMatchUI, MadLibsUI } from '@/components/mini-games';
import { getEligibleTurnsForPlayer, selectTurnForTrivia } from '@/lib/mini-games';
import type { ChatMessage } from '@/lib/ai/types';
import type { Turn } from '@/lib/types/game-state';
import type { MiniGameResult } from '@/lib/mini-games/types';

type GamePhase = 'pass' | 'question' | 'loading' | 'trivia' | 'personality_match' | 'madlibs';

/**
 * Main Game Play Page
 *
 * Flow:
 * 1. Show "Pass to Player" screen (preload question during this)
 * 2. Player slides to unlock
 * 3. Show question with template
 * 4. Player submits answer
 * 5. Back to "Pass to next Player"
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
    updatePlayerScore,
    startGame,
    isGameComplete,
  } = useGameStore();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);

  // AI conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [aiCommentary, setAiCommentary] = useState<string>('');

  // Loading states
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current turn tracking
  const [currentTurnId, setCurrentTurnId] = useState<string>('');
  const [turnStartTime, setTurnStartTime] = useState<number>(0);

  // Trivia challenge state
  const [triviaSourceTurn, setTriviaSourceTurn] = useState<Turn | null>(null);

  // Personality match state
  const [personalityMatchSubject, setPersonalityMatchSubject] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const currentPlayer = players[currentPlayerIndex];

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
      const triviaEligibleTurns = eligibleTurns.length >= 3
        ? [...new Map(eligibleTurns.map(t => [t.playerId, t])).values()].map(t => ({
            playerId: t.playerId,
            playerName: t.playerName,
            turnId: t.turnId,
          }))
        : undefined;

      // Update system prompt with current game state and trivia eligibility
      const systemPrompt = buildGameMasterPrompt(
        players,
        { gameId, turns, scores, status: 'playing' },
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

      const response = await sendChatRequest(newMessages, {
        toolChoice: 'required', // Force AI to use one of the template tools
      });

      // Parse tool call result (template configuration)
      const templateConfig = JSON.parse(response.text);

      // Check if this is a trivia challenge
      if (templateConfig.templateType === 'trivia_challenge') {
        // Find the source turn for the trivia challenge
        const sourcePlayerId = templateConfig.params?.sourcePlayerId;
        const selectedTurn = sourcePlayerId
          ? eligibleTurns.find(t => t.playerId === sourcePlayerId)
          : selectTurnForTrivia(eligibleTurns);

        if (selectedTurn) {
          setTriviaSourceTurn(selectedTurn);
          setCurrentTemplate(templateConfig);
          setMessages([...newMessages, { role: 'assistant', content: response.text }]);
          return; // Don't create a regular turn for trivia
        }
        // If no valid turn found, fall through to regular question
        console.warn('Trivia challenge requested but no valid source turn found');
      }

      // Check if this is a personality match
      if (templateConfig.templateType === 'personality_match') {
        const subjectPlayerId = templateConfig.params?.subjectPlayerId;
        const subjectPlayerName = templateConfig.params?.subjectPlayerName;

        if (subjectPlayerId && subjectPlayerName) {
          setPersonalityMatchSubject({
            id: subjectPlayerId,
            name: subjectPlayerName,
          });
          setCurrentTemplate(templateConfig);
          setMessages([...newMessages, { role: 'assistant', content: response.text }]);
          return; // Don't create a regular turn for personality match
        }
        // If no valid subject found, fall through to regular question
        console.warn('Personality match requested but no valid subject player found');
      }

      // Check if this is a Mad Libs challenge
      if (templateConfig.templateType === 'madlibs_challenge') {
        setCurrentTemplate(templateConfig);
        setMessages([...newMessages, { role: 'assistant', content: response.text }]);
        return; // Don't create a regular turn for Mad Libs
      }

      // Sanitize prompt - remove player names if AI ignored instructions
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
      setError('Failed to load question. Please try again.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  /**
   * Handle player unlocking the question
   */
  const handleUnlock = () => {
    // Check if this is a trivia challenge
    if (currentTemplate?.templateType === 'trivia_challenge' && triviaSourceTurn) {
      setPhase('trivia');
    } else if (currentTemplate?.templateType === 'personality_match' && personalityMatchSubject) {
      setPhase('personality_match');
    } else if (currentTemplate?.templateType === 'madlibs_challenge') {
      setPhase('madlibs');
    } else {
      setPhase('question');
    }
    setTurnStartTime(Date.now());
  };

  /**
   * Handle trivia challenge completion
   */
  const handleTriviaComplete = (result: { score: number; commentary: string }) => {
    setPhase('loading');
    setAiCommentary(result.commentary);
    setTriviaSourceTurn(null);
    setCurrentTemplate(null);
  };

  /**
   * Handle personality match completion
   */
  const handlePersonalityMatchComplete = (result: MiniGameResult) => {
    setPhase('loading');
    setAiCommentary(result.commentary);
    setPersonalityMatchSubject(null);
    setCurrentTemplate(null);
  };

  /**
   * Handle Mad Libs challenge completion
   */
  const handleMadLibsComplete = (result: MiniGameResult) => {
    setPhase('loading');
    setAiCommentary(result.commentary);
    setCurrentTemplate(null);
  };

  /**
   * Handle player submitting their response
   */
  const handleResponse = async (response: any) => {
    setPhase('loading');

    // Calculate turn duration
    const duration = (Date.now() - turnStartTime) / 1000;

    // Store response in game state
    completeTurn(currentTurnId, response, duration);

    // Award points (can be AI-driven later)
    const basePoints = 10;
    updatePlayerScore(currentPlayer.id, basePoints);

    // Send response to AI for commentary
    try {
      const newMessages: ChatMessage[] = [
        ...messages,
        {
          role: 'user',
          content: `${currentPlayer.name} responded: ${JSON.stringify(response)}. React in MAX 10 WORDS. One killer line only.`,
        },
      ];

      // Use toolChoice: 'none' to prevent AI from accidentally calling tools
      // We only want text commentary here, not a new question
      const aiResponse = await sendChatRequest(newMessages, {
        toolChoice: 'none',
      });
      setAiCommentary(aiResponse.text);
      setMessages([...newMessages, { role: 'assistant', content: aiResponse.text }]);
    } catch (err) {
      console.error('Failed to get AI commentary:', err);
      setAiCommentary('Nice answer! Moving on...');
    }

    // Reset template (but DON'T update player index yet)
    setCurrentTemplate(null);

    // Show commentary with button to continue
    // (phase stays 'loading' to show commentary screen)
  };

  /**
   * Handle advancing to next player after commentary
   */
  const handleContinueToNext = () => {
    // Check if game is complete
    if (isGameComplete()) {
      // TODO: Show end game screen with final scores
      // For now, just show a message
      setAiCommentary('🎉 Game Complete! Thanks for playing!');
      return;
    }

    // NOW move to next player
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    setTurnNumber(turnNumber + 1);

    // Clear commentary and show pass screen
    setAiCommentary('');
    setPhase('pass');

    // Preload next question while showing pass screen, passing the nextIndex explicitly
    loadQuestion(nextIndex);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="glass rounded-xl p-6 border border-alert max-w-md">
          <h2 className="text-alert font-bold text-xl mb-4">Error</h2>
          <p className="text-frost mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadQuestion();
            }}
            className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-3 px-6 rounded-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Initial loading
  if (phase === 'loading' && !currentTemplate && !aiCommentary) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
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

  // Show AI commentary
  if (aiCommentary && phase === 'loading') {
    // Calculate next player (currentPlayerIndex hasn't been updated yet)
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];

    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="glass rounded-xl p-8 border border-glitch max-w-2xl">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-glitch/20 border-2 border-glitch mx-auto flex items-center justify-center">
              <span className="text-3xl">🤖</span>
            </div>
            <p className="text-frost text-lg leading-relaxed">{aiCommentary}</p>
            <div className="pt-4">
              <button
                onClick={handleContinueToNext}
                className="bg-glitch hover:bg-glitch-bright text-frost font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Pass to {nextPlayer.name}
              </button>
            </div>
          </div>
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

  // Question screen
  if (phase === 'question' && currentTemplate) {
    return (
      <div className="min-h-screen bg-void relative">
        {/* Background */}
        <div className="scan-line" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        {/* Header */}
        <div className="relative z-10 p-6 border-b border-steel-800 bg-void/80 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="font-mono text-xs text-steel-500 uppercase tracking-wider">
                Turn {turnNumber}
              </p>
              <h2 className="text-xl font-bold text-frost">{currentPlayer.name}</h2>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-steel-500 uppercase tracking-wider">
                Score
              </p>
              <p className="text-2xl font-black text-glitch">
                {scores[currentPlayer.id] || 0}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-7xl mx-auto">
            <GameProgressBar />
          </div>
        </div>

        {/* Template */}
        <div className="relative z-10">
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

  // Trivia challenge screen
  if (phase === 'trivia' && triviaSourceTurn && currentPlayer) {
    return (
      <TriviaChallengeUI
        targetPlayer={{
          id: currentPlayer.id,
          name: currentPlayer.name,
          role: currentPlayer.role,
        }}
        sourceTurn={triviaSourceTurn}
        allPlayers={players.map(p => ({ id: p.id, name: p.name, role: p.role }))}
        onComplete={handleTriviaComplete}
        onSkip={() => {
          // Skip trivia and move to next player
          setTriviaSourceTurn(null);
          setCurrentTemplate(null);
          handleContinueToNext();
        }}
      />
    );
  }

  // Personality match screen
  if (phase === 'personality_match' && personalityMatchSubject && currentPlayer) {
    // Find the subject player from players array
    const subjectPlayer = players.find(p => p.id === personalityMatchSubject.id);

    if (subjectPlayer) {
      return (
        <PersonalityMatchUI
          targetPlayer={currentPlayer}
          subjectPlayer={subjectPlayer}
          allPlayers={players}
          onComplete={handlePersonalityMatchComplete}
          onSkip={() => {
            // Skip personality match and move to next player
            setPersonalityMatchSubject(null);
            setCurrentTemplate(null);
            handleContinueToNext();
          }}
        />
      );
    }
  }

  // Mad Libs challenge screen
  if (phase === 'madlibs' && currentPlayer) {
    return (
      <MadLibsUI
        targetPlayer={{
          id: currentPlayer.id,
          name: currentPlayer.name,
          role: currentPlayer.role,
        }}
        allPlayers={players.map(p => ({ id: p.id, name: p.name, role: p.role }))}
        onComplete={handleMadLibsComplete}
        onSkip={() => {
          // Skip Mad Libs and move to next player
          setCurrentTemplate(null);
          handleContinueToNext();
        }}
      />
    );
  }

  return null;
}

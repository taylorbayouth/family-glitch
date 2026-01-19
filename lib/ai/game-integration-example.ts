/**
 * Game Integration Example
 *
 * Shows how to integrate the AI Game Master with the input template system
 * for a complete game flow.
 *
 * Note: This file contains examples and may need React imports when used in components.
 */

import { sendChatRequest } from './client';
import { buildGameMasterPrompt, buildFollowUpPrompt } from './game-master-prompt';
import type { ChatMessage } from './types';
import type { Player } from '@/lib/store/player-store';
import type { GameState, Turn } from '@/lib/types/game-state';

// For the React hook example - import in your component instead
// import { useState } from 'react';

/**
 * Example 1: Start a new game
 *
 * This shows how to initialize the AI game master with player data
 * and get the first question/template.
 */
export async function startNewGame(players: Player[]): Promise<{
  templateConfig: any;
  aiMessage: string;
}> {
  // Build system prompt with player data
  const systemPrompt = buildGameMasterPrompt(players);

  // Initial messages
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Start the game and ask the first player a question.' },
  ];

  // Send request - AI will call one of the template tools
  const response = await sendChatRequest(messages);

  // The AI's tool call will return template configuration
  // Parse the tool call result to get the template config
  return {
    templateConfig: JSON.parse(response.text), // Tool returns template config
    aiMessage: response.text,
  };
}

/**
 * Example 2: Continue game with player response
 *
 * After a player responds to a template, send their response to the AI
 * for commentary and to get the next question.
 */
export async function continueGame(
  players: Player[],
  gameState: GameState,
  currentPlayer: Player,
  playerResponse: any,
  conversationHistory: ChatMessage[]
): Promise<{
  commentary: string;
  nextTemplate?: any;
}> {
  // Build follow-up prompt with the player's response
  const followUpPrompt = buildFollowUpPrompt(
    currentPlayer.name,
    playerResponse,
    players
  );

  // Add to conversation history
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: followUpPrompt },
  ];

  // Send request
  const response = await sendChatRequest(messages);

  return {
    commentary: response.text,
    nextTemplate: response.toolCalls?.[0] ? JSON.parse(response.text) : undefined,
  };
}

/**
 * Example 3: Complete game flow with hooks
 *
 * This shows a complete game loop with proper state management.
 */
export class GameSession {
  private players: Player[];
  private gameState: GameState;
  private conversationHistory: ChatMessage[] = [];
  private currentPlayerIndex: number = 0;

  constructor(players: Player[], gameState: GameState) {
    this.players = players;
    this.gameState = gameState;

    // Initialize conversation with system prompt
    const systemPrompt = buildGameMasterPrompt(players, gameState);
    this.conversationHistory.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  /**
   * Get the next question from the AI
   */
  async getNextQuestion(): Promise<{
    templateType: string;
    prompt: string;
    params: any;
  }> {
    const currentPlayer = this.players[this.currentPlayerIndex];

    // Ask AI for next question
    const userMessage: ChatMessage = {
      role: 'user',
      content: `It's ${currentPlayer.name}'s turn. Ask them a question.`,
    };

    this.conversationHistory.push(userMessage);

    // AI will call a template tool
    const response = await sendChatRequest(this.conversationHistory);

    // Tool returns template configuration
    const templateConfig = JSON.parse(response.text);

    // Store AI's message
    this.conversationHistory.push({
      role: 'assistant',
      content: response.text,
    });

    return templateConfig;
  }

  /**
   * Submit player response and get AI commentary
   */
  async submitResponse(response: any): Promise<{
    commentary: string;
    pointsAwarded?: number;
  }> {
    const currentPlayer = this.players[this.currentPlayerIndex];

    // Send player response to AI
    const userMessage: ChatMessage = {
      role: 'user',
      content: buildFollowUpPrompt(currentPlayer.name, response, this.players),
    };

    this.conversationHistory.push(userMessage);

    const aiResponse = await sendChatRequest(this.conversationHistory);

    this.conversationHistory.push({
      role: 'assistant',
      content: aiResponse.text,
    });

    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    return {
      commentary: aiResponse.text,
      pointsAwarded: 10, // Could parse this from AI response
    };
  }

  /**
   * Get conversation history for debugging/logging
   */
  getHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }
}

/**
 * Example 4: React Hook for game flow
 *
 * This shows how to use the game session in a React component.
 * Note: In your actual component, import { useState } from 'react'
 *
 * This is pseudo-code for illustration purposes.
 */
export function useGameSession(players: Player[], gameState: GameState) {
  // const [session] = useState(() => new GameSession(players, gameState));
  // const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  // const [isLoading, setIsLoading] = useState(false);
  // const [commentary, setCommentary] = useState<string>('');

  // Placeholder for example - see app/play/page.tsx for real implementation
  const session = new GameSession(players, gameState);
  const currentTemplate = null;
  const isLoading = false;
  const commentary = '';

  const startTurn = async () => {
    // In real implementation: setIsLoading(true);
    try {
      const template = await session.getNextQuestion();
      // In real implementation: setCurrentTemplate(template);
      return template;
    } catch (error) {
      console.error('Failed to get next question:', error);
    } finally {
      // In real implementation: setIsLoading(false);
    }
  };

  const submitResponse = async (response: any) => {
    // In real implementation: setIsLoading(true);
    try {
      const result = await session.submitResponse(response);
      // In real implementation: setCommentary(result.commentary);

      // Optionally get next question immediately
      const nextTemplate = await session.getNextQuestion();
      // In real implementation: setCurrentTemplate(nextTemplate);
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      // In real implementation: setIsLoading(false);
    }
  };

  return {
    currentPlayer: session.getCurrentPlayer(),
    currentTemplate,
    commentary,
    isLoading,
    startTurn,
    submitResponse,
  };
}

/**
 * Example 5: Simple one-shot API call
 *
 * For testing or simple interactions without maintaining state.
 */
export async function askSingleQuestion(
  players: Player[],
  playerName: string
): Promise<any> {
  const systemPrompt = buildGameMasterPrompt(players);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Ask ${playerName} an interesting question.` },
  ];

  const response = await sendChatRequest(messages);
  return JSON.parse(response.text);
}

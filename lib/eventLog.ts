/**
 * ============================================================================
 * EVENT LOG - Append-Only Game History
 * ============================================================================
 *
 * The event log is a chronological record of everything that happens during
 * a game session. It's append-only (never delete or modify existing events).
 *
 * Key responsibilities:
 * - Record all game events (transitions, answers, scores)
 * - Provide query functions (get events by type, player, act)
 * - Support history compaction for LLM context (recent + summaries)
 * - Enable replay and debugging
 *
 * Design principles:
 * - Immutable (always return new array, never mutate)
 * - Type-safe (TypeScript discriminated unions)
 * - Efficient queries (provide filters, not full scans)
 */

import {
  GameEvent,
  EventLog,
  EventType,
  ActNumber,
  StateTransitionEvent,
  PromptShownEvent,
  AnswerSubmittedEvent,
  ScoreAwardedEvent,
  FactStoredEvent,
  AnswerValue,
  FactCard,
  GameStateType,
} from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// EVENT CREATION HELPERS
// ============================================================================

/**
 * Create a state transition event
 * Called by stateMachine.transition()
 */
export function createStateTransitionEvent(
  stateFrom: GameStateType,
  stateTo: GameStateType,
  actNumber: ActNumber,
  activePlayerId: string | null
): StateTransitionEvent {
  return {
    id: uuidv4(),
    type: 'STATE_TRANSITION',
    timestamp: Date.now(),
    actNumber,
    activePlayerId,
    stateFrom,
    stateTo,
  };
}

/**
 * Create a prompt shown event
 * Called when displaying LLM-generated prompts
 */
export function createPromptShownEvent(
  promptId: string,
  cartridgeId: string | null,
  content: string,
  modality: 'text' | 'image' | 'ascii',
  visibility: 'private' | 'public',
  actNumber: ActNumber,
  activePlayerId: string | null
): PromptShownEvent {
  return {
    id: uuidv4(),
    type: 'PROMPT_SHOWN',
    timestamp: Date.now(),
    actNumber,
    activePlayerId,
    promptId,
    cartridgeId,
    content,
    modality,
    visibility,
  };
}

/**
 * Create an answer submitted event
 * Called when player submits an input
 */
export function createAnswerSubmittedEvent(
  promptId: string,
  answer: AnswerValue,
  visibility: 'private' | 'public',
  timedOut: boolean,
  actNumber: ActNumber,
  activePlayerId: string
): AnswerSubmittedEvent {
  return {
    id: uuidv4(),
    type: 'ANSWER_SUBMITTED',
    timestamp: Date.now(),
    actNumber,
    activePlayerId,
    promptId,
    answer,
    visibility,
    timedOut,
  };
}

/**
 * Create a score awarded event
 * Called when points are given to a player
 */
export function createScoreAwardedEvent(
  playerId: string,
  points: number,
  reason: string,
  scoringDimension: 'correctness' | 'cleverness' | 'humor' | 'bonus',
  judgedBy: string | 'group' | 'auto',
  cartridgeInstanceId: string | null,
  actNumber: ActNumber,
  activePlayerId: string | null
): ScoreAwardedEvent {
  return {
    id: uuidv4(),
    type: 'SCORE_AWARDED',
    timestamp: Date.now(),
    actNumber,
    activePlayerId,
    playerId,
    points,
    reason,
    scoringDimension,
    judgedBy,
    cartridgeInstanceId,
  };
}

/**
 * Create a fact stored event
 * Called when a fact card is added to the DB
 */
export function createFactStoredEvent(
  factId: string,
  fact: FactCard,
  actNumber: ActNumber,
  activePlayerId: string | null
): FactStoredEvent {
  return {
    id: uuidv4(),
    type: 'FACT_STORED',
    timestamp: Date.now(),
    actNumber,
    activePlayerId,
    factId,
    fact,
  };
}

// ============================================================================
// EVENT LOG MANAGEMENT
// ============================================================================

/**
 * Create empty event log
 */
export function createEventLog(sessionId: string): EventLog {
  return {
    sessionId,
    events: [],
  };
}

/**
 * Append an event to the log (immutable)
 *
 * @param log - Current event log
 * @param event - Event to append
 * @returns New event log with event appended
 */
export function appendEvent(log: EventLog, event: GameEvent): EventLog {
  return {
    ...log,
    events: [...log.events, event],
  };
}

/**
 * Append multiple events to the log (immutable)
 *
 * @param log - Current event log
 * @param events - Events to append
 * @returns New event log with events appended
 */
export function appendEvents(log: EventLog, events: GameEvent[]): EventLog {
  return {
    ...log,
    events: [...log.events, ...events],
  };
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all events of a specific type
 *
 * Example: Get all score events to calculate total points
 */
export function getEventsByType(
  log: EventLog,
  type: EventType
): GameEvent[] {
  return log.events.filter((e) => e.type === type);
}

/**
 * Get all events for a specific player
 *
 * Example: Get all of Beth's answers
 */
export function getEventsByPlayer(
  log: EventLog,
  playerId: string
): GameEvent[] {
  return log.events.filter((e) => e.activePlayerId === playerId);
}

/**
 * Get all events in a specific act
 *
 * Example: Get everything that happened in Act 2
 */
export function getEventsByAct(
  log: EventLog,
  actNumber: ActNumber
): GameEvent[] {
  return log.events.filter((e) => e.actNumber === actNumber);
}

/**
 * Get the most recent N events
 *
 * Used for LLM context - we don't send the entire history
 */
export function getRecentEvents(log: EventLog, count: number): GameEvent[] {
  return log.events.slice(-count);
}

/**
 * Get events within a time range
 *
 * @param log - Event log
 * @param startTime - Start timestamp (ms since epoch)
 * @param endTime - End timestamp (ms since epoch)
 */
export function getEventsByTimeRange(
  log: EventLog,
  startTime: number,
  endTime: number
): GameEvent[] {
  return log.events.filter(
    (e) => e.timestamp >= startTime && e.timestamp <= endTime
  );
}

/**
 * Get the last event of a specific type
 *
 * Example: Get the most recent state transition
 */
export function getLastEventOfType(
  log: EventLog,
  type: EventType
): GameEvent | null {
  const events = getEventsByType(log, type);
  return events.length > 0 ? events[events.length - 1] : null;
}

// ============================================================================
// ANALYTICS & AGGREGATIONS
// ============================================================================

/**
 * Count events by type
 * Returns a map of { eventType: count }
 */
export function countEventsByType(log: EventLog): Record<EventType, number> {
  const counts: Partial<Record<EventType, number>> = {};

  log.events.forEach((event) => {
    counts[event.type] = (counts[event.type] || 0) + 1;
  });

  return counts as Record<EventType, number>;
}

/**
 * Calculate total score for a player from the event log
 *
 * This is the authoritative score calculation - the denormalized
 * score in GameState should always match this.
 */
export function calculatePlayerScore(
  log: EventLog,
  playerId: string
): number {
  const scoreEvents = getEventsByType(log, 'SCORE_AWARDED') as ScoreAwardedEvent[];

  return scoreEvents
    .filter((e) => e.playerId === playerId)
    .reduce((total, e) => total + e.points, 0);
}

/**
 * Calculate all player scores
 * Returns a map of { playerId: totalScore }
 */
export function calculateAllScores(
  log: EventLog,
  playerIds: string[]
): Record<string, number> {
  const scores: Record<string, number> = {};

  playerIds.forEach((id) => {
    scores[id] = calculatePlayerScore(log, id);
  });

  return scores;
}

/**
 * Get turn counts for all players
 * Counts how many times each player has been the active player
 */
export function calculateTurnCounts(
  log: EventLog,
  playerIds: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  // Initialize to 0
  playerIds.forEach((id) => {
    counts[id] = 0;
  });

  // Count transitions where each player became active
  const transitions = getEventsByType(log, 'STATE_TRANSITION') as StateTransitionEvent[];

  transitions.forEach((transition) => {
    if (transition.activePlayerId) {
      counts[transition.activePlayerId] =
        (counts[transition.activePlayerId] || 0) + 1;
    }
  });

  return counts;
}

// ============================================================================
// HISTORY COMPACTION FOR LLM CONTEXT
// ============================================================================

/**
 * Compact event log for efficient LLM context
 *
 * Strategy:
 * - Keep recent events (last N) in full detail
 * - Summarize older events by type and count
 * - Total output should be ~500 tokens max
 *
 * @param log - Full event log
 * @param recentCount - How many recent events to keep (default: 10)
 * @returns Compacted event list suitable for LLM context
 */
export function compactHistoryForLLM(
  log: EventLog,
  recentCount: number = 10
): GameEvent[] {
  // If log is short, just return everything
  if (log.events.length <= recentCount) {
    return log.events;
  }

  // Keep last N events
  const recentEvents = getRecentEvents(log, recentCount);

  // For older events, we could create summary events
  // (For now, we just use recent events - this is sufficient for MVP)
  // Future enhancement: Add summary events like "15 facts gathered in Act 1"

  return recentEvents;
}

/**
 * Get summary statistics about the event log
 * Useful for debugging and analytics
 */
export function getEventLogSummary(log: EventLog) {
  const counts = countEventsByType(log);
  const totalEvents = log.events.length;
  const firstEvent = log.events[0];
  const lastEvent = log.events[log.events.length - 1];

  const duration = lastEvent
    ? lastEvent.timestamp - firstEvent.timestamp
    : 0;

  return {
    totalEvents,
    eventCounts: counts,
    duration,
    durationMinutes: Math.round(duration / 60000),
    firstEventTime: firstEvent?.timestamp || null,
    lastEventTime: lastEvent?.timestamp || null,
  };
}

/**
 * ============================================================================
 * SETUP SCREEN - Player Configuration
 * ============================================================================
 *
 * This is the first screen players see when starting a new game.
 * It collects:
 * - Player names
 * - Player ages
 * - Player roles (mom, dad, son, etc.)
 * - Avatar selection
 * - Safety mode (kid-safe vs teen-adult)
 * - Turn order strategy
 *
 * Design requirements:
 * - Mobile-first (easy thumb typing)
 * - Quick presets for common families
 * - Clear validation messages
 * - Fun, welcoming tone
 */

'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  PlayerRole,
  SafetyMode,
  GameSetup,
} from '@/types/game';
import { PLAYERS } from '@/lib/constants';
import { assignTurnOrder, selectFirstPlayer } from '@/lib/turnManager';
import { savePlayerProfiles, loadPlayerProfiles } from '@/lib/persistence';

/**
 * Props for SetupScreen
 */
interface SetupScreenProps {
  /** Callback when setup is complete and game should start */
  onStart: (setup: GameSetup) => void;
}

/**
 * Temporary player data during setup (before creating full Player object)
 */
interface PlayerSetupData {
  name: string;
  age: string; // String during input, converted to number later
  role: PlayerRole;
  avatarId: string;
}

/**
 * Available avatar emojis
 */
const AVATAR_OPTIONS = [
  '😀', '😎', '🤓', '🥳', '😇', '🤠', '🥸', '🤡',
  '👻', '👽', '🤖', '😺', '🐶', '🐼', '🦊', '🐯',
  '🦁', '🐸', '🐵', '🦄',
];

/**
 * Setup Screen Component
 */
export function SetupScreen({ onStart }: SetupScreenProps) {
  // ===========================================================================
  // STATE
  // ===========================================================================

  const [players, setPlayers] = useState<PlayerSetupData[]>([
    { name: '', age: '', role: 'mom', avatarId: AVATAR_OPTIONS[0] },
    { name: '', age: '', role: 'dad', avatarId: AVATAR_OPTIONS[1] },
    { name: '', age: '', role: 'son', avatarId: AVATAR_OPTIONS[2] },
  ]);

  const [safetyMode] = useState<SafetyMode>('teen-adult'); // Always teen-adult mode
  const [turnOrderStrategy, _setTurnOrderStrategy] = useState<
    'clockwise' | 'random-fair'
  >('clockwise');

  const [errors, setErrors] = useState<string[]>([]);

  // ===========================================================================
  // LOAD PLAYER PROFILES ON MOUNT
  // ===========================================================================

  useEffect(() => {
    const savedProfiles = loadPlayerProfiles();
    if (savedProfiles && savedProfiles.length >= PLAYERS.MIN_COUNT) {
      setPlayers(savedProfiles.map(p => ({
        name: p.name,
        age: String(p.age),
        role: p.role as PlayerRole,
        avatarId: p.avatarId,
      })));
    }
  }, []);

  // ===========================================================================
  // PLAYER MANAGEMENT
  // ===========================================================================

  /**
   * Update a player's field
   */
  const updatePlayer = (index: number, field: keyof PlayerSetupData, value: string) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  /**
   * Add a new player slot
   */
  const addPlayer = () => {
    if (players.length >= PLAYERS.MAX_COUNT) return;

    setPlayers((prev) => [
      ...prev,
      {
        name: '',
        age: '',
        role: 'daughter',
        avatarId: AVATAR_OPTIONS[prev.length % AVATAR_OPTIONS.length],
      },
    ]);
  };

  /**
   * Remove a player slot
   */
  const removePlayer = (index: number) => {
    if (players.length <= PLAYERS.MIN_COUNT) return;

    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  /**
   * Validate setup data before starting
   */
  const validate = (): string[] => {
    const errors: string[] = [];

    // Check player count
    if (players.length < PLAYERS.MIN_COUNT) {
      errors.push(`Need at least ${PLAYERS.MIN_COUNT} players`);
    }

    // Validate each player
    players.forEach((player, index) => {
      if (!player.name.trim()) {
        errors.push(`Player ${index + 1} needs a name`);
      }

      const age = parseInt(player.age, 10);
      if (isNaN(age) || age < 1 || age > 120) {
        errors.push(`Player ${index + 1} needs a valid age`);
      }
    });

    // Check for duplicate names
    const names = players.map((p) => p.name.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      errors.push('Each player needs a unique name');
    }

    return errors;
  };

  // ===========================================================================
  // SUBMIT
  // ===========================================================================

  /**
   * Handle form submission
   */
  const handleStart = () => {
    const validationErrors = validate();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Convert setup data to Player objects
    const fullPlayers: Player[] = players.map((p, index) => ({
      id: uuidv4(),
      name: p.name.trim(),
      age: parseInt(p.age, 10),
      role: p.role,
      avatarId: p.avatarId,
      turnOrder: index, // Will be reassigned if random
      currentScore: 0,
    }));

    // Assign turn order
    const playersWithOrder = assignTurnOrder(fullPlayers, turnOrderStrategy);

    // Select first player
    const _firstPlayerId = selectFirstPlayer(playersWithOrder);

    // Save player profiles for next time
    savePlayerProfiles(fullPlayers.map(p => ({
      name: p.name,
      age: p.age,
      role: p.role,
      avatarId: p.avatarId,
    })));

    // Create GameSetup object
    const setup: GameSetup = {
      players: playersWithOrder,
      safetyMode,
      turnOrderStrategy,
      createdAt: Date.now(),
      sessionId: uuidv4(),
    };

    // Start the game!
    onStart(setup);
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="viewport-container bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-down">
            <h1 className="text-5xl font-bold text-white mb-4 glitch">
              FAMILY GLITCH
            </h1>
            <p className="text-primary-100 text-lg">
              A pass-and-play game powered by AI
            </p>
          </div>

          {/* Setup Card */}
          <div className="card animate-slide-up">
            <h2 className="text-2xl font-bold mb-6">Who's Playing?</h2>

            {/* Player inputs */}
            <div className="space-y-4 mb-6">
              {players.map((player, index) => (
                <div key={index} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="space-y-3">
                    {/* Name and Age row */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Name"
                        value={player.name}
                        onChange={(e) =>
                          updatePlayer(index, 'name', e.target.value)
                        }
                        className="input flex-1"
                        maxLength={20}
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        value={player.age}
                        onChange={(e) =>
                          updatePlayer(index, 'age', e.target.value)
                        }
                        className="input w-16 text-center"
                        min="1"
                        max="120"
                      />
                    </div>

                    {/* Avatar and Role row */}
                    <div className="flex gap-2 items-center">
                      <select
                        value={player.avatarId}
                        onChange={(e) =>
                          updatePlayer(index, 'avatarId', e.target.value)
                        }
                        className="input w-14 text-2xl text-center p-2"
                      >
                        {AVATAR_OPTIONS.map((emoji) => (
                          <option key={emoji} value={emoji}>
                            {emoji}
                          </option>
                        ))}
                      </select>
                      <select
                        value={player.role}
                        onChange={(e) =>
                          updatePlayer(index, 'role', e.target.value as PlayerRole)
                        }
                        className="input flex-1"
                      >
                        <option value="mom">Mom</option>
                        <option value="dad">Dad</option>
                        <option value="daughter">Daughter</option>
                        <option value="son">Son</option>
                        <option value="brother">Brother</option>
                        <option value="sister">Sister</option>
                        <option value="grandma">Grandma</option>
                        <option value="grandpa">Grandpa</option>
                        <option value="aunt">Aunt</option>
                        <option value="uncle">Uncle</option>
                        <option value="cousin">Cousin</option>
                        <option value="friend">Friend</option>
                      </select>
                      {/* Remove button inline */}
                      {players.length > PLAYERS.MIN_COUNT && (
                        <button
                          onClick={() => removePlayer(index)}
                          className="btn-ghost text-danger-500 p-2"
                          title="Remove player"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add player button */}
            {players.length < PLAYERS.MAX_COUNT && (
              <button onClick={addPlayer} className="btn-outline w-full mb-6">
                + Add Player
              </button>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-danger-50 border border-danger-300 rounded-lg p-4 mb-6">
                <p className="font-semibold text-danger-700 mb-2">
                  Please fix these issues:
                </p>
                <ul className="list-disc list-inside text-sm text-danger-600">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Start button */}
            <button onClick={handleStart} className="btn-primary w-full text-lg">
              Start Game
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-primary-100 text-sm mt-6">
            15-20 minute game • Best with food and drinks
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Token Savings Demonstration
 *
 * Run this to see how much we save by sanitizing data for AI
 */

import { compressIds, stripTimestamps, sanitizeForAI } from './sanitize';

// Example turn data from a real game
const exampleTurn = {
  turnId: '550e8400-e29b-41d4-a716-446655440000',
  playerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  playerName: 'Taylor',
  templateType: 'tpl_text_area',
  timestamp: '2026-01-21T10:30:45.123Z',
  prompt: 'What show are you binging right now?',
  templateParams: { label: 'Your answer', maxLength: 200 },
  response: { text: 'The Last of Us' },
  score: 5,
  status: 'completed',
};

// Before: Full JSON
const before = JSON.stringify(exampleTurn);
console.log('BEFORE SANITIZATION:');
console.log(before);
console.log(`Length: ${before.length} chars\n`);

// After: Sanitized
const after = sanitizeForAI(exampleTurn);
console.log('AFTER SANITIZATION:');
console.log(after);
console.log(`Length: ${after.length} chars\n`);

// Savings
const saved = before.length - after.length;
const percent = ((saved / before.length) * 100).toFixed(1);
console.log(`SAVINGS: ${saved} chars (${percent}% reduction)`);

// For a 30-turn game, multiply savings by 30
console.log(`\nFor 30-turn game: ~${saved * 30} chars saved (~${(saved * 30 * 0.00025).toFixed(2)} tokens)`);

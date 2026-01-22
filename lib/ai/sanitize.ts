/**
 * Data Sanitization for AI Prompts
 *
 * Removes ONLY the verbose elements that waste tokens without helping the AI:
 * - Long UUIDs (36 chars → 4 chars)
 * - ISO timestamps (24 chars → removed, AI doesn't need exact times)
 *
 * Keeps all intrinsic game data: templateType, scores, templateParams, responses, etc.
 */

/**
 * UUID pattern: matches standard UUIDs like "550e8400-e29b-41d4-a716-446655440000"
 */
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * ISO timestamp pattern: matches "2026-01-21T10:30:45.123Z"
 */
const ISO_TIMESTAMP_PATTERN = /"timestamp":\s*"[^"]+"/g;

/**
 * Compresses UUIDs in JSON/text to short placeholders
 * 36 chars → ~4 chars, keeping first 4 for debugging
 *
 * Example:
 *   Input:  "playerId": "550e8400-e29b-41d4-a716-446655440000"
 *   Output: "playerId": "550e"
 */
export function compressIds(text: string): string {
  return text.replace(UUID_PATTERN, (match) => match.slice(0, 4));
}

/**
 * Strips timestamp fields from JSON strings
 * AI doesn't need exact datetimes - turn order is what matters
 *
 * Example:
 *   Input:  {"playerId":"abc","timestamp":"2026-01-21T10:30:45.123Z"}
 *   Output: {"playerId":"abc"}
 */
export function stripTimestamps(text: string): string {
  return text
    .replace(ISO_TIMESTAMP_PATTERN, '')
    // Clean up double commas
    .replace(/,\s*,/g, ',')
    // Clean up trailing commas after removed fields
    .replace(/,(\s*[}\]])/g, '$1')
    // Clean up leading commas
    .replace(/([[{]\s*),/g, '$1');
}

/**
 * Full sanitization: compress IDs + strip timestamps
 * Use this when stringifying game data for AI prompts
 */
export function sanitizeForAI(obj: any): string {
  let json = JSON.stringify(obj);
  json = compressIds(json);
  json = stripTimestamps(json);
  return json;
}

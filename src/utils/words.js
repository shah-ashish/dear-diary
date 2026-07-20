/**
 * words.js — Character counting & cap enforcement
 *
 * The 1200-character-per-page cap is enforced at the application layer.
 * These utilities handle counting, limiting, and edge cases.
 */

const DEFAULT_CHAR_LIMIT = 1200

/**
 * Count the number of characters in a text string.
 * @param {string} text
 * @returns {number}
 */
export function countChars(text) {
  if (!text || typeof text !== 'string') return 0
  return text.length
}

/**
 * Check if the text has reached or exceeded the character limit.
 * @param {string} text
 * @param {number} limit - default 1200
 * @returns {boolean}
 */
export function isAtCharLimit(text, limit = DEFAULT_CHAR_LIMIT) {
  return countChars(text) >= limit
}

/**
 * Get remaining characters available before hitting the limit.
 * @param {string} text
 * @param {number} limit - default 1200
 * @returns {number} remaining chars (min 0)
 */
export function getRemainingChars(text, limit = DEFAULT_CHAR_LIMIT) {
  return Math.max(0, limit - countChars(text))
}

/**
 * Truncate text to a maximum character count.
 * Used when the user pastes text that exceeds the limit.
 * @param {string} text
 * @param {number} limit - default 1200
 * @returns {string} truncated text
 */
export function truncateToCharLimit(text, limit = DEFAULT_CHAR_LIMIT) {
  if (!text || typeof text !== 'string') return ''
  if (text.length <= limit) return text
  return text.slice(0, limit)
}

/** The default character limit per page */
export const CHAR_LIMIT = DEFAULT_CHAR_LIMIT

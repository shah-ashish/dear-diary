/**
 * date.js — Date utilities (native Date only, no libraries)
 *
 * All date logic uses the device's local timezone.
 * "Today" rolls over at local midnight.
 */

/**
 * Get today's date as 'YYYY-MM-DD' in local timezone.
 * @returns {string}
 */
export function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if a date string is today.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export function isToday(dateStr) {
  return dateStr === getToday()
}

/**
 * Format a 'YYYY-MM-DD' string into a human-readable display format.
 * Example: '2026-07-21' → 'Monday, 21 July 2026'
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string}
 */
export function formatDisplayDate(dateStr) {
  // Parse as local date (noon to avoid any timezone edge cases)
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format a 'YYYY-MM-DD' string into a short display format.
 * Example: '2026-07-21' → 'Jul 21, 2026'
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string}
 */
export function formatShortDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Get the day-of-week name for a date.
 * Example: '2026-07-21' → 'Monday'
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string}
 */
export function getDayName(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)

  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

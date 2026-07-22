/**
 * storage.js — Storage adapter (Capacitor SQLite implementation)
 *
 * Implements the database access layer using Capacitor SQLite.
 * All functions are asynchronous and use parameterized queries.
 * Writes automatically trigger saveToStore on Web fallbacks.
 */

import { getDB, saveDatabaseToStore } from './sqliteInit'

// ─── Entries API ────────────────────────────────────────────────

/**
 * Get all unique dates that have at least one entry page.
 * Returns array of date strings sorted newest-first.
 * @returns {Promise<string[]>}
 */
export async function getAllEntryDates() {
  try {
    const db = getDB()
    const res = await db.query(`
      SELECT DISTINCT entry_date 
      FROM entries 
      WHERE TRIM(content) != '' 
      ORDER BY entry_date DESC
    `)
    return (res.values || []).map((row) => row.entry_date)
  } catch (err) {
    console.error('Error in getAllEntryDates:', err)
    return []
  }
}

/**
 * Get all entries with preview text and page count (for Home list).
 * @returns {Promise<Array<{date: string, preview: string, pageCount: number}>>}
 */
export async function getAllEntriesWithPreview() {
  try {
    const db = getDB()
    
    // 1. Get list of dates newest first
    const dates = await getAllEntryDates()
    if (dates.length === 0) return []

    // 2. Query all pages for these dates to compute page count and previews
    const placeholders = dates.map(() => '?').join(',')
    const res = await db.query(`
      SELECT entry_date, page_number, content
      FROM entries
      WHERE entry_date IN (${placeholders})
      ORDER BY entry_date DESC, page_number ASC
    `, dates)

    // Group pages by date
    const grouped = {}
    for (const row of (res.values || [])) {
      if (!grouped[row.entry_date]) {
        grouped[row.entry_date] = []
      }
      grouped[row.entry_date].push(row)
    }

    // Map to list view schema
    return dates.map((date) => {
      const pages = grouped[date] || []
      const firstPage = pages.find((p) => p.page_number === 1) || pages[0]
      const preview = firstPage ? firstPage.content.slice(0, 100).trim() : ''
      return {
        date,
        preview,
        pageCount: pages.length,
      }
    })
  } catch (err) {
    console.error('Error in getAllEntriesWithPreview:', err)
    return []
  }
}

/**
 * Get all pages for a specific date, ordered by page_number.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {Promise<Array<{page_number: number, content: string, word_count: number, created_at: string, updated_at: string}>>}
 */
export async function getEntryByDate(dateStr) {
  try {
    const db = getDB()
    const res = await db.query(
      'SELECT page_number, content, word_count, created_at, updated_at FROM entries WHERE entry_date = ? ORDER BY page_number ASC',
      [dateStr]
    )
    return res.values || []
  } catch (err) {
    console.error('Error in getEntryByDate:', err)
    return []
  }
}

/**
 * Save (create or update) a single page for a date.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {number} pageNumber - 1-indexed
 * @param {string} content - page text content
 * @param {number} wordCount - pre-computed character count
 * @returns {Promise<void>}
 */
export async function savePage(dateStr, pageNumber, content, wordCount) {
  try {
    const db = getDB()
    const now = new Date().toISOString()

    // Check if page already exists to preserve created_at
    const existing = await db.query(
      'SELECT created_at FROM entries WHERE entry_date = ? AND page_number = ?',
      [dateStr, pageNumber]
    )

    const createdAt = existing.values && existing.values.length > 0
      ? existing.values[0].created_at
      : now

    await db.run(`
      INSERT OR REPLACE INTO entries (entry_date, page_number, content, word_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [dateStr, pageNumber, content, wordCount, createdAt, now])

    await saveDatabaseToStore()
  } catch (err) {
    console.error('Error in savePage:', err)
    throw err
  }
}

/**
 * Save all pages for a date at once (bulk save).
 * Replaces all existing pages for that date.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {Array<{page_number: number, content: string, word_count: number}>} pages
 * @returns {Promise<void>}
 */
export async function saveAllPages(dateStr, pages) {
  try {
    const db = getDB()
    const now = new Date().toISOString()

    // 1. Fetch existing timestamps to preserve created_at where possible
    const existing = await db.query(
      'SELECT page_number, created_at FROM entries WHERE entry_date = ?',
      [dateStr]
    )
    const timeMap = {}
    for (const row of (existing.values || [])) {
      timeMap[row.page_number] = row.created_at
    }

    // 2. Delete all existing pages for this date
    await db.run('DELETE FROM entries WHERE entry_date = ?', [dateStr])

    // 3. Insert new page list
    for (const page of pages) {
      const createdAt = timeMap[page.page_number] || now
      await db.run(`
        INSERT INTO entries (entry_date, page_number, content, word_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [dateStr, page.page_number, page.content, page.word_count, createdAt, now])
    }

    await saveDatabaseToStore()
  } catch (err) {
    console.error('Error in saveAllPages:', err)
    throw err
  }
}

/**
 * Delete all pages for a date (entire entry).
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {Promise<void>}
 */
export async function deleteEntry(dateStr) {
  try {
    const db = getDB()
    await db.run('DELETE FROM entries WHERE entry_date = ?', [dateStr])
    await saveDatabaseToStore()
  } catch (err) {
    console.error('Error in deleteEntry:', err)
    throw err
  }
}

// ─── Settings API ───────────────────────────────────────────────

/**
 * Get a setting value.
 * @param {string} key - setting name
 * @param {*} defaultValue - returned if key doesn't exist
 * @returns {Promise<*>}
 */
export async function getSetting(key, defaultValue = null) {
  try {
    const db = getDB()
    const res = await db.query('SELECT value FROM settings WHERE key = ?', [key])
    if (res.values && res.values.length > 0) {
      return JSON.parse(res.values[0].value)
    }
    return defaultValue
  } catch (err) {
    console.error('Error in getSetting:', err)
    return defaultValue
  }
}

/**
 * Set a setting value.
 * @param {string} key - setting name
 * @param {*} value - value to store
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  try {
    const db = getDB()
    const serialized = JSON.stringify(value)
    await db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, serialized]
    )
    await saveDatabaseToStore()
  } catch (err) {
    console.error('Error in setSetting:', err)
    throw err
  }
}

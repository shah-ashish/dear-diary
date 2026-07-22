/**
 * useEntries — React hook wrapping the storage layer
 *
 * Provides reactive state for entries + settings, and functions
 * to create/read/delete entries. All storage calls go through
 * db/storage.js — which handles the SQLite connection.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAllEntryDates,
  getAllEntriesWithPreview,
  getEntryByDate,
  savePage,
  saveAllPages,
  deleteEntry as storageDeleteEntry,
  getSetting,
  setSetting,
} from '../db/storage'
import { getToday } from '../utils/date'
import { countChars } from '../utils/words'
import { applyTheme } from '../utils/theme'
import { FONTS, loadFont } from '../utils/fonts'
import { isLockEnabled, setLockConfig, removeLockConfig } from '../utils/security'

export default function useEntries() {
  // List of all dates that have entries (newest first)
  const [entryDates, setEntryDates] = useState([])

  // Entries with preview text for Home list
  const [entryPreviews, setEntryPreviews] = useState([])

  // Pages for the currently loaded entry (for write or read screens)
  const [currentPages, setCurrentPages] = useState([])

  // Settings
  const [showDelete, setShowDeleteState] = useState(false)
  const [diaryName, setDiaryName] = useState('Dear Diary')
  const [writingFont, setWritingFont] = useState('special-elite')
  const [themeMode, setThemeMode] = useState('light')

  // Passcode Lock State
  const [lockEnabled, setLockEnabled] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  // Storage error state
  const [storageError, setStorageError] = useState(null)
  const clearStorageError = useCallback(() => setStorageError(null), [])

  // ─── Entry Dates & Previews Refreshers ──────────────────────

  const refreshEntryDates = useCallback(async () => {
    const dates = await getAllEntryDates()
    setEntryDates(dates)
  }, [])

  const refreshEntryPreviews = useCallback(async () => {
    const previews = await getAllEntriesWithPreview()
    setEntryPreviews(previews)
  }, [])

  // ─── Load on mount (async safe) ─────────────────────────────

  useEffect(() => {
    const initData = async () => {
      await refreshEntryDates()
      await refreshEntryPreviews()
      const showDel = await getSetting('showDelete', false)
      setShowDeleteState(showDel)

      // Load custom settings
      const name = await getSetting('diaryName', 'Dear Diary')
      setDiaryName(name)

      const fontId = await getSetting('writingFont', 'special-elite')
      setWritingFont(fontId)
      const font = FONTS.find(f => f.id === fontId)
      if (font) await loadFont(font)

      const theme = await getSetting('themeMode', 'light')
      setThemeMode(theme)
      applyTheme(theme)

      // Passcode lock initialization
      const locked = await isLockEnabled()
      setLockEnabled(locked)
      if (locked) {
        setIsLocked(true)
      }
    }
    initData()
  }, [refreshEntryDates, refreshEntryPreviews])

  // ─── Load Entry (for reading or editing) ────────────────────

  const loadEntry = useCallback(async (dateStr) => {
    const pages = await getEntryByDate(dateStr)
    setCurrentPages(pages)
    return pages
  }, [])

  // ─── Load Today's Entry (for Write screen) ──────────────────

  const loadTodayEntry = useCallback(async () => {
    const today = getToday()
    const pages = await getEntryByDate(today)
    if (pages.length === 0) {
      // Initialize with a blank first page
      const blank = [
        { page_number: 1, content: '', word_count: 0 },
      ]
      setCurrentPages(blank)
      return blank
    }
    setCurrentPages(pages)
    return pages
  }, [])

  // ─── Save a single page ─────────────────────────────────────

  const savePageContent = useCallback(
    async (dateStr, pageNumber, content) => {
      try {
        setStorageError(null)
        const wc = countChars(content)
        await savePage(dateStr, pageNumber, content, wc)
        await refreshEntryDates()
        await refreshEntryPreviews()
      } catch (err) {
        console.error('Failed to save page:', err)
        setStorageError('Failed to save entry page.')
        throw err
      }
    },
    [refreshEntryDates, refreshEntryPreviews]
  )

  // ─── Save all pages at once (bulk, for Write screen) ────────

  const saveAllPageContents = useCallback(
    async (dateStr, pages) => {
      try {
        setStorageError(null)
        const pagesWithCounts = pages.map((p) => ({
          page_number: p.page_number,
          content: p.content,
          word_count: countChars(p.content),
        }))
        await saveAllPages(dateStr, pagesWithCounts)
        await refreshEntryDates()
        await refreshEntryPreviews()
      } catch (err) {
        console.error('Failed to save entry pages:', err)
        setStorageError('Failed to save diary entry. Please check storage space.')
        throw err
      }
    },
    [refreshEntryDates, refreshEntryPreviews]
  )

  // ─── Delete entry (all pages for a date) ────────────────────

  const removeEntry = useCallback(
    async (dateStr) => {
      try {
        setStorageError(null)
        await storageDeleteEntry(dateStr)
        setCurrentPages([])
        await refreshEntryDates()
        await refreshEntryPreviews()
      } catch (err) {
        console.error('Failed to delete entry:', err)
        setStorageError('Failed to delete diary entry.')
        throw err
      }
    },
    [refreshEntryDates, refreshEntryPreviews]
  )

  // ─── Settings ───────────────────────────────────────────────

  const toggleShowDelete = useCallback(async () => {
    try {
      const current = await getSetting('showDelete', false)
      const next = !current
      await setSetting('showDelete', next)
      setShowDeleteState(next)
    } catch (err) {
      console.error('Failed to toggle delete setting:', err)
      setStorageError('Failed to save setting.')
    }
  }, [])

  const updateDiaryName = useCallback(async (name) => {
    try {
      const trimmed = (name || '').trim() || 'Dear Diary'
      await setSetting('diaryName', trimmed)
      setDiaryName(trimmed)
    } catch (err) {
      console.error('Failed to update diary name:', err)
      setStorageError('Failed to save diary name.')
    }
  }, [])

  const updateWritingFont = useCallback(async (fontId) => {
    try {
      const font = FONTS.find(f => f.id === fontId)
      if (!font) return
      await loadFont(font)
      await setSetting('writingFont', fontId)
      setWritingFont(fontId)
    } catch (err) {
      console.error('Failed to update font:', err)
      setStorageError('Failed to save font setting.')
    }
  }, [])

  const updateThemeMode = useCallback(async (mode) => {
    try {
      await setSetting('themeMode', mode)
      setThemeMode(mode)
      applyTheme(mode)
    } catch (err) {
      console.error('Failed to update theme mode:', err)
      setStorageError('Failed to save theme setting.')
    }
  }, [])

  // ─── Passcode Lock Actions ──────────────────────────────────

  const enableLock = useCallback(async (pin, question, answer) => {
    try {
      await setLockConfig(pin, question, answer)
      setLockEnabled(true)
    } catch (err) {
      console.error('Failed to enable lock:', err)
      setStorageError('Failed to save passcode lock settings.')
    }
  }, [])

  const disableLock = useCallback(async () => {
    try {
      await removeLockConfig()
      setLockEnabled(false)
      setIsLocked(false)
    } catch (err) {
      console.error('Failed to disable lock:', err)
      setStorageError('Failed to remove passcode lock.')
    }
  }, [])

  const unlockApp = useCallback(() => {
    setIsLocked(false)
  }, [])

  const lockApp = useCallback(() => {
    if (lockEnabled) {
      setIsLocked(true)
    }
  }, [lockEnabled])

  // ─── Return ─────────────────────────────────────────────────

  return {
    // State
    entryDates,
    entryPreviews,
    currentPages,
    showDelete,
    diaryName,
    writingFont,
    themeMode,
    lockEnabled,
    isLocked,
    storageError,

    // Actions
    clearStorageError,
    refreshEntryDates,
    refreshEntryPreviews,
    loadEntry,
    loadTodayEntry,
    savePageContent,
    saveAllPageContents,
    removeEntry,
    toggleShowDelete,
    updateDiaryName,
    updateWritingFont,
    updateThemeMode,
    enableLock,
    disableLock,
    unlockApp,
    lockApp,
  }
}


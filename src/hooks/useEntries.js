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
      const wc = countChars(content)
      await savePage(dateStr, pageNumber, content, wc)
      await refreshEntryDates()
      await refreshEntryPreviews()
    },
    [refreshEntryDates, refreshEntryPreviews]
  )

  // ─── Save all pages at once (bulk, for Write screen) ────────

  const saveAllPageContents = useCallback(
    async (dateStr, pages) => {
      const pagesWithCounts = pages.map((p) => ({
        page_number: p.page_number,
        content: p.content,
        word_count: countChars(p.content),
      }))
      await saveAllPages(dateStr, pagesWithCounts)
      await refreshEntryDates()
      await refreshEntryPreviews()
    },
    [refreshEntryDates, refreshEntryPreviews]
  )

  // ─── Delete entry (all pages for a date) ────────────────────

  const removeEntry = useCallback(
    async (dateStr) => {
      await storageDeleteEntry(dateStr)
      setCurrentPages([])
      await refreshEntryDates()
      await refreshEntryPreviews()
    },
    [refreshEntryDates, refreshEntryPreviews]
  )

  // ─── Settings ───────────────────────────────────────────────

  const toggleShowDelete = useCallback(async () => {
    const current = await getSetting('showDelete', false)
    const next = !current
    await setSetting('showDelete', next)
    setShowDeleteState(next)
  }, [])

  const updateDiaryName = useCallback(async (name) => {
    const trimmed = (name || '').trim() || 'Dear Diary'
    await setSetting('diaryName', trimmed)
    setDiaryName(trimmed)
  }, [])

  const updateWritingFont = useCallback(async (fontId) => {
    const font = FONTS.find(f => f.id === fontId)
    if (!font) return
    await loadFont(font)
    await setSetting('writingFont', fontId)
    setWritingFont(fontId)
  }, [])

  const updateThemeMode = useCallback(async (mode) => {
    await setSetting('themeMode', mode)
    setThemeMode(mode)
    applyTheme(mode)
  }, [])

  // ─── Passcode Lock Actions ──────────────────────────────────

  const enableLock = useCallback(async (pin, question, answer) => {
    await setLockConfig(pin, question, answer)
    setLockEnabled(true)
  }, [])

  const disableLock = useCallback(async () => {
    await removeLockConfig()
    setLockEnabled(false)
    setIsLocked(false)
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

    // Actions
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

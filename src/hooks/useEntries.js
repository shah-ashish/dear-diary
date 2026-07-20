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

export default function useEntries() {
  // List of all dates that have entries (newest first)
  const [entryDates, setEntryDates] = useState([])

  // Entries with preview text for Home list
  const [entryPreviews, setEntryPreviews] = useState([])

  // Pages for the currently loaded entry (for write or read screens)
  const [currentPages, setCurrentPages] = useState([])

  // Settings
  const [showDelete, setShowDeleteState] = useState(false)

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

  // ─── Return ─────────────────────────────────────────────────

  return {
    // State
    entryDates,       // string[] — sorted newest first
    entryPreviews,    // {date, preview, pageCount}[] — for Home list
    currentPages,     // page objects for loaded entry
    showDelete,       // boolean — settings toggle

    // Actions
    refreshEntryDates,
    refreshEntryPreviews,
    loadEntry,
    loadTodayEntry,
    savePageContent,
    saveAllPageContents,
    removeEntry,
    toggleShowDelete,
  }
}

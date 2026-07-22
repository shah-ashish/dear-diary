import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAllEntryDates,
  getAllEntriesWithPreview,
  getEntryByDate,
  savePage,
  saveAllPages,
  deleteEntry,
  getSetting,
  setSetting,
} from './storage'
import { getDB, saveDatabaseToStore } from './sqliteInit'

const mockDb = {
  query: vi.fn(),
  run: vi.fn(),
  execute: vi.fn(),
}

vi.mock('./sqliteInit', () => ({
  getDB: () => mockDb,
  saveDatabaseToStore: vi.fn(() => Promise.resolve()),
}))

describe('storage.js — Storage Adapter Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllEntryDates', () => {
    it('should return sorted unique entry dates', async () => {
      mockDb.query.mockResolvedValueOnce({
        values: [
          { entry_date: '2026-07-22' },
          { entry_date: '2026-07-21' },
        ],
      })

      const dates = await getAllEntryDates()
      expect(dates).toEqual(['2026-07-22', '2026-07-21'])
      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('SELECT DISTINCT entry_date'))
    })

    it('should return empty array on failure', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('DB Query Error'))
      const dates = await getAllEntryDates()
      expect(dates).toEqual([])
    })
  })

  describe('getAllEntriesWithPreview', () => {
    it('should return formatted entry previews', async () => {
      // First, mock getAllEntryDates returning dates
      mockDb.query.mockResolvedValueOnce({
        values: [
          { entry_date: '2026-07-22' },
          { entry_date: '2026-07-21' },
        ],
      })
      // Next, mock pages query
      mockDb.query.mockResolvedValueOnce({
        values: [
          { entry_date: '2026-07-22', page_number: 1, content: 'Today is a great day.' },
          { entry_date: '2026-07-21', page_number: 1, content: 'Yesterday was good.' },
        ],
      })

      const previews = await getAllEntriesWithPreview()
      expect(previews).toEqual([
        { date: '2026-07-22', preview: 'Today is a great day.', pageCount: 1 },
        { date: '2026-07-21', preview: 'Yesterday was good.', pageCount: 1 },
      ])
    })

    it('should return empty array if no dates exist', async () => {
      mockDb.query.mockResolvedValueOnce({ values: [] })
      const previews = await getAllEntriesWithPreview()
      expect(previews).toEqual([])
    })
  })

  describe('getEntryByDate', () => {
    it('should return sorted pages for a date', async () => {
      const mockPages = [
        { page_number: 1, content: 'Page 1 text' },
        { page_number: 2, content: 'Page 2 text' },
      ]
      mockDb.query.mockResolvedValueOnce({ values: mockPages })

      const pages = await getEntryByDate('2026-07-22')
      expect(pages).toEqual(mockPages)
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE entry_date = ?'),
        ['2026-07-22']
      )
    })
  })

  describe('savePage', () => {
    it('should insert or replace a single page and save db', async () => {
      mockDb.query.mockResolvedValueOnce({ values: [] }) // No existing page
      mockDb.run.mockResolvedValueOnce({ changes: 1 })

      await savePage('2026-07-22', 1, 'My content', 10)

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO entries'),
        expect.arrayContaining(['2026-07-22', 1, 'My content', 10])
      )
      expect(saveDatabaseToStore).toHaveBeenCalled()
    })

    it('should propagate errors to caller on failure', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Write lock error'))
      await expect(savePage('2026-07-22', 1, 'My content', 10)).rejects.toThrow('Write lock error')
    })
  })

  describe('saveAllPages', () => {
    it('should delete existing and insert all new pages', async () => {
      mockDb.query.mockResolvedValueOnce({ values: [] }) // No existing timestamps
      mockDb.run.mockResolvedValue({ changes: 1 }) // delete and inserts

      const pagesToSave = [
        { page_number: 1, content: 'Content A', word_count: 9 },
        { page_number: 2, content: 'Content B', word_count: 9 },
      ]

      await saveAllPages('2026-07-22', pagesToSave)

      expect(mockDb.run).toHaveBeenNthCalledWith(1, 'DELETE FROM entries WHERE entry_date = ?', ['2026-07-22'])
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO entries'),
        expect.arrayContaining(['2026-07-22', 1, 'Content A', 9])
      )
      expect(saveDatabaseToStore).toHaveBeenCalled()
    })
  })

  describe('deleteEntry', () => {
    it('should run delete query and trigger save', async () => {
      mockDb.run.mockResolvedValueOnce({ changes: 1 })

      await deleteEntry('2026-07-22')

      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM entries WHERE entry_date = ?', ['2026-07-22'])
      expect(saveDatabaseToStore).toHaveBeenCalled()
    })
  })

  describe('Settings API', () => {
    it('should get a setting value if it exists', async () => {
      mockDb.query.mockResolvedValueOnce({
        values: [{ value: JSON.stringify({ mySetting: true }) }],
      })

      const value = await getSetting('someKey', { fallback: true })
      expect(value).toEqual({ mySetting: true })
    })

    it('should return default value if setting does not exist', async () => {
      mockDb.query.mockResolvedValueOnce({ values: [] })

      const value = await getSetting('nonExistentKey', 'defaultValue')
      expect(value).toBe('defaultValue')
    })

    it('should set a setting value', async () => {
      mockDb.run.mockResolvedValueOnce({ changes: 1 })

      await setSetting('someKey', { mySetting: true })

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO settings'),
        ['someKey', JSON.stringify({ mySetting: true })]
      )
      expect(saveDatabaseToStore).toHaveBeenCalled()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportAllEntries } from './exportDiary'
import { getAllEntryDates, getEntryByDate } from '../db/storage'
import { Filesystem } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

vi.mock('../db/storage', () => ({
  getAllEntryDates: vi.fn(),
  getEntryByDate: vi.fn(),
}))

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn(() => Promise.resolve()),
    mkdir: vi.fn(() => Promise.resolve()),
    stat: vi.fn(),
    requestPermissions: vi.fn(() => Promise.resolve()),
  },
  Directory: {
    ExternalStorage: 'ExternalStorage',
    Documents: 'Documents',
  },
  Encoding: {
    UTF8: 'utf8',
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(),
  },
}))

describe('exportDiary.js — Export Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset global DOM mocks
    global.document = undefined
    global.URL = undefined
  })

  it('should return empty result if no entry dates exist', async () => {
    getAllEntryDates.mockResolvedValueOnce([])
    const result = await exportAllEntries()
    expect(result).toEqual({ exported: 0, skipped: 0, total: 0 })
  })

  describe('Android Platform Export', () => {
    beforeEach(() => {
      Capacitor.getPlatform.mockReturnValue('android')
    })

    it('should export pages and request storage permissions', async () => {
      getAllEntryDates.mockResolvedValueOnce(['2026-07-22'])
      getEntryByDate.mockResolvedValueOnce([
        { page_number: 1, content: 'Page content' },
      ])
      // File does not exist yet
      Filesystem.stat.mockRejectedValueOnce(new Error('File not found'))

      const result = await exportAllEntries()

      expect(Filesystem.requestPermissions).toHaveBeenCalled()
      expect(Filesystem.mkdir).toHaveBeenCalledWith(expect.objectContaining({
        path: 'DearDiary/2026-07-22',
        directory: 'ExternalStorage',
      }))
      expect(Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({
        path: 'DearDiary/2026-07-22/page_1.txt',
        directory: 'ExternalStorage',
      }))
      expect(result).toEqual({ exported: 1, skipped: 0, total: 1 })
    })

    it('should skip pages if they already exist on disk (incremental)', async () => {
      getAllEntryDates.mockResolvedValueOnce(['2026-07-22'])
      getEntryByDate.mockResolvedValueOnce([
        { page_number: 1, content: 'Page content' },
      ])
      // File already exists
      Filesystem.stat.mockResolvedValueOnce({ size: 100 })

      const result = await exportAllEntries()

      expect(Filesystem.writeFile).not.toHaveBeenCalled()
      expect(result).toEqual({ exported: 0, skipped: 1, total: 1 })
    })
  })

  describe('Web Platform Export', () => {
    beforeEach(() => {
      Capacitor.getPlatform.mockReturnValue('web')
      // Set up DOM mock for web download trigger
      global.document = {
        createElement: vi.fn(() => ({
          click: vi.fn(),
          setAttribute: vi.fn(),
          href: '',
          download: '',
        })),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      }
      global.URL = {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      }
    })

    it('should trigger browser zip download', async () => {
      getAllEntryDates.mockResolvedValueOnce(['2026-07-22'])
      getEntryByDate.mockResolvedValueOnce([
        { page_number: 1, content: 'Page content' },
      ])

      const result = await exportAllEntries()

      expect(global.document.createElement).toHaveBeenCalledWith('a')
      expect(global.document.body.appendChild).toHaveBeenCalled()
      expect(result).toEqual({ exported: 1, skipped: 0, total: 1 })
    })
  })
})

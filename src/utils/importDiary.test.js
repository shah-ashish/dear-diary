import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importAllEntries } from './importDiary'
import { getEntryByDate, savePage } from '../db/storage'
import { Filesystem } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

vi.mock('../db/storage', () => ({
  getEntryByDate: vi.fn(),
  savePage: vi.fn(() => Promise.resolve()),
}))

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readdir: vi.fn(),
    readFile: vi.fn(),
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

vi.mock('jszip', () => {
  return {
    default: {
      loadAsync: vi.fn(() => Promise.resolve({
        files: {
          'DearDiary/2026-07-22/page_1.txt': {
            dir: false,
            async: vi.fn(() => Promise.resolve('Dear Diary — 2026-07-22\nPage 1\n────────────────────────────────────────\n\nWeb zip imported content')),
          },
        },
      })),
    },
  }
})

describe('importDiary.js — Import Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Android Platform Import', () => {
    beforeEach(() => {
      Capacitor.getPlatform.mockReturnValue('android')
    })

    it('should read files from ExternalStorage and save them to DB', async () => {
      // Mock root directory listing (folders YYYY-MM-DD)
      Filesystem.readdir.mockResolvedValueOnce({
        files: [{ name: '2026-07-22', type: 'directory' }],
      })
      // Mock subdirectory listing (files page_N.txt)
      Filesystem.readdir.mockResolvedValueOnce({
        files: [{ name: 'page_1.txt', type: 'file' }],
      })
      // Mock target page existing check -> does not exist
      getEntryByDate.mockResolvedValueOnce([])
      // Mock readFile
      Filesystem.readFile.mockResolvedValueOnce({
        data: 'Dear Diary — 2026-07-22\nPage 1\n────────────────────────────────────────\n\nImported file content',
      })

      const result = await importAllEntries()

      expect(Filesystem.requestPermissions).toHaveBeenCalled()
      expect(getEntryByDate).toHaveBeenCalledWith('2026-07-22')
      expect(savePage).toHaveBeenCalledWith('2026-07-22', 1, 'Imported file content', 21)
      expect(result).toEqual({ imported: 1, skipped: 0, total: 1 })
    })

    it('should skip file if page content already exists (incremental)', async () => {
      Filesystem.readdir.mockResolvedValueOnce({
        files: [{ name: '2026-07-22', type: 'directory' }],
      })
      Filesystem.readdir.mockResolvedValueOnce({
        files: [{ name: 'page_1.txt', type: 'file' }],
      })
      // Page already exists in DB
      getEntryByDate.mockResolvedValueOnce([{ page_number: 1, content: 'Existing text' }])

      const result = await importAllEntries()

      expect(Filesystem.readFile).not.toHaveBeenCalled()
      expect(savePage).not.toHaveBeenCalled()
      expect(result).toEqual({ imported: 0, skipped: 1, total: 1 })
    })
  })

  describe('Web Platform Import', () => {
    beforeEach(() => {
      Capacitor.getPlatform.mockReturnValue('web')
    })

    it('should import from selected files (.txt)', async () => {
      const mockFile = {
        name: '2026-07-22_page_1.txt',
        text: vi.fn().mockResolvedValue('Dear Diary — 2026-07-22\nPage 1\n────────────────────────────────────────\n\nIndividual file content'),
      }
      getEntryByDate.mockResolvedValueOnce([])

      const result = await importAllEntries(() => {}, [mockFile])

      expect(savePage).toHaveBeenCalledWith('2026-07-22', 1, 'Individual file content', 23)
      expect(result).toEqual({ imported: 1, skipped: 0, total: 1 })
    })

    it('should import from selected zip archive', async () => {
      const mockZipFile = {
        name: 'DearDiary_backup.zip',
      }
      getEntryByDate.mockResolvedValueOnce([])

      const result = await importAllEntries(() => {}, [mockZipFile])

      expect(savePage).toHaveBeenCalledWith('2026-07-22', 1, 'Web zip imported content', 24)
      expect(result).toEqual({ imported: 1, skipped: 0, total: 1 })
    })
  })
})

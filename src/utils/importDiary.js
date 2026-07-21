/**
 * importDiary.js — Import/restore diary entries from device storage or uploaded files
 *
 * Reads .txt files from Documents/DearDiary/<date>/page_N.txt (Android)
 * or uploaded files/zip (Web), and inserts missing pages into SQLite database.
 */

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { getEntryByDate, savePage } from '../db/storage'
import { countChars } from './words'

const EXPORT_FOLDER = 'DearDiary'

/**
 * Import all diary entries.
 * @param {(current: number, total: number, status: string) => void} onProgress
 * @param {FileList|File[]} [webFiles] - files selected via input[type=file] on web
 * @returns {Promise<{imported: number, skipped: number, total: number}>}
 */
export async function importAllEntries(onProgress = () => {}, webFiles = null) {
  const platform = Capacitor.getPlatform()

  if (platform === 'web') {
    return await importFromWebFiles(webFiles, onProgress)
  } else {
    return await importFromFilesystem(onProgress)
  }
}

// ─── Android: Read from Documents/DearDiary/ ────────────────────

async function importFromFilesystem(onProgress) {
  let imported = 0
  let skipped = 0
  let totalProcessed = 0

  onProgress(0, 0, 'Scanning DearDiary folder...')

  try {
    const rootRes = await Filesystem.readdir({
      path: EXPORT_FOLDER,
      directory: Directory.Documents,
    })

    const dateFolders = (rootRes.files || []).filter(
      (f) => f.type === 'directory' || f.name.match(/^\d{4}-\d{2}-\d{2}$/)
    )

    if (dateFolders.length === 0) {
      onProgress(0, 0, 'No DearDiary backup folder found.')
      return { imported: 0, skipped: 0, total: 0 }
    }

    // Collect all file tasks
    const tasks = []
    for (const folder of dateFolders) {
      const dateStr = folder.name
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue

      try {
        const pagesRes = await Filesystem.readdir({
          path: `${EXPORT_FOLDER}/${dateStr}`,
          directory: Directory.Documents,
        })

        const pageFiles = (pagesRes.files || []).filter((f) =>
          f.name.startsWith('page_') && f.name.endsWith('.txt')
        )

        for (const file of pageFiles) {
          const match = file.name.match(/^page_(\d+)\.txt$/)
          if (match) {
            const pageNum = parseInt(match[1], 10)
            tasks.push({ dateStr, pageNum, path: `${EXPORT_FOLDER}/${dateStr}/${file.name}` })
          }
        }
      } catch (err) {
        console.warn(`Could not read folder ${dateStr}:`, err)
      }
    }

    const total = tasks.length
    for (let i = 0; i < total; i++) {
      const task = tasks[i]
      onProgress(i + 1, total, `Importing ${task.dateStr} page ${task.pageNum}...`)

      // Check if page already exists
      const existingPages = await getEntryByDate(task.dateStr)
      const exists = existingPages.some((p) => p.page_number === task.pageNum && p.content.trim() !== '')

      if (exists) {
        skipped++
      } else {
        const fileRes = await Filesystem.readFile({
          path: task.path,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        })

        const rawContent = fileRes.data || ''
        const content = extractPageContent(rawContent)

        if (content.trim()) {
          const charCount = countChars(content)
          await savePage(task.dateStr, task.pageNum, content, charCount)
          imported++
        } else {
          skipped++
        }
      }
      totalProcessed++
    }

    onProgress(total, total, 'Import complete!')
    return { imported, skipped, total: totalProcessed }
  } catch (err) {
    console.error('Import failed:', err)
    onProgress(0, 0, 'DearDiary folder not found or unreadable.')
    return { imported: 0, skipped: 0, total: 0 }
  }
}

// ─── Web: Import from selected Files or Zip ────────────────────

async function importFromWebFiles(files, onProgress) {
  if (!files || files.length === 0) {
    return { imported: 0, skipped: 0, total: 0 }
  }

  let imported = 0
  let skipped = 0
  let totalProcessed = 0

  const fileList = Array.from(files)
  const zipFile = fileList.find((f) => f.name.endsWith('.zip'))

  if (zipFile) {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(zipFile)
    const entries = Object.keys(zip.files).filter(
      (path) => !zip.files[path].dir && path.endsWith('.txt')
    )

    const total = entries.length
    for (let i = 0; i < total; i++) {
      const path = entries[i]
      const match = path.match(/(\d{4}-\d{2}-\d{2})[/\\]page_(\d+)\.txt$/)
      if (match) {
        const [, dateStr, pageNumStr] = match
        const pageNum = parseInt(pageNumStr, 10)

        onProgress(i + 1, total, `Importing ${dateStr} page ${pageNum}...`)

        const existingPages = await getEntryByDate(dateStr)
        const exists = existingPages.some((p) => p.page_number === pageNum && p.content.trim() !== '')

        if (exists) {
          skipped++
        } else {
          const rawContent = await zip.files[path].async('string')
          const content = extractPageContent(rawContent)
          if (content.trim()) {
            await savePage(dateStr, pageNum, content, countChars(content))
            imported++
          } else {
            skipped++
          }
        }
        totalProcessed++
      }
    }
  } else {
    // Standard text files selection
    const txtFiles = fileList.filter((f) => f.name.endsWith('.txt'))
    const total = txtFiles.length

    for (let i = 0; i < total; i++) {
      const file = txtFiles[i]
      const rawContent = await file.text()
      const match = file.name.match(/(\d{4}-\d{2}-\d{2})_page_(\d+)\.txt$/) ||
                    rawContent.match(/Dear Diary — (\d{4}-\d{2}-\d{2})\nPage (\d+)/)

      if (match) {
        const [, dateStr, pageNumStr] = match
        const pageNum = parseInt(pageNumStr, 10)

        onProgress(i + 1, total, `Importing ${dateStr} page ${pageNum}...`)

        const existingPages = await getEntryByDate(dateStr)
        const exists = existingPages.some((p) => p.page_number === pageNum && p.content.trim() !== '')

        if (exists) {
          skipped++
        } else {
          const content = extractPageContent(rawContent)
          if (content.trim()) {
            await savePage(dateStr, pageNum, content, countChars(content))
            imported++
          } else {
            skipped++
          }
        }
        totalProcessed++
      }
    }
  }

  onProgress(totalProcessed, totalProcessed, 'Import complete!')
  return { imported, skipped, total: totalProcessed }
}

/**
 * Strip header line generated by export if present.
 * Format:
 * Dear Diary — YYYY-MM-DD
 * Page N
 * ────────────────────────────────────────
 *
 * <content>
 */
function extractPageContent(raw) {
  const parts = raw.split(/─{10,}\n\n/)
  if (parts.length > 1) {
    return parts.slice(1).join('─{10,}\n\n')
  }
  return raw
}

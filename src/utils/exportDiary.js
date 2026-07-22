/**
 * exportDiary.js — Export diary entries to device storage or zip download
 *
 * On Android (Capacitor): writes .txt files to ExternalStorage/DearDiary/<date>/page_N.txt
 * On Web (browser): creates a .zip file and triggers browser download
 *
 * Incremental: skips files that already exist on Android.
 */

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { getAllEntryDates, getEntryByDate } from '../db/storage'

const EXPORT_FOLDER = 'DearDiary'

/**
 * Export all diary entries.
 * @param {(current: number, total: number, status: string) => void} onProgress
 * @returns {Promise<{exported: number, skipped: number, total: number}>}
 */
export async function exportAllEntries(onProgress = () => {}) {
  // 1. Fetch all dates and all pages
  const dates = await getAllEntryDates()
  if (dates.length === 0) {
    return { exported: 0, skipped: 0, total: 0 }
  }

  // Collect all pages across all dates
  const allEntries = []
  for (const date of dates) {
    const pages = await getEntryByDate(date)
    for (const page of pages) {
      allEntries.push({ date, ...page })
    }
  }

  const total = allEntries.length
  const platform = Capacitor.getPlatform()

  if (platform === 'web') {
    return await exportAsZip(allEntries, total, onProgress)
  } else {
    if (typeof Filesystem.requestPermissions === 'function') {
      try {
        await Filesystem.requestPermissions()
      } catch (err) {
        console.warn('Storage permission request failed:', err)
      }
    }
    return await exportToFilesystem(allEntries, total, onProgress)
  }
}

// ─── Android: Write to ExternalStorage/DearDiary/ ──────────────────

async function exportToFilesystem(allEntries, total, onProgress) {
  let exported = 0
  let skipped = 0

  // Ensure root folder exists
  await mkdirSafe(EXPORT_FOLDER)

  for (let i = 0; i < allEntries.length; i++) {
    const entry = allEntries[i]
    const dateFolderPath = `${EXPORT_FOLDER}/${entry.date}`
    const filePath = `${dateFolderPath}/page_${entry.page_number}.txt`

    onProgress(i + 1, total, `Exporting ${entry.date} page ${entry.page_number}...`)

    // Ensure date subfolder exists
    await mkdirSafe(dateFolderPath)

    // Check if file already exists (incremental skip)
    const exists = await fileExists(filePath)
    if (exists) {
      skipped++
      continue
    }

    // Write the page content
    const fileContent = buildPageContent(entry.date, entry.page_number, entry.content)
    await Filesystem.writeFile({
      path: filePath,
      data: fileContent,
      directory: Directory.ExternalStorage,
      encoding: Encoding.UTF8,
    })

    exported++
  }

  onProgress(total, total, 'Export complete!')
  return { exported, skipped, total }
}

// ─── Web: Download as .zip ───────────────────────────────────────

async function exportAsZip(allEntries, total, onProgress) {
  // Dynamic import to avoid bundling JSZip when not needed on Android
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  let exported = 0

  for (let i = 0; i < allEntries.length; i++) {
    const entry = allEntries[i]
    onProgress(i + 1, total, `Preparing ${entry.date} page ${entry.page_number}...`)

    const fileContent = buildPageContent(entry.date, entry.page_number, entry.content)
    zip.file(`${EXPORT_FOLDER}/${entry.date}/page_${entry.page_number}.txt`, fileContent)
    exported++
  }

  onProgress(total, total, 'Creating zip file...')

  // Generate zip blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `DearDiary_export_${new Date().toISOString().slice(0, 10)}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  onProgress(total, total, 'Export complete!')
  return { exported, skipped: 0, total }
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Build the text content for an exported page file.
 */
function buildPageContent(date, pageNumber, content) {
  return `Dear Diary — ${date}\nPage ${pageNumber}\n${'─'.repeat(40)}\n\n${content}\n`
}

/**
 * Create a directory if it doesn't already exist (Android only).
 */
async function mkdirSafe(path) {
  try {
    await Filesystem.mkdir({
      path,
      directory: Directory.ExternalStorage,
      recursive: true,
    })
  } catch (e) {
    // Directory already exists — that's fine
    if (!e.message?.includes('exists')) {
      console.warn('mkdir warning:', e.message)
    }
  }
}

/**
 * Check if a file exists at the given path (Android only).
 */
async function fileExists(path) {
  try {
    await Filesystem.stat({
      path,
      directory: Directory.ExternalStorage,
    })
    return true
  } catch {
    return false
  }
}


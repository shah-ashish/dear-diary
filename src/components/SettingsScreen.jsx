/**
 * SettingsScreen — App settings page
 *
 * Features:
 * - "Show delete option on Home" toggle (default OFF)
 * - "Download All Entries" export button with progress
 * Persisted via useEntries hook (SQLite settings table).
 */

import { useState } from 'react'
import logo from '../assets/logo.png'
import { exportAllEntries } from '../utils/exportDiary'

export default function SettingsScreen({ showDelete, onToggleDelete }) {
  const [exportStatus, setExportStatus] = useState('idle') // 'idle' | 'exporting' | 'done' | 'error'
  const [exportProgress, setExportProgress] = useState('')
  const [exportResult, setExportResult] = useState(null) // { exported, skipped, total }

  const handleExport = async () => {
    setExportStatus('exporting')
    setExportProgress('Preparing export...')
    setExportResult(null)

    try {
      const result = await exportAllEntries((current, total, status) => {
        setExportProgress(status)
      })

      setExportResult(result)
      setExportStatus('done')

      // Reset status after 5 seconds
      setTimeout(() => {
        setExportStatus('idle')
        setExportProgress('')
      }, 5000)
    } catch (err) {
      console.error('Export failed:', err)
      setExportStatus('error')
      setExportProgress(`Export failed: ${err.message || 'Unknown error'}`)

      setTimeout(() => {
        setExportStatus('idle')
        setExportProgress('')
      }, 5000)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 shrink-0">
        <img src={logo} alt="Dear Diary" className="w-10 h-10 drop-shadow-sm animate-pulse" />
        <div>
          <h1 className="font-serif text-xl text-ink font-semibold leading-tight tracking-wide">
            Settings
          </h1>
          <p className="font-serif text-[11px] text-ink-light italic leading-tight mt-0.5">
            Customize your diary
          </p>
        </div>
      </header>

      {/* ── Divider ── */}
      <div className="mx-5 border-b border-paper-line shrink-0" />

      {/* ── Settings List (Only content scrolls) ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* ── Delete toggle ── */}
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 pr-4">
            <p className="font-serif text-sm text-ink font-medium leading-tight">
              Show delete option on Home
            </p>
            <p className="font-serif text-xs text-ink-light mt-1 leading-relaxed">
              When enabled, a delete icon appears next to past entries on the Home screen.
            </p>
          </div>

          {/* Toggle switch */}
          <button
            id="toggle-delete"
            onClick={onToggleDelete}
            role="switch"
            aria-checked={showDelete}
            className={`
              relative inline-flex items-center shrink-0
              w-11 h-6 rounded-full cursor-pointer border-none
              transition-colors duration-200 ease-in-out
              ${showDelete ? 'bg-accent shadow-inner' : 'bg-paper-dark'}
            `}
          >
            <span
              className="inline-block w-5 h-5 rounded-full bg-paper shadow-md transition-transform duration-200 ease-in-out"
              style={{
                transform: showDelete ? 'translateX(22px)' : 'translateX(2px)',
              }}
            />
          </button>
        </div>

        <div className="border-b border-paper-line/60" />

        {/* ── Download / Export ── */}
        <div className="py-4">
          <p className="font-serif text-sm text-ink font-medium leading-tight">
            Download All Entries
          </p>
          <p className="font-serif text-xs text-ink-light mt-1 leading-relaxed">
            Export all diary entries as text files to your device. Existing files won't be overwritten.
          </p>

          {/* Download button */}
          <button
            id="export-btn"
            onClick={handleExport}
            disabled={exportStatus === 'exporting'}
            className={`
              mt-3 w-full py-2.5 rounded-lg font-serif text-sm font-semibold
              border cursor-pointer transition-all duration-200
              flex items-center justify-center gap-2
              ${exportStatus === 'exporting'
                ? 'bg-paper-dark/50 text-ink-light border-paper-line cursor-not-allowed'
                : 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20 active:scale-[0.98]'
              }
            `}
          >
            {exportStatus === 'exporting' ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                {/* Download icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </>
            )}
          </button>

          {/* Progress / Result status */}
          {exportProgress && (
            <p className={`font-serif text-xs mt-2 leading-relaxed ${
              exportStatus === 'error' ? 'text-accent' :
              exportStatus === 'done' ? 'text-green-700' :
              'text-ink-light'
            }`}>
              {exportProgress}
            </p>
          )}

          {/* Result summary */}
          {exportResult && exportStatus === 'done' && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
              <p className="font-serif text-xs text-green-800">
                ✓ {exportResult.exported} page{exportResult.exported !== 1 ? 's' : ''} exported
                {exportResult.skipped > 0 && (
                  <span className="text-green-600">
                    {' '}· {exportResult.skipped} already existed
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="border-b border-paper-line/60" />
      </div>

      {/* ── App Info ── */}
      <div className="shrink-0 px-5 py-6 text-center border-t border-paper-line/20 bg-paper/50">
        <p className="font-serif text-[10px] text-ink-faint">
          Dear Diary — Your personal, offline notebook
        </p>
        <p className="font-serif text-[10px] text-ink-faint mt-0.5">
          All data stays on your device. No cloud. No accounts.
        </p>
      </div>
    </div>
  )
}

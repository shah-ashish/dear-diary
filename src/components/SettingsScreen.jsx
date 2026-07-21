/**
 * SettingsScreen — App settings & customization page
 *
 * Features:
 * - Custom Diary Name editor
 * - Writing Font selector
 * - Theme Mode toggle (Light / Dark / System)
 * - "Show delete option on Home" toggle
 * - "Download All Entries" export button (gold gradient)
 * - "Import Entries" restore button (gold gradient)
 */

import { useState, useRef } from 'react'
import logo from '../assets/logo.png'
import { exportAllEntries } from '../utils/exportDiary'
import { importAllEntries } from '../utils/importDiary'
import { FONTS } from '../utils/fonts'
import { THEMES } from '../utils/theme'
import PinSetupModal from './PinSetupModal'

export default function SettingsScreen({
  showDelete,
  onToggleDelete,
  diaryName,
  onUpdateDiaryName,
  writingFont,
  onUpdateWritingFont,
  themeMode,
  onUpdateThemeMode,
  onEntriesImported,
  lockEnabled,
  onEnableLock,
  onDisableLock,
}) {
  const [showPinSetup, setShowPinSetup] = useState(false)
  // ─── Export State ───
  const [exportStatus, setExportStatus] = useState('idle') // 'idle' | 'exporting' | 'done' | 'error'
  const [exportProgress, setExportProgress] = useState('')
  const [exportResult, setExportResult] = useState(null)

  // ─── Import State ───
  const [importStatus, setImportStatus] = useState('idle') // 'idle' | 'importing' | 'done' | 'error'
  const [importProgress, setImportProgress] = useState('')
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  // ─── Diary Name Editing State ───
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(diaryName || 'Dear Diary')

  // ─── Handlers ───
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

  const handleImportClick = () => {
    // If on web browser, trigger file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      runImport()
    }
  }

  const handleFileChange = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await runImport(files)
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const runImport = async (webFiles = null) => {
    setImportStatus('importing')
    setImportProgress('Scanning for backup entries...')
    setImportResult(null)

    try {
      const result = await importAllEntries((current, total, status) => {
        setImportProgress(status)
      }, webFiles)

      setImportResult(result)
      setImportStatus('done')
      if (onEntriesImported) await onEntriesImported()

      setTimeout(() => {
        setImportStatus('idle')
        setImportProgress('')
      }, 5000)
    } catch (err) {
      console.error('Import failed:', err)
      setImportStatus('error')
      setImportProgress(`Import failed: ${err.message || 'Unknown error'}`)
      setTimeout(() => {
        setImportStatus('idle')
        setImportProgress('')
      }, 5000)
    }
  }

  const handleSaveName = () => {
    onUpdateDiaryName(nameInput)
    setIsEditingName(false)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-paper text-ink">
      {/* Hidden file input for web import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".zip,.txt"
        multiple
        className="hidden"
      />

      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 shrink-0">
        <img src={logo} alt="Logo" className="w-10 h-10 drop-shadow-sm" />
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

      {/* ── Settings List ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

        {/* ── 1. Custom Diary Name ── */}
        <div>
          <p className="font-serif text-xs uppercase tracking-wider text-ink-light font-bold mb-2">
            Diary Title
          </p>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="flex-1 px-3 py-2 rounded-lg bg-paper-dark/60 border border-paper-line font-serif text-sm text-ink outline-none"
                placeholder="Enter diary title..."
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-2 rounded-lg bg-accent text-white font-serif text-xs font-semibold border-none cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setNameInput(diaryName)
                setIsEditingName(true)
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-paper-dark/40 border border-paper-line/50 cursor-pointer hover:bg-paper-dark/60 transition-all"
            >
              <span className="font-serif text-sm font-semibold text-ink">
                {diaryName || 'Dear Diary'}
              </span>
              <span className="text-xs text-ink-light italic flex items-center gap-1">
                Edit ✏️
              </span>
            </div>
          )}
        </div>

        <div className="border-b border-paper-line/60" />

        {/* ── 2. Theme Mode ── */}
        <div>
          <p className="font-serif text-xs uppercase tracking-wider text-ink-light font-bold mb-2">
            Theme Mode
          </p>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-paper-dark/40 border border-paper-line/50">
            {THEMES.map((theme) => {
              const isActive = themeMode === theme.id
              return (
                <button
                  key={theme.id}
                  onClick={() => onUpdateThemeMode(theme.id)}
                  className={`
                    py-2 px-3 rounded-lg font-serif text-xs font-medium
                    flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none
                    ${isActive
                      ? 'bg-paper text-ink shadow-sm font-bold'
                      : 'text-ink-light bg-transparent hover:text-ink'
                    }
                  `}
                >
                  <span>{theme.icon}</span>
                  <span>{theme.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-b border-paper-line/60" />

        {/* ── Passcode Lock ── */}
        <div>
          <div className="flex items-center justify-between py-1">
            <div className="flex-1 pr-4">
              <p className="font-serif text-sm text-ink font-medium leading-tight flex items-center gap-1.5">
                <span>🔒 Passcode Lock</span>
                {lockEnabled && (
                  <span className="text-[10px] bg-green-500/15 text-green-700 font-bold px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </p>
              <p className="font-serif text-xs text-ink-light mt-1 leading-relaxed">
                Protect your diary entries with a 4-digit PIN lock.
              </p>
            </div>

            {/* Toggle lock */}
            <button
              id="toggle-lock"
              onClick={() => {
                if (lockEnabled) {
                  onDisableLock()
                } else {
                  setShowPinSetup(true)
                }
              }}
              role="switch"
              aria-checked={lockEnabled}
              className={`
                relative inline-flex items-center shrink-0
                w-11 h-6 rounded-full cursor-pointer border-none
                transition-colors duration-200 ease-in-out
                ${lockEnabled ? 'bg-accent shadow-inner' : 'bg-paper-dark'}
              `}
            >
              <span
                className="inline-block w-5 h-5 rounded-full bg-paper shadow-md transition-transform duration-200 ease-in-out"
                style={{
                  transform: lockEnabled ? 'translateX(22px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {lockEnabled && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setShowPinSetup(true)}
                className="font-serif text-xs text-accent font-medium hover:underline cursor-pointer border-none bg-transparent"
              >
                Change PIN or Security Question
              </button>
            </div>
          )}
        </div>

        <div className="border-b border-paper-line/60" />

        {/* ── 3. Writing Font ── */}
        <div>
          <p className="font-serif text-xs uppercase tracking-wider text-ink-light font-bold mb-2">
            Writing Font
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map((font) => {
              const isActive = writingFont === font.id
              return (
                <button
                  key={font.id}
                  onClick={() => onUpdateWritingFont(font.id)}
                  className={`
                    p-3 rounded-xl text-left border transition-all cursor-pointer
                    ${isActive
                      ? 'bg-paper-dark/80 border-accent text-accent font-semibold shadow-sm'
                      : 'bg-paper-dark/30 border-paper-line/50 text-ink-light hover:bg-paper-dark/50'
                    }
                  `}
                >
                  <p className="text-[11px] opacity-75 font-serif mb-1">{font.name}</p>
                  <p className="text-sm truncate" style={{ fontFamily: font.family }}>
                    The quick brown fox
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-b border-paper-line/60" />

        {/* ── 4. Delete Toggle ── */}
        <div className="flex items-center justify-between py-1">
          <div className="flex-1 pr-4">
            <p className="font-serif text-sm text-ink font-medium leading-tight">
              Show delete option on Home
            </p>
            <p className="font-serif text-xs text-ink-light mt-1 leading-relaxed">
              When enabled, a delete icon appears next to past entries on the Home screen.
            </p>
          </div>

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

        {/* ── 5. Download All Entries (Gold Gradient) ── */}
        <div>
          <p className="font-serif text-sm text-ink font-medium leading-tight">
            Download All Entries
          </p>
          <p className="font-serif text-xs text-ink-light mt-1 leading-relaxed">
            Export all diary entries as text files to your device. Existing files won't be overwritten.
          </p>

          <button
            id="export-btn"
            onClick={handleExport}
            disabled={exportStatus === 'exporting'}
            className={`
              mt-3 w-full py-3 rounded-xl font-serif text-sm font-bold
              border-none cursor-pointer transition-all duration-200
              flex items-center justify-center gap-2 uppercase tracking-wider
              ${exportStatus === 'exporting'
                ? 'bg-paper-dark/50 text-ink-light cursor-not-allowed'
                : 'text-white hover:brightness-110 active:scale-[0.98] shadow-md'
              }
            `}
            style={exportStatus !== 'exporting' ? {
              background: 'linear-gradient(135deg, #C9A96E 0%, #A07D3A 50%, #8B6914 100%)',
            } : undefined}
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </>
            )}
          </button>

          {exportProgress && (
            <p className={`font-serif text-xs mt-2 leading-relaxed ${
              exportStatus === 'error' ? 'text-accent' :
              exportStatus === 'done' ? 'text-green-700' :
              'text-ink-light'
            }`}>
              {exportProgress}
            </p>
          )}

          {exportResult && exportStatus === 'done' && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="font-serif text-xs text-green-700 font-medium">
                ✓ {exportResult.exported} page{exportResult.exported !== 1 ? 's' : ''} exported
                {exportResult.skipped > 0 && (
                  <span className="opacity-80"> · {exportResult.skipped} already existed</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="border-b border-paper-line/60" />

        {/* ── 6. Import / Restore Entries (Gold Gradient) ── */}
        <div>
          <p className="font-serif text-sm text-ink font-medium leading-tight">
            Import Entries
          </p>
          <p className="font-serif text-xs text-ink-light mt-1 leading-relaxed">
            Restore diary entries from your device's DearDiary backup folder.
          </p>

          <button
            id="import-btn"
            onClick={handleImportClick}
            disabled={importStatus === 'importing'}
            className={`
              mt-3 w-full py-3 rounded-xl font-serif text-sm font-bold
              border-none cursor-pointer transition-all duration-200
              flex items-center justify-center gap-2 uppercase tracking-wider
              ${importStatus === 'importing'
                ? 'bg-paper-dark/50 text-ink-light cursor-not-allowed'
                : 'text-white hover:brightness-110 active:scale-[0.98] shadow-md'
              }
            `}
            style={importStatus !== 'importing' ? {
              background: 'linear-gradient(135deg, #A07D3A 0%, #8B6914 50%, #684F0D 100%)',
            } : undefined}
          >
            {importStatus === 'importing' ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import
              </>
            )}
          </button>

          {importProgress && (
            <p className={`font-serif text-xs mt-2 leading-relaxed ${
              importStatus === 'error' ? 'text-accent' :
              importStatus === 'done' ? 'text-green-700' :
              'text-ink-light'
            }`}>
              {importProgress}
            </p>
          )}

          {importResult && importStatus === 'done' && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="font-serif text-xs text-green-700 font-medium">
                ✓ {importResult.imported} page{importResult.imported !== 1 ? 's' : ''} imported
                {importResult.skipped > 0 && (
                  <span className="opacity-80"> · {importResult.skipped} already in app</span>
                )}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 px-5 py-6 text-center border-t border-paper-line/20 bg-paper/50">
        <p className="font-serif text-[10px] text-ink-faint">
          {diaryName || 'Dear Diary'} — v2.0.0
        </p>
        <p className="font-serif text-[10px] text-ink-faint mt-0.5">
          All data stays on your device. No cloud. No accounts.
        </p>
      </div>

      {/* ── PIN Setup Modal ── */}
      {showPinSetup && (
        <PinSetupModal
          onSave={async (pin, question, answer) => {
            await onEnableLock(pin, question, answer)
            setShowPinSetup(false)
          }}
          onCancel={() => setShowPinSetup(false)}
        />
      )}
    </div>
  )
}

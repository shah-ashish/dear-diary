/**
 * SettingsScreen — App settings page
 *
 * Currently has a single toggle:
 * "Show delete option on Home" — default OFF.
 * Persisted via useEntries hook (localStorage).
 */

import logo from '../assets/logo.png'

export default function SettingsScreen({ showDelete, onToggleDelete }) {
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
        {/* Delete toggle */}
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

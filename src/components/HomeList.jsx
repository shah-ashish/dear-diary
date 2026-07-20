/**
 * HomeList — Entry list screen (Home tab)
 *
 * Shows all diary entries sorted newest-first.
 * Empty state when no entries exist.
 * Header with logo + app name.
 */

import logo from '../assets/logo.png'
import HomeEntryRow from './HomeEntryRow'

export default function HomeList({ entryPreviews, showDelete, onEntryTap, onDelete }) {
  const hasEntries = entryPreviews.length > 0

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 shrink-0">
        <img src={logo} alt="Dear Diary" className="w-10 h-10 drop-shadow-sm" />
        <div>
          <h1 className="font-serif text-xl text-ink font-semibold leading-tight tracking-wide">
            Dear Diary
          </h1>
          <p className="font-serif text-[11px] text-ink-light italic leading-tight mt-0.5">
            Your personal, offline notebook
          </p>
        </div>
      </header>

      {/* ── Divider ── */}
      <div className="mx-5 border-b border-paper-line shrink-0" />

      {/* ── Entry List (Only content scrolls) ── */}
      {hasEntries ? (
        <div className="flex-1 overflow-y-auto pb-4">
          {entryPreviews.map((entry) => (
            <HomeEntryRow
              key={entry.date}
              date={entry.date}
              preview={entry.preview}
              pageCount={entry.pageCount}
              showDelete={showDelete}
              onTap={onEntryTap}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-paper-dark/50 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-light">
              <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              <line x1="15" y1="5" x2="19" y2="9" />
            </svg>
          </div>
          <p className="font-serif text-sm text-ink-light text-center">
            No entries yet
          </p>
          <p className="font-serif text-xs text-ink-faint text-center mt-1">
            Tap <span className="text-accent font-semibold">Write</span> to begin your first entry
          </p>
        </div>
      )}
    </div>
  )
}

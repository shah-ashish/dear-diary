/**
 * HomeList — Entry list screen (Home tab)
 *
 * Shows all diary entries sorted newest-first.
 * Empty state when no entries exist.
 * Header with logo + app name.
 */

import logo from '../assets/logo.png'
import HomeEntryRow from './HomeEntryRow'

export default function HomeList({ diaryName, entryPreviews, showDelete, onEntryTap, onDelete }) {
  const hasEntries = entryPreviews.length > 0

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 shrink-0">
        <img src={logo} alt="Dear Diary" className="w-10 h-10 drop-shadow-sm" />
        <div>
          <h1 className="font-serif text-xl text-ink font-semibold leading-tight tracking-wide">
            {diaryName || 'Dear Diary'}
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
          {/* Large notebook card */}
          <div
            className="w-28 h-28 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(145deg, #F4EEE0, #E8DFD0)',
              boxShadow: '6px 6px 16px rgba(34, 49, 79, 0.08), -4px -4px 12px rgba(255, 255, 255, 0.6)',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-light">
              <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              <line x1="15" y1="5" x2="19" y2="9" />
            </svg>
          </div>
          <p className="font-serif text-base text-ink font-medium text-center">
            No entries yet
          </p>
          <p className="font-serif text-xs text-ink-light text-center mt-1.5 italic">
            Tap <span className="text-accent font-semibold not-italic">Write</span> to begin your first entry
          </p>
        </div>
      )}
    </div>
  )
}

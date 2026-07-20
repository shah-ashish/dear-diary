/**
 * HomeEntryRow — Single entry row in the Home list
 *
 * Shows date, day name, content preview, and page count.
 * Today's entry gets a special badge. Past entries show a lock icon.
 * Delete icon is conditionally rendered (controlled by Settings toggle).
 */

import { formatDisplayDate, isToday } from '../utils/date'

export default function HomeEntryRow({ date, preview, pageCount, showDelete, onTap, onDelete }) {
  const today = isToday(date)

  return (
    <div
      id={`entry-row-${date}`}
      onClick={() => onTap(date)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onTap(date) }}
      className="w-full text-left px-5 py-4 border-b border-paper-line/60
                 bg-transparent cursor-pointer
                 hover:bg-paper-dark/40 active:bg-paper-dark/60
                 transition-colors duration-150 flex items-start gap-3"
    >
      {/* Left: Date info + preview */}
      <div className="flex-1 min-w-0">
        {/* Date + badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-serif text-sm font-semibold text-ink leading-tight">
            {formatDisplayDate(date)}
          </span>

          {today ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-serif font-semibold
                             bg-accent/15 text-accent border border-accent/25 leading-none">
              Today
            </span>
          ) : (
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-ink-light/50 shrink-0"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>

        {/* Preview text */}
        {preview && (
          <p className="font-typewriter text-xs text-ink-light leading-relaxed truncate mt-0.5">
            "{preview}{preview.length >= 100 ? '…' : ''}"
          </p>
        )}

        {/* Page count */}
        {pageCount > 1 && (
          <span className="font-serif text-[10px] text-ink-faint mt-1 inline-block">
            {pageCount} pages
          </span>
        )}
      </div>

      {/* Right: Delete icon — only on past entries when toggle is ON */}
      {showDelete && !today && (
        <button
          id={`delete-btn-${date}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(date)
          }}
          className="shrink-0 p-2 rounded-lg text-ink-light cursor-pointer
                     bg-transparent border-none
                     hover:text-accent hover:bg-accent/10 transition-colors"
          aria-label={`Delete entry for ${date}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      )}

      {/* Right: Chevron when no delete icon */}
      {(!showDelete || today) && (
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-ink-faint shrink-0 mt-1"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
      )}
    </div>
  )
}

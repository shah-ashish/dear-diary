/**
 * DeleteConfirmModal — Confirmation popup before deleting an entry
 *
 * "Delete this entry permanently? This cannot be undone."
 * Cancel dismisses, Delete removes all pages for that date.
 */

import { formatDisplayDate } from '../utils/date'

export default function DeleteConfirmModal({ date, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl shadow-xl mx-6 p-6 max-w-sm w-full border border-paper-line">
        {/* Warning icon */}
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>

        <h3 className="font-serif text-lg text-ink font-semibold mb-1 text-center">
          Delete Entry
        </h3>

        <p className="font-serif text-xs text-ink-light mb-1 text-center">
          {formatDisplayDate(date)}
        </p>

        <p className="font-serif text-sm text-ink-light mb-6 text-center">
          Delete this entry permanently?<br />
          <span className="text-accent font-medium">This cannot be undone.</span>
        </p>

        <div className="flex gap-3">
          <button
            id="delete-cancel-btn"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg font-serif text-sm cursor-pointer
                       border border-paper-line bg-transparent text-ink-light
                       hover:bg-paper-dark transition-colors"
          >
            Cancel
          </button>
          <button
            id="delete-confirm-btn"
            onClick={() => onConfirm(date)}
            className="flex-1 py-2.5 rounded-lg font-serif text-sm font-semibold cursor-pointer
                       border-none bg-accent text-paper
                       hover:bg-accent-dark transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

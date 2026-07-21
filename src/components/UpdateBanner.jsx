/**
 * UpdateBanner — Dismissible update notification banner
 *
 * Shown at the top of the Home screen when a newer app version
 * is available on GitHub Releases. Tapping opens the download URL.
 */

export default function UpdateBanner({ version, downloadUrl, onDismiss }) {
  const handleDownload = () => {
    window.open(downloadUrl, '_blank', 'noopener')
  }

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl border border-accent/25 bg-accent/8 px-4 py-3 flex items-center gap-3 animate-fade-in shadow-sm">
      {/* Update icon */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm text-ink font-medium leading-tight">
          Update Available
        </p>
        <p className="font-serif text-[11px] text-ink-light mt-0.5 leading-tight">
          Version {version} is ready to download
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Download button */}
        <button
          id="update-download-btn"
          onClick={handleDownload}
          className="px-3 py-1.5 rounded-lg bg-accent text-paper font-serif text-xs font-semibold
                     border-none cursor-pointer hover:bg-accent-dark transition-colors active:scale-95"
        >
          Get
        </button>

        {/* Dismiss button */}
        <button
          id="update-dismiss-btn"
          onClick={onDismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center
                     bg-transparent border-none cursor-pointer text-ink-light
                     hover:bg-paper-dark/50 transition-colors"
          aria-label="Dismiss update notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

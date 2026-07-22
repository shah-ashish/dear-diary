/**
 * ReadOnlyViewer — Paginated viewer for past (locked) entries
 *
 * Shows entry pages one at a time on ruled paper.
 * Desaturated/archival look with a locked indicator.
 * No edit controls — just Back + page navigation.
 */

import { useState, useCallback, useEffect } from 'react'
import { formatDisplayDate } from '../utils/date'
import { getFontFamily } from '../utils/fonts'

const LINE_HEIGHT = 32

export default function ReadOnlyViewer({ date, pages, onBack, writingFont }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [turnDirection, setTurnDirection] = useState('') // 'left' | 'right' | ''

  const totalPages = pages.length
  const content = pages[currentPage]?.content || ''
  const isLastPage = currentPage === totalPages - 1

  useEffect(() => {
    const timer = setTimeout(() => {
      setTurnDirection('')
    }, 250)
    return () => clearTimeout(timer)
  }, [currentPage])

  const goToPage = useCallback(
    (index) => {
      if (index === currentPage || index < 0 || index >= totalPages) return
      setTurnDirection(index > currentPage ? 'right' : 'left')
      setTransitioning(true)
      setTimeout(() => {
        setCurrentPage(index)
        setTransitioning(false)
      }, 150)
    },
    [currentPage, totalPages]
  )

  const animationClass = turnDirection === 'right' ? 'page-turn-right' : turnDirection === 'left' ? 'page-turn-left' : ''

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden select-none">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-paper-line bg-paper/95 backdrop-blur-sm z-20 shrink-0">
        <button
          id="read-back-btn"
          onClick={onBack}
          className="text-ink font-serif text-sm flex items-center gap-1 cursor-pointer bg-transparent border-none hover:text-accent transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <span className="text-ink font-serif text-sm font-medium truncate mx-4 text-center">
          {formatDisplayDate(date)}
        </span>

        {/* Locked badge */}
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-serif font-semibold
                         bg-ink-faint text-ink-light border border-paper-line leading-none">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Locked
        </span>
      </header>

      {/* ── Ruled Paper Content ── */}
      <div
        className="flex-1 relative overflow-auto"
        style={{
          backgroundImage: `repeating-linear-gradient(
            transparent,
            transparent ${LINE_HEIGHT - 1}px,
            #D4CBBA ${LINE_HEIGHT - 1}px,
            #D4CBBA ${LINE_HEIGHT}px
          )`,
          backgroundSize: `100% ${LINE_HEIGHT}px`,
          backgroundPosition: '0 8px',
        }}
      >
        {/* Red margin line */}
        <div
          className="absolute top-0 bottom-0 z-10 pointer-events-none"
          style={{
            left: '11%',
            width: '2px',
            background: 'var(--color-accent)',
            opacity: 0.25,
          }}
        />



        {/* Content display */}
        <div className={`transition-all duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'} ${animationClass}`}>
          <p
            className="text-ink/75 whitespace-pre-wrap m-0"
            style={{
              fontFamily: getFontFamily(writingFont),
              paddingLeft: 'calc(11% + 16px)',
              paddingRight: '20px',
              paddingTop: '8px',
              paddingBottom: '80px',
              lineHeight: `${LINE_HEIGHT}px`,
              fontSize: '17px',
            }}
          >
            {content || (
              <span className="italic text-ink-faint">This page is empty.</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      {totalPages > 1 && (
        <footer className="shrink-0 border-t border-paper-line bg-paper/95 backdrop-blur-sm z-20">
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            <button
              id="read-prev-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-serif text-xs cursor-pointer
                         border border-paper-line bg-paper-dark/50
                         disabled:opacity-30 disabled:cursor-default
                         hover:bg-paper-dark transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Prev
            </button>

            <span className="font-serif text-xs text-ink-light tabular-nums mx-2">
              Page {currentPage + 1} of {totalPages}
            </span>

            <button
              id="read-next-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={isLastPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-serif text-xs cursor-pointer
                         border border-paper-line bg-paper-dark/50
                         disabled:opacity-30 disabled:cursor-default
                         hover:bg-paper-dark transition-all"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

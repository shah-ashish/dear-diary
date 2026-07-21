/**
 * WritePage — Ruled-paper editor for today's entry
 *
 * Features:
 * - Ruled paper with horizontal lines + red margin rule
 * - 1200-character cap per page, typing blocked at limit
 * - Multi-page support with Prev/Next/Add navigation
 * - Top bar: Back + date + Auto-save indicator (No Save button)
 * - Paste truncation, live character counter
 * - Automatic background live-saving as you type
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatDisplayDate } from '../utils/date'
import { countChars, truncateToCharLimit, CHAR_LIMIT } from '../utils/words'

const LINE_HEIGHT = 32 // px — must match the ruled-line spacing

export default function WritePage({ today, initialPages, onSave, onBack }) {
  // ─── State ────────────────────────────────────────────────
  const [pages, setPages] = useState(() =>
    initialPages.length > 0
      ? initialPages.map((p) => p.content)
      : ['']
  )
  const [currentPage, setCurrentPage] = useState(0)
  const [saveStatus, setSaveStatus] = useState('') // '' | 'saving' | 'saved'
  const [transitioning, setTransitioning] = useState(false)
  const [turnDirection, setTurnDirection] = useState('') // 'left' | 'right' | ''

  const textareaRef = useRef(null)
  const isFirstMount = useRef(true)

  const content = pages[currentPage] || ''
  const charCount = countChars(content)
  const atLimit = charCount >= CHAR_LIMIT
  const totalPages = pages.length
  const isLastPage = currentPage === totalPages - 1

  // ─── Focus textarea on mount and page change ──────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus()
      // Reset animation class after it plays
      setTurnDirection('')
    }, 250)
    return () => clearTimeout(timer)
  }, [currentPage])

  // ─── Debounced Auto-Save ──────────────────────────────────

  useEffect(() => {
    // Avoid saving on the very first mount if the initial page is empty
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    setSaveStatus('saving')

    const delayDebounce = setTimeout(() => {
      const pagesToSave = pages.map((text, i) => ({
        page_number: i + 1,
        content: text,
      }))
      onSave(today, pagesToSave)
      setSaveStatus('saved')
    }, 600) // 600ms debounce after user stops typing

    return () => clearTimeout(delayDebounce)
  }, [pages, today, onSave])

  // ─── Clean Save & Exit on Back ────────────────────────────

  const handleBack = useCallback(async () => {
    // On exit, clean up trailing empty pages (keep at least page 1)
    let cleanedPages = [...pages]
    while (cleanedPages.length > 1 && cleanedPages[cleanedPages.length - 1].trim() === '') {
      cleanedPages.pop()
    }

    const pagesToSave = cleanedPages.map((text, i) => ({
      page_number: i + 1,
      content: text,
    }))

    // Save final cleaned array immediately, then navigate back
    await onSave(today, pagesToSave)
    onBack()
  }, [pages, today, onSave, onBack])

  // ─── Text input handler ──────────────────────────────────

  const handleInput = useCallback(
    (e) => {
      let newText = e.target.value

      // Enforce character limit: truncate if over
      if (countChars(newText) > CHAR_LIMIT) {
        newText = truncateToCharLimit(newText, CHAR_LIMIT)
      }

      setPages((prev) => {
        const next = [...prev]
        next[currentPage] = newText
        return next
      })
    },
    [currentPage]
  )

  // ─── Page navigation ─────────────────────────────────────

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

  const addNextPage = useCallback(() => {
    if (isLastPage) {
      // Create new page
      setTurnDirection('right')
      setTransitioning(true)
      setTimeout(() => {
        setPages((prev) => [...prev, ''])
        setCurrentPage((prev) => prev + 1)
        setTransitioning(false)
      }, 150)
    } else {
      // Go to existing next page
      goToPage(currentPage + 1)
    }
  }, [isLastPage, currentPage, goToPage])

  // ─── Render ───────────────────────────────────────────────

  const animationClass = turnDirection === 'right' ? 'page-turn-right' : turnDirection === 'left' ? 'page-turn-left' : ''

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden">
      {/* ── Top Bar (No Save button, live save status indicators) ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-paper-line bg-paper/95 backdrop-blur-sm z-20 shrink-0">
        <button
          id="write-back-btn"
          onClick={handleBack}
          className="text-ink font-serif text-sm flex items-center gap-1 cursor-pointer bg-transparent border-none hover:text-accent transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <span className="text-ink font-serif text-sm font-medium truncate mx-4 text-center">
          {formatDisplayDate(today)}
        </span>

        {/* Live Auto-save status badge */}
        <div className="min-w-16 flex justify-end">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[11px] font-serif text-accent animate-pulse font-medium">
              <svg className="animate-spin h-3 w-3 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[11px] font-serif text-green-700 font-medium flex items-center gap-0.5 animate-fade-in">
              ✓ Saved
            </span>
          )}
          {saveStatus === '' && (
            <span className="text-[11px] font-serif text-ink-light opacity-50">
              Saved
            </span>
          )}
        </div>
      </header>

      {/* ── Ruled Paper Editor ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Red margin line */}
        <div
          className="absolute top-0 bottom-0 z-10 pointer-events-none"
          style={{
            left: '11%',
            width: '2px',
            background: 'var(--color-accent)',
            opacity: 0.35,
          }}
        />

        {/* Textarea with ruled lines ON the textarea so they scroll with text */}
        <div className={`h-full transition-all duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'} ${animationClass}`}>
          <textarea
            ref={textareaRef}
            id="diary-editor"
            value={content}
            onChange={handleInput}
            placeholder={currentPage === 0 ? 'Start writing your thoughts...' : 'Continue writing...'}
            spellCheck={true}
            className="w-full h-full resize-none border-none outline-none font-typewriter text-ink caret-accent placeholder:text-ink-light placeholder:italic"
            style={{
              paddingLeft: 'calc(11% + 16px)',
              paddingRight: '20px',
              paddingTop: '8px',
              paddingBottom: '80px',
              lineHeight: `${LINE_HEIGHT}px`,
              fontSize: '17px',
              backgroundImage: `repeating-linear-gradient(
                transparent,
                transparent ${LINE_HEIGHT - 1}px,
                #D4CBBA ${LINE_HEIGHT - 1}px,
                #D4CBBA ${LINE_HEIGHT}px
              )`,
              backgroundSize: `100% ${LINE_HEIGHT}px`,
              backgroundPosition: '0 8px',
              backgroundAttachment: 'local',
              backgroundColor: 'transparent',
            }}
          />
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <footer className="shrink-0 border-t border-paper-line bg-paper/95 backdrop-blur-sm z-20">
        {/* Char limit reached — Next Page CTA */}
        {atLimit && isLastPage && (
          <div className="px-4 pt-3">
            <button
              id="next-page-cta"
              onClick={addNextPage}
              className="w-full py-2.5 rounded-lg bg-accent/10 text-accent font-serif text-sm font-semibold
                         border border-accent/30 cursor-pointer
                         hover:bg-accent/20 transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              Continue on Next Page
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </div>
        )}

        {/* Page navigation — always visible when multi-page */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 pt-3">
            <button
              id="prev-page-btn"
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
              id="next-page-btn"
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
        )}

        <div className="flex items-center justify-between px-4 py-3">
          {/* Character counter */}
          <span className={`
            font-serif text-xs tabular-nums
            ${atLimit ? 'text-accent font-semibold' : 'text-ink-light'}
          `}>
            {charCount} / {CHAR_LIMIT} characters
          </span>

          {/* Single page indicator when only 1 page */}
          {totalPages === 1 && (
            <span className="font-serif text-xs text-ink-faint">
              Page 1
            </span>
          )}
        </div>
      </footer>
    </div>
  )
}

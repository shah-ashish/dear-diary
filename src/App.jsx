import { useState, useCallback, useEffect } from 'react'
import BottomNav from './components/BottomNav'
import HomeList from './components/HomeList'
import WritePage from './components/WritePage'
import ReadOnlyViewer from './components/ReadOnlyViewer'
import SettingsScreen from './components/SettingsScreen'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import useEntries from './hooks/useEntries'
import { getToday, isToday } from './utils/date'

/**
 * App — Root component & screen router
 *
 * Manages screens, navigation, delete confirmation flow,
 * and distributes useEntries hook data to child components.
 */
export default function App() {
  const [screen, setScreen] = useState('home')
  const [selectedDate, setSelectedDate] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // date string or null
  const [todayDate, setTodayDate] = useState(() => getToday())

  const {
    entryPreviews,
    currentPages,
    showDelete,
    refreshEntryPreviews,
    loadEntry,
    loadTodayEntry,
    saveAllPageContents,
    removeEntry,
    toggleShowDelete,
  } = useEntries()

  // ─── Midnight Rollover Check ────────────────────────────────
  useEffect(() => {
    const checkMidnight = () => {
      const currentToday = getToday()
      if (currentToday !== todayDate) {
        setTodayDate(currentToday)
        // If we are currently writing, save and kick back to home to enforce locked states
        if (screen === 'write') {
          navigate('home')
        } else {
          refreshEntryPreviews()
        }
      }
    }

    // Check every 10 seconds
    const interval = setInterval(checkMidnight, 10000)
    // Check when window gains focus
    window.addEventListener('focus', checkMidnight)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', checkMidnight)
    }
  }, [todayDate, screen, refreshEntryPreviews])

  // ─── Navigation ─────────────────────────────────────────────

  const navigate = useCallback(
    (screenName, date = null) => {
      if (screenName === 'write') {
        loadTodayEntry()
      }
      if (screenName === 'read' && date) {
        loadEntry(date)
        setSelectedDate(date)
      }
      if (screenName === 'home') {
        refreshEntryPreviews()
      }
      setScreen(screenName)
    },
    [loadTodayEntry, loadEntry, refreshEntryPreviews]
  )

  // ─── Entry tap handler (today → write, past → read) ────────

  const handleEntryTap = useCallback(
    (date) => {
      if (isToday(date)) {
        navigate('write')
      } else {
        navigate('read', date)
      }
    },
    [navigate]
  )

  // ─── Delete flow ────────────────────────────────────────────

  const handleDeleteRequest = useCallback((date) => {
    setDeleteTarget(date)
  }, [])

  const handleDeleteConfirm = useCallback(
    (date) => {
      removeEntry(date)
      setDeleteTarget(null)
    },
    [removeEntry]
  )

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  // BottomNav only visible on Home and Settings
  const showBottomNav = screen === 'home' || screen === 'settings'

  return (
    <div className="paper-texture h-screen overflow-hidden relative flex flex-col justify-between">
      <main className={`relative z-10 flex-1 flex flex-col overflow-hidden ${showBottomNav ? 'pb-16' : ''}`}>

        {/* Screen layout with fade slide enter animation triggered by screen change key */}
        <div key={screen} className="screen-fade-enter flex-1 flex flex-col overflow-hidden">
          {/* ── HOME ── */}
          {screen === 'home' && (
            <HomeList
              entryPreviews={entryPreviews}
              showDelete={showDelete}
              onEntryTap={handleEntryTap}
              onDelete={handleDeleteRequest}
            />
          )}

          {/* ── WRITE ── */}
          {screen === 'write' && (
            <WritePage
              today={todayDate}
              initialPages={currentPages}
              onSave={saveAllPageContents}
              onBack={() => navigate('home')}
            />
          )}

          {/* ── SETTINGS ── */}
          {screen === 'settings' && (
            <SettingsScreen
              showDelete={showDelete}
              onToggleDelete={toggleShowDelete}
            />
          )}

          {/* ── READ-ONLY VIEWER ── */}
          {screen === 'read' && selectedDate && (
            <ReadOnlyViewer
              date={selectedDate}
              pages={currentPages}
              onBack={() => navigate('home')}
            />
          )}
        </div>

      </main>

      {showBottomNav && (
        <BottomNav activeScreen={screen} onNavigate={navigate} />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          date={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  )
}

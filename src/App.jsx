import { useState, useCallback, useEffect } from 'react'
import BottomNav from './components/BottomNav'
import HomeList from './components/HomeList'
import WritePage from './components/WritePage'
import ReadOnlyViewer from './components/ReadOnlyViewer'
import SettingsScreen from './components/SettingsScreen'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import UpdateBanner from './components/UpdateBanner'
import useEntries from './hooks/useEntries'
import { getToday, isToday } from './utils/date'
import { checkForUpdate } from './utils/version'

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
  const [isLoading, setIsLoading] = useState(false)
  const [updateInfo, setUpdateInfo] = useState(null) // { hasUpdate, latestVersion, downloadUrl }
  const [updateDismissed, setUpdateDismissed] = useState(
    () => sessionStorage.getItem('update_dismissed') === 'true'
  )

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

  // ─── Check for app update on mount ──────────────────────────
  useEffect(() => {
    checkForUpdate().then((result) => {
      if (result?.hasUpdate) {
        setUpdateInfo(result)
      }
    })
  }, [])

  const handleDismissUpdate = useCallback(() => {
    setUpdateDismissed(true)
    sessionStorage.setItem('update_dismissed', 'true')
  }, [])

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

  // ─── Navigation (Async Await to resolve race conditions) ────

  const navigate = useCallback(
    async (screenName, date = null) => {
      setIsLoading(true)
      if (screenName === 'write') {
        await loadTodayEntry()
      }
      if (screenName === 'read' && date) {
        await loadEntry(date)
        setSelectedDate(date)
      }
      if (screenName === 'home') {
        await refreshEntryPreviews()
      }
      setScreen(screenName)
      setIsLoading(false)
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
    async (date) => {
      await removeEntry(date)
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

        {/* Global Loading Spinner for database fetches */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-paper">
            <svg className="animate-spin h-8 w-8 text-accent mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-serif text-xs text-ink-light italic">Opening pages...</span>
          </div>
        ) : (
          /* Screen layout with fade slide enter animation triggered by screen change key */
          <div key={screen} className="screen-fade-enter flex-1 flex flex-col overflow-hidden">
            {/* ── HOME ── */}
            {screen === 'home' && (
              <>
                {/* Update notification banner */}
                {updateInfo?.hasUpdate && !updateDismissed && (
                  <UpdateBanner
                    version={updateInfo.latestVersion}
                    downloadUrl={updateInfo.downloadUrl}
                    onDismiss={handleDismissUpdate}
                  />
                )}
                <HomeList
                  entryPreviews={entryPreviews}
                  showDelete={showDelete}
                  onEntryTap={handleEntryTap}
                  onDelete={handleDeleteRequest}
                />
              </>
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
        )}

      </main>

      {showBottomNav && !isLoading && (
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

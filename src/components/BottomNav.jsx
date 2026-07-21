/**
 * BottomNav — 3-tab navigation bar (Home, Write, Settings)
 * 
 * Visible only on Home and Settings screens.
 * Hidden entirely on Write and Read-only screens.
 */

const tabs = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 14 15 14 15 21" />
      </svg>
    ),
  },
  {
    id: 'write',
    label: 'Write',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        <line x1="15" y1="5" x2="19" y2="9" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function BottomNav({ activeScreen, onNavigate }) {
  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around
                 bg-paper/95 backdrop-blur-sm border-t border-paper-line
                 h-16 px-2"
      style={{ boxShadow: '0 -2px 12px rgba(34, 49, 79, 0.06)' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeScreen
        return (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            onClick={() => onNavigate(tab.id)}
            className={`
              flex flex-col items-center justify-center gap-0.5
              w-16 py-1.5 rounded-xl
              transition-all duration-200 ease-out
              cursor-pointer border-none bg-transparent
              ${isActive
                ? 'text-accent scale-105'
                : 'text-ink-light hover:text-ink'
              }
            `}
          >
            <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className={`
              text-[10px] font-serif tracking-widest leading-none mt-0.5 uppercase
              ${isActive ? 'font-semibold' : 'font-normal'}
            `}>
              {tab.label}
            </span>

            {/* Active indicator dot */}
            <span
              className={`
                block w-1 h-1 rounded-full mt-0.5
                transition-all duration-200
                ${isActive ? 'bg-accent scale-100' : 'bg-transparent scale-0'}
              `}
            />
          </button>
        )
      })}
    </nav>
  )
}

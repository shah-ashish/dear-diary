/**
 * theme.js — Theme management (Light, Dark, System)
 *
 * Applies theme attribute to Document root and updates CSS custom properties.
 */

export const THEMES = [
  { id: 'light', name: 'Light', icon: '☀️' },
  { id: 'dark', name: 'Dark', icon: '🌙' },
  { id: 'system', name: 'System', icon: '💻' },
]

let systemThemeListener = null

/**
 * Apply theme mode to document.
 * @param {'light' | 'dark' | 'system'} mode
 */
export function applyTheme(mode) {
  const root = document.documentElement

  // Clean up existing system listener if any
  if (systemThemeListener) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.removeEventListener('change', systemThemeListener)
    systemThemeListener = null
  }

  if (mode === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const isDark = mediaQuery.matches
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')

    systemThemeListener = (e) => {
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', systemThemeListener)
  } else {
    root.setAttribute('data-theme', mode)
  }
}

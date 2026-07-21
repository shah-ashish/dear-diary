/**
 * fonts.js — Curated font definitions + dynamic Google Font loader
 *
 * Each font has an id, display name, CSS family string, and Google Fonts URL.
 * loadFont() dynamically injects a <link> tag to load the font.
 */

export const FONTS = [
  {
    id: 'special-elite',
    name: 'Special Elite',
    family: "'Special Elite', 'Courier New', monospace",
    url: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
  },
  {
    id: 'courier-prime',
    name: 'Courier Prime',
    family: "'Courier Prime', 'Courier New', monospace",
    url: 'https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap',
  },
  {
    id: 'indie-flower',
    name: 'Indie Flower',
    family: "'Indie Flower', cursive",
    url: 'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap',
  },
  {
    id: 'caveat',
    name: 'Caveat',
    family: "'Caveat', cursive",
    url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap',
  },
  {
    id: 'patrick-hand',
    name: 'Patrick Hand',
    family: "'Patrick Hand', cursive",
    url: 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap',
  },
  {
    id: 'shadows-into-light',
    name: 'Shadows Into Light',
    family: "'Shadows Into Light', cursive",
    url: 'https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap',
  },
]

/** Set of already-loaded font IDs to avoid duplicate <link> tags */
const loadedFonts = new Set(['special-elite']) // Default is in index.html already

/**
 * Dynamically load a Google Font by injecting a <link> tag.
 * No-ops if the font is already loaded.
 * @param {{ id: string, url: string }} font
 */
export async function loadFont(font) {
  if (loadedFonts.has(font.id)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = font.url
  document.head.appendChild(link)

  // Wait for font to be ready
  await new Promise((resolve) => {
    link.onload = resolve
    link.onerror = resolve // Don't block on error
  })

  loadedFonts.add(font.id)
}

/**
 * Get the CSS font-family string for a font ID.
 * Falls back to Special Elite if not found.
 * @param {string} fontId
 * @returns {string}
 */
export function getFontFamily(fontId) {
  const font = FONTS.find(f => f.id === fontId)
  return font ? font.family : FONTS[0].family
}

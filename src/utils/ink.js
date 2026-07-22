/**
 * ink.js — Ink color configurations
 */

export const INK_COLORS = [
  { id: 'navy', name: 'Navy', hex: '#22314F', class: 'bg-[#22314F] dark:bg-[#E0E2EE]' },
  { id: 'charcoal', name: 'Charcoal', hex: '#1C1C1E', class: 'bg-[#1C1C1E] dark:bg-[#F2F2F7]' },
  { id: 'forest', name: 'Forest', hex: '#1A332B', class: 'bg-[#1A332B] dark:bg-[#B8E0D2]' },
  { id: 'burgundy', name: 'Burgundy', hex: '#5C1C1C', class: 'bg-[#5C1C1C] dark:bg-[#F5B7B1]' },
  { id: 'sepia', name: 'Sepia', hex: '#5C4033', class: 'bg-[#5C4033] dark:bg-[#E5D3C3]' },
]

/**
 * Apply ink color setting to document HTML tag.
 * @param {string} inkId
 */
export function applyInkColor(inkId) {
  const root = document.documentElement
  root.setAttribute('data-ink', inkId || 'navy')
}

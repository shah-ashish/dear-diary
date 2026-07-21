/**
 * security.js — Passcode lock & cryptographic verification helpers
 *
 * Uses Web Crypto API (SHA-256) for offline, secure hashing of PINs
 * and security answers stored in SQLite settings.
 */

import { getSetting, setSetting } from '../db/storage'

/**
 * Generate a SHA-256 hex hash of a string using Web Crypto API.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function hashString(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if passcode lock is currently enabled.
 * @returns {Promise<boolean>}
 */
export async function isLockEnabled() {
  return await getSetting('lock_enabled', false)
}

/**
 * Save new lock configuration (PIN + Security Question/Answer).
 * @param {string} pin - 4-digit numeric string
 * @param {string} question - Security question text
 * @param {string} answer - Security answer text
 * @returns {Promise<void>}
 */
export async function setLockConfig(pin, question, answer) {
  const pinHash = await hashString(pin)
  const normalizedAnswer = answer.trim().toLowerCase()
  const answerHash = await hashString(normalizedAnswer)

  await setSetting('lock_pin_hash', pinHash)
  await setSetting('lock_question', question.trim())
  await setSetting('lock_answer_hash', answerHash)
  await setSetting('lock_enabled', true)
}

/**
 * Verify an entered 4-digit PIN against stored hash.
 * @param {string} pin
 * @returns {Promise<boolean>}
 */
export async function verifyPin(pin) {
  const storedHash = await getSetting('lock_pin_hash', '')
  if (!storedHash) return false
  const inputHash = await hashString(pin)
  return inputHash === storedHash
}

/**
 * Get the stored security question string.
 * @returns {Promise<string>}
 */
export async function getSecurityQuestion() {
  return await getSetting('lock_question', 'Childhood nickname?')
}

/**
 * Verify an entered security question answer against stored hash.
 * @param {string} answer
 * @returns {Promise<boolean>}
 */
export async function verifySecurityAnswer(answer) {
  const storedHash = await getSetting('lock_answer_hash', '')
  if (!storedHash) return false
  const normalizedInput = answer.trim().toLowerCase()
  const inputHash = await hashString(normalizedInput)
  return inputHash === storedHash
}

/**
 * Disable passcode lock and clear security settings.
 * @returns {Promise<void>}
 */
export async function removeLockConfig() {
  await setSetting('lock_enabled', false)
  await setSetting('lock_pin_hash', '')
  await setSetting('lock_question', '')
  await setSetting('lock_answer_hash', '')
}

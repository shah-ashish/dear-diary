import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader'

const sqliteConnection = new SQLiteConnection(CapacitorSQLite)
let dbInstance = null

export const DB_NAME = 'diary_db'

/**
 * Initialize SQLite Database connection
 * Handles browser fallback via jeep-sqlite & IndexedDB
 */
export async function initDatabase() {
  const platform = Capacitor.getPlatform()

  if (platform === 'web') {
    // 1. Register Stencil component
    jeepSqlite(window)

    // 2. Create and mount jeep-sqlite element if it doesn't exist
    let jeepSqliteEl = document.querySelector('jeep-sqlite')
    if (!jeepSqliteEl) {
      jeepSqliteEl = document.createElement('jeep-sqlite')
      document.body.appendChild(jeepSqliteEl)
    }
    
    // Wait for the custom elements loader to register it
    await customElements.whenDefined('jeep-sqlite')

    // 3. Initialize IndexedDB web store
    await sqliteConnection.initWebStore()
  }

  // 4. Safely create or retrieve database connection
  const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result
  let db

  if (isConn) {
    db = await sqliteConnection.retrieveConnection(DB_NAME, false)
  } else {
    db = await sqliteConnection.createConnection(
      DB_NAME,
      false, // encrypted
      'no-encryption',
      1, // version
      false // readonly
    )
  }

  // 5. Safely open database if it isn't already open
  const isOpen = (await db.isDBOpen()).result
  if (!isOpen) {
    await db.open()
  }

  dbInstance = db

  // 6. Run table migrations
  await runMigrations()

  // 7. If platform is web, save data to IndexedDB immediately after migration
  if (platform === 'web') {
    await sqliteConnection.saveToStore(DB_NAME)
  }

  return dbInstance
}

/**
 * Run database schema creation
 */
async function runMigrations() {
  if (!dbInstance) throw new Error('Database not initialized')

  // Create entries table
  const createEntriesTable = `
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      word_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(entry_date, page_number)
    );
  `

  // Create settings table
  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `

  await dbInstance.execute(createEntriesTable)
  await dbInstance.execute(createSettingsTable)
}

/**
 * Access the database instance safely.
 */
export function getDB() {
  if (!dbInstance) {
    throw new Error('Database connection is not open. Call initDatabase() first.')
  }
  return dbInstance
}

/**
 * Access the SQLite Connection manager safely (required for saveToStore on web).
 */
export function getSQLiteConnection() {
  return sqliteConnection;
}

/**
 * Save data to IndexedDB store (only applies to Web development fallback).
 */
export async function saveDatabaseToStore() {
  if (Capacitor.getPlatform() === 'web') {
    await sqliteConnection.saveToStore(DB_NAME)
  }
}

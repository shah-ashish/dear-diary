import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initDatabase } from './db/sqliteInit'

// Boot up SQLite database connection first
initDatabase()
  .then(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  })
  .catch((err) => {
    console.error('Failed to initialize SQLite database:', err)
    // Render a fallback error message in the DOM
    document.getElementById('root').innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center; background-color: #F4EEE0; color: #22314F; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 style="color: #B5443A;">Database Error</h1>
        <p>Could not open the offline database connection.</p>
        <p style="font-size: 12px; color: #22314F88;">${err?.message || err}</p>
      </div>
    `
  })

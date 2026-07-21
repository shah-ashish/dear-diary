# Dear Diary 📖

A personal, offline-only diary app with a warm notebook & typewriter aesthetic. Write one entry per day on paginated pages — once the day passes, your words are locked forever, just like ink on paper.

**No accounts. No cloud. No tracking. Your thoughts stay on your device.**

---

## ✨ Features

- **Daily Entries** — One entry per calendar date, written on paginated 1200-character pages
- **Ruled Paper Editor** — Typewriter-style writing on lined notebook paper with a red margin rule
- **Auto-Save** — Your writing is saved automatically as you type
- **Permanent Lock** — Past entries become read-only at midnight, preserving your memories exactly as written
- **Export / Download** — Download all entries as `.txt` files to your device (incremental — skips files already exported)
- **Update Notifications** — Get notified in-app when a new version is available on GitHub Releases
- **Beautiful Aesthetic** — Warm cream paper, ink-navy text, brick-red accents, paper grain texture, and page-turn transitions
- **Fully Offline** — Zero network requests (except the optional update check). No analytics, no telemetry

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 19 + Vite |
| **Styling** | Tailwind CSS v4 |
| **Storage** | Capacitor SQLite + jeep-sqlite (web fallback) |
| **Fonts** | Special Elite (typewriter) + Lora (serif UI) |
| **Native Wrapper** | Capacitor (Android) |
| **CI/CD** | GitHub Actions (auto-build APK + GitHub Releases) |

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| **Home** | List of all diary entries, newest first. Tap to read past entries in a locked paginated viewer |
| **Write** | Ruled-paper editor for today's entry. 1200-char cap per page with multi-page support |
| **Settings** | Toggle delete icons on Home, download/export all entries |
| **Read-Only Viewer** | Paginated viewer for past entries with ink-stamp "Locked" indicator |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Build for Production

```bash
npm run build
```

### Build Android APK

```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync

# Build APK
cd android && ./gradlew assembleDebug
```

The debug APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 📦 Releasing a New Version

1. Update `APP_VERSION` in `src/utils/version.js`
2. Update `version` in `package.json` to match
3. Commit your changes, then tag and push:

```bash
git tag v1.0.1
git push origin v1.0.1
```

4. GitHub Actions will automatically build the APK and create a GitHub Release
5. Existing users will see an "Update Available" banner on their next app launch

---

## 📂 Project Structure

```
src/
  components/
    BottomNav.jsx           # 3-tab navigation (Home, Write, Settings)
    HomeList.jsx            # Entry list screen
    HomeEntryRow.jsx        # Single date row with optional delete icon
    DeleteConfirmModal.jsx  # Confirmation popup for deletions
    WritePage.jsx           # Ruled-paper editor (today only)
    ReadOnlyViewer.jsx      # Paginated past-entry viewer
    SettingsScreen.jsx      # Delete toggle + export/download
    UpdateBanner.jsx        # Dismissible update notification
  db/
    sqliteInit.js           # Capacitor SQLite + jeep-sqlite web init
    storage.js              # CRUD operations for entries & settings
  hooks/
    useEntries.js           # React hook wrapping storage operations
  utils/
    date.js                 # Date formatting & "today" helpers
    words.js                # Character counting & cap enforcement
    version.js              # App version & GitHub update checker
    exportDiary.js          # Export entries to device/zip
  App.jsx                   # Root component & screen router
  main.jsx                  # React entry point + DB init
  index.css                 # Tailwind v4 theme + custom styles
```

---

## 📋 Business Rules

- Only today's date is writable — no past editing, no future entries, no date picker
- Past entries become permanently read-only once the date advances
- 1200-character hard cap per page — no cross-page text reflow
- Delete = all pages for that date, never a single page
- Delete requires a confirmation modal
- Delete icons hidden by default, enabled via Settings toggle
- No export overwrites — existing files are skipped during download

---

## 📄 License

This project is private and not licensed for redistribution.

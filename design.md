# Dear Diary — Development Spec

## 1. Overview

A personal, offline-only diary app. One entry per calendar date. Entries are
written on paginated "pages" (200-word cap per page). Only **today's** entry
is ever editable; all past entries are permanently locked and read-only.
No accounts, no cloud sync, no backend, no network calls of any kind.

Target: web app during development, wrapped as a native Android app via
Capacitor for final install (APK built separately via GitHub Actions — not
part of this spec).

---

## 2. Tech Stack (locked — do not substitute)

- **React + Vite** — no Create React App
- **@capacitor-community/sqlite** for storage, with `jeep-sqlite` (wasm)
  fallback for the web/dev environment, so dev and production use the
  identical storage engine
- **Capacitor** for the native Android wrapper
- **Plain CSS** (no Tailwind, no CSS-in-JS libraries) — this app needs
  precise custom typography/line-spacing control that utility frameworks
  fight against
- **React `useState` / `useReducer`** for state — no Redux, no Zustand,
  no external state library (state surface is tiny: current entry, entry
  list, settings toggle)
- **Native `Date`**, no date-fns/moment/dayjs
- **No backend. No REST/GraphQL API. No auth. No analytics SDKs.**
  If any scaffolding tool tries to add these, remove them.

---

## 3. Design Direction (mandatory — do not default to generic UI)

**Do not use:** Inter, Roboto, Arial, or system-default fonts. Do not use
purple/blue gradient backgrounds. Do not use generic rounded card grids or
a standard "dashboard" layout. This must not look like a generic AI-generated
SaaS UI.

**Aesthetic: warm paper & ink.** The app should feel like a physical,
well-worn notebook, not a productivity tool.

- **Background:** warm cream/ivory paper tone (`#F4EEE0` range), with a
  very subtle paper grain/noise texture overlay (low opacity, CSS or SVG
  noise filter — not a photographic texture).
- **Ink color:** deep ink-navy (`#22314F` range) for body text, NOT pure
  black. Use a muted brick-red (`#B5443A` range) as the single sharp accent
  color — used for the ruled margin line, the Save button, and the
  "locked" indicator on past pages. Do not introduce a second accent color.
- **Typography:**
  - Entry text (what the user writes): a **typewriter-style monospace
    display font** (e.g. "Special Elite", "Courier Prime", or similar —
    something with real character, not a default monospace) — reinforces
    the "written page" feel.
  - UI chrome (dates, buttons, nav labels): a refined **serif** (e.g.
    "Lora", "Source Serif 4", or similar) — pairs with the typewriter font
    without competing with it.
  - Explicitly avoid Space Grotesk (overused in AI-generated UI).
- **Ruled page:** each writing page should visually resemble ruled paper —
  horizontal guide lines at consistent intervals matching the text
  line-height, and a vertical red margin rule ~10-12% from the left edge,
  in the accent red. Text should sit just right of the margin line, like
  real notebook paper.
- **Motion:** one deliberate page-turn/fade transition when moving between
  Home → Write, and between pages within a multi-page entry. Avoid
  scattered micro-animations elsewhere; restraint fits this aesthetic more
  than a busy interface would.
- **Locked (past) entries:** should visually read as "closed"/archival —
  e.g. slightly desaturated, a small ink-stamp-style "locked" mark, no
  interactive affordances (no edit icon, no cursor).

---

## 4. Screens & Flow

### Bottom navigation
Three tabs, visible only on **Home** and **Settings**: `Home`, `Write`,
`Settings`. The **Write screen hides the bottom nav entirely** — instead
shows a top bar with a `Back` button (left) and `Save` button (right).

### Home
- List of all dates that have an entry, most recent first (confirm order
  matches however entries were created — current date is always freshest).
- Each row: date, and (if the Settings delete-toggle is ON) a delete icon.
- **No edit icon ever on Home** — past entries are read-only.
- Tapping a row opens that date's entry in a **read-only viewer**
  (all its pages, scrollable or paginated for reading; no Save/Update
  controls, just a Back button).
- Delete icon: only rendered when Settings toggle is enabled. Tapping it
  opens a confirmation popup ("Delete this entry permanently? This cannot
  be undone.") before deleting **all pages for that date**.

### Write (always today only)
- Auto-fills today's date at the top; not editable/selectable — there is
  no date picker anywhere in the app.
- If today already has content, opens it live, fully editable (standard
  text editor behavior — user can edit/delete anywhere, not append-only).
- 200-word hard cap per page. On reaching the cap, further typing is
  blocked on that page and a **"Next Page"** button appears/activates,
  creating a new page to continue writing. Pages are **fixed, independent
  buckets** — no auto-reflow of text between pages when editing.
- Save writes current state to SQLite. Back returns to Home.
- Once the date rolls past midnight, this entry becomes permanently locked
  and will only ever appear via Home's read-only viewer.

### Settings
- Single toggle: "Show delete option on Home." Default: **off/hidden**.
  When on, delete icons appear next to entries on Home; when off, they're
  hidden again (not just disabled-looking — actually absent/inert).

---

## 5. Data Model (SQLite)

```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL,        -- 'YYYY-MM-DD', unique per date
  page_number INTEGER NOT NULL,    -- 1-indexed, per date
  content TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(entry_date, page_number)
);
```

- A "diary entry" for a date = all rows sharing that `entry_date`, ordered
  by `page_number`.
- Deleting a date deletes all rows with that `entry_date`.
- `word_count` enforced at 200 max per row at the application layer before
  writing to SQLite (not a DB constraint).

---

## 6. Business Rules (explicit — do not deviate)

1. Only the current calendar date is ever writable. No past-date editing,
   no future-date entries, no date picker.
2. Once a date is no longer "today" (local device date has advanced), that
   date's entry becomes permanently read-only.
3. Pages are fixed 200-word buckets. No cross-page text reflow on edit.
4. Deleting is scoped to the whole date (all pages), never a single page.
5. Delete requires a confirmation popup, no exceptions.
6. Delete icons on Home are hidden by default; only shown when explicitly
   enabled via the Settings toggle.
7. No network requests anywhere in the app. No telemetry.
8. No export/backup feature (explicitly declined by product owner —
   don't add one even if it seems like good practice).

---

## 7. Explicit Non-Goals (do not build these)

- No accounts, login, or cloud sync
- No backend/API of any kind
- No date picker or calendar-jump navigation
- No editing/updating of past entries under any circumstance
- No multi-device support
- No export/backup/share functionality
- No rich text formatting, images, or attachments in entries
- No word/mood/tag metadata beyond word_count

---

## 8. Suggested File Structure

```
/src
  /components
    HomeList.jsx
    HomeEntryRow.jsx
    DeleteConfirmModal.jsx
    WritePage.jsx        // the ruled-paper editor
    ReadOnlyViewer.jsx
    BottomNav.jsx
    SettingsScreen.jsx
  /db
    sqlite.js            // capacitor-sqlite init + jeep-sqlite web fallback
    entries.js           // CRUD functions against the entries table
  /styles
    paper.css             // ruled-page look, texture, ink colors
    typography.css
  App.jsx
  main.jsx
```
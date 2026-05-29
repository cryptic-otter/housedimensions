# Architecture — House Dimensions Hub

## Overview

A single-process local web app. There is no cloud component, no database, and no build step. The Node.js/Express server serves a single static HTML page and a small REST API, and persists everything to flat files on disk.

```
┌────────────────────────────────────────────────────────────┐
│ Browser (http://localhost:3000)                             │
│                                                              │
│   index.html  ── vanilla JS SPA                              │
│     • renders Home / Room / Measurement / Furniture views    │
│     • fetch() calls to /api/*                                │
│     • lightbox + modal forms, all client-side                │
└───────────────┬──────────────────────────────────────────────┘
                │  HTTP (JSON + multipart for uploads)
┌───────────────▼──────────────────────────────────────────────┐
│ server.js  (Node.js + Express)                               │
│                                                              │
│   • express.static(__dirname)   → serves index.html          │
│   • express.static(data/images) → serves /images/<file>      │
│   • /api/rooms ... REST endpoints (rooms, furniture, photos) │
│   • multer → writes uploads to data/images/                  │
│   • loadData()/saveData() → read/write data/data.json        │
└───────────────┬──────────────────────────────────────────────┘
                │  fs (synchronous read/write per mutation)
┌───────────────▼──────────────────────────────────────────────┐
│ Local filesystem                                             │
│   data/data.json    → all rooms + furniture + photo refs     │
│   data/images/*     → uploaded image files                   │
└────────────────────────────────────────────────────────────┘
```

## Components

### Front end (`index.html`)
- One file: HTML structure, embedded CSS, embedded JS.
- A minimal client-side router with four views: `home`, `room`, `measurement`, `furniture`. State is just `{ view, roomId, measurementId, furnitureId }`. Measurements are a drill-down level within a room, sitting between the room overview and furniture.
- The server is the single source of truth; the client re-fetches and re-renders after every mutation rather than holding a long-lived cache.
- UI: card/grid layout, modal form (shared between room and furniture create/edit), thumbnail photo grid, and a keyboard-navigable lightbox.

### Server (`server.js`)
- **Static serving:** the project root (for `index.html`) and `data/images/` (mounted at `/images`).
- **REST API:** rooms, measurements, furniture, and photos (see `README.md` for the full route table).
- **Uploads:** `multer` disk storage writes to `data/images/` with unique, collision-proof filenames (`<timestamp>-<random>.<ext>`). Accepts only `image/jpeg`, `image/png`, `image/webp`.
- **Persistence:** `loadData()` / `saveData()` read and write `data/data.json` on every mutation. The whole document is rewritten each time (simple and safe for a single-user local app).
- **First-run setup:** `ensureStorage()` creates `data/`, `data/images/`, and an empty `data.json` if they do not exist.
- **Cleanup on delete:** deleting a room or furniture item also unlinks the associated image files from disk; deleting a photo removes both the `data.json` reference and the file.

## Data flow examples

- **Add room:** client `POST /api/rooms` → server validates name, appends to `rooms`, `saveData()` → returns new room → client navigates to the new room view.
- **Upload photo:** client sends `multipart/form-data` → `multer` saves file(s) to `data/images/` → server pushes filename(s) into the item's `photos` array → `saveData()`.
- **Delete furniture:** server splices the item out of `room.furniture`, unlinks its photo files, `saveData()` → client returns to the parent room view.

## Deployment

None. The app is intended to run locally via `npm start` (`node server.js`) on the user's own machine. No CI/CD, no hosting provider.

## Notable decisions / trade-offs

- **Flat-file storage** over a database: zero setup, human-readable, portable. Fine for single-user scale.
- **Synchronous whole-file writes**: simplest correct approach for one user; not designed for concurrent writers.
- **Static serving of the project root** exposes `server.js`/`package.json` over HTTP. Acceptable because the app binds to localhost for personal use and the source is public on GitHub anyway.

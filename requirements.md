# House Dimensions Hub — Requirements

## Overview
A lightweight, locally-run personal reference hub for viewing and managing room dimensions, furniture measurements, and photos of your home. The app runs entirely on your machine (Node.js + HTML) with no cloud dependencies, giving you a single place to look up whether a new piece of furniture will fit in a given space.

## Users
Single user (personal use only). No authentication, sharing, or multi-user features needed in v1.

## Core Features

- **Room browser** — A list/grid of rooms. Clicking a room opens its detail view.
- **Room detail view** — Shows room dimensions (L × W × H), notes, and all photos for that room.
- **Furniture list per room** — Each room has a list of furniture/items, each with dimensions (L × W × H) and optional notes.
- **Furniture detail** — Click a furniture item to see its dimensions, notes, and associated photos.
- **Photo gallery** — Images attached to rooms or furniture items, displayed as thumbnails with a full-size view on click.
- **Add/edit/delete rooms** — Create new rooms, update their dimensions/notes, or remove them via the UI.
- **Add/edit/delete furniture** — Create new furniture items within a room, update specs, or delete them via the UI.
- **Photo upload** — Upload one or more images to a room or furniture item; images saved to a local `/images` folder on the server.
- **Nice-looking UI** — Clean, pleasant desktop layout — not bare-bones, not pixel-perfect. Enjoyable to open.

## Data Model (Draft)

**Room**
- `id` (string, unique)
- `name` (string) — e.g. "Living Room"
- `dimensions` — `{ length, width, height }` (numbers, in cm or inches — user's choice at entry)
- `notes` (string, optional)
- `photos` (array of image filenames)
- `furniture` (array of Furniture items)

**Furniture**
- `id` (string, unique)
- `name` (string) — e.g. "Grey Sofa"
- `dimensions` — `{ length, width, height }` (numbers)
- `notes` (string, optional)
- `photos` (array of image filenames)

All data persisted to `data/data.json` on the server. Images saved to `data/images/`.

## User Flows

**1. Browse a room and check a measurement**
1. Open the app in a browser (`http://localhost:3000`)
2. See a list of all rooms on the home page
3. Click a room (e.g. "Master Bedroom")
4. View room dimensions, notes, and photos
5. See list of furniture in that room; click an item to view its dimensions

**2. Add a new room**
1. From the home page, click "Add Room"
2. Enter room name, dimensions (L × W × H), and optional notes
3. Optionally upload one or more photos
4. Save — room appears in the room list

**3. Add furniture to a room**
1. Open a room's detail page
2. Click "Add Furniture"
3. Enter item name, dimensions, optional notes
4. Optionally upload photos
5. Save — item appears in the room's furniture list

**4. Edit or delete an item**
1. Open a room or furniture detail
2. Click "Edit" to update dimensions/notes/photos, or "Delete" to remove
3. Changes immediately reflected in the UI and persisted to `data.json`

## UI & UX Requirements

- **Device:** Desktop/laptop primary. Responsive is a nice-to-have but not required for v1.
- **Polish level:** Nice-looking — clean card/grid layout, legible typography, subtle hover states. Not bare HTML.
- **Photo display:** Thumbnail grid with click-to-enlarge (lightbox or modal).
- **Navigation:** Clear back-navigation between home → room → furniture.
- **No login/auth screen** — opens directly to the room list.

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Single-file HTML + vanilla CSS/JS | Lightweight, no build step, no framework dependency |
| Backend | Node.js + Express | Minimal server for static file serving, REST API, and image upload handling |
| Data storage | Local `data/data.json` | Simple, portable, human-readable — no database setup required |
| Image storage | Local `data/images/` folder | Images saved server-side via multer; served as static files |
| Deployment | Run locally via `node server.js` | No cloud, no CI/CD — just `npm start` on the user's machine |

## Out of Scope (v1)

- Authentication or user accounts
- Cloud deployment (Vercel, Supabase, etc.)
- Mobile-optimised / responsive layout
- Search or filter across rooms/furniture
- Import from URLs or product pages
- Sharing with others
- Floor plan diagrams or visual layouts

## Open Questions

- Should dimensions be stored in cm or inches? (Suggest: user can type whatever unit they like and include the unit in the notes field — no unit conversion logic in v1)
- Should photos be per-room only, or also per-furniture-item? (Requirements say both — confirm this is correct before build)
- Maximum file size / image type restrictions for uploads? (Suggest: accept common formats JPG/PNG/WEBP, no size limit enforced in v1)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```
npm install   # first time only
npm start     # starts at http://localhost:3000
```

If port 3000 is already in use:

```
npx kill-port 3000
```

There is no build step, no test suite, and no linter.

## Workflow — every change, no matter how small

1. **Create a Jira ticket** (project key: `HD`, cloud ID: `nickcunningham096.atlassian.net`) before or immediately after making the change. Transition it to Done when the work is complete.
2. **Commit and push to GitHub** (`https://github.com/cryptic-otter/housedimensions`, branch `main`). Always include the Jira ticket key in the commit message (e.g. `Fix label alignment (HD-20)`).
3. **Update `README.md`** if the change affects how the app is installed, run, or used.
4. **Update this `CLAUDE.md`** if the change affects architecture, key functions, or the dev workflow.

For comprehensive multi-feature upgrades, use the `fullstack-static-engineer` agent rather than editing inline.

## Architecture

The app has exactly two source files:

| File | Role |
|---|---|
| `server.js` | Node.js + Express: REST API, static file serving, image uploads via multer, data persistence |
| `index.html` | Single-page front end: all HTML, CSS, and vanilla JS in one file — no framework, no build |

`data/data.json` is the single source of truth. It is read fresh on every API call and written synchronously on every mutation. `data/images/` holds uploaded photos. Both are gitignored.

## server.js internals

- `ensureStorage()` — auto-creates `data/` and `data/images/` and seeds an empty `data.json` on first run.
- `loadData()` / `saveData()` — synchronous JSON read/write. Every mutation calls both.
- `parseDimensions(body)` — normalises `length`, `width`, `height` from a request body into numbers or `null`.
- `deleteImageFiles(filenames)` — async unlinks image files from disk; silently ignores missing files. Called on every delete (room, furniture, or photo).
- Multer is configured to accept only `image/jpeg`, `image/png`, `image/webp`. Files land in `data/images/` with a `<timestamp>-<randomHex><ext>` filename.
- Port defaults to `3000`; override with `PORT` env var.

## index.html internals

The front end is a client-side SPA with four views (`home`, `room`, `measurement`, `furniture`) controlled by a tiny `state` object: `{ view, roomId, measurementId, furnitureId }`. All rendering is done by building HTML strings and setting `innerHTML`.

**Key functions:**

| Function | What it does |
|---|---|
| `render()` | Dispatches to `renderHome`, `renderRoom`, `renderMeasurement`, or `renderFurniture` based on `state.view` |
| `renderHome(view)` | Fetches `/api/rooms`, renders the room card grid |
| `renderRoom(view)` | Fetches `/api/rooms/:roomId`, renders room detail + measurements list + furniture list |
| `renderMeasurement(view)` | Fetches the parent room, finds the measurement by `state.measurementId`, renders detail (sits between room and furniture) |
| `renderFurniture(view)` | Fetches the parent room, finds the furniture item by `state.furnitureId`, renders detail |
| `dimText(d)` | Formats a dimensions object as `L: 80 × W: 12 × H: 29`; skips blank values; used on cards |
| `dimPills(d)` | Formats dimensions as labelled pill badges (`Length: 80` etc.); used on detail pages |
| `photoSection(kind, photos)` | Renders the file input + thumbnail grid for rooms, measurements, and furniture. Selecting a file auto-uploads immediately (no Upload button) via an `onchange` handler calling `uploadPhotos(kind)` |
| `uploadPhotos(kind)` | Builds a `FormData`, POSTs to the correct photo endpoint for the current view, shows a spinner while in flight, then re-renders |
| `openRoomForm(room?)` / `openMeasurementForm(item?)` / `openFurnitureForm(item?)` | Opens the shared modal form; pre-fills if editing |
| `jsArg(obj)` | Encodes an object as a URL-safe inline `onclick` argument (avoids quote escaping issues) |

## Data model (`data.json`)

```
{
  "rooms": [
    {
      "id": "<hex>",
      "name": "Living Room",
      "dimensions": { "length": 5, "width": 4, "height": 2.5 },
      "notes": "",
      "photos": ["<filename>.jpg"],
      "measurements": [
        {
          "id": "<hex>",
          "name": "Front Doorway",
          "dimensions": { "length": 2.1, "width": 0.9, "height": null },
          "notes": "",
          "photos": []
        }
      ],
      "furniture": [
        {
          "id": "<hex>",
          "name": "Sofa",
          "dimensions": { "length": 2.1, "width": 0.9, "height": 0.8 },
          "notes": "",
          "photos": []
        }
      ]
    }
  ]
}
```

Dimension values are numbers or `null` (never strings). Any dimension key can be `null` if not entered.

`measurements` is an embedded array on each room (same shape as `furniture`), capturing named architectural elements. It sits between the room overview and furniture in the UI. Deleting a room cascades photo cleanup over room, measurement, and furniture photos.

**Measurement API endpoints** (mirror the furniture routes, server-side helper `findMeasurement`):

```
POST   /api/rooms/:roomId/measurements
PUT    /api/rooms/:roomId/measurements/:measurementId
DELETE /api/rooms/:roomId/measurements/:measurementId
POST   /api/rooms/:roomId/measurements/:measurementId/photos
DELETE /api/rooms/:roomId/measurements/:measurementId/photos/:filename
```

## Jira reference

- **Project:** `HD` — `https://nickcunningham096.atlassian.net/jira/software/projects/HD/boards/133`
- **Cloud ID:** `nickcunningham096.atlassian.net`
- **Transition IDs:** To Do `11` · In Progress `21` · In Review `31` · Done `41`
- Parent epics: `HD-1` (Server), `HD-2` (Rooms), `HD-3` (Furniture), `HD-4` (Photos)

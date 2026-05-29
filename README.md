# House Dimensions Hub

A lightweight, locally-run personal hub for tracking the dimensions of your **rooms** and **furniture**, with **photos** attached to each. Built so you can quickly check whether a new piece of furniture will fit in a given space — all running on your own machine, no cloud, no accounts.

## What it does

- Browse all your rooms as cards (name + dimensions at a glance).
- Open a room to see its dimensions, notes, photos, and the furniture inside it.
- Open a furniture item to see its dimensions, notes, and photos.
- Add / edit / delete rooms and furniture.
- Upload photos (JPG / PNG / WEBP) to rooms and furniture, view them in a thumbnail grid, click to enlarge with prev/next navigation, and delete individual photos.
- Everything is saved locally — your data survives restarts.

## Tech stack

| Layer | Choice |
|---|---|
| Front end | Single-file `index.html` (vanilla HTML/CSS/JS, no build step) |
| Backend | Node.js + Express |
| Uploads | `multer` (disk storage) |
| Data | Local `data/data.json` (read/written on every change) |
| Images | Local `data/images/` folder, served at `/images/<filename>` |

## Install

You need [Node.js](https://nodejs.org/) (v18 or newer recommended).

```bash
npm install
```

## Run

```bash
npm start
```

Then open **http://localhost:3000** in your browser.

On first run the app automatically creates:

- `data/` and an empty `data/data.json`
- `data/images/` for uploaded photos

> Your `data/data.json` and uploaded images are **not** committed to git (see `.gitignore`) — they stay private on your machine.

## Project structure

```
housedimensions/
├── server.js        # Express server: REST API, static serving, uploads, persistence
├── index.html       # Single-page front end (HTML + CSS + JS)
├── package.json
├── data/
│   ├── data.json    # auto-created; your rooms + furniture (gitignored)
│   └── images/      # auto-created; uploaded photos (gitignored)
└── docs/
    ├── ARCHITECTURE.md
    └── DATA_MODEL.md
```

## API summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/rooms` | List rooms |
| GET | `/api/rooms/:roomId` | Get one room (with furniture + photos) |
| POST | `/api/rooms` | Create a room |
| PUT | `/api/rooms/:roomId` | Update a room |
| DELETE | `/api/rooms/:roomId` | Delete a room (+ its furniture + photos) |
| POST | `/api/rooms/:roomId/furniture` | Add furniture to a room |
| PUT | `/api/rooms/:roomId/furniture/:furnitureId` | Update furniture |
| DELETE | `/api/rooms/:roomId/furniture/:furnitureId` | Delete furniture (+ its photos) |
| POST | `/api/rooms/:roomId/photos` | Upload photo(s) to a room |
| POST | `/api/rooms/:roomId/furniture/:furnitureId/photos` | Upload photo(s) to furniture |
| DELETE | `/api/rooms/:roomId/photos/:filename` | Delete a room photo |
| DELETE | `/api/rooms/:roomId/furniture/:furnitureId/photos/:filename` | Delete a furniture photo |

## License

MIT

# Data Model — House Dimensions Hub

All application data lives in a single JSON file: **`data/data.json`**. Uploaded image files live in **`data/images/`**; `data.json` stores only their filenames, not the binary data.

## Top-level shape

```json
{
  "rooms": [ Room, Room, ... ]
}
```

`data.json` is created automatically on first run as `{ "rooms": [] }`.

## Room

```json
{
  "id": "a1b2c3d4e5f6a7b8",
  "name": "Living Room",
  "dimensions": { "length": 5.2, "width": 4.0, "height": 2.5 },
  "notes": "Measurements in metres.",
  "photos": ["1716998400000-ab12cd34.jpg"],
  "measurements": [ Measurement, ... ],
  "furniture": [ Furniture, ... ]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique. Generated server-side (`crypto.randomBytes(8).toString('hex')`). |
| `name` | string | **Required.** Trimmed; empty names are rejected. |
| `dimensions` | object | `{ length, width, height }`. Each is a `number` or `null` if left blank. No unit conversion — the user records units in `notes`. |
| `notes` | string | Optional free text. |
| `photos` | string[] | Filenames stored in `data/images/`. Served at `/images/<filename>`. |
| `measurements` | Measurement[] | Named architectural elements belonging to this room (embedded). Sits between the room overview and furniture. |
| `furniture` | Furniture[] | Items belonging to this room (embedded, not a separate collection). |

## Measurement

Embedded inside a room's `measurements` array. Captures a named architectural element (doorway, window, wall, hallway, etc.). Same shape as Furniture.

```json
{
  "id": "5c4d3e2f1a0b9c8d",
  "name": "Front Doorway",
  "dimensions": { "length": 2.1, "width": 0.9, "height": null },
  "notes": "Oak frame.",
  "photos": ["1716998600000-ij90kl12.webp"]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique within the app. Server-generated. |
| `name` | string | **Required.** Trimmed; empty names are rejected. |
| `dimensions` | object | `{ length, width, height }`, numbers or `null`. |
| `notes` | string | Optional free text. |
| `photos` | string[] | Filenames stored in `data/images/`. |

## Furniture

Embedded inside a room's `furniture` array.

```json
{
  "id": "9f8e7d6c5b4a3210",
  "name": "Grey Sofa",
  "dimensions": { "length": 2.1, "width": 0.9, "height": 0.8 },
  "notes": "Reupholstered 2024.",
  "photos": ["1716998500000-ef56gh78.png"]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique within the app. Server-generated. |
| `name` | string | **Required.** Trimmed; empty names are rejected. |
| `dimensions` | object | `{ length, width, height }`, numbers or `null`. |
| `notes` | string | Optional free text. |
| `photos` | string[] | Filenames stored in `data/images/`. |

## Image files (`data/images/`)

- Files are named `<timestamp>-<16hexchars>.<ext>` (e.g. `1716998400000-ab12cd34.jpg`) to guarantee uniqueness.
- Accepted upload types: `image/jpeg`, `image/png`, `image/webp`.
- A filename is referenced from exactly one `photos` array (a room's, a measurement's, or a furniture item's).

## Lifecycle / referential integrity

- **Delete a room** → the room is removed from `rooms`, and every image file referenced by the room, all its measurements, *and* all its furniture is unlinked from `data/images/`.
- **Delete a measurement** → it is removed from its room's `measurements` array and its image files are unlinked.
- **Delete a furniture item** → it is removed from its room's `furniture` array and its image files are unlinked.
- **Delete a photo** → the filename is removed from the relevant `photos` array and the file is unlinked from `data/images/`.
- Every create / update / delete rewrites the whole `data.json` immediately, so on-disk state always matches the in-memory result of the operation.

## Persistence notes

- `data/data.json` and `data/images/*` are **gitignored** — they are per-machine user data, not source.
- The repo ships an empty `data/images/.gitkeep` so the directory exists after clone; the server also recreates it on first run if missing.

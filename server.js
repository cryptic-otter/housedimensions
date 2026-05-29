/**
 * House Dimensions Hub — local server
 *
 * Node.js + Express server that:
 *  - serves the single-page front end (index.html)
 *  - exposes a REST API for rooms, furniture and photos
 *  - persists all data to data/data.json (read/written on every mutation)
 *  - stores uploaded images in data/images/ and serves them at /images/<filename>
 *
 * Run with:  npm start   (or: node server.js)
 * App URL:   http://localhost:3000
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Paths & first-run setup
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Auto-create data/ and data/images/ on first run; seed an empty data.json.
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ rooms: [] }, null, 2));
  }
}
ensureStorage();

// ---------------------------------------------------------------------------
// Data persistence helpers (data.json is the single source of truth)
// ---------------------------------------------------------------------------
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rooms)) return { rooms: [] };
    return parsed;
  } catch (err) {
    // Corrupt or missing file — fall back to an empty structure rather than crash.
    console.error('Could not read data.json, starting empty:', err.message);
    return { rooms: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function newId() {
  return crypto.randomBytes(8).toString('hex');
}

// Remove image files from disk; ignore files that are already gone.
function deleteImageFiles(filenames) {
  (filenames || []).forEach((name) => {
    if (!name) return;
    // Guard against path traversal — only operate on the bare basename.
    const safe = path.basename(name);
    const filePath = path.join(IMAGES_DIR, safe);
    fs.promises.unlink(filePath).catch(() => {
      /* file may already be gone — that is fine */
    });
  });
}

// ---------------------------------------------------------------------------
// Upload handling (multer)
// ---------------------------------------------------------------------------
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${newId()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG and WEBP images are allowed.'));
  },
});

// ---------------------------------------------------------------------------
// App + middleware
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

// Serve the front end (index.html) and uploaded images as static files.
// index.html lives in the project root alongside server.js.
app.use(express.static(__dirname, { index: 'index.html', extensions: ['html'] }));
app.use('/images', express.static(IMAGES_DIR));

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------
function findRoom(data, roomId) {
  return data.rooms.find((r) => r.id === roomId);
}
function findFurniture(room, furnitureId) {
  return (room.furniture || []).find((f) => f.id === furnitureId);
}
function findMeasurement(room, measurementId) {
  return (room.measurements || []).find((m) => m.id === measurementId);
}

// Normalise dimension input into { length, width, height } numbers (or null).
function parseDimensions(body) {
  const toNum = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    length: toNum(body.length),
    width: toNum(body.width),
    height: toNum(body.height),
  };
}

// ===========================================================================
// ROOM ENDPOINTS
// ===========================================================================

// List all rooms
app.get('/api/rooms', (req, res) => {
  res.json(loadData().rooms);
});

// Get a single room (with its furniture and photos)
app.get('/api/rooms/:roomId', (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  res.json(room);
});

// Create a room
app.post('/api/rooms', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Room name is required.' });

  const data = loadData();
  const room = {
    id: newId(),
    name,
    dimensions: parseDimensions(req.body),
    notes: (req.body.notes || '').trim(),
    photos: [],
    furniture: [],
  };
  data.rooms.push(room);
  saveData(data);
  res.status(201).json(room);
});

// Update a room
app.put('/api/rooms/:roomId', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Room name is required.' });

  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  room.name = name;
  room.dimensions = parseDimensions(req.body);
  room.notes = (req.body.notes || '').trim();
  saveData(data);
  res.json(room);
});

// Delete a room (and all its furniture + photos)
app.delete('/api/rooms/:roomId', (req, res) => {
  const data = loadData();
  const idx = data.rooms.findIndex((r) => r.id === req.params.roomId);
  if (idx === -1) return res.status(404).json({ error: 'Room not found.' });

  const [room] = data.rooms.splice(idx, 1);

  // Collect every image attached to the room, its furniture, and its
  // measurements, then remove them.
  const allPhotos = [...(room.photos || [])];
  (room.furniture || []).forEach((f) => allPhotos.push(...(f.photos || [])));
  (room.measurements || []).forEach((m) => allPhotos.push(...(m.photos || [])));
  deleteImageFiles(allPhotos);

  saveData(data);
  res.json({ ok: true });
});

// ===========================================================================
// FURNITURE ENDPOINTS
// ===========================================================================

// Create furniture within a room
app.post('/api/rooms/:roomId/furniture', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Furniture name is required.' });

  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  if (!Array.isArray(room.furniture)) room.furniture = [];
  const item = {
    id: newId(),
    name,
    dimensions: parseDimensions(req.body),
    notes: (req.body.notes || '').trim(),
    photos: [],
  };
  room.furniture.push(item);
  saveData(data);
  res.status(201).json(item);
});

// Update furniture
app.put('/api/rooms/:roomId/furniture/:furnitureId', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Furniture name is required.' });

  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  const item = findFurniture(room, req.params.furnitureId);
  if (!item) return res.status(404).json({ error: 'Furniture not found.' });

  item.name = name;
  item.dimensions = parseDimensions(req.body);
  item.notes = (req.body.notes || '').trim();
  saveData(data);
  res.json(item);
});

// Delete furniture (and its photos)
app.delete('/api/rooms/:roomId/furniture/:furnitureId', (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const idx = (room.furniture || []).findIndex((f) => f.id === req.params.furnitureId);
  if (idx === -1) return res.status(404).json({ error: 'Furniture not found.' });

  const [item] = room.furniture.splice(idx, 1);
  deleteImageFiles(item.photos);
  saveData(data);
  res.json({ ok: true });
});

// ===========================================================================
// MEASUREMENT ENDPOINTS
// ===========================================================================

// Create a measurement within a room
app.post('/api/rooms/:roomId/measurements', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Measurement name is required.' });

  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  if (!Array.isArray(room.measurements)) room.measurements = [];
  const item = {
    id: newId(),
    name,
    dimensions: parseDimensions(req.body),
    notes: (req.body.notes || '').trim(),
    photos: [],
  };
  room.measurements.push(item);
  saveData(data);
  res.status(201).json(item);
});

// Update a measurement
app.put('/api/rooms/:roomId/measurements/:measurementId', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Measurement name is required.' });

  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  const item = findMeasurement(room, req.params.measurementId);
  if (!item) return res.status(404).json({ error: 'Measurement not found.' });

  item.name = name;
  item.dimensions = parseDimensions(req.body);
  item.notes = (req.body.notes || '').trim();
  saveData(data);
  res.json(item);
});

// Delete a measurement (and its photos)
app.delete('/api/rooms/:roomId/measurements/:measurementId', (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const idx = (room.measurements || []).findIndex((m) => m.id === req.params.measurementId);
  if (idx === -1) return res.status(404).json({ error: 'Measurement not found.' });

  const [item] = room.measurements.splice(idx, 1);
  deleteImageFiles(item.photos);
  saveData(data);
  res.json({ ok: true });
});

// ===========================================================================
// PHOTO ENDPOINTS
// ===========================================================================

// Upload one or more photos to a room
app.post('/api/rooms/:roomId/photos', upload.array('photos'), (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) {
    deleteImageFiles((req.files || []).map((f) => f.filename));
    return res.status(404).json({ error: 'Room not found.' });
  }
  if (!Array.isArray(room.photos)) room.photos = [];
  const added = (req.files || []).map((f) => f.filename);
  room.photos.push(...added);
  saveData(data);
  res.status(201).json({ photos: room.photos, added });
});

// Upload one or more photos to a furniture item
app.post('/api/rooms/:roomId/furniture/:furnitureId/photos', upload.array('photos'), (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  const item = room && findFurniture(room, req.params.furnitureId);
  if (!item) {
    deleteImageFiles((req.files || []).map((f) => f.filename));
    return res.status(404).json({ error: 'Furniture not found.' });
  }
  if (!Array.isArray(item.photos)) item.photos = [];
  const added = (req.files || []).map((f) => f.filename);
  item.photos.push(...added);
  saveData(data);
  res.status(201).json({ photos: item.photos, added });
});

// Upload one or more photos to a measurement
app.post('/api/rooms/:roomId/measurements/:measurementId/photos', upload.array('photos'), (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  const item = room && findMeasurement(room, req.params.measurementId);
  if (!item) {
    deleteImageFiles((req.files || []).map((f) => f.filename));
    return res.status(404).json({ error: 'Measurement not found.' });
  }
  if (!Array.isArray(item.photos)) item.photos = [];
  const added = (req.files || []).map((f) => f.filename);
  item.photos.push(...added);
  saveData(data);
  res.status(201).json({ photos: item.photos, added });
});

// Delete a photo from a room
app.delete('/api/rooms/:roomId/photos/:filename', (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const filename = req.params.filename;
  room.photos = (room.photos || []).filter((p) => p !== filename);
  deleteImageFiles([filename]);
  saveData(data);
  res.json({ ok: true, photos: room.photos });
});

// Delete a photo from a furniture item
app.delete('/api/rooms/:roomId/furniture/:furnitureId/photos/:filename', (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  const item = room && findFurniture(room, req.params.furnitureId);
  if (!item) return res.status(404).json({ error: 'Furniture not found.' });

  const filename = req.params.filename;
  item.photos = (item.photos || []).filter((p) => p !== filename);
  deleteImageFiles([filename]);
  saveData(data);
  res.json({ ok: true, photos: item.photos });
});

// Delete a photo from a measurement
app.delete('/api/rooms/:roomId/measurements/:measurementId/photos/:filename', (req, res) => {
  const data = loadData();
  const room = findRoom(data, req.params.roomId);
  const item = room && findMeasurement(room, req.params.measurementId);
  if (!item) return res.status(404).json({ error: 'Measurement not found.' });

  const filename = req.params.filename;
  item.photos = (item.photos || []).filter((p) => p !== filename);
  deleteImageFiles([filename]);
  saveData(data);
  res.json({ ok: true, photos: item.photos });
});

// ---------------------------------------------------------------------------
// Error handling (covers multer file-type rejections)
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(PORT, () => {
  console.log(`House Dimensions Hub running at http://localhost:${PORT}`);
});

# How to Use House Dimensions Hub

## Starting the app

1. Open a terminal and navigate to the project folder:
   ```
   cd "C:\Users\nick2\OneDrive\Documents\Claude\Projects\housedimensions"
   ```
2. Install dependencies (first time only):
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open **http://localhost:3000** in your browser.

Leave the terminal open while you're using the app — closing it stops the server.

---

## Managing rooms

- **Home page** shows all your rooms as cards. Each card displays the room name and dimensions at a glance.
- **Add a room** — click "Add Room", fill in the name (required), length/width/height, and any notes, then save.
- **Open a room** — click its card to see the full detail view: dimensions, notes, photos, and all furniture inside it.
- **Edit a room** — from the room detail page, click "Edit". The form pre-fills with current values. Save when done.
- **Delete a room** — click "Delete" on the room detail page. You'll be asked to confirm. This removes the room, all its furniture, and all its photos permanently.

---

## Managing furniture

Furniture lives inside a room — open a room first, then:

- **Add furniture** — click "Add Furniture", enter the name, dimensions, and notes.
- **Open a furniture item** — click it in the room's furniture list to see its detail page.
- **Edit / Delete** — same pattern as rooms. Deleting furniture removes it and any photos attached to it.

---

## Photos

Photos can be attached to both rooms and furniture items.

- **Upload** — on any room or furniture detail page, use the photo upload control. Accepts JPG, PNG, and WEBP. Multiple files can be uploaded at once.
- **View full size** — click any thumbnail to open it in a lightbox. Use the prev/next arrows (or arrow keys) to navigate between photos.
- **Delete a photo** — click the **×** on a thumbnail. Confirms before deleting, then removes it from the gallery and from disk.

---

## Your data

- Everything is saved automatically to `data/data.json` — no manual saving needed.
- Photos are stored in `data/images/`.
- Both are private to your machine and not synced to GitHub.
- If you stop and restart the server, all your rooms, furniture, and photos will still be there.

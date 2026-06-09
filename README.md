# QR Attendance

A lightweight attendance tracker that uses QR codes. Workers scan a QR code on their phone; the app records the scan against a contract, team, and workday. Built with React + Vite on the frontend and an Express + SQLite backend.

## Features

- Generate per-session QR codes tied to a contract / team / week / day
- Scan QR codes via phone camera (HTML5)
- Upload and store attendance photos
- Toolbox meeting attendance sheet view
- Data persisted in a local SQLite database

## Project Structure

```
.
├── server/
│   ├── index.js        # Express entry point
│   ├── db.js           # SQLite setup (better-sqlite3)
│   └── routes/
│       ├── data.js     # Attendance CRUD routes  (/api/*)
│       └── upload.js   # Image upload route       (/api/images)
├── src/                # React + Vite frontend
├── data/               # SQLite database files (auto-created)
├── uploads/            # Uploaded images        (auto-created)
├── dist/               # Vite production build  (auto-created)
├── Dockerfile
└── docker-compose.yml
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3001`  | Port the Express server listens on |

Create a `.env` file in the project root to override defaults:

```
PORT=4001
```

---

## Option 1 — Run with Node.js

### Prerequisites

- Node.js 18+ and npm

### Development (hot-reload frontend + backend separately)

```bash
# 1. Install dependencies
npm install

# 2. In one terminal — start the Vite dev server (frontend, port 5173)
npm run dev

# 3. In another terminal — start the Express API server (port from .env or 3001)
npm run server
```

The Vite dev server runs on port **5299** and proxies `/api` and `/uploads` to `http://localhost:4001`, so make sure `PORT=4001` is set in your `.env` (it is by default).

### Production (serve everything from Express)

```bash
# 1. Install dependencies
npm install

# 2. Build the frontend
npm run build

# 3. Start the server (serves built frontend + API on one port)
npm start
```

Open [http://localhost:4001](http://localhost:4001) (or whatever `PORT` is set to).

---

## Option 2 — Run with Docker

### Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)

### Using Docker Compose (recommended)

```bash
# Build and start (runs on http://localhost:4001)
docker compose up --build

# Run in the background
docker compose up --build -d

# Stop
docker compose down
```

The `data/` and `uploads/` directories are mounted as volumes so your database and images survive container restarts.

### Using Docker directly

```bash
# Build the image
docker build -t qr-attendance .

# Run it
docker run -p 4001:3001 \
  -v "$(pwd)/data:/app/data" \
  -v "$(pwd)/uploads:/app/uploads" \
  qr-attendance
```

Open [http://localhost:4001](http://localhost:4001).

---

## Database

SQLite is used for zero-config persistence. The database file lives at `data/attendance.db` and is created automatically on first run. Two tables are managed:

- **`days`** — attendance records keyed by `(contract, team_no, week_key, day)`
- **`images`** — references to uploaded photo files

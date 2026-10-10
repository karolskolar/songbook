# Songbook

A web-based songbook application for guitarists to manage songs with lyrics, chords, and custom chord diagrams.

## Features

- **Bracket notation** for chords: `[Am]ako víno žiari` → renders chords inline with lyrics
- **Auto-detect sections vs chords**: `[Verse]` vs `[Am]`
- **Custom chord library**: Define your own chord fingerings with visual editor
- **Multiple voicings**: Store different voicings per chord, select per-song
- **Transposition**: Transpose all chords in a song by semitones
- **PDF Export**: Export songs to PDF for iPad viewing
- **Cloud sync**: Backend database for access across devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: SQLite (easily replaceable with PostgreSQL)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
cd songbook

# Install backend dependencies
cd backend
npm install
cp .env.example .env   # then set DATABASE_URL, APP_USERNAME, APP_PASSWORD
npx prisma db push
npx prisma generate

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

In two separate terminals:

```bash
# Terminal 1: Start backend
cd backend
npm run dev
# Runs on http://localhost:3010

# Terminal 2: Start frontend
cd frontend
npm run dev
# Runs on http://localhost:5180 (proxies /api to the backend)
```

### Usage

1. **Add Chords**: Go to the Chords tab and create chord definitions with the visual editor
2. **Create Songs**: Go to Songs and click "Add Song"
3. **Write Lyrics**: Use bracket notation:
   - `[Verse]` - Section headers
   - `[Am]` - Chord annotations (renders inline with lyrics)
4. **Transpose**: Use the +/- buttons to shift all chords
5. **Export PDF**: Click "Export PDF" on any song view

### Example Song Format

```
[Verse]
[Am]ako víno žiari chutí ako v ústach [C]med
[Am]Ak ju nosíš v tvári krajšej tváre [C]niet

[Chorus]
Na zdravie!
```

## Project Structure

```
songbook/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Route pages
│   │   ├── hooks/      # React hooks
│   │   ├── utils/      # Utilities (parser, transpose, PDF)
│   │   ├── api/        # API client
│   │   └── types/      # TypeScript types
│   └── ...
├── backend/            # Express API server
│   ├── src/
│   │   ├── routes/     # API routes
│   │   └── db.ts       # Database connection
│   ├── prisma/         # Database schema
│   └── ...
└── README.md
```

## API Endpoints

### Songs
- `GET /api/songs` - List all songs
- `GET /api/songs/:id` - Get a song
- `POST /api/songs` - Create a song
- `PUT /api/songs/:id` - Update a song
- `DELETE /api/songs/:id` - Delete a song

### Chords
- `GET /api/chords` - List all chords
- `GET /api/chords/:id` - Get a chord
- `GET /api/chords/name/:name` - Get all voicings for a chord name
- `POST /api/chords` - Create a chord
- `PUT /api/chords/:id` - Update a chord
- `DELETE /api/chords/:id` - Delete a chord

## Authentication

The app has a single login, configured with environment variables on the backend:

- `APP_USERNAME`, `APP_PASSWORD`: the login credentials. The server refuses to start without them.
- `SESSION_SECRET`: signs the session cookie. Required (the server refuses to start without it); generate one with `openssl rand -hex 32`.
- `TRUST_PROXY`: the reverse proxy IP(s) whose `X-Forwarded-For` header is trusted for the client IP (default: loopback). In production this is the Nginx Proxy Manager IP, `192.168.100.103`.

After logging in, the session lasts 30 days in an HttpOnly cookie. After 10 failed login attempts from one IP, logins from it are blocked for 15 minutes.

## Deployment

In production the backend runs as one Node process: it serves both the API and the built frontend (`NODE_ENV=production`).

**Production setup**

| What | Where |
|---|---|
| Host | LXC on Proxmox (`lisa`), Debian, Node 22 LTS |
| Code | `/opt/songbook` |
| Database | `/var/lib/songbook/songbook.db` |
| Config | `/etc/songbook.env` (mode 600; same variables as `backend/.env.example`, plus `NODE_ENV=production`) |
| Service | systemd unit `songbook` (`deploy/songbook.service`) |
| Public URL | `https://songbook.skolar.sk`, served via Nginx Proxy Manager (Let's Encrypt) → `http://<lxc-ip>:3010` |

**Deploying a new version**

```bash
deploy/deploy.sh
```

The script syncs the code, runs `npm ci`, `prisma generate`, `prisma db push` and both builds, then restarts the service. It connects to the SSH alias `songbook`, which must exist in `~/.ssh/config`:

```
Host songbook
	HostName 192.168.100.110
	User root
	ProxyJump lisa-root
	IdentityFile ~/.ssh/id_rsa_4096
```

Set `DEPLOY_HOST` to deploy to a different target.

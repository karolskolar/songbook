# Songbook

Web songbook for guitarists: lyrics with inline bracket chords (`[Am]text`), a custom chord-diagram library, transposition and PDF export. Single-user login. Live at https://songbook.skolar.sk.

## Tech Stack
- Frontend: React 19, TypeScript, Vite 7, Tailwind 4, React Router 7, @react-pdf/renderer
- Backend: Express 5, Prisma 7 (libsql adapter), SQLite
- No test suite; verify with `tsc`, `eslint` and API calls (curl with a login cookie)

## Project Structure
- `frontend/src/components/SongView.tsx`: song page (lyrics, chord diagrams, chord add/edit/remove)
- `frontend/src/utils/chordParser.ts`: `extractChords` (chords in lyrics), `getSongChords` (lyrics + extra chords)
- `backend/src/routes/`: `songs.ts`, `chords.ts`; `backend/src/auth.ts`: login, session cookie, rate limit
- `backend/prisma/schema.prisma`: `Song`, `ChordDefinition`
- `deploy/`: `deploy.sh` and the systemd unit

## Development
```bash
cd backend && npm run dev    # http://localhost:3010 (tsx watch)
cd frontend && npm run dev   # http://localhost:5180, proxies /api to the backend
cd frontend && npx tsc -b --noEmit && npx eslint src
cd backend && npx tsc --noEmit
deploy/deploy.sh             # deploy to production (see README)
```
No migrations: schema changes go through `prisma db push` (deploy.sh runs it). New columns need a `@default`.

## Learnings
- **Chords are a global library**, not per-song. A song's chord list = chords in the lyrics + `Song.extraChords` (added via "+ Add Chord"). `extraChords`, `chordOrder` and `selectedVoicings` are JSON strings in SQLite, parsed in `routes/songs.ts`.
- `extraChords` are stored in the song's original key; convert with `transposeChord(name, -transposition)` before saving.
- Chord diagrams are looked up by name (`chords.find(c => c.name === …)`), so duplicate definitions of the same name hide each other. Editing must use the update API, never create.
- `chordsApi.update` sends `undefined` fields as `null` so cleared capo/barre/voicing actually clear. The backend PUT ignores missing fields.
- `transposeChord` only handles A–G; chords on `H` (Czech B) are not transposed.
- **`deploy.sh` rsyncs the working tree, not a commit**, so uncommitted changes go to production too. Commit before deploying.
- Production: LXC `192.168.100.110` (SSH alias `songbook`), config in `/etc/songbook.env`, DB `/var/lib/songbook/songbook.db`. Nginx Proxy Manager is `192.168.100.103`.
- Auth: `SESSION_SECRET` is always required (no fallback). `TRUST_PROXY` lists the proxies whose `X-Forwarded-For` is trusted (default loopback; production = NPM IP). If NPM's IP changes, update `TRUST_PROXY`, or the login rate limit will treat every client as the proxy's one IP.
- The server has no `tcpdump`; use `ss -tn state all` to see proxy peers. macOS has no `timeout` command.

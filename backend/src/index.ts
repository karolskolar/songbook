import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { connectDb, disconnectDb } from './db.js';
import { assertAuthConfigured, authRouter, requireAuth } from './auth.js';
import songsRouter from './routes/songs.js';
import chordsRouter from './routes/chords.js';

const app = express();
const PORT = Number(process.env.PORT) || 3010;
const HOST = process.env.HOST || '0.0.0.0';

// Trust X-Forwarded-* (client IP, HTTPS) only from the reverse proxy (Nginx Proxy Manager),
// so direct clients can't spoof their IP to get around the login rate limit
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/songs', requireAuth, songsRouter);
app.use('/api/chords', requireAuth, chordsRouter);

// In production the backend also serves the built frontend (single process, single port)
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(process.env.FRONTEND_DIST || '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

async function start() {
  try {
    assertAuthConfigured();
    await connectDb();
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await disconnectDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDb();
  process.exit(0);
});

start();

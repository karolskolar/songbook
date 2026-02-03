import express from 'express';
import cors from 'cors';
import { connectDb, disconnectDb } from './db.js';
import songsRouter from './routes/songs.js';
import chordsRouter from './routes/chords.js';

const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());

app.use('/api/songs', songsRouter);
app.use('/api/chords', chordsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
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

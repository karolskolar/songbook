import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const songs = await prisma.song.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    const formatted = songs.map(song => ({
      ...song,
      selectedVoicings: JSON.parse(song.selectedVoicings),
      chordOrder: JSON.parse(song.chordOrder),
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ message: 'Failed to fetch songs' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
    });
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json({
      ...song,
      selectedVoicings: JSON.parse(song.selectedVoicings),
      chordOrder: JSON.parse(song.chordOrder),
    });
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ message: 'Failed to fetch song' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, artist, content, selectedVoicings, chordOrder, transposition } = req.body;
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        content,
        selectedVoicings: JSON.stringify(selectedVoicings || {}),
        chordOrder: JSON.stringify(chordOrder || []),
        transposition: transposition || 0,
      },
    });
    res.status(201).json({
      ...song,
      selectedVoicings: JSON.parse(song.selectedVoicings),
      chordOrder: JSON.parse(song.chordOrder),
    });
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({ message: 'Failed to create song' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, artist, content, selectedVoicings, chordOrder, transposition } = req.body;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (artist !== undefined) updateData.artist = artist;
    if (content !== undefined) updateData.content = content;
    if (selectedVoicings !== undefined) updateData.selectedVoicings = JSON.stringify(selectedVoicings);
    if (chordOrder !== undefined) updateData.chordOrder = JSON.stringify(chordOrder);
    if (transposition !== undefined) updateData.transposition = transposition;

    const song = await prisma.song.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({
      ...song,
      selectedVoicings: JSON.parse(song.selectedVoicings),
      chordOrder: JSON.parse(song.chordOrder),
    });
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ message: 'Failed to update song' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.song.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ message: 'Failed to delete song' });
  }
});

export default router;

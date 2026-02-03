import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

function parseChord(chord: {
  id: string;
  name: string;
  voicingName: string | null;
  strings: string;
  fingers: string;
  baseFret: number;
  barreString: number | null;
  barreSpan: string | null;
  capoFret: number | null;
  capoSpan: string | null;
  createdAt: Date;
}) {
  return {
    id: chord.id,
    name: chord.name,
    voicingName: chord.voicingName,
    strings: JSON.parse(chord.strings),
    fingers: JSON.parse(chord.fingers),
    baseFret: chord.baseFret,
    barreString: chord.barreString,
    barreSpan: chord.barreSpan ? JSON.parse(chord.barreSpan) : null,
    capoFret: chord.capoFret,
    capoSpan: chord.capoSpan ? JSON.parse(chord.capoSpan) : null,
    createdAt: chord.createdAt.toISOString(),
  };
}

router.get('/', async (req, res) => {
  try {
    const chords = await prisma.chordDefinition.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(chords.map(parseChord));
  } catch (error) {
    console.error('Error fetching chords:', error);
    res.status(500).json({ message: 'Failed to fetch chords' });
  }
});

router.get('/name/:name', async (req, res) => {
  try {
    const chords = await prisma.chordDefinition.findMany({
      where: { name: req.params.name },
      orderBy: { voicingName: 'asc' },
    });
    res.json(chords.map(parseChord));
  } catch (error) {
    console.error('Error fetching chords by name:', error);
    res.status(500).json({ message: 'Failed to fetch chords' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const chord = await prisma.chordDefinition.findUnique({
      where: { id: req.params.id },
    });
    if (!chord) {
      return res.status(404).json({ message: 'Chord not found' });
    }
    res.json(parseChord(chord));
  } catch (error) {
    console.error('Error fetching chord:', error);
    res.status(500).json({ message: 'Failed to fetch chord' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, voicingName, strings, fingers, baseFret, barreString, barreSpan, capoFret, capoSpan } = req.body;
    const chord = await prisma.chordDefinition.create({
      data: {
        name,
        voicingName,
        strings: JSON.stringify(strings),
        fingers: JSON.stringify(fingers),
        baseFret: baseFret || 1,
        barreString,
        barreSpan: barreSpan ? JSON.stringify(barreSpan) : null,
        capoFret,
        capoSpan: capoSpan ? JSON.stringify(capoSpan) : null,
      },
    });
    res.status(201).json(parseChord(chord));
  } catch (error) {
    console.error('Error creating chord:', error);
    res.status(500).json({ message: 'Failed to create chord' });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { chords } = req.body;

    if (!Array.isArray(chords) || chords.length === 0) {
      return res.status(400).json({ message: 'Expected an array of chords' });
    }

    const created = await prisma.$transaction(
      chords.map((chord: {
        name: string;
        voicingName?: string;
        strings: number[];
        fingers: number[];
        baseFret?: number;
        barreString?: number;
        barreSpan?: [number, number];
        capoFret?: number;
        capoSpan?: [number, number];
      }) =>
        prisma.chordDefinition.create({
          data: {
            name: chord.name,
            voicingName: chord.voicingName,
            strings: JSON.stringify(chord.strings),
            fingers: JSON.stringify(chord.fingers),
            baseFret: chord.baseFret || 1,
            barreString: chord.barreString,
            barreSpan: chord.barreSpan ? JSON.stringify(chord.barreSpan) : null,
            capoFret: chord.capoFret,
            capoSpan: chord.capoSpan ? JSON.stringify(chord.capoSpan) : null,
          },
        })
      )
    );

    res.status(201).json(created.map(parseChord));
  } catch (error) {
    console.error('Error batch creating chords:', error);
    res.status(500).json({ message: 'Failed to batch create chords' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, voicingName, strings, fingers, baseFret, barreString, barreSpan, capoFret, capoSpan } = req.body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (voicingName !== undefined) updateData.voicingName = voicingName;
    if (strings !== undefined) updateData.strings = JSON.stringify(strings);
    if (fingers !== undefined) updateData.fingers = JSON.stringify(fingers);
    if (baseFret !== undefined) updateData.baseFret = baseFret;
    if (barreString !== undefined) updateData.barreString = barreString;
    if (barreSpan !== undefined) updateData.barreSpan = barreSpan ? JSON.stringify(barreSpan) : null;
    if (capoFret !== undefined) updateData.capoFret = capoFret;
    if (capoSpan !== undefined) updateData.capoSpan = capoSpan ? JSON.stringify(capoSpan) : null;

    const chord = await prisma.chordDefinition.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(parseChord(chord));
  } catch (error) {
    console.error('Error updating chord:', error);
    res.status(500).json({ message: 'Failed to update chord' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.chordDefinition.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting chord:', error);
    res.status(500).json({ message: 'Failed to delete chord' });
  }
});

export default router;

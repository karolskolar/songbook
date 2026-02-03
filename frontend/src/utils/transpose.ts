const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getNoteIndex(note: string): number {
  const upperNote = note.charAt(0).toUpperCase() + note.slice(1);
  let index = NOTES_SHARP.indexOf(upperNote);
  if (index === -1) {
    index = NOTES_FLAT.indexOf(upperNote);
  }
  return index;
}

function isFlat(note: string): boolean {
  return note.includes('b');
}

export function transposeNote(note: string, semitones: number): string {
  const index = getNoteIndex(note);
  if (index === -1) return note;

  const newIndex = ((index + semitones) % 12 + 12) % 12;
  const useFlats = isFlat(note);

  return useFlats ? NOTES_FLAT[newIndex] : NOTES_SHARP[newIndex];
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;

  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, suffix] = match;
  const transposedRoot = transposeNote(root, semitones);

  const slashMatch = suffix.match(/^(.*)\/([A-G][#b]?)$/);
  if (slashMatch) {
    const [, middle, bassNote] = slashMatch;
    const transposedBass = transposeNote(bassNote, semitones);
    return `${transposedRoot}${middle}/${transposedBass}`;
  }

  return `${transposedRoot}${suffix}`;
}

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content;

  return content.replace(/\[([^\]]+)\]/g, (match, inner) => {
    const chordPattern = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|M)?[0-9]*(\/[A-G][#b]?)?$/;
    if (chordPattern.test(inner)) {
      return `[${transposeChord(inner, semitones)}]`;
    }
    return match;
  });
}

export function getKeyName(semitones: number): string {
  if (semitones === 0) return 'Original';
  const sign = semitones > 0 ? '+' : '';
  return `${sign}${semitones}`;
}

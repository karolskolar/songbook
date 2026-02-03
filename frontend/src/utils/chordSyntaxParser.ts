import type { CreateChordInput } from '../types';

export interface ParsedChordLine {
  chordName: string;
  voicingName?: string;
  strings: number[];
  fingers: number[];
  baseFret: number;
  barreSpan?: [number, number];
  capoFret?: number;
  capoSpan?: [number, number];
  lineNumber: number;
  raw: string;
}

export interface ParseResult {
  success: boolean;
  chords: ParsedChordLine[];
  errors: { line: number; message: string; raw: string }[];
}

/**
 * Parse a single line of chord syntax
 *
 * Format: ChordName (VoicingName): strings [fingers] @baseFret barre:start-end
 *
 * Examples:
 *   Cdim7 (Position 1): x,3,4,2,4,x [0,1,2,1,3,0] @7
 *   Cdim7 (Position 2): x,x,1,2,1,2 @10
 *   E6/9: 0,2,1,1,2,0 [0,2,1,1,3,0]
 *   Gmaj7: 3,2,0,0,0,2 [2,1,0,0,0,3]
 */
function parseChordLine(
  line: string,
  lineNumber: number
): ParsedChordLine | { error: string } {
  const trimmed = line.trim();

  // Match chord name with optional voicing name
  // ChordName can contain: letters, numbers, #, b, /, +, °, ø, etc.
  const nameMatch = trimmed.match(
    /^([A-Ga-g][A-Za-z0-9#b+°øΔ/]*(?:\/[A-Ga-g][#b]?)?)\s*(?:\(([^)]+)\))?\s*:\s*(.+)$/
  );

  if (!nameMatch) {
    return { error: 'Invalid format. Expected: ChordName (VoicingName): strings [fingers] @baseFret barre:start-end' };
  }

  const [, chordName, voicingName, rest] = nameMatch;

  // Parse the rest of the line
  let remaining = rest.trim();

  // Parse strings (required) - 6 comma-separated values
  const stringsMatch = remaining.match(/^([-x0-9]+(?:,[-x0-9]+){5})/i);
  if (!stringsMatch) {
    return { error: 'Invalid strings format. Expected 6 comma-separated values (x/-1 for muted, 0 for open, number for fret)' };
  }

  const stringsRaw = stringsMatch[1];
  const strings = stringsRaw.split(',').map((s) => {
    const trimmed = s.trim().toLowerCase();
    if (trimmed === 'x' || trimmed === '-1') return -1;
    if (trimmed === 'o') return 0; // Accept 'o' as open string (same as 0)
    const num = parseInt(trimmed, 10);
    return isNaN(num) ? -1 : num;
  });

  if (strings.length !== 6) {
    return { error: 'Expected exactly 6 string values' };
  }

  remaining = remaining.slice(stringsMatch[0].length).trim();

  // Parse fingers (optional) - [0,1,2,1,3,0]
  let fingers = [0, 0, 0, 0, 0, 0];
  const fingersMatch = remaining.match(/^\[([0-4,\s]+)\]/);
  if (fingersMatch) {
    const fingersRaw = fingersMatch[1];
    fingers = fingersRaw.split(',').map((f) => {
      const num = parseInt(f.trim(), 10);
      return isNaN(num) || num < 0 || num > 4 ? 0 : num;
    });

    if (fingers.length !== 6) {
      return { error: 'Expected exactly 6 finger values in brackets' };
    }

    remaining = remaining.slice(fingersMatch[0].length).trim();
  }

  // Parse base fret (optional) - @7
  let baseFret = 1;
  let baseFretSpecified = false;
  const baseFretMatch = remaining.match(/@(\d+)/);
  if (baseFretMatch) {
    baseFret = parseInt(baseFretMatch[1], 10);
    if (baseFret < 1) baseFret = 1;
    baseFretSpecified = true;
    remaining = remaining.replace(baseFretMatch[0], '').trim();
  }

  // Parse barre (optional) - barre:2-4
  let barreSpan: [number, number] | undefined;
  const barreMatch = remaining.match(/barre:(\d+)-(\d+)/);
  if (barreMatch) {
    const start = parseInt(barreMatch[1], 10);
    const end = parseInt(barreMatch[2], 10);
    if (start >= 0 && start <= 5 && end >= 0 && end <= 5 && start <= end) {
      barreSpan = [start, end];
    }
    remaining = remaining.replace(barreMatch[0], '').trim();
  }

  // Parse capo (optional) - capo:0-5 (string indices for capo span)
  let capoFret: number | undefined;
  let capoSpan: [number, number] | undefined;
  const capoMatch = remaining.match(/capo:(\d+)-(\d+)/);
  if (capoMatch) {
    const start = parseInt(capoMatch[1], 10);
    const end = parseInt(capoMatch[2], 10);
    if (start >= 0 && start <= 5 && end >= 0 && end <= 5 && start <= end) {
      capoSpan = [start, end];
      // The capo fret is the baseFret (where the capo is placed)
      capoFret = baseFret;
    }
    remaining = remaining.replace(capoMatch[0], '').trim();
  }

  // Convert absolute fret numbers to relative positions
  // The ChordDiagram component expects positions 1-4 within the display window
  const frettedValues = strings.filter((f) => f > 0);

  if (frettedValues.length > 0) {
    const minFret = Math.min(...frettedValues);
    const maxFret = Math.max(...frettedValues);

    // If values suggest absolute fret numbers (spread > 4 or min > 4 or baseFret specified with high values)
    // convert to relative positions
    if (minFret > 4 || (baseFretSpecified && minFret >= baseFret)) {
      // Calculate the actual baseFret from the minimum fretted position
      const actualBaseFret = baseFretSpecified ? baseFret : minFret;
      baseFret = actualBaseFret;

      // Convert absolute frets to relative positions (1-based within the 4-fret window)
      for (let i = 0; i < strings.length; i++) {
        if (strings[i] > 0) {
          strings[i] = strings[i] - actualBaseFret + 1;
        }
      }
    } else if (!baseFretSpecified && minFret > 1 && maxFret <= 4) {
      // Values are already relative (1-4), but we might need to adjust baseFret
      // if the minimum fret is > 1, this could indicate a chord higher up the neck
      // But without @baseFret specified, assume it's relative and baseFret should be calculated
      // Actually, keep baseFret = 1 for these cases as they're likely open position chords
    }
  }

  return {
    chordName,
    voicingName: voicingName || undefined,
    strings,
    fingers,
    baseFret,
    barreSpan,
    capoFret,
    capoSpan,
    lineNumber,
    raw: line,
  };
}

/**
 * Parse multiple lines of chord syntax
 */
export function parseChordSyntax(input: string): ParseResult {
  const lines = input.split('\n');
  const chords: ParsedChordLine[] = [];
  const errors: { line: number; message: string; raw: string }[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const result = parseChordLine(line, index + 1);

    if ('error' in result) {
      errors.push({ line: index + 1, message: result.error, raw: line });
    } else {
      chords.push(result);
    }
  });

  return {
    success: errors.length === 0,
    chords,
    errors,
  };
}

/**
 * Convert parsed chord lines to CreateChordInput format
 */
export function parsedChordToCreateInput(parsed: ParsedChordLine): CreateChordInput {
  return {
    name: parsed.chordName,
    voicingName: parsed.voicingName,
    strings: parsed.strings,
    fingers: parsed.fingers,
    baseFret: parsed.baseFret,
    barreSpan: parsed.barreSpan,
    capoFret: parsed.capoFret,
    capoSpan: parsed.capoSpan,
  };
}

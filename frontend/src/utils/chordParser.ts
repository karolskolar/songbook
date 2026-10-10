import type { ParsedToken, ParsedLine } from '../types';

// Supports: A-G and H (European B), with optional sharp/flat,
// followed by any combination of chord modifiers (m, maj, min, dim, aug, sus, add, M, numbers, /, etc.)
const CHORD_PATTERN = /^[A-Ha-h][#b]?[a-zA-Z0-9/]*$/;

export function isChord(text: string): boolean {
  // Must start with a valid note letter (A-H) and not be a common section word
  const sectionWords = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'solo', 'refrain', 'refrén', 'sólo', 'pre-chorus', 'coda', 'interlude'];
  if (sectionWords.includes(text.toLowerCase())) {
    return false;
  }
  return CHORD_PATTERN.test(text);
}

export function isSection(text: string): boolean {
  return !isChord(text);
}

export function parseLine(line: string): ParsedLine {
  const tokens: ParsedToken[] = [];
  // Match both [brackets] and {curly braces}
  const combinedRegex = /\[([^\]]+)\]|\{([^}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(line)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: line.slice(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined) {
      // Square brackets: [content] - chord or section
      const content = match[1];
      tokens.push({
        type: isChord(content) ? 'chord' : 'section',
        value: content,
      });
    } else if (match[2] !== undefined) {
      // Curly braces: {content} - label (bold black text)
      tokens.push({
        type: 'label',
        value: match[2],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < line.length) {
    tokens.push({
      type: 'text',
      value: line.slice(lastIndex),
    });
  }

  return { tokens };
}

export function parseContent(content: string): ParsedLine[] {
  return content.split('\n').map(parseLine);
}

export function extractChords(content: string): string[] {
  const chords = new Set<string>();
  const bracketRegex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(content)) !== null) {
    const text = match[1];
    if (isChord(text)) {
      chords.add(text);
    }
  }

  return Array.from(chords).sort();
}

// Chords used in the lyrics plus chords added to the song manually
export function getSongChords(song: { content: string; extraChords?: string[] }): string[] {
  const used = extractChords(song.content);
  const extras = (song.extraChords ?? []).filter(c => !used.includes(c));
  return [...used, ...extras];
}

export function isSectionLine(line: ParsedLine): boolean {
  return (
    line.tokens.length === 1 &&
    line.tokens[0].type === 'section'
  );
}

export function isLabelLine(line: ParsedLine): boolean {
  return (
    line.tokens.length === 1 &&
    line.tokens[0].type === 'label'
  );
}

import { Document, Page, Text, View, StyleSheet, pdf, Svg, Line, Rect, Circle, G, Font } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { Song, ChordDefinition } from '../types';
import { parseContent, isSectionLine, isLabelLine, getSongChords } from './chordParser';
import { transposeChord } from './transpose';

// Register Roboto font which supports Czech/Latin Extended characters
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf',
      fontStyle: 'italic',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bolditalic-webfont.ttf',
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    color: '#666',
    marginBottom: 12,
  },
  section: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
    marginBottom: 4,
  },
  line: {
    fontSize: 10,
    lineHeight: 1.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 10,
  },
  labelInline: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  chord: {
    fontSize: 8,
    color: '#d97706',
    fontWeight: 'bold',
  },
  emptyLine: {
    height: 6,
  },
  chordsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  chordsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chordDiagramContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  chordName: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  chordVoicing: {
    fontSize: 6,
    color: '#666',
    textAlign: 'center',
  },
});

// Chord diagram dimensions for PDF
const DIAGRAM = {
  width: 45,
  height: 55,
  stringSpacing: 7,
  fretSpacing: 10,
  paddingTop: 8,
  paddingLeft: 8,
  dotRadius: 2.5,
  fontSize: 6,
};

function PdfChordDiagram({ chord }: { chord: ChordDefinition }) {
  const numStrings = 6;
  const numFrets = 4;
  const { width, height, stringSpacing, fretSpacing, paddingTop, paddingLeft, dotRadius, fontSize } = DIAGRAM;

  const fretboardWidth = (numStrings - 1) * stringSpacing;
  const fretboardHeight = numFrets * fretSpacing;

  const getStringX = (i: number) => paddingLeft + i * stringSpacing;
  const getFretY = (f: number) => paddingTop + f * fretSpacing;

  const elements: React.ReactNode[] = [];

  // Nut (thick line at top for first position) or fret number
  if (chord.baseFret === 1) {
    elements.push(
      createElement(Rect, {
        key: 'nut',
        x: paddingLeft - 1,
        y: paddingTop - 2,
        width: fretboardWidth + 2,
        height: 3,
        fill: '#1e293b',
      })
    );
  } else {
    elements.push(
      createElement(Text, {
        key: 'fret-num',
        x: 2,
        y: paddingTop + fretSpacing * 0.3,
        style: { fontSize: fontSize - 1, fill: '#666' },
      }, String(chord.baseFret))
    );
  }

  // Fret lines
  for (let i = 0; i <= numFrets; i++) {
    elements.push(
      createElement(Line, {
        key: `fret-${i}`,
        x1: paddingLeft,
        y1: getFretY(i),
        x2: paddingLeft + fretboardWidth,
        y2: getFretY(i),
        stroke: '#1e293b',
        strokeWidth: i === 0 ? 1.5 : 0.5,
      })
    );
  }

  // String lines
  for (let i = 0; i < numStrings; i++) {
    elements.push(
      createElement(Line, {
        key: `string-${i}`,
        x1: getStringX(i),
        y1: paddingTop,
        x2: getStringX(i),
        y2: paddingTop + fretboardHeight,
        stroke: '#1e293b',
        strokeWidth: 0.5,
      })
    );
  }

  // Capo (yellow bar)
  if (chord.capoFret && chord.capoSpan) {
    elements.push(
      createElement(Rect, {
        key: 'capo',
        x: getStringX(chord.capoSpan[0]) - dotRadius - 1,
        y: getFretY(0.5) - dotRadius - 1,
        width: getStringX(chord.capoSpan[1]) - getStringX(chord.capoSpan[0]) + dotRadius * 2 + 2,
        height: dotRadius * 2 + 2,
        rx: 1,
        fill: '#fbbf24',
        stroke: '#d97706',
        strokeWidth: 0.5,
      })
    );
  }

  // Barre (red bar)
  if (chord.barreSpan) {
    const barreFret = chord.strings[chord.barreSpan[0]];
    if (barreFret > 0) {
      elements.push(
        createElement(Rect, {
          key: 'barre',
          x: getStringX(chord.barreSpan[0]) - dotRadius,
          y: getFretY(barreFret - 0.5) - dotRadius,
          width: getStringX(chord.barreSpan[1]) - getStringX(chord.barreSpan[0]) + dotRadius * 2,
          height: dotRadius * 2,
          rx: dotRadius,
          fill: '#ef4444',
        })
      );
    }
  }

  // Open/muted string indicators and finger positions
  chord.strings.forEach((fret, stringIndex) => {
    const x = getStringX(stringIndex);

    if (fret === -1) {
      // Muted string - X
      elements.push(
        createElement(Text, {
          key: `mute-${stringIndex}`,
          x: x - 2,
          y: paddingTop - 3,
          style: { fontSize: fontSize, fill: '#1e293b' },
        }, '×')
      );
    } else if (fret === 0) {
      // Open string - circle
      elements.push(
        createElement(Circle, {
          key: `open-${stringIndex}`,
          cx: x,
          cy: paddingTop - 5,
          r: dotRadius - 0.5,
          fill: 'none',
          stroke: '#1e293b',
          strokeWidth: 0.8,
        })
      );
    } else {
      // Finger position
      const isPartOfBarre = chord.barreSpan &&
        stringIndex >= chord.barreSpan[0] &&
        stringIndex <= chord.barreSpan[1] &&
        fret === chord.strings[chord.barreSpan[0]];

      if (!isPartOfBarre || stringIndex === chord.barreSpan![0]) {
        elements.push(
          createElement(Circle, {
            key: `finger-${stringIndex}`,
            cx: x,
            cy: getFretY(fret - 0.5),
            r: dotRadius,
            fill: isPartOfBarre ? '#ef4444' : '#1e293b',
          })
        );
      }
    }
  });

  return createElement(
    View,
    { style: styles.chordDiagramContainer },
    createElement(Text, { style: styles.chordName }, chord.name),
    chord.voicingName && createElement(Text, { style: styles.chordVoicing }, `(${chord.voicingName})`),
    createElement(Svg, { width, height }, ...elements)
  );
}

interface PdfOptions {
  song: Song;
  chords: ChordDefinition[];
  transposition?: number;
}

function SongDocument({ song, chords, transposition = 0 }: PdfOptions) {
  const lines = parseContent(song.content);
  const usedChordNames = getSongChords(song).map(c => transposeChord(c, transposition));

  // Get unique chord definitions for used chords, respecting selected voicings
  const usedChordDefs = usedChordNames
    .map(name => {
      // Check if there's a selected voicing for this chord
      const selectedVoicingId = song.selectedVoicings?.[name];
      if (selectedVoicingId) {
        const selected = chords.find(c => c.id === selectedVoicingId);
        if (selected) return selected;
      }
      // Otherwise find any chord with this name
      return chords.find(c => c.name === name);
    })
    .filter((c): c is ChordDefinition => c !== undefined)
    // Remove duplicates by id
    .filter((chord, index, self) => self.findIndex(c => c.id === chord.id) === index);

  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.title }, song.title),
      song.artist && createElement(Text, { style: styles.artist }, song.artist),
      createElement(
        View,
        null,
        lines.map((line, lineIndex) => {
          // Section: [Refrén] - gray with brackets
          if (isSectionLine(line)) {
            return createElement(
              Text,
              { key: lineIndex, style: styles.section },
              line.tokens[0].value
            );
          }

          // Label: {Verse} - bold black without brackets
          if (isLabelLine(line)) {
            return createElement(
              Text,
              { key: lineIndex, style: styles.label },
              line.tokens[0].value
            );
          }

          const hasContent = line.tokens.some(
            t => (t.type === 'text' && t.value.trim()) || t.type === 'chord' || t.type === 'label'
          );

          if (!hasContent) {
            return createElement(View, { key: lineIndex, style: styles.emptyLine });
          }

          return createElement(
            View,
            { key: lineIndex, style: styles.line },
            line.tokens.map((token, tokenIndex) => {
              if (token.type === 'chord') {
                const chord = transposition !== 0
                  ? transposeChord(token.value, transposition)
                  : token.value;
                return createElement(
                  Text,
                  { key: tokenIndex, style: styles.chord },
                  chord
                );
              }
              if (token.type === 'section') {
                return null;
              }
              if (token.type === 'label') {
                return createElement(
                  Text,
                  { key: tokenIndex, style: styles.labelInline },
                  token.value
                );
              }
              return createElement(
                Text,
                { key: tokenIndex, style: styles.text },
                token.value
              );
            })
          );
        })
      ),
      usedChordDefs.length > 0 && createElement(
        View,
        { style: styles.chordsSection },
        createElement(Text, { style: styles.chordsTitle }, 'Chords'),
        createElement(
          View,
          { style: styles.chordsList },
          usedChordDefs.map(chord =>
            createElement(PdfChordDiagram, { key: chord.id, chord })
          )
        )
      )
    )
  );
}

export async function generateSongPdf(options: PdfOptions): Promise<Blob> {
  const doc = createElement(SongDocument, options);
  return await pdf(doc).toBlob();
}

export async function downloadSongPdf(options: PdfOptions): Promise<void> {
  const blob = await generateSongPdf(options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.song.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

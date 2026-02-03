import type { ChordDefinition } from '../types';

interface ChordDiagramProps {
  chord: ChordDefinition;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const SIZES = {
  sm: { width: 70, height: 100, fontSize: 10, dotRadius: 4, nameHeight: 18 },
  md: { width: 90, height: 125, fontSize: 12, dotRadius: 5, nameHeight: 22 },
  lg: { width: 110, height: 150, fontSize: 14, dotRadius: 6, nameHeight: 26 },
};

export function ChordDiagram({ chord, size = 'md', showName = true }: ChordDiagramProps) {
  const { width, height, fontSize, dotRadius, nameHeight } = SIZES[size];
  const numStrings = 6;
  const numFrets = 4;

  // More space at top for name + open/muted indicators
  const padding = {
    top: showName ? nameHeight + 18 : 18,
    bottom: 10,
    left: 18,
    right: 10
  };
  const fretboardWidth = width - padding.left - padding.right;
  const fretboardHeight = height - padding.top - padding.bottom;

  const stringSpacing = fretboardWidth / (numStrings - 1);
  const fretSpacing = fretboardHeight / numFrets;

  const getStringX = (stringNum: number) => padding.left + stringNum * stringSpacing;
  const getFretY = (fretNum: number) => padding.top + fretNum * fretSpacing;

  const showFretNumber = chord.baseFret > 1;

  return (
    <svg width={width} height={height} className="text-slate-800">
      {/* Chord name at the top */}
      {showName && (
        <text
          x={width / 2}
          y={fontSize + 2}
          textAnchor="middle"
          className="fill-current font-bold"
          fontSize={fontSize}
        >
          {chord.name}
          {chord.voicingName && (
            <tspan className="font-normal text-slate-500" fontSize={fontSize - 2}>
              {' '}({chord.voicingName})
            </tspan>
          )}
        </text>
      )}

      {/* Open/Muted string indicators - positioned between name and fretboard */}
      {chord.strings.map((fret, stringIndex) => {
        const x = getStringX(stringIndex);
        const indicatorY = padding.top - 10;

        if (fret === -1) {
          return (
            <text
              key={`mute-${stringIndex}`}
              x={x}
              y={indicatorY}
              textAnchor="middle"
              className="fill-current"
              fontSize={fontSize}
            >
              ×
            </text>
          );
        }

        if (fret === 0) {
          return (
            <circle
              key={`open-${stringIndex}`}
              cx={x}
              cy={indicatorY - 4}
              r={dotRadius - 1}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            />
          );
        }

        return null;
      })}

      {/* Nut or fret number */}
      {chord.baseFret === 1 ? (
        <rect
          x={padding.left - 2}
          y={padding.top - 3}
          width={fretboardWidth + 4}
          height={4}
          className="fill-current"
        />
      ) : showFretNumber && (
        <text
          x={padding.left - 12}
          y={getFretY(0.5) + fontSize / 3}
          textAnchor="middle"
          className="fill-slate-500"
          fontSize={fontSize - 2}
        >
          {chord.baseFret}
        </text>
      )}

      {/* Frets */}
      {Array.from({ length: numFrets + 1 }).map((_, i) => (
        <line
          key={`fret-${i}`}
          x1={padding.left}
          y1={getFretY(i)}
          x2={padding.left + fretboardWidth}
          y2={getFretY(i)}
          stroke="currentColor"
          strokeWidth={i === 0 ? 2 : 1}
        />
      ))}

      {/* Strings */}
      {Array.from({ length: numStrings }).map((_, i) => (
        <line
          key={`string-${i}`}
          x1={getStringX(i)}
          y1={padding.top}
          x2={getStringX(i)}
          y2={padding.top + fretboardHeight}
          stroke="currentColor"
          strokeWidth={1}
        />
      ))}

      {/* Capo - displayed as a yellow/gold bar at the first fret position */}
      {chord.capoFret && chord.capoSpan && (
        <g>
          <rect
            x={getStringX(chord.capoSpan[0]) - dotRadius - 1}
            y={getFretY(0.5) - dotRadius - 2}
            width={getStringX(chord.capoSpan[1]) - getStringX(chord.capoSpan[0]) + dotRadius * 2 + 2}
            height={dotRadius * 2 + 4}
            rx={2}
            className="fill-amber-400 stroke-amber-600"
            strokeWidth={1}
          />
          <text
            x={(getStringX(chord.capoSpan[0]) + getStringX(chord.capoSpan[1])) / 2}
            y={getFretY(0.5) + 1}
            textAnchor="middle"
            className="fill-amber-800 font-bold"
            fontSize={fontSize - 4}
            style={{ letterSpacing: '-0.5px' }}
          >
            CAPO
          </text>
        </g>
      )}

      {/* Barre (finger barre, not capo) */}
      {chord.barreSpan && (
        <rect
          x={getStringX(chord.barreSpan[0]) - dotRadius}
          y={getFretY(chord.strings[chord.barreSpan[0]] - 0.5) - dotRadius}
          width={getStringX(chord.barreSpan[1]) - getStringX(chord.barreSpan[0]) + dotRadius * 2}
          height={dotRadius * 2}
          rx={dotRadius}
          className="fill-red-500"
        />
      )}

      {/* Finger positions */}
      {chord.strings.map((fret, stringIndex) => {
        if (fret <= 0) return null;

        const x = getStringX(stringIndex);

        const isPartOfBarre =
          chord.barreSpan &&
          stringIndex >= chord.barreSpan[0] &&
          stringIndex <= chord.barreSpan[1] &&
          fret === chord.strings[chord.barreSpan[0]];

        if (isPartOfBarre && stringIndex !== chord.barreSpan![0]) {
          return null;
        }

        return (
          <g key={`finger-${stringIndex}`}>
            <circle
              cx={x}
              cy={getFretY(fret - 0.5)}
              r={dotRadius}
              className={isPartOfBarre ? 'fill-red-500' : 'fill-current'}
            />
            {chord.fingers[stringIndex] > 0 && !isPartOfBarre && (
              <text
                x={x}
                y={getFretY(fret - 0.5) + fontSize / 3}
                textAnchor="middle"
                className="fill-white"
                fontSize={fontSize - 3}
              >
                {chord.fingers[stringIndex]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

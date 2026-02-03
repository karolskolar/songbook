import { parseContent, isSectionLine, isLabelLine } from '../utils/chordParser';
import { transposeChord } from '../utils/transpose';
import type { ParsedLine, ParsedToken } from '../types';

interface LyricsRendererProps {
  content: string;
  transposition?: number;
  className?: string;
}

function renderToken(token: ParsedToken, transposition: number, index: number) {
  if (token.type === 'chord') {
    const chord = transposition !== 0 ? transposeChord(token.value, transposition) : token.value;
    return (
      <span
        key={index}
        className="text-amber-500 italic text-sm align-super font-semibold mx-0.5"
      >
        {chord}
      </span>
    );
  }

  if (token.type === 'section') {
    return null;
  }

  if (token.type === 'label') {
    // Inline label - bold black text without brackets
    return (
      <span key={index} className="font-bold text-slate-800">
        {token.value}
      </span>
    );
  }

  return <span key={index}>{token.value}</span>;
}

function renderLine(line: ParsedLine, lineIndex: number, transposition: number) {
  // Section line: [Refrén] - gray with brackets
  if (isSectionLine(line)) {
    return (
      <div
        key={lineIndex}
        className="text-lg font-bold text-slate-400 mt-6 mb-2 first:mt-0"
      >
        [{line.tokens[0].value}]
      </div>
    );
  }

  // Label line: {Verse} - bold black without brackets
  if (isLabelLine(line)) {
    return (
      <div
        key={lineIndex}
        className="text-lg font-bold text-slate-800 mt-6 mb-2 first:mt-0"
      >
        {line.tokens[0].value}
      </div>
    );
  }

  const hasContent = line.tokens.some(
    t => (t.type === 'text' && t.value.trim()) || t.type === 'chord' || t.type === 'label'
  );

  if (!hasContent) {
    return <div key={lineIndex} className="h-4" />;
  }

  return (
    <div key={lineIndex} className="leading-8">
      {line.tokens.map((token, i) => renderToken(token, transposition, i))}
    </div>
  );
}

export function LyricsRenderer({ content, transposition = 0, className = '' }: LyricsRendererProps) {
  const lines = parseContent(content);

  return (
    <div className={`font-serif text-lg whitespace-pre-wrap ${className}`}>
      {lines.map((line, i) => renderLine(line, i, transposition))}
    </div>
  );
}

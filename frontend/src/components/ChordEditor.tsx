import { useState, useCallback } from 'react';
import type { ChordDefinition, CreateChordInput } from '../types';
import { ChordDiagram } from './ChordDiagram';

interface ChordEditorProps {
  initialChord?: ChordDefinition;
  onSave: (chord: CreateChordInput) => void;
  onCancel: () => void;
}

const INITIAL_CHORD: CreateChordInput = {
  name: '',
  voicingName: '',
  strings: [0, 0, 0, 0, 0, 0],
  fingers: [0, 0, 0, 0, 0, 0],
  baseFret: 1,
  barreString: undefined,
  barreSpan: undefined,
  capoFret: undefined,
  capoSpan: undefined,
};

export function ChordEditor({ initialChord, onSave, onCancel }: ChordEditorProps) {
  const [chord, setChord] = useState<CreateChordInput>(() => {
    if (initialChord) {
      return {
        name: initialChord.name,
        voicingName: initialChord.voicingName || '',
        strings: [...initialChord.strings],
        fingers: [...initialChord.fingers],
        baseFret: initialChord.baseFret,
        barreString: initialChord.barreString,
        barreSpan: initialChord.barreSpan,
        capoFret: initialChord.capoFret,
        capoSpan: initialChord.capoSpan,
      };
    }
    return { ...INITIAL_CHORD, strings: [...INITIAL_CHORD.strings], fingers: [...INITIAL_CHORD.fingers] };
  });

  const numFrets = 5;
  const numStrings = 6;

  const handleStringClick = useCallback((stringIndex: number, fret: number) => {
    setChord(prev => {
      const newStrings = [...prev.strings];
      const newFingers = [...prev.fingers];

      if (newStrings[stringIndex] === fret && fret !== 0) {
        newStrings[stringIndex] = 0;
        newFingers[stringIndex] = 0;
      } else {
        newStrings[stringIndex] = fret;
        if (fret <= 0) {
          newFingers[stringIndex] = 0;
        }
      }

      return { ...prev, strings: newStrings, fingers: newFingers };
    });
  }, []);

  const handleMuteToggle = useCallback((stringIndex: number) => {
    setChord(prev => {
      const newStrings = [...prev.strings];
      const newFingers = [...prev.fingers];

      if (newStrings[stringIndex] === -1) {
        newStrings[stringIndex] = 0;
      } else {
        newStrings[stringIndex] = -1;
        newFingers[stringIndex] = 0;
      }

      return { ...prev, strings: newStrings, fingers: newFingers };
    });
  }, []);

  const handleFingerChange = useCallback((stringIndex: number, finger: number) => {
    setChord(prev => {
      const newFingers = [...prev.fingers];
      newFingers[stringIndex] = finger;
      return { ...prev, fingers: newFingers };
    });
  }, []);

  const handleBarreToggle = useCallback(() => {
    setChord(prev => {
      if (prev.barreSpan) {
        return { ...prev, barreString: undefined, barreSpan: undefined };
      }

      const frettedStrings = prev.strings
        .map((fret, idx) => ({ fret, idx }))
        .filter(s => s.fret > 0);

      if (frettedStrings.length < 2) return prev;

      const minFret = Math.min(...frettedStrings.map(s => s.fret));
      const sameFretsStrings = frettedStrings.filter(s => s.fret === minFret);

      if (sameFretsStrings.length < 2) return prev;

      const startString = Math.min(...sameFretsStrings.map(s => s.idx));
      const endString = Math.max(...sameFretsStrings.map(s => s.idx));

      return {
        ...prev,
        barreString: 1,
        barreSpan: [startString, endString] as [number, number],
      };
    });
  }, []);

  const handleCapoToggle = useCallback(() => {
    setChord(prev => {
      if (prev.capoSpan) {
        return { ...prev, capoFret: undefined, capoSpan: undefined };
      }
      // Default capo spans all 6 strings at the base fret
      return {
        ...prev,
        capoFret: prev.baseFret,
        capoSpan: [0, 5] as [number, number],
      };
    });
  }, []);

  const handleCapoSpanChange = useCallback((start: number, end: number) => {
    setChord(prev => ({
      ...prev,
      capoSpan: [start, end] as [number, number],
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chord.name.trim()) return;
    onSave({
      ...chord,
      voicingName: chord.voicingName || undefined,
      capoFret: chord.capoSpan ? chord.baseFret : undefined,
      capoSpan: chord.capoSpan,
    });
  };

  const previewChord: ChordDefinition = {
    id: 'preview',
    ...chord,
    voicingName: chord.voicingName || undefined,
    capoFret: chord.capoSpan ? chord.baseFret : undefined,
    capoSpan: chord.capoSpan,
    createdAt: new Date().toISOString(),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Chord Name *
          </label>
          <input
            type="text"
            value={chord.name}
            onChange={e => setChord(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Am, G7, Dm"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Voicing Name
          </label>
          <input
            type="text"
            value={chord.voicingName}
            onChange={e => setChord(prev => ({ ...prev, voicingName: e.target.value }))}
            placeholder="e.g., Standard, Barre, Easy"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Interactive Fretboard */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fretboard (click to place fingers)
          </label>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            {/* String labels and mute toggles */}
            <div className="flex mb-2">
              <div className="w-8" />
              {['E', 'A', 'D', 'G', 'B', 'e'].map((name, i) => (
                <div key={i} className="flex-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleMuteToggle(i)}
                    className={`w-6 h-6 rounded text-xs font-medium ${
                      chord.strings[i] === -1
                        ? 'bg-red-500 text-white'
                        : chord.strings[i] === 0
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {chord.strings[i] === -1 ? '×' : chord.strings[i] === 0 ? 'O' : name}
                  </button>
                </div>
              ))}
            </div>

            {/* Frets */}
            {Array.from({ length: numFrets }).map((_, fret) => (
              <div key={fret} className="flex items-center border-b border-slate-400">
                <div className="w-8 text-xs text-slate-500 text-right pr-2">
                  {chord.baseFret + fret}
                </div>
                {Array.from({ length: numStrings }).map((_, string) => (
                  <button
                    key={string}
                    type="button"
                    onClick={() => handleStringClick(string, fret + 1)}
                    className={`flex-1 h-10 border-r border-slate-300 flex items-center justify-center ${
                      chord.strings[string] === fret + 1
                        ? 'bg-slate-800'
                        : 'hover:bg-amber-100'
                    }`}
                  >
                    {chord.strings[string] === fret + 1 && (
                      <span className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs">
                        {chord.fingers[string] || ''}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Base fret control */}
          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Base Fret:</label>
            <input
              type="number"
              min={1}
              max={12}
              value={chord.baseFret}
              onChange={e => setChord(prev => ({ ...prev, baseFret: parseInt(e.target.value) || 1 }))}
              className="w-16 px-2 py-1 border border-slate-300 rounded"
            />
            <button
              type="button"
              onClick={handleBarreToggle}
              className={`px-3 py-1 rounded text-sm ${
                chord.barreSpan
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {chord.barreSpan ? 'Remove Barre' : 'Add Barre'}
            </button>
            <button
              type="button"
              onClick={handleCapoToggle}
              className={`px-3 py-1 rounded text-sm ${
                chord.capoSpan
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {chord.capoSpan ? 'Remove Capo' : 'Add Capo'}
            </button>
          </div>

          {/* Capo span control */}
          {chord.capoSpan && (
            <div className="mt-4 flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">Capo Span:</label>
              <span className="text-sm text-slate-600">From string</span>
              <select
                value={chord.capoSpan[0]}
                onChange={e => handleCapoSpanChange(parseInt(e.target.value), chord.capoSpan![1])}
                className="px-2 py-1 border border-slate-300 rounded text-sm"
              >
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <option key={i} value={i}>{['E', 'A', 'D', 'G', 'B', 'e'][i]} ({i + 1})</option>
                ))}
              </select>
              <span className="text-sm text-slate-600">to string</span>
              <select
                value={chord.capoSpan[1]}
                onChange={e => handleCapoSpanChange(chord.capoSpan![0], parseInt(e.target.value))}
                className="px-2 py-1 border border-slate-300 rounded text-sm"
              >
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <option key={i} value={i} disabled={i < chord.capoSpan![0]}>{['E', 'A', 'D', 'G', 'B', 'e'][i]} ({i + 1})</option>
                ))}
              </select>
            </div>
          )}

          {/* Finger assignment */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Finger Numbers (1=index, 2=middle, 3=ring, 4=pinky)
            </label>
            <div className="flex gap-2">
              {chord.strings.map((fret, i) => (
                <select
                  key={i}
                  value={chord.fingers[i]}
                  onChange={e => handleFingerChange(i, parseInt(e.target.value))}
                  disabled={fret <= 0}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm disabled:opacity-50"
                >
                  <option value={0}>-</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="w-32">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Preview
          </label>
          <div className="bg-white p-2 rounded border border-slate-200">
            <ChordDiagram chord={previewChord} size="lg" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:text-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!chord.name.trim()}
          className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initialChord ? 'Update Chord' : 'Save Chord'}
        </button>
      </div>
    </form>
  );
}

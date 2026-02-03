import { useState } from 'react';
import type { ChordDefinition, CreateChordInput } from '../types';
import { parseChordSyntax, parsedChordToCreateInput } from '../utils/chordSyntaxParser';
import type { ParsedChordLine } from '../utils/chordSyntaxParser';
import { ChordDiagram } from './ChordDiagram';

interface ChordBatchImporterProps {
  onImport: (chords: CreateChordInput[]) => Promise<void>;
  onClose: () => void;
}

export function ChordBatchImporter({ onImport, onClose }: ChordBatchImporterProps) {
  const [input, setInput] = useState('');
  const [parsedChords, setParsedChords] = useState<ParsedChordLine[]>([]);
  const [errors, setErrors] = useState<{ line: number; message: string; raw: string }[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleParse = () => {
    const result = parseChordSyntax(input);
    setParsedChords(result.chords);
    setErrors(result.errors);
    setIsParsed(true);
  };

  const handleImport = async () => {
    if (parsedChords.length === 0) return;

    setIsImporting(true);
    try {
      const chordInputs = parsedChords.map(parsedChordToCreateInput);
      await onImport(chordInputs);
      onClose();
    } catch (error) {
      console.error('Failed to import chords:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setParsedChords([]);
    setErrors([]);
    setIsParsed(false);
  };

  const createPreviewChord = (parsed: ParsedChordLine): ChordDefinition => ({
    id: `preview-${parsed.lineNumber}`,
    name: parsed.chordName,
    voicingName: parsed.voicingName,
    strings: parsed.strings,
    fingers: parsed.fingers,
    baseFret: parsed.baseFret,
    barreSpan: parsed.barreSpan,
    capoFret: parsed.capoFret,
    capoSpan: parsed.capoSpan,
    createdAt: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Batch Import Chords</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6">
          {!isParsed ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Paste chord definitions in the following format, one per line:
              </p>
              <div className="bg-slate-100 p-3 rounded mb-4 text-sm font-mono text-slate-700">
                <p>ChordName (VoicingName): strings [fingers] @baseFret barre:start-end capo:start-end</p>
                <p className="mt-2 text-slate-500">Examples:</p>
                <p>Cdim7 (Position 1): x,3,4,2,4,x [0,1,2,1,3,0] @7</p>
                <p>Cdim7 (Capo): 5,5,3,4,x,x [4,3,2,1,0,0] @2 capo:0-3</p>
                <p>E6/9: 0,2,1,1,2,0 [0,2,1,1,3,0]</p>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste chord definitions here..."
                className="w-full h-64 p-3 border rounded-md font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </>
          ) : (
            <>
              {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <h3 className="font-semibold text-red-800 mb-2">Parse Errors:</h3>
                  {errors.map((err, i) => (
                    <div key={i} className="text-sm text-red-700">
                      <span className="font-mono">Line {err.line}:</span> {err.message}
                      <div className="font-mono text-red-500 text-xs mt-1">{err.raw}</div>
                    </div>
                  ))}
                </div>
              )}

              {parsedChords.length > 0 && (
                <>
                  <h3 className="font-semibold text-slate-700 mb-3">
                    Preview ({parsedChords.length} chord{parsedChords.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="flex flex-wrap gap-4 max-h-96 overflow-auto p-2 bg-slate-50 rounded">
                    {parsedChords.map((parsed) => (
                      <div
                        key={parsed.lineNumber}
                        className="bg-white p-2 rounded border shadow-sm"
                      >
                        <ChordDiagram
                          chord={createPreviewChord(parsed)}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {parsedChords.length === 0 && errors.length === 0 && (
                <p className="text-slate-500 text-center py-8">No valid chord definitions found.</p>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          {!isParsed ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!input.trim()}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Parse
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={parsedChords.length === 0 || isImporting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Importing...' : `Import ${parsedChords.length} Chord${parsedChords.length !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

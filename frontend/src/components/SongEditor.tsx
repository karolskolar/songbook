import { useState } from 'react';
import type { Song, CreateSongInput, ChordDefinition, CreateChordInput } from '../types';
import { LyricsRenderer } from './LyricsRenderer';
import { ChordDiagram } from './ChordDiagram';
import { ChordEditor } from './ChordEditor';
import { TransposeControls } from './TransposeControls';
import { extractChords } from '../utils/chordParser';
import { transposeChord } from '../utils/transpose';

interface SongEditorProps {
  initialSong?: Song;
  chords: ChordDefinition[];
  onSave: (song: CreateSongInput) => void;
  onCancel: () => void;
  onCreateChord?: (chord: CreateChordInput) => Promise<void>;
}

export function SongEditor({ initialSong, chords, onSave, onCancel, onCreateChord }: SongEditorProps) {
  const [title, setTitle] = useState(initialSong?.title || '');
  const [artist, setArtist] = useState(initialSong?.artist || '');
  const [content, setContent] = useState(initialSong?.content || '');
  const [transposition, setTransposition] = useState(initialSong?.transposition || 0);
  const [selectedVoicings, setSelectedVoicings] = useState<Record<string, string>>(
    initialSong?.selectedVoicings || {}
  );
  const [editingChord, setEditingChord] = useState<string | null>(null);

  const usedChords = extractChords(content);
  const transposedChords = usedChords.map(c => transposeChord(c, transposition));

  const getChordVoicings = (chordName: string) => {
    return chords.filter(c => c.name === chordName);
  };

  const getSelectedChord = (chordName: string): ChordDefinition | undefined => {
    const voicingId = selectedVoicings[chordName];
    if (voicingId) {
      return chords.find(c => c.id === voicingId);
    }
    const voicings = getChordVoicings(chordName);
    return voicings[0];
  };

  const handleVoicingChange = (chordName: string, voicingId: string) => {
    setSelectedVoicings(prev => ({
      ...prev,
      [chordName]: voicingId,
    }));
  };

  const handleDefineChord = (chordName: string) => {
    setEditingChord(chordName);
  };

  const handleSaveChord = async (data: CreateChordInput) => {
    if (onCreateChord) {
      await onCreateChord(data);
    }
    setEditingChord(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      artist: artist.trim() || undefined,
      content,
      transposition,
      selectedVoicings,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Song title"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Artist
            </label>
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="Artist name"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <TransposeControls value={transposition} onChange={setTransposition} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50"
            >
              {initialSong ? 'Update Song' : 'Save Song'}
            </button>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex min-h-0">
        {/* Editor */}
        <div className="w-1/2 flex flex-col border-r">
          <div className="p-2 bg-slate-100 text-sm text-slate-600 border-b">
            Use [Am] for chords, [Verse] for sections, {"{Chorus}"} for labels
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`[Verse]
[Am]ako víno žiari chutí ako v ústach [C]med
[Am]Ak ju nosíš v tvári krajšej tváre [C]niet

[Chorus]
Na zdravie!`}
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
          />
        </div>

        {/* Preview */}
        <div className="w-1/2 flex flex-col bg-slate-50 overflow-auto">
          <div className="p-2 bg-slate-100 text-sm text-slate-600 border-b">
            Preview
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {content ? (
              <LyricsRenderer content={content} transposition={transposition} />
            ) : (
              <p className="text-slate-400 italic">Start typing to see preview...</p>
            )}
          </div>

          {/* Chord Diagrams & Voicing Selection */}
          {transposedChords.length > 0 && (
            <div className="flex-shrink-0 p-4 border-t bg-white">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Chords Used</h3>
              <div className="flex flex-wrap gap-4">
                {transposedChords.map(chordName => {
                  const voicings = getChordVoicings(chordName);
                  const selectedChord = getSelectedChord(chordName);

                  return (
                    <div key={chordName} className="text-center">
                      {selectedChord ? (
                        <ChordDiagram chord={selectedChord} size="sm" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDefineChord(chordName)}
                          className="w-[60px] h-[80px] flex flex-col items-center justify-center bg-slate-100 rounded border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                        >
                          <span className="font-bold">{chordName}</span>
                          <span className="text-amber-600 mt-1">+ Define</span>
                        </button>
                      )}
                      {voicings.length > 1 && (
                        <select
                          value={selectedVoicings[chordName] || voicings[0]?.id || ''}
                          onChange={e => handleVoicingChange(chordName, e.target.value)}
                          className="mt-1 text-xs border rounded px-1 py-0.5"
                        >
                          {voicings.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.voicingName || 'Default'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chord Editor Modal */}
      {editingChord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Define {editingChord}
            </h2>
            <ChordEditor
              initialChord={{
                id: '',
                name: editingChord,
                strings: [-1, 0, 0, 0, 0, 0],
                fingers: [0, 0, 0, 0, 0, 0],
                baseFret: 1,
                createdAt: ''
              }}
              onSave={handleSaveChord}
              onCancel={() => setEditingChord(null)}
            />
          </div>
        </div>
      )}
    </form>
  );
}

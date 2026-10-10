import { useState } from 'react';
import type { Song, ChordDefinition, CreateChordInput } from '../types';
import { LyricsRenderer } from './LyricsRenderer';
import { ChordDiagram } from './ChordDiagram';
import { ChordEditor } from './ChordEditor';
import { ChordBatchImporter } from './ChordBatchImporter';
import { TransposeControls } from './TransposeControls';
import { extractChords, getSongChords } from '../utils/chordParser';
import { transposeChord } from '../utils/transpose';

interface SongViewProps {
  song: Song;
  chords: ChordDefinition[];
  onEdit?: () => void;
  onExportPdf?: () => void;
  onCreateChord?: (chord: CreateChordInput) => Promise<void>;
  onUpdateChord?: (id: string, chord: CreateChordInput) => Promise<void>;
  onBatchImportChords?: (chords: CreateChordInput[]) => Promise<void>;
  onDeleteChord?: (id: string) => Promise<void>;
  onUpdateChordOrder?: (chordOrder: string[]) => Promise<void>;
  onUpdateExtraChords?: (extraChords: string[]) => Promise<void>;
}

export function SongView({ song, chords, onEdit, onExportPdf, onCreateChord, onUpdateChord, onBatchImportChords, onDeleteChord, onUpdateChordOrder, onUpdateExtraChords }: SongViewProps) {
  const [transposition, setTransposition] = useState(song.transposition);
  const [editingChord, setEditingChord] = useState<string | null>(null);
  const [editingExisting, setEditingExisting] = useState<ChordDefinition | null>(null);
  const [showBatchImporter, setShowBatchImporter] = useState(false);
  const [showAddChord, setShowAddChord] = useState(false);

  const lyricChords = extractChords(song.content);
  const extraChords = song.extraChords ?? [];
  const transposedChords = getSongChords(song).map(c => transposeChord(c, transposition));
  const transposedExtras = new Set(
    extraChords.filter(c => !lyricChords.includes(c)).map(c => transposeChord(c, transposition))
  );

  // Sort chords based on saved order, with unordered chords at the end
  const orderedChords = [...transposedChords].sort((a, b) => {
    const orderA = song.chordOrder.indexOf(a);
    const orderB = song.chordOrder.indexOf(b);
    // If both are in the order, sort by their position
    if (orderA !== -1 && orderB !== -1) return orderA - orderB;
    // If only one is in the order, it comes first
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;
    // If neither is in the order, maintain original order
    return transposedChords.indexOf(a) - transposedChords.indexOf(b);
  });

  const getSelectedChord = (chordName: string): ChordDefinition | undefined => {
    const voicingId = song.selectedVoicings[chordName];
    if (voicingId) {
      return chords.find(c => c.id === voicingId);
    }
    return chords.find(c => c.name === chordName);
  };

  const handleDefineChord = (chordName: string) => {
    setEditingChord(chordName);
    setEditingExisting(null);
  };

  const handleEditChord = (chord: ChordDefinition) => {
    setEditingChord(chord.name);
    setEditingExisting(chord);
  };

  const handleSaveChord = async (data: CreateChordInput) => {
    if (editingExisting && onUpdateChord) {
      await onUpdateChord(editingExisting.id, data);
      // Keep a renamed extra chord in this song's list
      const oldName = transposeChord(editingExisting.name, -transposition);
      const newName = transposeChord(data.name, -transposition);
      if (onUpdateExtraChords && oldName !== newName && extraChords.includes(oldName)) {
        await onUpdateExtraChords(extraChords.map(c => (c === oldName ? newName : c)));
      }
    } else if (onCreateChord) {
      await onCreateChord(data);
    }
    setEditingChord(null);
    setEditingExisting(null);
  };

  const handleDeleteChord = async (chord: ChordDefinition) => {
    if (onDeleteChord && confirm(`Delete chord "${chord.name}"?`)) {
      await onDeleteChord(chord.id);
    }
  };

  const handleAddNewChord = () => {
    setShowAddChord(true);
    setEditingChord(null);
    setEditingExisting(null);
  };

  const handleSaveNewChord = async (data: CreateChordInput) => {
    if (onCreateChord) {
      await onCreateChord(data);
    }
    // Show the chord in this song even when the lyrics don't use it (stored in the original key)
    const originalName = transposeChord(data.name, -transposition);
    if (onUpdateExtraChords && !getSongChords(song).includes(originalName)) {
      await onUpdateExtraChords([...extraChords, originalName]);
    }
    setShowAddChord(false);
  };

  const handleRemoveExtraChord = async (chordName: string) => {
    if (!onUpdateExtraChords || !confirm(`Remove chord "${chordName}" from this song?`)) return;
    await onUpdateExtraChords(extraChords.filter(c => transposeChord(c, transposition) !== chordName));
  };

  const handleMoveChord = async (chordName: string, direction: 'up' | 'down') => {
    if (!onUpdateChordOrder) return;

    const currentOrder = song.chordOrder.length > 0 ? [...song.chordOrder] : [...orderedChords];
    const currentIndex = currentOrder.indexOf(chordName);

    // If chord not in order yet, add all chords to order first
    if (currentIndex === -1) {
      const newOrder = [...orderedChords];
      const idx = newOrder.indexOf(chordName);
      if (direction === 'up' && idx > 0) {
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      } else if (direction === 'down' && idx < newOrder.length - 1) {
        [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      }
      await onUpdateChordOrder(newOrder);
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= currentOrder.length) return;

    // Swap positions
    [currentOrder[currentIndex], currentOrder[newIndex]] = [currentOrder[newIndex], currentOrder[currentIndex]];
    await onUpdateChordOrder(currentOrder);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">{song.title}</h1>
        {song.artist && (
          <p className="text-lg text-slate-600 mt-1">{song.artist}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <TransposeControls value={transposition} onChange={setTransposition} />
        <div className="flex gap-2">
          {onBatchImportChords && (
            <button
              onClick={() => setShowBatchImporter(true)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
            >
              Batch Import
            </button>
          )}
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
            >
              Export PDF
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Lyrics */}
      <div className="mb-8">
        <LyricsRenderer content={song.content} transposition={transposition} />
      </div>

      {/* Chord Diagrams */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700">Chords</h2>
          {onCreateChord && (
            <button
              onClick={handleAddNewChord}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              + Add Chord
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          {orderedChords.length > 0 && orderedChords.map((chordName, index) => {
            const selectedChord = getSelectedChord(chordName);
            const isExtra = transposedExtras.has(chordName);

            return (
              <div key={chordName} className="bg-white p-2 rounded border shadow-sm relative group">
                {selectedChord ? (
                  <>
                    <ChordDiagram chord={selectedChord} size="md" />
                    {onCreateChord && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {onUpdateChordOrder && (
                          <>
                            <button
                              onClick={() => handleMoveChord(chordName, 'up')}
                              disabled={index === 0}
                              className="w-6 h-6 flex items-center justify-center bg-slate-500 text-white rounded text-xs hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move left"
                            >
                              ←
                            </button>
                            <button
                              onClick={() => handleMoveChord(chordName, 'down')}
                              disabled={index === orderedChords.length - 1}
                              className="w-6 h-6 flex items-center justify-center bg-slate-500 text-white rounded text-xs hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move right"
                            >
                              →
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditChord(selectedChord)}
                          className="w-6 h-6 flex items-center justify-center bg-amber-500 text-white rounded text-xs hover:bg-amber-600"
                          title="Edit chord"
                        >
                          ✎
                        </button>
                        {isExtra && onUpdateExtraChords ? (
                          <button
                            onClick={() => handleRemoveExtraChord(chordName)}
                            className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            title="Remove from song"
                          >
                            ×
                          </button>
                        ) : onDeleteChord && (
                          <button
                            onClick={() => handleDeleteChord(selectedChord)}
                            className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            title="Delete chord"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleDefineChord(chordName)}
                      className="w-[80px] h-[100px] flex flex-col items-center justify-center bg-slate-100 rounded border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                    >
                      <span className="font-bold">{chordName}</span>
                      <span className="text-xs text-amber-600 mt-1">+ Define</span>
                    </button>
                    {isExtra && onUpdateExtraChords && (
                      <button
                        onClick={() => handleRemoveExtraChord(chordName)}
                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from song"
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chord Editor Modal */}
      {editingChord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {editingExisting ? `Edit ${editingChord}` : `Define ${editingChord}`}
            </h2>
            <ChordEditor
              initialChord={editingExisting ? editingExisting : {
                id: '',
                name: editingChord,
                strings: [-1, 0, 0, 0, 0, 0],
                fingers: [0, 0, 0, 0, 0, 0],
                baseFret: 1,
                createdAt: ''
              }}
              onSave={handleSaveChord}
              onCancel={() => {
                setEditingChord(null);
                setEditingExisting(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Add New Chord Modal */}
      {showAddChord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Chord</h2>
            <ChordEditor
              onSave={handleSaveNewChord}
              onCancel={() => setShowAddChord(false)}
            />
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {showBatchImporter && onBatchImportChords && (
        <ChordBatchImporter
          onImport={onBatchImportChords}
          onClose={() => setShowBatchImporter(false)}
        />
      )}
    </div>
  );
}

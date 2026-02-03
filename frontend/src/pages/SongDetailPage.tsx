import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSong } from '../hooks/useSongs';
import { useChords } from '../hooks/useChords';
import { SongView } from '../components/SongView';
import { downloadSongPdf } from '../utils/pdfGenerator';
import type { CreateChordInput } from '../types';

export function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { song, loading, error, updateSong } = useSong(id);
  const { chords, createChord, deleteChord, batchCreateChords } = useChords();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Song not found'}</p>
        <Link to="/songs" className="text-amber-600 hover:text-amber-700">
          Back to songs
        </Link>
      </div>
    );
  }

  const handleExportPdf = async () => {
    await downloadSongPdf({ song, chords });
  };

  const handleCreateChord = async (data: CreateChordInput) => {
    await createChord(data);
  };

  const handleDeleteChord = async (chordId: string) => {
    await deleteChord(chordId);
  };

  const handleBatchImportChords = async (data: CreateChordInput[]) => {
    await batchCreateChords(data);
  };

  const handleUpdateChordOrder = async (chordOrder: string[]) => {
    await updateSong({ chordOrder });
  };

  return (
    <div className="py-4">
      <div className="mb-4">
        <Link
          to="/songs"
          className="text-amber-600 hover:text-amber-700"
        >
          ← Back to songs
        </Link>
      </div>

      <SongView
        song={song}
        chords={chords}
        onEdit={() => navigate(`/songs/${id}/edit`)}
        onExportPdf={handleExportPdf}
        onCreateChord={handleCreateChord}
        onBatchImportChords={handleBatchImportChords}
        onDeleteChord={handleDeleteChord}
        onUpdateChordOrder={handleUpdateChordOrder}
      />
    </div>
  );
}

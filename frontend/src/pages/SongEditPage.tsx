import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSong, useSongs } from '../hooks/useSongs';
import { useChords } from '../hooks/useChords';
import { SongEditor } from '../components/SongEditor';
import type { CreateSongInput, CreateChordInput } from '../types';

export function SongEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { song, loading: loadingSong, error } = useSong(id);
  const { createSong, updateSong } = useSongs();
  const { chords, loading: loadingChords, createChord } = useChords();

  const isNew = !id;
  const loading = loadingSong || loadingChords;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!isNew && (error || !song)) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Song not found'}</p>
        <Link to="/songs" className="text-amber-600 hover:text-amber-700">
          Back to songs
        </Link>
      </div>
    );
  }

  const handleSave = async (data: CreateSongInput) => {
    try {
      if (isNew) {
        const newSong = await createSong(data);
        navigate(`/songs/${newSong.id}`);
      } else {
        await updateSong(id!, data);
        navigate(`/songs/${id}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save song');
    }
  };

  const handleCancel = () => {
    if (isNew) {
      navigate('/songs');
    } else {
      navigate(`/songs/${id}`);
    }
  };

  const handleCreateChord = async (data: CreateChordInput) => {
    await createChord(data);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-shrink-0 mb-2">
        <Link
          to={isNew ? '/songs' : `/songs/${id}`}
          className="text-amber-600 hover:text-amber-700"
        >
          ← {isNew ? 'Back to songs' : 'Back to song'}
        </Link>
      </div>

      <h1 className="flex-shrink-0 text-2xl font-bold text-slate-800 mb-4">
        {isNew ? 'New Song' : 'Edit Song'}
      </h1>

      <div className="flex-1 min-h-0 bg-white rounded-lg border shadow-sm overflow-hidden">
        <SongEditor
          initialSong={song || undefined}
          chords={chords}
          onSave={handleSave}
          onCancel={handleCancel}
          onCreateChord={handleCreateChord}
        />
      </div>
    </div>
  );
}

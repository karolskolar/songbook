import { Link } from 'react-router-dom';
import { useSongs } from '../hooks/useSongs';
import { SongList } from '../components/SongList';

export function SongsPage() {
  const { songs, loading, error, deleteSong } = useSongs();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-amber-600 hover:text-amber-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Songs</h1>
        <Link
          to="/songs/new"
          className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
        >
          Add Song
        </Link>
      </div>

      <SongList songs={songs} onDelete={deleteSong} />
    </div>
  );
}

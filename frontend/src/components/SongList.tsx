import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Song } from '../types';

interface SongListProps {
  songs: Song[];
  onDelete?: (id: string) => void;
}

export function SongList({ songs, onDelete }: SongListProps) {
  const [search, setSearch] = useState('');

  const filteredSongs = useMemo(() => {
    if (!search.trim()) return songs;
    const query = search.toLowerCase();
    return songs.filter(
      song =>
        song.title.toLowerCase().includes(query) ||
        (song.artist && song.artist.toLowerCase().includes(query))
    );
  }, [songs, search]);

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No songs yet</p>
        <Link
          to="/songs/new"
          className="inline-block px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
        >
          Add your first song
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search songs..."
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Song Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSongs.map(song => (
          <div
            key={song.id}
            className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <Link to={`/songs/${song.id}`} className="block p-4">
              <h3 className="font-semibold text-slate-800 truncate">{song.title}</h3>
              {song.artist && (
                <p className="text-sm text-slate-500 truncate">{song.artist}</p>
              )}
            </Link>
            <div className="px-4 pb-3 flex justify-end gap-2 border-t pt-2">
              <Link
                to={`/songs/${song.id}/edit`}
                className="text-sm text-amber-600 hover:text-amber-700"
              >
                Edit
              </Link>
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Delete this song?')) {
                      onDelete(song.id);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && search && (
        <p className="text-center text-slate-500 py-8">
          No songs match "{search}"
        </p>
      )}
    </div>
  );
}

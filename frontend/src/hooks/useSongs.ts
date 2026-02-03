import { useState, useEffect, useCallback } from 'react';
import type { Song, CreateSongInput, UpdateSongInput } from '../types';
import { songsApi } from '../api/client';

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSongs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await songsApi.getAll();
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch songs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const createSong = useCallback(async (data: CreateSongInput) => {
    const song = await songsApi.create(data);
    setSongs(prev => [song, ...prev]);
    return song;
  }, []);

  const updateSong = useCallback(async (id: string, data: UpdateSongInput) => {
    const song = await songsApi.update(id, data);
    setSongs(prev => prev.map(s => (s.id === id ? song : s)));
    return song;
  }, []);

  const deleteSong = useCallback(async (id: string) => {
    await songsApi.delete(id);
    setSongs(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    songs,
    loading,
    error,
    refresh: fetchSongs,
    createSong,
    updateSong,
    deleteSong,
  };
}

export function useSong(id: string | undefined) {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchSong() {
      try {
        setLoading(true);
        setError(null);
        const data = await songsApi.getById(id);
        setSong(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch song');
      } finally {
        setLoading(false);
      }
    }

    fetchSong();
  }, [id]);

  const updateSong = async (data: UpdateSongInput) => {
    if (!id) return null;
    const updated = await songsApi.update(id, data);
    setSong(updated);
    return updated;
  };

  return { song, loading, error, updateSong };
}

import { useState, useEffect, useCallback } from 'react';
import type { ChordDefinition, CreateChordInput, UpdateChordInput } from '../types';
import { chordsApi } from '../api/client';

export function useChords() {
  const [chords, setChords] = useState<ChordDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chordsApi.getAll();
      setChords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chords');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    fetchChords();
  }, [fetchChords]);

  const createChord = useCallback(async (data: CreateChordInput) => {
    const chord = await chordsApi.create(data);
    setChords(prev => [...prev, chord].sort((a, b) => a.name.localeCompare(b.name)));
    return chord;
  }, []);

  const updateChord = useCallback(async (id: string, data: UpdateChordInput) => {
    const chord = await chordsApi.update(id, data);
    setChords(prev => prev.map(c => (c.id === id ? chord : c)));
    return chord;
  }, []);

  const deleteChord = useCallback(async (id: string) => {
    await chordsApi.delete(id);
    setChords(prev => prev.filter(c => c.id !== id));
  }, []);

  const batchCreateChords = useCallback(async (data: CreateChordInput[]) => {
    const newChords = await chordsApi.batchCreate(data);
    setChords(prev => [...prev, ...newChords].sort((a, b) => a.name.localeCompare(b.name)));
    return newChords;
  }, []);

  return {
    chords,
    loading,
    error,
    refresh: fetchChords,
    createChord,
    updateChord,
    deleteChord,
    batchCreateChords,
  };
}

export function useChord(id: string | undefined) {
  const [chord, setChord] = useState<ChordDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
      setLoading(false);
      return;
    }
    const chordId = id;

    async function fetchChord() {
      try {
        setLoading(true);
        setError(null);
        const data = await chordsApi.getById(chordId);
        setChord(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chord');
      } finally {
        setLoading(false);
      }
    }

    fetchChord();
  }, [id]);

  return { chord, loading, error };
}

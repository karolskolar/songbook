import type { Song, ChordDefinition, CreateSongInput, UpdateSongInput, CreateChordInput, UpdateChordInput } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  // Handle 204 No Content responses (e.g., DELETE operations)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const songsApi = {
  getAll: () => fetchApi<Song[]>('/songs'),

  getById: (id: string) => fetchApi<Song>(`/songs/${id}`),

  create: (data: CreateSongInput) =>
    fetchApi<Song>('/songs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateSongInput) =>
    fetchApi<Song>(`/songs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/songs/${id}`, {
      method: 'DELETE',
    }),
};

export const chordsApi = {
  getAll: () => fetchApi<ChordDefinition[]>('/chords'),

  getById: (id: string) => fetchApi<ChordDefinition>(`/chords/${id}`),

  getByName: (name: string) => fetchApi<ChordDefinition[]>(`/chords/name/${encodeURIComponent(name)}`),

  create: (data: CreateChordInput) =>
    fetchApi<ChordDefinition>('/chords', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateChordInput) =>
    fetchApi<ChordDefinition>(`/chords/${id}`, {
      method: 'PUT',
      // Send cleared fields (e.g. removed capo or barre) as null so the server clears them
      body: JSON.stringify(data, (_key, value) => (value === undefined ? null : value)),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/chords/${id}`, {
      method: 'DELETE',
    }),

  batchCreate: (chords: CreateChordInput[]) =>
    fetchApi<ChordDefinition[]>('/chords/batch', {
      method: 'POST',
      body: JSON.stringify({ chords }),
    }),
};

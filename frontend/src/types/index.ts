export interface Song {
  id: string;
  title: string;
  artist?: string;
  content: string;
  selectedVoicings: Record<string, string>;
  chordOrder: string[];
  transposition: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChordDefinition {
  id: string;
  name: string;
  voicingName?: string;
  strings: number[];
  fingers: number[];
  baseFret: number;
  barreString?: number;
  barreSpan?: [number, number];
  capoFret?: number;
  capoSpan?: [number, number];
  createdAt: string;
}

export interface ParsedToken {
  type: 'text' | 'chord' | 'section' | 'label';
  value: string;
}

export interface ParsedLine {
  tokens: ParsedToken[];
}

export type CreateSongInput = Omit<Song, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSongInput = Partial<CreateSongInput>;

export type CreateChordInput = Omit<ChordDefinition, 'id' | 'createdAt'>;
export type UpdateChordInput = Partial<CreateChordInput>;

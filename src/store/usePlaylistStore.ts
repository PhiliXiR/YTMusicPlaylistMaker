import { create } from 'zustand'
import type { PlaylistPrivacy, SongInput } from '../types/shared'

interface PlaylistStore {
  title: string
  description: string
  privacyStatus: PlaylistPrivacy
  songText: string
  parsedSongs: SongInput[]
  duplicates: string[]
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setPrivacyStatus: (privacyStatus: PlaylistPrivacy) => void
  setSongText: (songText: string) => void
  setParsedSongs: (parsedSongs: SongInput[], duplicates: string[]) => void
  resetAll: () => void
}

const initialState = {
  title: '',
  description: '',
  privacyStatus: 'unlisted' as PlaylistPrivacy,
  songText: '',
  parsedSongs: [] as SongInput[],
  duplicates: [] as string[],
}

export const usePlaylistStore = create<PlaylistStore>((set) => ({
  ...initialState,
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setPrivacyStatus: (privacyStatus) => set({ privacyStatus }),
  setSongText: (songText) => set({ songText }),
  setParsedSongs: (parsedSongs, duplicates) => set({ parsedSongs, duplicates }),
  resetAll: () => set(initialState),
}))

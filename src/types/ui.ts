import type { SearchCandidate, SongInput } from './shared'

export interface PlaylistFormValues {
  title: string
  description: string
  privacyStatus: 'public' | 'unlisted' | 'private'
}

export interface BuildStats {
  total: number
  added: number
  skipped: number
  manualSelections: number
  failed: number
}

export interface FailedSong {
  song: SongInput
  reason: string
}

export interface ManualReviewState {
  song: SongInput
  candidates: SearchCandidate[]
}

export type BuildPhase =
  | 'idle'
  | 'auth-required'
  | 'creating-playlist'
  | 'searching'
  | 'completed'
  | 'error'

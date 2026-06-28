export type PlaylistPrivacy = 'public' | 'unlisted' | 'private'

export interface SongInput {
  id: string
  raw: string
  artist: string
  title: string
}

export interface PlaylistRequest {
  title: string
  description: string
  privacyStatus: PlaylistPrivacy
}

export interface AuthStatus {
  signedIn: boolean
  email?: string | undefined
  displayName?: string | undefined
}

export interface SearchCandidate {
  videoId: string
  title: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  score: number
  confidence: number
  flags: string[]
}

export interface SearchResponse {
  song: SongInput
  query: string
  candidates: SearchCandidate[]
  recommended?: SearchCandidate | undefined
}

export interface CreatePlaylistResponse {
  playlistId: string
  playlistUrl: string
}

export interface YoutubeBridge {
  getAuthStatus: () => Promise<AuthStatus>
  signIn: () => Promise<AuthStatus>
  signOut: () => Promise<void>
  createPlaylist: (payload: PlaylistRequest) => Promise<CreatePlaylistResponse>
  searchCandidates: (song: SongInput) => Promise<SearchResponse>
  addToPlaylist: (playlistId: string, videoId: string) => Promise<void>
}

declare global {
  interface Window {
    youtubeBridge: YoutubeBridge
  }
}

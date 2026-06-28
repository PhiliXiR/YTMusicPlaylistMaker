import { contextBridge, ipcRenderer } from 'electron'
import type {
  AuthStatus,
  CreatePlaylistResponse,
  PlaylistRequest,
  SearchResponse,
  SongInput,
  YoutubeBridge,
} from '../src/types/shared.js'

const youtubeBridge: YoutubeBridge = {
  getAuthStatus: () => ipcRenderer.invoke('auth:status') as Promise<AuthStatus>,
  signIn: () => ipcRenderer.invoke('auth:signin') as Promise<AuthStatus>,
  signOut: () => ipcRenderer.invoke('auth:signout') as Promise<void>,
  createPlaylist: (payload: PlaylistRequest) =>
    ipcRenderer.invoke('youtube:create-playlist', payload) as Promise<CreatePlaylistResponse>,
  searchCandidates: (song: SongInput) =>
    ipcRenderer.invoke('youtube:search-candidates', song) as Promise<SearchResponse>,
  addToPlaylist: (playlistId: string, videoId: string) =>
    ipcRenderer.invoke('youtube:add-to-playlist', playlistId, videoId) as Promise<void>,
}

contextBridge.exposeInMainWorld('youtubeBridge', youtubeBridge)

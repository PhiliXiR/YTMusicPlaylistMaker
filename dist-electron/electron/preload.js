import { contextBridge, ipcRenderer } from 'electron';
const youtubeBridge = {
    getAuthStatus: () => ipcRenderer.invoke('auth:status'),
    signIn: () => ipcRenderer.invoke('auth:signin'),
    signOut: () => ipcRenderer.invoke('auth:signout'),
    createPlaylist: (payload) => ipcRenderer.invoke('youtube:create-playlist', payload),
    searchCandidates: (song) => ipcRenderer.invoke('youtube:search-candidates', song),
    addToPlaylist: (playlistId, videoId) => ipcRenderer.invoke('youtube:add-to-playlist', playlistId, videoId),
};
contextBridge.exposeInMainWorld('youtubeBridge', youtubeBridge);

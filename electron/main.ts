import path from 'node:path'
import { app, BrowserWindow, ipcMain } from 'electron'
import dotenv from 'dotenv'
import { getAuthStatus, signInWithGoogle, signOut } from './services/googleAuth.js'
import {
  addVideoToPlaylist,
  createYoutubePlaylist,
  searchYoutubeCandidates,
} from './services/youtubeApi.js'
import type { PlaylistRequest, SongInput } from '../src/types/shared.js'

dotenv.config()

const isDev = !app.isPackaged

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#090a0f',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron/electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(app.getAppPath(), 'dist/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('auth:status', async () => getAuthStatus())
  ipcMain.handle('auth:signin', async () => signInWithGoogle())
  ipcMain.handle('auth:signout', async () => signOut())

  ipcMain.handle('youtube:create-playlist', async (_, payload: PlaylistRequest) =>
    createYoutubePlaylist(payload),
  )

  ipcMain.handle('youtube:search-candidates', async (_, song: SongInput) =>
    searchYoutubeCandidates(song),
  )

  ipcMain.handle('youtube:add-to-playlist', async (_, playlistId: string, videoId: string) =>
    addVideoToPlaylist(playlistId, videoId),
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

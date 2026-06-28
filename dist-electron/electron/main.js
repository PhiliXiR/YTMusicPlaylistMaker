import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import dotenv from 'dotenv';
import { getAuthStatus, signInWithGoogle, signOut } from './services/googleAuth.js';
import { addVideoToPlaylist, createYoutubePlaylist, searchYoutubeCandidates, } from './services/youtubeApi.js';
dotenv.config();
const isDev = !app.isPackaged;
function createWindow() {
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
            sandbox: true,
        },
    });
    if (isDev) {
        win.loadURL('http://localhost:5173');
    }
    else {
        win.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    }
}
app.whenReady().then(() => {
    ipcMain.handle('auth:status', async () => getAuthStatus());
    ipcMain.handle('auth:signin', async () => signInWithGoogle());
    ipcMain.handle('auth:signout', async () => signOut());
    ipcMain.handle('youtube:create-playlist', async (_, payload) => createYoutubePlaylist(payload));
    ipcMain.handle('youtube:search-candidates', async (_, song) => searchYoutubeCandidates(song));
    ipcMain.handle('youtube:add-to-playlist', async (_, playlistId, videoId) => addVideoToPlaylist(playlistId, videoId));
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

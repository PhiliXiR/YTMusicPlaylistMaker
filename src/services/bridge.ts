import type { YoutubeBridge } from '../types/shared'

export function getYoutubeBridge(): YoutubeBridge {
  if (typeof window === 'undefined' || !window.youtubeBridge) {
    throw new Error(
      'Electron bridge is unavailable. Start the app with "npm run dev" and use the Electron window, not a browser tab.',
    )
  }

  return window.youtubeBridge
}

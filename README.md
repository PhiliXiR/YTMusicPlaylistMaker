# YouTube Playlist Builder (Electron + React + TypeScript)

Desktop utility to create YouTube playlists from pasted song lists with smart matching, confidence scoring, and manual review when needed.

## Stack

- Electron
- React + TypeScript + Vite
- Material UI
- Zustand
- TanStack Query
- Google OAuth 2.0
- YouTube Data API v3
- ESLint + Prettier

## Setup

1. Install dependencies:
   npm install
2. Copy environment template:
   copy .env.example .env
3. Add Google credentials in .env:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
4. In Google Cloud Console:
   - Enable YouTube Data API v3
   - Create OAuth Client ID as Desktop app (recommended)
   - Add your account as a Test User in OAuth consent screen if app is in Testing mode

Note: For Desktop OAuth clients, you do not need to manually configure a fixed redirect URI.

## Scripts

- npm run dev: Start Vite + Electron with TS watch
- npm run typecheck: TypeScript checks
- npm run lint: ESLint
- npm run build: Build renderer and Electron
- npm run dist: Build distributable via electron-builder

## Feature Coverage

- Google sign-in via OAuth
- Playlist metadata form (name, description, privacy)
- Multi-line song paste parsing with duplicate detection
- Supports plain tracklists and numbered album text
- TXT/CSV drag-and-drop import
- Search scoring based on:
  - official artist channel
  - VEVO
  - official audio/video terms
  - topic channel
  - title and artist relevance
  - view count
- Auto-pick best candidate above confidence threshold
- Manual selection dialog for low-confidence matches
- Progress panel (current song, progress, success/fail counts)
- Result summary with playlist URL
- Export failed songs to TXT

## Architecture

- electron/main.ts: Browser window + IPC registration
- electron/preload.ts: secure context bridge
- electron/services/googleAuth.ts: OAuth flow + token persistence
- electron/services/youtubeApi.ts: YouTube Data API calls
- electron/services/searchScoring.ts: relevance scoring
- src/store/usePlaylistStore.ts: form and input state (Zustand)
- src/hooks/usePlaylistBuilder.ts: orchestration workflow
- src/components/*: modular UI
- src/types/shared.ts: shared contracts between renderer and Electron

## Notes

- OAuth tokens are stored in app userData (local machine).
- Manual review is triggered when confidence is below threshold.
- One high npm audit vulnerability currently exists in transitive dependencies (no functional blocker for dev).

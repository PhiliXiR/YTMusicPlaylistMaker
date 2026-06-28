import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { PlaylistForm } from './components/PlaylistForm'
import { ProgressPanel } from './components/ProgressPanel'
import { ResultsPanel } from './components/ResultsPanel'
import { ReviewDialog } from './components/ReviewDialog'
import { SongInputPanel } from './components/SongInputPanel'
import { usePlaylistBuilder } from './hooks/usePlaylistBuilder'
import { getYoutubeBridge } from './services/bridge'
import { parseSongsFromText } from './services/parseSongs'
import { usePlaylistStore } from './store/usePlaylistStore'

function App() {
  const {
    title,
    description,
    privacyStatus,
    songText,
    setTitle,
    setDescription,
    setPrivacyStatus,
    setSongText,
    setParsedSongs,
  } = usePlaylistStore()

  const authQuery = useQuery({
    queryKey: ['auth-status'],
    queryFn: () => getYoutubeBridge().getAuthStatus(),
  })

  const signInMutation = useMutation({
    mutationFn: () => getYoutubeBridge().signIn(),
    onSuccess: () => {
      authQuery.refetch()
    },
  })

  const signOutMutation = useMutation({
    mutationFn: () => getYoutubeBridge().signOut(),
    onSuccess: () => {
      authQuery.refetch()
    },
  })

  const builder = usePlaylistBuilder()

  const inputStats = useMemo(() => {
    return parseSongsFromText(songText)
  }, [songText])

  const canCreate =
    Boolean(title.trim()) &&
    inputStats.songs.length > 0 &&
    authQuery.data?.signedIn &&
    !builder.isBusy

  const handleStart = async () => {
    const parsed = parseSongsFromText(songText)
    setParsedSongs(parsed.songs, parsed.duplicates)

    await builder.buildPlaylist(
      {
        title,
        description,
        privacyStatus,
      },
      parsed.songs,
    )
  }

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 15% 20%, rgba(106,227,198,0.18), transparent 36%), radial-gradient(circle at 90% 10%, rgba(122,180,255,0.22), transparent 35%), #07080d',
          py: { xs: 3, md: 6 },
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Paper sx={{ p: 3, background: 'rgba(12,15,22,0.8)' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={2}
              >
                <div>
                  <Typography variant="h4">YouTube Playlist Builder</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Build playlists from pasted tracklists in seconds.
                  </Typography>
                </div>
                <Stack direction="row" spacing={1}>
                  {authQuery.data?.signedIn ? (
                    <Button
                      variant="outlined"
                      startIcon={<LogoutRoundedIcon />}
                      onClick={() => signOutMutation.mutate()}
                      disabled={signOutMutation.isPending}
                    >
                      Sign out ({authQuery.data.displayName ?? authQuery.data.email})
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<LoginRoundedIcon />}
                      onClick={() => signInMutation.mutate()}
                      disabled={signInMutation.isPending}
                    >
                      Sign in with Google
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>

            {!authQuery.data?.signedIn && (
              <Alert severity="warning">
                Google sign-in is required before creating playlists. Add GOOGLE_CLIENT_ID and
                GOOGLE_CLIENT_SECRET to .env first.
              </Alert>
            )}

            {signInMutation.error && (
              <Alert severity="error">
                Sign-in failed:{' '}
                {signInMutation.error instanceof Error
                  ? signInMutation.error.message
                  : 'Unknown OAuth error'}
              </Alert>
            )}

            {builder.runError && <Alert severity="error">Playlist build failed: {builder.runError}</Alert>}

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
              <Stack spacing={3} flex={1.2}>
                <PlaylistForm
                  title={title}
                  description={description}
                  privacyStatus={privacyStatus}
                  onTitleChange={setTitle}
                  onDescriptionChange={setDescription}
                  onPrivacyChange={setPrivacyStatus}
                />
                <SongInputPanel
                  value={songText}
                  duplicates={inputStats.duplicates}
                  onChange={setSongText}
                />
              </Stack>

              <Stack spacing={3} flex={1}>
                <ProgressPanel
                  phase={builder.phase}
                  progress={builder.progress}
                  currentSong={builder.currentSong}
                  stats={builder.stats}
                />

                <Paper sx={{ p: 3, background: 'rgba(15,18,29,0.75)' }}>
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Parsed songs: {inputStats.songs.length}
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={builder.isBusy ? <CircularProgress size={18} /> : <PlaylistAddRoundedIcon />}
                      disabled={!canCreate}
                      onClick={() => {
                        void handleStart()
                      }}
                    >
                      Create Playlist
                    </Button>
                  </Stack>
                </Paper>

                <ResultsPanel
                  playlistUrl={builder.playlistUrl}
                  total={builder.stats.total}
                  added={builder.stats.added}
                  skipped={builder.stats.skipped}
                  manual={builder.stats.manualSelections}
                  failedSongs={builder.failedSongs}
                />
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <ReviewDialog state={builder.manualReview} onSelect={builder.chooseManualCandidate} />
    </>
  )
}

export default App

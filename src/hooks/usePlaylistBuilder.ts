import { useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getYoutubeBridge } from '../services/bridge'
import type {
  PlaylistRequest,
  SearchCandidate,
  SongInput,
} from '../types/shared'
import type { BuildPhase, BuildStats, FailedSong, ManualReviewState } from '../types/ui'

const CONFIDENCE_THRESHOLD = 62

function initialStats(total: number): BuildStats {
  return {
    total,
    added: 0,
    skipped: 0,
    manualSelections: 0,
    failed: 0,
  }
}

export function usePlaylistBuilder() {
  const [phase, setPhase] = useState<BuildPhase>('idle')
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [currentSong, setCurrentSong] = useState('')
  const [runError, setRunError] = useState<string | null>(null)
  const [stats, setStats] = useState<BuildStats>(initialStats(0))
  const [failedSongs, setFailedSongs] = useState<FailedSong[]>([])
  const [manualReview, setManualReview] = useState<ManualReviewState | null>(null)
  const manualResolveRef = useRef<((value: SearchCandidate | null) => void) | null>(null)

  const createPlaylistMutation = useMutation({
    mutationFn: (payload: PlaylistRequest) => getYoutubeBridge().createPlaylist(payload),
  })

  const searchMutation = useMutation({
    mutationFn: (song: SongInput) => getYoutubeBridge().searchCandidates(song),
  })

  const addMutation = useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      getYoutubeBridge().addToPlaylist(playlistId, videoId),
  })

  async function resolveCandidate(song: SongInput): Promise<{ candidate: SearchCandidate | null; manual: boolean }> {
    const directSearch = await searchMutation.mutateAsync(song)
    let bestResponse = directSearch

    if (song.artist && directSearch.recommended && directSearch.recommended.confidence < 55) {
      const swapped: SongInput = {
        ...song,
        artist: song.title,
        title: song.artist,
      }

      const swappedSearch = await searchMutation.mutateAsync(swapped)
      if ((swappedSearch.recommended?.confidence ?? 0) > (directSearch.recommended?.confidence ?? 0)) {
        bestResponse = {
          ...swappedSearch,
          song,
        }
      }
    }

    const recommendation = bestResponse.recommended
    if (!recommendation) {
      return { candidate: null, manual: false }
    }

    if (recommendation.confidence >= CONFIDENCE_THRESHOLD) {
      return { candidate: recommendation, manual: false }
    }

    setManualReview({
      song,
      candidates: bestResponse.candidates,
    })

    const selected = await new Promise<SearchCandidate | null>((resolve) => {
      manualResolveRef.current = resolve
    })

    setManualReview(null)
    return { candidate: selected, manual: Boolean(selected) }
  }

  function chooseManualCandidate(candidate: SearchCandidate | null): void {
    if (manualResolveRef.current) {
      manualResolveRef.current(candidate)
      manualResolveRef.current = null
    }
  }

  async function buildPlaylist(payload: PlaylistRequest, songs: SongInput[]): Promise<void> {
    if (songs.length === 0) {
      setPhase('error')
      setRunError('No songs to process. Paste songs first.')
      return
    }

    setPhase('creating-playlist')
    setRunError(null)
    setStats(initialStats(songs.length))
    setFailedSongs([])
    setPlaylistUrl('')
    setCurrentSong('')

    try {
      const { playlistId, playlistUrl: createdUrl } = await createPlaylistMutation.mutateAsync(payload)
      setPlaylistUrl(createdUrl)

      setPhase('searching')

      for (const song of songs) {
        setCurrentSong(song.raw)

        try {
          const resolved = await resolveCandidate(song)

          if (!resolved.candidate) {
            setFailedSongs((prev) => [...prev, { song, reason: 'No confident match found' }])
            setStats((prev) => ({ ...prev, failed: prev.failed + 1, skipped: prev.skipped + 1 }))
            continue
          }

          await addMutation.mutateAsync({ playlistId, videoId: resolved.candidate.videoId })

          setStats((prev) => ({
            ...prev,
            added: prev.added + 1,
            manualSelections: prev.manualSelections + (resolved.manual ? 1 : 0),
          }))
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Unexpected error'
          setFailedSongs((prev) => [...prev, { song, reason }])
          setStats((prev) => ({ ...prev, failed: prev.failed + 1, skipped: prev.skipped + 1 }))
        }
      }

      setCurrentSong('')
      setPhase('completed')
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Failed to create playlist. Check Google auth and YouTube API setup.'
      setRunError(reason)
      setCurrentSong('')
      setPhase('error')
    }
  }

  function resetRunState(): void {
    setPhase('idle')
    setCurrentSong('')
    setPlaylistUrl('')
    setRunError(null)
    setStats(initialStats(0))
    setFailedSongs([])
    setManualReview(null)
  }

  const progress = useMemo(() => {
    if (stats.total === 0) {
      return 0
    }

    const completed = stats.added + stats.skipped
    return Math.round((completed / stats.total) * 100)
  }, [stats])

  return {
    phase,
    currentSong,
    playlistUrl,
    stats,
    runError,
    failedSongs,
    manualReview,
    progress,
    isBusy:
      createPlaylistMutation.isPending || searchMutation.isPending || addMutation.isPending,
    buildPlaylist,
    chooseManualCandidate,
    resetRunState,
  }
}

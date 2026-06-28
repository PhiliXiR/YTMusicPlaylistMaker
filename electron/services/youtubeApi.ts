import { google } from 'googleapis'
import type {
  CreatePlaylistResponse,
  PlaylistRequest,
  SearchCandidate,
  SearchResponse,
  SongInput,
} from '../../src/types/shared.js'
import { getAuthorizedClient } from './googleAuth.js'
import { scoreCandidate } from './searchScoring.js'

interface GoogleApiErrorPayload {
  error?: {
    message?: string
    errors?: Array<{
      reason?: string
      message?: string
    }>
  }
}

function toYoutubeError(error: unknown, action: string): Error {
  const fallback = `YouTube API request failed while trying to ${action}.`
  if (!error || typeof error !== 'object') {
    return new Error(fallback)
  }

  const candidate = error as {
    message?: string
    response?: {
      status?: number
      data?: GoogleApiErrorPayload
    }
  }

  const status = candidate.response?.status
  const apiPayload = candidate.response?.data
  const reason = apiPayload?.error?.errors?.[0]?.reason
  const apiMessage = apiPayload?.error?.message

  if (reason === 'youtubeSignupRequired' || reason === 'NoLinkedYouTubeAccount') {
    return new Error(
      'This Google account does not have a YouTube channel yet. Open youtube.com once and create a channel, then sign in again.',
    )
  }

  if (reason === 'insufficientPermissions' || status === 401) {
    return new Error(
      'Google sign-in is missing YouTube permissions. Sign out, then sign in again and grant all requested scopes.',
    )
  }

  if (reason === 'quotaExceeded') {
    return new Error('YouTube API quota exceeded for this Google Cloud project.')
  }

  return new Error(`${fallback} ${apiMessage ?? candidate.message ?? 'Unknown error.'}`)
}

async function getYoutubeClient() {
  const auth = await getAuthorizedClient()
  if (!auth) {
    throw new Error('Not authenticated. Sign in with Google first.')
  }
  return google.youtube({ version: 'v3', auth })
}

export async function createYoutubePlaylist(
  payload: PlaylistRequest,
): Promise<CreatePlaylistResponse> {
  const youtube = await getYoutubeClient()

  try {
    const { data } = await youtube.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: payload.title,
          description: payload.description,
        },
        status: {
          privacyStatus: payload.privacyStatus,
        },
      },
    })

    if (!data.id) {
      throw new Error('Failed to create playlist')
    }

    return {
      playlistId: data.id,
      playlistUrl: `https://www.youtube.com/playlist?list=${data.id}`,
    }
  } catch (error) {
    throw toYoutubeError(error, 'create a playlist')
  }
}

export async function searchYoutubeCandidates(song: SongInput): Promise<SearchResponse> {
  const youtube = await getYoutubeClient()
  const query = `${song.artist} ${song.title} official`

  let searchResult
  try {
    searchResult = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: 10,
      videoCategoryId: '10',
    })
  } catch (error) {
    throw toYoutubeError(error, `search for "${song.raw}"`)
  }

  const videoIds = (searchResult.data.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((value): value is string => Boolean(value))

  if (videoIds.length === 0) {
    return { song, query, candidates: [] }
  }

  let videosResult
  try {
    videosResult = await youtube.videos.list({
      part: ['statistics', 'snippet'],
      id: videoIds,
      maxResults: 10,
    })
  } catch (error) {
    throw toYoutubeError(error, `load video details for "${song.raw}"`)
  }

  const scored = (videosResult.data.items ?? [])
    .map((item): SearchCandidate | null => {
      if (!item.id || !item.snippet) {
        return null
      }

      const base: SearchCandidate = {
        videoId: item.id,
        title: item.snippet.title ?? 'Unknown title',
        channelTitle: item.snippet.channelTitle ?? 'Unknown channel',
        publishedAt: item.snippet.publishedAt ?? '',
        viewCount: Number(item.statistics?.viewCount ?? 0),
        score: 0,
        confidence: 0,
        flags: [],
      }

      return scoreCandidate(song, base)
    })
    .filter((item): item is SearchCandidate => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return {
    song,
    query,
    candidates: scored,
    ...(scored[0] ? { recommended: scored[0] } : {}),
  }
}

export async function addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
  const youtube = await getYoutubeClient()

  try {
    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId,
          },
        },
      },
    })
  } catch (error) {
    throw toYoutubeError(error, 'add a video to the playlist')
  }
}

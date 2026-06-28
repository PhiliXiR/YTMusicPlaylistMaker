import { google } from 'googleapis';
import { getAuthorizedClient } from './googleAuth.js';
import { scoreCandidate } from './searchScoring.js';
async function getYoutubeClient() {
    const auth = await getAuthorizedClient();
    if (!auth) {
        throw new Error('Not authenticated. Sign in with Google first.');
    }
    return google.youtube({ version: 'v3', auth });
}
export async function createYoutubePlaylist(payload) {
    const youtube = await getYoutubeClient();
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
    });
    if (!data.id) {
        throw new Error('Failed to create playlist');
    }
    return {
        playlistId: data.id,
        playlistUrl: `https://www.youtube.com/playlist?list=${data.id}`,
    };
}
export async function searchYoutubeCandidates(song) {
    const youtube = await getYoutubeClient();
    const query = `${song.artist} ${song.title} official`;
    const searchResult = await youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults: 10,
        videoCategoryId: '10',
    });
    const videoIds = (searchResult.data.items ?? [])
        .map((item) => item.id?.videoId)
        .filter((value) => Boolean(value));
    if (videoIds.length === 0) {
        return { song, query, candidates: [] };
    }
    const videosResult = await youtube.videos.list({
        part: ['statistics', 'snippet'],
        id: videoIds,
        maxResults: 10,
    });
    const scored = (videosResult.data.items ?? [])
        .map((item) => {
        if (!item.id || !item.snippet) {
            return null;
        }
        const base = {
            videoId: item.id,
            title: item.snippet.title ?? 'Unknown title',
            channelTitle: item.snippet.channelTitle ?? 'Unknown channel',
            publishedAt: item.snippet.publishedAt ?? '',
            viewCount: Number(item.statistics?.viewCount ?? 0),
            score: 0,
            confidence: 0,
            flags: [],
        };
        return scoreCandidate(song, base);
    })
        .filter((item) => Boolean(item))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    return {
        song,
        query,
        candidates: scored,
        ...(scored[0] ? { recommended: scored[0] } : {}),
    };
}
export async function addVideoToPlaylist(playlistId, videoId) {
    const youtube = await getYoutubeClient();
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
    });
}

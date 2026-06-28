const OFFICIAL_TERMS = ['official', 'music video', 'official audio', 'audio'];
function normalize(value) {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
}
function includesAny(source, terms) {
    return terms.some((term) => source.includes(term));
}
function overlapCount(a, b) {
    const aSet = new Set(normalize(a).split(' '));
    const bSet = new Set(normalize(b).split(' '));
    let count = 0;
    aSet.forEach((token) => {
        if (bSet.has(token)) {
            count += 1;
        }
    });
    return count;
}
function toConfidence(score) {
    return Math.max(0, Math.min(100, Math.round((score / 160) * 100)));
}
export function scoreCandidate(song, candidate) {
    const title = normalize(candidate.title);
    const channel = normalize(candidate.channelTitle);
    const artist = normalize(song.artist);
    const track = normalize(song.title);
    const combined = `${artist} ${track}`;
    let score = 0;
    const flags = [];
    const titleContainsArtist = title.includes(artist);
    const titleContainsTrack = title.includes(track);
    const channelContainsArtist = channel.includes(artist);
    if (titleContainsArtist) {
        score += 28;
        flags.push('artist in title');
    }
    if (titleContainsTrack) {
        score += 34;
        flags.push('title match');
    }
    if (channelContainsArtist) {
        score += 38;
        flags.push('official artist channel');
    }
    if (channel.includes('vevo')) {
        score += 24;
        flags.push('vevo channel');
    }
    if (includesAny(title, OFFICIAL_TERMS)) {
        score += 16;
        flags.push('official audio/video term');
    }
    if (channel.includes('topic')) {
        score += 12;
        flags.push('topic channel');
    }
    const overlap = overlapCount(combined, title);
    score += overlap * 6;
    if (candidate.viewCount > 50_000_000) {
        score += 12;
    }
    else if (candidate.viewCount > 5_000_000) {
        score += 8;
    }
    else if (candidate.viewCount > 500_000) {
        score += 4;
    }
    if (title === `${artist} - ${track}` || title === `${track} - ${artist}`) {
        score += 22;
        flags.push('exact title pattern match');
    }
    return {
        ...candidate,
        score,
        confidence: toConfidence(score),
        flags,
    };
}

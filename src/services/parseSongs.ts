import type { SongInput } from '../types/shared'

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function sanitizeTitle(value: string): string {
  return value.replace(/^\d+[.)-]\s*/, '').trim()
}

export function parseSongsFromText(text: string): {
  songs: SongInput[]
  duplicates: string[]
} {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const songs: SongInput[] = []
  const seen = new Set<string>()
  const duplicates: string[] = []

  lines.forEach((line, index) => {
    const cleaned = sanitizeTitle(line)
    const parts = cleaned.split(/\s+-\s+/)

    const artist = parts.length >= 2 ? (parts[0] ?? '').trim() : ''
    const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : cleaned

    const rawKey = normalizeKey(`${artist}|${title}`)
    if (seen.has(rawKey)) {
      duplicates.push(line)
      return
    }

    seen.add(rawKey)
    songs.push({
      id: `${index}-${rawKey}`,
      raw: line,
      artist,
      title,
    })
  })

  return { songs, duplicates }
}

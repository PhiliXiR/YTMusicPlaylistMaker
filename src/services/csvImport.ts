import Papa from 'papaparse'

export function csvToSongLines(content: string): string[] {
  const parsed = Papa.parse<string[]>(content.trim(), {
    skipEmptyLines: true,
  })

  return (parsed.data ?? [])
    .map((row) => row.filter(Boolean).join(' - ').trim())
    .filter((line) => line.length > 0)
}

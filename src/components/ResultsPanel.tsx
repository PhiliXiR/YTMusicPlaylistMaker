import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Button, Link, Paper, Stack, Typography } from '@mui/material'
import type { FailedSong } from '../types/ui'

interface ResultsPanelProps {
  playlistUrl: string
  total: number
  added: number
  skipped: number
  manual: number
  failedSongs: FailedSong[]
}

function exportFailedSongs(failedSongs: FailedSong[]): void {
  const lines = failedSongs.map((item) => `${item.song.raw} :: ${item.reason}`)
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'failed-songs.txt'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ResultsPanel(props: ResultsPanelProps) {
  if (!props.playlistUrl) {
    return null
  }

  return (
    <Paper sx={{ p: 3, background: 'rgba(15,18,29,0.75)' }}>
      <Stack spacing={2}>
        <Typography variant="h6">Results</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <OpenInNewRoundedIcon fontSize="small" />
          <Link href={props.playlistUrl} target="_blank" rel="noreferrer">
            {props.playlistUrl}
          </Link>
        </Stack>
        <Typography variant="body2">
          Songs Requested: {props.total} | Songs Added: {props.added} | Songs Skipped: {props.skipped} |
          Manually Selected: {props.manual}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadRoundedIcon />}
          disabled={props.failedSongs.length === 0}
          onClick={() => exportFailedSongs(props.failedSongs)}
        >
          Export failed songs to TXT
        </Button>
      </Stack>
    </Paper>
  )
}

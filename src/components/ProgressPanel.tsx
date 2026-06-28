import { LinearProgress, Paper, Stack, Typography } from '@mui/material'
import type { BuildPhase, BuildStats } from '../types/ui'

interface ProgressPanelProps {
  phase: BuildPhase
  progress: number
  currentSong: string
  stats: BuildStats
}

function phaseLabel(phase: BuildPhase): string {
  switch (phase) {
    case 'creating-playlist':
      return 'Creating playlist...'
    case 'searching':
      return 'Searching songs and adding videos...'
    case 'completed':
      return 'Completed'
    case 'error':
      return 'Error'
    default:
      return 'Ready'
  }
}

export function ProgressPanel({ phase, progress, currentSong, stats }: ProgressPanelProps) {
  return (
    <Paper sx={{ p: 3, background: 'rgba(15,18,29,0.75)' }}>
      <Stack spacing={2}>
        <Typography variant="h6">Progress</Typography>
        <Typography variant="body2" color="text.secondary">
          {phaseLabel(phase)}
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 10 }} />
        <Typography variant="body2">Current song: {currentSong || 'Waiting...'}</Typography>
        <Typography variant="body2">
          Added: {stats.added} | Skipped: {stats.skipped} | Manual: {stats.manualSelections} | Failed:{' '}
          {stats.failed}
        </Typography>
      </Stack>
    </Paper>
  )
}

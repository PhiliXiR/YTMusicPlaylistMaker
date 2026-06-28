import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import type { SearchCandidate } from '../types/shared'
import type { ManualReviewState } from '../types/ui'

interface ReviewDialogProps {
  state: ManualReviewState | null
  onSelect: (candidate: SearchCandidate | null) => void
}

export function ReviewDialog({ state, onSelect }: ReviewDialogProps) {
  return (
    <Dialog open={Boolean(state)} fullWidth maxWidth="md">
      <DialogTitle>Low Confidence Match</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Pick the best result for: {state?.song.raw}
        </Typography>
        <List dense>
          {state?.candidates.map((candidate) => (
            <ListItem key={candidate.videoId} disablePadding sx={{ mb: 1 }}>
              <ListItemButton onClick={() => onSelect(candidate)}>
                <ListItemText
                  primary={candidate.title}
                  secondary={`${candidate.channelTitle} • confidence ${candidate.confidence}%`}
                />
                <Stack direction="row" spacing={0.5}>
                  {candidate.flags.slice(0, 2).map((flag) => (
                    <Chip key={flag} label={flag} size="small" />
                  ))}
                </Stack>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onSelect(null)} color="inherit">
          Skip Song
        </Button>
      </DialogActions>
    </Dialog>
  )
}

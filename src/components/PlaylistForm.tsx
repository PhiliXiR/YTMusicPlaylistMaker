import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { PlaylistPrivacy } from '../types/shared'

interface PlaylistFormProps {
  title: string
  description: string
  privacyStatus: PlaylistPrivacy
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPrivacyChange: (value: PlaylistPrivacy) => void
}

export function PlaylistForm(props: PlaylistFormProps) {
  return (
    <Paper sx={{ p: 3, background: 'rgba(15,18,29,0.75)' }}>
      <Stack spacing={2.5}>
        <Typography variant="h6">Playlist Creation</Typography>
        <TextField
          label="Playlist Name"
          value={props.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          fullWidth
        />
        <TextField
          label="Playlist Description"
          value={props.description}
          onChange={(event) => props.onDescriptionChange(event.target.value)}
          fullWidth
          multiline
          minRows={3}
        />
        <FormControl fullWidth>
          <InputLabel id="privacy-label">Privacy</InputLabel>
          <Select
            labelId="privacy-label"
            label="Privacy"
            value={props.privacyStatus}
            onChange={(event) => props.onPrivacyChange(event.target.value as PlaylistPrivacy)}
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="unlisted">Unlisted</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Paper>
  )
}

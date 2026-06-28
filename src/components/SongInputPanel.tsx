import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Alert, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { csvToSongLines } from '../services/csvImport'

interface SongInputPanelProps {
  value: string
  duplicates: string[]
  onChange: (value: string) => void
}

export function SongInputPanel({ value, duplicates, onChange }: SongInputPanelProps) {
  const onDrop = async (files: File[]) => {
    const file = files[0]
    if (!file) {
      return
    }

    const text = await file.text()
    if (file.name.toLowerCase().endsWith('.csv')) {
      onChange(csvToSongLines(text).join('\n'))
      return
    }

    onChange(text)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
  })

  return (
    <Paper sx={{ p: 3, background: 'rgba(15,18,29,0.75)' }}>
      <Stack spacing={2}>
        <Typography variant="h6">Song Import</Typography>
        <TextField
          value={value}
          onChange={(event) => onChange(event.target.value)}
          multiline
          minRows={12}
          placeholder="Noah Kahan - Stick Season"
          fullWidth
        />
        <div
          {...getRootProps()}
          style={{
            border: '1px dashed rgba(122,180,255,0.7)',
            borderRadius: 12,
            padding: '16px',
            cursor: 'pointer',
            background: isDragActive ? 'rgba(122,180,255,0.12)' : 'rgba(255,255,255,0.02)',
          }}
        >
          <input {...getInputProps()} />
          <Stack direction="row" spacing={1} alignItems="center">
            <UploadFileRoundedIcon />
            <Typography variant="body2">
              Drag and drop TXT/CSV here, or click to upload
            </Typography>
          </Stack>
        </div>

        {duplicates.length > 0 && (
          <Alert severity="info">
            <Typography variant="body2" sx={{ mb: 1 }}>
              Duplicate lines ignored:
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {duplicates.slice(0, 8).map((line) => (
                <Chip key={line} label={line} size="small" />
              ))}
            </Stack>
          </Alert>
        )}

        <Button
          variant="outlined"
          onClick={() => {
            onChange('')
          }}
        >
          Clear Input
        </Button>
      </Stack>
    </Paper>
  )
}

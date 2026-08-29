import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CloseIcon from '@mui/icons-material/Close'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'

export const PdfViewer = ({
  open,
  onClose,
  pdfUrl,
  title = 'Document Preview',
  fileName = 'PCMC_Document.pdf'
}) => {
  const [loading, setLoading] = useState(true)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleDownload = () => {
    if (!pdfUrl) return
    const link = document.createElement('a')
    link.href = pdfUrl
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleOpenNewTab = () => {
    if (!pdfUrl) return
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          height: { xs: '100%', sm: '90vh' },
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5,
          px: { xs: 1.5, sm: 2.5 },
          borderBottom: '1px solid rgba(0,0,0,0.12)',
          bgcolor: '#f8fafc',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <PictureAsPdfIcon color="error" />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenNewTab}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Open in Tab
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#1e40af' }}
          >
            Download PDF
          </Button>
          <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative', flex: 1, bgcolor: '#525659', overflow: 'hidden' }}>
        {pdfUrl ? (
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#525659',
                  color: '#fff',
                  zIndex: 1
                }}
              >
                <CircularProgress color="inherit" size={36} />
                <Typography variant="body2" sx={{ mt: 1.5 }}>Rendering PCMC Official Document...</Typography>
              </Box>
            )}
            <iframe
              src={`${pdfUrl}#toolbar=1&view=FitH`}
              title={title}
              width="100%"
              height="100%"
              style={{ border: 'none', display: 'block' }}
              onLoad={() => setLoading(false)}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', gap: 2 }}>
            <CircularProgress color="inherit" size={36} />
            <Typography>Loading PCMC Official Document...</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PdfViewer

import React, { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, MenuItem, Typography, CircularProgress, Alert,
  useTheme, useMediaQuery
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import dakhalaService from '../../services/dakhala.service'
import PdfViewer from '../../components/document/PdfViewer'

export const DakhalaDialog = ({ open, onClose, sapWorkKey, mbs = [], raBills = [] }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('FIRST_RA_CHECKLIST')
  const [selectedMb, setSelectedMb] = useState('')
  const [selectedRaBill, setSelectedRaBill] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [openPdfViewer, setOpenPdfViewer] = useState(false)

  useEffect(() => {
    if (open) {
      dakhalaService.getTemplates()
        .then(res => setTemplates(res.data.data || []))
        .catch(err => console.error(err))
    }
  }, [open])

  const handleGenerate = async () => {
    if (!sapWorkKey || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await dakhalaService.generatePdf(sapWorkKey, {
        template_type: selectedTemplate,
        mb_id: selectedMb || null,
        ra_bill_id: selectedRaBill || null
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      setPdfUrl(url)
      setOpenPdfViewer(true)
    } catch (err) {
      console.error(err)
      let message = err.response?.data?.message
      if (!message && err.response?.data instanceof Blob) {
        try {
          const errorData = JSON.parse(await err.response.data.text())
          message = errorData.message
        } catch {
          message = ''
        }
      }
      setError(message || 'Certificate generation failed. Please check inputs.')
    } finally {
      setLoading(false)
    }
  }

  const currentTpl = templates.find(t => t.id === selectedTemplate)

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Official Dakhala & Certificate Subsystem</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Dakhala / Certificate Template"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templates.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} — {t.marathiTitle}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {currentTpl && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Description:</strong> {currentTpl.description}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Link to Measurement Book (Optional)"
                value={selectedMb}
                onChange={(e) => setSelectedMb(e.target.value)}
              >
                <MenuItem value="">None (Project Level)</MenuItem>
                {mbs.map(mb => (
                  <MenuItem key={mb.id} value={mb.id}>
                    {mb.mb_number} ({mb.mb_date})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Link to RA Bill (Optional)"
                value={selectedRaBill}
                onChange={(e) => setSelectedRaBill(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {raBills.map(b => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.bill_number} (₹{Number(b.net_payable).toLocaleString('en-IN')})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Official PDF Certificate'}
          </Button>
        </DialogActions>
      </Dialog>

      <PdfViewer
        open={openPdfViewer}
        onClose={() => setOpenPdfViewer(false)}
        pdfUrl={pdfUrl}
        title={currentTpl ? `${currentTpl.name} Certificate` : 'Dakhala Certificate'}
        fileName={`${selectedTemplate}_${sapWorkKey}.pdf`}
      />
    </>
  )
}

export default DakhalaDialog


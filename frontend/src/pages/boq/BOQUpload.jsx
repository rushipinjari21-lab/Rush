import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Card, CardContent, Button, Alert, CircularProgress, TextField, MenuItem } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import boqService from '../../services/boq.service'
import projectService from '../../services/project.service'

const BOQUpload = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const rawKey = params['*'] || params.sapWorkKey || new URLSearchParams(location.search).get('project') || ''
  const decodedRouteKey = rawKey ? decodeURIComponent(rawKey) : ''

  const [allProjects, setAllProjects] = useState([])
  const [selectedSapKey, setSelectedSapKey] = useState(decodedRouteKey)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    projectService.getAll({ limit: 100 }).then(res => {
      const list = res.data?.data?.projects || []
      setAllProjects(list)
      if (!decodedRouteKey && list.length > 0) {
        setSelectedSapKey(list[0].sap_work_key)
      } else if (decodedRouteKey) {
        setSelectedSapKey(decodedRouteKey)
      }
    }).catch(err => console.error(err))
  }, [decodedRouteKey])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    const isPdf = selected && (selected.type === 'application/pdf' || /\.pdf$/i.test(selected.name))
    if (isPdf) {
      setFile(selected)
      setError('')
    } else {
      setFile(null)
      setError('Please select a valid PDF file')
    }
  }

  const handleUpload = async () => {
    if (!selectedSapKey) {
      setError('Please select a project first')
      return
    }
    if (!file || loading) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await boqService.upload(selectedSapKey, file)
      const totalItems = res.data?.data?.total_items || 0
      setSuccess(`✅ Successfully extracted ${totalItems} Schedule B items! Redirecting to BOQ list...`)
      setTimeout(() => navigate(`/boq?project=${encodeURIComponent(selectedSapKey)}`), 1500)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed. Check that the backend is running, then try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '1.9rem' }, fontWeight: 700 }} gutterBottom>
        Upload Schedule B / BOQ PDF
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Upload the official PCMC Schedule B PDF to automatically extract Part A, B, C, D sections, SSR codes, quantities, and rates.
      </Typography>

      <Card sx={{ maxWidth: 640, mt: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Select Project to Upload Schedule B for"
            value={selectedSapKey}
            onChange={(e) => setSelectedSapKey(e.target.value)}
            sx={{ mb: 3, textAlign: 'left' }}
          >
            {allProjects.map(p => (
              <MenuItem key={p.sap_work_key} value={p.sap_work_key}>
                {p.sap_work_key} — {p.work_name} ({p.contractor_name})
              </MenuItem>
            ))}
          </TextField>

          <input accept="application/pdf" style={{ display: 'none' }} id="boq-pdf-upload" type="file" onChange={handleFileChange} />
          <label htmlFor="boq-pdf-upload">
            <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
              Select Schedule B PDF
            </Button>
          </label>

          {file && (
            <Typography variant="body1" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
              Selected File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Original text-based Schedule B PDFs from PCMC are parsed natively with Part sections, SSR codes, descriptions, and amounts.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || !selectedSapKey || loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Reading & Parsing PDF...' : 'Upload & Parse Schedule B'}
            </Button>
            <Button
              onClick={() => navigate(`/boq?project=${encodeURIComponent(selectedSapKey)}`)}
              disabled={loading}
            >
              Back to BOQ
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default BOQUpload

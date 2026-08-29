import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Typography, Button, Card, CardContent, TextField, Grid,
  MenuItem, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, Chip, Tooltip, Paper
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ReceiptIcon from '@mui/icons-material/Receipt'
import TableViewIcon from '@mui/icons-material/TableView'
import StraightenIcon from '@mui/icons-material/Straighten'
import BusinessIcon from '@mui/icons-material/Business'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'

import measurementService from '../../services/measurement.service'
import { downloadBlob } from '../../utils/fileDownload.js'
import projectService from '../../services/project.service'
import boqService from '../../services/boq.service'
import rabillService from '../../services/rabill.service'
import DakhalaDialog from '../../features/dakhala/DakhalaDialog'
import PdfViewer from '../../components/document/PdfViewer'

export const MBListPage = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const rawKey = params['*'] || params.sapWorkKey || new URLSearchParams(location.search).get('project') || ''
  const decodedRouteKey = rawKey ? decodeURIComponent(rawKey) : ''

  const [allProjects, setAllProjects] = useState([])
  const [activeSapKey, setActiveSapKey] = useState(decodedRouteKey)
  const [project, setProject] = useState(null)
  const [mbs, setMbs] = useState([])
  const [boqItems, setBoqItems] = useState([])
  const [raBills, setRaBills] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false)
  const [openDakhalaDialog, setOpenDakhalaDialog] = useState(false)
  const [deleteMbConfirm, setDeleteMbConfirm] = useState(null)

  // PDF Preview state
  const [pdfPreview, setPdfPreview] = useState({ open: false, url: '', title: '', fileName: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // MB Creation Form
  const [mbForm, setMbForm] = useState({
    mb_number: 'MB-01',
    mb_date: new Date(),
    description: 'Measurement Book'
  })

  useEffect(() => {
    projectService.getAll({ limit: 100 }).then(res => {
      const list = res.data?.data?.projects || []
      setAllProjects(list)
      if (!decodedRouteKey && list.length > 0) {
        setActiveSapKey(list[0].sap_work_key)
      } else if (decodedRouteKey) {
        setActiveSapKey(decodedRouteKey)
      }
    }).catch(err => console.error(err))
  }, [decodedRouteKey])

  useEffect(() => {
    if (activeSapKey) {
      loadData(activeSapKey)
    }
  }, [activeSapKey])

  const loadData = async (sapKey) => {
    setLoading(true)
    try {
      const [projRes, mbRes, boqRes, raRes] = await Promise.all([
        projectService.getBySapKey(sapKey),
        measurementService.getByProject(sapKey),
        boqService.getByProject(sapKey),
        rabillService.getByProject(sapKey)
      ])
      setProject(projRes.data?.data)
      setMbs(mbRes.data?.data || [])
      setBoqItems(boqRes.data?.data || [])
      setRaBills(raRes.data?.data || [])
    } catch (error) {
      console.error('Failed to load MB data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMB = async () => {
    if (!activeSapKey) {
      alert('Please select a project first')
      return
    }
    setActionLoading(true)
    try {
      const res = await measurementService.createMB({
        sap_work_key: activeSapKey,
        mb_number: mbForm.mb_number,
        description: mbForm.description,
        mb_date: mbForm.mb_date.toISOString().split('T')[0]
      })
      setOpenDialog(false)
      setSnackbar({ open: true, message: `✅ Measurement Book ${mbForm.mb_number} created successfully!`, severity: 'success' })
      await loadData(activeSapKey)
      if (res.data?.data?.id) {
        navigate(`/measurement/sheet/${res.data.data.id}?project=${encodeURIComponent(activeSapKey)}`)
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to create MB', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteMB = async (mb) => {
    setActionLoading(true)
    try {
      await measurementService.deleteMB(mb.id)
      setDeleteMbConfirm(null)
      setSnackbar({ open: true, message: `🗑️ Measurement Book ${mb.mb_number} deleted`, severity: 'success' })
      loadData(activeSapKey)
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to delete MB', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleExportMBExcel = async (mbId, mbNumber) => {
    try {
      const res = await measurementService.export(mbId)
      downloadBlob(res.data, `PCMC_Measurement_Book_${mbNumber || mbId}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      setSnackbar({ open: true, message: 'Form 45 Excel file downloaded', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'Excel export failed', severity: 'error' })
    }
  }

  const handleExportMBPdf = async (mbId, mbNumber, paperSize = 'A4') => {
    try {
      const res = await measurementService.exportPdf(mbId, { paperSize })
      downloadBlob(res.data, `PCMC_Measurement_Book_${mbNumber || mbId}_${paperSize}.pdf`, 'application/pdf')
      setSnackbar({ open: true, message: `📄 Official Form 45 MB PDF (${paperSize}) downloaded!`, severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'PDF export failed', severity: 'error' })
    }
  }

  const handlePreviewMBPdf = async (mbId, mbNumber) => {
    try {
      const res = await measurementService.exportPdf(mbId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      setPdfPreview({
        open: true,
        url,
        title: `Official PWD Form 45 Measurement Book — ${mbNumber || 'MB'}`,
        fileName: `MB_${mbNumber || mbId}.pdf`
      })
    } catch (error) {
      setSnackbar({ open: true, message: 'Could not load PDF preview', severity: 'error' })
    }
  }

  const handleExportAllDocs = async (mbId) => {
    try {
      const res = await measurementService.exportDocuments(mbId)
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `PCMC_Complete_Documents_${mbId}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setSnackbar({ open: true, message: 'ZIP package downloaded', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'ZIP package export failed', severity: 'error' })
    }
  }

  const openMeasurementSheet = (mbId) => {
    navigate(`/measurement/sheet/${mbId}?project=${encodeURIComponent(activeSapKey)}`)
  }

  const openAbstract = (mbId) => navigate(`/abstract/${mbId}`)
  const openRABills = () => navigate(`/ra-bills?project=${encodeURIComponent(activeSapKey)}`)

  const mbColumns = [
    {
      field: 'mb_number',
      headerName: 'MB Number',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          variant="filled"
          sx={{ fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(29,78,216,0.3)' }}
          onClick={() => openMeasurementSheet(params.row.id)}
        />
      )
    },
    { field: 'mb_date', headerName: 'MB Date', width: 120 },
    { field: 'description', headerName: 'Description / Stage', width: 230 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value || 'draft'}
          size="small"
          color={params.value === 'approved' ? 'success' : params.value === 'verified' ? 'primary' : 'default'}
          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
        />
      )
    },
    {
      field: 'total_entries',
      headerName: 'Entries',
      width: 95,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ fontWeight: 700, color: 'primary.main' }}>
          {params.value || 0}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions & Documents',
      width: 490,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<TableViewIcon />}
            onClick={() => openMeasurementSheet(params.row.id)}
            sx={{ fontWeight: 'bold' }}
          >
            Open Sheet
          </Button>

          <Tooltip title="Download Official Form 45 A4 PDF">
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleExportMBPdf(params.row.id, params.row.mb_number, 'A4')}
              sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.2 }}
            >
              A4 PDF
            </Button>
          </Tooltip>

          <Tooltip title="Download Legal Canvas PDF (8.5 × 14 in)">
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleExportMBPdf(params.row.id, params.row.mb_number, 'Legal')}
              sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.2 }}
            >
              Legal PDF
            </Button>
          </Tooltip>

          <Tooltip title="Export to Form 45 Excel">
            <IconButton size="small" onClick={() => handleExportMBExcel(params.row.id, params.row.mb_number)} sx={{ border: '1px solid #cbd5e1' }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="View Abstract">
            <IconButton size="small" onClick={() => openAbstract(params.row.id)} sx={{ border: '1px solid #cbd5e1' }}>
              <AssessmentIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Quantity Variation Statement">
            <IconButton size="small" onClick={() => navigate(`/variation/${params.row.id}`)} sx={{ border: '1px solid #cbd5e1' }}>
              <CompareArrowsIcon fontSize="small" color="secondary" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Create RA Bill">
            <IconButton size="small" onClick={openRABills} sx={{ border: '1px solid #cbd5e1' }}>
              <ReceiptIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Complete Documents (ZIP)">
            <IconButton size="small" onClick={() => handleExportAllDocs(params.row.id)} color="primary" sx={{ border: '1px solid #bfdbfe', bgcolor: '#eff6ff' }}>
              <FolderZipIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete Measurement Book">
            <IconButton size="small" color="error" onClick={() => setDeleteMbConfirm(params.row)} sx={{ border: '1px solid #fecdd3', bgcolor: '#fff1f2' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 2.5, gap: 1.5 }}>
        <div>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.4rem', sm: '1.9rem' }, background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Measurement Books Master
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage official PWD Form 45 Measurement Books, audit registers, export PDFs, and record site dimensions.
          </Typography>
        </div>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setOpenDakhalaDialog(true)}
            disabled={!project}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Dakhala / Certificates
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => {
              setMbForm({
                mb_number: `MB-0${mbs.length + 1}`,
                mb_date: new Date(),
                description: `Measurement Book ${mbs.length + 1}`
              })
              setOpenDialog(true)
            }}
            disabled={!project}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            + Create New MB
          </Button>
        </Box>
      </Box>

      {/* 3D Elevated Project Selector Card */}
      <Card sx={{ mb: 3, p: 1 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Active Project"
                value={activeSapKey}
                onChange={(e) => {
                  setActiveSapKey(e.target.value)
                  navigate(`/measurement?project=${encodeURIComponent(e.target.value)}`)
                }}
              >
                {allProjects.map(p => (
                  <MenuItem key={p.sap_work_key} value={p.sap_work_key}>
                    {p.sap_work_key} — {p.work_name} ({p.contractor_name})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {project && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Contractor:</strong> {project.contractor_name} | <strong>Work Order:</strong> {project.work_order_no || '—'} | <strong>BOQ Items:</strong> {boqItems.length}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* If no MBs exist, show Banner */}
      {mbs.length === 0 && !loading && (
        <Card sx={{ mb: 3, p: 4, textAlign: 'center', bgcolor: '#eff6ff', border: '2px dashed #93c5fd' }}>
          <StraightenIcon sx={{ fontSize: 52, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            No Measurement Books created for this project yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            To begin recording site measurements, create your first Measurement Book (MB-01).
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => {
              setMbForm({
                mb_number: 'MB-01',
                mb_date: new Date(),
                description: 'First Measurement Book (MB-01)'
              })
              setOpenDialog(true)
            }}
          >
            Create MB-01 Now
          </Button>
        </Card>
      )}

      {/* Measurement Books Table Card */}
      {mbs.length > 0 && (
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Registered Measurement Books ({mbs.length})</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Click <strong>"Open Sheet"</strong> on any MB to enter site dimensions and engineering formulas.
              </Typography>
            </Box>
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <DataGrid
                rows={mbs}
                columns={mbColumns}
                pageSizeOptions={[5, 10, 20]}
                getRowId={(row) => row.id}
                autoHeight
                loading={loading}
                disableRowSelectionOnClick
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Create MB Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create New Measurement Book</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="MB Number (e.g. MB-01, MB-02) *"
            margin="normal"
            value={mbForm.mb_number}
            onChange={(e) => setMbForm({ ...mbForm, mb_number: e.target.value })}
            required
          />
          <DatePicker
            label="MB Date *"
            value={mbForm.mb_date}
            onChange={(v) => setMbForm({ ...mbForm, mb_date: v })}
            slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
          />
          <TextField
            fullWidth
            label="Description / Work Stage"
            margin="normal"
            multiline
            rows={2}
            value={mbForm.description}
            onChange={(e) => setMbForm({ ...mbForm, description: e.target.value })}
            placeholder="e.g. Ground Floor Masonry & Plaster works"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateMB} disabled={actionLoading}>
            {actionLoading ? 'Creating & Opening...' : 'Create & Open Sheet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete MB Confirmation Modal */}
      <Dialog open={Boolean(deleteMbConfirm)} onClose={() => setDeleteMbConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          Delete Measurement Book?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{deleteMbConfirm?.mb_number}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            All measurement entries in {deleteMbConfirm?.mb_number} will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteMbConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteMB(deleteMbConfirm)}
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : 'Delete MB'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dakhala Dialog */}
      <DakhalaDialog
        open={openDakhalaDialog}
        onClose={() => setOpenDakhalaDialog(false)}
        sapWorkKey={activeSapKey}
        mbs={mbs}
        raBills={raBills}
      />

      {/* In-Browser PDF Preview Dialog */}
      <PdfViewer
        open={pdfPreview.open}
        onClose={() => {
          if (pdfPreview.url) window.URL.revokeObjectURL(pdfPreview.url)
          setPdfPreview({ open: false, url: '', title: '', fileName: '' })
        }}
        pdfUrl={pdfPreview.url}
        title={pdfPreview.title}
        fileName={pdfPreview.fileName}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default MBListPage

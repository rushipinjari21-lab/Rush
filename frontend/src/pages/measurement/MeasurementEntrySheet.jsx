import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Typography, Button, Card, CardContent, TextField, Grid,
  MenuItem, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, Chip, Autocomplete, Paper, Tooltip, Divider,
  Breadcrumbs, Link, LinearProgress, useTheme, useMediaQuery
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ReceiptIcon from '@mui/icons-material/Receipt'
import FunctionsIcon from '@mui/icons-material/Functions'
import CalculateIcon from '@mui/icons-material/Calculate'
import StraightenIcon from '@mui/icons-material/Straighten'
import LayersIcon from '@mui/icons-material/Layers'
import { downloadBlob } from '../../utils/fileDownload.js'

import measurementService from '../../services/measurement.service'
import projectService from '../../services/project.service'
import boqService from '../../services/boq.service'
import PdfViewer from '../../components/document/PdfViewer'
import {
  calculateMeasurementQuantity,
  formatMeasurementFormula,
  evaluateEngineeringExpression,
  getEngineeringUnitType
} from '../../lib/calculations/measurementEngine'

export const MeasurementEntrySheet = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const mbId = params.mbId || params['*']
  const searchParams = new URLSearchParams(location.search)
  const sapWorkKeyQuery = searchParams.get('project') || ''

  const [mb, setMb] = useState(null)
  const [project, setProject] = useState(null)
  const [boqItems, setBoqItems] = useState([])
  const [entries, setEntries] = useState([])
  const [filteredEntries, setFilteredEntries] = useState([])
  const [selectedSsrFilter, setSelectedSsrFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Dialog & Modal States
  const [openEntryDialog, setOpenEntryDialog] = useState(false)
  const [deleteEntryConfirm, setDeleteEntryConfirm] = useState(null)
  const [pdfPreview, setPdfPreview] = useState({ open: false, url: '', title: '', fileName: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Measurement Entry Form State (Supports direct positive/negative numbers & math expressions)
  const [entryForm, setEntryForm] = useState({
    boq_item_id: '',
    location: '',
    remark: '',
    length: '0',
    breadth: '0',
    height: '0',
    quantity: '1',
    entry_date: new Date()
  })

  useEffect(() => {
    if (mbId) {
      loadSheetData(mbId)
    }
  }, [mbId])

  const loadSheetData = async (id) => {
    setLoading(true)
    try {
      const mbRes = await measurementService.getDetail(id)
      const mbData = mbRes.data?.data
      setMb(mbData)
      const entryList = mbData?.entries || []
      setEntries(entryList)
      setFilteredEntries(entryList)

      const sapKey = mbData?.sap_work_key || sapWorkKeyQuery
      if (sapKey) {
        const [projRes, boqRes] = await Promise.all([
          projectService.getBySapKey(sapKey),
          boqService.getByProject(sapKey)
        ])
        setProject(projRes.data?.data)
        setBoqItems(boqRes.data?.data || [])
      }
    } catch (error) {
      console.error('Failed to load measurement sheet:', error)
      setSnackbar({ open: true, message: 'Failed to load Measurement Sheet', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterBySsr = (ssrCode) => {
    setSelectedSsrFilter(ssrCode)
    if (ssrCode === 'ALL') {
      setFilteredEntries(entries)
    } else {
      setFilteredEntries(entries.filter(e => e.ssr_code === ssrCode))
    }
  }

  const handleAddEntry = async () => {
    if (!mb) return
    if (!entryForm.boq_item_id) {
      alert('Please select a Schedule B / BOQ Item')
      return
    }
    if (!entryForm.location.trim()) {
      alert('Please enter a location / chainage')
      return
    }

    const qtyVal = evaluateEngineeringExpression(entryForm.quantity, 1)
    const lenVal = evaluateEngineeringExpression(entryForm.length, 0)
    const brVal = evaluateEngineeringExpression(entryForm.breadth, 0)
    const hVal = evaluateEngineeringExpression(entryForm.height, 0)

    setActionLoading(true)
    try {
      await measurementService.addEntry(mb.id, {
        boq_item_id: entryForm.boq_item_id,
        location: entryForm.location,
        remark: entryForm.remark,
        length: lenVal,
        breadth: brVal,
        height: hVal,
        quantity: qtyVal,
        entry_date: entryForm.entry_date.toISOString().split('T')[0]
      })
      setOpenEntryDialog(false)
      setSnackbar({
        open: true,
        message: qtyVal < 0 ? '➖ Deduction measurement entry recorded!' : '✅ Measurement entry added successfully!',
        severity: 'success'
      })
      loadSheetData(mb.id)
      setEntryForm({
        boq_item_id: '',
        location: '',
        remark: '',
        length: '0',
        breadth: '0',
        height: '0',
        quantity: '1',
        entry_date: new Date()
      })
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to add measurement entry', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteEntry = async (entry) => {
    setActionLoading(true)
    try {
      await measurementService.deleteEntry(entry.id)
      setDeleteEntryConfirm(null)
      setSnackbar({ open: true, message: '🗑️ Measurement entry deleted', severity: 'info' })
      loadSheetData(mb.id)
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Delete failed', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleExportExcel = async () => {
    if (!mb) return
    try {
      const res = await measurementService.export(mb.id)
      downloadBlob(res.data, `PCMC_Measurement_Book_${mb.mb_number}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      setSnackbar({ open: true, message: 'Form 45 Excel file downloaded', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'Excel export failed', severity: 'error' })
    }
  }

  const handleExportPdf = async () => {
    if (!mb) return
    try {
      const res = await measurementService.exportPdf(mb.id)
      downloadBlob(res.data, `PCMC_Measurement_Book_${mb.mb_number}.pdf`, 'application/pdf')
      setSnackbar({ open: true, message: `📄 Form 45 MB PDF downloaded!`, severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'PDF export failed', severity: 'error' })
    }
  }

  const handlePreviewPdf = async () => {
    if (!mb) return
    try {
      const res = await measurementService.exportPdf(mb.id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      setPdfPreview({
        open: true,
        url,
        title: `Official PWD Form 45 Measurement Book — ${mb.mb_number}`,
        fileName: `MB_${mb.mb_number}.pdf`
      })
    } catch (error) {
      setSnackbar({ open: true, message: 'Could not load PDF preview', severity: 'error' })
    }
  }

  const selectedBoqItem = boqItems.find(b => b.id === entryForm.boq_item_id)
  const unitType = getEngineeringUnitType(selectedBoqItem?.unit)
  const qtyMultiplier = evaluateEngineeringExpression(entryForm.quantity, 1)

  const calculatedQty = calculateMeasurementQuantity(
    {
      length: entryForm.length,
      breadth: entryForm.breadth,
      height: entryForm.height,
      quantity: qtyMultiplier
    },
    selectedBoqItem?.unit || ''
  )

  const entryColumns = [
    {
      field: 'ssr_code',
      headerName: 'SSR Code',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 'bold', bgcolor: '#f0fdf4' }}
        />
      )
    },
    { field: 'description', headerName: 'Description of Work', width: 280 },
    {
      field: 'unit',
      headerName: 'Unit',
      width: 80,
      renderCell: (params) => <Chip label={params.value || 'Nos'} size="small" variant="filled" sx={{ fontWeight: 600 }} />
    },
    {
      field: 'location',
      headerName: 'Location / Chainage',
      width: 210,
      renderCell: (params) => {
        const isDeduct = Number(params.row.total_quantity) < 0 || String(params.value || '').toLowerCase().includes('deduct')
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isDeduct && (
              <Chip label="DEDUCT" size="small" color="error" variant="filled" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
            )}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
          </Box>
        )
      }
    },
    {
      field: 'formula',
      headerName: 'Formula (Qty × L × B × H)',
      width: 240,
      valueGetter: (_, row) => formatMeasurementFormula(row)
    },
    {
      field: 'total_quantity',
      headerName: 'Total Qty',
      width: 130,
      type: 'number',
      renderCell: (params) => {
        const val = Number(params.value || 0)
        return (
          <Box
            sx={{
              display: 'inline-block',
              px: 1.2,
              py: 0.3,
              borderRadius: '6px',
              fontWeight: 700,
              bgcolor: val < 0 ? '#ffe4e6' : '#dcfce7',
              color: val < 0 ? '#be123c' : '#15803d',
              border: '1px solid',
              borderColor: val < 0 ? '#fda4af' : '#86efac'
            }}
          >
            {val < 0 ? `-${Math.abs(val).toFixed(3)}` : val.toFixed(3)}
          </Box>
        )
      }
    },
    { field: 'remark', headerName: 'Site Remark / Note', width: 170 },
    { field: 'entry_date', headerName: 'Date', width: 110 },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" color="error" onClick={() => setDeleteEntryConfirm(params.row)} title="Delete Entry">
          <DeleteIcon fontSize="small" />
        </IconButton>
      )
    }
  ]

  // Totals calculations
  const totalPositive = entries.filter(e => Number(e.total_quantity) > 0).reduce((sum, e) => sum + Number(e.total_quantity), 0)
  const totalDeductions = entries.filter(e => Number(e.total_quantity) < 0).reduce((sum, e) => sum + Math.abs(Number(e.total_quantity)), 0)
  const netQuantity = totalPositive - totalDeductions

  // Extract unique SSR codes in entries for filter tabs
  const uniqueSsrCodes = Array.from(new Set(entries.map(e => e.ssr_code).filter(Boolean)))

  return (
    <Box sx={{ pb: 4 }}>
      {/* Top Navigation & Breadcrumbs */}
      <Box sx={{ mb: 2.5 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}
            onClick={() => navigate(`/measurement?project=${encodeURIComponent(mb?.sap_work_key || '')}`)}
          >
            <ArrowBackIcon fontSize="small" />
            Measurement Books Master
          </Link>
          <Typography color="text.primary" fontWeight="bold">
            {mb ? `${mb.mb_number} Measurement Sheet` : 'Measurement Sheet'}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <div>
            <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Measurement Sheet: {mb?.mb_number || 'MB'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Record physical dimensions, apply civil engineering formulas, structural additions & deductions, and export Form 45.
            </Typography>
          </div>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handlePreviewPdf}
              disabled={!mb}
            >
              Preview Form 45 PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportPdf}
              disabled={!mb}
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={!mb}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => navigate(`/abstract/${mb?.id}`)}
              disabled={!mb}
            >
              View Abstract
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => navigate(`/ra-bills?project=${encodeURIComponent(mb?.sap_work_key || '')}`)}
              disabled={!mb}
            >
              Create RA Bill
            </Button>
            <Button
              variant="contained"
              size="large"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                if (boqItems.length === 0) {
                  alert('Please upload Schedule B / BOQ items first before recording measurements.')
                  return
                }
                setOpenEntryDialog(true)
              }}
            >
              + Add Measurement Entry
            </Button>
          </Box>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* 3D Elevated Project & MB KPI Cards */}
      {mb && project && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: '#ffffff', p: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                {project.work_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                <strong>Contractor:</strong> {project.contractor_name} | <strong>Tender No:</strong> {project.tender_no || project.sap_work_key}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>MB Date:</strong> {mb.mb_date} | <strong>Stage:</strong> {mb.description || 'General Civil Works'}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} md={2}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', height: '100%' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">GROSS ADDITIONS</Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                +{totalPositive.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Measured volume/area</Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} md={2}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#fff1f2', border: '1px solid #fecdd3', height: '100%' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">DEDUCTIONS</Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main" sx={{ mt: 0.5 }}>
                -{totalDeductions.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Openings & voids</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={2}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#eff6ff', border: '1px solid #bfdbfe', height: '100%' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">NET QUANTITY</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mt: 0.5 }}>
                {netQuantity.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">{entries.length} Line entries</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Item Filter Chips with 3D styling */}
      {uniqueSsrCodes.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight="bold" color="text.secondary">Filter Schedule B Item:</Typography>
          <Chip
            label={`All Items (${entries.length})`}
            color={selectedSsrFilter === 'ALL' ? 'primary' : 'default'}
            variant={selectedSsrFilter === 'ALL' ? 'filled' : 'outlined'}
            onClick={() => handleFilterBySsr('ALL')}
            sx={{ fontWeight: 'bold' }}
          />
          {uniqueSsrCodes.map(ssr => (
            <Chip
              key={ssr}
              label={`${ssr} (${entries.filter(e => e.ssr_code === ssr).length})`}
              color={selectedSsrFilter === ssr ? 'primary' : 'default'}
              variant={selectedSsrFilter === ssr ? 'filled' : 'outlined'}
              onClick={() => handleFilterBySsr(ssr)}
              sx={{ fontWeight: 'bold' }}
            />
          ))}
        </Box>
      )}

      {/* Measurement Entries Data Grid with Scrolling Edge Shadow */}
      <Card sx={{ overflow: 'hidden' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StraightenIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">Recorded Site Dimensions (PWD Form 45)</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredEntries.length} measurement entries
            </Typography>
          </Box>

          {entries.length === 0 && !loading && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              No measurements recorded in <strong>{mb?.mb_number}</strong> yet. Click the <strong>"+ Add Measurement Entry"</strong> button above to record dimensions with live engineering formulas.
            </Alert>
          )}

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={filteredEntries}
              columns={entryColumns}
              pageSizeOptions={[10, 25, 50]}
              getRowId={(row) => row.id}
              autoHeight
              loading={loading}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>

      {/* Measurement Entry Dialog (Direct positive or negative qty typing) */}
      <Dialog open={openEntryDialog} onClose={() => setOpenEntryDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">Record Measurement Entry</Typography>
          </Box>
          <Chip label={`MB: ${mb?.mb_number || ''}`} size="small" color="primary" variant="filled" />
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* BOQ Item Selector */}
            <Grid item xs={12}>
              <Autocomplete
                options={boqItems}
                getOptionLabel={(option) => `[${option.ssr_code || 'SSR'}] ${option.description.substring(0, 80)}... (${option.boq_quantity} ${option.unit || 'Nos'})`}
                renderInput={(params) => (
                  <TextField {...params} label="Search & Select Schedule B Item / SSR Code *" required />
                )}
                value={boqItems.find(b => b.id === entryForm.boq_item_id) || null}
                onChange={(_, newValue) => {
                  setEntryForm({
                    ...entryForm,
                    boq_item_id: newValue ? newValue.id : ''
                  })
                }}
              />
            </Grid>

            {/* Selected BOQ Details */}
            {selectedBoqItem && (
              <Grid item xs={12}>
                <Paper sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary">
                    Item No: {selectedBoqItem.item_no} | SSR Code: {selectedBoqItem.ssr_code} | Part: {selectedBoqItem.part_section || 'Part A'}
                  </Typography>
                  <Typography variant="body2" sx={{ my: 0.5 }}>
                    {selectedBoqItem.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip label={`BOQ Qty: ${selectedBoqItem.boq_quantity} ${selectedBoqItem.unit || 'Nos'}`} size="small" color="info" />
                    <Chip label={`Rate: ₹${Number(selectedBoqItem.rate).toLocaleString('en-IN')}`} size="small" color="info" />
                    <Chip label={`Unit: ${selectedBoqItem.unit || 'Nos'}`} size="small" color="secondary" />
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Location */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location / Chainage / Opening Description *"
                value={entryForm.location}
                onChange={(e) => setEntryForm({ ...entryForm, location: e.target.value })}
                required
                placeholder="e.g. Ground Floor / Room 101 / Ch. 0/000 to 0/100 or Door Deduction D1"
              />
            </Grid>

            {/* Custom Remark */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Remark / Note (Optional custom description)"
                value={entryForm.remark}
                onChange={(e) => setEntryForm({ ...entryForm, remark: e.target.value })}
                placeholder="Type your custom site remark here..."
              />
            </Grid>

            {/* Dimension Inputs with direct number and expression support */}
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Quantity / Nos *"
                value={entryForm.quantity}
                onChange={(e) => setEntryForm({ ...entryForm, quantity: e.target.value })}
                helperText="Enter any number or expression, including negative values"
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Length (L) in meters"
                disabled={unitType === 'COUNT'}
                value={entryForm.length}
                onChange={(e) => setEntryForm({ ...entryForm, length: e.target.value })}
                helperText={unitType === 'COUNT' ? 'Not applicable for Nos' : 'Supports math (e.g. 10.5+2.3)'}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Breadth (B) in meters"
                disabled={unitType === 'COUNT' || unitType === '1D'}
                value={entryForm.breadth}
                onChange={(e) => setEntryForm({ ...entryForm, breadth: e.target.value })}
                helperText={unitType === 'COUNT' || unitType === '1D' ? 'Not applicable' : 'Width / Breadth'}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Height / Depth (H) in meters"
                disabled={unitType !== '3D'}
                value={entryForm.height}
                onChange={(e) => setEntryForm({ ...entryForm, height: e.target.value })}
                helperText={unitType === '3D' ? 'Height / Depth' : 'Not applicable'}
              />
            </Grid>

            {/* Live Calculated Result Banner */}
            <Grid item xs={12}>
              <Box sx={{
                p: 1.25,
                bgcolor: calculatedQty < 0 ? '#fff1f2' : '#eff6ff',
                borderRadius: 2,
                border: '1px solid',
                borderColor: calculatedQty < 0 ? '#fecdd3' : '#bfdbfe',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FunctionsIcon color={calculatedQty < 0 ? 'error' : 'primary'} />
                  <Typography variant="subtitle1" color={calculatedQty < 0 ? 'error.main' : 'primary.main'} fontWeight="bold">
                    Total: {calculatedQty.toFixed(4)} {selectedBoqItem?.unit || 'Units'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <DatePicker
                label="Measurement Date *"
                value={entryForm.entry_date}
                onChange={(v) => setEntryForm({ ...entryForm, entry_date: v })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenEntryDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleAddEntry}
            disabled={!entryForm.boq_item_id || actionLoading}
          >
            {actionLoading ? 'Saving...' : 'Save Measurement Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Entry Confirmation Modal */}
      <Dialog open={Boolean(deleteEntryConfirm)} onClose={() => setDeleteEntryConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          Delete Measurement Entry?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete measurement for <strong>{deleteEntryConfirm?.ssr_code}</strong> ({deleteEntryConfirm?.location})?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteEntryConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteEntry(deleteEntryConfirm)}
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : 'Delete Entry'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default MeasurementEntrySheet

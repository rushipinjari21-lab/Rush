import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Typography, Button, Card, CardContent, TextField, Grid,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Alert,
  IconButton, Snackbar, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Tooltip, useTheme, useMediaQuery
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ReceiptIcon from '@mui/icons-material/Receipt'

import rabillService from '../../services/rabill.service'
import projectService from '../../services/project.service'
import measurementService from '../../services/measurement.service'
import PdfViewer from '../../components/document/PdfViewer'

export const RABillPage = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const rawKey = params['*'] || params.sapWorkKey || new URLSearchParams(location.search).get('project') || ''
  const decodedRouteKey = rawKey ? decodeURIComponent(rawKey) : ''

  const [allProjects, setAllProjects] = useState([])
  const [activeSapKey, setActiveSapKey] = useState(decodedRouteKey)
  const [project, setProject] = useState(null)
  const [mbs, setMbs] = useState([])
  const [bills, setBills] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [viewBillDialog, setViewBillDialog] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // PDF Preview State
  const [pdfPreview, setPdfPreview] = useState({ open: false, url: '', title: '', fileName: '' })

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const [billForm, setBillForm] = useState({
    mb_id: '',
    bill_number: 'RA-01',
    bill_date: new Date(),
    bill_period_from: null,
    bill_period_to: null,
    gst_rate: 18,
    labour_cess_rate: 1,
    security_deposit_rate: 5,
    other_deductions: 0,
    remarks: ''
  })

  // Load all projects on initial mount
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
      const [projRes, mbRes, billRes] = await Promise.all([
        projectService.getBySapKey(sapKey),
        measurementService.getByProject(sapKey),
        rabillService.getByProject(sapKey)
      ])
      setProject(projRes.data?.data)
      const mbList = mbRes.data?.data || []
      setMbs(mbList)
      const billList = billRes.data?.data || []
      setBills(billList)

      if (mbList.length > 0) {
        setBillForm(prev => ({
          ...prev,
          mb_id: mbList[0].id,
          bill_number: `RA-0${billList.length + 1}`
        }))
      }
    } catch (error) {
      console.error('Error loading RA Bill data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBill = async () => {
    if (!activeSapKey) {
      alert('Please select a project first')
      return
    }
    if (!billForm.mb_id) {
      alert('Please select a Measurement Book (e.g. MB-01)')
      return
    }
    setActionLoading(true)
    try {
      await rabillService.create({
        ...billForm,
        sap_work_key: activeSapKey,
        bill_date: billForm.bill_date.toISOString().split('T')[0],
        bill_period_from: billForm.bill_period_from ? billForm.bill_period_from.toISOString().split('T')[0] : null,
        bill_period_to: billForm.bill_period_to ? billForm.bill_period_to.toISOString().split('T')[0] : null
      })
      setOpenDialog(false)
      setSnackbar({ open: true, message: `✅ RA Bill ${billForm.bill_number} generated successfully!`, severity: 'success' })
      loadData(activeSapKey)
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to create RA bill', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteBill = async (bill) => {
    setActionLoading(true)
    try {
      await rabillService.delete(bill.id)
      setDeleteConfirm(null)
      setSnackbar({ open: true, message: `🗑️ RA Bill ${bill.bill_number} deleted successfully`, severity: 'success' })
      loadData(activeSapKey)
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to delete RA bill', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewBill = async (id) => {
    try {
      const res = await rabillService.getDetail(id)
      setViewBillDialog(res.data?.data)
    } catch (error) {
      setSnackbar({ open: true, message: 'Could not load RA bill details', severity: 'error' })
    }
  }

  const handleExportExcel = async (id, billNumber) => {
    try {
      const res = await rabillService.export(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `RA_Bill_${billNumber || id}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setSnackbar({ open: true, message: 'Excel export downloaded', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'Excel export failed', severity: 'error' })
    }
  }

  const handleExportPdf = async (id, billNumber, paperSize = 'A4') => {
    try {
      const res = await rabillService.exportPdf(id, { paperSize })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `RA_Bill_${billNumber || id}_${paperSize}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setSnackbar({ open: true, message: `📄 Official RA Bill PDF (${paperSize}) downloaded!`, severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'PDF export failed', severity: 'error' })
    }
  }

  const handlePreviewPdf = async (id, billNumber, paperSize = 'A4') => {
    try {
      const res = await rabillService.exportPdf(id, { paperSize })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      setPdfPreview({
        open: true,
        url,
        title: `Official Running Account Bill (${paperSize}) — ${billNumber || 'RA Bill'}`,
        fileName: `RA_Bill_${billNumber || id}_${paperSize}.pdf`
      })
    } catch (error) {
      setSnackbar({ open: true, message: 'Could not load PDF preview', severity: 'error' })
    }
  }

  const columns = [
    { field: 'bill_number', headerName: 'Bill No', width: 110, renderCell: (params) => <strong>{params.value}</strong> },
    { field: 'bill_date', headerName: 'Date', width: 110 },
    { field: 'mb_number', headerName: 'MB Ref', width: 110 },
    { field: 'gross_amount', headerName: 'Gross Amount (₹)', width: 140, type: 'number', valueFormatter: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    { field: 'gst_amount', headerName: 'GST (₹)', width: 110, type: 'number', valueFormatter: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    { field: 'labour_cess_amount', headerName: 'Labour Cess', width: 120, type: 'number', valueFormatter: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    { field: 'security_deposit_amount', headerName: 'Sec. Deposit', width: 120, type: 'number', valueFormatter: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    { field: 'net_payable', headerName: 'Net Payable (₹)', width: 150, type: 'number', valueFormatter: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} color={
          params.value === 'paid' ? 'success' :
          params.value === 'approved' ? 'primary' :
          params.value === 'submitted' ? 'warning' : 'default'
        } size="small" />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions / PDF / Excel',
      width: 350,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip title="View Bill Line Items">
            <IconButton size="small" color="primary" onClick={() => handleViewBill(params.row.id)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download Official A4 Master PDF (210 × 297 mm)">
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleExportPdf(params.row.id, params.row.bill_number, 'A4')}
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
              onClick={() => handleExportPdf(params.row.id, params.row.bill_number, 'Legal')}
              sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.2 }}
            >
              Legal PDF
            </Button>
          </Tooltip>

          <Tooltip title="Export to Excel">
            <IconButton size="small" onClick={() => handleExportExcel(params.row.id, params.row.bill_number)}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete RA Bill">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteConfirm(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 2, gap: 1.5 }}>
        <div>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '1.9rem' }, fontWeight: 700 }}>
            Running Account Bills (RA Bills)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Official municipal Account of Work Executed statements, deductions, A4 print-ready PDFs, and Excel exports.
          </Typography>
        </div>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={!project || mbs.length === 0}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          + Create RA Bill
        </Button>
      </Box>

      {/* Project Selector */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
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
                  navigate(`/ra-bills?project=${encodeURIComponent(e.target.value)}`)
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
                <Typography variant="body2" color="text.secondary">
                  <strong>Contractor:</strong> {project.contractor_name} | <strong>Work Order:</strong> {project.work_order_no || '—'} | <strong>Bills:</strong> {bills.length}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {mbs.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No Measurement Books found for this project. Please record site measurements in the <strong>Measurement Books</strong> tab first before generating an RA Bill.
        </Alert>
      )}

      {bills.length === 0 && !loading && mbs.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No RA Bills generated yet for this project. Click <strong>"+ Create RA Bill"</strong> above to generate an interim bill from your active Measurement Book.
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={bills}
              columns={columns}
              pageSizeOptions={[10, 25]}
              getRowId={(row) => row.id}
              autoHeight
              loading={loading}
              disableRowSelectionOnClick
              sx={{ minWidth: 650 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Create RA Bill Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create RA Bill from Measurement Book</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select fullWidth label="Select Measurement Book (Source) *"
                value={billForm.mb_id}
                onChange={(e) => setBillForm({ ...billForm, mb_id: e.target.value })}
                required
              >
                {mbs.map(mb => (
                  <MenuItem key={mb.id} value={mb.id}>
                    {mb.mb_number} — Date: {mb.mb_date} ({mb.total_entries || 0} entries)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Bill Number (e.g. RA-01, RA-02) *"
                value={billForm.bill_number}
                onChange={(e) => setBillForm({ ...billForm, bill_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Bill Date *"
                value={billForm.bill_date}
                onChange={(v) => setBillForm({ ...billForm, bill_date: v })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Period From"
                value={billForm.bill_period_from}
                onChange={(v) => setBillForm({ ...billForm, bill_period_from: v })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Period To"
                value={billForm.bill_period_to}
                onChange={(v) => setBillForm({ ...billForm, bill_period_to: v })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="GST Rate %" type="number"
                value={billForm.gst_rate}
                onChange={(e) => setBillForm({ ...billForm, gst_rate: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Labour Cess %" type="number"
                value={billForm.labour_cess_rate}
                onChange={(e) => setBillForm({ ...billForm, labour_cess_rate: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Security Deposit %" type="number"
                value={billForm.security_deposit_rate}
                onChange={(e) => setBillForm({ ...billForm, security_deposit_rate: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Other Deductions (₹)" type="number"
                value={billForm.other_deductions}
                onChange={(e) => setBillForm({ ...billForm, other_deductions: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Remarks" multiline rows={2}
                value={billForm.remarks}
                onChange={(e) => setBillForm({ ...billForm, remarks: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBill} disabled={actionLoading}>
            {actionLoading ? 'Calculating & Generating...' : 'Generate RA Bill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          Delete RA Bill?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{deleteConfirm?.bill_number}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will remove the bill calculation and unlock the associated Measurement Book ({deleteConfirm?.mb_number}) so measurements can be edited if needed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteBill(deleteConfirm)}
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : 'Delete RA Bill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Bill Details Dialog */}
      <Dialog open={Boolean(viewBillDialog)} onClose={() => setViewBillDialog(null)} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>RA Bill Details: {viewBillDialog?.bill_number}</span>
          <Chip label={`Status: ${viewBillDialog?.status || 'draft'}`} color="primary" />
        </DialogTitle>
        <DialogContent dividers>
          {viewBillDialog && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8fafc' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Bill Number</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">{viewBillDialog.bill_number}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Bill Date</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">{viewBillDialog.bill_date}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Gross Amount</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">₹{Number(viewBillDialog.gross_amount).toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Net Payable</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">₹{Number(viewBillDialog.net_payable).toLocaleString('en-IN')}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Account of Work Executed ({viewBillDialog.items?.length || 0} items)</Typography>
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e2e8f0' }}>
                      <TableCell><strong>SSR Code</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell><strong>Unit</strong></TableCell>
                      <TableCell align="right"><strong>Qty Since Prev</strong></TableCell>
                      <TableCell align="right"><strong>Rate (₹)</strong></TableCell>
                      <TableCell align="right"><strong>Amount (₹)</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewBillDialog.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell><strong>{item.ssr_code}</strong></TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell align="right">{Number(item.current_quantity).toFixed(3)}</TableCell>
                        <TableCell align="right">₹{Number(item.rate).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right"><strong>₹{Number(item.amount).toLocaleString('en-IN')}</strong></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewBillDialog(null)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => {
              handlePreviewPdf(viewBillDialog.id, viewBillDialog.bill_number)
            }}
          >
            Preview Official PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportExcel(viewBillDialog.id, viewBillDialog.bill_number)}
          >
            Export to Excel
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

export default RABillPage

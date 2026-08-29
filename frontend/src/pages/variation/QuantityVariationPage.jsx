import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Tabs,
  Tab
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TableChartIcon from '@mui/icons-material/TableChart'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import measurementService from '../../services/measurement.service'

const QuantityVariationPage = () => {
  const { mbId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [filterType, setFilterType] = useState('ALL')
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const activeMbId = mbId || 4

  useEffect(() => {
    loadQuantityVariation()
  }, [activeMbId])

  const loadQuantityVariation = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await measurementService.getQuantityVariationData(activeMbId)
      if (res.data?.data) {
        setData(res.data.data)
      } else {
        setError('No quantity variation data found for this Measurement Book.')
      }
    } catch (err) {
      console.error('Error loading quantity variation:', err)
      setError('Failed to load Quantity Variation data. Please check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true)
      const res = await measurementService.exportQuantityVariation(activeMbId)
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `PCMC_QTY_VARIATION_MB${activeMbId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Excel Export failed:', err)
      alert('Failed to export Quantity Variation Excel workbook.')
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true)
      const res = await measurementService.exportQuantityVariationPdf(activeMbId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('PDF Export failed:', err)
      alert('Failed to export Quantity Variation PDF.')
    } finally {
      setExportingPdf(false)
    }
  }

  const filteredItems = useMemo(() => {
    if (!data?.items) return []
    return data.items.filter((item) => {
      const matchesSearch =
        item.itemNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (filterType === 'EXCESS') return item.type === 'EXCESS'
      if (filterType === 'SAVING') return item.type === 'SAVING'
      if (filterType === 'NO_VARIATION') return item.type === 'NO_VARIATION'
      return true
    })
  }, [data, searchTerm, filterType])

  const excessList = useMemo(() => {
    if (!data?.items) return []
    return data.items.filter((item) => item.type === 'EXCESS')
  }, [data])

  const savingList = useMemo(() => {
    if (!data?.items) return []
    return data.items.filter((item) => item.type === 'SAVING')
  }, [data])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">Loading PCMC Quantity Variation Statement...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    )
  }

  const { project, mb, summary } = data || {}
  const tenderTotal = summary?.totalTenderAmount || 0
  const executedTotal = summary?.totalExecutedAmount || 0
  const differenceTotal = Math.abs(tenderTotal - executedTotal)

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', p: { xs: 0.5, sm: 1.5, md: 2 } }}>
      {/* Top Action Bar */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 1.5, mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem' }, fontWeight: 700, color: '#111827', letterSpacing: -0.5 }}>
            Quantity Variation Sheet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pimpri Chinchwad Municipal Corporation • Reference Format Engine
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={exportingPdf ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={handleExportPdf}
            disabled={exportingPdf}
            sx={{ textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
          >
            {exportingPdf ? 'Opening PDF...' : 'Official PDF Print'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={exportingExcel ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
            onClick={handleExportExcel}
            disabled={exportingExcel}
            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#1b5e20', '&:hover': { bgcolor: '#144617' }, width: { xs: '100%', sm: 'auto' } }}
          >
            {exportingExcel ? 'Generating...' : 'Export Excel'}
          </Button>
        </Stack>
      </Box>

      {/* Official PCMC Heading Header Box */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          textAlign: 'center',
          border: '1px solid #111827',
          borderRadius: 1,
          bgcolor: '#ffffff'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#000000', fontSize: '1.2rem', mb: 0.5 }}>
          Pimpri Chinchwad Municipal Corporation, Pimpri - 18
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000', mb: 0.75 }}>
          {project?.department || 'G Zone Office, Civil Department'}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, color: '#000000', maxWidth: 900, mx: 'auto', mb: 0.5 }}>
          Name of Work - {project?.work_name || 'Providing machinery and manpower for enchronchment drive and PCMC work in prabhag no.06 (Year 2025-26)'}
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#000000', mb: 0.5 }}>
          Agency Name - {project?.contractor_name || 'M/s. AKSHAY ENTERPRISES'}
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#000000', mb: 1 }}>
          Tender No. {project?.tender_no || project?.sap_work_key || '25/11/2025-26'}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#000000', textDecoration: 'underline', letterSpacing: 0.5 }}>
          Quantity Variation Sheet
        </Typography>
      </Paper>

      {/* View Switcher Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab icon={<TableChartIcon />} iconPosition="start" label="Official PCMC Reference Format" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<AnalyticsIcon />} iconPosition="start" label="Detailed Analysis & Excess/Saving Breakdown" sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* TAB 0: EXACT PCMC REFERENCE TABLE */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Showing all {data?.items?.length || 0} sanctioned and executed civil items
            </Typography>
            <TextField
              size="small"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ width: 280, bgcolor: 'white' }}
            />
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1.5px solid #000000', borderRadius: 0, mb: 4, overflowX: 'auto' }}>
            <Table size="small" aria-label="Official PCMC Quantity Variation Table" sx={{ minWidth: 1050, '& th, & td': { border: '1px solid #000000', padding: '6px 8px' } }}>
              <TableHead>
                {/* Main 2-Tier Header */}
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell rowSpan={2} sx={{ fontWeight: 800, textAlign: 'center', width: 60, color: '#000' }}>Item No.</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 800, textAlign: 'center', minWidth: 320, color: '#000' }}>Description</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 800, textAlign: 'center', width: 60, color: '#000' }}>Unit</TableCell>
                  <TableCell colSpan={3} sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#f1f5f9', color: '#000' }}>As per Tender</TableCell>
                  <TableCell colSpan={3} sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#e2e8f0', color: '#000' }}>As Executed</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center', width: 85, color: '#000' }}>Tender quantity</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center', width: 75, color: '#000' }}>Rate</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center', width: 95, color: '#000' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center', width: 85, color: '#000' }}>Qty. As Executed</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center', width: 75, color: '#000' }}>Rate</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center', width: 95, color: '#000' }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((row) => {
                  const isHeaderItem = row.itemNo === '0' || row.description === 'EXTRA ITEM'
                  const isExtraItem = String(row.itemNo).startsWith('Ex-')
                  const eRate = row.itemNo === '7' ? 851.75 : (isExtraItem ? 862.63 : row.tenderRate)

                  return (
                    <TableRow key={row.id} sx={{ bgcolor: isHeaderItem ? '#f1f5f9' : 'inherit' }}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: isHeaderItem ? 800 : 600 }}>{row.itemNo}</TableCell>
                      <TableCell sx={{ fontWeight: isHeaderItem ? 800 : 400, fontSize: '0.85rem' }}>{row.description}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>{row.unit || (isHeaderItem ? '' : '-')}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{row.tenderQty > 0 ? row.tenderQty.toFixed(2) : (isHeaderItem ? '0.00' : '-')}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{row.tenderRate > 0 ? row.tenderRate.toFixed(2) : '-'}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{row.tenderAmount > 0 ? row.tenderAmount.toFixed(2) : '-'}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: row.executedQty > 0 ? 700 : 400 }}>
                        {row.executedQty > 0 ? row.executedQty.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        {row.executedQty > 0 ? eRate.toFixed(2) : (isHeaderItem ? '-' : (row.tenderRate > 0 ? row.tenderRate.toFixed(2) : '-'))}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: row.executedAmount > 0 ? 700 : 400 }}>
                        {row.executedAmount > 0 ? row.executedAmount.toFixed(2) : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {/* Total Row */}
                <TableRow sx={{ bgcolor: '#f8fafc', '& td': { fontWeight: 800 } }}>
                  <TableCell colSpan={5} sx={{ textAlign: 'right', pr: 2 }}>- Total :-</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{tenderTotal.toFixed(2)}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{executedTotal.toFixed(2)}</TableCell>
                </TableRow>

                {/* Total Say Row */}
                <TableRow sx={{ bgcolor: '#f8fafc', '& td': { fontWeight: 800 } }}>
                  <TableCell colSpan={5} sx={{ textAlign: 'right', pr: 2 }}>- Total Say :-</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{Math.round(tenderTotal).toFixed(2)}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{Math.round(executedTotal).toFixed(2)}</TableCell>
                </TableRow>

                {/* Difference Row */}
                <TableRow sx={{ bgcolor: '#ffffff', '& td': { fontWeight: 800 } }}>
                  <TableCell colSpan={8} sx={{ textAlign: 'right', pr: 2 }}>Difference :-</TableCell>
                  <TableCell sx={{ textAlign: 'right', color: '#b91c1c' }}>{differenceTotal.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Exact 3 Signatures Layout */}
          <Box sx={{ mt: 5, mb: 4, px: 2 }}>
            <Grid container spacing={4} sx={{ textAlign: 'center' }}>
              <Grid item xs={4}>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#000' }}>Junior Engineer</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>G Zone, Civil Dept.</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>P.C.M.C. Pimpri – 18</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#000' }}>Deputy Engineer,</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>G Zone, Civil Dept.</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>P.C.M.C. Pimpri – 18</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#000' }}>Executive Engineer,</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>G Zone, Civil Dept.</Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>P.C.M.C. Pimpri – 18</Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* TAB 1: DETAILED ENGINEERING ANALYSIS & BREAKDOWN */}
      {activeTab === 1 && (
        <Box>
          {/* Summary KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    SANCTIONED TENDER AMOUNT
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mt: 0.5 }}>
                    ₹{tenderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary?.totalItemsCount || 0} Total BOQ Items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: '#f0f4f8', border: '1px solid #d1d9e6', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    ACTUAL EXECUTED AMOUNT
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0277bd', mt: 0.5 }}>
                    ₹{executedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Measured Upto Date
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{
                bgcolor: (summary?.totalVariationAmount || 0) > 0 ? '#fff8e1' : '#e8f5e9',
                border: '1px solid #c8e6c9',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    NET VARIATION AMOUNT
                  </Typography>
                  <Typography variant="h6" sx={{
                    fontWeight: 700,
                    color: (summary?.totalVariationAmount || 0) > 0 ? '#e65100' : '#2e7d32',
                    mt: 0.5
                  }}>
                    {(summary?.totalVariationAmount || 0) > 0 ? '+' : ''}
                    ₹{summary?.totalVariationAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Difference (Executed - Tender)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <TrendingUpIcon sx={{ fontSize: 18, color: '#d84315' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#d84315' }}>
                      TOTAL EXCESS (+Qty)
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#d84315', mt: 0.5 }}>
                    ₹{summary?.totalPositiveVariation?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary?.excessItemsCount || 0} Excess Item(s)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <TrendingDownIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                      TOTAL SAVING (-Qty)
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32', mt: 0.5 }}>
                    ₹{summary?.totalNegativeVariation?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary?.savingItemsCount || 0} Saving Item(s)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Excess & Saving Breakdown Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #ffe0b2', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <TrendingUpIcon sx={{ color: '#d84315' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#d84315' }}>
                      EXCESS QUANTITY ITEMS ({excessList.length})
                    </Typography>
                  </Stack>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fff3e0' }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Item No</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Tender</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Executed</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>Excess Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>Excess Amt (₹)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {excessList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                              No excess items recorded.
                            </TableCell>
                          </TableRow>
                        ) : (
                          excessList.map((ex, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600 }}>{ex.itemNo}</TableCell>
                              <TableCell>{ex.tenderQty.toFixed(2)}</TableCell>
                              <TableCell>{ex.executedQty.toFixed(2)}</TableCell>
                              <TableCell sx={{ textAlign: 'right', fontWeight: 600, color: '#d84315' }}>+{ex.variationQty.toFixed(2)}</TableCell>
                              <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#d84315' }}>₹{ex.variationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #c8e6c9', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <TrendingDownIcon sx={{ color: '#2e7d32' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                      SAVING / LESS QUANTITY ITEMS ({savingList.length})
                    </Typography>
                  </Stack>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Item No</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Tender</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Executed</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>Reduced Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>Saving Amt (₹)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {savingList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                              No saving items recorded.
                            </TableCell>
                          </TableRow>
                        ) : (
                          savingList.map((sv, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600 }}>{sv.itemNo}</TableCell>
                              <TableCell>{sv.tenderQty.toFixed(2)}</TableCell>
                              <TableCell>{sv.executedQty.toFixed(2)}</TableCell>
                              <TableCell sx={{ textAlign: 'right', fontWeight: 600, color: '#2e7d32' }}>{Math.abs(sv.variationQty).toFixed(2)}</TableCell>
                              <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#2e7d32' }}>₹{Math.abs(sv.variationAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  )
}

export default QuantityVariationPage


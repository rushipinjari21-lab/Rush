import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Button, Card, CardContent, TextField, IconButton, Alert, MenuItem, Grid, Chip } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import UploadIcon from '@mui/icons-material/Upload'
import DeleteIcon from '@mui/icons-material/Delete'
import StraightenIcon from '@mui/icons-material/Straighten'
import boqService from '../../services/boq.service'
import projectService from '../../services/project.service'

const BOQList = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Extract key from wildcard or query param
  const rawKey = params['*'] || params.sapWorkKey || new URLSearchParams(location.search).get('project') || ''
  const decodedRouteKey = rawKey ? decodeURIComponent(rawKey) : ''

  const [allProjects, setAllProjects] = useState([])
  const [activeSapKey, setActiveSapKey] = useState(decodedRouteKey)
  const [project, setProject] = useState(null)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [partSection, setPartSection] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      loadItems(activeSapKey)
      projectService.getBySapKey(activeSapKey).then(res => setProject(res.data?.data)).catch(() => {})
    }
  }, [activeSapKey])

  const loadItems = async (sapKey) => {
    setLoading(true)
    setError('')
    try {
      const res = await boqService.getByProject(sapKey)
      setItems(res.data?.data || [])
    } catch (requestError) {
      console.error(requestError)
      setError(requestError.response?.data?.message || 'Schedule B items could not be loaded.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this BOQ item?')) return
    try {
      await boqService.deleteItem(id)
      loadItems(activeSapKey)
    } catch (error) {
      alert('Delete failed')
    }
  }

  const filtered = items.filter(i =>
    (!partSection || i.part_section === partSection) &&
    ((i.ssr_code || '').toLowerCase().includes(search.toLowerCase()) ||
     String(i.description || '').toLowerCase().includes(search.toLowerCase()) ||
     String(i.additional_specification || '').toLowerCase().includes(search.toLowerCase()))
  )

  const columns = [
    { field: 'item_no', headerName: 'No', width: 60 },
    {
      field: 'part_section',
      headerName: 'Part',
      width: 90,
      renderCell: (params) => (
        <Chip label={params.value || 'Part A'} size="small" color={params.value === 'Part A' ? 'primary' : 'secondary'} />
      )
    },
    { field: 'ssr_code', headerName: 'SSR Code', width: 120, renderCell: (params) => <strong>{params.value || '—'}</strong> },
    { field: 'additional_specification', headerName: 'Additional Spec', width: 140, valueGetter: (_, row) => row.additional_specification || '—' },
    { field: 'description', headerName: 'Description', width: 340 },
    { field: 'unit', headerName: 'Unit', width: 70 },
    { field: 'boq_quantity', headerName: 'BOQ Qty', width: 100, type: 'number' },
    { field: 'rate', headerName: 'Rate (₹)', width: 100, type: 'number', valueFormatter: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    { field: 'amount', headerName: 'Amount (₹)', width: 120, type: 'number', valueFormatter: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      )
    }
  ]

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 1.5, mb: 2 }}>
        <div>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700 }}>
            Schedule B / BOQ Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View parsed SSR items, rates, quantities and specifications for the selected project.
          </Typography>
        </div>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => navigate(`/boq/upload?project=${encodeURIComponent(activeSapKey)}`)}
            disabled={!activeSapKey}
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Upload PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<StraightenIcon />}
            disabled={!items.length}
            onClick={() => navigate(`/measurement?project=${encodeURIComponent(activeSapKey)}`)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Go to MB
          </Button>
        </Box>
      </Box>

      {/* Project Selector Card */}
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
                  navigate(`/boq?project=${encodeURIComponent(e.target.value)}`)
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
                  <strong>Contractor:</strong> {project.contractor_name} | <strong>Dept:</strong> {project.department} | <strong>BOQ Items:</strong> {items.length}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!items.length && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No Schedule B items found for this project. Click <strong>"Upload PDF"</strong> above to upload the Schedule B PDF.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2, alignItems: 'stretch' }}>
        <TextField
          fullWidth
          label="Search SSR Code, Spec, or Description"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          select
          label="Filter by Part"
          size="small"
          value={partSection}
          onChange={(e) => setPartSection(e.target.value)}
          sx={{ width: { xs: '100%', sm: 180 } }}
        >
          <MenuItem value="">All Parts ({items.length})</MenuItem>
          <MenuItem value="Part A">Part A ({items.filter(i => i.part_section === 'Part A').length})</MenuItem>
          <MenuItem value="Part B">Part B ({items.filter(i => i.part_section === 'Part B').length})</MenuItem>
          <MenuItem value="Part C">Part C ({items.filter(i => i.part_section === 'Part C').length})</MenuItem>
          <MenuItem value="Part D">Part D ({items.filter(i => i.part_section === 'Part D').length})</MenuItem>
        </TextField>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={filtered}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              getRowId={(row) => row.id}
              autoHeight
              disableRowSelectionOnClick
              sx={{ minWidth: 700 }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default BOQList

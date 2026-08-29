import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button, Card, CardContent, TextField, MenuItem, IconButton } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import StraightenIcon from '@mui/icons-material/Straighten'
import ReceiptIcon from '@mui/icons-material/Receipt'
import projectService from '../../services/project.service'

const formatCurrency = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : '—'
}

const ProjectList = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  const loadProjects = async () => {
    setLoading(true)
    try {
      const res = await projectService.getAll({ search, status })
      setProjects(res.data.data.projects)
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProjects() }, [search, status])

  const handleDelete = async (sapWorkKey) => {
    if (!window.confirm('Delete this project?')) return
    try { await projectService.delete(sapWorkKey); loadProjects() }
    catch (error) { alert(error.response?.data?.message || 'Delete failed') }
  }

  const columns = [
    { field: 'sap_work_key', headerName: 'SAP Key', width: 140 },
    { field: 'work_name', headerName: 'Work Name', width: 260 },
    { field: 'contractor_name', headerName: 'Contractor', width: 180 },
    { field: 'department', headerName: 'Dept', width: 110 },
    { field: 'budget_head', headerName: 'Budget', width: 110 },
    { field: 'estimated_cost', headerName: 'Est. Cost', width: 130, valueFormatter: (value) => formatCurrency(value) },
    { field: 'status', headerName: 'Status', width: 90 },
    { field: 'actions', headerName: 'Actions', width: 210, sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" title="Open Schedule B / BOQ" color="primary" onClick={() => navigate(`/boq/${encodeURIComponent(params.row.sap_work_key)}`)}><UploadFileIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="Measurement Books" color="secondary" onClick={() => navigate(`/measurement/${encodeURIComponent(params.row.sap_work_key)}`)}><StraightenIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="RA Bills" color="success" onClick={() => navigate(`/ra-bills/${encodeURIComponent(params.row.sap_work_key)}`)}><ReceiptIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="Edit Project" onClick={() => navigate(`/projects/edit/${encodeURIComponent(params.row.sap_work_key)}`)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="Delete" color="error" onClick={() => handleDelete(params.row.sap_work_key)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      )
    }
  ]

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700 }}>Projects</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/projects/new')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          New Project
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2 }}>
        <TextField fullWidth label="Search Projects / Contractor" size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1 }} />
        <TextField select label="Status" size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: { xs: '100%', sm: 160 } }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="on_hold">On Hold</MenuItem>
        </TextField>
      </Box>
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={projects}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              getRowId={(row) => row.id}
              autoHeight
              disableRowSelectionOnClick
              sx={{ minWidth: 650 }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ProjectList

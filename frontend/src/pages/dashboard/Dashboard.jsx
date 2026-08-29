import React, { useEffect, useState } from 'react'
import { Grid, Card, CardContent, Typography, Box, Alert, Button } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useNavigate } from 'react-router-dom'
import BusinessIcon from '@mui/icons-material/Business'
import StraightenIcon from '@mui/icons-material/Straighten'
import ReceiptIcon from '@mui/icons-material/Receipt'
import AssessmentIcon from '@mui/icons-material/Assessment'
import projectService from '../../services/project.service'
import measurementService from '../../services/measurement.service'
import rabillService from '../../services/rabill.service'
import reportService from '../../services/report.service'

const StatCard = ({ title, value, icon, color, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '100%',
      '&:hover': onClick ? { transform: 'translateY(-3px)', boxShadow: 4 } : {}
    }}
  >
    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ pr: 1 }}>
          <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.6rem', sm: '2rem' } }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color, fontSize: { xs: 32, sm: 40 }, display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const [stats, setStats] = useState({ projects: {}, measurementBooks: {}, raBills: {} })
  const [recentProjects, setRecentProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const [projectRes, mbRes, raRes, projRes] = await Promise.allSettled([
        projectService.getStats(),
        measurementService.getStats(),
        rabillService.getStats(),
        projectService.getAll({ limit: 5 })
      ])
      
      const projStats = projectRes.status === 'fulfilled' ? (projectRes.value?.data?.data || {}) : {}
      const mbStats = mbRes.status === 'fulfilled' ? (mbRes.value?.data?.data || {}) : {}
      const raStats = raRes.status === 'fulfilled' ? (raRes.value?.data?.data || {}) : {}
      const recentList = projRes.status === 'fulfilled' ? (projRes.value?.data?.data?.projects || []) : []

      setStats({
        projects: projStats,
        measurementBooks: mbStats,
        raBills: raStats
      })
      setRecentProjects(recentList)
    } catch (requestError) {
      console.error(requestError)
      setError(requestError.response?.data?.message || 'Dashboard data could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  const columns = [
    { field: 'sap_work_key', headerName: 'SAP Key', width: 130 },
    { field: 'work_name', headerName: 'Work Name', minWidth: 200, flex: 1 },
    { field: 'contractor_name', headerName: 'Contractor', width: 160 },
    { field: 'department', headerName: 'Dept', width: 100 },
    { field: 'status', headerName: 'Status', width: 100 }
  ]

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700, mb: 2 }}>
        Dashboard
      </Typography>
      {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={loadStats}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard title="Total Projects" value={stats?.projects?.total_projects ?? 0} icon={<BusinessIcon fontSize="inherit" />} color="#1565c0" onClick={() => navigate('/projects')} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard title="Active Projects" value={stats?.projects?.active_projects ?? 0} icon={<AssessmentIcon fontSize="inherit" />} color="#2e7d32" onClick={() => navigate('/projects')} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard title="Measurement Books" value={stats?.measurementBooks?.total_mbs ?? 0} icon={<StraightenIcon fontSize="inherit" />} color="#ed6c02" onClick={() => navigate('/measurement')} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard title="RA Bills" value={stats?.raBills?.total_bills ?? 0} icon={<ReceiptIcon fontSize="inherit" />} color="#d32f2f" onClick={() => navigate('/ra-bills')} />
        </Grid>
      </Grid>
      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 600, mb: 1.5 }}>
            Recent Projects
          </Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={recentProjects}
              columns={columns}
              loading={loading}
              pageSizeOptions={[5]}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
              getRowId={(row) => row.id}
              autoHeight
              disableRowSelectionOnClick
              onRowClick={(params) => navigate(`/projects/edit/${encodeURIComponent(params.row.sap_work_key)}`)}
              sx={{ minWidth: 500 }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Dashboard

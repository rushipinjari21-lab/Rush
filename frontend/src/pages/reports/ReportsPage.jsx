import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField, MenuItem
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import DownloadIcon from '@mui/icons-material/Download'
import AssessmentIcon from '@mui/icons-material/Assessment'
import reportService from '../../services/report.service'
import projectService from '../../services/project.service'

const ReportsPage = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [projectReport, setProjectReport] = useState(null)

  useEffect(() => {
    loadDashboard()
    loadProjects()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await reportService.getDashboard()
      setDashboardData(res?.data?.data || null)
    } catch (error) {
      console.error(error)
    }
  }

  const loadProjects = async () => {
    try {
      const res = await projectService.getAll({ limit: 100 })
      setProjects(res?.data?.data?.projects || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadProjectReport = async () => {
    if (!selectedProject) return
    try {
      const res = await reportService.getProjectReport(selectedProject)
      setProjectReport(res.data.data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleExportProject = async () => {
    if (!selectedProject) return
    try {
      const res = await reportService.exportProject(selectedProject)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Report_${selectedProject}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      alert('Export failed')
    }
  }

  const projectColumns = [
    { field: 'sap_work_key', headerName: 'SAP Key', width: 130 },
    { field: 'work_name', headerName: 'Work Name', width: 300 },
    { field: 'contractor_name', headerName: 'Contractor', width: 180 },
    { field: 'department', headerName: 'Department', width: 130 },
    { field: 'status', headerName: 'Status', width: 100 }
  ]

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '1.9rem' }, fontWeight: 700, mb: 2 }}>
        Reports & Analytics
      </Typography>

      {/* Dashboard Stats */}
      {dashboardData && (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Typography color="text.secondary" variant="body2">Total Projects</Typography>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700 }}>
                  {dashboardData?.projects?.total_projects || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Typography color="text.secondary" variant="body2">Active Projects</Typography>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700 }}>
                  {dashboardData?.projects?.active_projects || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Typography color="text.secondary" variant="body2">Total MBs</Typography>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700 }}>
                  {dashboardData?.measurementBooks?.total_mbs || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Typography color="text.secondary" variant="body2">Total RA Bills</Typography>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700 }}>
                  {dashboardData?.raBills?.total_bills || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Project-wise Report */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Project-wise Report</Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              sx={{ flex: 1 }}
            >
              {projects.map(p => (
                <MenuItem key={p.sap_work_key} value={p.sap_work_key}>
                  {p.sap_work_key} - {p.work_name}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={loadProjectReport} startIcon={<AssessmentIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              View Report
            </Button>
            <Button variant="outlined" onClick={handleExportProject} startIcon={<DownloadIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Export Excel
            </Button>
          </Box>

          {projectReport && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">{projectReport.project?.work_name}</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2"><strong>BOQ Items:</strong> {projectReport.boq?.items?.length || 0}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2"><strong>MBs:</strong> {projectReport.measurementBooks?.length || 0}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2"><strong>RA Bills:</strong> {projectReport.raBills?.length || 0}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2"><strong>Est. Cost:</strong> ₹{parseFloat(projectReport.project?.estimated_cost || 0).toLocaleString('en-IN')}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* All Projects Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }}>All Projects</Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={projects}
              columns={projectColumns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              getRowId={(row) => row.id}
              autoHeight
              disableRowSelectionOnClick
              onRowClick={(params) => setSelectedProject(params.row.sap_work_key)}
              sx={{ minWidth: 600 }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ReportsPage

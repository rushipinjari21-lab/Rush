import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Card, CardContent, TextField, Button, Grid, MenuItem } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import projectService from '../../services/project.service'

const ProjectForm = () => {
  const { sapWorkKey } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(sapWorkKey)

  const [form, setForm] = useState({
    sap_work_key: '', work_name: '', contractor_name: '', work_order_no: '',
    tender_no: '', department: '', budget_head: '', estimated_cost: '',
    start_date: null, completion_date: null, status: 'active', remarks: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      projectService.getBySapKey(sapWorkKey).then(res => {
        const p = res.data.data
        setForm({ ...p, start_date: p.start_date ? new Date(p.start_date) : null, completion_date: p.completion_date ? new Date(p.completion_date) : null })
      })
    }
  }, [sapWorkKey])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    try {
      const data = {
        ...form,
        start_date: form.start_date ? form.start_date.toISOString().split('T')[0] : null,
        completion_date: form.completion_date ? form.completion_date.toISOString().split('T')[0] : null
      }
      if (isEdit) {
        await projectService.update(sapWorkKey, data)
        navigate('/projects')
      } else {
        await projectService.create(data)
        // A new project always starts with its Schedule B / BOQ upload.
        navigate(`/boq/${encodeURIComponent(data.sap_work_key)}/upload`)
      }
    } catch (error) {
      alert(error.response?.data?.message || (error.request ? 'Cannot reach the backend. Please wait a few seconds and save again.' : error.message || 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '1.9rem' }, fontWeight: 700, mb: 2 }}>
        {isEdit ? 'Edit Project' : 'New Project'}
      </Typography>
      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth label="SAP Work Key *" name="sap_work_key" value={form.sap_work_key} onChange={handleChange} required disabled={isEdit} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Work Order No *" name="work_order_no" value={form.work_order_no} onChange={handleChange} required /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Work Name *" name="work_name" value={form.work_name} onChange={handleChange} required /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Contractor *" name="contractor_name" value={form.contractor_name} onChange={handleChange} required /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Tender No" name="tender_no" value={form.tender_no} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Department *" name="department" value={form.department} onChange={handleChange} required /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Budget Head *" name="budget_head" value={form.budget_head} onChange={handleChange} required /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Est. Cost *" name="estimated_cost" type="number" value={form.estimated_cost} onChange={handleChange} required /></Grid>
              <Grid item xs={12} md={4}><DatePicker label="Start Date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} slotProps={{ textField: { fullWidth: true } }} /></Grid>
              <Grid item xs={12} md={4}><DatePicker label="Completion Date" value={form.completion_date} onChange={(v) => setForm({ ...form, completion_date: v })} slotProps={{ textField: { fullWidth: true } }} /></Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Status" name="status" value={form.status} onChange={handleChange}>
                  <MenuItem value="active">Active</MenuItem><MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} /></Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
              <Button variant="contained" type="submit" disabled={saving} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/projects')} disabled={saving} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                Cancel
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ProjectForm

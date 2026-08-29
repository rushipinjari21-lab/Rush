import React, { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, TextField, MenuItem,
  List, ListItem, ListItemIcon, ListItemText, IconButton, Chip, Button, Alert
} from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder'
import DescriptionIcon from '@mui/icons-material/Description'
import DownloadIcon from '@mui/icons-material/Download'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import projectService from '../../services/project.service'
import documentService from '../../services/document.service'
import PdfViewer from '../../components/document/PdfViewer'

export const DocumentCenterPage = () => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [documentsData, setDocumentsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null)
  const [previewTitle, setPreviewTitle] = useState('Document Preview')
  const [previewFileName, setPreviewFileName] = useState('document.pdf')
  const [openPdfViewer, setOpenPdfViewer] = useState(false)

  useEffect(() => {
    projectService.getAll({ limit: 100 }).then(res => {
      const list = res.data?.data?.projects || []
      setProjects(list)
      if (list.length > 0) setSelectedProject(list[0].sap_work_key)
    }).catch(err => console.error(err))
  }, [])

  useEffect(() => {
    if (selectedProject) loadDocuments(selectedProject)
  }, [selectedProject])

  const loadDocuments = async (sapKey) => {
    setLoading(true)
    try {
      const res = await documentService.getByProject(sapKey)
      setDocumentsData(res.data?.data)
    } catch (err) {
      console.error(err)
      setDocumentsData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (doc) => {
    try {
      const res = await documentService.downloadDocument(doc.id)
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.file_name)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Download failed')
    }
  }

  const handlePreview = async (doc) => {
    try {
      const res = await documentService.downloadDocument(doc.id)
      const isPdf = /\.pdf$/i.test(doc.file_name) || doc.document_type === 'DAKHALA'
      if (!isPdf) {
        // If Excel, download directly
        handleDownload(doc)
        return
      }
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      setPdfPreviewUrl(url)
      setPreviewTitle(`${doc.document_type} - ${doc.file_name}`)
      setPreviewFileName(doc.file_name)
      setOpenPdfViewer(true)
    } catch (err) {
      alert('Could not preview document')
    }
  }

  const grouped = documentsData?.grouped || { mb: [], raBills: [], dakhala: [], reports: [], other: [] }

  const renderDocGroup = (title, docs = []) => (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.2rem' }, fontWeight: 700 }}>
          <FolderIcon color="primary" fontSize="small" /> {title} ({docs.length})
        </Typography>
        {docs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 2 }}>No documents generated yet</Typography>
        ) : (
          <List size="small" disablePadding sx={{ mt: 1 }}>
            {docs.map(doc => (
              <ListItem
                key={doc.id}
                divider
                secondaryAction={
                  <Box sx={{ display: 'flex' }}>
                    <IconButton size="small" color="primary" title="Preview" onClick={() => handlePreview(doc)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title="Download" onClick={() => handleDownload(doc)}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
                sx={{ px: { xs: 0.5, sm: 1.5 } }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {/\.pdf$/i.test(doc.file_name) ? <PictureAsPdfIcon color="error" fontSize="small" /> : <DescriptionIcon color="action" fontSize="small" />}
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: { xs: 140, sm: 300 } }}>{doc.file_name}</Typography>}
                  secondary={`v${doc.version} • ${new Date(doc.created_at).toLocaleDateString('en-IN')}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '1.9rem' }, fontWeight: 700 }} gutterBottom>
        Central Document Center
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Centralized document management vault per project. Organizes MBs, RA Bills, Dakhala certificates, and reports.
      </Typography>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Select Active Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map(p => (
              <MenuItem key={p.sap_work_key} value={p.sap_work_key}>
                {p.sap_work_key} - {p.work_name} ({p.contractor_name})
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {selectedProject && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {renderDocGroup("Measurement Books (MB)", grouped.mb)}
            {renderDocGroup("Running Account Bills (RA Bills)", grouped.raBills)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderDocGroup("Dakhala & Certificates", grouped.dakhala)}
            {renderDocGroup("Reports & Exports", grouped.reports)}
          </Grid>
        </Grid>
      )}

      <PdfViewer
        open={openPdfViewer}
        onClose={() => setOpenPdfViewer(false)}
        pdfUrl={pdfPreviewUrl}
        title={previewTitle}
        fileName={previewFileName}
      />
    </Box>
  )
}

export default DocumentCenterPage


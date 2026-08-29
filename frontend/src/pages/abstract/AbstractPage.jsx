import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import abstractService from '../../services/abstract.service'

const AbstractPage = () => {
  const { mbId } = useParams()
  const [abstractData, setAbstractData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAbstract()
  }, [mbId])

  const loadAbstract = async () => {
    try {
      const res = await abstractService.generate(mbId)
      setAbstractData(res.data.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await abstractService.export(mbId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Abstract_${mbId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      alert('Export failed')
    }
  }

  if (loading) return <Typography>Loading...</Typography>
  if (!abstractData) return <Typography>No data found</Typography>

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '1.9rem' }, fontWeight: 700 }}>
          Abstract of Measurements
        </Typography>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Export to Excel
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="subtitle1" fontWeight="bold">MB Number: {abstractData.mb_number}</Typography>
          <Typography variant="body2" color="text.secondary">SAP Work Key: {abstractData.sap_work_key}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2"><strong>Total Items:</strong> {abstractData.summary?.total_items}</Typography>
            <Typography variant="body2"><strong>Total Amount:</strong> ₹{abstractData.summary?.total_amount?.toLocaleString('en-IN')}</Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>SSR Code</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Unit</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">BOQ Qty</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Rate</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Previous</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Current</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Total</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Balance</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {abstractData.items?.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.ssr_code}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell align="right">{item.boq_quantity}</TableCell>
                    <TableCell align="right">₹{item.rate}</TableCell>
                    <TableCell align="right">{item.previous_quantity}</TableCell>
                    <TableCell align="right">{item.current_quantity}</TableCell>
                    <TableCell align="right">{item.total_quantity}</TableCell>
                    <TableCell align="right">{item.balance_quantity}</TableCell>
                    <TableCell align="right">₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell colSpan={9} align="right"><strong>Total:</strong></TableCell>
                  <TableCell align="right"><strong>₹{abstractData.summary?.total_amount?.toLocaleString('en-IN')}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AbstractPage

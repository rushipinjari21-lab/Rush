import React, { useState, useEffect } from 'react'
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material'
import WifiIcon from '@mui/icons-material/Wifi'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import PublicIcon from '@mui/icons-material/Public'
import DnsIcon from '@mui/icons-material/Dns'
import StorageIcon from '@mui/icons-material/Storage'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet'
import axios from 'axios'
import { getStoredApiUrl, setStoredApiUrl, formatApiUrl } from '../../services/api.js'

export const ConnectionStatusBadge = () => {
  const [open, setOpen] = useState(false)
  const [apiUrlInput, setApiUrlInput] = useState(getStoredApiUrl())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const [status, setStatus] = useState({
    internet: typeof navigator !== 'undefined' ? navigator.onLine : true,
    backend: 'checking',
    database: 'checking',
    latencyMs: null
  })

  const checkHealth = async (targetUrl = getStoredApiUrl()) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (!isOnline) {
      setStatus({ internet: false, backend: 'error', database: 'error', latencyMs: null })
      return
    }

    const formatted = formatApiUrl(targetUrl)
    const healthEndpoint = formatted.endsWith('/api') ? `${formatted}/health` : `${formatted}/api/health`

    const startTime = Date.now()
    try {
      const res = await axios.get(healthEndpoint, { timeout: 10000 })
      const elapsed = Date.now() - startTime
      if (res.status === 200 || res.data?.success) {
        setStatus({
          internet: true,
          backend: 'connected',
          database: res.data?.database || 'connected',
          latencyMs: elapsed
        })
      } else {
        setStatus({
          internet: true,
          backend: 'connected',
          database: res.data?.database || 'connecting',
          latencyMs: elapsed
        })
      }
    } catch (err) {
      setStatus({
        internet: isOnline,
        backend: 'error',
        database: 'error',
        latencyMs: null
      })
    }
  }

  useEffect(() => {
    checkHealth()
    const interval = setInterval(() => checkHealth(), 30000)
    return () => clearInterval(interval)
  }, [])

  const handleOpen = () => {
    setApiUrlInput(getStoredApiUrl())
    setTestResult(null)
    checkHealth()
    setOpen(true)
  }

  const handleTest = async () => {
    if (!apiUrlInput.trim()) return
    setTesting(true)
    setTestResult(null)
    const formatted = formatApiUrl(apiUrlInput)
    const healthUrl = formatted.endsWith('/api') ? `${formatted}/health` : `${formatted}/api/health`

    const start = Date.now()
    try {
      const res = await axios.get(healthUrl, { timeout: 4000 })
      const diff = Date.now() - start
      if (res.data?.success || res.status === 200) {
        setTestResult({
          success: true,
          message: `Connected successfully (${diff}ms). Backend and MySQL database are online.`
        })
      } else {
        setTestResult({
          success: false,
          message: res.data?.message || 'Server responded with a degraded status.'
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `Could not reach ${formatted}. Ensure backend is running and URL is accessible.`
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    const updated = setStoredApiUrl(apiUrlInput)
    checkHealth(updated)
    setOpen(false)
  }

  const isAllGood = status.internet && status.backend === 'connected' && status.database === 'connected'
  const isDegraded = status.internet && (status.backend === 'checking' || status.database === 'connecting')
  const badgeColor = isAllGood ? '#22c55e' : isDegraded ? '#eab308' : '#ef4444'

  return (
    <>
      <Tooltip title={`Network & Server Status: ${isAllGood ? 'All Online' : isDegraded ? 'Connecting...' : 'Offline'}`}>
        <IconButton
          onClick={handleOpen}
          size="small"
          sx={{
            p: 0.8,
            color: 'inherit',
            position: 'relative'
          }}
        >
          <SettingsEthernetIcon fontSize="small" />
          <Box
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 9,
              height: 9,
              borderRadius: '50%',
              bgcolor: badgeColor,
              border: '2px solid white',
              boxShadow: '0 0 6px ' + badgeColor
            }}
          />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsEthernetIcon color="primary" />
          Central System Connection
        </DialogTitle>
        <DialogContent dividers>
          {/* 3-Tier Status Overview */}
          <List dense sx={{ mb: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', p: 1 }}>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PublicIcon color={status.internet ? "success" : "error"} fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" fontWeight={600}>1. Network & Mobile Data (4G / 5G / Any)</Typography>}
                secondary={status.internet ? 'Online & Accessible Anywhere' : 'Disconnected'}
              />
              <Chip label={status.internet ? 'Online (Any Network)' : 'Offline'} size="small" color={status.internet ? 'success' : 'error'} variant="outlined" />
            </ListItem>

            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <DnsIcon color={status.backend === 'connected' ? 'success' : status.backend === 'checking' ? 'warning' : 'error'} fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" fontWeight={600}>2. Central Backend API</Typography>}
                secondary={status.backend === 'connected' ? `Active (${status.latencyMs || 0}ms latency)` : status.backend === 'checking' ? 'Connecting...' : 'Unreachable'}
              />
              <Chip
                label={status.backend === 'connected' ? 'Online' : status.backend === 'checking' ? 'Checking' : 'Error'}
                size="small"
                color={status.backend === 'connected' ? 'success' : status.backend === 'checking' ? 'warning' : 'error'}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <StorageIcon color={status.database === 'connected' ? 'success' : 'warning'} fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" fontWeight={600}>3. Central MySQL Database</Typography>}
                secondary={status.database === 'connected' ? 'Ready & Synchronized' : 'Connecting to MySQL...'}
              />
              <Chip
                label={status.database === 'connected' ? 'Connected' : 'Connecting'}
                size="small"
                color={status.database === 'connected' ? 'success' : 'warning'}
                variant="filled"
              />
            </ListItem>
          </List>

          {/* Central Server URL Setting */}
          <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
            BACKEND API BASE URL:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={apiUrlInput}
            onChange={(e) => setApiUrlInput(e.target.value)}
            placeholder="https://api.yourdomain.com/api"
            helperText="Works across all devices (Android, iOS, Web, Tablet, Desktop)"
          />

          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleTest}
              disabled={testing || !apiUrlInput.trim()}
              startIcon={testing ? <CircularProgress size={14} /> : undefined}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                const def = setStoredApiUrl('')
                setApiUrlInput(def)
                checkHealth(def)
              }}
            >
              Reset Default
            </Button>
          </Box>

          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
              icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
            >
              {testResult.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleSave}>
            Apply & Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConnectionStatusBadge

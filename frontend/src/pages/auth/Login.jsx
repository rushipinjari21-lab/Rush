import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext.jsx'
import { getStoredApiUrl, setStoredApiUrl, getDefaultApiUrl, formatApiUrl } from '../../services/api.js'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Server URL settings state
  const [currentServerUrl, setCurrentServerUrl] = useState(getStoredApiUrl())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [serverUrlInput, setServerUrlInput] = useState(getStoredApiUrl())
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setCurrentServerUrl(getStoredApiUrl())
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      const activeUrl = getStoredApiUrl()
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK'
      if (isNetworkError) {
        setError(
          activeUrl
            ? `Cannot reach backend server at "${activeUrl}". Verify the address and that the server is online, then tap Server Settings.`
            : 'No backend server is configured. Tap Server Settings and enter the public HTTPS address.'
        )
      } else {
        setError(err.response?.data?.message || err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSettings = () => {
    const activeUrl = getStoredApiUrl()
    setServerUrlInput(activeUrl)
    setTestResult(null)
    setSettingsOpen(true)
  }

  const runConnectionCheck = async (targetUrl) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (!isOnline) {
      setTestResult({
        success: false,
        internet: false,
        backend: false,
        database: false,
        message: 'No Internet connection detected on this device. Please check your Wi-Fi or Mobile Data.'
      })
      return
    }

    const formatted = formatApiUrl(targetUrl)
    setTestLoading(true)
    setTestResult(null)
    const startTime = Date.now()
    try {
      const healthUrl = formatted.endsWith('/api') ? `${formatted}/health` : `${formatted}/api/health`
      const res = await axios.get(healthUrl, { timeout: 4000 })
      const elapsed = Date.now() - startTime
      const isDbReady = res.data?.database === 'connected'

      if (res.data?.success || res.status === 200) {
        setTestResult({
          success: true,
          internet: true,
          backend: true,
          database: isDbReady,
          latency: elapsed,
          message: `Connected successfully (${elapsed}ms)! Central Backend API and MySQL Database are online.`
        })
      } else {
        setTestResult({
          success: false,
          internet: true,
          backend: true,
          database: false,
          latency: elapsed,
          message: res.data?.message || 'Backend is reachable, but MySQL database is still connecting.'
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        internet: true,
        backend: false,
        database: false,
        message: `Could not reach ${formatted}. Check the address or ensure backend server is online.`
      })
    } finally {
      setTestLoading(false)
    }
  }

  const handleTestConnection = () => {
    if (serverUrlInput.trim()) {
      runConnectionCheck(serverUrlInput)
    }
  }

  const handleApplyPreset = (presetUrl) => {
    const formatted = formatApiUrl(presetUrl)
    setServerUrlInput(formatted)
    runConnectionCheck(formatted)
  }

  const handleSaveSettings = () => {
    const formatted = setStoredApiUrl(serverUrlInput)
    setCurrentServerUrl(formatted)
    setSettingsOpen(false)
    setError('')
  }

  const handleResetSettings = () => {
    const def = setStoredApiUrl('')
    setServerUrlInput(def)
    setCurrentServerUrl(def)
    setTestResult(null)
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 2, boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, textAlign: 'center', pl: 4 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">PCMC BillPro</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Civil Construction Billing Automation
              </Typography>
            </Box>
            <Tooltip title="Server Settings">
              <IconButton onClick={handleOpenSettings} size="small" color="primary">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Button
                    color="primary"
                    variant="contained"
                    size="small"
                    sx={{ fontSize: '0.7rem', py: 0.2 }}
                    onClick={() => {
                      const cloudUrl = 'https://remarkable-gentleness-production-a680.up.railway.app/api'
                      setStoredApiUrl(cloudUrl)
                      setCurrentServerUrl(cloudUrl)
                      setServerUrlInput(cloudUrl)
                      setError('')
                    }}
                  >
                    Use Cloud Server
                  </Button>
                  <Button color="inherit" size="small" sx={{ fontSize: '0.7rem' }} onClick={handleOpenSettings}>
                    Settings
                  </Button>
                </Box>
              }
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{ mt: 2.5, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </form>

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">Default: admin / admin123</Typography>
            <Button size="small" variant="text" onClick={handleOpenSettings} sx={{ fontSize: '0.75rem', textTransform: 'none', wordBreak: 'break-all' }}>
              Server: {currentServerUrl || 'Not configured'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Server URL Configuration Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Backend Server Settings</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Enter the public HTTPS address for PCMC BillPro. This same address works from any phone and network.
          </Typography>

          <TextField
            fullWidth
            label="Backend API URL"
            value={serverUrlInput}
            onChange={(e) => setServerUrlInput(e.target.value)}
            placeholder="https://remarkable-gentleness-production-a680.up.railway.app/api"
            helperText="24/7 Cloud Central API. Connects from any phone on 4G, 5G, or any network."
            margin="dense"
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleTestConnection}
              disabled={testLoading || !serverUrlInput.trim()}
              startIcon={testLoading ? <CircularProgress size={16} /> : undefined}
            >
              {testLoading ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button variant="text" size="small" color="secondary" onClick={handleResetSettings}>
              Reset Default
            </Button>
          </Box>

          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              icon={testResult.success ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
              sx={{ mt: 2 }}
            >
              {testResult.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Save & Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Login

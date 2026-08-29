import axios from 'axios'

export const formatApiUrl = (input) => {
  if (!input) return ''
  let url = input.trim()

  // `/api` is used by the hosted website, where Nginx proxies requests to the
  // backend on the same HTTPS domain. Keep it relative so browsers do not
  // attempt to call a non-existent `http://api` host.
  if (url.startsWith('/')) {
    url = url.replace(/\/+$/, '')
    return url.endsWith('/api') ? url : `${url}/api`
  }

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  url = url.replace(/\/+$/, '')
  if (!url.endsWith('/api')) {
    url = `${url}/api`
  }
  return url
}

export const getDefaultApiUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
  if (configuredApiUrl) return formatApiUrl(configuredApiUrl)
  if (import.meta.env.DEV) return '/api'

  if (
    typeof window !== 'undefined' &&
    /^https?:$/.test(window.location.protocol) &&
    !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  ) {
    return '/api'
  }

  // Standalone public cloud backend for Android APK and multi-device access
  return 'https://remarkable-gentleness-production-a680.up.railway.app/api'
}

export const getStoredApiUrl = () => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('pcmc_server_url')?.trim() : null
  if (stored) {
    // If stored URL points to a local network IP or incomplete URL, auto-heal to cloud backend
    if (
      stored.includes('localhost') ||
      stored.includes('127.0.0.1') ||
      stored.includes('192.168.') ||
      stored.includes('10.0.') ||
      stored.includes('172.16.') ||
      stored.includes('172.20.') ||
      (stored.includes('remarkable-gentlen') && !stored.includes('railway.app')) ||
      (!stored.startsWith('http://') && !stored.startsWith('https://') && !stored.startsWith('/'))
    ) {
      localStorage.removeItem('pcmc_server_url')
      return getDefaultApiUrl()
    }
    return formatApiUrl(stored)
  }
  return getDefaultApiUrl()
}

export const setStoredApiUrl = (url) => {
  if (url && url.trim()) {
    const formatted = formatApiUrl(url)
    localStorage.setItem('pcmc_server_url', formatted)
    api.defaults.baseURL = formatted
    return formatted
  } else {
    localStorage.removeItem('pcmc_server_url')
    const def = getDefaultApiUrl()
    api.defaults.baseURL = def
    return def
  }
}

const api = axios.create({
  baseURL: getStoredApiUrl(),
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  config.baseURL = getStoredApiUrl()
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config
    const method = request?.method?.toLowerCase()
    const isSafeToRetry = ['get', 'head', 'options'].includes(method)

    // XAMPP can take a moment to bring MySQL back after Windows wakes or the
    // control panel restarts it. Only retry requests that cannot create or
    // change data. Retrying a POST after its response was lost can otherwise
    // save a project and then incorrectly show a duplicate-project error.
    if (
      request &&
      isSafeToRetry &&
      (error.code === 'ERR_NETWORK' || error.response?.status === 503) &&
      (request.__pcmcRetryCount || 0) < 2
    ) {
      request.__pcmcRetryCount = (request.__pcmcRetryCount || 0) + 1
      await new Promise((resolve) => setTimeout(resolve, 1200 * request.__pcmcRetryCount))
      return api(request)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

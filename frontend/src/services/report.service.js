import api from './api.js'
const reportService = {
  getDashboard: () => api.get('/reports/dashboard'),
  getProjectReport: (sapWorkKey) => api.get(`/reports/project/${encodeURIComponent(sapWorkKey)}`),
  exportProject: (sapWorkKey) => api.get(`/reports/project/${encodeURIComponent(sapWorkKey)}/export`, { responseType: 'blob' })
}
export default reportService

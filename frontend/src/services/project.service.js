import api from './api.js'
const projectService = {
  getAll: (params) => api.get('/projects', { params }),
  getBySapKey: (sapWorkKey) => api.get(`/projects/detail/${encodeURIComponent(sapWorkKey)}`, { params: { sap_work_key: sapWorkKey } }),
  create: (data) => api.post('/projects', data),
  update: (sapWorkKey, data) => api.put(`/projects/detail/${encodeURIComponent(sapWorkKey)}`, data, { params: { sap_work_key: sapWorkKey } }),
  delete: (sapWorkKey) => api.delete(`/projects/detail/${encodeURIComponent(sapWorkKey)}`, { params: { sap_work_key: sapWorkKey } }),
  getStats: () => api.get('/projects/stats/dashboard'),
  getDepartments: () => api.get('/projects/departments/list')
}
export default projectService

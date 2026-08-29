import api from './api.js'
const rabillService = {
  create: (data) => api.post('/ra-bills', data),
  getByProject: (sapWorkKey) => api.get(`/ra-bills/project`, { params: { sap_work_key: sapWorkKey } }),
  getDetail: (id) => api.get(`/ra-bills/detail/${id}`),
  updateStatus: (id, status) => api.put(`/ra-bills/${id}/status`, { status }),
  delete: (id) => api.delete(`/ra-bills/${id}`),
  export: (id) => api.get(`/ra-bills/${id}/export`, { responseType: 'blob' }),
  exportPdf: (id, params = {}) => api.get(`/ra-bills/${id}/export/pdf`, { params, responseType: 'blob' }),
  getStats: () => api.get('/ra-bills/stats/dashboard')
}
export default rabillService

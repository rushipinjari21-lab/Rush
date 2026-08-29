import api from './api.js'
const measurementService = {
  createMB: (data) => api.post('/measurement-books', data),
  getByProject: (sapWorkKey) => api.get(`/measurement-books/project`, { params: { sap_work_key: sapWorkKey } }),
  getDetail: (id) => api.get(`/measurement-books/detail/${id}`),
  addEntry: (id, data) => api.post(`/measurement-books/${id}/entries`, data),
  updateEntry: (entryId, data) => api.put(`/measurement-books/entries/${entryId}`, data),
  deleteEntry: (entryId) => api.delete(`/measurement-books/entries/${entryId}`),
  deleteMB: (id) => api.delete(`/measurement-books/${id}`),
  export: (id) => api.get(`/measurement-books/${id}/export`, { responseType: 'blob' }),
  exportPdf: (id, params = {}) => api.get(`/measurement-books/${id}/export/pdf`, { params, responseType: 'blob' }),
  exportAbstract: (id) => api.get(`/measurement-books/${id}/export/abstract`, { responseType: 'blob' }),
  exportAbstractPdf: (id) => api.get(`/measurement-books/${id}/export/abstract/pdf`, { responseType: 'blob' }),
  getQuantityVariationData: (id) => api.get(`/measurement-books/${id}/quantity-variation`),
  exportQuantityVariation: (id) => api.get(`/measurement-books/${id}/export/quantity-variation`, { responseType: 'blob' }),
  exportQuantityVariationPdf: (id) => api.get(`/measurement-books/${id}/export/quantity-variation/pdf`, { responseType: 'blob' }),
  exportDocuments: (id) => api.get(`/measurement-books/${id}/export/documents`, { responseType: 'blob' }),
  getStats: () => api.get('/measurement-books/stats/dashboard')
}
export default measurementService

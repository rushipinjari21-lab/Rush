import api from './api.js'
const boqService = {
  upload: (sapWorkKey, file) => {
    const formData = new FormData()
    formData.append('boq_pdf', file)
    formData.append('sap_work_key', sapWorkKey)
    return api.post('/boq/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getByProject: (sapWorkKey, partSection) => api.get(`/boq`, { params: { sap_work_key: sapWorkKey, part_section: partSection } }),
  search: (sapWorkKey, ssrCode) => api.get(`/boq/search`, { params: { sap_work_key: sapWorkKey, ssr_code: ssrCode } }),
  addItem: (sapWorkKey, data) => api.post(`/boq/${encodeURIComponent(sapWorkKey)}/items`, data),
  updateItem: (id, data) => api.put(`/boq/items/${id}`, data),
  deleteItem: (id) => api.delete(`/boq/items/${id}`),
  getStats: (sapWorkKey) => api.get(`/boq/stats`, { params: { sap_work_key: sapWorkKey } })
}
export default boqService

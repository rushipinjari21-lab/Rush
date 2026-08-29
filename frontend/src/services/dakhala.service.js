import api from './api'

export const dakhalaService = {
  getTemplates: () => api.get('/dakhala/templates'),
  getByProject: (sapWorkKey) => api.get(`/dakhala/project`, { params: { sap_work_key: sapWorkKey } }),
  generatePdf: (sapWorkKey, data) => api.post(`/dakhala/generate`, data, { params: { sap_work_key: sapWorkKey }, responseType: 'blob' })
}

export default dakhalaService

import api from './api'

export const documentService = {
  getByProject: (sapWorkKey) => api.get(`/documents/project`, { params: { sap_work_key: sapWorkKey } }),
  downloadDocument: (docId) => api.get(`/documents/download/${docId}`, { responseType: 'blob' })
}

export default documentService

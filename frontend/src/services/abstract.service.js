import api from './api.js'
const abstractService = {
  generate: (mbId) => api.get(`/abstract/${mbId}`),
  export: (mbId) => api.get(`/abstract/${mbId}/export`, { responseType: 'blob' })
}
export default abstractService

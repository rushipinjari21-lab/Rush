import api from './api.js'
const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => api.put('/auth/change-password', data)
}
export default authService

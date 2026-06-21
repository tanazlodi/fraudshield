import axios from 'axios'

const BASE_URL = 'http://localhost:5001/api'

// Create axios instance with base config
const api = axios.create({
  baseURL: BASE_URL,
})

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Automatically handle 401 errors (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ────────────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)

// ── Transactions ────────────────────────────────────────────────
export const getTransactions = (page = 1, limit = 20) =>
  api.get(`/transactions?page=${page}&limit=${limit}`)

export const getTransaction = (id) => api.get(`/transactions/${id}`)

export const getFlaggedTransactions = () =>
  api.get('/transactions/filter/flagged')

// ── Analytics ───────────────────────────────────────────────────
export const getSummary = () => api.get('/analytics/summary')
export const getFraudOverTime = () => api.get('/analytics/fraud-over-time')
export const getByCategory = () => api.get('/analytics/by-category')
export const getScoreDistribution = () => api.get('/analytics/score-distribution')

export default api
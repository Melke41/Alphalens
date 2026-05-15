import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

function handleError(label, error) {
  const message =
    error.response?.data?.detail ||
    error.message ||
    'An unexpected error occurred'
  console.error(`[AlphaLens API] ${label} failed:`, message, error)
  throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
}

export async function checkHealth() {
  try {
    const response = await api.get('/health')
    console.log('[AlphaLens API] checkHealth:', response.data)
    return response.data
  } catch (error) {
    handleError('checkHealth', error)
  }
}

export async function sendResearchQuery(query) {
  try {
    const response = await api.post('/research', { query })
    console.log('[AlphaLens API] sendResearchQuery:', response.data)
    return response.data
  } catch (error) {
    handleError('sendResearchQuery', error)
  }
}

export async function fetchMarketData(symbol, period = '1y') {
  try {
    const response = await api.post('/market-data', { symbol, period })
    console.log('[AlphaLens API] fetchMarketData:', response.data)
    return response.data
  } catch (error) {
    handleError('fetchMarketData', error)
  }
}

export async function runCalculation(type, data) {
  try {
    const response = await api.post('/calculate', { type, data })
    console.log('[AlphaLens API] runCalculation:', response.data)
    return response.data
  } catch (error) {
    handleError('runCalculation', error)
  }
}

export async function fetchMacroData(indicator) {
  try {
    const response = await api.post('/macro', { indicator })
    console.log('[AlphaLens API] fetchMacroData:', response.data)
    return response.data
  } catch (error) {
    handleError('fetchMacroData', error)
  }
}

export async function generateReport(analysis_id) {
  try {
    const response = await api.post('/report', { analysis_id })
    console.log('[AlphaLens API] generateReport:', response.data)
    return response.data
  } catch (error) {
    handleError('generateReport', error)
  }
}

export default api

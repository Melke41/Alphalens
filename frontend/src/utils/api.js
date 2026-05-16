import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const sendResearchQuery = async (query) => {
  const response = await api.post('/research', { query });
  return response.data;
};

export const fetchMarketData = async (symbol, period) => {
  const response = await api.post('/market-data', { symbol, period });
  return response.data;
};

export const runCalculation = async (type, data) => {
  const response = await api.post('/calculate', { type, data });
  return response.data;
};

export const fetchMacroData = async (indicator) => {
  const response = await api.post('/macro', { indicator });
  return response.data;
};

export const generateReport = async (analysis_id) => {
  const response = await api.post('/report', { analysis_id });
  return response.data;
};

export default api;

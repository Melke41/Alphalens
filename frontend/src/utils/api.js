import axios from 'axios';
import {
  isApiCooldown,
  activateApiCooldown,
  ApiCooldownError,
} from './apiCooldown';

const api = axios.create({
  baseURL: 'https://alphalens-backend-23p4.onrender.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (isApiCooldown()) {
    return Promise.reject(new ApiCooldownError());
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!(error instanceof ApiCooldownError)) {
      activateApiCooldown();
    }
    return Promise.reject(error);
  },
);

export async function safeApiCall(fn) {
  if (isApiCooldown()) {
    return null;
  }
  try {
    return await fn();
  } catch (err) {
    if (!(err instanceof ApiCooldownError)) {
      activateApiCooldown();
    }
    return null;
  }
}

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

export const generatePdfReport = async (reportData) => {
  const response = await api.post('/report/generate', reportData);
  return response.data;
};

export const getMarketQuotes = async () => {
  const response = await api.get('/market/quotes');
  return response.data;
};

export const getFearGreed = async () => {
  const response = await api.get('/market/fear-greed');
  return response.data;
};

export const getTopMovers = async () => {
  const response = await api.get('/market/movers');
  return response.data;
};

export const getHeatmap = async () => {
  const response = await api.get('/market/heatmap');
  return response.data;
};

export const getMacroDashboard = async () => {
  const response = await api.get('/macro/dashboard');
  return response.data;
};

export const getMarketNews = async () => {
  const response = await api.get('/news/market');
  return response.data;
};

export default api;

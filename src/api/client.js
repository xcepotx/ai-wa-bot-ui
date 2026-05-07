import axios from 'axios';

const BOT_API = process.env.REACT_APP_BOT_API_URL || '/bot-api/api';

const client = axios.create({
  baseURL: BOT_API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token dari localStorage kalau ada
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('bot_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Handle 401 → redirect ke login
client.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bot_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;

// ── API helpers ───────────────────────────────────────────
export const authApi = {
  register: d => client.post('/auth/register', d),
  login:    d => client.post('/auth/login', d),
  logout:   () => client.post('/auth/logout'),
  me:       () => client.get('/auth/me'),
};

export const shopApi = {
  get:           () => client.get('/shops/me'),
  create:        d  => client.post('/shops', d),
  update:        d  => client.put('/shops/me', d),
  getPayment:    () => client.get('/shops/me/payment'),
  updatePayment: d  => client.put('/shops/me/payment', d),
  getBotProfile: () => client.get('/shops/me/bot-profile'),
  updateBotProfile: d => client.put('/shops/me/bot-profile', d),
  listProducts:  () => client.get('/shops/me/products'),
  createProduct: d  => client.post('/shops/me/products', d),
  updateProduct: (id, d) => client.put(`/shops/me/products/${id}`, d),
  deleteProduct: id => client.delete(`/shops/me/products/${id}`),
};

export const faqApi = {
  list:   () => client.get('/faqs'),
  create: d  => client.post('/faqs', d),
  update: (id, d) => client.put(`/faqs/${id}`, d),
  delete: id => client.delete(`/faqs/${id}`),
};

export const botApi = {
  getSettings:    () => client.get('/bot-settings'),
  updateSettings: d  => client.put('/bot-settings', d),
  getReadiness:   () => client.get('/bot-settings/readiness'),
  simulatePing:   () => client.post('/bot-settings/simulate-ping'),
  simulate:       d  => client.post('/simulate', d),
};

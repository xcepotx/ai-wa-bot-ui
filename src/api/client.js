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
      window.location.href = '/ai-wa-bot/#/login';
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
  updateMenuSettings: d => client.put('/shops/me/menu-settings', d),

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


export const adminApi = {
  shopProviderReadiness: shopId => client.get(`/admin/shops/${shopId}/provider-readiness`),
  systemStatus: () => client.get('/admin/system-status'),
  updateSystemStatus: d => client.put('/admin/system-status', d),
  forceDisableShop: (shopId, reason) => client.post(`/admin/shops/${shopId}/force-disable`, { reason }),
  forceEnableShop: (shopId, reason) => client.post(`/admin/shops/${shopId}/force-enable`, { reason }),
  overview: () => client.get('/admin/overview'),
  shops: params => client.get('/admin/shops', { params }),
  conversations: params => client.get('/admin/conversations', { params }),
  conversationDetail: sessionId => client.get(`/admin/conversations/${sessionId}`),
  markHandoff: (sessionId, note) => client.post(`/admin/conversations/${sessionId}/handoff`, { note }),
  resolve: (sessionId, note) => client.post(`/admin/conversations/${sessionId}/resolve`, { note }),
};



export const webchatLeadApi = {
  list: params => client.get('/webchat-leads', { params }),
  detail: leadId => client.get(`/webchat-leads/${leadId}`),
  markFollowedUp: (leadId, note) => client.post(`/webchat-leads/${leadId}/mark-followed-up`, { note }),
  updateStatus: (leadId, status, note) => client.post(`/webchat-leads/${leadId}/status`, { status, note }),
};

export const spacecraftApi = {
  syncStatus: () => client.get('/spacecraft/sync-status'),
  syncProducts: () => client.post('/spacecraft/sync-products'),
  products: params => client.get('/spacecraft/products', { params }),
  syncHistory: params => client.get('/spacecraft/sync-history', { params }),
  commandCenter: () => client.get('/spacecraft/command-center'),
  getProductIntelligence: productId => client.get(`/spacecraft/products/${productId}/intelligence`),
  updateProductIntelligence: (productId, data) => client.put(`/spacecraft/products/${productId}/intelligence`, data),
};

export const providerApi = {
  readiness: () => client.get('/provider-readiness'),
};

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/password', data)
};

export const eventsAPI = {
  getSports: () => api.get('/events/sports'),
  getTournaments: (sportId) => api.get('/events/tournaments', { params: { sport_id: sportId } }),
  getEvents: (params) => api.get('/events', { params }),
  getEventDetail: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data)
};

export const marketsAPI = {
  getMarkets: (params) => api.get('/markets', { params }),
  createMarket: (data) => api.post('/markets', data),
  updateMarket: (id, data) => api.put(`/markets/${id}`, data),
  updateOdds: (data) => api.put('/markets/odds/update', data)
};

export const betsAPI = {
  placeBet: (data) => api.post('/bets/place', data),
  getMyBets: (params) => api.get('/bets/my', { params }),
  getAllBets: (params) => api.get('/bets/all', { params }),
  settleBet: (data) => api.post('/bets/settle', data),
  settleMarket: (data) => api.post('/bets/settle-market', data)
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  adjustBalance: (id, data) => api.post(`/admin/users/${id}/balance`, data),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  getActivityLog: (params) => api.get('/admin/activity-log', { params })
};

export const casinoAPI = {
  getGames: (params) => api.get('/casino/games', { params }),
  placeBet: (data) => api.post('/casino/bet', data),
  getHistory: (params) => api.get('/casino/history', { params })
};

export default api;

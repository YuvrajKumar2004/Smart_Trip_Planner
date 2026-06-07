import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (data) => api.post('/auth/refresh', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const destinationService = {
  getAll: () => api.get('/destinations'),
  getOne: (id) => api.get(`/destinations/${id}`),
  search: (params) => api.get('/destinations/search', { params }),
  create: (data) => api.post('/destinations', data),
  update: (id, data) => api.put(`/destinations/${id}`, data),
  delete: (id) => api.delete(`/destinations/${id}`),
};

export const predefinedTripService = {
  getAll: (params) => api.get('/predefined-trips', { params }),
  getOne: (id) => api.get(`/predefined-trips/${id}`),
  search: (params) => api.get('/predefined-trips/search', { params }),
  create: (data) => api.post('/predefined-trips', data),
  update: (id, data) => api.put(`/predefined-trips/${id}`, data),
  delete: (id) => api.delete(`/predefined-trips/${id}`),
};

export const userTripService = {
  create: (data) => api.post('/trips', data),
  getAll: (params) => api.get('/trips', { params }),
  getOne: (id) => api.get(`/trips/${id}`),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
  updateStatus: (id, data) => api.patch(`/trips/${id}/status`, data),
  addMember: (id, data) => api.post(`/trips/${id}/members`, data),
  removeMember: (id, memberId) => api.delete(`/trips/${id}/members/${memberId}`),
};

export const recommendationService = {
  recommend: (data) => api.post('/trips/recommend', data),
  optimizeBudget: (data) => api.post('/trips/budget/optimize', data),
  estimateCost: (data) => api.post('/trips/budget/estimate', data),
};

export const expenseService = {
  add: (tripId, data) => api.post(`/expenses/trip/${tripId}`, data),
  getByTrip: (tripId) => api.get(`/expenses/trip/${tripId}`),
  delete: (expenseId) => api.delete(`/expenses/${expenseId}`),
  getBalance: (tripId) => api.get(`/expenses/trip/${tripId}/balance`),
};

export const settlementService = {
  pay: (data) => api.post('/settlements/pay', data),
  getPending: () => api.get('/settlements/pending'),
  getTripSettlements: (tripId) => api.get(`/settlements/trip/${tripId}`),
};

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getHistory: (params) => api.get('/bookings/history', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id, data) => api.delete(`/bookings/${id}/cancel`, { data }),
};

export const paymentService = {
  verify: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
};

export const analyticsService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllUsers: () => api.get('/admin/users'),
  getUserHistory: (userId) => api.get(`/admin/users/${userId}/history`),
  getTripAnalytics: (tripId) => api.get(`/admin/trips/${tripId}/analytics`),
  createAdmin: (data) => api.post('/admin/create-admin', data),
  getAllBookings: () => api.get('/admin/bookings'),
};

export const packageService = {
  add: (data) => api.post('/packages/add', data),
  getAll: () => api.get('/packages'),
  delete: (id) => api.delete(`/packages/${id}`),
};

export const historyService = {
  getSummary: () => api.get('/history/summary'),
  getBookings: (params) => api.get('/history/bookings', { params }),
  getPayments: () => api.get('/history/payments'),
  getSettlements: () => api.get('/history/settlements'),
};

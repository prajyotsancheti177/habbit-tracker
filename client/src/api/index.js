import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add debug mock time to requests
api.interceptors.request.use((config) => {
  const mockTime = window.__DEBUG_MOCK_TIME__;
  if (mockTime) {
    config.headers['X-Debug-Mock-Time'] = mockTime;
  }
  return config;
});

// Habits API
export const habitsApi = {
  getAll: (params) => api.get('/habits', { params }),
  getById: (id) => api.get(`/habits/${id}`),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  complete: (id, data) => api.post(`/habits/${id}/complete`, data),
  uncomplete: (id) => api.post(`/habits/${id}/uncomplete`),
  toggleSubtask: (id, subtaskId) => api.patch(`/habits/${id}/subtasks/${subtaskId}`),
  updateValue: (id, value, increment, logFieldValues) => api.patch(`/habits/${id}/value`, { value, increment, logFieldValues }),
  reorder: (habits) => api.post('/habits/reorder', { habits })
};

// Tasks API
export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  complete: (id, data) => api.post(`/tasks/${id}/complete`, data),
  toggleSubtask: (id, subtaskId) => api.patch(`/tasks/${id}/subtasks/${subtaskId}`),
  updateValue: (id, value, increment) => api.patch(`/tasks/${id}/value`, { value, increment }),
  reorder: (tasks) => api.post('/tasks/reorder', { tasks })
};

// Tags API
export const tagsApi = {
  getAll: () => api.get('/tags'),
  getById: (id) => api.get(`/tags/${id}`),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`)
};

// Analytics API
export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
  getHabits: (period) => api.get('/analytics/habits', { params: { period } }),
  getTasks: (period) => api.get('/analytics/tasks', { params: { period } }),
  getCoins: (period) => api.get('/analytics/coins', { params: { period } }),
  getHeatmap: (year) => api.get('/analytics/heatmap', { params: { year } }),
  getFeelings: (period) => api.get('/analytics/feelings', { params: { period } })
};

// Rewards API
export const rewardsApi = {
  getBalance: () => api.get('/rewards/balance'),
  getHistory: (params) => api.get('/rewards/history', { params }),
  getProfile: () => api.get('/rewards/profile'),
  updateSettings: (data) => api.put('/rewards/settings', data),
  // Marketplace
  getItems: () => api.get('/rewards/items'),
  createItem: (data) => api.post('/rewards/items', data),
  deleteItem: (id) => api.delete(`/rewards/items/${id}`),
  redeemItem: (id) => api.post(`/rewards/items/${id}/redeem`)
};

// Upload API
export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (filename) => api.delete(`/upload/${filename}`)
};

// Custom Charts API
export const chartsApi = {
  getAll: () => api.get('/charts'),
  create: (data) => api.post('/charts', data),
  update: (id, data) => api.put(`/charts/${id}`, data),
  delete: (id) => api.delete(`/charts/${id}`),
  getData: (id) => api.get(`/charts/${id}/data`),
  reorder: (charts) => api.post('/charts/reorder', { charts })
};

// History API
export const historyApi = {
  getAll: (params) => api.get('/history', { params }),
  getByDate: (date) => api.get(`/history/date/${date}`)
};

export default api;

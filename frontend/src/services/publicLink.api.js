import api from './api.js';

export const publicLinkApi = {
  create: (payload) => api.post('/public-links', payload).then((r) => r.data),
  getByToken: (token, password) =>
    api
      .get(`/public-links/${token}`, {
        headers: password ? { 'X-Public-Link-Password': password } : {},
      })
      .then((r) => r.data),
  update: (id, payload) => api.patch(`/public-links/manage/${id}`, payload).then((r) => r.data),
  email: (id, email) => api.post(`/public-links/manage/${id}/email`, { email }).then((r) => r.data),
  remove: (id) => api.delete(`/public-links/manage/${id}`).then((r) => r.data),
};

export const searchApi = {
  search: (params) => api.get('/search', { params }).then((r) => r?.data || r),
};

export const starApi = {
  list: () => api.get('/stars').then((r) => r.data),
  star: (payload) => api.post('/stars', payload).then((r) => r.data),
  unstar: (payload) => api.delete('/stars', { data: payload }).then((r) => r.data),
};

export const trashApi = {
  list: () => api.get('/trash').then((r) => r.data),
  restore: (id, type) => api.post(`/trash/${id}/restore`, { type }).then((r) => r.data),
  permanentDelete: (id, type) =>
    api.delete(`/trash/${id}/permanent`, { data: { type } }).then((r) => r.data),
};

export const activityApi = {
  dashboard: () => api.get('/activities/dashboard').then((r) => r?.data || r),
  list: (params) => api.get('/activities', { params }).then((r) => r?.data || r),
};

export const userApi = {
  storage: () => api.get('/users/me/storage').then((r) => r.data),
  updateProfile: (payload) => api.patch('/users/me', payload).then((r) => r.data),
};

export default { publicLinkApi, searchApi, starApi, trashApi, activityApi, userApi };

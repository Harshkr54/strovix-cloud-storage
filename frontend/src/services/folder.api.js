import api from './api.js';

export const folderApi = {
  create: (payload) => api.post('/folders', payload).then((r) => r.data),
  get: (id) => api.get(`/folders/${id}`).then((r) => r.data),
  contents: (id = 'root') => api.get(`/folders/${id}/contents`).then((r) => r.data),
  rename: (id, name) => api.patch(`/folders/${id}`, { name }).then((r) => r.data),
  move: (id, destinationFolderId) =>
    api.post(`/folders/${id}/move`, { destinationFolderId }).then((r) => r.data),
  remove: (id) => api.delete(`/folders/${id}`).then((r) => r.data),
  restore: (id) => api.post(`/folders/${id}/restore`).then((r) => r.data),
  permanentDelete: (id) => api.delete(`/folders/${id}/permanent`).then((r) => r.data),
};

export default folderApi;

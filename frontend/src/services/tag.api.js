import api from './api.js';

export const tagApi = {
  list: () => api.get('/tags').then((r) => r?.data || r),
  create: (payload) => api.post('/tags', payload).then((r) => r?.data || r),
  update: (id, payload) => api.patch(`/tags/${id}`, payload).then((r) => r?.data || r),
  remove: (id) => api.delete(`/tags/${id}`).then((r) => r?.data || r),
  assignToFile: (tagId, fileId) => api.post(`/tags/${tagId}/files/${fileId}`).then((r) => r?.data || r),
  removeFromFile: (tagId, fileId) => api.delete(`/tags/${tagId}/files/${fileId}`).then((r) => r?.data || r),
  assignToFolder: (tagId, folderId) => api.post(`/tags/${tagId}/folders/${folderId}`).then((r) => r?.data || r),
  removeFromFolder: (tagId, folderId) => api.delete(`/tags/${tagId}/folders/${folderId}`).then((r) => r?.data || r),
  getResources: (tagId) => api.get(`/tags/${tagId}/resources`).then((r) => r?.data || r),
};

export default tagApi;

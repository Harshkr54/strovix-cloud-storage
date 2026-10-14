import api from './api.js';

export const fileApi = {
  list: (params) => api.get('/files', { params }).then((r) => r.data),
  getMeta: (id) => api.get(`/files/${id}/meta`).then((r) => r.data),
  getDownload: (id) => api.get(`/files/${id}`).then((r) => r.data),
  getPreviewDownload: (id) => api.get(`/files/${id}`, { params: { preview: 1 } }).then((r) => r.data),
  initUpload: (payload) => api.post('/files/init-upload', payload).then((r) => r.data),
  completeUpload: (fileId) => api.post('/files/complete-upload', { fileId }).then((r) => r.data),
  localUpload: (fileId, file, onProgress, signal) => {
    const form = new FormData();
    form.append('file', file);
    form.append('fileId', fileId);
    return api
      .post('/files/local-upload', form, {
        signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      })
      .then((r) => r.data);
  },
  rename: (id, name) => api.patch(`/files/${id}`, { name }).then((r) => r.data),
  move: (id, destinationFolderId) =>
    api.post(`/files/${id}/move`, { destinationFolderId }).then((r) => r.data),
  remove: (id) => api.delete(`/files/${id}`).then((r) => r.data),
  restore: (id) => api.post(`/files/${id}/restore`).then((r) => r.data),
  permanentDelete: (id) => api.delete(`/files/${id}/permanent`).then((r) => r.data),
  getRevisions: (id) => api.get(`/files/${id}/revisions`).then((r) => r?.data || r),
  downloadRevision: (fileId, revisionId) => api.get(`/files/${fileId}/revisions/${revisionId}/download`).then((r) => r?.data || r),
  restoreRevision: (fileId, revisionId) => api.post(`/files/${fileId}/revisions/${revisionId}/restore`).then((r) => r?.data || r),
};

export default fileApi;

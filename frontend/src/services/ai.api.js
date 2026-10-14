import api from './api.js';

export const aiApi = {
  summarize: (fileId) => api.post(`/ai/files/${fileId}/summarize`).then((r) => r.data),
  shortSummary: (fileId) => api.post(`/ai/files/${fileId}/short-summary`).then((r) => r.data),
  keyPoints: (fileId) => api.post(`/ai/files/${fileId}/key-points`).then((r) => r.data),
  extractInformation: (fileId) => api.post(`/ai/files/${fileId}/extract`).then((r) => r.data),
  ask: (fileId, question) => api.post(`/ai/files/${fileId}/ask`, { question }).then((r) => r.data),
  getConversation: (fileId) => api.get(`/ai/files/${fileId}/conversation`).then((r) => r.data),
  clearConversation: (fileId) => api.delete(`/ai/files/${fileId}/conversation`).then((r) => r.data),
};

export default aiApi;

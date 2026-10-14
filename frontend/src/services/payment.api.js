import api from './api.js';

export const paymentApi = {
  getPlans: () => api.get('/subscriptions/plans').then((r) => r?.data || r),
  createOrder: (planId) => api.post('/payments/create-order', { planId }).then((r) => r?.data || r),
  verifyPayment: (payload) => api.post('/payments/verify', payload).then((r) => r?.data || r),
};

export default paymentApi;

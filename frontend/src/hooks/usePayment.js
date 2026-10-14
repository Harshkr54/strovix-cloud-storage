import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../services/payment.api.js';

export function usePlans() {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => paymentApi.getPlans(),
  });
}

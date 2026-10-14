import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { tagApi } from '../services/tag.api.js';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => tagApi.list(),
    staleTime: 60000,
    gcTime: 300000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => tagApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create tag');
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId) => tagApi.remove(tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['tagResources'] });
      toast.success('Tag deleted');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete tag');
    },
  });
}

export function useTagResources(tagId) {
  return useQuery({
    queryKey: ['tagResources', tagId],
    queryFn: () => tagApi.getResources(tagId),
    enabled: Boolean(tagId),
  });
}

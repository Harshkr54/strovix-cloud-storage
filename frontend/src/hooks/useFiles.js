import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileApi } from '../services/file.api.js';
import toast from 'react-hot-toast';
import { resolveApiUrl } from '../utils/apiUrl.js';

export function useFiles(params) {
  return useQuery({
    queryKey: ['files', params],
    queryFn: () => fileApi.list(params).then((r) => r.data),
  });
}

export function useRenameFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }) => fileApi.rename(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder-contents'] });
      toast.success('File renamed');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fileApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder-contents'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Moved to trash');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async (id) => {
      const res = await fileApi.getDownload(id);
      const url = res.downloadUrl;
      if (url.startsWith('/')) {
        const token = localStorage.getItem('accessToken');
        const full = resolveApiUrl(url);
        const response = await fetch(full, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = res.data.file?.name || 'download';
        a.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        window.open(url, '_blank');
      }
      return res.data;
    },
    onError: (err) => toast.error(err.message),
  });
}

export default { useFiles, useRenameFile, useDeleteFile, useDownloadFile };

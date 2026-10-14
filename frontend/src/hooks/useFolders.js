import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { folderApi } from '../services/folder.api.js';
import toast from 'react-hot-toast';

export function useFolderContents(folderId = 'root') {
  return useQuery({
    queryKey: ['folder-contents', folderId || 'root'],
    queryFn: () => folderApi.contents(folderId || 'root'),
    staleTime: 10000,
    gcTime: 300000,
  });
}

export function useCreateFolder(folderId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name) =>
      folderApi.create({ name, parentFolderId: folderId && folderId !== 'root' ? folderId : null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder-contents'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Folder created');
    },
    onError: async (err) => {
      await qc.invalidateQueries({ queryKey: ['folder-contents'] });
      toast.error(err.message);
    },
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }) => folderApi.rename(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder-contents'] });
      toast.success('Folder renamed');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => folderApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder-contents'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
      toast.success('Moved to trash');
    },
    onError: (err) => toast.error(err.message),
  });
}

export default { useFolderContents, useCreateFolder, useRenameFolder, useDeleteFolder };

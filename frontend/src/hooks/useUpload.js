import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fileApi } from '../services/file.api.js';
import toast from 'react-hot-toast';

export function useUpload(folderId) {
  const [uploads, setUploads] = useState([]);
  const controllers = useRef(new Map());
  const qc = useQueryClient();

  const updateUpload = (id, patch) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const uploadFiles = useCallback(
    async (files) => {
      const list = Array.from(files);
      for (const file of list) {
        const id = `${file.name}-${Date.now()}-${Math.random()}`;
        const controller = new AbortController();
        controllers.current.set(id, controller);

        setUploads((prev) => [
          ...prev,
          { id, name: file.name, progress: 0, status: 'uploading', error: null },
        ]);

        try {
          const init = await fileApi.initUpload({
            name: file.name,
            originalName: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            folderId: folderId && folderId !== 'root' ? folderId : null,
          });

          const payload = init;

          if (payload.provider === 'local') {
            await fileApi.localUpload(
              payload.fileId,
              file,
              (progress) => updateUpload(id, { progress }),
              controller.signal
            );
          } else {
            await fetch(payload.uploadUrl, {
              method: payload.method || 'PUT',
              headers: payload.headers || { 'Content-Type': file.type },
              body: file,
              signal: controller.signal,
            }).then(async (res) => {
              if (!res.ok) throw new Error('S3 upload failed');
            });
            updateUpload(id, { progress: 90 });
            await fileApi.completeUpload(payload.fileId);
          }

          updateUpload(id, { progress: 100, status: 'success' });
        } catch (error) {
          if (error.name === 'CanceledError' || error.name === 'AbortError') {
            updateUpload(id, { status: 'cancelled', error: 'Cancelled' });
          } else {
            updateUpload(id, { status: 'error', error: error.message });
            toast.error(error.message || `Failed to upload ${file.name}`);
          }
        } finally {
          controllers.current.delete(id);
        }
      }

      qc.invalidateQueries({ queryKey: ['folder-contents'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['storage'] });
    },
    [folderId, qc]
  );

  const cancelUpload = (id) => {
    controllers.current.get(id)?.abort();
  };

  const clearFinished = () => {
    setUploads((prev) => prev.filter((u) => u.status === 'uploading'));
  };

  return { uploads, uploadFiles, cancelUpload, clearFinished };
}

export default useUpload;

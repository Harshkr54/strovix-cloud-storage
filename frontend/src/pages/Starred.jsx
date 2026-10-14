import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { starApi } from '../services/publicLink.api.js';
import { EmptyState, LoadingSpinner } from '../components/common/ui.jsx';
import { getFileIcon } from '../utils/fileIcons.js';
import { formatDate } from '../utils/formatDate.js';
import { StarOff } from 'lucide-react';

export default function Starred() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['starred'],
    queryFn: () => starApi.list(),
  });

  const unstar = useMutation({
    mutationFn: (payload) => starApi.unstar(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['starred'] });
      qc.invalidateQueries({ queryKey: ['folder-contents'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Removed from starred');
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSpinner label="Loading starred..." />;
  const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 dark:text-slate-100">Starred</h1>
      {items.length === 0 ? (
        <EmptyState title="No starred files" description="Star files and folders to find them quickly." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((star, idx) => {
            const item = star.file || star.folder;
            const isFolder = Boolean(star.folder);
            const Icon = getFileIcon(item?.mimeType, isFolder);
            return (
              <div key={star.id || star._id || idx} className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Icon size={22} className={isFolder ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400'} />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      unstar.mutate(isFolder ? { folderId: item?.id || item?._id } : { fileId: item?.id || item?._id })
                    }
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800 cursor-pointer"
                    title="Remove from Starred"
                  >
                    <StarOff size={16} />
                  </button>
                </div>
                <div>
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{item?.name}</p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                    {isFolder ? 'Folder' : 'File'} · {formatDate(star.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

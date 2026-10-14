import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { trashApi } from '../services/publicLink.api.js';
import { ConfirmModal, EmptyState, LoadingSpinner } from '../components/common/ui.jsx';
import { formatDate } from '../utils/formatDate.js';

export default function Trash() {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: () => trashApi.list(),
  });

  const restore = useMutation({
    mutationFn: ({ id, type }) => trashApi.restore(id, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] });
      qc.invalidateQueries({ queryKey: ['folder-contents'] });
      toast.success('Restored');
    },
    onError: (err) => toast.error(err.message),
  });

  const permanent = useMutation({
    mutationFn: ({ id, type }) => trashApi.permanentDelete(id, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] });
      qc.invalidateQueries({ queryKey: ['storage'] });
      toast.success('Permanently deleted');
      setConfirm(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSpinner label="Loading trash..." />;
  const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 dark:text-slate-100">Trash</h1>
      {items.length === 0 ? (
        <EmptyState title="Trash is empty" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Deleted Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => {
                const itemId = item.id || item._id || idx;
                return (
                  <tr key={`${item.type}-${itemId}`} className="transition hover:bg-blue-50/50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                  <td className="px-4 py-3 capitalize text-slate-500 dark:text-slate-400">{item.type}</td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{formatDate(item.deletedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => restore.mutate({ id: item.id, type: item.type })}
                        className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 transition dark:bg-blue-950/60 dark:text-blue-400 cursor-pointer"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirm(item)}
                        className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 transition dark:bg-red-950/60 dark:text-red-400 cursor-pointer"
                      >
                        Delete forever
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete forever?"
        message={`"${confirm?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete forever"
        danger
        onConfirm={() => permanent.mutate({ id: confirm.id, type: confirm.type })}
      />
    </div>
  );
}

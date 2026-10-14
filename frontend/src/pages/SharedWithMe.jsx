import { useQuery } from '@tanstack/react-query';
import { shareApi } from '../services/share.api.js';
import { EmptyState, LoadingSpinner } from '../components/common/ui.jsx';
import { formatDate } from '../utils/formatDate.js';
import { getFileIcon } from '../utils/fileIcons.js';

export default function SharedWithMe() {
  const { data, isLoading } = useQuery({
    queryKey: ['shared-with-me'],
    queryFn: () => shareApi.sharedWithMe(),
  });

  if (isLoading) return <LoadingSpinner label="Loading shared items..." />;

  const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.shares) ? data.shares : []));

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 dark:text-slate-100">Shared with me</h1>
      {items.length === 0 ? (
        <EmptyState title="Nothing shared yet" description="Files and folders shared with you will appear here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Shared Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((share, idx) => {
                const item = share.file || share.folder;
                const isFolder = Boolean(share.folder);
                const Icon = getFileIcon(item?.mimeType, isFolder);
                return (
                  <tr key={share.id || share._id || idx} className="transition hover:bg-blue-50/50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Icon size={18} className={isFolder ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400'} />
                        <span>{item?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{share.owner?.name || share.owner?.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        {share.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{formatDate(share.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

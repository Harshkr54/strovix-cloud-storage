import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch.js';
import { EmptyState, LoadingSpinner } from '../components/common/ui.jsx';
import { formatDate } from '../utils/formatDate.js';
import { getFileIcon } from '../utils/fileIcons.js';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState(params.get('type') || 'all');
  const q = params.get('q') || '';
  const navigate = useNavigate();

  const queryParams = useMemo(() => ({ q, type: type === 'all' ? undefined : type, page: 1, limit: 40 }), [q, type]);
  const { data, isLoading, isFetching } = useSearch(queryParams, Boolean(q));

  const items = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.files)) return [...data.files, ...(data.folders || [])];
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 dark:text-slate-100">Search</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{q ? `Results for "${q}"` : 'Search files and folders...'}</p>
        </div>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            const next = new URLSearchParams(params);
            if (e.target.value === 'all') next.delete('type');
            else next.set('type', e.target.value);
            setParams(next);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All items</option>
          <option value="file">Files only</option>
          <option value="folder">Folders only</option>
        </select>
      </div>

      {!q && <EmptyState title="Start searching" description="Use the top search bar to find files and folders." />}
      {q && (isLoading || isFetching) && <LoadingSpinner label="Searching..." />}
      {q && !isLoading && items.length === 0 && (
        <EmptyState title="No matches found" description={`No files or folders matched "${q}".`} />
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const isFolder = item.resourceType === 'folder';
          const Icon = getFileIcon(item.mimeType, isFolder);
          const itemId = item._id || item.id;
          return (
            <div
              key={`${item.resourceType}-${itemId}`}
              onClick={() => {
                if (isFolder) {
                  navigate(`/drive?folder=${itemId}`);
                } else {
                  navigate('/drive');
                }
              }}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 cursor-pointer"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Icon size={20} className={isFolder ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400'} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  {isFolder ? 'Folder' : item.mimeType || 'File'} · {formatDate(item.updatedAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

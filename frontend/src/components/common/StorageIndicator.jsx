import { formatFileSize } from '../../utils/formatFileSize.js';

export function StorageIndicator({ used = 0, quota = 1 }) {
  const percent = Math.min(100, quota ? (used / quota) * 100 : 0);

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">Storage</span>
        <span className="text-ink-muted">
          {formatFileSize(used)} / {formatFileSize(quota)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default StorageIndicator;

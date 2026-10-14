import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Folder, HardDrive, AlertTriangle, X, LogOut } from 'lucide-react';

export function LoadingSpinner({ label = 'Loading drive contents...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#6b7280] dark:text-[#9ca3af]">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#3157d5] dark:border-[#253044] dark:border-t-[#5b7cff]" />
      </div>
      <p className="animate-pulse text-xs font-semibold text-[#111827] dark:text-[#f9fafb]">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description, action, icon: Icon = Folder }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-[#e5e7eb] bg-white px-6 py-14 text-center shadow-xs dark:border-[#253044] dark:bg-[#111827]">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7f8fa] text-[#3157d5] dark:bg-[#0b0f17] dark:text-[#5b7cff]">
        <Icon size={22} />
      </div>
      <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-[#111827] dark:text-[#f9fafb]">
        {title}
      </h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#6b7280] dark:text-[#9ca3af]">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden"
    >
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-up"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-xl animate-scale-up dark:border-[#253044] dark:bg-[#111827] ${
          wide ? 'sm:w-full sm:max-w-[640px]' : 'sm:w-full sm:max-w-md'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-5 py-3.5 dark:border-[#253044] dark:bg-[#111827]">
          <h2 id="modal-title" className="truncate pr-3 font-[family-name:var(--font-display)] text-base font-bold text-[#111827] dark:text-[#f9fafb]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#9ca3af] transition hover:bg-[#f7f8fa] hover:text-[#111827] dark:hover:bg-[#151c29] dark:hover:text-[#f9fafb] cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  icon: Icon = AlertTriangle,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              danger
                ? 'bg-red-50 text-[#dc2626] dark:bg-red-950/60 dark:text-red-400'
                : 'bg-[#eef3ff] text-[#3157d5] dark:bg-[#1e293b] dark:text-[#5b7cff]'
            }`}
          >
            <Icon size={18} />
          </div>
          <p className="text-xs leading-relaxed text-[#6b7280] dark:text-[#9ca3af]">{message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-[#e5e7eb] pt-4 dark:border-[#253044]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-xs font-semibold text-[#6b7280] transition hover:bg-[#f9fafb] hover:text-[#111827] dark:border-[#253044] dark:bg-[#111827] dark:text-[#9ca3af] dark:hover:bg-[#151c29] dark:hover:text-[#f9fafb] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition cursor-pointer ${
              danger
                ? 'bg-[#dc2626] hover:bg-red-700'
                : 'bg-[#3157d5] hover:bg-[#2649bd]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function StorageIndicator({ used = 0, quota = 1 }) {
  const pct = Math.min(100, Math.max(0, quota ? (used / quota) * 100 : 0));
  const format = (n) => {
    if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
    if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
    return `${Math.round(n / 1024)} KB`;
  };

  const isHigh = pct > 85;

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] p-3 space-y-2 dark:border-[#253044] dark:bg-[#0b0f17]">
      <div className="flex items-center justify-between text-xs font-semibold text-[#111827] dark:text-[#f9fafb]">
        <div className="flex items-center gap-1.5">
          <HardDrive size={13} className="text-[#3157d5] dark:text-[#5b7cff]" />
          <span>Storage</span>
        </div>
        <span className="text-[10px] text-[#6b7280] dark:text-[#9ca3af]">
          {format(used)} / {format(quota)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e5e7eb] dark:bg-[#253044]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isHigh ? 'bg-[#dc2626]' : 'bg-[#3157d5] dark:bg-[#5b7cff]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: count - 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-white border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default { LoadingSpinner, EmptyState, Modal, ConfirmModal, StorageIndicator, SkeletonGrid };

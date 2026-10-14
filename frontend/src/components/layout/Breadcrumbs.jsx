import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items = [], onNavigate }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-[var(--color-ink-muted)]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.id}-${item.name}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={14} />}
            <button
              type="button"
              disabled={isLast}
              onClick={() => onNavigate?.(item.id)}
              className={`rounded px-1 py-0.5 ${
                isLast ? 'font-medium text-[var(--color-ink)]' : 'hover:bg-white hover:text-teal-700 dark:hover:bg-slate-800 dark:hover:text-teal-400'
              }`}
            >
              {item.name}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;

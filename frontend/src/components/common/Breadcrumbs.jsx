import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items = [], onNavigate }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={`${item.id}-${item.name}`} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-4 w-4" /> : null}
            <button
              type="button"
              disabled={isLast}
              onClick={() => onNavigate?.(item.id)}
              className={`rounded-lg px-1.5 py-0.5 ${isLast ? 'font-medium text-ink' : 'hover:bg-surface hover:text-ink'}`}
            >
              {item.name}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.js';

export function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex h-9 w-[4.5rem] shrink-0 items-center rounded-full border p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
        isDark
          ? 'border-slate-600 bg-slate-900 shadow-inner'
          : 'border-slate-200 bg-white shadow-sm'
      } ${className}`}
    >
      <Sun
        size={13}
        className={`absolute left-2 transition-opacity duration-300 ${
          isDark ? 'text-slate-500 opacity-60' : 'text-amber-500 opacity-0'
        }`}
        aria-hidden
      />
      <Moon
        size={13}
        className={`absolute right-2 transition-opacity duration-300 ${
          isDark ? 'text-slate-300 opacity-0' : 'text-slate-400 opacity-70'
        }`}
        aria-hidden
      />
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-all duration-300 ${
          isDark
            ? 'translate-x-[calc(100%+0.125rem)] bg-slate-700 text-slate-100'
            : 'translate-x-0 bg-slate-100 text-amber-500'
        }`}
      >
        {isDark ? <Moon size={14} strokeWidth={2.25} /> : <Sun size={14} strokeWidth={2.25} />}
      </span>
    </button>
  );
}

export default ThemeToggle;

import * as React from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, className = "" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-up">
      <div 
        className={`glass-card w-full max-w-md scale-100 rounded-xl bg-[var(--color-panel)] p-6 shadow-2xl animate-scale-up ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

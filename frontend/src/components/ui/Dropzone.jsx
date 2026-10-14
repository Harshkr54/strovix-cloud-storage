import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

export function Dropzone({ onDrop, className = "" }) {
  const onDropCallback = useCallback((acceptedFiles) => {
    if (onDrop) onDrop(acceptedFiles);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    noClick: true,
    noKeyboard: true
  });

  return (
    <div 
      {...getRootProps()} 
      className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-colors
        ${isDragActive ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-line)] bg-transparent'}
        ${className}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none text-[var(--color-ink-muted)]">
        <UploadCloud className={`h-10 w-10 ${isDragActive ? 'text-[var(--color-accent)]' : ''}`} />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop the files here..." : "Drag & drop files here"}
        </p>
      </div>
    </div>
  );
}

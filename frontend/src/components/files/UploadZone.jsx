import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function UploadZone({ onDrop, disabled, compact = false }) {
  const [isWindowDragging, setIsWindowDragging] = useState(false);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    disabled,
    noClick: false,
  });

  // Global window drag detection
  useEffect(() => {
    let dragCounter = 0;
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsWindowDragging(true);
      }
    };
    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsWindowDragging(false);
      }
    };
    const handleDrop = () => {
      dragCounter = 0;
      setIsWindowDragging(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <>
      {/* Full screen Drag Overlay */}
      {isWindowDragging && (
        <div
          {...getRootProps()}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all animate-fade-up"
        >
          <input {...getInputProps()} />
          <div className="relative flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-blue-400 bg-slate-900/80 p-12 text-center text-white shadow-2xl pulse-glow max-w-lg mx-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 text-white shadow-lg shadow-blue-500/30">
              <UploadCloud size={44} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Drop files to upload</h3>
              <p className="mt-1 text-sm text-blue-200">Release your files here to start uploading automatically</p>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Drop Zone Banner */}
      <div
        {...getRootProps()}
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/30 shadow-md dark:bg-blue-950/40'
            : 'border-slate-200/80 bg-white/70 hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-800/70 dark:hover:border-blue-600 dark:hover:bg-blue-950/20'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105 group-hover:bg-blue-100/70 dark:bg-blue-950/50 dark:text-blue-400 dark:group-hover:bg-blue-900/50">
              <FileUp size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Drag files here or <span className="text-blue-600 underline underline-offset-2 dark:text-blue-400">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Supports documents, images, audio, video and archives</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
          >
            <UploadCloud size={16} />
            Upload File
          </button>
        </div>
      </div>
    </>
  );
}

export function UploadProgress({ uploads, onCancel, onClear }) {
  if (!uploads?.length) return null;

  const total = uploads.length;
  const active = uploads.filter((u) => u.status === 'uploading').length;
  const hasError = uploads.some((u) => u.status === 'error');

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(calc(100vw-2.5rem),24rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl ring-1 ring-slate-900/5 animate-fade-up dark:border-slate-700 dark:bg-slate-900/95 dark:ring-slate-700/50">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/80">
        <div className="flex items-center gap-2">
          {active > 0 ? (
            <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
          ) : hasError ? (
            <AlertCircle size={16} className="text-red-500" />
          ) : (
            <CheckCircle size={16} className="text-emerald-500" />
          )}
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {active > 0 ? `Uploading (${active}/${total})` : hasError ? 'Upload Failed' : 'Uploads Complete'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
        >
          Clear all
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto p-3 space-y-2.5">
        {uploads.map((u) => (
          <div key={u.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{u.name}</p>
              {u.status === 'uploading' ? (
                <button
                  type="button"
                  onClick={() => onCancel(u.id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-600 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              ) : u.status === 'error' ? (
                <AlertCircle size={14} className="text-red-500 shrink-0" />
              ) : (
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  u.status === 'error'
                    ? 'bg-red-500'
                    : u.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${u.progress}%` }}
              />
            </div>
            {u.error && <p className="mt-1 text-[11px] font-medium text-red-600">{u.error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default { UploadZone, UploadProgress };

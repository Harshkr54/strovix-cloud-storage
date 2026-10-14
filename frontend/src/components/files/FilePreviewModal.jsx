import { useState } from 'react';
import { Sparkles, Download } from 'lucide-react';
import { Modal } from '../common/ui.jsx';
import { canPreview } from '../../utils/fileIcons.js';
import { isPdfFile, isImageFile } from '../../utils/filePreview.js';
import { AIFileAssistantDrawer } from '../ai/AIFileAssistantDrawer.jsx';

export function FilePreviewModal({ open, onClose, file, previewUrl, onDownload }) {
  const [aiOpen, setAiOpen] = useState(false);

  if (!file) return null;
  const previewable = canPreview(file.mimeType) || isPdfFile(file.mimeType, file.name);
  const isPdf = isPdfFile(file.mimeType, file.name);
  const isImage = isImageFile(file.mimeType);

  return (
    <>
      <Modal open={open} onClose={onClose} title={file.name} wide>
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-700 transition cursor-pointer"
            >
              <Sparkles size={14} />
              <span>AI Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => onDownload?.(file)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>

          {!previewable || !previewUrl ? (
            <div className="rounded-xl bg-slate-50 px-4 py-12 text-center dark:bg-slate-800/60">
              <p className="font-medium text-slate-800 dark:text-slate-100">Preview unavailable</p>
              <button
                type="button"
                onClick={() => onDownload?.(file)}
                className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-xs"
              >
                Download
              </button>
            </div>
          ) : isImage ? (
            <img src={previewUrl} alt={file.name} className="mx-auto max-h-[65vh] rounded-xl object-contain" />
          ) : isPdf ? (
            <embed
              src={`${previewUrl}#toolbar=1&navpanes=0`}
              type="application/pdf"
              title={file.name}
              className="h-[65vh] w-full rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            />
          ) : (
            <iframe
              title={file.name}
              src={previewUrl}
              className="h-[50vh] w-full rounded-xl bg-white dark:bg-slate-900"
            />
          )}
        </div>
      </Modal>

      <AIFileAssistantDrawer open={aiOpen} onClose={() => setAiOpen(false)} file={file} />
    </>
  );
}

export default FilePreviewModal;

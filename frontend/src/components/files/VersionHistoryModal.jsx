import { useState, useEffect } from 'react';
import { History, Download, RotateCcw, Loader2, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../common/ui.jsx';
import { fileApi } from '../../services/file.api.js';
import { formatDate } from '../../utils/formatDate.js';
import { formatFileSize } from '../../utils/formatFileSize.js';

export function VersionHistoryModal({ open, onClose, file, onVersionRestored }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const fileId = file?._id || file?.id;

  useEffect(() => {
    if (open && fileId) {
      fetchRevisions();
    } else {
      setRevisions([]);
    }
  }, [open, fileId]);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const res = await fileApi.getRevisions(fileId);
      const list = Array.isArray(res) ? res : res?.data || res?.items || [];
      setRevisions(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRevision = async (revisionId, filename) => {
    setActionId(`download-${revisionId}`);
    try {
      const res = await fileApi.downloadRevision(fileId, revisionId);
      const url = res?.url || res?.data?.url || res?.downloadUrl;
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Download started');
      } else {
        toast.error('Download URL not generated');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to download revision');
    } finally {
      setActionId(null);
    }
  };

  const handleRestoreRevision = async (revisionId) => {
    setActionId(`restore-${revisionId}`);
    try {
      await fileApi.restoreRevision(fileId, revisionId);
      toast.success('Version restored successfully');
      fetchRevisions();
      if (onVersionRestored) onVersionRestored();
    } catch (err) {
      toast.error(err.message || 'Failed to restore version');
    } finally {
      setActionId(null);
    }
  };

  if (!open || !file) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Version History: ${file.name}`} wide>
      <div className="space-y-4">
        {/* Active Version Info Card */}
        <div className="flex items-center justify-between rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 p-4 dark:border-teal-900/60 dark:from-teal-950/40 dark:to-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
              <Check size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Active Version (v{file.versionNumber || 1})
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {file.name} ({formatFileSize(file.size || 0)})
              </p>
            </div>
          </div>
          <span className="rounded-full bg-teal-200/80 px-3 py-1 text-xs font-bold text-teal-900 dark:bg-teal-900/80 dark:text-teal-200">
            Current Active
          </span>
        </div>

        {/* History List */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <History size={14} /> Previous Revisions ({revisions.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-teal-600 dark:text-teal-400" />
            </div>
          ) : revisions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
              <FileText size={24} className="mx-auto mb-2 text-slate-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No previous versions</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                When you re-upload or update this file, earlier versions will be archived here.
              </p>
            </div>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-xs transition dark:border-slate-800 dark:bg-slate-800/80 hover:border-teal-300"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        v{rev.versionNumber}
                      </span>
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {rev.originalName}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {formatFileSize(rev.size)} · Created {formatDate(rev.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={Boolean(actionId)}
                      onClick={() => handleDownloadRevision(rev.id, rev.originalName)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {actionId === `download-${rev.id}` ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(actionId)}
                      onClick={() => handleRestoreRevision(rev.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {actionId === `restore-${rev.id}` ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RotateCcw size={13} />
                      )}
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default VersionHistoryModal;

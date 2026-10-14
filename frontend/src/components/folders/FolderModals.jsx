import { useEffect, useState } from 'react';
import { Modal } from '../common/ui.jsx';

export function CreateFolderModal({ open, onClose, onCreate, loading }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }
    setError('');
    await onCreate(name.trim());
    setName('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Folder">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#111827] dark:text-[#f9fafb]">Folder Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] px-3.5 py-2 text-xs font-semibold text-[#111827] caret-[#3157d5] outline-none transition placeholder:text-[#6b7280] focus:border-[#3157d5] focus:bg-white focus:ring-2 focus:ring-[#3157d5]/15 dark:border-[#253044] dark:bg-[#151c29] dark:text-[#f9fafb] dark:caret-[#5b7cff] dark:placeholder:text-[#9ca3af] dark:focus:border-[#5b7cff] dark:focus:bg-[#111827] sm:text-sm"
            placeholder="e.g. Project Documents"
          />
          {error && <p className="mt-1 text-xs text-[#dc2626] dark:text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-xs font-semibold text-[#6b7280] transition hover:bg-[#f9fafb] hover:text-[#111827] dark:border-[#253044] dark:bg-[#111827] dark:text-[#9ca3af] dark:hover:bg-[#151c29] dark:hover:text-[#f9fafb] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#3157d5] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2649bd] disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function RenameModal({ open, onClose, onRename, loading, initialName = '' }) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  return (
    <Modal open={open} onClose={onClose} title="Rename Item">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await onRename(name.trim());
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#111827] dark:text-[#f9fafb]">New Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] px-3.5 py-2 text-xs font-semibold text-[#111827] caret-[#3157d5] outline-none transition placeholder:text-[#6b7280] focus:border-[#3157d5] focus:bg-white focus:ring-2 focus:ring-[#3157d5]/15 dark:border-[#253044] dark:bg-[#151c29] dark:text-[#f9fafb] dark:caret-[#5b7cff] dark:placeholder:text-[#9ca3af] dark:focus:border-[#5b7cff] dark:focus:bg-[#111827] sm:text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2 text-xs font-semibold text-[#6b7280] transition hover:bg-[#f9fafb] hover:text-[#111827] dark:border-[#253044] dark:bg-[#111827] dark:text-[#9ca3af] dark:hover:bg-[#151c29] dark:hover:text-[#f9fafb] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#3157d5] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2649bd] disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Name'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default { CreateFolderModal, RenameModal };

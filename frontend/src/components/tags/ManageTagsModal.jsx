import { useState } from 'react';
import { Tag as TagIcon, Plus, Check, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/ui.jsx';
import { useTags, useCreateTag, useDeleteTag } from '../../hooks/useTags.js';
import { tagApi } from '../../services/tag.api.js';

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export function ManageTagsModal({ open, onClose, target }) {
  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const qc = useQueryClient();

  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [busyId, setBusyId] = useState(null);

  if (!open || !target?.item) return null;

  const item = target.item;
  const isFolder = target.type === 'folder';
  const itemId = item._id || item.id;
  const assignedTagIds = (item.tags || []).map((t) => t._id || t.id);

  const handleToggleTag = async (tag) => {
    const tagId = tag._id || tag.id;
    const isAssigned = assignedTagIds.includes(tagId);
    setBusyId(tagId);

    try {
      if (isAssigned) {
        if (isFolder) {
          await tagApi.removeFromFolder(tagId, itemId);
        } else {
          await tagApi.removeFromFile(tagId, itemId);
        }
        toast.success(`Removed tag "${tag.name}"`);
      } else {
        if (isFolder) {
          await tagApi.assignToFolder(tagId, itemId);
        } else {
          await tagApi.assignToFile(tagId, itemId);
        }
        toast.success(`Assigned tag "${tag.name}"`);
      }

      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['tagResources'] });
    } catch (err) {
      toast.error(err.message || 'Failed to update tag');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateNewTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    try {
      await createTag.mutateAsync({ name: tagName.trim(), colorHex: selectedColor });
      setTagName('');
    } catch (err) {
      // error toast handled in hook
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Manage Tags: ${item.name}`}>
      <div className="space-y-5">
        {/* Assigned and Available Tags List */}
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Available Tags
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          ) : tags.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              No tags created yet. Create your first tag below!
            </p>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {tags.map((tag) => {
                const tagId = tag._id || tag.id;
                const isAssigned = assignedTagIds.includes(tagId);
                const color = tag.colorHex || '#3B82F6';
                const isProcessing = busyId === tagId;

                return (
                  <div
                    key={tagId}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleToggleTag(tag)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {isAssigned && <Check size={14} />}
                      </span>
                      <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {tag.name}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteTag.mutate(tagId)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 cursor-pointer"
                      title="Delete tag"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Tag Form */}
        <form onSubmit={handleCreateNewTag} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Create New Tag
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Tag name (e.g. Work, College)..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!tagName.trim() || createTag.isPending}
              className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {createTag.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>Add</span>
            </button>
          </div>

          {/* Color Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Color:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-5 w-5 rounded-full transition transform hover:scale-110 cursor-pointer ${
                    selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default ManageTagsModal;

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '../common/ui.jsx';
import { shareApi } from '../../services/share.api.js';
import { publicLinkApi } from '../../services/publicLink.api.js';
import { Copy, Link2, Users, Send } from 'lucide-react';

const shareInputClass =
  'box-border min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/30';

export function ShareModal({ open, onClose, resource }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [expiresAt, setExpiresAt] = useState('');
  const [password, setPassword] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [createdLink, setCreatedLink] = useState(null);
  const qc = useQueryClient();

  const resourceId = resource?.id || resource?._id;
  const isFile = resource?.type === 'file' || Boolean(resource?.mimeType);

  const sharesQuery = useQuery({
    queryKey: ['shares', resourceId],
    queryFn: () => shareApi.list(resourceId).then((r) => r.data),
    enabled: open && Boolean(resourceId),
  });

  useEffect(() => {
    if (!open) {
      setEmail('');
      setLinkEmail('');
      setCreatedLink(null);
      setPassword('');
      setExpiresAt('');
    }
  }, [open]);

  const shareMutation = useMutation({
    mutationFn: () =>
      shareApi.create({
        email,
        role,
        ...(isFile ? { fileId: resourceId } : { folderId: resourceId }),
      }),
    onSuccess: (res) => {
      const emailSent = res?.data?.emailSent;
      const invited = res?.data?.invited;
      const recipient = email.trim();
      if (invited) {
        toast.success(
          emailSent
            ? `Invitation sent to ${recipient}`
            : res?.message || `Invitation saved for ${recipient}, but email could not be sent.`
        );
      } else if (emailSent) {
        toast.success(
          isFile
            ? `File shared successfully with ${recipient}`
            : `Folder shared successfully with ${recipient}`
        );
      } else {
        toast.success(
          res?.message ||
            (isFile
              ? 'File shared successfully, but notification email could not be sent.'
              : 'Folder shared successfully, but notification email could not be sent.')
        );
      }
      setEmail('');
      qc.invalidateQueries({ queryKey: ['shares', resourceId] });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ shareId, role: nextRole }) => shareApi.update(shareId, nextRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shares', resourceId] });
      toast.success('Permission updated');
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (shareId) => shareApi.remove(shareId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shares', resourceId] });
      toast.success('Share removed');
    },
    onError: (err) => toast.error(err.message),
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      publicLinkApi.create({
        ...(isFile ? { fileId: resourceId } : { folderId: resourceId }),
        expiresAt: expiresAt || null,
        password: password || null,
        ...(linkEmail.trim() ? { recipientEmail: linkEmail.trim() } : {}),
      }),
    onSuccess: (res) => {
      setCreatedLink(res);
      if (res?.emailSent) {
        toast.success(`Public link created and emailed to ${linkEmail.trim()}`);
      } else if (linkEmail.trim()) {
        toast.success(res?.message || 'Public link created, but email could not be sent.');
      } else {
        toast.success('Public link created');
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const emailLinkMutation = useMutation({
    mutationFn: () => publicLinkApi.email(createdLink.id, linkEmail.trim()),
    onSuccess: (res) => {
      const sent = res?.emailSent || res?.data?.emailSent;
      if (sent) {
        toast.success(`Public share link emailed to ${linkEmail.trim()}`);
      } else {
        toast.error(res?.message || 'Public link created, but email could not be delivered.');
      }
    },
    onError: (err) => toast.error(err.message),
  });

  if (!resource) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Share "${resource.name}"`} wide>
      <div className="space-y-6">
        {/* Email Invitation Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            shareMutation.mutate();
          }}
          className="space-y-2"
        >
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            People share (requires Strovix account). For no-login access, use Public link below.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className={`${shareInputClass} flex-1 sm:min-w-0`}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`${shareInputClass} shrink-0 cursor-pointer sm:w-auto sm:min-w-[7rem]`}
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
            </select>
            <button
              type="submit"
              disabled={shareMutation.isPending}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white shadow-md shadow-teal-500/20 transition hover:bg-teal-700 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Send size={14} />
              <span>{shareMutation.isPending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </form>

        {/* People with Access Section */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users size={15} className="text-slate-400 dark:text-slate-500" />
            <span>People with access</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
            {(sharesQuery.data || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 p-4 text-center text-xs font-medium text-slate-400 dark:border-slate-600/80 dark:bg-slate-900/40 dark:text-slate-500">
                Not shared with anyone yet.
              </div>
            ) : (
              (sharesQuery.data || []).map((share) => {
                const email = share.sharedWith?.email || share.email || '';
                const name = share.sharedWith?.name?.trim();
                const isPending = Boolean(share.pending);
                const showName = Boolean(name) && !isPending;
                const primary = showName ? name : email;
                const secondary = showName && email && name.toLowerCase() !== email.toLowerCase() ? email : null;

                return (
                  <div
                    key={share._id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 transition hover:bg-white hover:shadow-xs dark:border-slate-700/80 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className="break-all text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100"
                            title={primary}
                          >
                            {primary}
                          </p>
                          {isPending && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
                              Pending invite
                            </span>
                          )}
                        </div>
                        {secondary ? (
                          <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400" title={secondary}>
                            {secondary}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200/60 pt-3 sm:border-0 sm:pt-0 dark:border-slate-700/60">
                        <select
                          value={share.role}
                          onChange={(e) =>
                            updateMutation.mutate({ shareId: share._id, role: e.target.value })
                          }
                          className="h-9 min-w-[5.5rem] rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(share._id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Public Link Generator Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3.5 dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <Link2 size={16} className="text-teal-600" />
            <span>Public link (no login required)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">Expiration</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">Password (optional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-teal-500 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-teal-500"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Email public link to (optional)
            </label>
            <input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="recipient@example.com"
              autoComplete="email"
              className={shareInputClass}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending}
              className="h-9 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-95 disabled:opacity-60 cursor-pointer dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              {linkMutation.isPending
                ? 'Working...'
                : linkEmail.trim()
                  ? 'Create Link & Email'
                  : 'Create Link'}
            </button>
            {createdLink && (
              <button
                type="button"
                onClick={() => {
                  if (!linkEmail.trim()) {
                    toast.error('Enter an email address first');
                    return;
                  }
                  emailLinkMutation.mutate();
                }}
                disabled={emailLinkMutation.isPending}
                className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-teal-600 bg-white px-4 text-xs font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-60 dark:border-teal-500 dark:bg-slate-800 dark:text-teal-400 dark:hover:bg-teal-950/40"
              >
                <Send size={13} />
                {emailLinkMutation.isPending ? 'Sending...' : 'Email this link'}
              </button>
            )}
          </div>

          {createdLink && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 animate-fade-up dark:border-slate-600 dark:bg-slate-800">
              <input
                readOnly
                value={createdLink.url}
                className="min-w-0 flex-1 truncate bg-transparent text-xs font-mono font-medium text-slate-700 outline-none px-1 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(createdLink.url);
                  toast.success('Copied to clipboard');
                }}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer dark:hover:bg-slate-700 dark:hover:text-slate-100"
                title="Copy link"
              >
                <Copy size={15} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await publicLinkApi.update(createdLink.id, { isActive: false });
                  toast.success('Link disabled');
                  setCreatedLink(null);
                }}
                className="text-xs font-bold text-red-600 hover:underline px-1 cursor-pointer"
              >
                Disable
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ShareModal;

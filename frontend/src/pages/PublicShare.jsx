import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { publicLinkApi } from '../services/publicLink.api.js';
import { LoadingSpinner } from '../components/common/ui.jsx';
import { formatFileSize } from '../utils/formatFileSize.js';
import { resolveApiUrl } from '../utils/apiUrl.js';

export default function PublicShare() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (pwd) => {
    setLoading(true);
    try {
      const res = await publicLinkApi.getByToken(token, pwd);
      setData(res.data);
      setNeedsPassword(false);
    } catch (err) {
      if (err.message?.toLowerCase().includes('password')) {
        setNeedsPassword(true);
        if (pwd) toast.error(err.message);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  if (loading) return <LoadingSpinner label="Loading shared content..." />;

  if (needsPassword && !data) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-[#2567d6] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(password);
          }}
          className="w-full max-w-sm rounded-3xl border border-blue-400/20 bg-white p-8 shadow-2xl"
        >
          <h1 className="mb-1.5 text-xl font-bold text-slate-900">Password Required</h1>
          <p className="mb-4 text-xs text-slate-500">This shared link is password protected.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            placeholder="Enter password"
          />
          <button type="submit" className="w-full rounded-full bg-blue-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 cursor-pointer">
            Unlock Content
          </button>
        </form>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-[#2567d6] p-4">
        <div className="rounded-3xl bg-white p-8 text-center text-xs font-semibold text-slate-500 shadow-2xl">
          Public link unavailable or expired
        </div>
      </div>
    );
  }

  const resource = data.resource;

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-[#2567d6] p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-blue-400/20 bg-white p-8 shadow-2xl space-y-6">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Shared via Storvix
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-900">{resource.name}</h1>
        </div>

        {resource.type === 'file' ? (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500">
              {resource.mimeType} · {formatFileSize(resource.size)}
            </p>
            {data.downloadUrl && (
              <a
                href={data.downloadUrl.startsWith('/') ? resolveApiUrl(data.downloadUrl) : data.downloadUrl}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 cursor-pointer"
              >
                Download File
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Folder Contents</p>
            <div className="space-y-2">
              {(resource.folders || []).map((f) => (
                <div key={f._id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-800">
                  <span>📁</span>
                  <span>{f.name}</span>
                </div>
              ))}
              {(resource.files || []).map((f) => (
                <div key={f._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <span>📄</span>
                    <span className="truncate">{f.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{formatFileSize(f.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

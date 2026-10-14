import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Image as ImageIcon,
  Star,
  Upload,
  ArrowRight,
  File,
  FileSpreadsheet,
  Film,
  Music,
  Sparkles,
  Clock3,
} from 'lucide-react';
import { activityApi } from '../services/publicLink.api.js';
import { formatFileSize } from '../utils/formatFileSize.js';
import { formatDate } from '../utils/formatDate.js';
import { LoadingSpinner } from '../components/common/ui.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

function fileIcon(mime = '', name = '') {
  const lower = `${mime} ${name}`.toLowerCase();
  if (lower.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/.test(lower)) {
    return { Icon: ImageIcon, tone: 'bg-sky-100 text-sky-700' };
  }
  if (lower.includes('video') || /\.(mp4|mov|webm)$/.test(lower)) {
    return { Icon: Film, tone: 'bg-violet-100 text-violet-700' };
  }
  if (lower.includes('audio') || /\.(mp3|wav)$/.test(lower)) {
    return { Icon: Music, tone: 'bg-pink-100 text-pink-700' };
  }
  if (lower.includes('sheet') || lower.includes('excel') || /\.(xlsx?|csv)$/.test(lower)) {
    return { Icon: FileSpreadsheet, tone: 'bg-indigo-100 text-indigo-700' };
  }
  if (lower.includes('pdf') || lower.includes('text') || /\.(pdf|txt|docx?)$/.test(lower)) {
    return { Icon: FileText, tone: 'bg-amber-100 text-amber-700' };
  }
  return { Icon: File, tone: 'bg-slate-100 text-slate-600' };
}

function storagePercent(used, quota) {
  return Math.min(100, quota ? (used / quota) * 100 : 0);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => activityApi.dashboard(),
    staleTime: 15000,
    gcTime: 300000,
  });

  if (isLoading) return <LoadingSpinner label="Loading dashboard..." />;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const used = data?.storage?.used || 0;
  const quota = data?.storage?.quota || 1;
  const pct = storagePercent(used, quota);
  const recentFiles = data?.recentFiles || [];
  const starred = data?.starred || [];
  const activities = data?.recentActivity || [];

  const stats = [
    {
      label: 'Files',
      value: data?.totals?.files ?? 0,
      hint: 'In your drive',
      icon: FileText,
      soft: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      to: '/drive',
    },
    {
      label: 'Folders',
      value: data?.totals?.folders ?? 0,
      hint: 'Organized spaces',
      icon: Folder,
      soft: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      to: '/drive',
    },
    {
      label: 'Starred',
      value: data?.totals?.starred ?? 0,
      hint: 'Quick access',
      icon: Star,
      soft: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      to: '/starred',
    },
    {
      label: 'Storage used',
      value: formatFileSize(used),
      hint: `${pct.toFixed(1)}% of ${formatFileSize(quota)}`,
      icon: HardDrive,
      soft: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      to: '/pricing',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Welcome Header & Compact Storage Summary */}
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr] items-stretch">
        <div className="flex flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-xs dark:border-[#253044] dark:bg-[#111827]">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[#eef3ff] px-2.5 py-1 text-[11px] font-semibold text-[#3157d5] dark:bg-[#1e293b] dark:text-[#5b7cff]">
              <Sparkles size={13} />
              Cloud Workspace
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#111827] dark:text-[#f9fafb] sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1.5 text-xs text-[#6b7280] dark:text-[#9ca3af] sm:text-sm">
              Manage your files, share securely, and pick up where you left off.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/drive?upload=1')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#3157d5] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2649bd] cursor-pointer"
            >
              <Upload size={15} />
              Upload Files
            </button>
            <button
              type="button"
              onClick={() => navigate('/drive?createFolder=1')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-xs font-semibold text-[#111827] shadow-xs transition hover:bg-[#f9fafb] dark:border-[#253044] dark:bg-[#111827] dark:text-[#f9fafb] dark:hover:bg-[#151c29] cursor-pointer"
            >
              <FolderPlus size={15} />
              New Folder
            </button>
          </div>
        </div>

        {/* Compact Storage Summary Card */}
        <div className="flex flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-xs dark:border-[#253044] dark:bg-[#111827]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#111827] dark:text-[#f9fafb]">
              <span className="flex items-center gap-1.5">
                <HardDrive size={15} className="text-[#3157d5] dark:text-[#5b7cff]" />
                <span>Storage Overview</span>
              </span>
              <span className="text-[#6b7280] dark:text-[#9ca3af]">
                {formatFileSize(used)} of {formatFileSize(quota)}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#f7f8fa] dark:bg-[#0b0f17]">
              <div
                className="h-full rounded-full bg-[#3157d5] transition-all duration-500 dark:bg-[#5b7cff]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#e5e7eb] pt-3.5 text-xs text-[#6b7280] dark:border-[#253044] dark:text-[#9ca3af]">
            <span>{data?.totals?.files ?? 0} files · {data?.totals?.folders ?? 0} folders</span>
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="font-semibold text-[#3157d5] hover:underline cursor-pointer dark:text-[#5b7cff]"
            >
              Upgrade Storage
            </button>
          </div>
        </div>
      </section>

      {/* Clean Stat Cards */}
      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => navigate(card.to)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="group flex items-start justify-between rounded-xl border border-[#e5e7eb] bg-white p-4.5 text-left shadow-xs transition hover:border-[#3157d5]/40 hover:shadow-sm dark:border-[#253044] dark:bg-[#111827] dark:hover:border-[#5b7cff]/40 cursor-pointer animate-fade-up"
            >
              <div>
                <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af]">{card.label}</p>
                <p className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#111827] dark:text-[#f9fafb]">
                  {card.value}
                </p>
                <p className="mt-0.5 text-[11px] text-[#9ca3af] dark:text-[#6b7280]">{card.hint}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef3ff] text-[#3157d5] transition group-hover:scale-105 dark:bg-[#1e293b] dark:text-[#5b7cff]">
                <Icon size={17} />
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        {/* Recent files */}
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900 dark:text-slate-100">
                Recent files
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest uploads in your drive</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/drive')} className="gap-1 text-blue-600 dark:text-blue-400">
              Open drive <ArrowRight size={14} />
            </Button>
          </div>

          {recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Upload size={22} />
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-100">No files yet</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Upload your first file to see it appear here.
              </p>
              <Button onClick={() => navigate('/drive')} className="mt-4">
                Go to My Drive
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentFiles.map((file) => {
                const { Icon, tone } = fileIcon(file.mimeType, file.name);
                return (
                  <li key={file._id}>
                    <button
                      type="button"
                      onClick={() => navigate('/drive')}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone} dark:bg-slate-800 dark:text-slate-200`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{file.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(file.size)} · {formatDate(file.createdAt)}
                        </p>
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-slate-300 dark:text-slate-600" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Side column */}
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900 dark:text-slate-100">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump into common tasks</p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => navigate('/drive')}
                className="flex items-center gap-3 rounded-2xl bg-[var(--color-accent)] px-4 py-3.5 text-left text-white shadow transition hover:bg-[var(--color-accent-dark)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Upload size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Quick upload</span>
                  <span className="block text-xs text-white/80">Add files to My Drive</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/drive?createFolder=1')}
                className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-transparent px-4 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <FolderPlus size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Create folder</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Organize your files</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/shared')}
                className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-transparent px-4 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <HardDrive size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Shared with me</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Files others shared</span>
                </span>
              </button>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Starred
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pinned for quick access</p>
              </div>
              <Button variant="link" onClick={() => navigate('/starred')} className="text-blue-600 dark:text-blue-400 px-0">
                View all
              </Button>
            </div>

            {starred.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                Star files or folders to see them here.
              </p>
            ) : (
              <ul className="space-y-2">
                {starred.slice(0, 5).map((item) => {
                  const resource = item.file || item.folder;
                  const isFolder = Boolean(item.folder);
                  return (
                    <li key={item._id}>
                      <button
                        type="button"
                        onClick={() => navigate(isFolder ? '/drive' : '/starred')}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            isFolder ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'
                          }`}
                        >
                          {isFolder ? <Folder size={16} /> : <Star size={16} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {resource?.name || 'Item'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </section>

      {/* Activity */}
      {activities.length > 0 && (
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 size={18} className="text-slate-400 dark:text-slate-500" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900 dark:text-slate-100">
              Recent activity
            </h2>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {activities.slice(0, 6).map((item) => (
              <li
                key={item._id}
                className="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-slate-50/60 px-3 py-3 dark:bg-slate-800/40"
              >
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize text-slate-800 dark:text-slate-100">
                    {(item.action || 'activity').replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

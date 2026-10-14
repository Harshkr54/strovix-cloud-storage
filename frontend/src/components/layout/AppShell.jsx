import { NavLink, useNavigate } from 'react-router-dom';
import {
  Cloud,
  HardDrive,
  LayoutDashboard,
  Share2,
  Star,
  Trash2,
  Menu,
  X,
  User,
  LogOut,
  Search,
  Command,
  Tag as TagIcon,
  Zap,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { StorageIndicator } from '../common/ui.jsx';
import { ThemeToggle } from '../common/ThemeToggle.jsx';
import { LogoutConfirmationModal } from '../auth/LogoutConfirmationModal.jsx';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../services/publicLink.api.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useSearch } from '../../hooks/useSearch.js';
import { getFileIcon } from '../../utils/fileIcons.js';
import { useTags } from '../../hooks/useTags.js';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/drive', label: 'My Drive', icon: HardDrive },
  { to: '/shared', label: 'Shared with me', icon: Share2 },
  { to: '/starred', label: 'Starred', icon: Star },
  { to: '/trash', label: 'Trash', icon: Trash2 },
  { to: '/pricing', label: 'Upgrade Plans', icon: Zap },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [q, setQ] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const debouncedQ = useDebounce(q.trim(), 300);
  const { data: searchData, isLoading: isSearching } = useSearch(
    { q: debouncedQ, limit: 6 },
    Boolean(debouncedQ)
  );

  const navigate = useNavigate();
  const storageQuery = useQuery({
    queryKey: ['storage'],
    queryFn: () => userApi.storage(),
    staleTime: 30000,
    gcTime: 300000,
  });

  const { data: userTags = [] } = useTags();

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQ(val);
    if (!val.trim()) {
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
  };

  const handleLogoutConfirm = async () => {
    await logout();
    setLogoutOpen(false);
    setOpen(false);
    navigate('/login', { replace: true });
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const Sidebar = (
    <aside className="flex h-full w-60 flex-col border-r border-[#e5e7eb] bg-white text-[#111827] transition-colors duration-150 dark:border-[#253044] dark:bg-[#111827] dark:text-[#f9fafb]">
      {/* Brand Header */}
      <div className="flex shrink-0 items-center gap-2.5 px-5 pt-5 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3157d5] text-white shadow-xs">
          <Cloud size={20} strokeWidth={2.25} />
        </div>
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#111827] dark:text-white">
            Storvix
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
            Cloud Storage
          </p>
        </div>
      </div>

      {/* Prominent Upload Button */}
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => {
            navigate('/drive?upload=1');
            setOpen(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3157d5] py-2.5 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2649bd] active:scale-98 cursor-pointer"
        >
          <span className="text-sm leading-none font-extrabold">+</span>
          <span>Upload New Files</span>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-2 overflow-y-auto custom-scrollbar">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#eef3ff] text-[#3157d5] font-semibold dark:bg-[#1e293b] dark:text-[#5b7cff]'
                  : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#111827] dark:text-[#9ca3af] dark:hover:bg-[#151c29] dark:hover:text-[#f9fafb]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={
                    isActive ? 'text-[#3157d5] dark:text-[#5b7cff]' : 'text-[#6b7280] group-hover:text-[#111827] dark:text-[#9ca3af] dark:group-hover:text-white'
                  }
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* User Tags Section */}
        {userTags.length > 0 && (
          <div className="pt-4 space-y-0.5">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280]">
              Tags
            </p>
            {userTags.map((tag) => {
              const tagId = tag._id || tag.id;
              const color = tag.colorHex || '#3157D5';
              return (
                <NavLink
                  key={tagId}
                  to={`/drive?tag=${tagId}`}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#eef3ff] text-[#3157d5] font-semibold dark:bg-[#1e293b] dark:text-[#5b7cff]'
                        : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#111827] dark:text-[#9ca3af] dark:hover:bg-[#151c29] dark:hover:text-[#f9fafb]'
                    }`
                  }
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="truncate">{tag.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Storage & Profile Footer */}
      <div className="mt-auto space-y-3 border-t border-[#e5e7eb] p-3.5 dark:border-[#253044]">
        {storageQuery.data && (
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f7f8fa] p-3 space-y-2 dark:border-[#253044] dark:bg-[#0b0f17]">
            <div className="flex items-center justify-between text-xs text-[#111827] font-semibold dark:text-[#f9fafb]">
              <span className="flex items-center gap-1.5 text-xs">
                <HardDrive size={13} className="text-[#3157d5] dark:text-[#5b7cff]" /> Storage
              </span>
              <button
                type="button"
                onClick={() => {
                  navigate('/pricing');
                  setOpen(false);
                }}
                className="text-[10px] font-bold text-[#3157d5] hover:underline cursor-pointer dark:text-[#5b7cff]"
              >
                Upgrade
              </button>
            </div>
            <StorageIndicator used={storageQuery.data.storageUsed} quota={storageQuery.data.storageQuota} />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              navigate('/profile');
              setOpen(false);
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 rounded-lg p-1.5 text-left transition hover:bg-[#f9fafb] dark:hover:bg-[#151c29]"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3157d5] text-white font-bold text-xs">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#111827] dark:text-[#f9fafb]">{user?.name || 'User'}</p>
              <p className="truncate text-[10px] text-[#6b7280] dark:text-[#9ca3af]">{user?.email}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="rounded-lg p-1.5 text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#dc2626] transition cursor-pointer dark:text-[#9ca3af] dark:hover:bg-[#151c29]"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-[#f7f8fa] dark:bg-[#0b0f17] transition-colors duration-150">
      {/* Shell Container */}
      <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#0b0f17]">
        <div className="hidden h-full shrink-0 md:block">{Sidebar}</div>

        {open && (
          <div className="fixed inset-0 z-50 flex animate-fade-up md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 h-full">{Sidebar}</div>
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f7f8fa] dark:bg-[#0b0f17]">
          {/* Header */}
          <header className="z-30 flex shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-white px-4 py-2.5 dark:border-[#253044] dark:bg-[#111827] sm:px-6">
            <button
              type="button"
              className="rounded-lg p-1.5 text-[#6b7280] hover:bg-[#f9fafb] md:hidden dark:text-[#9ca3af] dark:hover:bg-[#151c29]"
              onClick={() => setOpen(true)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* High-Contrast Search Input */}
            <form ref={searchRef} onSubmit={onSearch} className="relative min-w-0 flex-1 max-w-lg">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] dark:text-[#6b7280]"
                size={15}
              />
              <input
                value={q}
                onChange={handleInputChange}
                onFocus={() => {
                  if (q.trim()) setShowSuggestions(true);
                }}
                placeholder="Search files, folders and documents..."
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] py-2 pl-10 pr-10 text-xs font-semibold text-[#111827] caret-[#3157d5] outline-none transition placeholder:text-[#6b7280] focus:border-[#3157d5] focus:bg-white focus:ring-2 focus:ring-[#3157d5]/15 dark:border-[#253044] dark:bg-[#151c29] dark:text-[#f9fafb] dark:caret-[#5b7cff] dark:placeholder:text-[#9ca3af] dark:focus:border-[#5b7cff] dark:focus:bg-[#111827] sm:text-sm"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-[#e5e7eb] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#9ca3af] dark:border-[#253044] dark:bg-[#111827] dark:text-[#6b7280] sm:flex">
                <Command size={10} /> K
              </div>

              {/* High-Contrast Auto-Suggestion Dropdown */}
              {showSuggestions && q.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white p-1.5 shadow-xl dark:border-[#253044] dark:bg-[#111827] animate-scale-up">
                  {isSearching ? (
                    <div className="p-3 text-center text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] animate-pulse">
                      Searching...
                    </div>
                  ) : (searchData?.items || searchData?.files || []).length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#6b7280] dark:text-[#9ca3af]">
                      No files or folders found for "{q}"
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280]">
                        Search Suggestions
                      </p>
                      {(searchData?.items || searchData?.files || []).slice(0, 6).map((item) => {
                        const isFolder = item.resourceType === 'folder';
                        const Icon = getFileIcon(item.mimeType, isFolder);
                        return (
                          <button
                            key={`${item.resourceType}-${item._id || item.id}`}
                            type="button"
                            onClick={() => {
                              setShowSuggestions(false);
                              if (isFolder) {
                                navigate(`/drive?folder=${item._id || item.id}`);
                              } else {
                                navigate(`/search?q=${encodeURIComponent(item.name)}`);
                              }
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#f7f8fa] dark:hover:bg-[#151c29] cursor-pointer"
                          >
                            <Icon size={16} className={isFolder ? 'text-amber-500 shrink-0' : 'text-[#3157d5] dark:text-[#5b7cff] shrink-0'} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-[#111827] dark:text-[#f9fafb]">
                                {item.name}
                              </p>
                              <p className="truncate text-[10px] text-[#6b7280] dark:text-[#9ca3af]">
                                {isFolder ? 'Folder' : item.mimeType || 'File'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </form>

            <ThemeToggle className="ml-auto shrink-0" />
          </header>

          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f7f8fa] p-4 transition-colors duration-150 dark:bg-[#0b0f17] sm:p-6 lg:p-7">
            {children}
          </main>
        </div>
      </div>

      <LogoutConfirmationModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}

export default AppShell;

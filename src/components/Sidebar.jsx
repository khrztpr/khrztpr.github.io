import React from 'react';
import {
  Layers,
  LayoutDashboard,
  Car,
  Settings,
  LogOut,
  Loader2
} from 'lucide-react';

export default function Sidebar({
  currentPage,
  setCurrentPage,
  currentUserEmail,
  sidebarLoggingOut,
  onLogout
}) {
  const itemBase =
    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#CB1F23]/40';

  const isActive = (page) => currentPage === page;

  const navItemClass = (active) =>
    `${itemBase} ${
      active
        ? 'bg-[#CB1F23] text-[#FAF6F6]'
        : 'text-[#FAF6F6]/70 hover:bg-[#526084] hover:text-[#FAF6F6]'
    }`;

  return (
    <aside className="hidden md:flex w-64 flex-col bg-[#233663] text-[#FAF6F6]">
      {/* Header */}
      <div className="rounded-b-3xl border-b border-[#526084] bg-[#233663] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Layers className="text-[#CB1F23]" size={24} />
          <div>
            <div className="text-lg font-semibold text-[#FAF6F6]">
              AMW Analytics
            </div>
            <div className="text-sm text-[#FAF6F6]/60">
              Operational insight hub
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-4">
        <span className="mb-2 block px-3 text-[10px] font-bold uppercase tracking-widest text-[#FAF6F6]/50">
          Workspaces
        </span>

        <button
          onClick={() => setCurrentPage('headcount')}
          className={navItemClass(isActive('headcount'))}
        >
          <LayoutDashboard size={18} />
          Operational Analytics
        </button>

        <button
          onClick={() => setCurrentPage('vehicles')}
          className={navItemClass(isActive('vehicles'))}
        >
          <Car size={18} />
          Fleet Dashboard
        </button>

        <button
          onClick={() => setCurrentPage('settings')}
          className={navItemClass(isActive('settings'))}
        >
          <Settings size={18} />
          Engine Rules Settings
        </button>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-[#526084] p-4">
        {currentUserEmail && (
          <div className="mb-3 rounded-2xl bg-[#526084] px-4 py-3 text-sm">
            <div className="font-semibold text-[#FAF6F6]">
              Signed in as
            </div>
            <div className="truncate text-[#FAF6F6]/60">
              {currentUserEmail}
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          disabled={sidebarLoggingOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#526084] bg-[#233663] px-4 py-3 text-sm font-medium text-[#FAF6F6] transition hover:bg-[#C65E50] disabled:opacity-60"
        >
          {sidebarLoggingOut ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <LogOut size={14} />
          )}
          <span>{sidebarLoggingOut ? 'Signing out…' : 'Logout'}</span>
        </button>

        <div className="mt-4 text-center text-[11px] font-medium tracking-wider text-[#FAF6F6]/50">
          v2.1.0 — 2026
        </div>
      </div>
    </aside>
  );
}
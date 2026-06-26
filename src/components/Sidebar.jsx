import React from 'react';
import { Layers, LayoutDashboard, Car, Settings, LogOut, Loader2 } from 'lucide-react';

export default function Sidebar({
  currentPage,
  setCurrentPage,
  currentUserEmail,
  sidebarLoggingOut,
  onLogout
}) {
  const itemBase =
    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary.base/40';

  return (
    <aside className="w-64 bg-neutral.background text-neutral.textPrimary flex flex-col hidden md:flex">
      <div className="p-5 rounded-b-3xl bg-neutral.card border-b border-neutral.border shadow-sm">
        <div className="flex items-center gap-3">
          <Layers className="text-primary.base" size={24} />
          <div>
            <div className="text-lg font-semibold text-neutral.textPrimary">AMW Analytics</div>
            <div className="text-sm text-neutral.textMuted">Operational insight hub</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        <span className="text-[10px] font-bold text-neutral.textMuted uppercase tracking-widest block px-3 mb-2">
          Workspaces
        </span>

        <button
          onClick={() => setCurrentPage('headcount')}
          className={`${itemBase} ${
            currentPage === 'headcount'
              ? 'bg-primary.base text-white'
              : 'text-neutral.textMuted hover:bg-primary.soft hover:text-neutral.textPrimary'
          }`}
        >
          <LayoutDashboard size={18} /> Operational Analytics
        </button>

        <button
          onClick={() => setCurrentPage('vehicles')}
          className={`${itemBase} ${
            currentPage === 'vehicles'
              ? 'bg-primary.base text-white'
              : 'text-neutral.textMuted hover:bg-primary.soft hover:text-neutral.textPrimary'
          }`}
        >
          <Car size={18} /> Fleet Dashboard
        </button>

        <button
          onClick={() => setCurrentPage('settings')}
          className={`${itemBase} ${
            currentPage === 'settings'
              ? 'bg-primary.base text-white'
              : 'text-neutral.textMuted hover:bg-primary.soft hover:text-neutral.textPrimary'
          }`}
        >
          <Settings size={18} /> Engine Rules Settings
        </button>
      </nav>

      <div className="mt-auto p-4 border-t border-neutral.border">
        {currentUserEmail ? (
          <div className="mb-3 rounded-2xl bg-neutral.card px-4 py-3 text-sm">
            <div className="font-semibold text-neutral.textPrimary">Signed in as</div>
            <div className="truncate text-neutral.textMuted">{currentUserEmail}</div>
          </div>
        ) : null}

        <button
          onClick={onLogout}
          disabled={sidebarLoggingOut}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral.border bg-neutral.card px-4 py-3 text-sm font-medium text-neutral.textPrimary transition hover:bg-primary.soft disabled:opacity-60"
        >
          {sidebarLoggingOut ? <Loader2 className="animate-spin" size={14} /> : <LogOut size={14} />}
          <span>{sidebarLoggingOut ? 'Signing out…' : 'Logout'}</span>
        </button>

        <div className="mt-4 text-[11px] text-neutral.textMuted text-center font-medium tracking-wider">
          v2.1.0 — 2026
        </div>
      </div>
    </aside>
  );
}


import React from 'react';
import { Layers, LayoutDashboard, Car, Settings, LogOut, Loader2 } from 'lucide-react';

export default function Sidebar({
  currentPage,
  setCurrentPage,
  currentUserEmail,
  sidebarLoggingOut,
  onLogout
}) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
      <div className="p-5 rounded-b-3xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 border-b border-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-3">
          <Layers className="text-emerald-400" size={24} />
          <div>
            <div className="text-lg font-semibold text-white">AMW Analytics</div>
            <div className="text-sm text-slate-400">Operational insight hub</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-3 mb-2">Workspaces</span>

        <button
          onClick={() => setCurrentPage('headcount')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${currentPage === 'headcount' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <LayoutDashboard size={18} /> Operational Analytics
        </button>

        <button
          onClick={() => setCurrentPage('vehicles')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${currentPage === 'vehicles' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Car size={18} /> Fleet Dashboard
        </button>

        <button
          onClick={() => setCurrentPage('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${currentPage === 'settings' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Settings size={18} /> Engine Rules Settings
        </button>
      </nav>

      <div className="mt-auto p-4 border-t border-slate-800">
        {currentUserEmail ? (
          <div className="mb-3 rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-200">
            <div className="font-semibold text-slate-100">Signed in as</div>
            <div className="truncate text-slate-300">{currentUserEmail}</div>
          </div>
        ) : null}

        <button
          onClick={onLogout}
          disabled={sidebarLoggingOut}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-500/20 disabled:opacity-60"
        >
          {sidebarLoggingOut ? <Loader2 className="animate-spin" size={14} /> : <LogOut size={14} />}
          <span>{sidebarLoggingOut ? 'Signing out…' : 'Logout'}</span>
        </button>

        <div className="mt-4 text-[11px] text-slate-600 text-center font-medium tracking-wider">v2.1.0 — 2026</div>
      </div>
    </aside>
  );
}


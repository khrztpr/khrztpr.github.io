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
    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40';

  return (
    <aside className="hidden md:flex w-64 flex-col bg-[#F8FAFC] text-[#0F172A]">
      <div className="rounded-b-3xl border-b border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Layers className="text-[#0F766E]" size={24} />
          <div>
            <div className="text-lg font-semibold text-[#0F172A]">
              AMW Analytics
            </div>
            <div className="text-sm text-[#64748B]">
              Operational insight hub
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-4">
        <span className="mb-2 block px-3 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
          Workspaces
        </span>

        <button
          onClick={() => setCurrentPage('headcount')}
          className={`${itemBase} ${
            currentPage === 'headcount'
              ? 'bg-[#0F766E] text-white'
              : 'text-[#64748B] hover:bg-[#D1FAF5] hover:text-[#0F172A]'
          }`}
        >
          <LayoutDashboard size={18} />
          Operational Analytics
        </button>

        <button
          onClick={() => setCurrentPage('vehicles')}
          className={`${itemBase} ${
            currentPage === 'vehicles'
              ? 'bg-[#0F766E] text-white'
              : 'text-[#64748B] hover:bg-[#D1FAF5] hover:text-[#0F172A]'
          }`}
        >
          <Car size={18} />
          Fleet Dashboard
        </button>

        <button
          onClick={() => setCurrentPage('settings')}
          className={`${itemBase} ${
            currentPage === 'settings'
              ? 'bg-[#0F766E] text-white'
              : 'text-[#64748B] hover:bg-[#D1FAF5] hover:text-[#0F172A]'
          }`}
        >
          <Settings size={18} />
          Engine Rules Settings
        </button>
      </nav>

      <div className="mt-auto border-t border-[#E2E8F0] p-4">
        {currentUserEmail && (
          <div className="mb-3 rounded-2xl bg-[#FFFFFF] px-4 py-3 text-sm">
            <div className="font-semibold text-[#0F172A]">
              Signed in as
            </div>
            <div className="truncate text-[#64748B]">
              {currentUserEmail}
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          disabled={sidebarLoggingOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 text-sm font-medium text-[#0F172A] transition hover:bg-[#D1FAF5] disabled:opacity-60"
        >
          {sidebarLoggingOut ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <LogOut size={14} />
          )}
          <span>{sidebarLoggingOut ? 'Signing out…' : 'Logout'}</span>
        </button>

        <div className="mt-4 text-center text-[11px] font-medium tracking-wider text-[#64748B]">
          v2.1.0 — 2026
        </div>
      </div>
    </aside>
  );
}

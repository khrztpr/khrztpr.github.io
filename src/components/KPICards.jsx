import React from 'react';
import { ClipboardList, Clock, AlertTriangle, Calendar, Users } from 'lucide-react';

export default function KPICards({ kpis }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <ClipboardList size={13} /> Opening HC
          </div>
          <div className="text-xl font-bold text-slate-800 mt-2">{kpis.openingFieldHC}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock size={13} /> Scheduled
          </div>
          <div className="text-xl font-bold text-blue-600 mt-2">{kpis.scheduled}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={13} className="text-rose-500" /> Absent/Late
          </div>
          <div className="text-xl font-bold text-rose-600 mt-2">{kpis.absentLate}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Calendar size={13} className="text-amber-500" /> Planned Leave
          </div>
          <div className="text-xl font-bold text-amber-600 mt-2">{kpis.plannedLeave}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 col-span-2 md:col-span-1">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={13} /> Out Shrinkage
          </div>
          <div className="text-xl font-bold text-rose-700 mt-2">{kpis.outShrinkage}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60">
          <div className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Users size={13} /> Active Logged (Avg)
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{kpis.active}</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Active - Full Time</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{kpis.activeFull}</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Active - Part Time</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{kpis.activePartial}</div>
        </div>
      </div>
    </>
  );
}


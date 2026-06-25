import React from 'react';
import { ClipboardList, Clock, AlertTriangle, Calendar, Users } from 'lucide-react';

function Card({ children, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default function KPICards({ kpis }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-neutral.card p-4 rounded-xl shadow-sm border border-neutral.border">
          <div className="text-neutral.textMuted text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <ClipboardList size={13} /> Opening HC
          </div>
          <div className="text-xl font-bold text-neutral.textPrimary mt-2">{kpis.openingFieldHC}</div>
        </Card>

        <Card className="bg-neutral.card p-4 rounded-xl shadow-sm border border-neutral.border">
          <div className="text-neutral.textMuted text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock size={13} /> Scheduled
          </div>
          <div className="text-xl font-bold text-status-success-base mt-2">{kpis.scheduled}</div>
        </Card>


        <Card className="bg-neutral.card p-4 rounded-xl shadow-sm border border-neutral.border">
          <div className="text-neutral.textMuted text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={13} className="text-status-error-base" /> Absent/Late
          </div>
          <div className="text-xl font-bold text-status-error-base mt-2">{kpis.absentLate}</div>

        </Card>

        <Card className="bg-neutral.card p-4 rounded-xl shadow-sm border border-neutral.border">
          <div className="text-neutral.textMuted text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Calendar size={13} className="text-status-warning-base" /> Planned Leave
          </div>
          <div className="text-xl font-bold text-status-warning-base mt-2">{kpis.plannedLeave}</div>

        </Card>

        <Card className="bg-neutral.card p-4 rounded-xl shadow-sm border border-neutral.border col-span-2 md:col-span-1">
          <div className="text-neutral.textMuted text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={13} className="text-status-error-base" /> Out Shrinkage
          </div>
          <div className="text-xl font-bold text-status-error-base mt-2">{kpis.outShrinkage}%</div>

        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-status-success-softBackground p-4 rounded-xl border border-status-success-softBackground/50">
          <div className="text-status-success-textPrimary text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Users size={13} /> Active Logged (Avg)
          </div>

          <div className="text-xl font-bold text-status-success-base mt-1">{kpis.active}</div>

        </Card>

        <Card className="bg-neutral.card p-4 rounded-xl border border-neutral.border">
          <div className="text-neutral.textMuted text-[11px] font-bold uppercase tracking-wider">Active - Full Time</div>
          <div className="text-xl font-bold text-neutral.textPrimary mt-1">{kpis.activeFull}</div>
        </Card>

        <Card className="bg-neutral.card p-4 rounded-xl border border-neutral.border">
          <div className="text-neutral.textMuted text-[11px] font-bold uppercase tracking-wider">Active - Part Time</div>
          <div className="text-xl font-bold text-neutral.textPrimary mt-1">{kpis.activePartial}</div>
        </Card>
      </div>
    </>
  );
}




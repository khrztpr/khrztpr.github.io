import React from 'react';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  Calendar,
  Users
} from 'lucide-react';

function Card({ children, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default function KPICards({ kpis }) {
  return (
    <div className="space-y-4">

      {/* TOP ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

        <Card className="bg-[#526084] border border-[#233663] p-4 rounded-2xl shadow-sm text-[#FAF6F6]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAF6F6]/70">
            <ClipboardList size={13} className="text-[#FAF6F6]/70" />
            Opening HC
          </div>
          <div className="text-2xl font-bold mt-2 text-[#FAF6F6]">
            {kpis.openingFieldHC}
          </div>
        </Card>

        <Card className="bg-[#526084] border border-[#233663] p-4 rounded-2xl shadow-sm text-[#FAF6F6]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAF6F6]/70">
            <Clock size={13} className="text-[#CB1F23]" />
            Scheduled
          </div>
          <div className="text-2xl font-bold mt-2 text-[#FAF6F6]">
            {kpis.scheduled}
          </div>
        </Card>

        <Card className="bg-[#526084] border border-[#233663] p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAF6F6]/70">
            <AlertTriangle size={13} className="text-[#CB1F23]" />
            Absent / Late
          </div>
          <div className="text-2xl font-bold mt-2 text-[#CB1F23]">
            {kpis.absentLate}
          </div>
        </Card>

        <Card className="bg-[#526084] border border-[#233663] p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAF6F6]/70">
            <Calendar size={13} className="text-[#C65E50]" />
            Planned Leave
          </div>
          <div className="text-2xl font-bold mt-2 text-[#C65E50]">
            {kpis.plannedLeave}
          </div>
        </Card>

        <Card className="bg-[#526084] border border-[#233663] p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAF6F6]/70">
            <AlertTriangle size={13} className="text-[#CB1F23]" />
            Out Shrinkage
          </div>
          <div className="text-2xl font-bold mt-2 text-[#CB1F23]">
            {kpis.outShrinkage}%
          </div>
        </Card>

      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card className="bg-[#526084] border border-[#233663] p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAF6F6]/70">
            <Users size={13} className="text-[#FAF6F6]" />
            Active Logged (Avg)
          </div>
          <div className="text-2xl font-bold mt-2 text-[#FAF6F6]">
            {kpis.active}
          </div>
        </Card>

        <Card className="bg-[#526084] border border-[#233663] p-4 rounded-2xl shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FAF6F6]/70">
            Active - Full Time
          </div>
          <div className="text-2xl font-bold mt-2 text-[#FAF6F6]">
            {kpis.activeFull}
          </div>
        </Card>

        <Card className="bg-[#526084] border border-[#233663] p-4 rounded-2xl shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FAF6F6]/70">
            Active - Part Time
          </div>
          <div className="text-2xl font-bold mt-2 text-[#FAF6F6]">
            {kpis.activePartial}
          </div>
        </Card>

      </div>

    </div>
  );
}
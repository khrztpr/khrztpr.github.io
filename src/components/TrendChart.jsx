import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function TrendChart({ chartData }) {
  const gridStroke = '#E2E8F0';
  const axisStroke = '#64748B';

  return (
    <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-sm border border-[#E2E8F0]">
      <h2 className="text-base font-bold text-[#0F172A] mb-4">Shift Movements Trend View</h2>
      <div className="w-full h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-[#64748B] border border-dashed border-[#E2E8F0] rounded-lg bg-[#FFFFFF]">
            <AlertCircle size={18} className="mb-2" />
            No parameters matches for the selected data range variables.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" stroke={axisStroke} fontSize={11} />
              <YAxis stroke={axisStroke} fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" name="Scheduled" dataKey="scheduled" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" name="Absent / Late" dataKey="absentLate" stroke="#0EA5E9" strokeWidth={2} />
              <Line type="monotone" name="Planned Leave" dataKey="plannedLeave" stroke="#4F46E5" strokeWidth={2} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}


import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function TrendChart({ chartData }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h2 className="text-base font-bold text-slate-800 mb-4">Shift Movements Trend View</h2>
      <div className="w-full h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50">
            <AlertCircle size={18} className="mb-2" />
            No parameters matches for the selected data range variables.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" name="Scheduled" dataKey="scheduled" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" name="Absent / Late" dataKey="absentLate" stroke="#e11d48" strokeWidth={2} />
              <Line type="monotone" name="Planned Leave" dataKey="plannedLeave" stroke="#d97706" strokeWidth={2} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}


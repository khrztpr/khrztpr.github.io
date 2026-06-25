import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { designTokens } from '../designTokens';

export default function TrendChart({ chartData }) {
  const gridStroke = designTokens.neutral.border;
  const axisStroke = designTokens.neutral.textMuted;

  return (
    <div className="bg-neutral.card p-6 rounded-xl shadow-sm border border-neutral.border">
      <h2 className="text-base font-bold text-neutral.textPrimary mb-4">Shift Movements Trend View</h2>
      <div className="w-full h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-neutral.textMuted border border-dashed border-neutral.border rounded-lg bg-neutral.card">
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
              <Line type="monotone" name="Scheduled" dataKey="scheduled" stroke={designTokens.secondary.charts.blue} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" name="Absent / Late" dataKey="absentLate" stroke={designTokens.secondary.charts.cyan} strokeWidth={2} />
              <Line type="monotone" name="Planned Leave" dataKey="plannedLeave" stroke={designTokens.secondary.charts.indigo} strokeWidth={2} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}




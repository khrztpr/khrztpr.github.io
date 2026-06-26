import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function TrendChart({ chartData }) {
  const gridStroke = '#526084';
  const axisStroke = '#FAF6F6';

  const tooltipStyle = {
    backgroundColor: '#526084',
    border: '1px solid #233663',
    borderRadius: '12px',
    color: '#FAF6F6'
  };

  return (
    <div className="bg-[#526084] p-6 rounded-2xl border border-[#233663] shadow-sm text-[#FAF6F6]">
      <h2 className="text-base font-bold mb-4 text-[#FAF6F6]">
        Shift Movements Trend View
      </h2>

      <div className="w-full h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-[#FAF6F6]/60 border border-dashed border-[#233663] rounded-lg bg-[#526084]">
            <AlertCircle size={18} className="mb-2 text-[#CB1F23]" />
            No data available for selected range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />

              <XAxis
                dataKey="name"
                stroke={axisStroke}
                fontSize={11}
              />

              <YAxis
                stroke={axisStroke}
                fontSize={11}
              />

              <Tooltip contentStyle={tooltipStyle} />

              <Legend wrapperStyle={{ color: '#FAF6F6' }} />

              {/* Primary line (Scheduled) */}
              <Line
                type="monotone"
                name="Scheduled"
                dataKey="scheduled"
                stroke="#CB1F23"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#CB1F23' }}
              />

              {/* Secondary (Absent / Late) */}
              <Line
                type="monotone"
                name="Absent / Late"
                dataKey="absentLate"
                stroke="#C65E50"
                strokeWidth={2}
                dot={{ r: 2, fill: '#C65E50' }}
              />

              {/* Tertiary (Planned Leave) */}
              <Line
                type="monotone"
                name="Planned Leave"
                dataKey="plannedLeave"
                stroke="#FAF6F6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2, fill: '#FAF6F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
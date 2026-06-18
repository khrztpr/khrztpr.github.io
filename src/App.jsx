import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, BarChart3, Users, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';

// Mock Data for the Dashboard Chart
const data = [
  { name: 'Jan', Sales: 4000, Users: 2400 },
  { name: 'Feb', Sales: 3000, Users: 1398 },
  { name: 'Mar', Sales: 2000, Users: 9800 },
  { name: 'Apr', Sales: 2780, Users: 3908 },
  { name: 'May', Sales: 1890, Users: 4800 },
  { name: 'Jun', Sales: 2390, Users: 3800 },
];

export default function App() {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-5 text-xl font-bold border-b border-slate-800 tracking-wider flex items-center gap-2">
          <LayoutDashboard className="text-emerald-400" /> CoreDash
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-emerald-600 rounded-lg text-white font-medium transition">
            <LayoutDashboard size={20} /> Overview
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <BarChart3 size={20} /> Analytics
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <Users size={20} /> Customers
          </a>
        </nav>
        <div className="p-4 border-t border-slate-800 text-sm text-slate-500 text-center">
          v1.0.0 — 2026
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Welcome back, here is your daily summary.</p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition">
            Export Report
          </button>
        </header>

        {/* METRIC CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">$48,259.00</h3>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                <ArrowUpRight size={14} /> +12.5% MoM
              </span>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={24} /></div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Users</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">12,492</h3>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                <ArrowUpRight size={14} /> +8.2% This week
              </span>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={24} /></div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">2.4%</h3>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                <ArrowUpRight size={14} /> +4.1% MoM
              </span>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><TrendingUp size={24} /></div>
          </div>

        </div>

        {/* CHART SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Performance Overview</h2>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="Sales" stroke="#059669" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Users" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
}
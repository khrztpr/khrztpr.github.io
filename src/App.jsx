import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LayoutDashboard, Users, ClipboardList, Clock, AlertTriangle, Calendar, Loader2, AlertCircle, Car, Settings, Layers } from 'lucide-react';

// --- CONFIGURATION & ENDPOINTS ---
const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRexxgM8lPBkDswjt5dR1yFTr07PW_g8X1xew6IddOjj6LkXs6SRkZoh-c6jQjHNvfsMUeY-qMSdRxX/pub?output=csv';

const GIDS = {
  Schedules: '1181372232',
  Roster: '1054794668',
  Leaves: '618864387'
};

// --- CORE UTILITY HELPER FUNCTIONS ---
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
};

// Helper to check if a target date string falls inside a calendar range inclusively
const isDateInRange = (dateStr, startStr, endStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;
  
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

// Helper to offset dates easily for range selection
const offsetDateString = (baseDateStr, daysOffset) => {
  const d = new Date(baseDateStr);
  if (isNaN(d)) return baseDateStr;
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};


// ==========================================
// 1. PAGE MODULE: HEADCOUNT DASHBOARD
// ==========================================
function HeadcountDashboardPage({ rawMetricsData, loading }) {
  const [rangeMode, setRangeMode] = useState('single'); // Options: 'single', 'weekly', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartData, setChartData] = useState([]);
  const [kpis, setKpis] = useState({
    openingFieldHC: 0,
    active: 0,
    activeFull: 0,
    activePartial: 0,
    scheduled: 0,
    absentLate: 0,
    plannedLeave: 0,
    inShrinkage: 0,
    outShrinkage: 0
  });

  // Set initial default dates when raw data lands
  useEffect(() => {
    if (rawMetricsData && rawMetricsData.length > 0) {
      const latestAvailableDate = rawMetricsData[rawMetricsData.length - 1].name;
      setStartDate(latestAvailableDate);
      setEndDate(latestAvailableDate);
    }
  }, [rawMetricsData]);

  // Adjust input configurations dynamically based on Range Mode selected
  useEffect(() => {
    if (!startDate || rawMetricsData.length === 0) return;

    if (rangeMode === 'single') {
      setEndDate(startDate);
    } else if (rangeMode === 'weekly') {
      // Set to a clean 7-day period span starting from the selected date
      setEndDate(offsetDateString(startDate, 6));
    }
  }, [rangeMode, startDate]);

  // Filter trend lines and compute absolute metrics relative to the current selected date range
  useEffect(() => {
    if (!rawMetricsData || rawMetricsData.length === 0 || !startDate || !endDate) return;

    // Filter timeline objects within date bounds
    const filteredDays = rawMetricsData.filter(item => isDateInRange(item.name, startDate, endDate));
    setChartData(filteredDays);

    // Compute range-aware Key Performance Indicators (KPIs)
    if (filteredDays.length === 0) {
      setKpis({ openingFieldHC: 0, active: 0, activeFull: 0, activePartial: 0, scheduled: 0, absentLate: 0, plannedLeave: 0, inShrinkage: 0, outShrinkage: 0 });
      return;
    }

    let totalOpening = 0, totalActive = 0, totalFull = 0, totalPartial = 0;
    let totalScheduled = 0, totalAbsent = 0, totalLeave = 0, totalInShrink = 0;

    filteredDays.forEach(day => {
      totalOpening += day.openingFieldHC;
      totalActive += day.active;
      totalFull += day.activeFull;
      totalPartial += day.activePartial;
      totalScheduled += day.scheduled;
      totalAbsent += day.absentLate;
      totalLeave += day.plannedLeave;
      totalInShrink += day.inShrinkage;
    });

    const count = filteredDays.length;
    
    // For counts we take the average across the range, for shrinkage we calculate across range totals
    setKpis({
      openingFieldHC: Math.round(totalOpening / count),
      active: Math.round(totalActive / count),
      activeFull: Math.round(totalFull / count),
      activePartial: Math.round(totalPartial / count),
      scheduled: Math.round(totalScheduled / count),
      absentLate: Math.round(totalAbsent / count),
      plannedLeave: Math.round(totalLeave / count),
      inShrinkage: Math.round(totalInShrink / count),
      outShrinkage: totalScheduled > 0 ? Number(((totalAbsent + totalLeave) / totalScheduled * 100).toFixed(1)) : 0
    });

  }, [startDate, endDate, rangeMode, rawMetricsData]);

  return (
    <div className="space-y-6">
      
      {/* HEADER & COMPACT INTERACTIVE DATE SELECTOR PANEL */}
      <header className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Operational Headcount Analytics</h1>
            <p className="text-slate-500 text-sm">Interactive control matrix showing KPIs calculated specifically for selected dates.</p>
          </div>

          {/* INTERVAL SELECTOR BUTTONS */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
            <button
              onClick={() => setRangeMode('single')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${rangeMode === 'single' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Single Day
            </button>
            <button
              onClick={() => setRangeMode('weekly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${rangeMode === 'weekly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              7-Day Range
            </button>
            <button
              onClick={() => setRangeMode('custom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${rangeMode === 'custom' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* INPUT CALENDAR DATES */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1"><Calendar size={16}/> {rangeMode === 'custom' ? 'Start Date:' : 'Target Date:'}</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-200 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
            />
          </div>

          {rangeMode === 'custom' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">End Date:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-200 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
              />
            </div>
          )}

          {rangeMode === 'weekly' && endDate && (
            <div className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              Auto-calculating timeframe span through: <strong className="text-slate-700">{endDate}</strong>
            </div>
          )}
        </div>
      </header>

      {/* SEPARATE INDIVIDUAL KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><ClipboardList size={13}/> Opening HC</div>
          <div className="text-xl font-bold text-slate-800 mt-2">{kpis.openingFieldHC}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={13}/> Scheduled</div>
          <div className="text-xl font-bold text-blue-600 mt-2">{kpis.scheduled}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={13} className="text-rose-500" /> Absent/Late</div>
          <div className="text-xl font-bold text-rose-600 mt-2">{kpis.absentLate}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><Calendar size={13} className="text-amber-500"/> Planned Leave</div>
          <div className="text-xl font-bold text-amber-600 mt-2">{kpis.plannedLeave}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 col-span-2 md:col-span-1">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={13}/> Out Shrinkage</div>
          <div className="text-xl font-bold text-rose-700 mt-2">{kpis.outShrinkage}%</div>
        </div>
      </div>

      {/* COMPACT ROSTER SUB-METRICS SPECIFICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60">
          <div className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><Users size={13}/> Active Logged (Avg)</div>
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

      {/* TREND GRAPH — ISOLATED SPECIFICALLY TO: SCHEDULED, ABSENT, PLANNED LEAVE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-base font-bold text-slate-800 mb-4">Shift Movements Trend View</h2>
        <div className="w-full h-80">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50">
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
    </div>
  );
}

// ==========================================
// 2. PAGE MODULE: VEHICLES
// ==========================================
function VehiclesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Vehicles & Fleet Management</h1>
        <p className="text-slate-500 text-sm mt-1">Isolating Fleet metrics hooked via GID 554899445.</p>
      </header>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center text-slate-400 text-sm">
        Vehicle tracking module ready for metric array filters.
      </div>
    </div>
  );
}

// ==========================================
// 3. PAGE MODULE: SETTINGS
// ==========================================
function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">System Dashboard Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage pipeline filters, thresholds, and refresh rates.</p>
      </header>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center text-slate-400 text-sm">
        Global application infrastructure adjustments workspace.
      </div>
    </div>
  );
}


// ==========================================
// MAIN ROOT APP CONTAINER
// ==========================================
export default function App() {
  const [currentPage, setCurrentPage] = useState('headcount');
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${BASE_URL}&gid=${GIDS.Schedules}`).then(res => { if(!res.ok) throw new Error(); return res.text(); }),
      fetch(`${BASE_URL}&gid=${GIDS.Roster}`).then(res => { if(!res.ok) throw new Error(); return res.text(); }),
      fetch(`${BASE_URL}&gid=${GIDS.Leaves}`).then(res => { if(!res.ok) throw new Error(); return res.text(); })
    ])
    .then(([schedulesCsv, rosterCsv, leavesCsv]) => {
      const schedules = parseCSV(schedulesCsv);
      const roster = parseCSV(rosterCsv);
      const leaves = parseCSV(leavesCsv);

      const schedHeaders = schedules[0].reduce((acc, cur, i) => ({ ...acc, [cur.toLowerCase().trim()]: i }), {});
      const rosterHeaders = roster[0].reduce((acc, cur, i) => ({ ...acc, [cur.toLowerCase().trim()]: i }), {});
      const leavesHeaders = leaves[0].reduce((acc, cur, i) => ({ ...acc, [cur.toLowerCase().trim()]: i }), {});

      const dateIdx = schedHeaders['date'];
      if (dateIdx === undefined) throw new Error("Header labeled 'Date' was not identified inside Schedules.");
      
      const uniqueDates = Array.from(new Set(schedules.slice(1).map(row => row[dateIdx]).filter(Boolean))).sort();

      const computedTimeline = uniqueDates.map(targetDate => {
        
        const openingFieldHC = schedules.slice(1).filter(row => {
          return row[schedHeaders['date']] === targetDate && 
                 !!row[schedHeaders['area']] && 
                 !row[schedHeaders['notes on clock in']] && 
                 row[schedHeaders['role']] !== 'Closer';
        }).length;

        const active = roster.slice(1).filter(row => row[rosterHeaders['employment status']] === 'Active').length;
        const activeFull = roster.slice(1).filter(row => row[rosterHeaders['employment status']] === 'Active' && row[rosterHeaders['type']] === 'Full Time').length;
        const activePartial = roster.slice(1).filter(row => row[rosterHeaders['employment status']] === 'Active' && row[rosterHeaders['type']] === 'Part Time').length;

        const scheduled = schedules.slice(1).filter(row => {
          return row[schedHeaders['date']] === targetDate && !!row[schedHeaders['area']] && !row[schedHeaders['notes on clock in']];
        }).length;

        const absentLate = schedules.slice(1).filter(row => {
          const status = (row[schedHeaders['status']] || '').toLowerCase();
          return row[schedHeaders['date']] === targetDate && !!row[schedHeaders['area']] && (status.includes('absent') || status.includes('late'));
        }).length;

        const plannedLeave = leaves.slice(1).filter(row => {
          const val = row[leavesHeaders['value']];
          return row[leavesHeaders['date']] === targetDate && !!row[leavesHeaders['area']] && val !== '0' && val !== '';
        }).length;

        const inShrinkage = 0;
        const outShrinkage = scheduled > 0 ? ((absentLate + plannedLeave) / scheduled) * 100 : 0;

        return {
          name: targetDate,
          openingFieldHC,
          active,
          activeFull,
          activePartial,
          scheduled,
          absentLate,
          plannedLeave,
          inShrinkage,
          outShrinkage: Number(outShrinkage.toFixed(1))
        };
      });

      setMetricsData(computedTimeline);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError("Data pipeline calculation error. Verify columns inside sub-sheets perfectly match expected formula criteria terms.");
      setLoading(false);
    });
  }, []);

  const renderView = () => {
    switch (currentPage) {
      case 'headcount':
        return <HeadcountDashboardPage rawMetricsData={metricsData} loading={loading} />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <div className="p-6">View missing.</div>;
    }
  };

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <AlertCircle size={44} className="text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800">Pipeline Pipeline Extraction Breakdown</h2>
        <p className="text-slate-500 text-sm max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* SIDEBAR COMPONENT */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-5 text-xl font-bold border-b border-slate-800 tracking-wider flex items-center gap-2">
          <Layers className="text-emerald-400" size={22} /> MatrixEngine
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
            <Car size={18} /> Fleet Log (554899)
          </button>

          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${currentPage === 'settings' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={18} /> Engine Rules Settings
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-600 text-center font-medium tracking-wider">v2.1.0 — 2026</div>
      </aside>

      {/* MAIN LAYOUT VIEWPORT */}
      <main className="flex-1 overflow-y-auto p-8">
        {loading && currentPage === 'headcount' ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-emerald-500" size={36} />
            <p className="text-sm font-medium">Extracting raw CSV matrices...</p>
          </div>
        ) : renderView()}
      </main>

    </div>
  );
}

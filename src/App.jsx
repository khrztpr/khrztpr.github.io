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

const getWeekNumber = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date)) return 'Unknown Week';
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
  return `Wk ${Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7)} - ${date.getFullYear()}`;
};

const getMonthName = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date)) return 'Unknown Month';
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
};


// ==========================================
// 1. PAGE MODULE: HEADCOUNT DASHBOARD
// ==========================================
function HeadcountDashboardPage({ rawMetricsData, latest, loading }) {
  const [timeframe, setTimeframe] = useState('daily');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (!rawMetricsData || rawMetricsData.length === 0) return;

    if (timeframe === 'daily') {
      setFilteredData(rawMetricsData);
      return;
    }

    const groups = {};

    rawMetricsData.forEach(item => {
      const groupKey = timeframe === 'weekly' ? getWeekNumber(item.name) : getMonthName(item.name);

      if (!groups[groupKey]) {
        groups[groupKey] = { name: groupKey, openingFieldHC: 0, scheduled: 0, absentLate: 0, plannedLeave: 0, outShrinkage: 0, count: 0 };
      }

      groups[groupKey].openingFieldHC += item.openingFieldHC;
      groups[groupKey].scheduled += item.scheduled;
      groups[groupKey].absentLate += item.absentLate;
      groups[groupKey].plannedLeave += item.plannedLeave;
      groups[groupKey].outShrinkage += item.outShrinkage;
      groups[groupKey].count += 1;
    });

    const aggregatedTimeline = Object.values(groups).map(g => ({
      name: g.name,
      openingFieldHC: Math.round(g.openingFieldHC / g.count),
      scheduled: Math.round(g.scheduled / g.count),
      absentLate: Math.round(g.absentLate / g.count),
      plannedLeave: Math.round(g.plannedLeave / g.count),
      outShrinkage: Number((g.outShrinkage / g.count).toFixed(1))
    }));

    setFilteredData(aggregatedTimeline);
  }, [timeframe, rawMetricsData]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH TIMEFRAME SWITCHER */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Operational Headcount Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Calculated metrics dynamically driven by cross-sheet criteria rules.</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-center border border-slate-200">
          {['daily', 'weekly', 'monthly'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition capitalize ${timeframe === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* METRIC CARD HIGHLIGHTS (LATEST DATE AVAILABLE) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1"><ClipboardList size={14}/> Opening Field HC</div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{latest?.openingFieldHC ?? 0}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1"><Users size={14}/> Active (Full / Part)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{latest?.activeFull ?? 0} <span className="text-slate-300 font-normal text-lg">/</span> {latest?.activePartial ?? 0}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1"><Clock size={14}/> Scheduled Force</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{latest?.scheduled ?? 0}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-1"><AlertTriangle size={14}/> Out Shrinkage</div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{latest?.outShrinkage ?? 0}%</div>
        </div>
      </div>

      {/* RECHARTS CHART AXIS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4 capitalize">{timeframe} Operational Performance Trends</h2>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" name="Opening HC" dataKey="openingFieldHC" stroke="#64748b" strokeWidth={2} />
              <Line type="monotone" name="Scheduled Units" dataKey="scheduled" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" name="Absent / Late" dataKey="absentLate" stroke="#e11d48" strokeWidth={2} />
              <Line type="monotone" name="Planned Leave" dataKey="plannedLeave" stroke="#b45309" strokeWidth={1.5} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EXPANDED BREAKDOWN TABLE FROM FORMULA PARAMETERS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Operational Specifics (Current Snapshot Data)</h3>
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium">As of: {latest?.name || 'N/A'}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 p-6 gap-6 text-sm">
          <div><span className="text-slate-400 block mb-0.5">Total Active Logged:</span> <strong className="text-slate-800 text-lg block">{latest?.active ?? 0}</strong></div>
          <div><span className="text-slate-400 block mb-0.5">Active - Full Time:</span> <strong className="text-slate-800 text-lg block">{latest?.activeFull ?? 0}</strong></div>
          <div><span className="text-slate-400 block mb-0.5">Active - Part Time:</span> <strong className="text-slate-800 text-lg block">{latest?.activePartial ?? 0}</strong></div>
          <div><span className="text-slate-400 block mb-0.5">Absent / Late Count:</span> <strong className="text-rose-600 text-lg block">{latest?.absentLate ?? 0}</strong></div>
          <div><span className="text-slate-400 block mb-0.5">Planned Leaves:</span> <strong className="text-amber-700 text-lg block">{latest?.plannedLeave ?? 0}</strong></div>
          <div><span className="text-slate-400 block mb-0.5">In Shrinkage Target:</span> <strong className="text-slate-400 text-lg block">{latest?.inShrinkage ?? 0}</strong></div>
          <div><span className="text-slate-400 block mb-0.5">Computed Out Shrinkage:</span> <strong className="text-rose-600 text-lg block">{latest?.outShrinkage ?? 0}%</strong></div>
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

    // Fetch live sub-sheets from your public stream endpoints
    Promise.all([
      fetch(`${BASE_URL}&gid=${GIDS.Schedules}`).then(res => { if(!res.ok) throw new Error(); return res.text(); }),
      fetch(`${BASE_URL}&gid=${GIDS.Roster}`).then(res => { if(!res.ok) throw new Error(); return res.text(); }),
      fetch(`${BASE_URL}&gid=${GIDS.Leaves}`).then(res => { if(!res.ok) throw new Error(); return res.text(); })
    ])
    .then(([schedulesCsv, rosterCsv, leavesCsv]) => {
      const schedules = parseCSV(schedulesCsv);
      const roster = parseCSV(rosterCsv);
      const leaves = parseCSV(leavesCsv);

      // Convert header titles to string references for safer object mapping loops
      const schedHeaders = schedules[0].reduce((acc, cur, i) => ({ ...acc, [cur.toLowerCase().trim()]: i }), {});
      const rosterHeaders = roster[0].reduce((acc, cur, i) => ({ ...acc, [cur.toLowerCase().trim()]: i }), {});
      const leavesHeaders = leaves[0].reduce((acc, cur, i) => ({ ...acc, [cur.toLowerCase().trim()]: i }), {});

      // Extract operational processing date ranges from Schedule matrix data
      const dateIdx = schedHeaders['date'];
      if (dateIdx === undefined) throw new Error("Header labeled 'Date' was not identified inside Schedules.");
      
      const uniqueDates = Array.from(new Set(schedules.slice(1).map(row => row[dateIdx]).filter(Boolean))).sort();

      // EXECUTE MATRIX CALCULATIONS ON ALL UNIQUE DATES FOUND
      const computedTimeline = uniqueDates.map(targetDate => {
        
        // 1. Opening Field HC Calculation
        const openingFieldHC = schedules.slice(1).filter(row => {
          return row[schedHeaders['date']] === targetDate && 
                 !!row[schedHeaders['area']] && 
                 !row[schedHeaders['notes on clock in']] && 
                 row[schedHeaders['role']] !== 'Closer';
        }).length;

        // 2. Active Count Calculation
        const active = roster.slice(1).filter(row => row[rosterHeaders['employment status']] === 'Active').length;

        // 3. Active - Full Time
        const activeFull = roster.slice(1).filter(row => row[rosterHeaders['employment status']] === 'Active' && row[rosterHeaders['type']] === 'Full Time').length;

        // 4. Active - Part Time
        const activePartial = roster.slice(1).filter(row => row[rosterHeaders['employment status']] === 'Active' && row[rosterHeaders['type']] === 'Part Time').length;

        // 5. Scheduled Count
        const scheduled = schedules.slice(1).filter(row => {
          return row[schedHeaders['date']] === targetDate && !!row[schedHeaders['area']] && !row[schedHeaders['notes on clock in']];
        }).length;

        // 6. Absent / Late Count
        const absentLate = schedules.slice(1).filter(row => {
          const status = (row[schedHeaders['status']] || '').toLowerCase();
          return row[schedHeaders['date']] === targetDate && !!row[schedHeaders['area']] && (status.includes('absent') || status.includes('late'));
        }).length;

        // 7. Planned Leave Calculation
        const plannedLeave = leaves.slice(1).filter(row => {
          const val = row[leavesHeaders['value']];
          return row[leavesHeaders['date']] === targetDate && !!row[leavesHeaders['area']] && val !== '0' && val !== '';
        }).length;

        // 8. In Shrinkage (Placeholder)
        const inShrinkage = 0;

        // 9. Out Shrinkage Evaluation Formula: (Absent + Planned Leave) / Scheduled
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

  // Switches display layouts conditionally
  const renderView = () => {
    switch (currentPage) {
      case 'headcount':
        return <HeadcountDashboardPage rawMetricsData={metricsData} latest={metricsData[metricsData.length - 1]} loading={loading} />;
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
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-600 text-center font-medium tracking-wider">v2.0.0 — 2026</div>
      </aside>

      {/* RENDER TARGET LAYOUT VIEW */}
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

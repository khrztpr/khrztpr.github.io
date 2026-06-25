import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LayoutDashboard, Users, ClipboardList, Clock, AlertTriangle, Calendar, Loader2, AlertCircle, Car, Settings, Layers, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from './auth/authService';
// --- CONFIGURATION & ENDPOINTS ---
const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRexxgM8lPBkDswjt5dR1yFTr07PW_g8X1xew6IddOjj6LkXs6SRkZoh-c6jQjHNvfsMUeY-qMSdRxX/pub?output=csv';

const GIDS = {
  Schedules: '1181372232',
  Roster: '1054794668',
  Leaves: '618864387'
};

// Canonical area mapping: raw sheet codes -> normalized display name
const AREA_MAP = {
  'SAC SOUTH': 'South Sacramento',
  'FRESNO': 'Fresno',
  'SOL/COCO': 'Solano/Contra Costa',
  'SFO': 'San Francisco',
  'SCC': 'Santa Clara',
  'SAC NORTH': 'North Sacramento',
  'SCC ONLOK': 'Santa Clara Onlok',
  'ALC': 'Alameda',
  'BLS': 'BLS',
  'SONOMA': 'Sonoma',
  'SF ONLOK': 'San Francisco Onlok',
  'LLC (from sac south)': 'South Sacramento LLC',
  'SOCAL': 'South California',
  'HQ': 'Headquarters',
  'ALC ONLOK': 'Alameda Onlok',
  'LLC': 'LLC',
  'SAN DIEGO': 'San Diego',
  'SAN NORTH': 'North Sacramento'
};

// Tooltip-friendly mapping string for UI hints
const AREA_MAP_TOOLTIP = Object.entries(AREA_MAP).map(([k, v]) => `${k} → ${v}`).join('; ');

// Simple Levenshtein distance for fuzzy matching
const levenshtein = (a, b) => {
  const al = a.length, bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const dp = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[al][bl];
};

// Normalize area using canonical map; fall back to fuzzy match for small typos
const normalizeArea = (raw) => {
  if (raw === undefined || raw === null) return '';
  const key = String(raw || '').trim();
  if (key === '') return '';

  // simple memoization cache to avoid repeated expensive fuzzy computations
  if (!normalizeArea._cache) normalizeArea._cache = new Map();
  if (normalizeArea._cache.has(key)) return normalizeArea._cache.get(key);

  const up = key.toUpperCase();
  if (AREA_MAP[up]) {
    normalizeArea._cache.set(key, AREA_MAP[up]);
    return AREA_MAP[up];
  }

  // try direct match to normalized values
  for (const v of Object.values(AREA_MAP)) {
    if (v.toUpperCase() === up) {
      normalizeArea._cache.set(key, v);
      return v;
    }
  }

  // fuzzy match against AREA_MAP keys
  let best = { key: null, dist: Infinity };
  for (const candidate of Object.keys(AREA_MAP)) {
    const dist = levenshtein(up, candidate.toUpperCase());
    if (dist < best.dist) best = { key: candidate, dist };
  }
  // allow small typos: threshold 2 or 20% of length
  if (best.key && (best.dist <= 2 || best.dist <= Math.floor(up.length * 0.2))) {
    const mapped = AREA_MAP[best.key];
    normalizeArea._cache.set(key, mapped);
    return mapped;
  }

  normalizeArea._cache.set(key, key);
  return key;
};

// --- CORE UTILITY HELPER FUNCTIONS ---
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
};

const parseDate = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  let parsed;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    // treat bare YYYY-MM-DD as local date (avoid implicit UTC parsing differences)
    const [y, m, d] = trimmed.split('-').map(Number);
    parsed = new Date(y, m - 1, d);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [a, b, c] = trimmed.split('/').map(Number);
    if (a > 12) {
      parsed = new Date(c, b - 1, a);
    } else {
      parsed = new Date(c, a - 1, b);
    }
  } else {
    parsed = new Date(trimmed);
  }

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatAsIsoDate = (value) => {
  const date = parseDate(value);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDay = (value, target) => {
  const dateValue = parseDate(value);
  const dateTarget = parseDate(target);
  if (!dateValue || !dateTarget) return false;
  return dateValue.getFullYear() === dateTarget.getFullYear()
    && dateValue.getMonth() === dateTarget.getMonth()
    && dateValue.getDate() === dateTarget.getDate();
};

const isOnOrBefore = (value, target) => {
  const dateValue = parseDate(value);
  const dateTarget = parseDate(target);
  return dateValue && dateTarget ? dateValue <= dateTarget : false;
};

// Helper to check if a target date string falls inside a calendar range inclusively
const isDateInRange = (dateStr, startStr, endStr) => {
  if (!dateStr) return false;
  const d = parseDate(dateStr);
  const start = startStr ? parseDate(startStr) : null;
  const end = endStr ? parseDate(endStr) : null;
  
  if (!d) return false;
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

// Helper to offset dates easily for range selection
const offsetDateString = (baseDateStr, daysOffset) => {
  const base = parseDate(baseDateStr);
  if (!base) return baseDateStr;
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + daysOffset);
  return formatAsIsoDate(d);
};

// ==========================================
// 1. PAGE MODULE: HEADCOUNT DASHBOARD
// ==========================================
function HeadcountDashboardPage({
  rawMetricsData,
  loading,
  areaOptions,
  selectedArea,
  onAreaChange,
  areaReadonly,
  areaReadOnlyLabel
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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

  const datePickerRef = useRef(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const todayIso = new Date().toISOString().split('T')[0];
  const clampToMaxDate = (value) => {
    if (!value) return '';
    return value > todayIso ? todayIso : value;
  };

  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (datePickerOpen && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [datePickerOpen]);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.warn('logout failed', err);
    }
    setLoggingOut(false);
    navigate('/login', { replace: true });
  }

  // Set initial default dates when raw data lands
  useEffect(() => {
    if (rawMetricsData && rawMetricsData.length > 0) {
      const latestAvailableDate = rawMetricsData[rawMetricsData.length - 1].name;
      const initialDate = latestAvailableDate > todayIso ? todayIso : latestAvailableDate;
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
  }, [rawMetricsData, todayIso]);

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

  }, [startDate, endDate, rawMetricsData]);

  return (
    <div className="space-y-6">
      {/* HEADER & COMPACT INTERACTIVE DATE SELECTOR PANEL */}
      <header className="bg-white/95 p-7 rounded-[32px] shadow-[0_30px_80px_-45px_rgba(15,23,42,0.18)] border border-slate-200/80 backdrop-blur-xl space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Operational Headcount Analytics</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Select a range and see the dashboard update instantly with KPIs and trends.</p>
            </div>
          </div>

        </div>

        {/* DATE RANGE SELECTOR */}
        <div className="relative pt-2 border-t border-slate-200 text-sm">
          <button
            type="button"
            onClick={() => setDatePickerOpen((open) => !open)}
            className="inline-flex items-center gap-3 rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-3 text-slate-900 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.35)] transition duration-200 hover:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.35)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <Calendar size={18} />
            <span className="text-sm font-medium">Select date range</span>
          </button>
          {startDate && endDate && (
            <span className="ml-3 inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200">
              {startDate} → {endDate}
            </span>
          )}

          {areaReadonly ? (
            <div className="ml-4 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Area</span>
              <span className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-900 font-medium">{areaReadOnlyLabel || selectedArea}</span>
            </div>
          ) : (
            <label className="ml-4 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Area</span>
              <select
                value={selectedArea}
                onChange={(e) => onAreaChange(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              >
                {areaOptions.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </label>
          )}
          <div className="mt-2 ml-4 text-xs text-slate-500" title={AREA_MAP_TOOLTIP}>
            Area labels are normalized for display (hover to see mappings).
          </div>

          {datePickerOpen && (
            <div ref={datePickerRef} className="absolute left-0 z-20 mt-4 w-full max-w-sm rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5">
              <div className="grid gap-4">
                <label className="space-y-2 text-xs text-slate-500">
                  From
                  <input
                    type="date"
                    value={startDate}
                    max={todayIso}
                    onChange={(e) => {
                      const nextStart = clampToMaxDate(e.target.value);
                      setStartDate(nextStart);
                      if (!endDate) setEndDate(nextStart);
                    }}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="space-y-2 text-xs text-slate-500">
                  To
                  <input
                    type="date"
                    value={endDate}
                    max={todayIso}
                    onChange={(e) => {
                      const nextEnd = clampToMaxDate(e.target.value);
                      setEndDate(nextEnd);
                      if (!startDate) setStartDate(nextEnd);
                    }}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(false)}
                  className="mt-1 inline-flex justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
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
  const [areaLoading, setAreaLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [rosterRows, setRosterRows] = useState([]);
  const [leaveRows, setLeaveRows] = useState([]);
  const [areaOptions, setAreaOptions] = useState(['All Areas']);
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [sidebarLoggingOut, setSidebarLoggingOut] = useState(false);
  const firstComputeRef = useRef(true);
  const navigate = useNavigate();

// enforce area restriction for non-admin users and keep email for sidebar
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUserEmail(u?.email || '');

      // Default: allow area changes (admin or not loaded yet)
      if (!u) {
        setAreaOptions(['All Areas']);
        setSelectedArea('All Areas');
        return;
      }

      // Lock area for non-admins (selectedArea must always match users/{uid}.area)
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const data = snap.exists() ? snap.data() : null;

          if (data?.role && data.role !== 'admin') {
            const areaName = data?.area || null;
            if (areaName) {
              setAreaOptions([areaName]);
              setSelectedArea(areaName);
            } else {
              // If employee has no area set yet, keep a safe state.
              setAreaOptions(['All Areas']);
              setSelectedArea('All Areas');
            }
          }
        } catch (err) {
          console.warn('failed to enforce area restriction:', err);
        }
      })();
    });

    return () => unsub();
  }, []);

// prevent non-admins from changing the area filter client-side
  const [areaLock, setAreaLock] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAreaLock(null);
        setIsAdmin(false);
        setSelectedArea('All Areas');
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        const data = snap.exists() ? snap.data() : null;

        const role = data?.role || 'user';
        const area = data?.area || null;

        const nextIsAdmin = role === 'admin';
        setIsAdmin(nextIsAdmin);

        if (!nextIsAdmin && area) {
          setAreaLock(area);
          setSelectedArea(area);
        } else {
          setAreaLock(null);
          // keep selectedArea as-is (it will be validated once availableAreas is computed)
        }
      } catch (err) {
        console.warn('failed to compute area lock:', err);
        setAreaLock(null);
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  const handleAreaChange = (next) => {
    if (!isAdmin && areaLock) {
      // locked users can only view their DB area
      if (next !== areaLock) setSelectedArea(areaLock);
      return;
    }
    setSelectedArea(next);
  };



  async function onSidebarLogout() {
    setSidebarLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.warn('logout failed', err);
    }
    setSidebarLoggingOut(false);
    navigate('/login', { replace: true });
  }

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

      // Compute available area options based on what actually exists in the extracted data.
      const scheduleAreaIdx = schedules[0].findIndex(header => String(header || '').toLowerCase().trim() === 'area');
      if (scheduleAreaIdx === -1) throw new Error("Header labeled 'Area' was not identified inside Schedules.");

      const rosterHeaders = roster[0].map(h => String(h || '').toLowerCase().trim());
      const rosterLocationIdx = rosterHeaders.findIndex(h => h === 'work location name' || h === 'work location');

      const leavesAreaIdx = leaves[0].findIndex(header => String(header || '').toLowerCase().trim() === 'area');
      if (leavesAreaIdx === -1) throw new Error("Header labeled 'Area' was not identified inside Leaves.");

      const scheduleAreas = Array.from(new Set(
        schedules.slice(1)
          .map(row => normalizeArea(String(row[scheduleAreaIdx] || '').trim()))
          .filter(Boolean)
      ))
        .sort((a, b) => a.localeCompare(b));

      const rosterAreas = rosterLocationIdx === -1 ? [] : Array.from(new Set(
        roster.slice(1)
          .map(row => normalizeArea(String(row[rosterLocationIdx] || '').trim()))
          .filter(Boolean)
      ))
        .sort((a, b) => a.localeCompare(b));

      const leaveAreas = Array.from(new Set(
        leaves.slice(1)
          .map(row => normalizeArea(String(row[leavesAreaIdx] || '').trim()))
          .filter(Boolean)
      ))
        .sort((a, b) => a.localeCompare(b));

      const availableAreasSet = new Set([...scheduleAreas, ...rosterAreas, ...leaveAreas]);
      const availableAreas = Array.from(availableAreasSet).sort((a, b) => a.localeCompare(b));

      setScheduleRows(schedules);
      setRosterRows(roster);
      setLeaveRows(leaves);

      // Build dropdown options from available areas found in the extracted data.
      // If user is locked to a specific area, override options/selection accordingly.
      const areaOptionsNext = ['All Areas', ...availableAreas];
      setAreaOptions((prevOptions) => {
        if (areaLock && availableAreasSet.has(areaLock)) return [areaLock];
        return areaOptionsNext;
      });

      setSelectedArea((prev) => {
        // Locked users must always remain on their assigned area.
        if (areaLock) {
          return availableAreasSet.has(areaLock) ? areaLock : 'All Areas';
        }

        if (!prev) return 'All Areas';
        if (prev === 'All Areas') return 'All Areas';
        if (availableAreasSet.has(prev)) return prev;
        return 'All Areas';
      });

      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError("Data pipeline extraction error. Verify sheet columns match expected headers.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!scheduleRows.length || !rosterRows.length || !leaveRows.length) return;

    if (!firstComputeRef.current) {
      setAreaLoading(true);
    }

    try {
      const schedHeaders = scheduleRows[0].reduce((acc, cur, i) => ({ ...acc, [cur.toLowerCase().trim()]: i }), {});
      const rosterHeaders = rosterRows[0].reduce((acc, cur, i) => {
        const key = String(cur || '').toLowerCase().trim();
        if (!key || key === 'x') return acc;
        return { ...acc, [key]: i };
      }, {});
      const leavesHeaders = leaveRows[0].reduce((acc, cur, i) => ({ ...acc, [cur.toLowerCase().trim()]: i }), {});

      const dateIdx = schedHeaders['date'];
      if (dateIdx === undefined) throw new Error("Header labeled 'Date' was not identified inside Schedules.");
      const clockInCommentsIdx = schedHeaders['clock in comments'] ?? schedHeaders['notes on clock in'];
      const shiftLineIdx = schedHeaders['shift line'] ?? schedHeaders['role'];
      const scheduleAreaIdx = scheduleRows[0].findIndex(header => String(header || '').toLowerCase().trim() === 'area');
      if (scheduleAreaIdx === -1) throw new Error("Header labeled 'Area' was not identified inside Schedules.");
      const rosterDateIdx = rosterHeaders['start date as employee (non-contractor)'] ?? rosterHeaders['start date'] ?? rosterHeaders['date'];
      if (rosterDateIdx === undefined) throw new Error("Header labeled 'Start date as employee (non-contractor)' was not identified inside Roster.");
      const rosterEmploymentStatusIdx = rosterHeaders['employment status'];
      const rosterTypeIdx = rosterHeaders['type'];
      const rosterLocationIdx = rosterHeaders['work location name'] ?? rosterHeaders['work location'];
      if (rosterEmploymentStatusIdx === undefined) throw new Error("Header labeled 'Employment status' was not identified inside Roster.");
      if (rosterTypeIdx === undefined) throw new Error("Header labeled 'Type' was not identified inside Roster.");

      // Preprocess roster and leaves to normalized, lightweight objects to speed up repeated filters
      const rosterProcessed = rosterRows.slice(1).map(row => {
        const locationRaw = rosterLocationIdx !== undefined ? String(row[rosterLocationIdx] || '').trim() : '';
        const location = normalizeArea(locationRaw);
        const startIso = formatAsIsoDate(row[rosterDateIdx]);
        return {
          location,
          startIso,
          employmentStatus: String(row[rosterEmploymentStatusIdx] || '').trim(),
          type: String(row[rosterTypeIdx] || '').trim()
        };
      });

      const leaveProcessed = leaveRows.slice(1).map(row => {
        const dateIso = formatAsIsoDate(row[leavesHeaders['date']]);
        const area = normalizeArea(String(row[leavesHeaders['area']] || '').trim());
        const val = String(row[leavesHeaders['value']] || '').trim();
        return { dateIso, area, val };
      });

      // Group schedule rows by ISO date to avoid repeated full-table scans per date
      const dateToScheduleRows = {};
      scheduleRows.slice(1).forEach(row => {
        const iso = formatAsIsoDate(row[dateIdx]);
        if (!iso) return;
        if (!dateToScheduleRows[iso]) dateToScheduleRows[iso] = [];
        dateToScheduleRows[iso].push(row);
      });

      const uniqueDates = Object.keys(dateToScheduleRows).sort((a, b) => {
        const da = parseDate(a);
        const db = parseDate(b);
        if (!da || !db) return a.localeCompare(b);
        return da - db;
      });

      const computedTimeline = uniqueDates.map(targetDate => {
          const schedForDate = dateToScheduleRows[targetDate] || [];

          const openingFieldHC = schedForDate.filter(row => {
            const shiftLine = String(row[shiftLineIdx] || '').trim().toLowerCase();
            const scheduleAreaRaw = String(row[scheduleAreaIdx] || '').trim();
            const scheduleArea = normalizeArea(scheduleAreaRaw);
            const comments = String(row[clockInCommentsIdx] || '').trim();
            return isSameDay(row[dateIdx], targetDate) &&
                   scheduleArea !== '' &&
                   comments === '' &&
                   shiftLine !== 'closer' &&
                   (selectedArea === 'All Areas' || scheduleArea === selectedArea);
          }).length;

        const active = rosterProcessed.filter(r => {
          return r.employmentStatus === 'Active' &&
                 isOnOrBefore(r.startIso, targetDate) &&
                 (selectedArea === 'All Areas' || rosterLocationIdx === undefined || r.location === selectedArea);
        }).length;

        const activeFull = rosterProcessed.filter(r => {
          return r.employmentStatus === 'Active' &&
                 r.type === 'Full Time' &&
                 isOnOrBefore(r.startIso, targetDate) &&
                 (selectedArea === 'All Areas' || rosterLocationIdx === undefined || r.location === selectedArea);
        }).length;

        const activePartial = rosterProcessed.filter(r => {
          return r.employmentStatus === 'Active' &&
                 r.type === 'Part Time' &&
                 isOnOrBefore(r.startIso, targetDate) &&
                 (selectedArea === 'All Areas' || rosterLocationIdx === undefined || r.location === selectedArea);
        }).length;

        const scheduled = scheduleRows.slice(1).filter(row => {
          const scheduleAreaRaw = String(row[scheduleAreaIdx] || '').trim();
          const scheduleArea = normalizeArea(scheduleAreaRaw);
          const comments = String(row[clockInCommentsIdx] || '').trim();
          return isSameDay(row[dateIdx], targetDate) &&
                 scheduleArea !== '' &&
                 comments === '' &&
                 (selectedArea === 'All Areas' || scheduleArea === selectedArea);
        }).length;

        const absentLate = scheduleRows.slice(1).filter(row => {
          const statusSource = row[schedHeaders['status']] || row[clockInCommentsIdx] || '';
          const status = String(statusSource).toLowerCase();
          const scheduleAreaRaw = String(row[scheduleAreaIdx] || '').trim();
          const scheduleArea = normalizeArea(scheduleAreaRaw);
          return isSameDay(row[dateIdx], targetDate) &&
                 scheduleArea !== '' &&
                 (selectedArea === 'All Areas' || scheduleArea === selectedArea) &&
                 (status.includes('absent') || status.includes('late'));
        }).length;

        const plannedLeave = leaveProcessed.filter(l => {
          return l.dateIso === targetDate &&
                 l.area !== '' &&
                 l.val !== '0' &&
                 l.val !== '' &&
                 (selectedArea === 'All Areas' || l.area === selectedArea);
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
      if (firstComputeRef.current) {
        setLoading(false);
        firstComputeRef.current = false;
      }
      setAreaLoading(false);
    } catch (err) {
      console.error(err);
      setError("Data pipeline calculation error. Verify columns inside sub-sheets perfectly match expected formula criteria terms.");
      if (firstComputeRef.current) {
        setLoading(false);
        firstComputeRef.current = false;
      }
      setAreaLoading(false);
    }
  }, [scheduleRows, rosterRows, leaveRows, selectedArea]);

  const renderView = () => {
    switch (currentPage) {
      case 'headcount':
        return (
          <HeadcountDashboardPage
            rawMetricsData={metricsData}
            loading={loading}
            areaOptions={areaOptions}
            selectedArea={selectedArea}
            onAreaChange={handleAreaChange}
            areaReadonly={!isAdmin && !!areaLock}
            areaReadOnlyLabel={areaLock}
          />
        );
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
        <div className="p-5 rounded-b-3xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 border-b border-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3">
            <Layers className="text-emerald-400" size={24} />
            <div>
              <div className="text-lg font-semibold text-white">AMW Analytics</div>
              <div className="text-sm text-slate-400">Operational insight hub</div>
            </div>
          </div>
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
        <div className="mt-auto p-4 border-t border-slate-800">
          {currentUserEmail ? (
            <div className="mb-3 rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-200">
              <div className="font-semibold text-slate-100">Signed in as</div>
              <div className="truncate text-slate-300">{currentUserEmail}</div>
            </div>
          ) : null}
          <button
            onClick={onSidebarLogout}
            disabled={sidebarLoggingOut}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-500/20 disabled:opacity-60"
          >
            {sidebarLoggingOut ? <Loader2 className="animate-spin" size={14} /> : <LogOut size={14} />}
            <span>{sidebarLoggingOut ? 'Signing out…' : 'Logout'}</span>
          </button>
          <div className="mt-4 text-[11px] text-slate-600 text-center font-medium tracking-wider">v2.1.0 — 2026</div>
        </div>
      </aside>

      {/* MAIN LAYOUT VIEWPORT */}
      <main className="relative flex-1 overflow-y-auto p-8">
        {loading && currentPage === 'headcount' ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-emerald-500" size={36} />
            <p className="text-sm font-medium">Extracting raw CSV matrices...</p>
          </div>
        ) : (
          <div className={areaLoading ? 'relative blur-sm transition duration-200' : 'relative transition duration-200'}>
            {renderView()}
            {areaLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
                <div className="inline-flex flex-col items-center gap-3 rounded-3xl border border-emerald-300/20 bg-slate-950/95 px-6 py-5 text-slate-100 shadow-2xl">
                  <Loader2 className="animate-spin text-emerald-400" size={36} />
                  <p className="text-sm font-medium">Updating area filter…</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
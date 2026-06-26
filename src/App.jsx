import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LayoutDashboard, AlertCircle, Loader2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { logout } from './auth/authService';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import TrendChart from './components/TrendChart';
import DateRangePicker from './components/DateRangePicker';

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
  'SACRAMENTO': 'South Sacramento',
  'SAC NORTH': 'North Sacramento',
  'SAN NORTH': 'North Sacramento',
  'SFO': 'San Francisco',
  'EASY BAY': 'San Francisco',
  'SF ONLOK': 'San Francisco Onlok',
  'SCC': 'Santa Clara',
  'SCC ONLOK': 'Santa Clara Onlok',
  'SONOMA': 'Sonoma',
  'SOL/COCO': 'Solano/Contra Costa',
  'ALC': 'Alameda',
  'ALC ONLOK': 'Alameda Onlok',
  'BLS': 'BLS',
  'SOCAL': 'Riverside',
  'HQ': 'Headquarters',
  'LLC (from sac south)': 'South Sacramento LLC',
  'LLC': 'LLC',
  'SAN DIEGO': 'San Diego',
  'LLC (from sac south)': 'South Sacramento LLC'
};

const AREA_MAP_TOOLTIP = Object.entries(AREA_MAP).map(([k, v]) => `${k} → ${v}`).join('; ');

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

const normalizeArea = (raw) => {
  if (raw === undefined || raw === null) return '';
  const key = String(raw || '').trim();
  if (key === '') return '';

  if (!normalizeArea._cache) normalizeArea._cache = new Map();
  if (normalizeArea._cache.has(key)) return normalizeArea._cache.get(key);

  const up = key.toUpperCase();
  if (AREA_MAP[up]) {
    normalizeArea._cache.set(key, AREA_MAP[up]);
    return AREA_MAP[up];
  }

  for (const v of Object.values(AREA_MAP)) {
    if (v.toUpperCase() === up) {
      normalizeArea._cache.set(key, v);
      return v;
    }
  }

  let best = { key: null, dist: Infinity };
  for (const candidate of Object.keys(AREA_MAP)) {
    const dist = levenshtein(up, candidate.toUpperCase());
    if (dist < best.dist) best = { key: candidate, dist };
  }

  if (best.key && (best.dist <= 2 || best.dist <= Math.floor(up.length * 0.2))) {
    const mapped = AREA_MAP[best.key];
    normalizeArea._cache.set(key, mapped);
    return mapped;
  }

  normalizeArea._cache.set(key, key);
  return key;
};

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
};

const parseDate = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  let parsed;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    parsed = new Date(y, m - 1, d);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [a, b, c] = trimmed.split('/').map(Number);
    if (a > 12) parsed = new Date(c, b - 1, a);
    else parsed = new Date(c, a - 1, b);
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
  return (
    dateValue.getFullYear() === dateTarget.getFullYear() &&
    dateValue.getMonth() === dateTarget.getMonth() &&
    dateValue.getDate() === dateTarget.getDate()
  );
};

const isOnOrBefore = (value, target) => {
  const dateValue = parseDate(value);
  const dateTarget = parseDate(target);
  return dateValue && dateTarget ? dateValue <= dateTarget : false;
};

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

const offsetDateString = (baseDateStr, daysOffset) => {
  const base = parseDate(baseDateStr);
  if (!base) return baseDateStr;
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + daysOffset);
  return formatAsIsoDate(d);
};

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

  useEffect(() => {
    if (rawMetricsData && rawMetricsData.length > 0) {
      const latestAvailableDate = rawMetricsData[rawMetricsData.length - 1].name;
      const initialDate = latestAvailableDate > todayIso ? todayIso : latestAvailableDate;
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
  }, [rawMetricsData, todayIso]);

  useEffect(() => {
    if (!rawMetricsData || rawMetricsData.length === 0 || !startDate || !endDate) return;

    const filteredDays = rawMetricsData.filter(item => isDateInRange(item.name, startDate, endDate));
    setChartData(filteredDays);

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
      <header className="bg-[#FFFFFF] p-7 rounded-[32px] shadow-sm border border-[#E2E8F0] space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Operational Headcount Analytics</h1>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">Select a range and see the dashboard update instantly with KPIs and trends.</p>
            </div>
          </div>
        </div>

        <div className="relative pt-2 border-t border-[#E2E8F0] text-sm">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            todayIso={todayIso}
            datePickerOpen={datePickerOpen}
            setDatePickerOpen={setDatePickerOpen}
            clampToMaxDate={clampToMaxDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            datePickerRef={datePickerRef}
            onDone={() => setDatePickerOpen(false)}
          />

          {areaReadonly ? (
            <div className="ml-4 inline-flex items-center gap-3 rounded-full border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">Area</span>
              <span className="rounded-2xl bg-[#FFFFFF] px-3 py-2 text-sm font-medium text-[#0F172A]">{areaReadOnlyLabel || selectedArea}</span>
            </div>
          ) : (
            <label className="ml-4 inline-flex items-center gap-3 rounded-full border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">Area</span>
              <select
                value={selectedArea}
                onChange={(e) => onAreaChange(e.target.value)}
                className="rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/30"
              >
                {areaOptions.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </label>
          )}

          <div className="mt-2 ml-4 text-xs text-[#64748B]" title={AREA_MAP_TOOLTIP}>
            Area labels are normalized for display (hover to see mappings).
          </div>
        </div>
      </header>

      <KPICards kpis={kpis} />
      <TrendChart chartData={chartData} />
    </div>
  );
}

function VehiclesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#0F172A]">Vehicles & Fleet Management</h1>
        <p className="text-[#64748B] text-sm mt-1">Isolating Fleet metrics hooked via GID 554899445.</p>
      </header>
      <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border border-[#E2E8F0] text-center text-[#64748B] text-sm">
        Vehicle tracking module ready for metric array filters.
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#0F172A]">System Dashboard Settings</h1>
        <p className="text-[#64748B] text-sm mt-1">Manage pipeline filters, thresholds, and refresh rates.</p>
      </header>
      <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border border-[#E2E8F0] text-center text-[#64748B] text-sm">
        Global application infrastructure adjustments workspace.
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUserEmail(u?.email || '');

      if (!u) {
        setAreaOptions(['All Areas']);
        setSelectedArea('All Areas');
        return;
      }

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
      fetch(`${BASE_URL}&gid=${GIDS.Schedules}`).then(res => { if (!res.ok) throw new Error(); return res.text(); }),
      fetch(`${BASE_URL}&gid=${GIDS.Roster}`).then(res => { if (!res.ok) throw new Error(); return res.text(); }),
      fetch(`${BASE_URL}&gid=${GIDS.Leaves}`).then(res => { if (!res.ok) throw new Error(); return res.text(); })
    ])
      .then(([schedulesCsv, rosterCsv, leavesCsv]) => {
        const schedules = parseCSV(schedulesCsv);
        const roster = parseCSV(rosterCsv);
        const leaves = parseCSV(leavesCsv);

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
        )).sort((a, b) => a.localeCompare(b));

        const rosterAreas = rosterLocationIdx === -1 ? [] : Array.from(new Set(
          roster.slice(1)
            .map(row => normalizeArea(String(row[rosterLocationIdx] || '').trim()))
            .filter(Boolean)
        )).sort((a, b) => a.localeCompare(b));

        const leaveAreas = Array.from(new Set(
          leaves.slice(1)
            .map(row => normalizeArea(String(row[leavesAreaIdx] || '').trim()))
            .filter(Boolean)
        )).sort((a, b) => a.localeCompare(b));

        const availableAreasSet = new Set([...scheduleAreas, ...rosterAreas, ...leaveAreas]);
        const availableAreas = Array.from(availableAreasSet).sort((a, b) => a.localeCompare(b));

        setScheduleRows(schedules);
        setRosterRows(roster);
        setLeaveRows(leaves);

        const areaOptionsNext = ['All Areas', ...availableAreas];
        setAreaOptions(() => {
          if (areaLock && availableAreasSet.has(areaLock)) return [areaLock];
          return areaOptionsNext;
        });

        setSelectedArea((prev) => {
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 p-4 text-center">
        <AlertCircle size={44} className="text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800">Pipeline Pipeline Extraction Breakdown</h2>
        <p className="text-slate-500 text-sm max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUserEmail={currentUserEmail}
        sidebarLoggingOut={sidebarLoggingOut}
        onLogout={onSidebarLogout}
      />

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


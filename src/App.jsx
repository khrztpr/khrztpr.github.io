import React, { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { logout } from './auth/authService';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import TrendChart from './components/TrendChart';

/* ---------------- AREAS SYSTEM (CLEAN) ---------------- */

export const AREAS = {
  SAN_FRANCISCO: 'San Francisco',
  SAN_FRANCISCO_ONLOK: 'San Francisco Onlok',
  SANTA_CLARA: 'Santa Clara',
  SANTA_CLARA_ONLOK: 'Santa Clara Onlok',
  ALAMEDA: 'Alameda',
  ALAMEDA_ONLOK: 'Alameda Onlok',
  SONOMA: 'Sonoma',
  SOLANO_CONTRA_COSTA: 'Solano/Contra Costa',
  SOUTH_SACRAMENTO: 'South Sacramento',
  NORTH_SACRAMENTO: 'North Sacramento',
  SOUTH_SACRAMENTO_LLC: 'South Sacramento LLC',
  RIVERSIDE: 'Riverside',
  SAN_DIEGO: 'San Diego',
  BLS: 'BLS',
  HEADQUARTERS: 'Headquarters'
};

export const AREA_LIST = Object.values(AREAS);

export const AREA_ALIASES = {
  'SAC SOUTH': AREAS.SOUTH_SACRAMENTO,
  'SACRAMENTO': AREAS.SOUTH_SACRAMENTO,

  'SAC NORTH': AREAS.NORTH_SACRAMENTO,
  'SAN NORTH': AREAS.NORTH_SACRAMENTO,

  'SFO': AREAS.SAN_FRANCISCO,
  'EAST BAY': AREAS.SAN_FRANCISCO,

  'SF ONLOK': AREAS.SAN_FRANCISCO_ONLOK,

  'SCC': AREAS.SANTA_CLARA,
  'SCC ONLOK': AREAS.SANTA_CLARA_ONLOK,

  'SONOMA': AREAS.SONOMA,
  'SOL/COCO': AREAS.SOLANO_CONTRA_COSTA,

  'ALC': AREAS.ALAMEDA,
  'ALC ONLOK': AREAS.ALAMEDA_ONLOK,

  'SOCAL': AREAS.RIVERSIDE,
  'HQ': AREAS.HEADQUARTERS,
  'LLC': AREAS.SOUTH_SACRAMENTO_LLC,
  'SAN DIEGO': AREAS.SAN_DIEGO
};

/* ---------------- NORMALIZER (SIMPLE + RELIABLE) ---------------- */

const normalizeArea = (raw) => {
  if (!raw) return '';
  const key = String(raw).trim().toUpperCase();
  return AREA_ALIASES[key] || key;
};

/* ---------------- UTILITIES ---------------- */

const parseCSV = (text) =>
  text
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line =>
      line
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map(c => c.replace(/^"|"$/g, '').trim())
    );

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatAsIsoDate = (v) => {
  const d = parseDate(v);
  if (!d) return '';
  return d.toISOString().split('T')[0];
};

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const [currentPage, setCurrentPage] = useState('headcount');

  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [scheduleRows, setScheduleRows] = useState([]);
  const [rosterRows, setRosterRows] = useState([]);
  const [leaveRows, setLeaveRows] = useState([]);

  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [sidebarLoggingOut, setSidebarLoggingOut] = useState(false);

  const navigate = useNavigate();

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUserEmail(u?.email || '');
    });
    return () => unsub();
  }, []);

  async function onSidebarLogout() {
    setSidebarLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.warn(err);
    }
    setSidebarLoggingOut(false);
    navigate('/login', { replace: true });
  }

  /* ---------------- DATA FETCH ---------------- */

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch('SCHEDULE_URL').then(r => r.text()),
      fetch('ROSTER_URL').then(r => r.text()),
      fetch('LEAVE_URL').then(r => r.text())
    ])
      .then(([s, r, l]) => {
        setScheduleRows(parseCSV(s));
        setRosterRows(parseCSV(r));
        setLeaveRows(parseCSV(l));
        setLoading(false);
      })
      .catch(() => {
        setError('Data pipeline extraction error.');
        setLoading(false);
      });
  }, []);

  /* ---------------- COMPUTE ---------------- */

  useEffect(() => {
    if (!scheduleRows.length) return;

    const headers = scheduleRows[0];
    const dateIdx = headers.findIndex(h => h.toLowerCase() === 'date');

    const data = scheduleRows.slice(1).map(row => ({
      name: formatAsIsoDate(row[dateIdx]),
      scheduled: 1
    }));

    setMetricsData(data);
  }, [scheduleRows]);

  /* ---------------- VIEW ---------------- */

  const HeadcountDashboardPage = () => (
    <div className="space-y-6">
      <header className="bg-[#526084] p-7 rounded-2xl border border-[#233663] text-[#FAF6F6]">
        <h1 className="text-3xl font-bold">
          Operational Headcount Analytics
        </h1>
        <p className="text-sm text-[#FAF6F6]/70">
          Clean AREA system enabled
        </p>
      </header>

      <KPICards kpis={{}} />
      <TrendChart chartData={metricsData} />
    </div>
  );

  const renderView = () => {
    if (currentPage === 'headcount') return <HeadcountDashboardPage />;
    return <div className="text-[#FAF6F6]">View</div>;
  };

  /* ---------------- ERROR ---------------- */

  if (error) {
    return (
      <div className="min-h-screen bg-[#233663] flex items-center justify-center text-[#FAF6F6]">
        <AlertCircle size={40} className="text-[#CB1F23]" />
        <p className="ml-2 text-sm">{error}</p>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen bg-[#233663] text-[#FAF6F6]">

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUserEmail={currentUserEmail}
        sidebarLoggingOut={sidebarLoggingOut}
        onLogout={onSidebarLogout}
      />

      <main className="flex-1 overflow-y-auto p-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="animate-spin text-[#CB1F23]" size={40} />
            <p className="text-sm mt-2 text-[#FAF6F6]/70">
              Loading pipeline data...
            </p>
          </div>
        ) : (
          renderView()
        )}

      </main>
    </div>
  );
}
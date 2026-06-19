import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LayoutDashboard, Users, ClipboardList, Clock, AlertTriangle, Calendar, Loader2, AlertCircle, Car, Settings, Layers, LogIn, LogOut, UserPlus, Key, Shield } from 'lucide-react';

// Import Firebase Auth & Firestore methods
import { 
  auth, 
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc
} from './firebase';

// --- CONFIGURATION & ENDPOINTS ---
const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRexxgM8lPBkDswjt5dR1yFTr07PW_g8X1xew6IddOjj6LkXs6SRkZoh-c6jQjHNvfsMUeY-qMSdRxX/pub?output=csv';

const GIDS = {
  Schedules: '1181372232',
  Roster: '1054794668',
  Leaves: '618864387'
};

const AREA_MAP = {
  'SAC SOUTH': 'South Sacramento',
  'FRESNO': 'Fresno',
  'SOL/COCO': 'Solano/Contra Costa',
  'SFO': 'San Francisco',
  'SCC': 'Santa Clara',
  'SAC NORTH': 'North Sacramento',
  'SCC ONLOK': 'Santa Clara',
  'ALC': 'Alameda',
  'BLS': 'Ambulance',
  'SONOMA': 'Solano/Contra Costa',
  'SF ONLOK': 'San Francisco',
  'LLC (from sac south)': 'South Sacramento',
  'SOCAL': 'Riverside',
  'HQ': 'Headquarters',
  'ALC ONLOK': 'Alameda',
  'LLC': 'LLC',
  'SAN DIEGO': 'San Diego',
  'SAN NORTH': 'North Sacramento'
};

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

// ==========================================
// AUTH MODAL COMPONENT (Developer Controls Roles)
// ==========================================
function AuthModal({ isOpen, onClose }) {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (view === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Developer Enforced Logic: New users safely initialize as standard "Employee" profile.
        // Developer manually elevates authority levels within the Firebase Firestore Console dashboard.
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "Employee"
        });

        setMessage('Account registration complete! Profile set to Employee.');
        setTimeout(() => onClose(), 1500);
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset link sent to your email!');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-100 relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-lg"
        >
          ✕
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 text-emerald-600">
            {view === 'login' && <LogIn size={24} />}
            {view === 'register' && <UserPlus size={24} />}
            {view === 'forgot' && <Key size={24} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {view === 'login' && 'Sign in to access secure dashboard metrics'}
            {view === 'register' && 'Sign up to build your operator profile'}
            {view === 'forgot' && 'Enter your email to receive a recovery link'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-medium text-rose-600 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-medium text-emerald-700 flex items-center gap-2">
            <AlertCircle size={16} /> {message}
          </div>
        )}

        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 transition" 
              placeholder="name@company.com"
            />
          </div>

          {view !== 'forgot' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 transition" 
                placeholder="••••••••"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3 text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                {view === 'login' && 'Sign In'}
                {view === 'register' && 'Register Now'}
                {view === 'forgot' && 'Send Link'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs space-y-2 text-slate-500">
          {view === 'login' && (
            <>
              <div>Don't have an account? <button onClick={() => { setView('register'); setError(''); }} className="text-emerald-600 font-semibold hover:underline">Register</button></div>
              <div>Forgot your secret access? <button onClick={() => { setView('forgot'); setError(''); }} className="text-slate-700 font-semibold hover:underline">Forgot Password</button></div>
            </>
          )}
          {view === 'register' && (
            <div>Already have an profile? <button onClick={() => { setView('login'); setError(''); }} className="text-emerald-600 font-semibold hover:underline">Log In</button></div>
          )}
          {view === 'forgot' && (
            <div>Return back to <button onClick={() => { setView('login'); setError(''); }} className="text-emerald-600 font-semibold hover:underline">Log In portal</button></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PAGE MODULE: HEADCOUNT DASHBOARD
// ==========================================
function HeadcountDashboardPage({ rawMetricsData, loading, areaOptions, selectedArea, onAreaChange }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [kpis, setKpis] = useState({
    openingFieldHC: 0, active: 0, activeFull: 0, activePartial: 0, scheduled: 0, absentLate: 0, plannedLeave: 0, inShrinkage: 0, outShrinkage: 0
  });

  const datePickerRef = useRef(null);
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
      <header className="bg-white/95 p-7 rounded-[32px] shadow-sm border border-slate-200/80 backdrop-blur-xl space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Operational Headcount Analytics</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Select a range and see the dashboard update instantly with KPIs and trends.</p>
          </div>
        </div>

        <div className="relative pt-2 border-t border-slate-200 text-sm flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setDatePickerOpen((open) => !open)}
            className="inline-flex items-center gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            <Calendar size={18} />
            <span className="text-sm font-medium">Select date range</span>
          </button>
          {startDate && endDate && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200">
              {startDate} → {endDate}
            </span>
          )}

          <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Area</span>
            <select
              value={selectedArea}
              onChange={(e) => onAreaChange(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-slate-900 outline-none transition focus:border-emerald-400"
            >
              {areaOptions.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </label>

          {datePickerOpen && (
            <div ref={datePickerRef} className="absolute left-0 z-20 mt-14 w-full max-w-sm rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl">
              <div className="grid gap-4">
                <label className="space-y-2 text-xs text-slate-500">
                  From
                  <input
                    type="date"
                    value={startDate}
                    max={todayIso}
                    onChange={(e) => setStartDate(clampToMaxDate(e.target.value))}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                </label>
                <label className="space-y-2 text-xs text-slate-500">
                  To
                  <input
                    type="date"
                    value={endDate}
                    max={todayIso}
                    onChange={(e) => setEndDate(clampToMaxDate(e.target.value))}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(false)}
                  className="inline-flex justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

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
// PAGE MODULE: VEHICLES
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
// PAGE MODULE: SETTINGS
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
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(''); // Assignment tracking state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
  const firstComputeRef = useRef(true);
  const areaLoadingTimerRef = useRef(null);
  const AREA_LOADING_DELAY = 200;

  // Track user login status and retrieve corresponding role hierarchy parameter
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'Employee');
          } else {
            setUserRole('Employee');
          }
        } catch (err) {
          console.error("Error reading database user metadata: ", err);
          setUserRole('Employee');
        }
      } else {
        setUserRole('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch engine core data pipeline
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

      const scheduleAreaIdx = schedules[0].findIndex(header => String(header || '').toLowerCase().trim() === 'area');
      if (scheduleAreaIdx === -1) throw new Error("Header labeled 'Area' was not identified inside Schedules.");
      const scheduleAreas = Array.from(new Set(
        schedules.slice(1)
          .map(row => normalizeArea(String(row[scheduleAreaIdx] || '').trim()))
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b));

      setScheduleRows(schedules);
      setRosterRows(roster);
      setLeaveRows(leaves);
      setAreaOptions(['All Areas', ...scheduleAreas]);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError("Data pipeline extraction error. Verify sheet columns match expected headers.");
      setLoading(false);
    });
  }, []);

  // Structural breakdown engine mapping computations
  useEffect(() => {
    if (!scheduleRows.length || !rosterRows.length || !leaveRows.length) return;

    if (!firstComputeRef.current) {
      if (areaLoadingTimerRef.current) {
        clearTimeout(areaLoadingTimerRef.current);
      }
      areaLoadingTimerRef.current = setTimeout(() => setAreaLoading(true), AREA_LOADING_DELAY);
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
      if (rosterDateIdx === undefined) throw new Error("Header labeled 'Start date' was not identified inside Roster.");
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
          location, startIso,
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
          openingFieldHC, active, activeFull, activePartial, scheduled, absentLate, plannedLeave, inShrinkage,
          outShrinkage: Number(outShrinkage.toFixed(1))
        };
      });

      setMetricsData(computedTimeline);
      if (areaLoadingTimerRef.current) clearTimeout(areaLoadingTimerRef.current);
      if (firstComputeRef.current) {
        setLoading(false);
        firstComputeRef.current = false;
      }
      setAreaLoading(false);
    } catch (err) {
      console.error(err);
      if (areaLoadingTimerRef.current) clearTimeout(areaLoadingTimerRef.current);
      setError("Data pipeline calculation error. Verify column layouts match formula conditions.");
      if (firstComputeRef.current) {
        setLoading(false);
        firstComputeRef.current = false;
      }
      setAreaLoading(false);
    }

    return () => {
      if (areaLoadingTimerRef.current) clearTimeout(areaLoadingTimerRef.current);
    };
  }, [scheduleRows, rosterRows, leaveRows, selectedArea]);

  const handleLogout = () => {
    signOut(auth).catch(err => console.error("Error signing out: ", err));
  };

  const renderView = () => {
    switch (currentPage) {
      case 'headcount':
        return <HeadcountDashboardPage rawMetricsData={metricsData} loading={loading || areaLoading} areaOptions={areaOptions} selectedArea={selectedArea} onAreaChange={setSelectedArea} />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'settings':
        // Example logic showing how roles protect sections of the app:
        if (['Team Leaders', 'Admin', 'Dev'].includes(userRole)) {
          return <SettingsPage />;
        }
        return (
          <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
            <Shield className="mx-auto text-slate-400 mb-2" size={32} />
            <h3 className="font-bold text-slate-800">Access Restricted</h3>
            <p className="text-slate-500 text-xs mt-1">This section requires Team Leaders, Admin, or Dev status.</p>
          </div>
        );
      default:
        return <div className="p-6">View missing.</div>;
    }
  };

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <AlertCircle size={44} className="text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800">Pipeline Extraction Breakdown</h2>
        <p className="text-slate-500 text-sm max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-5 text-xl font-bold border-b border-slate-800 tracking-wider flex items-center gap-2">
          <Layers className="text-emerald-400" size={22} /> MatrixEngine
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setCurrentPage('headcount')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${currentPage === 'headcount' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={18} /> Headcount Dashboard
          </button>
          <button 
            onClick={() => setCurrentPage('vehicles')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${currentPage === 'vehicles' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Car size={18} /> Vehicles & Fleet
          </button>
          <button 
            onClick={() => setCurrentPage('settings')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${currentPage === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={18} /> Settings
          </button>
        </nav>

        {/* AUTH SIDEBAR UTILITY LINK PANEL */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          {currentUser ? (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-slate-800/80 rounded-lg text-xs font-medium text-slate-300 truncate border border-slate-800 space-y-1">
                <div className="truncate font-semibold text-emerald-400">👤 {currentUser.email}</div>
                {userRole && (
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-800/40 w-max">
                    <Shield size={10} className="text-emerald-500" /> {userRole}
                  </div>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              <LogIn size={16} /> Log In / Register
            </button>
          )}
        </div>
      </aside>

      {/* MAIN VIEW CONTENT WORKSPACE */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {loading ? (
          <div className="absolute inset-0 bg-slate-50/50 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px] z-50">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 animate-pulse">Recomputing Matrix Aggregations...</p>
          </div>
        ) : null}
        {renderView()}
      </main>

      {/* INTERACTIVE COMPONENT MODAL INJECTION */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

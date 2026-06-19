import React, { useState, useEffect } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from '../auth/authService';

export default function NavBar({ title = 'Dashboard' }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setEmail(u?.email || '');
    });
    return () => unsub();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.warn('logout failed', err);
    }
    setLoggingOut(false);
    navigate('/login', { replace: true });
  }

  return (
    <div className="w-full bg-white/95 border-b border-slate-200/70 p-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          {email ? <div className="text-sm text-slate-500">{email}</div> : null}
        </div>

        <div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-500/20 disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="animate-spin" size={14} /> : <LogOut size={14} />}
            <span>{loggingOut ? 'Signing out…' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

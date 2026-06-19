import React, { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, LogOut, Loader2, AlertCircle, Users } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "../ui/toast";

// Import existing pages (we'll keep current App dashboard logic inside App for now if needed)

/**
 * Protected dashboard wrapper.
 * Security: assumes AuthGuard already allowed rendering; this page still reads auth state for display.
 */
export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) navigate("/login", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  const accountCreated = useMemo(() => {
    if (!user?.metadata?.creationTime) return "";
    try {
      return new Date(user.metadata.creationTime).toLocaleDateString();
    } catch {
      return "";
    }
  }, [user]);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await auth.signOut?.();
    } catch {
      // ignore; signOut is from firebase/auth in authService, but keeping for UI-only.
    }
    // We will replace this with authService.logout after router refactor.
    setLoggingOut(false);
    toast.success("Logout success");
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-emerald-400" size={40} />
          <p className="text-sm text-slate-300">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <LayoutDashboard size={18} className="text-emerald-300" />
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
            <p className="mt-2 text-sm text-slate-300">Secure, email-verified access only.</p>
          </div>

          <button
            onClick={onLogout}
            disabled={loggingOut}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25 disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard icon={<Users size={18} />} label="Display name" value={user.displayName || "—"} />
          <InfoCard icon={<span className="text-slate-300">@</span>} label="Email" value={user.email || "—"} />
          <InfoCard
            icon={<span className="text-emerald-300">✓</span>}
            label="Email verification"
            value={user.emailVerified ? "Verified" : "Not verified"}
            tone={user.emailVerified ? "emerald" : "amber"}
          />
        </div>

        <div className="mt-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-300">Account created</div>
            <div className="mt-1 text-lg font-semibold">{accountCreated || "—"}</div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Your protected area</div>
              <div className="mt-1 text-sm text-slate-300">
                This is a protected dashboard container. Existing analytics views remain unchanged.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, tone }) {
  const toneStyles =
    tone === "emerald"
      ? "border-emerald-300/20 bg-emerald-500/10"
      : tone === "amber"
        ? "border-amber-300/20 bg-amber-500/10"
        : "border-white/10 bg-white/5";

  return (
    <div className={`rounded-3xl border ${toneStyles} p-5`}>
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span className="text-emerald-300">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}


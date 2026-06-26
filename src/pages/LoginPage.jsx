import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, AlertTriangle, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  canAttemptLogin,
  getLoginCooldownRemainingMs,
  login,
  normalizeEmail,
  sanitizeString,
  validateEmailFormat
} from "../auth/authService";

import { toast } from "../ui/toast";

/* ---------------- SKELETON ---------------- */
function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#233663] p-4">
      <div className="w-full max-w-md animate-pulse">
        <div className="rounded-3xl border border-[#526084] bg-[#1f2f52] p-6 space-y-4">
          <div className="h-10 w-40 bg-[#526084]/40 rounded-xl" />
          <div className="h-4 w-60 bg-[#526084]/30 rounded" />
          <div className="h-12 bg-[#526084]/30 rounded-2xl" />
          <div className="h-12 bg-[#526084]/30 rounded-2xl" />
          <div className="h-12 bg-[#CB1F23]/30 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCooldownMs(getLoginCooldownRemainingMs());
    }, 500);
    return () => clearInterval(id);
  }, []);

  const emailValid = useMemo(() => validateEmailFormat(normalizeEmail(email)), [email]);
  const canSubmit = email.length > 0 && password.length > 0;

  async function onSubmit(e) {
    e.preventDefault();

    const safeEmail = sanitizeString(email);
    const safePassword = String(password || "");

    if (!safeEmail || !safePassword) {
      toast.error("Enter email and password");
      return;
    }

    if (!canAttemptLogin() || cooldownMs > 0) {
      toast.error("Too many attempts. Try again soon.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: safeEmail, password: safePassword });
      toast.success("Welcome back");
      navigate(fromPath, { replace: true });
    } catch {
      toast.error("Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (booting) return <LoginSkeleton />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#233663] p-4 text-[#FAF6F6]">

      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-[#526084] bg-[#1f2f52] shadow-2xl">

          {/* HEADER */}
          <div className="p-6 border-b border-[#526084]">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[#CB1F23]/20 border border-[#CB1F23]/40 flex items-center justify-center">
                <LogIn className="text-[#CB1F23]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Sign in</h1>
                <p className="text-sm text-[#FAF6F6]/60">Access dashboard</p>
              </div>
            </div>
          </div>

          {/* SECURITY */}
          <div className="p-4">
            <div className="flex gap-3 rounded-2xl bg-[#526084]/30 border border-[#526084] p-3">
              <ShieldCheck size={18} />
              <p className="text-xs text-[#FAF6F6]/70">
                Secure authentication system
              </p>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={onSubmit} className="p-6 space-y-4">

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl bg-[#526084]/20 border border-[#526084] px-4 py-3 outline-none focus:border-[#CB1F23]"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl bg-[#526084]/20 border border-[#526084] px-4 py-3 pr-12 outline-none focus:border-[#CB1F23]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FAF6F6]/60"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <button
              disabled={!canSubmit || submitting}
              className="w-full rounded-2xl bg-[#CB1F23] py-3 font-semibold hover:bg-[#a8181c] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Sign in"}
            </button>

            <div className="flex justify-between text-xs text-[#FAF6F6]/60">
              <button type="button" onClick={() => navigate("/reset-password")}>
                Forgot password
              </button>
              <button type="button" onClick={() => navigate("/signup")}>
                Create account
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
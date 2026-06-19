import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, AlertTriangle, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  canAttemptLogin,
  getLoginCooldownRemainingMs,
  login,
  normalizeEmail,
  sanitizeString,
  validateEmailFormat,
  validatePasswordStrength
} from "../auth/authService";

import { toast } from "../ui/toast";

/**
 * Premium auth UI (glass/SaaS style) with:
 * - email/password validation
 * - password visibility toggle
 * - strength meter
 * - remember me (session persistence)
 * - cooldown for rapid login attempts (client-side)
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    setCooldownMs(getLoginCooldownRemainingMs());
    const id = window.setInterval(() => {
      setCooldownMs(getLoginCooldownRemainingMs());
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const emailNorm = useMemo(() => normalizeEmail(email), [email]);

  const emailValid = useMemo(() => validateEmailFormat(emailNorm), [emailNorm]);
  const pwEval = useMemo(() => validatePasswordStrength(password), [password]);

  const emailError =
    touched.email && !emailValid ? "Enter a valid email address." : "";

  const passwordError =
    touched.password && !pwEval.passed
      ? "Use at least 12 chars with upper, lower, number, and special character."
      : "";

  const formValid = emailValid && pwEval.passed;

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const safeEmail = sanitizeString(email);
    const safePassword = String(password || "");

    // Client-side validation (avoid leaking detailed reasons in UI)
    if (!safeEmail || !safePassword || !formValid) {
      toast.error("Unable to sign in. Please check your details and try again.");
      return;
    }

    if (!canAttemptLogin() || cooldownMs > 0) {
      toast.error("Too many attempts. Please wait a moment and try again.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: safeEmail, password: safePassword, rememberMe });
      toast.success("Login success");
      navigate(fromPath, { replace: true });
    } catch (err) {
      // Generic auth error message
      console.warn("login error:", err);
      toast.error("Unable to sign in. Please check your details and try again.");
      // cooldown is client-side; keep it active via canAttemptLogin logic
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_90px_-60px_rgba(16,185,129,0.25)] backdrop-blur-xl">
          <div className="p-7">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                <LogIn className="text-emerald-300" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
                <p className="text-sm text-slate-300">Secure access to your dashboard.</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 text-emerald-300" size={18} />
                <div className="text-xs text-slate-200/90 leading-5">
                  <div className="font-medium text-slate-100">Email verification required</div>
                  <div className="opacity-90">
                    If you haven’t verified your email, you’ll be redirected after login.
                  </div>
                </div>
              </div>
            </div>

            {/* Login form fade-in */}
            <form
              onSubmit={onSubmit}
              className="mt-6 space-y-4 animate-[auth_fadeIn_420ms_ease-out]"
              aria-label="Login form"
            >
              <label className="block">
                <span className="text-xs text-slate-300">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  type="email"
                  autoComplete="email"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="name@company.com"
                  required
                />
                {emailError ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-rose-300">
                    <AlertTriangle size={14} /> {emailError}
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="text-xs text-slate-300">Password</span>
                <div className="relative mt-1">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-rose-300">
                    <AlertTriangle size={14} /> {passwordError}
                  </div>
                ) : null}
              </label>

              <PasswordStrengthMeter eval={pwEval} />

              <label className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  <span className="text-xs text-slate-200">Remember me</span>
                </div>

                {cooldownMs > 0 ? (
                  <span className="text-[11px] text-amber-200/90">
                    Cooldown: {Math.ceil(cooldownMs / 1000)}s
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Max attempts protection</span>
                )}
              </label>

              <button
                disabled={!formValid || submitting || (cooldownMs > 0 && !canAttemptLogin())}
                className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.65)] transition hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  {submitting ? "Signing in…" : "Sign in"}
                </span>
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  className="text-emerald-200 hover:text-emerald-100 transition"
                  onClick={() => navigate("/reset-password")}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  className="text-slate-300 hover:text-slate-100 transition"
                  onClick={() => navigate("/signup")}
                >
                  Create account
                </button>
              </div>

              <div className="text-[11px] text-slate-400 leading-5">
                By continuing, you agree to secure account access. We never store passwords in Firestore/DB.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


function PasswordStrengthMeter({ eval: pwEval }) {
  const { rules, passed } = pwEval;
  const score =
    (rules.length ? 1 : 0) +
    (rules.uppercase ? 1 : 0) +
    (rules.lowercase ? 1 : 0) +
    (rules.number ? 1 : 0) +
    (rules.special ? 1 : 0);

  const pct = (score / 5) * 100;
  const label = passed ? "Strong password" : score <= 2 ? "Weak password" : "Medium password";

  const color =
    passed ? "bg-emerald-500" : score <= 2 ? "bg-rose-500" : "bg-amber-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-300">Password strength</span>
        <span className="text-xs font-medium text-slate-200">{label}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden border border-white/10">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="text-[11px] text-slate-300 grid grid-cols-2 gap-x-4 gap-y-1">
        <li className={rules.length ? "text-emerald-200" : "text-slate-400"}>12+ chars</li>
        <li className={rules.uppercase ? "text-emerald-200" : "text-slate-400"}>Uppercase</li>
        <li className={rules.lowercase ? "text-emerald-200" : "text-slate-400"}>Lowercase</li>
        <li className={rules.number ? "text-emerald-200" : "text-slate-400"}>Number</li>
        <li className={rules.special ? "text-emerald-200" : "text-slate-400"}>Special</li>
        <li className="text-slate-400">Required mix</li>
      </ul>
    </div>
  );
}

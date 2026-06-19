import React, { useMemo, useState } from "react";
import { Loader2, Mail, RotateCcw, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  normalizeEmail,
  sanitizeString,
  resetPassword,
  validateEmailFormat
} from "../auth/authService";
import { toast } from "../ui/toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailNorm = useMemo(() => normalizeEmail(email), [email]);
  const emailValid = useMemo(() => validateEmailFormat(emailNorm), [emailNorm]);

  const emailError = touched && !emailValid ? "Enter a valid email address." : "";

  async function onSubmit(e) {
    e.preventDefault();
    setTouched(true);

    const safeEmail = sanitizeString(email);
    if (!safeEmail || !emailValid) {
      toast.error("Unable to send reset email. Please check your details and try again.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ email: safeEmail });
      // Generic UX: always say sent.
      toast.success("Password reset sent. Check your inbox.");
      navigate("/login", { replace: true });
    } catch (err) {
      console.warn("resetPassword error:", err);
      toast.error("Unable to send reset email. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_90px_-60px_rgba(16,185,129,0.25)] backdrop-blur-xl">
          <div className="p-7">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                <RotateCcw className="text-emerald-300" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Reset password</h1>
                <p className="text-sm text-slate-300">We’ll email you a reset link.</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4 animate-[auth_fadeIn_420ms_ease-out]">
              <label className="block">
                <span className="text-xs text-slate-300">Email</span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300/70" size={16} />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                {emailError ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-rose-300">
                    <AlertTriangle size={14} /> {emailError}
                  </div>
                ) : null}
              </label>

              <button
                disabled={!emailValid || submitting}
                className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.65)] transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  {submitting ? "Sending…" : "Send reset email"}
                </span>
              </button>

              <div className="text-xs text-slate-400 leading-5">
                Security: We only send a generic reset email message. No sensitive info is shown.
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Back to login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useEffect, useState } from "react";
import { ShieldCheck, Loader2, CheckCircle2, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "../ui/toast";

/**
 * Shows email verification status.
 * Security: does not reveal backend details; uses Firebase user.emailVerified.
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const ok = !!user?.emailVerified;
      setVerified(ok);
      setLoading(false);
      if (ok) navigate("/dashboard", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  async function onResend() {
    setSending(true);
    try {
      if (!auth.currentUser) {
        toast.error("Please sign in again.");
        navigate("/login", { replace: true });
        return;
      }

      // Firebase will send email verification.
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent.");
    } catch (err) {
      console.warn("sendEmailVerification error:", err);
      toast.error("Unable to send verification email. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-emerald-400" size={40} />
          <p className="text-sm text-slate-300">Checking your email…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_90px_-60px_rgba(16,185,129,0.25)] backdrop-blur-xl">
          <div className="p-7">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                <Mail className="text-emerald-300" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Verify your email</h1>
                <p className="text-sm text-slate-300">Access is enabled only after verification.</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-3">
                {verified ? (
                  <CheckCircle2 className="text-emerald-300" size={20} />
                ) : (
                  <ShieldCheck className="text-emerald-300" size={20} />
                )}

                <div>
                  <div className="font-medium text-slate-100">{verified ? "Email verified" : "Verification pending"}</div>
                  <div className="mt-1 text-xs text-slate-200/90 leading-5">
                    {verified
                      ? "Redirecting to dashboard…"
                      : "Check your inbox for a verification link. If you don’t see it, resend the email."}
                  </div>
                </div>
              </div>

              {!verified ? (
                <button
                  onClick={onResend}
                  disabled={sending}
                  className="mt-5 w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.65)] transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {sending ? <Loader2 className="animate-spin" size={16} /> : null}
                    {sending ? "Resending…" : "Resend verification email"}
                  </span>
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


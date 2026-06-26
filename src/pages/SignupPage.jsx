import React, { useState, useMemo } from "react";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  normalizeEmail,
  sanitizeString,
  signUp,
  validateEmailFormat
} from "../auth/authService";
import { toast } from "../ui/toast";

export default function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = useMemo(
    () => validateEmailFormat(normalizeEmail(email)),
    [email]
  );

  const canSubmit = email.length > 0 && password.length > 0;

  async function onSubmit(e) {
    e.preventDefault();

    const safeEmail = sanitizeString(email);
    const safePassword = String(password || "");

    if (!safeEmail || !safePassword) {
      toast.error("Enter valid details");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ email: safeEmail, password: safePassword });
      toast.success("Account created");
      navigate("/login");
    } catch {
      toast.error("Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#233663] p-4 text-[#FAF6F6]">

      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-[#526084] bg-[#1f2f52]">

          <div className="p-6 border-b border-[#526084] flex gap-3">
            <UserPlus className="text-[#CB1F23]" />
            <div>
              <h1 className="text-xl font-semibold">Create account</h1>
              <p className="text-xs text-[#FAF6F6]/60">Start your access</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl bg-[#526084]/20 border border-[#526084] px-4 py-3"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl bg-[#526084]/20 border border-[#526084] px-4 py-3 pr-12"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <button
              disabled={!canSubmit || submitting}
              className="w-full rounded-2xl bg-[#CB1F23] py-3 font-semibold"
            >
              {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Create account"}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}
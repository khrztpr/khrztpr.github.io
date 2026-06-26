import React, { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { resetPassword, sanitizeString } from "../auth/authService";
import { toast } from "../ui/toast";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();

    setLoading(true);
    try {
      await resetPassword({ email: sanitizeString(email) });
      toast.success("Reset link sent");
    } catch {
      toast.error("Failed to send reset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#233663] p-4 text-[#FAF6F6]">

      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-[#526084] bg-[#1f2f52]">

          <div className="p-6 border-b border-[#526084] flex gap-3">
            <RotateCcw className="text-[#CB1F23]" />
            <h1 className="text-xl font-semibold">Reset password</h1>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl bg-[#526084]/20 border border-[#526084] px-4 py-3"
            />

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-[#CB1F23] py-3 font-semibold"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Send reset link"}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}
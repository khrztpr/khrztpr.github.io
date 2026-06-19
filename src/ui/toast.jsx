import React, { useEffect, useState } from "react";

const listeners = new Set();

/**
 * Minimal toast system (no external deps).
 * Security: messages should be generic; never include raw Firebase error codes.
 */
export function toastMessage(type, message) {
  const payload = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    type,
    message
  };
  listeners.forEach((l) => l(payload));
}

export const toast = {
  success: (message) => toastMessage("success", message),
  error: (message) => toastMessage("error", message),
  info: (message) => toastMessage("info", message)
};

export function ToastViewport() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const l = (payload) => {
      setToasts((prev) => [...prev, payload]);
      // auto-remove
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== payload.id));
      }, 3200);
    };
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);

  return (
    <div className="fixed right-4 top-4 z-[1000] flex w-[320px] max-w-[90vw] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            "rounded-2xl border backdrop-blur-xl px-4 py-3 text-sm shadow-[0_25px_80px_-40px_rgba(15,23,42,0.55)] " +
            (t.type === "success"
              ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
              : t.type === "error"
                ? "border-rose-300/30 bg-rose-500/15 text-rose-100"
                : "border-slate-300/30 bg-slate-500/15 text-slate-100")
          }
          role="status"
          aria-live="polite"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}


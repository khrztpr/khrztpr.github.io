import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

/**
 * Security: Guard protected routes.
 * - Waits for Firebase to resolve auth state (prevents flicker leaks)
 * - Redirects to /login if unauthenticated
 * - Enforces email verification before allowing access to protected pages
 */
export default function AuthGuard({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState({
    loading: true,
    user: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setStatus({ loading: false, user });
    });

    return () => unsubscribe();
  }, []);

  if (status.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-emerald-400/30 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!status.user) {
    // Keep attempted location for post-login redirect.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!status.user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}


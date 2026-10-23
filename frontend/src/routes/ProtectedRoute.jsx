import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";

/**
 * ProtectedRoute Component
 * Guards routes that require authentication.
 * Displays a full-screen spinner while Firebase resolves auth state.
 * Redirects unauthenticated visitors to '/' and triggers the login modal.
 */
export default function ProtectedRoute({
  children,
  isLoggedIn,
  authLoading,
  setShowForm,
}) {
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      if (typeof setShowForm === "function") {
        setShowForm(true);
      }
    }
  }, [authLoading, isLoggedIn, setShowForm, location.pathname]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <FaSpinner className="animate-spin text-3xl text-emerald-400" />
        <p className="text-xs text-zinc-400 font-medium tracking-wide">
          Authenticating secure session...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

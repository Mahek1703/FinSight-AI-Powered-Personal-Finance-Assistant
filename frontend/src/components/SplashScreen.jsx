import React, { useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";

/**
 * Animated Splash Screen for FinSight AI
 *
 * Features:
 * - Obsidian dark theme styling with subtle emerald ambient glowing aura.
 * - Framer Motion entry (fade-in + scale-up) and exit (smooth opacity fade-out).
 * - High-precision loading ring spinner.
 * - Automatic background scroll-lock when active.
 * - Displays ONLY in installed PWA or native web app container (standalone mode).
 * - Completely bypassed on standard web browser interfaces.
 */
export default function SplashScreen({
  isLoading = true,
  isApp: isAppProp,
  brandTitle = "FinSight",
  brandAccent = "AI",
  tagline = "Intelligent Personal Finance",
  statusMessage = "Initializing financial command center...",
  onAnimationComplete,
}) {
  const isApp =
    typeof isAppProp === "boolean"
      ? isAppProp
      : typeof window !== "undefined"
      ? Boolean(
          (window.matchMedia &&
            window.matchMedia("(display-mode: standalone)").matches) ||
            window.navigator?.standalone
        )
      : false;

  // Prevent background scrolling while the splash screen is visible
  useEffect(() => {
    if (isApp && isLoading) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isLoading, isApp]);

  // Render the SplashScreen component ONLY if isApp === true
  if (!isApp) {
    return null;
  }

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isLoading && (
        <Motion.div
          key="finsight-splash-screen"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#000000] text-white overflow-hidden select-none"
          role="status"
          aria-live="polite"
        >
          {/* Ambient Background Aura */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12)_0%,_rgba(0,0,0,0.92)_65%,_#000000_100%)] pointer-events-none" />

          {/* Decorative Subtle Glowing Pulse Orbs */}
          <Motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-80 h-80 rounded-full bg-emerald-500/20 blur-[100px] pointer-events-none"
          />

          <Motion.div
            initial={{ opacity: 0, scale: 0.88, y: 18 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: -10,
              transition: { duration: 0.45, ease: "easeInOut" },
            }}
            className="relative z-10 flex flex-col items-center text-center px-6"
          >
            {/* Logo Badge */}
            <div className="relative mb-6">
              {/* Glow Behind Badge */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-500/30 to-teal-400/20 blur-md opacity-75" />

              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-zinc-950/90 border border-emerald-500/40 backdrop-blur-2xl flex items-center justify-center shadow-[0_0_35px_-8px_rgba(16,185,129,0.35)]">
                {/* Custom Vector Icon for FinSight AI */}
                <svg
                  className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 17L9 11L13 15L21 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 7H21V12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="9"
                    cy="11"
                    r="1.5"
                    fill="#34d399"
                  />
                  <circle
                    cx="13"
                    cy="15"
                    r="1.5"
                    fill="#34d399"
                  />
                  <circle
                    cx="21"
                    cy="7"
                    r="1.5"
                    fill="#34d399"
                  />
                </svg>
              </div>
            </div>

            {/* App Branding Title */}
            <div className="flex items-center gap-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
              <span>{brandTitle}</span>
              <span className="text-emerald-400 font-black tracking-normal px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-2xl sm:text-3xl">
                {brandAccent}
              </span>
            </div>

            {/* Tagline */}
            <p className="mt-3 text-xs sm:text-sm font-semibold tracking-widest uppercase text-zinc-400">
              {tagline}
            </p>

            {/* Loading Spinner & Status */}
            <div className="mt-10 flex flex-col items-center gap-3.5">
              {/* High-End Ring Spinner */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/15" />
                <Motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-400/60"
                />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>

              {/* Status Message */}
              <p className="text-[11px] sm:text-xs text-zinc-500 font-medium tracking-wide animate-pulse">
                {statusMessage}
              </p>
            </div>
          </Motion.div>

          {/* Bottom Version / Security Tag */}
          <div className="absolute bottom-6 flex items-center gap-2 text-[10px] text-zinc-600 font-mono tracking-wider">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-ping" />
            <span>SECURE SESSION • V1.0</span>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

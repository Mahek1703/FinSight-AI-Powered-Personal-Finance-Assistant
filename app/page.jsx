"use client";

import React, { useState, useEffect } from "react";
import SplashScreen from "../components/SplashScreen";

export default function Page() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen on initial page load for ~2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen isLoading={showSplash} />
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#000000] text-white">
        <div className="text-center max-w-xl mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">
            FinSight <span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-zinc-400 text-sm">
            Intelligent Personal Finance Assistant Command Center.
          </p>
        </div>
      </main>
    </>
  );
}

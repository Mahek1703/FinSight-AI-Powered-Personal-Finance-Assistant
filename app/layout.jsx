"use client";

import React, { useState, useEffect } from "react";
import SplashScreen from "../components/SplashScreen";

export default function RootLayout({ children }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show the splash screen on initial app load for ~2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <title>FinSight AI - Smart Personal Finance Assistant</title>
        <meta
          name="description"
          content="AI-powered personal finance assistant with real-time analytics, automated transaction tracking, and intelligent financial insights."
        />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-[#000000] text-white min-h-screen antialiased">
        {/* Animated Splash Screen */}
        <SplashScreen isLoading={showSplash} />

        {/* Application Content */}
        {children}
      </body>
    </html>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../landing.css";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  FaArrowRight,
  FaChartLine,
  FaCloud,
  FaBrain,
  FaBars,
  FaTimes,
  FaCheck,
  FaUser,
  FaShieldAlt,
  FaMicrophone,
  FaSignOutAlt,
  FaTachometerAlt,
  FaSun,
  FaMoon,
} from "react-icons/fa";

function Landing({ onLogin, setIsLoginOpen, onGetStarted, themeMode = "dark", toggleThemeMode = () => {} }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const handleGetStarted = () => {
    if (typeof onGetStarted === "function") {
      onGetStarted();
    } else {
      navigate("/dashboard");
    }
  };

  const handleLogin = () => {
    if (typeof setIsLoginOpen === "function") {
      setIsLoginOpen(true);
    } else if (typeof onLogin === "function") {
      onLogin();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  const featureBadges = [
    { label: "AI Insights", icon: <FaBrain /> },
    { label: "100% Secure", icon: <FaShieldAlt /> },
    { label: "Works Offline", icon: <FaCloud /> },
    { label: "Voice Entry", icon: <FaMicrophone /> },
  ];

  return (
    <div className="fs-splash-shell">
      {/* Ambient background glow & ripple effects */}
      <div className="fs-splash-bg-glow glow-top" />
      <div className="fs-splash-bg-glow glow-center" />
      <div className="fs-splash-bg-ripple ripple-1" />
      <div className="fs-splash-bg-ripple ripple-2" />
      <div className="fs-splash-bg-ripple ripple-3" />

      {/* Top Header */}
      <header className="fs-splash-header">
        <div
          className="fs-splash-brand"
          onClick={handleGetStarted}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleGetStarted();
            }
          }}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
        >
          <div className="fs-splash-brand-icon">
            <FaChartLine />
          </div>
          <div className="fs-splash-brand-text">
            <strong>
              FinSight <span className="green-accent">AI</span>
            </strong>
            <small>AI POWERED FINANCE</small>
          </div>
        </div>

        {/* Desktop Header Actions */}
        <div className="fs-splash-desktop-actions">
          {/* 1-Click Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleThemeMode}
            className="w-9 h-9 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center cursor-pointer transition-all active:scale-95"
            aria-label={`Switch to ${themeMode === "light" ? "Dark" : "Light"} mode`}
            title={`Switch to ${themeMode === "light" ? "Dark" : "Light"} mode`}
          >
            {themeMode === "light" ? (
              <FaMoon className="text-sm text-indigo-400" />
            ) : (
              <FaSun className="text-sm text-amber-400" />
            )}
          </button>

          {currentUser ? (
            <>
              <button
                className="fs-splash-btn-login"
                type="button"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="text-rose-400" /> Logout
              </button>
              <button
                className="fs-splash-btn-start"
                type="button"
                onClick={() => navigate("/dashboard")}
              >
                <FaTachometerAlt className="text-emerald-400" /> Go to Dashboard
              </button>
            </>
          ) : (
            <>
              <button
                className="fs-splash-btn-login"
                type="button"
                onClick={handleLogin}
              >
                <FaUser className="text-zinc-400" /> Login
              </button>
              <button
                className="fs-splash-btn-start"
                type="button"
                onClick={handleGetStarted}
              >
                Get Started Free <FaArrowRight />
              </button>
            </>
          )}
        </div>

        {/* Mobile Actions: Theme Switcher + Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleThemeMode}
            className="w-9 h-9 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center cursor-pointer transition-all active:scale-95"
            aria-label={`Switch to ${themeMode === "light" ? "Dark" : "Light"} mode`}
          >
            {themeMode === "light" ? (
              <FaMoon className="text-sm text-indigo-400" />
            ) : (
              <FaSun className="text-sm text-amber-400" />
            )}
          </button>

          <button
            className="fs-splash-mobile-toggle"
            type="button"
            aria-label="Toggle Navigation"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fs-splash-mobile-drawer">
          {currentUser ? (
            <>
              <button
                className="fs-splash-btn-start full"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/dashboard");
                }}
              >
                <FaTachometerAlt /> Go to Dashboard
              </button>
              <button
                className="fs-splash-btn-login full"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="fs-splash-btn-start full"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleGetStarted();
                }}
              >
                Get Started Free <FaArrowRight />
              </button>
              <button
                className="fs-splash-btn-login full"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogin();
                }}
              >
                <FaUser /> Login
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Center Splash Content */}
      <main className="fs-splash-hero">
        {/* Sculpted 'F' Logo Icon */}
        <div className="fs-splash-sculpted-logo">
          <svg
            viewBox="0 0 100 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="sculpted-f-svg"
          >
            <defs>
              <linearGradient id="sculptedFGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                {themeMode === "light" ? (
                  <>
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="45%" stopColor="#1e293b" />
                    <stop offset="75%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#64748b" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="45%" stopColor="#e2e8f0" />
                    <stop offset="75%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </>
                )}
              </linearGradient>
              <filter id="sculptedGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="8"
                  stdDeviation="12"
                  floodColor="#00d084"
                  floodOpacity={themeMode === "light" ? 0.35 : 0.25}
                />
              </filter>
            </defs>
            <path
              d="M 24 16 L 82 16 C 88 16 92 20 92 26 C 92 32 88 36 82 36 L 46 36 L 46 54 L 76 54 C 82 54 86 58 86 64 C 86 70 82 74 76 74 L 46 74 L 46 102 C 46 108 42 112 36 112 C 30 112 26 108 26 102 L 26 26 C 26 20 30 16 36 16 Z"
              fill="url(#sculptedFGrad)"
              filter="url(#sculptedGlow)"
            />
          </svg>
        </div>

        {/* Brand Title & Sub-tagline */}
        <h1 className="fs-splash-title">
          FinSight <span className="green-accent">AI</span>
        </h1>
        <p className="fs-splash-subtag">AI POWERED FINANCE</p>

        {/* Trust Pill Badge */}
        <div className="fs-splash-trust-badge">
          <FaCheck className="check-icon" />
          <span>Smart. Secure. AI Powered.</span>
        </div>

        {/* 4 Feature Squircles */}
        <div className="fs-splash-features-grid">
          {featureBadges.map((badge) => (
            <div className="fs-splash-feature-card" key={badge.label}>
              <div className="fs-splash-feature-icon">{badge.icon}</div>
              <span className="fs-splash-feature-name">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom Call-To-Action Horizon */}
        <div className="fs-splash-cta-section">
          <div className="fs-splash-horizon-glow" />
          {currentUser ? (
            <>
              <button
                className="fs-splash-btn-primary"
                type="button"
                onClick={() => navigate("/dashboard")}
              >
                <FaTachometerAlt /> Go to Dashboard
              </button>
              <button
                className="fs-splash-btn-secondary"
                type="button"
                onClick={handleLogout}
              >
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="fs-splash-btn-primary"
                type="button"
                onClick={handleGetStarted}
              >
                Get Started Free <FaArrowRight />
              </button>
              <button
                className="fs-splash-btn-secondary"
                type="button"
                onClick={handleLogin}
              >
                <FaUser /> Login
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Landing;

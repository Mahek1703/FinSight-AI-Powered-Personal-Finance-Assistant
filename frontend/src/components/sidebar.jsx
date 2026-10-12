import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaWallet,
  FaChartBar,
  FaRobot,
  FaCog,
  FaSun,
  FaMoon,
  FaSignOutAlt,
  FaSignInAlt,
  FaTimes,
  FaChartLine,
} from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Sidebar({
  sidebarOpen = false,
  setSidebarOpen = () => {},
  isLoggedIn = false,
  setShowForm = () => {},
  themeMode = "dark",
  toggleThemeMode = () => {},
  showToast = () => {},
}) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully.", "info");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
    }`;

  const closeMobileSidebar = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fs-sidebar fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-[#090d14] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
          <NavLink
            to="/dashboard"
            onClick={closeMobileSidebar}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <FaChartLine className="text-lg" />
            </div>
            <div>
              <div className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1">
                FinSight <span className="text-emerald-400">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">
                Command Center
              </p>
            </div>
          </NavLink>

          <button
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors"
            onClick={closeMobileSidebar}
            aria-label="Close Sidebar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <NavLink
            to="/dashboard"
            className={navItemClass}
            onClick={closeMobileSidebar}
          >
            <FaHome className="text-base shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={navItemClass}
            onClick={closeMobileSidebar}
          >
            <FaWallet className="text-base shrink-0" />
            <span>Transactions</span>
          </NavLink>

          <NavLink
            to="/ai-advisor"
            className={navItemClass}
            onClick={closeMobileSidebar}
          >
            <FaRobot className="text-base shrink-0" />
            <span>AI Advisor</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={navItemClass}
            onClick={closeMobileSidebar}
          >
            <FaChartBar className="text-base shrink-0" />
            <span>Reports</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={navItemClass}
            onClick={closeMobileSidebar}
          >
            <FaCog className="text-base shrink-0" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Footer: Theme Toggle & Auth */}
        <div className="p-4 border-t border-slate-800/60 space-y-3">
          {/* Theme Switcher */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-2">
              {themeMode === "light" ? <FaSun className="text-amber-400" /> : <FaMoon className="text-indigo-400" />}
              {themeMode === "light" ? "Light Mode" : "Dark Mode"}
            </span>
            <button
              type="button"
              onClick={toggleThemeMode}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              aria-label="Toggle theme"
            >
              {themeMode === "light" ? <FaMoon size={12} /> : <FaSun size={12} />}
            </button>
          </div>

          {/* Auth Button */}
          <button
            type="button"
            onClick={() => {
              closeMobileSidebar();
              if (isLoggedIn) {
                handleLogout();
              } else {
                setShowForm(true);
              }
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
              isLoggedIn
                ? "bg-rose-500/10 text-white border border-rose-500/40 hover:bg-rose-500/20"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500 font-bold"
            }`}
          >
            {isLoggedIn ? (
              <>
                <FaSignOutAlt />
                <span>Logout</span>
              </>
            ) : (
              <>
                <FaSignInAlt />
                <span>Login / Register</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
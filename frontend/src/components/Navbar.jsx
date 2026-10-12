import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaHome,
  FaWallet,
  FaRobot,
  FaChartBar,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaSignInAlt,
  FaSun,
  FaMoon,
  FaBars,
  FaTimes,
  FaUser,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaMagic,
  FaUpload,
  FaCoins,
  FaMicrophone,
} from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Navbar({
  isLoggedIn = false,
  currentUser = null,
  setShowForm = () => {},
  showToast = () => {},
  themeMode = "dark",
  toggleThemeMode = () => {},
  notifications = [],
  openUpload = () => {},
  onOpenVoiceAssistant = () => {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [clearedNotifs, setClearedNotifs] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully.", "info");
      setUserMenuOpen(false);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const navLinkClass = ({ isActive }) =>
    `px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-150 cursor-pointer ${
      isActive
        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
        : "text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all duration-150 w-full ${
      isActive
        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
        : "text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent"
    }`;

  const activeNotifs = clearedNotifs ? [] : notifications;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#000000]/90 backdrop-blur-2xl border-b border-white/[0.08] transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* ==========================================================================
              Left Section: Brand Logo & Title (FinSight AI - Command Center)
              ========================================================================== */}
          <button
            onClick={() => navigate("/dashboard")}
            type="button"
            className="flex items-center gap-2.5 group text-left cursor-pointer border-none bg-transparent p-0 shrink-0"
            aria-label="FinSight AI Command Center"
          >
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <FaChartLine className="text-sm" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1 leading-none">
                FinSight <span className="text-emerald-400 font-black">AI</span>
              </div>
              <p className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase mt-0.5">
                Command Center
              </p>
            </div>
          </button>

          {/* ==========================================================================
              Center Section: Pill-style Navigation Links
              ========================================================================== */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-[#08080b] border border-white/[0.06] rounded-2xl">
            <NavLink to="/dashboard" className={navLinkClass}>
              <FaHome className="text-xs shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/transactions" className={navLinkClass}>
              <FaWallet className="text-xs shrink-0" />
              <span>Ledger</span>
            </NavLink>

            <NavLink to="/accounts" className={navLinkClass}>
              <FaCoins className="text-xs shrink-0" />
              <span>Accounts</span>
            </NavLink>

            <NavLink to="/ai-advisor" className={navLinkClass}>
              <FaRobot className="text-xs shrink-0" />
              <span>AI Advisor</span>
            </NavLink>

            <NavLink to="/reports" className={navLinkClass}>
              <FaChartBar className="text-xs shrink-0" />
              <span>Reports</span>
            </NavLink>

            <NavLink to="/settings" className={navLinkClass}>
              <FaCog className="text-xs shrink-0" />
              <span>Settings</span>
            </NavLink>
          </nav>

          {/* ==========================================================================
              Right Section: Quick Theme Switcher + Notification Bell + User Avatar
              ========================================================================== */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Voice AI Assistant Trigger */}
            <button
              type="button"
              onClick={onOpenVoiceAssistant}
              className="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center cursor-pointer transition-all active:scale-95 group relative"
              aria-label="Voice AI Expense Assistant"
              title="Voice AI Expense Assistant"
            >
              <FaMicrophone className="text-xs group-hover:scale-110 transition-transform" />
            </button>

            {/* Direct 1-Click Theme Switcher Button */}
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

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen((prev) => !prev)}
                className="w-9 h-9 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all relative"
                aria-label="Notifications"
              >
                <FaBell className="text-sm" />
                {activeNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#080b11]">
                    {activeNotifs.length > 9 ? "9+" : activeNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-[#0D0D0D] border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FaBell className="text-emerald-400 text-xs" /> Notifications ({activeNotifs.length})
                    </h3>
                    {activeNotifs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setClearedNotifs(true);
                          showToast("All notifications cleared.", "info");
                        }}
                        className="text-xs text-zinc-500 hover:text-white bg-transparent border-none cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                    {activeNotifs.length > 0 ? (
                      activeNotifs.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (notif.path) navigate(notif.path);
                            setNotifDropdownOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 cursor-pointer transition-all flex items-start gap-2.5"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            {notif.type === "bill" ? (
                              <FaFileInvoiceDollar className="text-xs" />
                            ) : notif.type === "alert" ? (
                              <FaExclamationTriangle className="text-xs text-rose-400" />
                            ) : (
                              <FaMagic className="text-xs" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-200 font-medium leading-snug">{notif.text}</p>
                            <span className="text-[10px] text-zinc-500 mt-1 block">{notif.time || "Just now"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-zinc-500 text-xs">
                        No new notifications. You're all caught up!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Dropdown */}
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 cursor-pointer transition-all"
                aria-label="User profile menu"
              >
                {isLoggedIn && currentUser ? (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center relative">
                    {currentUser.displayName
                      ? currentUser.displayName.charAt(0).toUpperCase()
                      : currentUser.email
                      ? currentUser.email.charAt(0).toUpperCase()
                      : "U"}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-black" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 text-xs flex items-center justify-center">
                    <FaUser className="text-[11px]" />
                  </div>
                )}
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hidden sm:inline max-w-[100px] truncate">
                  {currentUser?.displayName || (isLoggedIn ? "Member" : "Guest")}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0D0D0D] border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser?.displayName || (isLoggedIn ? "FinSight Member" : "Guest User")}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {currentUser?.email || (isLoggedIn ? "Protected Account" : "Demo Workspace")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigate("/settings");
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 cursor-pointer transition-all border-none bg-transparent"
                  >
                    <FaUser className="text-zinc-400" /> Profile & Settings
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleThemeMode();
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 cursor-pointer transition-all border-none bg-transparent"
                  >
                    {themeMode === "light" ? <FaMoon className="text-indigo-400" /> : <FaSun className="text-amber-400" />}
                    Theme: {themeMode === "light" ? "Light" : "Dark"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof openUpload === "function") openUpload();
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 cursor-pointer transition-all border-none bg-transparent"
                  >
                    <FaUpload className="text-emerald-400" /> Import CSV / Excel
                  </button>
                </div>
              )}
            </div>

            {/* Logout / Login CTA Button */}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-white border border-rose-500/50 hover:border-rose-500 cursor-pointer active:scale-95 transition-all"
                title="Logout"
              >
                <FaSignOutAlt className="text-xs text-rose-400" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500 cursor-pointer active:scale-95 transition-all"
              >
                <FaSignInAlt className="text-xs text-emerald-400" />
                <span className="text-white font-bold">Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <FaTimes className="text-sm" /> : <FaBars className="text-sm" />}
            </button>
          </div>
        </div>

        {/* ==========================================================================
            Mobile Navigation Dropdown Menu
            ========================================================================== */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-zinc-800/80 space-y-1 animate-in slide-in-from-top-2 duration-150">
            <NavLink to="/dashboard" className={mobileNavLinkClass}>
              <FaHome className="text-sm" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/transactions" className={mobileNavLinkClass}>
              <FaWallet className="text-sm" />
              <span>Transactions</span>
            </NavLink>

            <NavLink to="/accounts" className={mobileNavLinkClass}>
              <FaCoins className="text-sm" />
              <span>Accounts</span>
            </NavLink>

            <NavLink to="/ai-advisor" className={mobileNavLinkClass}>
              <FaRobot className="text-sm" />
              <span>AI Advisor</span>
            </NavLink>

            <NavLink to="/reports" className={mobileNavLinkClass}>
              <FaChartBar className="text-sm" />
              <span>Reports</span>
            </NavLink>

            <NavLink to="/settings" className={mobileNavLinkClass}>
              <FaCog className="text-sm" />
              <span>Settings</span>
            </NavLink>

            <div className="pt-2 border-t border-zinc-800/80">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-pointer"
                >
                  <FaSignOutAlt /> Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowForm(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500 cursor-pointer"
                >
                  <FaSignInAlt className="text-emerald-400" /> Sign In / Register
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;

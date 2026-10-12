import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaChevronRight,
  FaDownload,
  FaInfoCircle,
  FaLock,
  FaMoon,
  FaPalette,
  FaShieldAlt,
  FaSlidersH,
  FaSun,
  FaUpload,
  FaUser,
  FaTrash,
  FaCheck,
  FaDatabase,
} from "react-icons/fa";

const KEY = "finsightCommandSettings";

const defaults = {
  name: "FinSight User",
  email: "user@finsight.ai",
  currency: "INR (₹)",
  dateFormat: "DD/MM/YYYY",
  weekStart: "Monday",
  transactionAlerts: true,
  budgetAlerts: true,
  weeklySummary: true,
  aiInsights: true,
};

function Settings({ currentUser, themeMode = "dark", toggleThemeMode = () => {}, showToast = () => {} }) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY)) };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }, [settings]);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggle = (key) => {
    update(key, !settings[key]);
    showToast(`${key} updated!`, "success");
  };

  const handleClearCache = () => {
    if (window.confirm("Clear offline cached data? Your cloud records in Firestore remain safe.")) {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("finsight_") || k.startsWith("finsightCommandSettings")) {
          localStorage.removeItem(k);
        }
      });
      showToast("Offline cache cleared successfully.", "info");
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const handleExportData = () => {
    const userTxKey = currentUser?.uid
      ? `finsight_local_transactions_${currentUser.uid}`
      : "finsight_local_transactions";
    const rawData =
      localStorage.getItem(userTxKey) ||
      localStorage.getItem("finsight_local_transactions") ||
      "[]";
    const blob = new Blob([rawData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finsight_export_${currentUser?.uid || "data"}_${Date.now()}.json`;
    a.click();
    showToast("Export file generated.", "success");
  };

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Preferences & Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your profile, alerts, preferences and local storage
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportData}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors active:scale-[0.98]"
          >
            <FaDownload className="text-xs text-emerald-400" /> Export Data
          </button>
        </div>
      </div>

      {/* 2-Column Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Profile & Account */}
        <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.05]">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FaUser className="text-base" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Profile & Identity
              </h2>
              <p className="text-[11px] text-zinc-400">
                {currentUser ? `Signed in as ${currentUser.email || currentUser.displayName || "User"}` : "Guest Session (Local Mode)"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full bg-[#0c0c10] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={currentUser?.email || settings.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full bg-[#0c0c10] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Preferred Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => update("currency", e.target.value)}
                className="w-full bg-[#0c0c10] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="INR (₹)">INR (₹ - Indian Rupee)</option>
                <option value="USD ($)">USD ($ - US Dollar)</option>
                <option value="EUR (€)">EUR (€ - Euro)</option>
                <option value="GBP (£)">GBP (£ - British Pound)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Appearance & Monotonic Theme */}
        <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.05]">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FaPalette className="text-base" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Appearance & Theme
              </h2>
              <p className="text-[11px] text-zinc-400">
                Choose between Ultra-Modern Dark & Light Monotonic Modes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                if (themeMode !== "dark") toggleThemeMode();
                showToast("Switched to Dark Monotonic Mode", "info");
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                themeMode === "dark"
                  ? "bg-[#121318] border-emerald-500 ring-1 ring-emerald-500/50"
                  : "bg-[#0c0c10] border-white/[0.08] hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                  <FaMoon className="text-sm" />
                </div>
                {themeMode === "dark" && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold">
                    <FaCheck />
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white">Dark Monotonic</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Deep black OLED contrast</p>
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => {
                if (themeMode !== "light") toggleThemeMode();
                showToast("Switched to Light Monotonic Mode", "info");
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                themeMode === "light"
                  ? "bg-[#ffffff] border-emerald-500 ring-1 ring-emerald-500/50"
                  : "bg-[#0c0c10] border-white/[0.08] hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-indigo-600">
                  <FaSun className="text-sm" />
                </div>
                {themeMode === "light" && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold">
                    <FaCheck />
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white">Light Monotonic</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Crisp modern white canvas</p>
            </button>
          </div>
        </div>

        {/* Card 3: Notifications & AI Alerts */}
        <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.05]">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FaBell className="text-base" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Alerts & Automations
              </h2>
              <p className="text-[11px] text-zinc-400">
                Configure push alerts & intelligent notifications
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c10] border border-white/[0.04]">
              <div>
                <span className="text-xs font-semibold text-white block">Budget Overrun Alerts</span>
                <span className="text-[10px] text-zinc-500">Notify when category spend exceeds 80%</span>
              </div>
              <input
                type="checkbox"
                checked={settings.budgetAlerts}
                onChange={() => toggle("budgetAlerts")}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c10] border border-white/[0.04]">
              <div>
                <span className="text-xs font-semibold text-white block">Upcoming Bill Reminders</span>
                <span className="text-[10px] text-zinc-500">Alert 3 days prior to due dates</span>
              </div>
              <input
                type="checkbox"
                checked={settings.transactionAlerts}
                onChange={() => toggle("transactionAlerts")}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c10] border border-white/[0.04]">
              <div>
                <span className="text-xs font-semibold text-white block">AI Wealth Suggestions</span>
                <span className="text-[10px] text-zinc-500">Weekly automated savings optimizations</span>
              </div>
              <input
                type="checkbox"
                checked={settings.aiInsights}
                onChange={() => toggle("aiInsights")}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Storage & Cache Management */}
        <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.05]">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FaDatabase className="text-base" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Data Storage & Offline PWA Cache
              </h2>
              <p className="text-[11px] text-zinc-400">
                Manage browser local storage, offline cache and backups
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c0c10] border border-white/[0.04]">
            <div>
              <h3 className="text-xs font-bold text-white">Clear Offline Cache</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Reset local temporary storage if experiencing sync anomalies. Cloud Firestore data remains secure.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearCache}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-white border border-rose-500/50 hover:border-rose-500 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shrink-0 active:scale-[0.98]"
            >
              <FaTrash className="text-xs text-rose-400" /> Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
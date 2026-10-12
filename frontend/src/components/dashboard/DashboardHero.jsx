import React, { useState } from "react";
import {
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaMicrophone,
  FaFileImport,
  FaSyncAlt,
  FaWallet,
  FaChartLine,
  FaReceipt,
} from "react-icons/fa";
import AnomalyAlertBanner from "./AnomalyAlertBanner";

export default function DashboardHero({
  totalBalance = 0,
  totalIncome = 0,
  totalExpense = 0,
  transactions = [],
  onOpenAddModal = () => {},
  onOpenVoiceModal = () => {},
  onOpenImport = () => {},
  onOpenSyncTab = () => {},
  onOpenReceiptModal = () => {},
}) {

  const [hideBalance, setHideBalance] = useState(false);

  const formatMoney = (val) => {
    if (hideBalance) return "••••••";
    return `₹${Number(val || 0).toLocaleString("en-IN")}`;
  };

  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  return (
    <section className="w-full bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Column: Net Balance & Savings Metric */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FaWallet className="text-emerald-400 text-xs" /> Total Net Balance
            </span>
            <button
              type="button"
              onClick={() => setHideBalance(!hideBalance)}
              className="p-1 text-zinc-500 hover:text-zinc-300 bg-transparent border-none rounded cursor-pointer transition-colors"
              title={hideBalance ? "Show balance" : "Hide balance"}
              aria-label="Toggle balance privacy"
            >
              {hideBalance ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
            </button>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {savingsRate}% Saved
            </span>
            <AnomalyAlertBanner transactions={transactions} compact={true} />
          </div>


          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {formatMoney(totalBalance)}
            </h1>
          </div>

          <p className="text-xs text-zinc-400">
            Real-time balance calculated across all linked cash, online & bank accounts.
          </p>
        </div>

        {/* Center/Right Column: Income & Expense Mini Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:min-w-[320px]">
          {/* Total Income Chip */}
          <div className="bg-[#0e0e12] border border-white/[0.05] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 transition-all hover:border-emerald-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-zinc-400">Income</span>
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">
                <FaArrowUp />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">
              {formatMoney(totalIncome)}
            </div>
          </div>

          {/* Total Expense Chip */}
          <div className="bg-[#0e0e12] border border-white/[0.05] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 transition-all hover:border-rose-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-zinc-400">Expense</span>
              <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 text-xs">
                <FaArrowDown />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-rose-400">
              {formatMoney(totalExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar (Primary Action Buttons) */}
      <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-500 transition-all active:scale-[0.97] cursor-pointer"
          >
            <FaPlus className="text-xs text-emerald-400" />
            <span className="text-white font-bold">Add Transaction</span>
          </button>

          <button
            type="button"
            onClick={onOpenReceiptModal}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <FaReceipt className="text-xs text-emerald-400" />
            <span className="hidden sm:inline">Scan Receipt</span>
          </button>

          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="px-3.5 py-2.5 rounded-xl bg-[#121217] hover:bg-[#181820] text-zinc-300 hover:text-white border border-white/[0.08] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <FaMicrophone className="text-xs text-emerald-400" />
            <span className="hidden sm:inline">Voice Log</span>
          </button>


          <button
            type="button"
            onClick={onOpenImport}
            className="px-3.5 py-2.5 rounded-xl bg-[#121217] hover:bg-[#181820] text-zinc-300 hover:text-white border border-white/[0.08] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <FaFileImport className="text-xs text-sky-400" />
            <span className="hidden sm:inline">Import Statement</span>
          </button>

          <button
            type="button"
            onClick={onOpenSyncTab}
            className="px-3.5 py-2.5 rounded-xl bg-[#121217] hover:bg-[#181820] text-zinc-300 hover:text-white border border-white/[0.08] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <FaSyncAlt className="text-xs text-purple-400" />
            <span className="hidden sm:inline">Gmail Sync</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-2 text-xs text-zinc-500">
          <FaChartLine className="text-emerald-400" />
          <span>All data encrypted & auto-synced</span>
        </div>
      </div>
    </section>
  );
}

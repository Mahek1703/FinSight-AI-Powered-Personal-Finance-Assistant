import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaWallet,
  FaRobot,
  FaCoins,
  FaPlus,
} from "react-icons/fa";

export default function MobileBottomNav({ onOpenAddModal = () => {} }) {
  const navItemClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 py-1 px-1.5 rounded-2xl transition-all cursor-pointer relative group ${
      isActive
        ? "text-emerald-400 font-bold"
        : "text-zinc-400 hover:text-emerald-400"
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-12px_40px_rgba(0,0,0,0.95)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Item 1: Home */}
        <NavLink to="/dashboard" className={navItemClass}>
          {({ isActive }) => (
            <>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.3)] scale-110"
                    : "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/40 group-hover:scale-105"
                }`}
              >
                <FaHome className="text-base" />
              </div>
              <span className="text-[10px] tracking-tight font-medium">Home</span>
            </>
          )}
        </NavLink>

        {/* Item 2: Ledger */}
        <NavLink to="/transactions" className={navItemClass}>
          {({ isActive }) => (
            <>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.3)] scale-110"
                    : "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/40 group-hover:scale-105"
                }`}
              >
                <FaWallet className="text-base" />
              </div>
              <span className="text-[10px] tracking-tight font-medium">Ledger</span>
            </>
          )}
        </NavLink>

        {/* Item 3: Quick Add (+) */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center gap-1 py-1 px-1.5 rounded-2xl transition-all cursor-pointer relative group bg-transparent border-none text-zinc-400 hover:text-emerald-400 active:scale-95"
          aria-label="Add Transaction"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/40 group-hover:scale-105 group-hover:shadow-[0_0_14px_rgba(16,185,129,0.3)]">
            <FaPlus className="text-base" />
          </div>
          <span className="text-[10px] tracking-tight font-medium">Add</span>
        </button>

        {/* Item 4: Accounts */}
        <NavLink to="/accounts" className={navItemClass}>
          {({ isActive }) => (
            <>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.3)] scale-110"
                    : "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/40 group-hover:scale-105"
                }`}
              >
                <FaCoins className="text-base" />
              </div>
              <span className="text-[10px] tracking-tight font-medium">Accounts</span>
            </>
          )}
        </NavLink>

        {/* Item 4: Advisor */}
        <NavLink to="/ai-advisor" className={navItemClass}>
          {({ isActive }) => (
            <>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.3)] scale-110"
                    : "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/40 group-hover:scale-105"
                }`}
              >
                <FaRobot className="text-base" />
              </div>
              <span className="text-[10px] tracking-tight font-medium">Advisor</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}


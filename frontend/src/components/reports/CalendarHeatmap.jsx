import React from "react";
import { FaFire, FaTimes } from "react-icons/fa";
import {
  formatCurrency,
  getCurrencySymbol,
  HEATMAP_THRESHOLDS,
} from "../../config/constants.js";

export default function CalendarHeatmap({
  monthName,
  selectedYear,
  recordsCount = 0,
  heatmapDays = [],
  selectedDay = null,
  setSelectedDay = () => {},
  selectedDayTransactions = [],
  money = formatCurrency,
  getCategoryIcon = () => null,
  getCategoryIconSquircle = () => "",
}) {
  return (
    <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FaFire className="text-base" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Daily Spending Heatmap
            </h2>
            <p className="text-[11px] text-zinc-400">
              {monthName} {selectedYear} • Tap any date to inspect details
            </p>
          </div>
        </div>

        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {recordsCount} records
        </span>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-zinc-500 py-1">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>

      {/* Heatmap Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {heatmapDays.map((item) => {
          if (item.empty) {
            return (
              <div
                key={item.key}
                className="aspect-square rounded-xl bg-transparent opacity-0 pointer-events-none"
              />
            );
          }

          const isSelected = selectedDay === item.day;

          let bgStyle =
            "bg-[#101015] border border-white/[0.08] text-zinc-400 hover:border-white/30";
          let dotBadge = null;

          if (item.level === "low") {
            bgStyle =
              "bg-[#064e3b]/50 border-2 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-[#064e3b]/80";
            dotBadge = "bg-emerald-400 shadow-[0_0_6px_#10b981]";
          } else if (item.level === "medium") {
            bgStyle =
              "bg-[#78350f]/50 border-2 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:bg-[#78350f]/80";
            dotBadge = "bg-amber-400 shadow-[0_0_6px_#f59e0b]";
          } else if (item.level === "high") {
            bgStyle =
              "bg-[#881337]/50 border-2 border-rose-500 text-rose-300 shadow-[0_0_14px_rgba(244,63,94,0.35)] hover:bg-[#881337]/80";
            dotBadge = "bg-rose-400 shadow-[0_0_6px_#f43f5e]";
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedDay(item.day === selectedDay ? null : item.day)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 sm:p-2 transition-all cursor-pointer relative ${bgStyle} ${
                isSelected
                  ? "ring-2 ring-white scale-105 shadow-2xl z-10"
                  : "hover:scale-[1.04]"
              }`}
              title={`${item.day} ${monthName} ${selectedYear}: ${money(item.amount)} (${item.count} entries)`}
            >
              <div className="w-full flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold leading-none">
                  {item.day}
                </span>
                {dotBadge && (
                  <span className={`w-2 h-2 rounded-full ${dotBadge}`} />
                )}
              </div>

              {item.amount > 0 ? (
                <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight truncate max-w-full font-mono">
                  {getCurrencySymbol()}
                  {item.amount >= 1000
                    ? `${(item.amount / 1000).toFixed(1)}k`
                    : item.amount}
                </span>
              ) : (
                <span className="text-[9px] text-zinc-600 font-normal">-</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs text-zinc-400 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#18181f] border border-zinc-700 inline-block" />
          <span className="text-zinc-300">
            {formatCurrency(HEATMAP_THRESHOLDS.NO_SPEND)} No spend
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#064e3b] border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)] inline-block" />
          <span className="text-emerald-400 font-semibold">
            &lt; {formatCurrency(HEATMAP_THRESHOLDS.LOW)} Low
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#78350f] border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)] inline-block" />
          <span className="text-amber-400 font-semibold">
            {formatCurrency(HEATMAP_THRESHOLDS.LOW)}-
            {HEATMAP_THRESHOLDS.MEDIUM >= 1000
              ? `${HEATMAP_THRESHOLDS.MEDIUM / 1000}k`
              : formatCurrency(HEATMAP_THRESHOLDS.MEDIUM)}{" "}
            Medium
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#881337] border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)] inline-block" />
          <span className="text-rose-400 font-semibold">
            &gt; {formatCurrency(HEATMAP_THRESHOLDS.MEDIUM)} High
          </span>
        </div>
      </div>

      {/* Day Inspection Drill-Down Card */}
      {selectedDay && (
        <div className="p-4 rounded-2xl bg-[#0c0c10] border border-emerald-500/30 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="text-xs font-bold text-white">
                {selectedDay} {monthName} {selectedYear} Activity
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs text-zinc-500 hover:text-white bg-transparent border-none cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>

          {selectedDayTransactions.length === 0 ? (
            <p className="text-xs text-zinc-500 py-1">
              No expense records logged on this day.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDayTransactions.map((tx, idx) => {
                const isInc = (tx.type || "").toLowerCase() === "income";
                const cat = tx.Category || tx.category || "Others";
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#14141a] border border-white/[0.04] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${getCategoryIconSquircle(
                          cat
                        )}`}
                      >
                        {getCategoryIcon(cat)}
                      </div>
                      <div>
                        <strong className="text-white block">
                          {tx.Note || tx.note || cat}
                        </strong>
                        <span className="text-[10px] text-zinc-500">
                          {tx.Account || tx.accountType || "Cash"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        isInc ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isInc ? "+ " : "- "}
                      {formatCurrency(tx.Amount || tx.amount || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

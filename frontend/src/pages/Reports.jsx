import React, { useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaFire,
  FaChartPie,
  FaChartLine,
  FaMagic,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaCheck,
  FaUtensils,
  FaShoppingBag,
  FaFileInvoiceDollar,
  FaBriefcase,
  FaPlane,
  FaHeartbeat,
  FaGraduationCap,
  FaMoneyBillWave,
  FaWallet,
  FaFilter,
  FaTimes,
  FaExchangeAlt,
} from "react-icons/fa";
import CashFlowForecastCard from "../components/dashboard/CashFlowForecastCard";
import CalendarHeatmap from "../components/reports/CalendarHeatmap";
import {
  formatCurrency,
  HEATMAP_THRESHOLDS,
} from "../config/constants.js";
import ReportCharts from "../components/reports/ReportCharts";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const categoryColors = {
  Food: "#10b981",
  Shopping: "#a855f7",
  Bills: "#38bdf8",
  Travel: "#f59e0b",
  Health: "#f43f5e",
  Education: "#6366f1",
  Salary: "#10b981",
  Freelance: "#14b8a6",
  Investment: "#06b6d4",
  Others: "#71717a",
};

const getCategoryIcon = (category = "") => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("swiggy") || cat.includes("zomato") || cat.includes("dining"))
    return <FaUtensils className="text-emerald-500 dark:text-emerald-400" />;
  if (cat.includes("shop") || cat.includes("cloth") || cat.includes("amazon") || cat.includes("flipkart") || cat.includes("myntra"))
    return <FaShoppingBag className="text-purple-500 dark:text-purple-400" />;
  if (cat.includes("bill") || cat.includes("recharge") || cat.includes("electr") || cat.includes("wifi"))
    return <FaFileInvoiceDollar className="text-sky-500 dark:text-sky-400" />;
  if (cat.includes("salary") || cat.includes("freelance") || cat.includes("bonus") || cat.includes("income"))
    return <FaBriefcase className="text-emerald-500 dark:text-emerald-400" />;
  if (cat.includes("travel") || cat.includes("uber") || cat.includes("ola") || cat.includes("fuel") || cat.includes("flight"))
    return <FaPlane className="text-amber-500 dark:text-amber-400" />;
  if (cat.includes("health") || cat.includes("med") || cat.includes("doctor"))
    return <FaHeartbeat className="text-rose-500 dark:text-rose-400" />;
  if (cat.includes("education") || cat.includes("book") || cat.includes("course"))
    return <FaGraduationCap className="text-indigo-500 dark:text-indigo-400" />;
  if (cat.includes("invest") || cat.includes("stock") || cat.includes("crypto") || cat.includes("gold"))
    return <FaMoneyBillWave className="text-teal-500 dark:text-teal-400" />;
  return <FaWallet className="text-zinc-500 dark:text-zinc-400" />;
};

const getCategoryIconSquircle = (category = "") => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("travel") || cat.includes("uber") || cat.includes("flight") || cat.includes("ola") || cat.includes("fuel")) {
    return "bg-amber-500/10 border-amber-500/20 text-amber-500";
  }
  if (cat.includes("shop") || cat.includes("cloth") || cat.includes("amazon") || cat.includes("flipkart") || cat.includes("myntra")) {
    return "bg-purple-500/10 border-purple-500/20 text-purple-500";
  }
  if (cat.includes("food") || cat.includes("swiggy") || cat.includes("zomato") || cat.includes("dining")) {
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
  }
  if (cat.includes("bill") || cat.includes("recharge") || cat.includes("electr") || cat.includes("wifi")) {
    return "bg-sky-500/10 border-sky-500/20 text-sky-500";
  }
  if (cat.includes("salary") || cat.includes("freelance") || cat.includes("bonus") || cat.includes("income")) {
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
  }
  if (cat.includes("health") || cat.includes("med") || cat.includes("doctor")) {
    return "bg-rose-500/10 border-rose-500/20 text-rose-500";
  }
  if (cat.includes("education") || cat.includes("book") || cat.includes("course")) {
    return "bg-indigo-500/10 border-indigo-500/20 text-indigo-500";
  }
  if (cat.includes("invest") || cat.includes("stock") || cat.includes("crypto") || cat.includes("gold")) {
    return "bg-teal-500/10 border-teal-500/20 text-teal-500";
  }
  return "bg-zinc-100 dark:bg-[#14141a] border-zinc-200 dark:border-white/[0.06] text-zinc-500";
};

/**
 * Bulletproof date parser supporting:
 * - YYYY-MM-DD, ISO timestamps
 * - DD/MM/YYYY, DD-MM-YYYY
 * - MM/DD/YYYY
 * - Firestore Timestamps
 */
const parseTxDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;

  if (typeof dateVal === "object") {
    if (typeof dateVal.toDate === "function") return dateVal.toDate();
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
  }

  const str = String(dateVal).trim();
  if (!str) return null;

  // Try ISO / YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    const y = parseInt(dmyMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }

  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
};

function Reports({
  totalBalance = 0,
  csvData = [],
  loadingData = false,
}) {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth()); // 0 - 11
  const [filterMode, setFilterMode] = useState("month"); // 'month' | 'range' | 'year'

  // Custom date range inputs
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Selected Day on heatmap for drill-down view
  const [selectedDay, setSelectedDay] = useState(null);

  // Auto-rule inputs
  const [autoRuleInput, setAutoRuleInput] = useState("");
  const [rules, setRules] = useState([]);

  const money = (val) => formatCurrency(val);

  // Extract all available years from transactions + current year
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set([currentYear, 2024, 2025, 2026, 2027]);
    csvData.forEach((tx) => {
      const d = parseTxDate(tx.Date || tx.date || tx.createdAt);
      if (d) yearsSet.add(d.getFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [csvData]);

  // Navigate Previous Month
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    setSelectedDay(null);
  };

  // Navigate Next Month
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setSelectedDay(null);
  };

  // Jump to Current Month
  const handleJumpToCurrent = () => {
    const d = new Date();
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth());
    setSelectedDay(d.getDate());
  };

  // Filtered transactions based on active filterMode
  const filteredTransactions = useMemo(() => {
    return csvData.filter((tx) => {
      const d = parseTxDate(tx.Date || tx.date || tx.createdAt);
      if (!d) return true;

      if (filterMode === "month") {
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      }

      if (filterMode === "year") {
        return d.getFullYear() === selectedYear;
      }

      if (filterMode === "range") {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }

      return true;
    });
  }, [csvData, filterMode, selectedYear, selectedMonth, startDate, endDate]);

  // Monthly metrics for selected period
  const periodExpenses = useMemo(() => {
    return filteredTransactions
      .filter((tx) => (tx.type || "").toLowerCase() === "expense")
      .reduce((sum, tx) => sum + Number(tx.Amount || tx.amount || 0), 0);
  }, [filteredTransactions]);

  const periodIncome = useMemo(() => {
    return filteredTransactions
      .filter((tx) => (tx.type || "").toLowerCase() === "income")
      .reduce((sum, tx) => sum + Number(tx.Amount || tx.amount || 0), 0);
  }, [filteredTransactions]);

  const periodBalance = periodIncome - periodExpenses;

  // Category Breakdown for the selected period
  const categoryData = useMemo(() => {
    const map = {};
    filteredTransactions
      .filter((tx) => (tx.type || "").toLowerCase() === "expense")
      .forEach((tx) => {
        const cat = tx.Category || tx.category || "Others";
        map[cat] = (map[cat] || 0) + Number(tx.Amount || tx.amount || 0);
      });

    const entries = Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name] || "#71717a",
    }));

    if (entries.length === 0) {
      return [
        { name: "No Expenses Logged", value: 1, color: "#27272a" },
      ];
    }
    return entries;
  }, [filteredTransactions]);

  // 12-Month Yearly Overview Bar Chart Data
  const yearlyTrendData = useMemo(() => {
    const monthlySummary = MONTH_NAMES.map((name, idx) => ({
      month: name.slice(0, 3),
      monthIndex: idx,
      Income: 0,
      Expense: 0,
    }));

    csvData.forEach((tx) => {
      const d = parseTxDate(tx.Date || tx.date || tx.createdAt);
      if (d && d.getFullYear() === selectedYear) {
        const mIdx = d.getMonth();
        const amt = Number(tx.Amount || tx.amount || 0);
        const isInc = (tx.type || "").toLowerCase() === "income";
        if (isInc) {
          monthlySummary[mIdx].Income += amt;
        } else {
          monthlySummary[mIdx].Expense += amt;
        }
      }
    });

    return monthlySummary;
  }, [csvData, selectedYear]);

  const hasYearlyData = useMemo(() => {
    return yearlyTrendData.some(
      (m) => Number(m.Income || 0) > 0 || Number(m.Expense || 0) > 0
    );
  }, [yearlyTrendData]);

  // Dynamic Calendar Heatmap Computation for (selectedYear, selectedMonth)
  const { heatmapDays, dailyMap } = useMemo(() => {
    const map = {};

    // Group transactions for the chosen month and year
    csvData.forEach((tx) => {
      const d = parseTxDate(tx.Date || tx.date || tx.createdAt);
      if (d && d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        const dayNum = d.getDate();
        if (!map[dayNum]) {
          map[dayNum] = { amount: 0, count: 0, transactions: [] };
        }
        if ((tx.type || "").toLowerCase() === "expense") {
          map[dayNum].amount += Number(tx.Amount || tx.amount || 0);
        }
        map[dayNum].count += 1;
        map[dayNum].transactions.push(tx);
      }
    });

    // Total days in the selected month
    const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // First day of month (Monday=0, Tuesday=1, ... Sunday=6)
    const firstDayIndex = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7;

    const days = [];
    // Leading empty padding
    for (let p = 0; p < firstDayIndex; p++) {
      days.push({ empty: true, key: `empty-${p}` });
    }

    // Days 1..N
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayData = map[d] || { amount: 0, count: 0, transactions: [] };
      const amount = dayData.amount;
      let level = "none";
      if (amount > 0 && amount < 500) level = "low";
      else if (amount >= 500 && amount <= 2000) level = "medium";
      else if (amount > 2000) level = "high";

      days.push({
        day: d,
        amount,
        count: dayData.count,
        level,
        hasTx: dayData.count > 0,
        key: `day-${d}`,
      });
    }

    return { heatmapDays: days, dailyMap: map };
  }, [csvData, selectedYear, selectedMonth]);

  // Transactions list for the selected day
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay || !dailyMap[selectedDay]) return [];
    return dailyMap[selectedDay].transactions || [];
  }, [selectedDay, dailyMap]);

  const handleApplyRule = (e) => {
    e?.preventDefault();
    if (!autoRuleInput.trim()) return;
    setRules((prev) => [autoRuleInput.trim(), ...prev]);
    setAutoRuleInput("");
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredTransactions, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finsight_report_${MONTH_NAMES[selectedMonth]}_${selectedYear}.json`;
    a.click();
  };

  // Preset Date Ranges
  const handleSetPresetRange = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === "this_month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === "last_30") {
      start.setDate(today.getDate() - 30);
    } else if (preset === "last_90") {
      start.setDate(today.getDate() - 90);
    } else if (preset === "ytd") {
      start = new Date(today.getFullYear(), 0, 1);
    }

    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
    setFilterMode("range");
  };

  if (loadingData) {
    return (
      <div className="w-full space-y-6 pb-20 md:pb-8 animate-pulse">
        <div className="h-20 bg-zinc-900/60 rounded-2xl border border-white/[0.05]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-900/60 rounded-2xl border border-white/[0.05]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-zinc-900/60 rounded-2xl border border-white/[0.05]" />
          <div className="space-y-6">
            <div className="h-44 bg-zinc-900/60 rounded-2xl border border-white/[0.05]" />
            <div className="h-44 bg-zinc-900/60 rounded-2xl border border-white/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {/* 1. Header & Global Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Intelligent Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Reports & Trends
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Explore spending across custom months, dates, and historical years
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900/80 dark:bg-[#08080b] border border-zinc-700/40 dark:border-white/[0.08] rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setFilterMode("month")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all duration-200 ${
                filterMode === "month"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/25 border border-[#2563EB]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 dark:hover:bg-white/5 border border-transparent hover:border-blue-500/30"
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("range")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all duration-200 ${
                filterMode === "range"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/25 border border-[#2563EB]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 dark:hover:bg-white/5 border border-transparent hover:border-blue-500/30"
              }`}
            >
              Date Range
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("year")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all duration-200 ${
                filterMode === "year"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/25 border border-[#2563EB]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 dark:hover:bg-white/5 border border-transparent hover:border-blue-500/30"
              }`}
            >
              Full Year {selectedYear}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-4 py-2 rounded-xl bg-zinc-900/80 dark:bg-[#08080b] hover:bg-zinc-800 dark:hover:bg-[#14141a] text-zinc-100 border border-zinc-700/50 dark:border-white/[0.1] hover:border-blue-500/50 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all duration-200 active:scale-[0.98]"
          >
            <FaDownload className="text-xs text-blue-400" /> <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Month / Year / Date Range Control Bar */}
      <div className="p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-[#08080b] border border-white/[0.06] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {filterMode === "month" && (
          <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            {/* Prev Month Button */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2.5 rounded-xl bg-[#121218] hover:bg-[#181822] text-zinc-300 hover:text-white border border-white/[0.08] cursor-pointer transition-all active:scale-95"
              title="Previous Month"
            >
              <FaChevronLeft className="text-xs" />
            </button>

            {/* Month Select Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setSelectedDay(null);
              }}
              className="bg-[#121218] border border-white/[0.08] text-white rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx} className="bg-zinc-900 text-white font-medium">
                  {m}
                </option>
              ))}
            </select>

            {/* Year Select Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setSelectedDay(null);
              }}
              className="bg-[#121218] border border-white/[0.08] text-white rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-500/50 cursor-pointer font-mono"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-zinc-900 text-white font-medium">
                  {yr}
                </option>
              ))}
            </select>

            {/* Next Month Button */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2.5 rounded-xl bg-[#121218] hover:bg-[#181822] text-zinc-300 hover:text-white border border-white/[0.08] cursor-pointer transition-all active:scale-95"
              title="Next Month"
            >
              <FaChevronRight className="text-xs" />
            </button>

            {/* Jump to Today Shortcut */}
            <button
              type="button"
              onClick={handleJumpToCurrent}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500/40 hover:border-emerald-500 text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
            >
              Today
            </button>
          </div>
        )}

        {filterMode === "range" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center flex-wrap gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <FaCalendarAlt className="text-emerald-400" />
                <span>From</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#121218] border border-white/[0.08] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
              />
              <span className="text-xs text-zinc-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#121218] border border-white/[0.08] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={() => handleSetPresetRange("this_month")}
                className="px-2 py-1 rounded-lg bg-[#14141a] hover:bg-zinc-800 text-[11px] text-zinc-300 border border-white/[0.06] cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetRange("last_30")}
                className="px-2 py-1 rounded-lg bg-[#14141a] hover:bg-zinc-800 text-[11px] text-zinc-300 border border-white/[0.06] cursor-pointer"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetRange("ytd")}
                className="px-2 py-1 rounded-lg bg-[#14141a] hover:bg-zinc-800 text-[11px] text-zinc-300 border border-white/[0.06] cursor-pointer"
              >
                YTD
              </button>
            </div>
          </div>
        )}

        {filterMode === "year" && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400">Viewing Annual Trend for:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-[#121218] border border-white/[0.08] text-white rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-emerald-500/50 cursor-pointer font-mono"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-zinc-900 text-white font-medium">
                  {yr} Full Year
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Period Summary Quick Metric Chips */}
        <div className="flex items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.06]">
          <div>
            <span className="text-[10px] text-zinc-500 block">Inflow</span>
            <strong className="text-xs sm:text-sm font-bold text-emerald-400">
              {money(periodIncome)}
            </strong>
          </div>
          <div className="h-7 w-[1px] bg-white/[0.08]" />
          <div>
            <span className="text-[10px] text-zinc-500 block">Outflow</span>
            <strong className="text-xs sm:text-sm font-bold text-rose-400">
              {money(periodExpenses)}
            </strong>
          </div>
          <div className="h-7 w-[1px] bg-white/[0.08]" />
          <div>
            <span className="text-[10px] text-zinc-500 block">Net Balance</span>
            <strong className={`text-xs sm:text-sm font-bold ${periodBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {money(periodBalance)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Main Analytics View (Heatmap + Category Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Spending Heatmap Calendar */}
        <CalendarHeatmap
          monthName={MONTH_NAMES[selectedMonth]}
          selectedYear={selectedYear}
          recordsCount={filteredTransactions.length}
          heatmapDays={heatmapDays}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          selectedDayTransactions={selectedDayTransactions}
          money={money}
          getCategoryIcon={getCategoryIcon}
          getCategoryIconSquircle={getCategoryIconSquircle}
        />

        {/* Right Column: Category Distribution & Yearly Trend */}
        <ReportCharts
          filterMode={filterMode}
          monthName={MONTH_NAMES[selectedMonth]}
          selectedYear={selectedYear}
          periodExpenses={periodExpenses}
          categoryData={categoryData}
          yearlyTrendData={yearlyTrendData}
          hasYearlyData={hasYearlyData}
          money={money}
        />
      </div>

      {/* 4. Predictive Cash Flow & Expense Forecasting Engine */}
      <CashFlowForecastCard
        transactions={csvData}
        totalBalance={totalBalance}
      />

      {/* 5. Automated Categorization Rules Section */}
      <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-[#08080b] border border-white/[0.06] shadow-xl space-y-4">

        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
              <FaMagic />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Auto-Categorization Rules</h3>
              <p className="text-[11px] text-zinc-400">
                Teach FinSight AI to categorize merchant transactions automatically
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleApplyRule} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 'Categorize Starbucks as Food & Coffee'"
            value={autoRuleInput}
            onChange={(e) => setAutoRuleInput(e.target.value)}
            className="flex-1 bg-[#121218] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs cursor-pointer border border-emerald-500 transition-all active:scale-[0.98]"
          >
            Add Rule
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#0c0c10] border border-white/[0.04] text-xs text-zinc-300 flex items-center gap-2.5"
            >
              <FaCheck className="text-emerald-400 text-xs shrink-0" />
              <span className="truncate">{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reports;
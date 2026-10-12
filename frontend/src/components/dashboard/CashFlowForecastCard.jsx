import React, { useMemo, useState } from "react";
import {
  FaChartLine,
  FaFire,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaShieldAlt,
  FaCalendarAlt,
  FaRobot,
  FaLayerGroup,
  FaBolt,
  FaHourglassHalf,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { generateCashFlowForecast } from "../../utils/ForecastEngine";

/**
 * Custom Recharts Tooltip for Dark & Light Theme Parity
 */
const CustomForecastTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const isForecast = dataPoint?.isForecast;

    return (
      <div className="bg-[#0c0c10] border border-white/[0.12] p-3 rounded-xl shadow-2xl space-y-1.5 text-xs min-w-[170px] backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-1.5">
          <span className="font-bold text-white">{dataPoint?.fullName || label}</span>
          {isForecast && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              AI Forecast
            </span>
          )}
        </div>

        {payload.map((entry, idx) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color || entry.stroke }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                ₹{Number(entry.value).toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

/**
 * CashFlowForecastCard Component
 * 30-Day Predictive Cash Flow & Expense Forecasting Engine Card
 */
export default function CashFlowForecastCard({
  transactions = [],
  totalBalance = 0,
}) {
  const [viewMode, setViewMode] = useState("monthly"); // 'monthly' | 'runway'

  // Run dynamic forecasting calculations
  const forecast = useMemo(() => {
    return generateCashFlowForecast(transactions);
  }, [transactions]);

  const {
    hasEnoughData,
    projectedExpense,
    projectedIncome,
    projectedNetSavings,
    projectedSavingsRate,
    dailyBurnRate,
    growthRate,
    fixedExpenseAmount,
    variableExpenseAmount,
    fixedRatio,
    variableRatio,
    isCashCrunch,
    warningDay,
    alertMessage,
    alertType,
    chartData,
    runwayPoints,
    daySpan = 0,
  } = forecast;

  return (
    <div className="bg-[#08080b] border border-white/[0.06] rounded-[18px] md:rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
      {/* Background glowing ambient light */}
      <div
        className={`absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isCashCrunch ? "bg-amber-500/[0.05]" : "bg-emerald-500/[0.05]"
        }`}
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
            <FaChartLine className="text-base" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                30-Day Predictive Cash Flow Forecast
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <FaRobot className="text-[9px]" /> AI Predictive Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Machine learning cash burn modeling and safety margin runway analysis
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Monthly Trend vs 30-Day Runway) */}
        {hasEnoughData && (
          <div className="flex items-center p-1 bg-[#0c0c10] border border-white/[0.06] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "monthly"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly Trajectory
            </button>
            <button
              type="button"
              onClick={() => setViewMode("runway")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "runway"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              30-Day Runway
            </button>
          </div>
        )}
      </div>

      {/* Intelligent Smart Alert Banner */}
      {hasEnoughData && (
        <div
          className={`p-4 sm:p-5 rounded-[18px] border transition-all relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isCashCrunch
              ? "bg-gradient-to-r from-amber-500/15 via-amber-500/[0.06] to-transparent border-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
              : "bg-gradient-to-r from-emerald-500/15 via-emerald-500/[0.06] to-transparent border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-base ${
                isCashCrunch
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {isCashCrunch ? <FaExclamationTriangle /> : <FaCheckCircle />}
            </div>
            <div>
              <h4
                className={`text-xs sm:text-sm font-bold tracking-tight ${
                  isCashCrunch ? "text-amber-300" : "text-emerald-300"
                }`}
              >
                {isCashCrunch ? "Cash Crunch Advisory" : "Positive Cash Flow Trajectory"}
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed pt-0.5">
                {alertMessage}
              </p>
            </div>
          </div>

          {/* Quick Metric Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs font-mono font-extrabold px-3 py-1.5 rounded-xl border ${
                isCashCrunch
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}
            >
              {isCashCrunch
                ? `Crunch by Day ${warningDay}`
                : `+${projectedSavingsRate}% Savings`}
            </span>
          </div>
        </div>
      )}

      {/* Fallback Screen if < 30 Days of History */}
      {!hasEnoughData && (
        <div className="p-6 rounded-[18px] bg-[#0c0c10] border border-white/[0.06] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-2xl mx-auto">
            <FaHourglassHalf className="animate-pulse" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm sm:text-base font-bold text-white">
              AI Forecasting Unlocking Soon
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Log transactions for at least 30 days to unlock AI Predictive Forecasting. We require historical data to calculate your fixed baseline, variable variance, and daily burn rate with high confidence.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-xs mx-auto space-y-2 pt-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Historical Coverage</span>
              <span className="font-mono font-bold text-purple-400">{Math.min(30, daySpan)} / 30 Days</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (daySpan / 30) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid (Projected Expenses, Income, Burn Rate, Fixed vs Variable) */}
      {hasEnoughData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Projected Expenses */}
          <div className="p-4 rounded-[18px] bg-[#0c0c10] border border-white/[0.05] hover:border-rose-500/30 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <FaArrowDown className="text-rose-400 text-[10px]" /> Next Month Expense
              </span>
              {growthRate !== 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    growthRate > 0
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`} MoM
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono">
              ₹{projectedExpense.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-zinc-500">
              Weighted moving average projection
            </p>
          </div>

          {/* Card 2: Projected Income */}
          <div className="p-4 rounded-[18px] bg-[#0c0c10] border border-white/[0.05] hover:border-emerald-500/30 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <FaArrowUp className="text-emerald-400 text-[10px]" /> Next Month Income
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Inflow
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight font-mono">
              ₹{projectedIncome.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-zinc-500">
              Net Flow:{" "}
              <span className={projectedNetSavings >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {projectedNetSavings >= 0 ? "+" : ""}₹{projectedNetSavings.toLocaleString("en-IN")}
              </span>
            </p>
          </div>

          {/* Card 3: Daily Burn Rate */}
          <div className="p-4 rounded-[18px] bg-[#0c0c10] border border-white/[0.05] hover:border-amber-500/30 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <FaFire className="text-amber-400 text-[10px]" /> Daily Burn Rate
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Burn Velocity
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight font-mono">
              ₹{dailyBurnRate.toLocaleString("en-IN")}
              <span className="text-xs font-medium text-zinc-500"> /day</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Average required daily liquidity
            </p>
          </div>

          {/* Card 4: Fixed vs Variable Ratio */}
          <div className="p-4 rounded-[18px] bg-[#0c0c10] border border-white/[0.05] hover:border-purple-500/30 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <FaLayerGroup className="text-purple-400 text-[10px]" /> Fixed vs Variable
              </span>
              <span className="text-[10px] font-mono text-zinc-400 font-bold">
                {fixedRatio}% : {variableRatio}%
              </span>
            </div>
            {/* Split Bar */}
            <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden flex my-2">
              <div
                style={{ width: `${fixedRatio}%` }}
                className="h-full bg-purple-500 transition-all"
                title={`Fixed: ₹${fixedExpenseAmount}`}
              />
              <div
                style={{ width: `${variableRatio}%` }}
                className="h-full bg-sky-400 transition-all"
                title={`Variable: ₹${variableExpenseAmount}`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>Fixed: ₹{fixedExpenseAmount.toLocaleString("en-IN")}</span>
              <span>Var: ₹{variableExpenseAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Recharts Graph */}
      {hasEnoughData && (
        <div className="p-4 sm:p-5 rounded-[18px] bg-[#0c0c10] border border-white/[0.05] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {viewMode === "monthly"
                  ? "Historical Spending vs Projected Curve"
                  : "30-Day Day-by-Day Cumulative Runway Projection"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {viewMode === "monthly"
                  ? "Solid lines show confirmed actuals • Dashed line shows Gemini AI predictive forecast"
                  : "Cumulative spend vs income safety margin ceiling (85%)"}
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-3 h-1 bg-rose-500 inline-block rounded-full" /> Expenses
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-3 h-1 bg-emerald-500 inline-block rounded-full" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-purple-400 inline-block" /> Forecast
              </span>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "monthly" ? (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#52525b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={10}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <Tooltip content={<CustomForecastTooltip />} />

                  {/* Actual Historical Series */}
                  <Line
                    type="monotone"
                    dataKey="actualExpense"
                    name="Actual Expense"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#f43f5e" }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualIncome"
                    name="Actual Income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />

                  {/* Projected Dashed Curves */}
                  <Line
                    type="monotone"
                    dataKey="projectedExpense"
                    name="Projected Expense"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 5, fill: "#a855f7" }}
                    activeDot={{ r: 7 }}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedIncome"
                    name="Projected Income"
                    stroke="#34d399"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: "#34d399" }}
                    connectNulls={true}
                  />
                </LineChart>
              ) : (
                <AreaChart data={runwayPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="#52525b"
                    fontSize={10}
                    interval={4}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={10}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <Tooltip content={<CustomForecastTooltip />} />
                  <ReferenceLine
                    y={projectedIncome * 0.85}
                    label={{
                      value: "85% Safety Ceiling",
                      fill: "#f59e0b",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeSpend"
                    name="Cumulative Spend"
                    stroke="#f43f5e"
                    fillOpacity={1}
                    fill="url(#spendGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

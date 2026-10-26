import React from "react";
import { FaChartPie, FaChartLine } from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency, getCurrencySymbol } from "../../config/constants.js";

export default function ReportCharts({
  filterMode,
  monthName,
  selectedYear,
  periodExpenses = 0,
  categoryData = [],
  yearlyTrendData = [],
  hasYearlyData = false,
  money = formatCurrency,
}) {
  return (
    <div className="space-y-6">
      {/* Category Donut Visualizer */}
      <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FaChartPie className="text-base" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Category Breakdown
              </h2>
              <p className="text-[11px] text-zinc-400">
                Distribution for{" "}
                {filterMode === "month"
                  ? `${monthName} ${selectedYear}`
                  : filterMode === "year"
                  ? `Year ${selectedYear}`
                  : "Custom Range"}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-white">
            Total: {money(periodExpenses)}
          </span>
        </div>

        {/* Recharts Pie Chart */}
        {categoryData.length === 0 ? (
          <div className="h-52 w-full flex flex-col items-center justify-center text-center p-4">
            <FaChartPie className="text-3xl text-zinc-600 mb-2 opacity-50" />
            <p className="text-xs text-zinc-400">
              No expense records found for this period
            </p>
          </div>
        ) : (
          <>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d0d12",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [formatCurrency(val), "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Chips List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoryData.map((c) => (
                <div
                  key={c.name}
                  className="p-2 rounded-xl bg-[#0c0c10] border border-white/[0.04] flex items-center gap-2"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-white block truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {formatCurrency(c.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 12-Month Inflow vs Outflow Bar Chart for Selected Year */}
      <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FaChartLine className="text-base" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {selectedYear} Annual Trend
              </h2>
              <p className="text-[11px] text-zinc-400">
                Monthly Income vs Expense comparison
              </p>
            </div>
          </div>
        </div>

        <div className="h-52 w-full">
          {!hasYearlyData ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
              <FaChartLine className="text-3xl text-zinc-600 mb-2 opacity-50" />
              <p className="text-xs text-zinc-400">
                No income or expense activity recorded for {selectedYear}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyTrendData}>
                <XAxis
                  dataKey="month"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) =>
                    `${getCurrencySymbol()}${v >= 1000 ? `${v / 1000}k` : v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0d12",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val) => [formatCurrency(val)]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  FaUtensils,
  FaShoppingBag,
  FaFileInvoiceDollar,
  FaPlus,
  FaCheck,
  FaBullseye,
  FaPiggyBank,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartPie,
} from "react-icons/fa";
import { formatCurrency } from "../../config/constants";

export default function BudgetsGoalsWidget({
  budgets = [],
  goals = [],
  bills = [],
  transactions = [],
  onOpenAddBudget = () => {},
  onOpenAddGoal = () => {},
  onToggleBillPaid = () => {},
}) {
  const [activeSubTab, setActiveSubTab] = useState("budgets");

  // Calculate actual spent per category for current month
  const categorySpentMap = React.useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => (tx.type || "").toLowerCase() === "expense")
      .forEach((tx) => {
        const cat = tx.category || tx.Category || "Others";
        map[cat] = (map[cat] || 0) + Number(tx.amount || tx.Amount || 0);
      });
    return map;
  }, [transactions]);

  return (
    <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header & Sub-Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-300">
            {activeSubTab === "budgets" && <FaChartPie className="text-amber-400 text-xs" />}
            {activeSubTab === "goals" && <FaBullseye className="text-emerald-400 text-xs" />}
            {activeSubTab === "bills" && <FaFileInvoiceDollar className="text-sky-400 text-xs" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {activeSubTab === "budgets" && "Monthly Budget Envelopes"}
              {activeSubTab === "goals" && "Savings Milestones"}
              {activeSubTab === "bills" && "Upcoming Bills & Subscriptions"}
            </h2>
            <p className="text-[11px] text-zinc-400">
              {activeSubTab === "budgets" && "Control category spending before you exceed limits"}
              {activeSubTab === "goals" && "Track target reserves & progress"}
              {activeSubTab === "bills" && "Never miss a due date or renewal"}
            </p>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#0e0e12] border border-white/[0.06] rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("budgets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === "budgets"
                ? "bg-zinc-800 text-white font-semibold shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 bg-transparent"
            }`}
          >
            Budgets ({budgets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("goals")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === "goals"
                ? "bg-zinc-800 text-white font-semibold shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 bg-transparent"
            }`}
          >
            Goals ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("bills")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === "bills"
                ? "bg-zinc-800 text-white font-semibold shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 bg-transparent"
            }`}
          >
            Bills ({bills.length})
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: BUDGET ENVELOPES
          ========================================================================= */}
      {activeSubTab === "budgets" && (
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-[#0c0c10] border border-white/[0.04] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-amber-400 text-lg">
                <FaChartPie />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-white">No Monthly Budgets Configured</h4>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Set category envelopes for Food, Shopping, or Travel to monitor your spending limits in real time.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddBudget}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
              >
                <FaPlus className="text-[10px]" /> Set First Budget Envelope
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {budgets.map((b) => {
                  const spent = categorySpentMap[b.category] || 0;
                  const limit = Number(b.limit || 5000);
                  const pct = Math.min(Math.round((spent / limit) * 100), 100);
                  const isOver = spent > limit;
                  const isNear = pct >= 80 && !isOver;

                  return (
                    <div
                      key={b.category}
                      className="p-4 rounded-xl bg-[#0c0c10] border border-white/[0.05] hover:border-white/[0.1] transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-xs">
                            {b.category === "Food" && <FaUtensils className="text-emerald-400" />}
                            {b.category === "Shopping" && <FaShoppingBag className="text-purple-400" />}
                            {b.category === "Bills" && <FaFileInvoiceDollar className="text-sky-400" />}
                            {b.category !== "Food" && b.category !== "Shopping" && b.category !== "Bills" && <FaPiggyBank className="text-rose-400" />}
                          </div>
                          <span className="text-xs font-bold text-white">{b.category}</span>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isOver
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : isNear
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {pct}% Used
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver
                              ? "bg-rose-500"
                              : isNear
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Spent: {formatCurrency(spent)}</span>
                        <span>Limit: {formatCurrency(limit)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAddBudget}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121217] hover:bg-[#181822] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-semibold cursor-pointer transition-colors"
                >
                  <FaPlus className="text-[10px] text-emerald-400" /> Set New Category Budget
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: SAVINGS GOALS
          ========================================================================= */}
      {activeSubTab === "goals" && (
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-[#0c0c10] border border-white/[0.04] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400 text-lg">
                <FaBullseye />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-white">No Savings Goals Active</h4>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Create dedicated savings targets for emergencies, a vacation, or big purchases.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddGoal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
              >
                <FaPlus className="text-[10px]" /> Create First Milestone
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {goals.map((goal) => {
                  const current = Number(goal.current || 0);
                  const target = Number(goal.target || 1);
                  const pct = Math.min(Math.round((current / target) * 100), 100);

                  return (
                    <div
                      key={goal.id || goal.name}
                      className="p-4 rounded-xl bg-[#0c0c10] border border-white/[0.05] hover:border-white/[0.1] transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                            <FaBullseye />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{goal.name}</h4>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <FaCalendarAlt className="text-[9px]" /> Due: {goal.deadline || "Open"}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-400">{pct}%</span>
                      </div>

                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Saved: {formatCurrency(current)}</span>
                        <span>Target: {formatCurrency(target)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAddGoal}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121217] hover:bg-[#181822] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-semibold cursor-pointer transition-colors"
                >
                  <FaPlus className="text-[10px] text-emerald-400" /> Create Savings Milestone
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: UPCOMING BILLS
          ========================================================================= */}
      {activeSubTab === "bills" && (
        <div className="space-y-3">
          {bills.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-[#0c0c10] border border-white/[0.04] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 mx-auto flex items-center justify-center text-sky-400 text-lg">
                <FaFileInvoiceDollar />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-white">No Upcoming Bills Logged</h4>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Add recurring utilities, broadband, and subscription dues so you never miss a payment.
                </p>
              </div>
            </div>
          ) : (
            bills.map((bill) => (
              <div
                key={bill.id || bill.name}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c0c10] border border-white/[0.05] hover:border-white/[0.1] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xs">
                    <FaFileInvoiceDollar />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{bill.name}</h4>
                    <p className="text-[10px] text-zinc-500">{bill.dueDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {formatCurrency(Number(bill.amount || 0))}
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleBillPaid(bill.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      bill.paid
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/[0.08]"
                    }`}
                  >
                    <FaCheck className="text-[10px]" />
                    <span>{bill.paid ? "Paid" : "Mark Paid"}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

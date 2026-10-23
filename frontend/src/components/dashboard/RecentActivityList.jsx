import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../config/constants";
import {
  FaUtensils,
  FaShoppingBag,
  FaFileInvoiceDollar,
  FaBriefcase,
  FaPlane,
  FaHeartbeat,
  FaGraduationCap,
  FaLandmark,
  FaWallet,
  FaSearch,
  FaArrowRight,
  FaEdit,
  FaTrash,
  FaPlus,
  FaReceipt,
} from "react-icons/fa";

const getCategoryIcon = (category = "") => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("swiggy") || cat.includes("zomato") || cat.includes("dining"))
    return <FaUtensils className="text-emerald-400" />;
  if (cat.includes("shop") || cat.includes("cloth") || cat.includes("amazon") || cat.includes("flipkart") || cat.includes("myntra"))
    return <FaShoppingBag className="text-purple-400" />;
  if (cat.includes("bill") || cat.includes("recharge") || cat.includes("electr") || cat.includes("wifi"))
    return <FaFileInvoiceDollar className="text-sky-400" />;
  if (cat.includes("salary") || cat.includes("freelance") || cat.includes("bonus") || cat.includes("income"))
    return <FaBriefcase className="text-emerald-400" />;
  if (cat.includes("travel") || cat.includes("uber") || cat.includes("ola") || cat.includes("fuel") || cat.includes("flight"))
    return <FaPlane className="text-amber-400" />;
  if (cat.includes("health") || cat.includes("med") || cat.includes("doctor"))
    return <FaHeartbeat className="text-rose-400" />;
  if (cat.includes("education") || cat.includes("book") || cat.includes("course"))
    return <FaGraduationCap className="text-indigo-400" />;
  if (cat.includes("invest") || cat.includes("stock") || cat.includes("crypto") || cat.includes("gold"))
    return <FaLandmark className="text-teal-400" />;
  return <FaWallet className="text-zinc-400" />;
};

const getCategoryBadgeStyle = (category = "") => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("travel") || cat.includes("uber") || cat.includes("flight") || cat.includes("ola") || cat.includes("fuel")) {
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  }
  if (cat.includes("shop") || cat.includes("cloth") || cat.includes("amazon") || cat.includes("flipkart") || cat.includes("myntra")) {
    return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
  }
  if (cat.includes("food") || cat.includes("swiggy") || cat.includes("zomato") || cat.includes("dining")) {
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  }
  if (cat.includes("bill") || cat.includes("recharge") || cat.includes("electr") || cat.includes("wifi")) {
    return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
  }
  if (cat.includes("salary") || cat.includes("freelance") || cat.includes("bonus") || cat.includes("income")) {
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  }
  if (cat.includes("health") || cat.includes("med") || cat.includes("doctor")) {
    return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
  }
  if (cat.includes("education") || cat.includes("book") || cat.includes("course")) {
    return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
  }
  if (cat.includes("invest") || cat.includes("stock") || cat.includes("crypto") || cat.includes("gold")) {
    return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
  }
  return "bg-zinc-800 text-zinc-300 border border-white/[0.08]";
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
  return "bg-[#14141a] border-white/[0.06] text-zinc-500";
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export default function RecentActivityList({
  transactions = [],
  onEditTransaction = () => {},
  onDeleteTransaction = () => {},
  onOpenAddModal = () => {},
}) {
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const type = (tx.type || "expense").toLowerCase();
      if (filterType !== "all" && type !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const cat = (tx.category || tx.Category || "").toLowerCase();
      const note = (tx.note || tx.Note || "").toLowerCase();
      const amt = String(tx.amount || tx.Amount || "");
      return cat.includes(q) || note.includes(q) || amt.includes(q);
    });
  }, [transactions, filterType, searchQuery]);

  const recentList = filtered.slice(0, 7);

  return (
    <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header with Title & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-300">
            <FaReceipt className="text-xs text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Recent Activity</h2>
            <p className="text-[11px] text-zinc-400">Your latest logged payments & inflows</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto p-1 bg-[#0e0e12] border border-white/[0.06] rounded-xl">
          {["all", "expense", "income"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                filterType === f
                  ? "bg-zinc-800 text-white border border-white/[0.12] font-semibold shadow-sm"
                  : "bg-transparent text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Search Input */}
      {transactions.length > 4 && (
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
          <input
            type="text"
            placeholder="Search recent payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e0e12] border border-white/[0.06] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      )}

      {/* Transaction List */}
      {recentList.length === 0 ? (
        <div className="text-center py-10 px-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-white/[0.06] mx-auto flex items-center justify-center text-zinc-500 text-lg">
            <FaReceipt />
          </div>
          <p className="text-xs text-zinc-400">
            {searchQuery ? "No matching transactions found." : "No transactions logged yet."}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
          >
            <FaPlus className="text-[10px]" /> Add First Transaction
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {recentList.map((tx, idx) => {
            const isIncome = String(tx.type || "").toLowerCase() === "income";
            const category = tx.category || tx.Category || (isIncome ? "Salary" : "Expense");
            const note = tx.note || tx.Note || "";
            const amount = Number(tx.amount || tx.Amount || 0);
            const date = tx.date || tx.Date;
            const account = tx.accountType || tx.Account || "Cash";

            return (
              <div
                key={tx.id || tx.firestoreId || `tx-${idx}`}
                className="group flex items-center justify-between p-3 rounded-xl sm:rounded-2xl bg-[#0c0c10] hover:bg-[#121217] border border-white/[0.04] hover:border-white/[0.09] transition-all"
              >
                {/* Left: Icon + Description */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${getCategoryIconSquircle(category)}`}>
                    {getCategoryIcon(category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                        {note || category}
                      </span>
                      {note && note !== category && (
                        <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide ${getCategoryBadgeStyle(category)}`}>
                          {category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                      <span>{formatDate(date)}</span>
                      <span>•</span>
                      <span className="text-zinc-400">{account}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Action Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-xs sm:text-sm font-bold tracking-tight ${
                        isIncome ? "text-emerald-400" : "text-zinc-200"
                      }`}
                    >
                      {isIncome ? "+" : "-"} {formatCurrency(amount)}
                    </div>
                  </div>

                  {/* Inline Action Triggers (shown on hover or tap) */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border-none cursor-pointer text-[11px] transition-colors"
                      title="Edit transaction"
                      aria-label="Edit transaction"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-none cursor-pointer text-[11px] transition-colors"
                      title="Delete transaction"
                      aria-label="Delete transaction"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link to Full Transactions Ledger */}
      {transactions.length > 0 && (
        <div className="pt-2 flex items-center justify-between border-t border-white/[0.04]">
          <span className="text-xs text-zinc-500">
            Showing {recentList.length} of {transactions.length} records
          </span>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors no-underline"
          >
            <span>View All Ledger</span>
            <FaArrowRight className="text-[10px]" />
          </Link>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { FaPlus, FaTimes, FaCheck } from "react-icons/fa";
import { getCurrencySymbol } from "../../config/constants.js";

export default function AddTransactionInlineModal({
  showAddModal,
  setShowAddModal,
  handleCreateTransaction,
  newType,
  setNewType,
  newCategory,
  setNewCategory,
  newAccount,
  setNewAccount,
  newAmount,
  setNewAmount,
  newDate,
  setNewDate,
  newNote,
  setNewNote,
  isSaving,
  defaultIncomeCategories = [],
  defaultExpenseCategories = [],
}) {
  if (!showAddModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowAddModal(false)}
    >
      <div
        className="bg-[#0c0c10] border border-white/[0.08] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FaPlus className="text-emerald-400" /> New Transaction Entry
          </h3>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="p-1 text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleCreateTransaction} className="space-y-3.5">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#14141a] rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setNewType("expense");
                setNewCategory("Food");
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                newType === "expense"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/40 shadow-xs"
                  : "text-zinc-400 bg-transparent border border-transparent"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setNewType("income");
                setNewCategory("Salary");
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                newType === "income"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-xs"
                  : "text-zinc-400 bg-transparent border border-transparent"
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Amount ({getCurrencySymbol()})
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 font-bold"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {(newType === "income"
                  ? defaultIncomeCategories
                  : defaultExpenseCategories
                ).map((c) => (
                  <option key={c} value={c} className="bg-zinc-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Account
              </label>
              <select
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {["Cash", "Online", "Savings", "Credit Card"].map((acc) => (
                  <option key={acc} value={acc} className="bg-zinc-900 text-white">
                    {acc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Note / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy order, Client invoice"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck className="text-emerald-400" />
            <span>{isSaving ? "Saving..." : "Save Transaction"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

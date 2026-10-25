import React from "react";
import { FaTimes, FaSearch, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { formatCurrency } from "../../config/constants.js";

export default function AccountTransactionsDrawer({
  selectedAccount,
  onClose,
  searchQuery,
  setSearchQuery,
  accountTransactions = [],
  accountBalance = 0,
  renderIcon = () => null,
}) {
  if (!selectedAccount) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0c0c10] border border-white/[0.08] rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {renderIcon(selectedAccount)}
            <div>
              <h3 className="text-base font-extrabold text-white capitalize">
                {selectedAccount.name} Transactions
              </h3>
              <p className="text-xs text-emerald-400 font-bold">
                Current Balance: {formatCurrency(accountBalance)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        {/* Search Box */}
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
          <input
            type="text"
            placeholder="Search category, note or amount in this account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {accountTransactions.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              No transactions recorded for this account yet.
            </div>
          ) : (
            accountTransactions.map((tx, idx) => {
              const rawType = String(tx.Type || tx.type || "").toLowerCase();
              const isIncome = rawType === "income";
              const amt = Math.abs(
                Number(String(tx.Amount || tx.amount || 0).replace(/[+,]/g, "")) || 0
              );

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#14141a] border border-white/[0.04] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                        isIncome
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {isIncome ? <FaArrowUp /> : <FaArrowDown />}
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">
                        {tx.Category || tx.category || "General"}
                      </strong>
                      <span className="text-[10px] text-zinc-400">
                        {tx.Date || tx.date || "Recent"}{" "}
                        {tx.Note || tx.note ? `· ${tx.Note || tx.note}` : ""}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-extrabold text-sm ${
                      isIncome ? "text-emerald-400" : "text-zinc-200"
                    }`}
                  >
                    {isIncome ? "+" : "-"} {formatCurrency(amt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

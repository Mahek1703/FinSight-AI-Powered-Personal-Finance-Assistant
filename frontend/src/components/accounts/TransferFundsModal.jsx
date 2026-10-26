import React from "react";
import { FaExchangeAlt, FaTimes, FaCheck } from "react-icons/fa";
import { getCurrencySymbol } from "../../config/constants.js";

export default function TransferFundsModal({
  isOpen,
  onClose,
  accounts = [],
  transferFrom,
  setTransferFrom,
  transferTo,
  setTransferTo,
  transferAmount,
  setTransferAmount,
  transferDate,
  setTransferDate,
  transferNote,
  setTransferNote,
  onExecute,
  isExecutingTransfer,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0c0c10] border border-white/[0.08] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FaExchangeAlt className="text-sky-400" />
            <span>Transfer Money Between Accounts</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 bg-transparent border-none cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={onExecute} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                From Account
              </label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                To Account
              </label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Transfer Amount ({getCurrencySymbol()})
            </label>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 5000"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Transfer Date
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Reason / Description
            </label>
            <input
              type="text"
              placeholder="e.g. ATM withdrawal, Card settlement"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isExecutingTransfer}
            className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck className="text-emerald-400" />
            <span>{isExecutingTransfer ? "Transferring..." : "Confirm Transfer"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

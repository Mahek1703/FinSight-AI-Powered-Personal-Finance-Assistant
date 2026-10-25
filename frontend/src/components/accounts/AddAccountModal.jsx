import React from "react";
import { FaWallet, FaTimes, FaCheck } from "react-icons/fa";
import { getCurrencySymbol } from "../../config/constants.js";

export default function AddAccountModal({
  isOpen,
  onClose,
  editingAccount,
  accName,
  setAccName,
  accType,
  setAccType,
  accIcon,
  setAccIcon,
  accInitialBalance,
  setAccInitialBalance,
  onSave,
  isSavingAccount,
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
            <FaWallet className="text-emerald-400" />
            <span>{editingAccount ? "Edit Account" : "Add New Account / Wallet"}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 bg-transparent border-none cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Account Name
            </label>
            <input
              type="text"
              placeholder="e.g. HDFC Salary, PayTM Wallet, Emergency Fund"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Account Category
              </label>
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value)}
                className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Account</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Online">Online / UPI</option>
                <option value="Savings">Savings Vault</option>
                <option value="Investment">Investment</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Visual Icon
              </label>
              <select
                value={accIcon}
                onChange={(e) => setAccIcon(e.target.value)}
                className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="cash">💵 Cash Note</option>
                <option value="savings">🐷 Piggy Bank</option>
                <option value="card">💳 Credit/Debit Card</option>
                <option value="bank">🏦 Bank Institution</option>
                <option value="wallet">👛 Digital Wallet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Initial Starting Balance ({getCurrencySymbol()})
            </label>
            <input
              type="number"
              placeholder="0"
              value={accInitialBalance}
              onChange={(e) => setAccInitialBalance(e.target.value)}
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingAccount}
            className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck className="text-emerald-400" />
            <span>
              {isSavingAccount
                ? "Saving..."
                : editingAccount
                ? "Update Account"
                : "Create Account"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

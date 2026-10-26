import React from "react";
import { FaEdit, FaTimes, FaCheck } from "react-icons/fa";
import { getCurrencySymbol } from "../../config/constants.js";

export default function EditTransactionModal({
  editingItem,
  setEditingItem,
  handleSaveEdit,
  isSaving,
}) {
  if (!editingItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setEditingItem(null)}
    >
      <div
        className="bg-[#0c0c10] border border-white/[0.08] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FaEdit className="text-emerald-400" /> Edit Transaction
          </h3>
          <button
            type="button"
            onClick={() => setEditingItem(null)}
            className="p-1 text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Amount ({getCurrencySymbol()})
            </label>
            <input
              type="number"
              value={editingItem.amount}
              onChange={(e) =>
                setEditingItem({ ...editingItem, amount: e.target.value })
              }
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-bold"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Category
            </label>
            <input
              type="text"
              value={editingItem.category}
              onChange={(e) =>
                setEditingItem({ ...editingItem, category: e.target.value })
              }
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Date
            </label>
            <input
              type="date"
              value={editingItem.date}
              onChange={(e) =>
                setEditingItem({ ...editingItem, date: e.target.value })
              }
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Note / Description
            </label>
            <input
              type="text"
              value={editingItem.note}
              onChange={(e) =>
                setEditingItem({ ...editingItem, note: e.target.value })
              }
              className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck className="text-emerald-400" />
            <span>{isSaving ? "Updating..." : "Update Transaction"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

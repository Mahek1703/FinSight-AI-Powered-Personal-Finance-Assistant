import React, { useState, useEffect, useRef } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCalendarAlt,
  FaCheck,
  FaFileInvoiceDollar,
  FaHeartbeat,
  FaLandmark,
  FaPlane,
  FaShoppingBag,
  FaTimes,
  FaUtensils,
  FaWallet,
  FaBriefcase,
  FaReceipt,
  FaSpinner,
} from "react-icons/fa";
import { scanReceiptWithGemini } from "../services/geminiVision.service";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCurrencySymbol } from "../config/constants";

const expenseCategories = EXPENSE_CATEGORIES;
const incomeCategories = INCOME_CATEGORIES;

const accountTypes = ["Cash", "Bank", "Card", "Online", "Savings"];

const quickCategories = [
  { label: "Food", icon: <FaUtensils />, type: "expense" },
  { label: "Bills", icon: <FaFileInvoiceDollar />, type: "expense" },
  { label: "Shopping", icon: <FaShoppingBag />, type: "expense" },
  { label: "Travel", icon: <FaPlane />, type: "expense" },
  { label: "Health", icon: <FaHeartbeat />, type: "expense" },
  { label: "Salary", icon: <FaBriefcase />, type: "income" },
  { label: "Freelance", icon: <FaWallet />, type: "income" },
  { label: "Investment", icon: <FaLandmark />, type: "income" },
];

const todayValue = () => new Date().toISOString().slice(0, 10);
const cleanAmount = (value) => Number(String(value || 0).replace(/[,+]/g, "")) || 0;

const defaultFormState = {
  type: "expense",
  date: todayValue(),
  amount: "",
  accountType: "Cash",
  category: "Food",
  note: "",
};

export default function AddTransactionModal({
  isOpen = false,
  modalOpen,
  onClose,
  setModalOpen,
  onSaveTransaction,
  onSave,
  editingTransaction = null,
  initialPreset = null,
}) {
  const show = isOpen || modalOpen;

  const [form, setForm] = useState(defaultFormState);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const receiptInputRef = useRef(null);

  const handleReceiptFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningReceipt(true);
    try {
      const parsed = await scanReceiptWithGemini(file);
      setForm((prev) => ({
        ...prev,
        type: "expense",
        amount: parsed.totalAmount ? String(parsed.totalAmount) : prev.amount,
        date: parsed.date || prev.date,
        category: parsed.category || "Food",
        accountType: parsed.paymentType || "Cash",
        note: parsed.merchant
          ? `${parsed.merchant} - ${parsed.description || "Receipt purchase"}`
          : parsed.description || prev.note,
      }));
    } catch (err) {
      console.warn("Receipt scan error in modal:", err);
      setFormError("Could not parse receipt: " + (err.message || String(err)));
    } finally {
      setIsScanningReceipt(false);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
    }
  };


  const availableAccounts = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("finsight_user_accounts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = parsed.map((a) => a.name || a.type).filter(Boolean);
          return Array.from(new Set([...names, "Cash", "Savings", "online", "Bank", "Card"]));
        }
      }
    } catch (e) {
      // fallback
    }
    return accountTypes;
  }, [show]);

  useEffect(() => {
    if (editingTransaction) {
      const rawType = String(
        editingTransaction.Type || editingTransaction.type || "Expense"
      ).toLowerCase();
      const type = rawType === "income" ? "income" : "expense";

      setForm({
        type,
        date:
          editingTransaction.Date ||
          editingTransaction.date ||
          todayValue(),
        amount: String(
          editingTransaction.Amount || editingTransaction.amount || ""
        ),
        accountType:
          editingTransaction.Account ||
          editingTransaction.accountType ||
          "Cash",
        category:
          editingTransaction.Category ||
          editingTransaction.category ||
          editingTransaction.source ||
          (type === "income" ? "Salary" : "Food"),
        note: editingTransaction.Note || editingTransaction.note || "",
      });
    } else if (initialPreset) {
      setForm({
        ...defaultFormState,
        ...initialPreset,
        date: initialPreset.date || todayValue(),
      });
    } else {
      setForm(defaultFormState);
    }
    setFormError("");
  }, [editingTransaction, initialPreset, show]);

  if (!show) return null;

  const handleClose = () => {
    setForm(defaultFormState);
    setFormError("");
    if (typeof onClose === "function") onClose();
    if (typeof setModalOpen === "function") setModalOpen(false);
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formError) setFormError("");
  };

  const handleTypeSelect = (type) => {
    setForm((prev) => ({
      ...prev,
      type,
      category: type === "income" ? "Salary" : "Food",
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.date) return setFormError("Please select a valid date.");
    if (!form.amount || cleanAmount(form.amount) <= 0) {
      return setFormError("Please enter a positive amount.");
    }
    if (!form.category) return setFormError("Please select a category.");

    const payload = {
      ...form,
      amount: cleanAmount(form.amount),
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const saveHandler = onSaveTransaction || onSave;
      if (typeof saveHandler === "function") {
        await saveHandler(payload, editingTransaction);
      }
      setSaving(false);
      handleClose();
    } catch (err) {
      console.warn("Error submitting transaction:", err);
      setSaving(false);
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-[#121318] border border-white/[0.08] rounded-2xl shadow-2xl p-6 text-white w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <h2 id="modal-title" className="text-white font-bold text-lg tracking-tight">
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </h2>
            {!editingTransaction && (
              <div>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleReceiptFile}
                />
                <button
                  type="button"
                  disabled={isScanningReceipt}
                  onClick={() => receiptInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Upload receipt to auto-fill form with Gemini Vision"
                >
                  {isScanningReceipt ? (
                    <>
                      <FaSpinner className="animate-spin text-[10px]" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <FaReceipt className="text-[10px]" />
                      <span>Scan Receipt</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-[#1c1d24] border border-white/[0.08] text-zinc-400 hover:text-white active:scale-90 flex items-center justify-center cursor-pointer transition-all"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sliding Segmented Toggle (Income / Expense Switcher) */}
          <div className="relative grid grid-cols-2 p-1 bg-[#0b0c10] border border-white/[0.08] rounded-xl mb-4 overflow-hidden">
            {/* Sliding Pill Background Indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out pointer-events-none ${
                form.type === "income"
                  ? "left-1 bg-[#00E676]"
                  : "left-[calc(50%+2px)] bg-[#FF3B5C]"
              }`}
            />

            {/* Income Tab */}
            <button
              type="button"
              onClick={() => handleTypeSelect("income")}
              className={`relative z-10 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 ${
                form.type === "income"
                  ? "text-black font-extrabold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FaArrowUp
                className={`text-xs transition-colors duration-200 ${
                  form.type === "income" ? "text-black" : "text-emerald-400"
                }`}
              />
              <span>Income</span>
            </button>

            {/* Expense Tab */}
            <button
              type="button"
              onClick={() => handleTypeSelect("expense")}
              className={`relative z-10 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 ${
                form.type === "expense"
                  ? "text-white font-extrabold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FaArrowDown
                className={`text-xs transition-colors duration-200 ${
                  form.type === "expense" ? "text-white" : "text-rose-400"
                }`}
              />
              <span>Expense</span>
            </button>
          </div>

          {/* Date Field */}
          <div>
            <label
              htmlFor="tx-date"
              className="block text-zinc-400 font-medium text-xs mb-1.5 flex items-center gap-1.5"
            >
              <FaCalendarAlt className="text-zinc-500 text-xs" /> Date
            </label>
            <input
              id="tx-date"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              required
              className="w-full bg-[#191a22] border border-white/[0.08] text-white placeholder-zinc-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Amount Field */}
          <div>
            <label
              htmlFor="tx-amount"
              className="block text-zinc-400 font-medium text-xs mb-1.5"
            >
              {getCurrencySymbol()} Amount
            </label>
            <input
              id="tx-amount"
              type="number"
              min="1"
              step="any"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              autoFocus
              required
              className="w-full bg-[#191a22] border border-white/[0.08] text-white placeholder-zinc-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold text-base"
            />
          </div>

          {/* Account Type */}
          <div>
            <label
              htmlFor="tx-account"
              className="block text-zinc-400 font-medium text-xs mb-1.5 flex items-center gap-1.5"
            >
              <FaWallet className="text-zinc-500 text-xs" /> Account Type
            </label>
            <select
              id="tx-account"
              value={form.accountType}
              onChange={(e) => updateField("accountType", e.target.value)}
              className="w-full bg-[#191a22] border border-white/[0.08] text-white placeholder-zinc-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
            >
              {availableAccounts.map((acc) => (
                <option key={acc} value={acc} className="bg-zinc-900 text-white">
                  {acc}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label
              htmlFor="tx-category"
              className="block text-zinc-400 font-medium text-xs mb-1.5 flex items-center gap-1.5"
            >
              <FaFileInvoiceDollar className="text-zinc-500 text-xs" /> Category
            </label>
            <select
              id="tx-category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full bg-[#191a22] border border-white/[0.08] text-white placeholder-zinc-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
            >
              {(form.type === "income" ? incomeCategories : expenseCategories).map(
                (cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white">
                    {cat}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Note / Description */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-zinc-400 font-medium text-xs mb-1.5"
            >
              Note / Description
            </label>
            <input
              id="tx-note"
              type="text"
              placeholder="e.g. Dinner with friends, Salary credit"
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              className="w-full bg-[#191a22] border border-white/[0.08] text-white placeholder-zinc-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Quick Categories Pills */}
          <div className="pt-1">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Quick Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {quickCategories.map((chip) => {
                const isSelected =
                  form.category.toLowerCase() === chip.label.toLowerCase();
                return (
                  <button
                    type="button"
                    key={chip.label}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        type: chip.type,
                        category: chip.label,
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500 font-semibold"
                        : "bg-[#191a22] border border-white/[0.08] text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs">{chip.icon}</span> {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {formError && (
            <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
              {formError}
            </p>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full mt-5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-sm flex items-center justify-center gap-2 border border-emerald-500 cursor-pointer active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck className="text-emerald-400 text-sm" />
            <span className="text-white font-bold">
              {saving
                ? "Saving..."
                : editingTransaction
                ? "Update Transaction"
                : "Save Transaction"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

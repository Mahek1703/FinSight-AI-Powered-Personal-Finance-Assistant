import React, { useMemo, useState } from "react";
import ReceiptScanner from "../components/ReceiptScanner";
import AnomalyAlertBanner from "../components/dashboard/AnomalyAlertBanner";
import {
  FaBriefcase,
  FaCalendarAlt,
  FaCar,
  FaEdit,
  FaFileImport,
  FaFileInvoiceDollar,
  FaFilter,
  FaGraduationCap,
  FaHeartbeat,
  FaMoneyBillWave,
  FaPlane,
  FaReceipt,
  FaSearch,
  FaShoppingBag,
  FaTrash,
  FaUtensils,
  FaWallet,
  FaPlus,
  FaCheck,
  FaTimes,
  FaRobot,
  FaExclamationTriangle,
} from "react-icons/fa";



import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCurrency,
  getCurrencySymbol,
} from "../config/constants.js";

const defaultExpenseCategories = EXPENSE_CATEGORIES;
const defaultIncomeCategories = INCOME_CATEGORIES;

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
    return <FaMoneyBillWave className="text-teal-400" />;
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

function Transactions({
  csvData = [],
  uploadedFiles = [],
  totalIncome = 0,
  totalExpense = 0,
  totalBalance = 0,
  onUpdateTransaction = async () => true,
  onSaveTransaction = async () => true,
  onDeleteTransaction = async () => true,
  showToast = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showFiles, setShowFiles] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);

  // New transaction modal state
  const [newType, setNewType] = useState("expense");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("Food");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newNote, setNewNote] = useState("");
  const [newAccount, setNewAccount] = useState("Cash");


  const filteredData = useMemo(() => {
    return csvData.filter((item) => {
      const category = (item.Category || item.category || "").toLowerCase();
      const type = (item.type || "expense").toLowerCase();
      const note = (item.Note || item.note || "").toLowerCase();
      const amount = String(item.Amount || item.amount || "");
      const query = searchTerm.toLowerCase();

      return (
        (category.includes(query) || type.includes(query) || amount.includes(query) || note.includes(query)) &&
        (filterType === "all" || type === filterType)
      );
    });
  }, [csvData, searchTerm, filterType]);

  const topCategory = useMemo(() => {
    const map = {};
    csvData
      .filter((item) => (item.type || "").toLowerCase() === "expense")
      .forEach((item) => {
        const category = item.Category || item.category || "Other";
        map[category] = (map[category] || 0) + Number(item.Amount || item.amount || 0);
      });

    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
  }, [csvData]);

  const handleEdit = (item) => {
    setEditingItem({
      ...item,
      amount: item.Amount || item.amount || 0,
      category: item.Category || item.category || item.source || "Food",
      date: item.Date || item.date || new Date().toISOString().slice(0, 10),
      note: item.Note || item.note || "",
      accountType: item.Account || item.accountType || "Cash",
      type: (item.type || "expense").toLowerCase(),
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.amount || Number(editingItem.amount) <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    await onUpdateTransaction({
      ...editingItem,
      amount: Number(editingItem.amount),
      category: editingItem.category,
      type: editingItem.type === "income" ? "Income" : "Expense",
    }, editingItem);

    setEditingItem(null);
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!newAmount || Number(newAmount) <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    const payload = {
      type: newType === "income" ? "Income" : "Expense",
      amount: Number(newAmount),
      category: newCategory,
      date: newDate,
      note: newNote,
      accountType: newAccount,
    };

    await onSaveTransaction(payload);
    setShowAddModal(false);
    setNewAmount("");
    setNewNote("");
  };

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Financial Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transactions
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track, search, filter and manage every cash flow record
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-2 cursor-pointer border border-emerald-500/40 transition-all active:scale-95"
          >
            <FaPlus className="text-xs text-emerald-400" /> Add Entry
          </button>

          <button
            type="button"
            onClick={() => setShowReceiptScanner(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <FaReceipt className="text-xs text-emerald-400" />
            <span>AI Receipt OCR</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFiles(!showFiles)}
            className="px-3.5 py-2.5 rounded-xl bg-[#08080b] hover:bg-[#121217] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors relative"
          >
            <FaFileImport className="text-xs text-sky-400" />
            <span className="hidden sm:inline">Files ({uploadedFiles.length})</span>
          </button>
        </div>
      </div>

      {/* Real-time AI Spending Anomaly & Duplicate Charge Banner */}
      <AnomalyAlertBanner
        transactions={csvData}
        onReviewTransaction={handleEdit}
        showToast={showToast}
      />


      {/* Imported Files Dropdown */}
      {showFiles && (
        <div className="p-4 rounded-2xl bg-[#08080b] border border-white/[0.08] shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <FaFileImport className="text-sky-400" /> Imported Statement Files
            </h3>
            <button
              type="button"
              onClick={() => setShowFiles(false)}
              className="text-xs text-zinc-500 hover:text-white bg-transparent border-none cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>

          {uploadedFiles.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2">No imported statements yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c0c10] border border-white/[0.04] text-xs">
                  <div className="flex items-center gap-2.5">
                    <FaReceipt className="text-zinc-400" />
                    <div>
                      <strong className="text-white block">{file.name}</strong>
                      <span className="text-[10px] text-zinc-500">{file.importedAt || "Imported"}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#08080b] border border-white/[0.06] shadow-xl space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium block">Total Entries</span>
          <strong className="text-lg sm:text-xl font-bold text-white block">{filteredData.length}</strong>
          <span className="text-[10px] text-zinc-500">Filtered records</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#08080b] border border-white/[0.06] shadow-xl space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium block">Total Inflow</span>
          <strong className="text-lg sm:text-xl font-bold text-emerald-400 block">
            {formatCurrency(totalIncome)}
          </strong>
          <span className="text-[10px] text-zinc-500">Income received</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#08080b] border border-white/[0.06] shadow-xl space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium block">Total Outflow</span>
          <strong className="text-lg sm:text-xl font-bold text-rose-400 block">
            {formatCurrency(totalExpense)}
          </strong>
          <span className="text-[10px] text-zinc-500">Money spent</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#08080b] border border-white/[0.06] shadow-xl space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium block">Top Expense</span>
          <strong className="text-lg sm:text-xl font-bold text-amber-400 block truncate">{topCategory}</strong>
          <span className="text-[10px] text-zinc-500">Highest category</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#08080b] border border-white/[0.06] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
          <input
            type="text"
            placeholder="Search category, note or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c10] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto p-1 bg-[#0c0c10] border border-white/[0.06] rounded-xl">
          <FaFilter className="text-zinc-500 text-xs ml-2 mr-1 hidden sm:inline" />
          {[
            ["all", "All"],
            ["income", "Income"],
            ["expense", "Expense"],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilterType(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                filterType === val
                  ? "bg-zinc-800 text-white font-bold shadow-sm border border-white/[0.12]"
                  : "bg-transparent text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Transactions List / Table */}
      <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <h2 className="text-base font-bold text-white tracking-tight">
            Ledger Records ({filteredData.length})
          </h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Realtime Sync
          </span>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.06] mx-auto flex items-center justify-center text-zinc-500 text-lg">
              <FaReceipt />
            </div>
            <p className="text-xs text-zinc-400">No transactions match your search or filter.</p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
            >
              <FaPlus className="text-[10px]" /> Add Entry Now
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredData.map((item, idx) => {
              const isIncome = String(item.type || "").toLowerCase() === "income";
              const category = item.Category || item.category || (isIncome ? "Salary" : "Expense");
              const amount = Number(item.Amount || item.amount || 0);
              const note = item.Note || item.note || "";
              const date = item.Date || item.date || "-";
              const account = item.Account || item.accountType || "Cash";

              return (
                <div
                  key={item.id || item.firestoreId || `item-${idx}`}
                  className="group flex items-center justify-between p-3.5 rounded-xl sm:rounded-2xl bg-[#0c0c10] hover:bg-[#121217] border border-white/[0.04] hover:border-white/[0.09] transition-all"
                >
                  {/* Left Column: Icon + Category + Note */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${getCategoryIconSquircle(category)}`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[150px] sm:max-w-xs">
                          {note || category}
                        </span>
                        {note && note !== category && (
                          <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide ${getCategoryBadgeStyle(category)}`}>
                            {category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                        <span>{date}</span>
                        <span>•</span>
                        <span className="text-zinc-400">{account}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amount + Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-xs sm:text-sm font-bold tracking-tight block ${
                          isIncome ? "text-emerald-400" : "text-zinc-200"
                        }`}
                      >
                        {isIncome ? "+ " : "- "}{formatCurrency(amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border-none cursor-pointer text-xs transition-colors"
                        title="Edit entry"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(item)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-none cursor-pointer text-xs transition-colors"
                        title="Delete entry"
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
      </div>

      {/* Edit Transaction Modal */}
      {editingItem && (
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
                  onChange={(e) => setEditingItem({ ...editingItem, amount: e.target.value })}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">Category</label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">Date</label>
                <input
                  type="date"
                  value={editingItem.date}
                  onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">Note / Description</label>
                <input
                  type="text"
                  value={editingItem.note}
                  onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/40 transition-all active:scale-95"
              >
                <FaCheck className="text-emerald-400" /> Update Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add New Transaction Modal */}
      {showAddModal && (
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
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    {(newType === "income" ? defaultIncomeCategories : defaultExpenseCategories).map((c) => (
                      <option key={c} value={c} className="bg-zinc-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">Account</label>
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
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">Note / Description</label>
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
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/40 transition-all active:scale-95"
              >
                <FaCheck className="text-emerald-400" /> Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Receipt & Invoice OCR Modal */}
      <ReceiptScanner
        isOpen={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
        showToast={showToast}
        onExpenseAdded={(newExp) => {
          if (typeof onSaveTransaction === "function") {
            onSaveTransaction(newExp);
          }
        }}
      />
    </div>
  );
}

export default Transactions;
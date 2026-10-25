import React, { useMemo, useState, useEffect, Component } from "react";
import {
  FaArrowDown,
  FaArrowRight,
  FaArrowUp,
  FaBell,
  FaCalendarAlt,
  FaChartBar,
  FaChartLine,
  FaCheck,
  FaCheckCircle,
  FaCog,
  FaEdit,
  FaFileInvoiceDollar,
  FaHome,
  FaLandmark,
  FaMagic,
  FaMicrophone,
  FaPaperclip,
  FaPlus,
  FaRegBell,
  FaRegFileAlt,
  FaRobot,
  FaSearch,
  FaShoppingBag,
  FaSignOutAlt,
  FaTimes,
  FaTrash,
  FaUpload,
  FaUser,
  FaUtensils,
  FaWallet,
  FaBullseye,
  FaBriefcase,
  FaPlane,
  FaHeartbeat,
  FaCar,
  FaGraduationCap,
  FaChevronDown,
  FaPiggyBank,
  FaExchangeAlt,
  FaShieldAlt,
  FaClock,
  FaReceipt,
  FaSpinner,
  FaExclamationTriangle,
  FaRedo,
  FaEnvelopeOpenText,
  FaSyncAlt,
} from "react-icons/fa";
import { EXPENSE_CATEGORIES, formatCurrency, getCurrencySymbol } from "../config/constants.js";

import { auth } from "../firebase";
import {
  subscribeBudgets,
  saveBudget,
  subscribeGoals,
  saveGoal,
  subscribeBills,
  saveBill,
  batchAddTransactions,
} from "../services/firestore.js";

const expenseCategories = EXPENSE_CATEGORIES;

import AddTransactionModal from "../components/AddTransactionModal";
import DashboardHero from "../components/dashboard/DashboardHero";
import SegmentedTabs from "../components/dashboard/SegmentedTabs";
import RecentActivityList from "../components/dashboard/RecentActivityList";
import BudgetsGoalsWidget from "../components/dashboard/BudgetsGoalsWidget";
import SmartSyncWidget from "../components/dashboard/SmartSyncWidget";
import BeginnerOnboarding from "../components/dashboard/BeginnerOnboarding";
import ReceiptScanner from "../components/ReceiptScanner";
import CashFlowForecastCard from "../components/dashboard/CashFlowForecastCard";
import AnomalyAlertBanner from "../components/dashboard/AnomalyAlertBanner";
import VoiceAssistantModal from "../components/voice/VoiceAssistantModal";

import {
  parseStatementFile,
  validateStatementFile,
} from "../utils/statementParser";
import {
  processAndSyncPurchaseEmails,
  parseEmailBatch,
} from "../utils/emailParser";

const cleanAmount = (value) =>
  Number(String(value || 0).replace(/[,+]/g, "")) || 0;

export class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard caught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#000000] text-white">
          <div className="max-w-md w-full bg-[#0a0a0d] border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-2xl mx-auto mb-4">
              <FaExclamationTriangle />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">View Recovered</h2>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              FinSight AI protected your view from a temporary layout fault. Your
              financial records and Firestore data remain secure.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs flex items-center gap-2 cursor-pointer border border-emerald-500 transition-all active:scale-[0.98]"
              >
                <FaRedo className="text-emerald-400" /> Reload View
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardContent({
  totalBalance = 0,
  totalIncome = 0,
  totalExpense = 0,
  csvData = [],
  onGmailTransactionsLoaded,
  currentUser = null,
  uploadedFiles = [],
  setUploadedFiles = () => {},
  onSaveTransaction = async () => true,
  onDeleteTransaction = async () => true,
  showToast = () => {},
}) {
  // Active Segmented View Tab: 'overview' | 'budgets' | 'goals_bills' | 'sync'
  const [activeTab, setActiveTab] = useState("overview");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [addBudgetModalOpen, setAddBudgetModalOpen] = useState(false);

  // Editing state for modal
  const [editingTx, setEditingTx] = useState(null);

  // Transient Gmail transactions for current session
  const [gmailTransactions, setGmailTransactions] = useState([]);

  // Dynamic, user-scoped planning items (budgets, goals, bills) synced to Firestore
  const [bills, setBills] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState([]);

  const [prevUid, setPrevUid] = useState(currentUser?.uid);
  if (prevUid !== currentUser?.uid) {
    setPrevUid(currentUser?.uid);
    setGmailTransactions([]);
    if (!currentUser?.uid) {
      setBills([]);
      setGoals([]);
      setCategoryBudgets([]);
    }
  }

  // Subscribe in real-time to user's planning items on Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubBills = subscribeBills(currentUser.uid, (data) => setBills(data || []));
    const unsubGoals = subscribeGoals(currentUser.uid, (data) => setGoals(data || []));
    const unsubBudgets = subscribeBudgets(currentUser.uid, (data) => setCategoryBudgets(data || []));

    return () => {
      if (typeof unsubBills === "function") unsubBills();
      if (typeof unsubGoals === "function") unsubGoals();
      if (typeof unsubBudgets === "function") unsubBudgets();
    };
  }, [currentUser?.uid]);

  // Modal form temporary fields
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("2026-12-31");
  const [newGoalCurrent, setNewGoalCurrent] = useState("0");

  const [newBudgetCategory, setNewBudgetCategory] = useState("Food");
  const [newBudgetLimit, setNewBudgetLimit] = useState("");

  // Combined master transactions list strictly derived from csvData (user-scoped from App)
  const masterTransactions = useMemo(() => {
    const baseList = Array.isArray(csvData) && csvData.length > 0 ? [...csvData] : [];

    if (Array.isArray(gmailTransactions) && gmailTransactions.length > 0) {
      const existingIds = new Set(
        baseList
          .flatMap((item) => [item.id, item.firestoreId, item.rawEmailId, item.emailId])
          .filter(Boolean)
      );
      for (const gTx of gmailTransactions) {
        const gKey = gTx.id || gTx.firestoreId;
        const gRaw = gTx.rawEmailId || gTx.emailId;
        if ((!gKey || !existingIds.has(gKey)) && (!gRaw || !existingIds.has(gRaw))) {
          baseList.unshift(gTx);
        }
      }
    }

    return baseList.sort((a, b) => {
      const timeA = new Date(a.date || a.createdAt).getTime() || 0;
      const timeB = new Date(b.date || b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [csvData, gmailTransactions]);

  // Live metrics calculations
  const liveExpenses = useMemo(() => {
    return masterTransactions
      .filter((item) => (item?.type || "expense").toLowerCase() === "expense")
      .reduce((sum, item) => sum + cleanAmount(item?.amount || item?.Amount || 0), 0);
  }, [masterTransactions]);

  const liveIncome = useMemo(() => {
    return masterTransactions
      .filter((item) => (item?.type || "").toLowerCase() === "income")
      .reduce((sum, item) => sum + cleanAmount(item?.amount || item?.Amount || 0), 0);
  }, [masterTransactions]);

  const liveBalance = useMemo(() => {
    return liveIncome - liveExpenses;
  }, [liveIncome, liveExpenses]);

  const displayBalance = masterTransactions.length > 0 ? liveBalance : totalBalance;
  const displayExpenses = masterTransactions.length > 0 ? liveExpenses : totalExpense;
  const displayIncome = masterTransactions.length > 0 ? liveIncome : totalIncome;

  // Actions
  const handleOpenAddModal = (preset = null) => {
    setEditingTx(preset);
    setModalOpen(true);
  };

  const handleEditTransaction = (tx) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleDelete = async (tx) => {
    if (!tx) return;
    await onDeleteTransaction(tx);
  };

  // Gmail purchase sync handler
  const handleGmailTransactionsLoaded = async (rawPayloads) => {
    try {
      const uid = currentUser?.uid || auth.currentUser?.uid || null;

      let items = [];
      if (Array.isArray(rawPayloads)) {
        items = rawPayloads;
      } else if (rawPayloads && typeof rawPayloads === "object") {
        items = rawPayloads.transactions || rawPayloads.newTransactions || rawPayloads.data || [];
      }

      if (!items || items.length === 0) {
        showToast("Your ledger is up to date with all saved transactions!", "info");
        return;
      }

      const parsedItems = parseEmailBatch(items);
      if (!parsedItems || parsedItems.length === 0) {
        showToast("Your ledger is up to date with all saved transactions!", "info");
        return;
      }

      const existingKeySet = new Set(
        masterTransactions
          .flatMap((t) => [
            t.id,
            t.firestoreId,
            t.rawEmailId,
            t.emailId,
            `${cleanAmount(t.amount)}_${t.date}_${(t.note || t.merchant || "").toLowerCase().trim()}`,
          ])
          .filter(Boolean)
      );

      const unSyncedItems = parsedItems.filter((item) => {
        const key = item.id || item.firestoreId;
        const rawId = item.rawEmailId || item.emailId;
        const signature = `${cleanAmount(item.amount)}_${item.date}_${(item.note || item.merchant || "").toLowerCase().trim()}`;
        return (
          (!key || !existingKeySet.has(key)) &&
          (!rawId || !existingKeySet.has(rawId)) &&
          !existingKeySet.has(signature)
        );
      });

      if (unSyncedItems.length === 0) {
        showToast("Your ledger is up to date with all saved transactions!", "info");
        return;
      }

      const result = await processAndSyncPurchaseEmails(unSyncedItems, uid);

      if (result.success && result.transactions?.length > 0) {
        const count = result.count || result.transactions.length;
        setGmailTransactions((prev) => [...result.transactions, ...prev]);

        if (typeof onGmailTransactionsLoaded === "function") {
          onGmailTransactionsLoaded(result.transactions);
        }

        showToast(`Successfully synced ${count} purchase receipts!`, "success");
      } else {
        showToast("Your ledger is up to date with all saved transactions!", "info");
      }
    } catch (err) {
      console.error("Gmail ingestion error:", err);
      showToast("Email sync failed: " + (err.message || String(err)), "error");
    }
  };

  // Statement Parser File Drop
  const handleStatementFile = async (file) => {
    if (!file) return;

    const validation = validateStatementFile(file);
    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }

    showToast(`Parsing statement: ${file.name}...`, "info");

    try {
      const result = await parseStatementFile(file);
      if (!result.success || !result.transactions || result.transactions.length === 0) {
        showToast(result.error || "No valid transactions found in the file.", "error");
        return;
      }

      const { transactions: parsedTx } = result;
      const uid = currentUser?.uid || auth.currentUser?.uid || null;

      if (uid) {
        const syncRes = await batchAddTransactions(parsedTx, uid);
        if (!syncRes.success) {
          for (const tx of parsedTx) {
            await onSaveTransaction(tx);
          }
        }
      } else {
        for (const tx of parsedTx) {
          await onSaveTransaction(tx);
        }
      }

      if (typeof setUploadedFiles === "function") {
        setUploadedFiles((prev = []) => [
          {
            name: file.name,
            size: file.size,
            type: file.type || "Statement",
            importedAt: new Date().toLocaleString(),
          },
          ...prev,
        ]);
      }

      showToast(`Imported ${parsedTx.length} transactions from ${file.name}!`, "success");
    } catch (err) {
      showToast("Failed to parse statement: " + err.message, "error");
    }
  };

  // Speech Recognition & Natural Language Assistant
  const startVoiceLogging = () => {
    setVoiceModalOpen(true);
  };

  // Form Submissions for Goals, Budgets, and Bills
  const handleToggleBillPaid = async (billId) => {
    const bill = bills.find((b) => b.id === billId || b.firestoreId === billId);
    if (!bill) return;
    const res = await saveBill({ ...bill, paid: !bill.paid }, currentUser?.uid);
    if (!res.success) {
      showToast(`Failed to update bill: ${res.error}`, "error");
    }
  };

  const handleAddGoalSubmit = async (e) => {
    e.preventDefault();
    if (!newGoalName.trim() || !newGoalTarget) return;

    const newG = {
      name: newGoalName.trim(),
      targetAmount: cleanAmount(newGoalTarget),
      currentAmount: cleanAmount(newGoalCurrent) || 0,
      deadline: newGoalDeadline || "2026-12-31",
      color: "#10b981",
    };

    const res = await saveGoal(newG, currentUser?.uid);
    if (res.success) {
      setNewGoalName("");
      setNewGoalTarget("");
      setNewGoalCurrent("0");
      setAddGoalModalOpen(false);
      showToast("Savings Goal bucket initialized!", "success");
    } else {
      showToast(`Failed to save goal: ${res.error}`, "error");
    }
  };

  const handleAddBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!newBudgetLimit) return;

    const limitAmt = cleanAmount(newBudgetLimit);
    const res = await saveBudget(
      {
        category: newBudgetCategory,
        limit: limitAmt,
      },
      currentUser?.uid
    );

    if (res.success) {
      setNewBudgetLimit("");
      setAddBudgetModalOpen(false);
      showToast(`Monthly budget for ${newBudgetCategory} set to ${formatCurrency(limitAmt)}!`, "success");
    } else {
      showToast(`Failed to save budget: ${res.error}`, "error");
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {/* 1. Hero Summary (Net Balance, Income, Expense, Quick Actions) */}
      <DashboardHero
        totalBalance={displayBalance}
        totalIncome={displayIncome}
        totalExpense={displayExpenses}
        transactions={masterTransactions}
        onOpenAddModal={() => handleOpenAddModal()}
        onOpenVoiceModal={startVoiceLogging}
        onOpenReceiptModal={() => setReceiptModalOpen(true)}
        onOpenImport={() => document.getElementById("fileUpload")?.click()}
        onOpenSyncTab={() => setActiveTab("sync")}
      />

      {/* 2. Beginner Onboarding Checklist (Auto-dismissible) */}
      <BeginnerOnboarding
        userId={currentUser?.uid}
        hasTransactions={masterTransactions.length > 0}
        hasBudgets={categoryBudgets.length > 0}
        hasImported={uploadedFiles.length > 0 || gmailTransactions.length > 0}
        onOpenAddModal={() => handleOpenAddModal()}
        onOpenAddBudget={() => setAddBudgetModalOpen(true)}
        onOpenSyncTab={() => setActiveTab("sync")}
      />

      {/* 3. Segmented Navigation Tabs Switcher */}
      <SegmentedTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        transactionCount={masterTransactions.length}
        goalsCount={goals.length}
        billsCount={bills.length}
      />

      {/* =========================================================================
          VIEW PANEL 1: OVERVIEW (Default minimalist dashboard view)
          ========================================================================= */}
      {activeTab === "overview" && (
        <div className="w-full space-y-6">
          <AnomalyAlertBanner
            transactions={masterTransactions}
            onReviewTransaction={handleEditTransaction}
            showToast={showToast}
          />
          <CashFlowForecastCard
            transactions={masterTransactions}
            totalBalance={displayBalance}
          />
          <RecentActivityList
            transactions={masterTransactions}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDelete}
            onOpenAddModal={() => handleOpenAddModal()}
          />
        </div>
      )}



      {/* =========================================================================
          VIEW PANEL 2: BUDGETS & SPENDING ENVELOPES
          ========================================================================= */}
      {activeTab === "budgets" && (
        <BudgetsGoalsWidget
          budgets={categoryBudgets}
          goals={goals}
          bills={bills}
          transactions={masterTransactions}
          onOpenAddBudget={() => setAddBudgetModalOpen(true)}
          onOpenAddGoal={() => setAddGoalModalOpen(true)}
          onToggleBillPaid={handleToggleBillPaid}
        />
      )}

      {/* =========================================================================
          VIEW PANEL 3: GOALS & UPCOMING BILLS
          ========================================================================= */}
      {activeTab === "goals_bills" && (
        <BudgetsGoalsWidget
          budgets={categoryBudgets}
          goals={goals}
          bills={bills}
          transactions={masterTransactions}
          onOpenAddBudget={() => setAddBudgetModalOpen(true)}
          onOpenAddGoal={() => setAddGoalModalOpen(true)}
          onToggleBillPaid={handleToggleBillPaid}
        />
      )}

      {/* =========================================================================
          VIEW PANEL 4: SMART SYNC & STATEMENT SCANNER
          ========================================================================= */}
      {activeTab === "sync" && (
        <SmartSyncWidget
          onTransactionsLoaded={handleGmailTransactionsLoaded}
          onStatementFileSelected={handleStatementFile}
          onOpenVoiceModal={startVoiceLogging}
          onOpenReceiptModal={() => setReceiptModalOpen(true)}
          existingIds={masterTransactions.map((t) => t.id || t.firestoreId)}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
          MODALS & OVERLAYS
          ========================================================================= */}

      {/* AI Receipt & Invoice OCR Modal */}
      <ReceiptScanner
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        currentUser={currentUser}
        showToast={showToast}
        onExpenseAdded={(newExp) => {
          if (typeof onSaveTransaction === "function") {
            onSaveTransaction(newExp);
          }
        }}
      />

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        onSaveTransaction={onSaveTransaction}
        editingTransaction={editingTx}
      />


      {/* Voice-to-Expense AI Logging Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSaveTransaction={onSaveTransaction}
        onOpenManualEdit={(preset) => handleOpenAddModal(preset)}
        showToast={showToast}
      />

      {/* Add Goal Modal */}
      {addGoalModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setAddGoalModalOpen(false)}
        >
          <div
            className="bg-[#0c0c10] border border-white/[0.08] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FaBullseye className="text-emerald-400" /> Initialize Savings Milestone
              </h3>
              <button
                type="button"
                onClick={() => setAddGoalModalOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 bg-transparent border-none cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddGoalSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                  Goal Name / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vacation Trip, Emergency Fund"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                    Target Amount ({getCurrencySymbol()})
                  </label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                    Current Saved ({getCurrencySymbol()})
                  </label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={newGoalCurrent}
                    onChange={(e) => setNewGoalCurrent(e.target.value)}
                    className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500 transition-all active:scale-[0.98]"
              >
                <FaCheck className="text-emerald-400" /> Create Goal Bucket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {addBudgetModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setAddBudgetModalOpen(false)}
        >
          <div
            className="bg-[#0c0c10] border border-white/[0.08] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FaPiggyBank className="text-emerald-400" /> Set Monthly Category Budget
              </h3>
              <button
                type="button"
                onClick={() => setAddBudgetModalOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 bg-transparent border-none cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddBudgetSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                  Category
                </label>
                <select
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value)}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                  Monthly Spending Limit ({getCurrencySymbol()})
                </label>
                <input
                  type="number"
                  placeholder="8000"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500 transition-all active:scale-[0.98]"
              >
                <FaCheck className="text-emerald-400" /> Save Budget Limit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard(props) {
  return (
    <DashboardErrorBoundary>
      <DashboardContent {...props} />
    </DashboardErrorBoundary>
  );
}
import React, { useState, useEffect, useMemo } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaPlus,
  FaEllipsisH,
  FaMoneyBillWave,
  FaPiggyBank,
  FaCreditCard,
  FaLandmark,
  FaWallet,
  FaCoins,
  FaExchangeAlt,
  FaTimes,
  FaCheck,
  FaTrash,
  FaEdit,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaCalendarAlt,
  FaReceipt,
  FaSpinner,
} from "react-icons/fa";

import {
  DEFAULT_ACCOUNTS,
  formatCurrency,
} from "../config/constants.js";
import {
  subscribeAccounts,
  saveAccount,
  deleteAccount,
} from "../services/firestore.js";
import AddAccountModal from "../components/accounts/AddAccountModal";
import TransferFundsModal from "../components/accounts/TransferFundsModal";
import AccountTransactionsDrawer from "../components/accounts/AccountTransactionsDrawer";

export default function Accounts({
  csvData = [],
  loadingData = false,
  totalIncome = 0,
  totalExpense = 0,
  onSaveTransaction = async () => true,
  showToast = () => {},
}) {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isExecutingTransfer, setIsExecutingTransfer] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubAuth;
  }, []);

  const [prevUid, setPrevUid] = useState(currentUser?.uid);
  if (prevUid !== currentUser?.uid) {
    setPrevUid(currentUser?.uid);
    if (!currentUser?.uid) {
      setAccounts([]);
      setIsLoadingAccounts(false);
    } else {
      setIsLoadingAccounts(true);
    }
  }

  // Real-time Firestore subscription for accounts
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubAccounts = subscribeAccounts(
      currentUser.uid,
      (data) => {
        setAccounts(data || []);
        setIsLoadingAccounts(false);
      },
      (err) => {
        console.error("Accounts subscription error:", err);
        setIsLoadingAccounts(false);
      }
    );

    return () => {
      if (typeof unsubAccounts === "function") unsubAccounts();
    };
  }, [currentUser?.uid]);

  // Modals state
  const [addAccountModal, setAddAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [selectedAccountForTx, setSelectedAccountForTx] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Form states for Add / Edit Account
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("Bank");
  const [accIcon, setAccIcon] = useState("card");
  const [accInitialBalance, setAccInitialBalance] = useState("0");

  // Form states for Transfer Funds
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferDate, setTransferDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  // Search filter inside transactions drawer
  const [searchQuery, setSearchQuery] = useState("");

  // Compute live real-time balances for each account from transaction stream
  const accountBalances = useMemo(() => {
    const result = {};

    accounts.forEach((acc) => {
      const accKey = String(acc.name || "").toLowerCase().trim();
      const initial = Number(acc.initialBalance || 0);

      let incomeSum = 0;
      let expenseSum = 0;

      csvData.forEach((tx) => {
        const txAccount = String(
          tx.Account || tx.accountType || tx.account || ""
        )
          .toLowerCase()
          .trim();

        // Match account name or type
        const isMatch =
          txAccount === accKey ||
          txAccount === String(acc.type || "").toLowerCase().trim();

        if (isMatch) {
          const rawType = String(tx.Type || tx.type || "").toLowerCase();
          const isIncome = rawType === "income";
          const amount = Math.abs(
            Number(String(tx.Amount || tx.amount || 0).replace(/[+,]/g, "")) || 0
          );

          if (isIncome) {
            incomeSum += amount;
          } else {
            expenseSum += amount;
          }
        }
      });

      result[acc.id] = {
        currentBalance: initial + incomeSum - expenseSum,
        income: incomeSum,
        expense: expenseSum,
        txCount: csvData.filter((tx) => {
          const txAccount = String(
            tx.Account || tx.accountType || tx.account || ""
          )
            .toLowerCase()
            .trim();
          return (
            txAccount === accKey ||
            txAccount === String(acc.type || "").toLowerCase().trim()
          );
        }).length,
      };
    });

    return result;
  }, [accounts, csvData]);

  // Total calculated balance across all accounts
  const grandTotalBalance = useMemo(() => {
    return Object.values(accountBalances).reduce(
      (sum, item) => sum + (item.currentBalance || 0),
      0
    );
  }, [accountBalances]);

  // Open Add Account modal
  const handleOpenAdd = () => {
    setEditingAccount(null);
    setAccName("");
    setAccType("Bank");
    setAccIcon("card");
    setAccInitialBalance("0");
    setAddAccountModal(true);
  };

  // Open Edit Account modal
  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccType(acc.type || "Bank");
    setAccIcon(acc.iconType || "card");
    setAccInitialBalance(String(acc.initialBalance || 0));
    setActiveMenuId(null);
    setAddAccountModal(true);
  };

  // Save Add / Edit Account
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accName.trim()) {
      showToast("Account name cannot be blank.", "error");
      return;
    }

    setIsSavingAccount(true);
    try {
      if (editingAccount) {
        const res = await saveAccount(
          {
            id: editingAccount.id,
            firestoreId: editingAccount.id,
            name: accName.trim(),
            type: accType,
            iconType: accIcon,
            initialBalance: Number(accInitialBalance) || 0,
            color: editingAccount.color || "emerald",
          },
          currentUser?.uid
        );

        if (res.success) {
          showToast(`Account "${accName}" updated.`, "success");
          setAddAccountModal(false);
        } else {
          showToast(`Failed to update account: ${res.error}`, "error");
        }
      } else {
        const res = await saveAccount(
          {
            name: accName.trim(),
            type: accType,
            iconType: accIcon,
            initialBalance: Number(accInitialBalance) || 0,
            color:
              accIcon === "cash"
                ? "emerald"
                : accIcon === "savings"
                ? "rose"
                : "sky",
          },
          currentUser?.uid
        );

        if (res.success) {
          showToast(`Account "${accName}" added.`, "success");
          setAddAccountModal(false);
        } else {
          showToast(`Failed to add account: ${res.error}`, "error");
        }
      }
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;
    if (accounts.length <= 1) {
      showToast("You must have at least one account.", "error");
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${acc.name}"?`)) {
      const res = await deleteAccount(id, currentUser?.uid);
      if (res.success) {
        setActiveMenuId(null);
        if (selectedAccountForTx?.id === id) setSelectedAccountForTx(null);
        showToast(`Account "${acc.name}" removed.`, "success");
      } else {
        showToast(`Failed to delete account: ${res.error}`, "error");
      }
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = (fromAcc = null) => {
    if (accounts.length < 2) {
      showToast("Add at least 2 accounts to transfer funds.", "error");
      return;
    }
    const defaultFrom = fromAcc ? fromAcc.name : accounts[0].name;
    const defaultTo = accounts.find((a) => a.name !== defaultFrom)?.name || accounts[1]?.name || "";
    setTransferFrom(defaultFrom);
    setTransferTo(defaultTo);
    setTransferAmount("");
    setTransferNote("Account Transfer");
    setTransferDate(new Date().toISOString().slice(0, 10));
    setActiveMenuId(null);
    setTransferModal(true);
  };

  // Submit Inter-Account Transfer
  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) {
      showToast("Please enter a valid transfer amount.", "error");
      return;
    }
    if (transferFrom === transferTo) {
      showToast("Source and destination accounts must be different.", "error");
      return;
    }

    setIsExecutingTransfer(true);
    try {
      // 1. Deduct from source account
      await onSaveTransaction({
        type: "Expense",
        amount: amt,
        category: "Transfer",
        accountType: transferFrom,
        note: `Transfer to ${transferTo}: ${transferNote || "Internal transfer"}`,
        date: transferDate,
      });

      // 2. Add to destination account
      await onSaveTransaction({
        type: "Income",
        amount: amt,
        category: "Transfer",
        accountType: transferTo,
        note: `Transfer from ${transferFrom}: ${transferNote || "Internal transfer"}`,
        date: transferDate,
      });

      showToast(`Transferred ${formatCurrency(amt)} from ${transferFrom} to ${transferTo}`, "success");
      setTransferModal(false);
    } catch (err) {
      showToast("Transfer failed: " + err.message, "error");
    } finally {
      setIsExecutingTransfer(false);
    }
  };

  // Icon badge renderer
  const renderAccountIcon = (acc) => {
    const iconType = acc.iconType || String(acc.type || "").toLowerCase();

    if (iconType.includes("cash") || acc.name.toLowerCase().includes("cash")) {
      return (
        <div className="w-13 h-13 rounded-2xl bg-[#e6f4ea] dark:bg-[#13281d] border border-emerald-500/30 flex items-center justify-center text-[#0f9d58] dark:text-emerald-400 text-2xl shrink-0 shadow-sm">
          <FaMoneyBillWave />
        </div>
      );
    }

    if (
      iconType.includes("savings") ||
      iconType.includes("piggy") ||
      acc.name.toLowerCase().includes("saving")
    ) {
      return (
        <div className="w-13 h-13 rounded-2xl bg-[#fce8e6] dark:bg-[#2d1417] border border-rose-500/30 flex items-center justify-center text-[#d93025] dark:text-rose-400 text-2xl shrink-0 shadow-sm">
          <FaPiggyBank />
        </div>
      );
    }

    if (
      iconType.includes("card") ||
      iconType.includes("online") ||
      acc.name.toLowerCase().includes("online") ||
      acc.name.toLowerCase().includes("card")
    ) {
      return (
        <div className="w-13 h-13 rounded-2xl bg-[#e8f0fe] dark:bg-[#142038] border border-sky-500/30 flex items-center justify-center text-[#1a73e8] dark:text-sky-400 text-2xl shrink-0 shadow-sm">
          <FaCreditCard />
        </div>
      );
    }

    if (iconType.includes("bank") || acc.name.toLowerCase().includes("bank")) {
      return (
        <div className="w-13 h-13 rounded-2xl bg-[#fef7e0] dark:bg-[#2c220f] border border-amber-500/30 flex items-center justify-center text-[#f29900] dark:text-amber-400 text-2xl shrink-0 shadow-sm">
          <FaLandmark />
        </div>
      );
    }

    return (
      <div className="w-13 h-13 rounded-2xl bg-[#f3e8fd] dark:bg-[#251538] border border-purple-500/30 flex items-center justify-center text-[#9334e6] dark:text-purple-400 text-2xl shrink-0 shadow-sm">
        <FaWallet />
      </div>
    );
  };

  // Filtered transactions for selected account
  const accountTransactions = useMemo(() => {
    if (!selectedAccountForTx) return [];
    const accName = selectedAccountForTx.name.toLowerCase().trim();
    const accType = (selectedAccountForTx.type || "").toLowerCase().trim();

    return csvData.filter((tx) => {
      const txAcc = String(tx.Account || tx.accountType || tx.account || "")
        .toLowerCase()
        .trim();
      const matchesAcc = txAcc === accName || txAcc === accType;
      if (!matchesAcc) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const cat = String(tx.Category || tx.category || "").toLowerCase();
      const note = String(tx.Note || tx.note || "").toLowerCase();
      const amt = String(tx.Amount || tx.amount || "");
      return cat.includes(q) || note.includes(q) || amt.includes(q);
    });
  }, [selectedAccountForTx, csvData, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* ==========================================================================
          Header Section (Exact Match to User Reference Screenshot)
          ========================================================================== */}
      <div className="bg-[#08080b] border border-white/[0.06] rounded-3xl p-6 sm:p-7 text-center space-y-3 relative overflow-hidden">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Net Account Balances
        </span>

        {/* All Accounts Net Balance */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          All Accounts {formatCurrency(grandTotalBalance)}
        </h1>

        {/* EXPENSE SO FAR / INCOME SO FAR METRICS */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 pt-2 flex-wrap">
          <div className="text-center">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              EXPENSE SO FAR
            </span>
            <span className="text-base sm:text-lg font-extrabold text-rose-400 block">
              {formatCurrency(totalExpense)}
            </span>
          </div>

          <div className="h-8 w-px bg-white/[0.08]" />

          <div className="text-center">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              INCOME SO FAR
            </span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-400 block">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          Accounts List Section
          ========================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Accounts
          </h2>
          <button
            type="button"
            onClick={() => handleOpenTransfer()}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <FaExchangeAlt className="text-xs text-emerald-400" />
            <span>Transfer Funds</span>
          </button>
        </div>

        {/* Account Cards Feed */}
        <div className="space-y-3">
          {isLoadingAccounts || loadingData ? (
            <div className="p-12 text-center text-zinc-500 text-xs flex items-center justify-center gap-2 bg-[#08080b] rounded-2xl border border-white/[0.04]">
              <FaSpinner className="animate-spin text-emerald-400 text-sm" />
              <span>Loading your accounts...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs bg-[#08080b] rounded-2xl border border-white/[0.04]">
              No accounts created yet. Click "Create New Account" below to initialize one.
            </div>
          ) : (
            accounts.map((acc) => {
              const balInfo = accountBalances[acc.id] || { currentBalance: 0, income: 0, expense: 0, txCount: 0 };
              const isMenuOpen = activeMenuId === acc.id;

            return (
              <div
                key={acc.id}
                className="bg-[#08080b] hover:bg-[#0c0c10] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl md:rounded-3xl p-4 sm:p-5 transition-all flex items-center justify-between gap-4 relative group"
              >
                {/* Left: Icon & Details */}
                <div
                  className="flex items-center gap-3.5 sm:gap-4 flex-1 cursor-pointer"
                  onClick={() => setSelectedAccountForTx(acc)}
                  title="Click to view transactions"
                >
                  {renderAccountIcon(acc)}

                  <div className="space-y-0.5">
                    <h3 className="text-base sm:text-lg font-extrabold text-white capitalize tracking-tight flex items-center gap-2">
                      <span>{acc.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                        {acc.type}
                      </span>
                    </h3>

                    <div className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="text-zinc-400 font-normal">Balance:</span>
                      <span className={balInfo.currentBalance < 0 ? "text-rose-400" : "text-emerald-400"}>
                        {formatCurrency(balInfo.currentBalance)}
                      </span>
                    </div>

                    <p className="text-[10px] text-zinc-500 hidden sm:block">
                      {balInfo.txCount} entries · +{formatCurrency(balInfo.income)} in / -{formatCurrency(balInfo.expense)} out
                    </p>
                  </div>
                </div>

                {/* Right: Three Dots Action Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : acc.id);
                    }}
                    className="p-2.5 text-zinc-400 hover:text-white bg-transparent hover:bg-white/[0.06] rounded-xl cursor-pointer transition-colors"
                    aria-label="Account actions"
                  >
                    <FaEllipsisH className="text-base" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-[#0e0e14] border border-white/[0.08] rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 space-y-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccountForTx(acc);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                      >
                        <FaReceipt className="text-emerald-400" /> View Ledger
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenTransfer(acc)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                      >
                        <FaExchangeAlt className="text-sky-400" /> Transfer Money
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(acc)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                      >
                        <FaEdit className="text-amber-400" /> Edit Details
                      </button>

                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                        >
                          <FaTrash className="text-rose-400" /> Delete Account
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>

        {/* [+ ADD NEW ACCOUNT] Outline Action Button (Exact Reference Design) */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full py-4 rounded-2xl sm:rounded-3xl bg-[#08080b] hover:bg-[#0c0c10] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 border border-white/[0.15] hover:border-emerald-500 transition-all cursor-pointer active:scale-[0.98]"
        >
          <div className="w-5 h-5 rounded-full border border-emerald-400 flex items-center justify-center text-emerald-400 text-xs font-bold">
            <FaPlus className="text-[10px]" />
          </div>
          <span>ADD NEW ACCOUNT</span>
        </button>
      </div>

      {/* Account Transactions Ledger Drawer */}
      <AccountTransactionsDrawer
        selectedAccount={selectedAccountForTx}
        onClose={() => setSelectedAccountForTx(null)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        accountTransactions={accountTransactions}
        accountBalance={accountBalances[selectedAccountForTx?.id]?.currentBalance || 0}
        renderIcon={renderAccountIcon}
      />

      {/* Add / Edit Account Modal */}
      <AddAccountModal
        isOpen={addAccountModal}
        onClose={() => setAddAccountModal(false)}
        editingAccount={editingAccount}
        accName={accName}
        setAccName={setAccName}
        accType={accType}
        setAccType={setAccType}
        accIcon={accIcon}
        setAccIcon={setAccIcon}
        accInitialBalance={accInitialBalance}
        setAccInitialBalance={setAccInitialBalance}
        onSave={handleSaveAccount}
        isSavingAccount={isSavingAccount}
      />

      {/* Inter-Account Transfer Funds Modal */}
      <TransferFundsModal
        isOpen={transferModal}
        onClose={() => setTransferModal(false)}
        accounts={accounts}
        transferFrom={transferFrom}
        setTransferFrom={setTransferFrom}
        transferTo={transferTo}
        setTransferTo={setTransferTo}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
        transferDate={transferDate}
        setTransferDate={setTransferDate}
        transferNote={transferNote}
        setTransferNote={setTransferNote}
        onExecute={handleExecuteTransfer}
        isExecutingTransfer={isExecutingTransfer}
      />
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./index.css";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import SplashScreen from "./components/SplashScreen";
import AuthModal from "./components/AuthModal";
import AddTransactionModal from "./components/AddTransactionModal";
import MobileBottomNav from "./components/navigation/MobileBottomNav";
import VoiceAssistantModal from "./components/voice/VoiceAssistantModal";
import FloatingVoiceButton from "./components/voice/FloatingVoiceButton";
import { auth, missingFirebaseEnvVars } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addTransaction,
  addImportedTransaction,
  deleteTransaction,
  subscribeFinanceData,
  subscribeSettings,
  updateTransaction,
  migrateLocalStorageToFirestore,
} from "./services/firestore";
import { subscribeApiSlowStatus } from "./services/apiClient";
import { formatCurrency, DEFAULT_ACCOUNTS, setUserPreferences, DEFAULT_CURRENCY, DEFAULT_LOCALE } from "./config/constants";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";

const normalizeImportRow = (item) => {
  const rawAmount = item.Amount || item.amount || 0;
  const amountText = String(rawAmount).trim();
  const rawType = (
    item.type ||
    item.Type ||
    (amountText.startsWith("+") ? "Income" : "Expense")
  ).toLowerCase();
  const isIncome = rawType === "income";

  return {
    type: isIncome ? "Income" : "Expense",
    date: item.Date || item.date || new Date().toISOString().slice(0, 10),
    accountType: item.Account || item.accountType || "Cash",
    category:
      item.Category ||
      item.category ||
      item.Source ||
      item.source ||
      (isIncome ? "Salary" : "Others"),
    amount: Math.abs(Number(amountText.replace(/[+,]/g, "")) || 0),
    note: item.Note || item.note || "Imported transaction",
  };
};

function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const [showForm, setShowForm] = useState(false);
  const [isApp] = useState(() => {
    return Boolean(
      (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
        (typeof window !== "undefined" && window.navigator?.standalone)
    );
  });
  const [showSplash, setShowSplash] = useState(() => {
    return Boolean(
      (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
        (typeof window !== "undefined" && window.navigator?.standalone)
    );
  });
  const [globalAddModalOpen, setGlobalAddModalOpen] = useState(false);

  // Splash Screen Logic: ONLY display when opened as an installed PWA or native web app container.
  // Standard web browser sessions bypass the splash screen completely.
  useEffect(() => {
    if (!showSplash) return;
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, [showSplash]);
  const [globalVoiceModalOpen, setGlobalVoiceModalOpen] = useState(false);
  const [manualVoicePreset, setManualVoicePreset] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem("finsightTheme") || "dark"
  );
  const [transactions, setTransactions] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [apiSlowNotice, setApiSlowNotice] = useState(null);

  useEffect(() => {
    const unsubSlow = subscribeApiSlowStatus((isSlow, message) => {
      setApiSlowNotice(isSlow ? message : null);
    });

    const handleAuthExpired = (e) => {
      showToast(e.detail?.message || "Session expired. Please log in again.", "warning");
      setIsLoggedIn(false);
      setCurrentUser(null);
      setShowForm(true);
    };

    window.addEventListener("finsight:auth-expired", handleAuthExpired);

    return () => {
      unsubSlow();
      window.removeEventListener("finsight:auth-expired", handleAuthExpired);
    };
  }, [showToast]);

  const csvData = useMemo(() => {
    return transactions.map((item) => {
      const rawType = String(item.type || "Expense").toLowerCase();
      const isIncome = rawType === "income";
      const numAmount = Number(item.Amount || item.amount || 0);

      return {
        id: item.id || item.firestoreId,
        firestoreId: item.firestoreId || item.id,
        path: item.path || "",
        Date: item.date || item.Date,
        date: item.date || item.Date,
        Category: item.category || item.source || (isIncome ? "Salary" : "Others"),
        category: item.category || item.source || (isIncome ? "Salary" : "Others"),
        Amount: numAmount,
        amount: numAmount,
        Note: item.note || item.Note || "",
        note: item.note || item.Note || "",
        Account: item.accountType || item.Account || "Cash",
        accountType: item.accountType || item.Account || "Cash",
        type: isIncome ? "Income" : "Expense",
        userId: item.userId || null,
        createdAt: item.createdAt || null,
      };
    });
  }, [transactions]);

  const expenses = useMemo(() => {
    return csvData.filter((item) => (item.type || "").toLowerCase() === "expense");
  }, [csvData]);

  const incomes = useMemo(() => {
    return csvData.filter((item) => (item.type || "").toLowerCase() === "income");
  }, [csvData]);

  const totalExpense = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const totalIncome = useMemo(
    () => incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [incomes]
  );

  const totalBalance = totalIncome - totalExpense;

  // Strict user-scoped authentication & real-time Firestore sync
  useEffect(() => {
    let currentFirestoreUnsub = null;
    let currentSettingsUnsub = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthLoading(false);
      // 1. Immediately unsubscribe from previous user's Firestore listeners
      if (typeof currentFirestoreUnsub === "function") {
        currentFirestoreUnsub();
        currentFirestoreUnsub = null;
      }
      if (typeof currentSettingsUnsub === "function") {
        currentSettingsUnsub();
        currentSettingsUnsub = null;
      }

      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
        setLoadingData(true);

        // One-time localStorage migration to Firestore & default account seeding
        migrateLocalStorageToFirestore(user.uid, DEFAULT_ACCOUNTS);

        // Subscribe to user preferences (currency, locale) in real-time
        currentSettingsUnsub = subscribeSettings(user.uid, (pref) => {
          if (pref) {
            setUserPreferences(pref);
          }
        });

        // 2. Subscribe strictly to authenticated user's transactions
        currentFirestoreUnsub = subscribeFinanceData(
          user.uid,
          ({ transactions: liveTransactions }) => {
            setTransactions(liveTransactions || []);
            setLoadingData(false);
          },
          (error) => {
            console.error("Firestore Error:", error);
            setTransactions([]);
            setLoadingData(false);
          }
        );
      } else {
        // 3. When user logs out (!user), immediately clear all local states
        setIsLoggedIn(false);
        setCurrentUser(null);
        setTransactions([]);
        setUploadedFiles([]);
        setLoadingData(false);
        setUserPreferences({ currency: DEFAULT_CURRENCY, locale: DEFAULT_LOCALE });

        // 4. Purge local and session storage caches to eliminate cross-account residual leakage
        try {
          localStorage.removeItem("finsight_local_transactions");
          localStorage.removeItem("finsightImportedFiles");
          localStorage.removeItem("finsight_bills");
          localStorage.removeItem("finsight_goals");
          localStorage.removeItem("finsight_budgets");
          localStorage.removeItem("finsight_user_accounts");
          sessionStorage.removeItem("gmailAccessToken");
        } catch (storageErr) {
          console.warn("Storage cleanup on logout warning:", storageErr);
        }
      }
    });

    return () => {
      if (typeof currentFirestoreUnsub === "function") {
        currentFirestoreUnsub();
      }
      if (typeof currentSettingsUnsub === "function") {
        currentSettingsUnsub();
      }
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    const isLight = themeMode === "light";
    document.documentElement.classList.remove("theme-light", "theme-dark", "light", "dark");
    document.body.classList.remove("theme-light", "theme-dark", "light", "dark");

    document.documentElement.classList.add(isLight ? "theme-light" : "theme-dark", isLight ? "light" : "dark");
    document.body.classList.add(isLight ? "theme-light" : "theme-dark", isLight ? "light" : "dark");
    document.documentElement.style.colorScheme = isLight ? "light" : "dark";

    localStorage.setItem("finsightTheme", themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const rememberImportedFile = (file) => {
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type || "Unknown",
      importedAt: new Date().toLocaleString(),
    };

    setUploadedFiles((prev) => {
      const exists = prev.some(
        (item) => item.name === fileInfo.name && item.size === fileInfo.size
      );
      return exists ? prev : [fileInfo, ...prev];
    });
  };

  const saveImportedRows = async (rows) => {
    const normalizedRows = rows.map(normalizeImportRow).filter((row) => row.amount > 0);

    if (normalizedRows.length === 0) {
      showToast("No valid records found in file.", "error");
      return;
    }

    const uid = currentUser?.uid || auth.currentUser?.uid || null;
    if (!uid) {
      showToast("Please log in to import transactions.", "error");
      return;
    }

    try {
      await Promise.all(normalizedRows.map((row) => addImportedTransaction(row, uid)));
      showToast(`${normalizedRows.length} records saved to Firestore!`, "success");
    } catch (err) {
      console.error("Firestore import error:", err);
      showToast(`Import failed: ${err.message || String(err)}`, "error");
    }
  };

  const importCSV = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      rememberImportedFile(file);
      const extension = file.name.split(".").pop().toLowerCase();

      if (extension === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => saveImportedRows(results.data || []),
          error: () => showToast("CSV parse failed.", "error"),
        });
        return;
      }

      if (extension === "xlsx" || extension === "xls") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          await saveImportedRows(jsonData);
        };
        reader.readAsBinaryString(file);
        return;
      }

      showToast("Supported formats: CSV, Excel", "warning");
    } catch (error) {
      console.error("Import error:", error);
      showToast("Import failed: " + error.message, "error");
    } finally {
      event.target.value = "";
    }
  };

  const handleSaveTransaction = async (transaction, editingTransaction = null) => {
    const uid = currentUser?.uid || auth.currentUser?.uid || null;
    if (!uid) {
      showToast("Please log in to save transactions.", "error");
      return false;
    }

    const isIncome = String(transaction.type || "").toLowerCase() === "income";
    const type = isIncome ? "Income" : "Expense";
    const amount = Number(transaction.amount);

    const payload = {
      userId: uid,
      type,
      amount,
      date: transaction.date || new Date().toISOString().slice(0, 10),
      accountType: transaction.accountType || "Cash",
      category: transaction.category || (isIncome ? "Salary" : "Others"),
      source: isIncome ? transaction.category : "",
      note: transaction.note || "",
      updatedAt: new Date().toISOString(),
    };

    if (editingTransaction) {
      try {
        const res = await updateTransaction(
          { ...editingTransaction, ...payload },
          uid
        );
        if (res.success) {
          showToast("Transaction updated successfully!", "success");
          return true;
        } else {
          showToast(`Failed to update transaction: ${res.error}`, "error");
          return false;
        }
      } catch (err) {
        showToast(`Failed to update transaction: ${err.message || String(err)}`, "error");
        return false;
      }
    } else {
      try {
        const res = await addTransaction(payload, uid);
        if (res.success) {
          showToast("Transaction saved successfully!", "success");
          return true;
        } else {
          showToast(`Failed to save transaction: ${res.error}`, "error");
          return false;
        }
      } catch (err) {
        showToast(`Failed to save transaction: ${err.message || String(err)}`, "error");
        return false;
      }
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    const title =
      transaction.Category || transaction.category || "this transaction";
    const amt = transaction.Amount || transaction.amount;
    const confirmDelete = window.confirm(`Delete "${title}" for ${formatCurrency(amt)}?`);
    if (!confirmDelete) return false;

    const uid = currentUser?.uid || auth.currentUser?.uid || null;
    if (!uid) {
      showToast("Please log in to delete transactions.", "error");
      return false;
    }

    try {
      const res = await deleteTransaction(transaction, uid);
      if (res.success) {
        showToast("Transaction deleted.", "info");
        return true;
      } else {
        showToast(`Failed to delete transaction: ${res.error}`, "error");
        return false;
      }
    } catch (err) {
      showToast(`Failed to delete transaction: ${err.message || String(err)}`, "error");
      return false;
    }
  };

  if (missingFirebaseEnvVars && missingFirebaseEnvVars.length > 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6 text-white font-sans">
        <div className="max-w-md w-full rounded-2xl border border-red-500/40 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-3xl">
            <FaExclamationTriangle className="inline-block" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Configuration Required</h1>
          <p className="text-sm text-slate-400 mb-6">
            FinSight AI cannot start because essential Firebase environment variables are missing.
          </p>
          <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 text-left mb-6 font-mono text-xs text-red-400 space-y-1">
            {missingFirebaseEnvVars.map((v) => (
              <div key={v}>• {v}</div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Please configure these variables in your deployment settings (e.g. Vercel dashboard) and redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col min-h-screen font-sans selection:bg-emerald-500/30 transition-colors duration-200 ${
        themeMode === "light"
          ? "bg-[#f8fafc] text-zinc-900"
          : "bg-[#000000] text-white"
      }`}
    >
      {/* Cold boot / Slow API Notification Banner */}
      {apiSlowNotice && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md animate-pulse">
          <FaExclamationTriangle className="text-amber-400 shrink-0" />
          <span>{apiSlowNotice}</span>
        </div>
      )}

      {/* Animated Splash Screen - rendered ONLY when opened as an installed PWA / standalone container */}
      {isApp && <SplashScreen isLoading={showSplash} isApp={isApp} />}

      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: "none" }}
        id="fileUpload"
        onChange={importCSV}
      />

      {/* Modern Toast Notification System */}
      <div className="fs-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`fs-toast-item fs-toast-${toast.type}`}>
            <div className="fs-toast-icon">
              {toast.type === "success" && <FaCheckCircle />}
              {toast.type === "error" && <FaExclamationCircle />}
              {toast.type === "warning" && <FaExclamationTriangle />}
              {toast.type === "info" && <FaInfoCircle />}
            </div>
            <div className="fs-toast-msg">{toast.message}</div>
            <button
              className="fs-toast-close"
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      {/* Sticky Top Navbar for Desktop & Brand Header */}
      {!isLanding && (
        <Navbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          setShowForm={setShowForm}
          showToast={showToast}
          themeMode={themeMode}
          toggleThemeMode={toggleThemeMode}
          openUpload={() => document.getElementById("fileUpload")?.click()}
          onOpenVoiceAssistant={() => setGlobalVoiceModalOpen(true)}
        />
      )}

      {/* Main Content Container */}
      {isLanding ? (
        <main className="flex-1 w-full">
          <AppRoutes
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            csvData={csvData}
            loadingData={loadingData}
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            currentUser={currentUser}
            setShowForm={setShowForm}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            showToast={showToast}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
          />
        </main>
      ) : (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <AppRoutes
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            csvData={csvData}
            loadingData={loadingData}
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            currentUser={currentUser}
            setShowForm={setShowForm}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            showToast={showToast}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
          />
        </main>
      )}

      {/* Floating Voice Assistant Pulsing Trigger */}
      {!isLanding && (
        <FloatingVoiceButton onClick={() => setGlobalVoiceModalOpen(true)} />
      )}

      {/* Mobile PWA Floating Bottom Navigation Bar */}
      {!isLanding && (
        <MobileBottomNav
          onOpenAddModal={() => {
            setManualVoicePreset(null);
            setGlobalAddModalOpen(true);
          }}
        />
      )}

      {/* Voice-to-Expense AI Logging Assistant Modal */}
      <VoiceAssistantModal
        isOpen={globalVoiceModalOpen}
        onClose={() => setGlobalVoiceModalOpen(false)}
        onSaveTransaction={handleSaveTransaction}
        onOpenManualEdit={(preset) => {
          setManualVoicePreset(preset);
          setGlobalAddModalOpen(true);
        }}
        showToast={showToast}
      />

      {/* Global Add Transaction Modal for Mobile Quick Add & Manual Overrides */}
      <AddTransactionModal
        isOpen={globalAddModalOpen}
        onClose={() => {
          setGlobalAddModalOpen(false);
          setManualVoicePreset(null);
        }}
        initialPreset={manualVoicePreset}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* Auth Modal */}
      <AuthModal
        showForm={showForm}
        setShowForm={setShowForm}
        setIsLoggedIn={setIsLoggedIn}
      />
    </div>
  );
}

export default App;

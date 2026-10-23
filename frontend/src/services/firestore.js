import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../firebase.js";

const toNumber = (value) => Number(String(value || 0).replace(/[,+]/g, "")) || 0;

/**
 * Dynamically resolves the current authenticated user's UID.
 * Falls back to explicitly passed UID if provided.
 */
export const getActiveUid = (providedUid = null) => {
  if (typeof providedUid === "string" && providedUid.trim()) {
    return providedUid.trim();
  }
  return auth.currentUser?.uid || null;
};

/**
 * Collection reference for user-scoped expenses: users/{uid}/expenses
 */
export const getExpensesCollection = (providedUid = null) => {
  const uid = getActiveUid(providedUid);
  if (!uid) return null;
  return collection(db, "users", uid, "expenses");
};

/**
 * Collection reference for user-scoped income: users/{uid}/income
 */
export const getIncomeCollection = (providedUid = null) => {
  const uid = getActiveUid(providedUid);
  if (!uid) return null;
  return collection(db, "users", uid, "income");
};

/**
 * Normalize a transaction document from Firestore
 */
export const normalizeTransaction = (snapshotDoc, fallbackType = "Expense") => {
  if (!snapshotDoc) return null;
  const data =
    typeof snapshotDoc.data === "function"
      ? snapshotDoc.data()
      : snapshotDoc.data || snapshotDoc || {};
  const docId = snapshotDoc.id || data.id || data.firestoreId || "";
  const rawType = String(data.type || fallbackType || "Expense").toLowerCase();
  const isIncome = rawType === "income";
  const type = isIncome ? "Income" : "Expense";
  const category =
    data.category || data.source || (isIncome ? "Salary" : "Others");

  return {
    id: docId,
    firestoreId: docId,
    path:
      snapshotDoc.ref?.path ||
      data.path ||
      `users/${data.userId || ""}/${isIncome ? "income" : "expenses"}/${docId}`,
    type,
    amount: toNumber(data.amount),
    accountType: data.accountType || "Cash",
    category,
    source: category,
    note: data.note || data.narration || data.description || "",
    date:
      data.date ||
      (data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)),
    userId: data.userId || null,
    collection: isIncome ? "income" : "expenses",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

export const normalizeExpense = (docSnap) => normalizeTransaction(docSnap, "Expense");
export const normalizeIncome = (docSnap) => normalizeTransaction(docSnap, "Income");

// ==========================================
// EXPENSES CRUD & REAL-TIME LISTENERS
// Scoped under users/{uid}/expenses
// ==========================================

/**
 * Add an expense document strictly scoped under users/{uid}/expenses
 */
export const addExpense = async (expenseData = {}, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID found for addExpense.");
    return {
      success: false,
      unauthenticated: true,
      error: "User is not authenticated with Firebase.",
    };
  }

  const category = expenseData.category || expenseData.source || "Others";
  const amount = toNumber(expenseData.amount);

  const payload = {
    userId: uid,
    type: "Expense",
    amount,
    date: expenseData.date || new Date().toISOString().slice(0, 10),
    accountType: expenseData.accountType || "Cash",
    category,
    source: category,
    note: expenseData.note || expenseData.narration || expenseData.description || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const expensesCol = collection(db, "users", uid, "expenses");
    const docRef = await addDoc(expensesCol, payload);
    return {
      success: true,
      id: docRef.id,
      payload: { ...payload, id: docRef.id, firestoreId: docRef.id, collection: "expenses" },
    };
  } catch (error) {
    console.error("Firestore addExpense Error:", error);
    return { success: false, error: error.message || String(error) };
  }
};

/**
 * Fetch all expenses for the authenticated user from users/{uid}/expenses
 */
export const getExpenses = async (explicitUid = null) => {
  const uid = getActiveUid(explicitUid);

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID found for getExpenses.");
    return [];
  }

  try {
    const expensesCol = collection(db, "users", uid, "expenses");
    const snapshot = await getDocs(expensesCol);
    const expenses = snapshot.docs.map(normalizeExpense);
    return expenses.sort((a, b) => {
      const left = new Date(a.date || a.createdAt).getTime() || 0;
      const right = new Date(b.date || b.createdAt).getTime() || 0;
      return right - left;
    });
  } catch (error) {
    console.error("Firestore getExpenses Error:", error);
    return [];
  }
};

/**
 * Real-time listener for user expenses under users/{uid}/expenses
 */
export const subscribeToExpenses = (param1, param2, param3) => {
  let uid = null;
  let onData = null;
  let onError = null;

  if (typeof param1 === "function") {
    onData = param1;
    onError = param2;
    uid = auth.currentUser?.uid || null;
  } else {
    uid = (typeof param1 === "string" ? param1 : null) || auth.currentUser?.uid || null;
    onData = param2;
    onError = param3;
  }

  if (!uid) {
    if (typeof onData === "function") onData([]);
    return () => {};
  }

  try {
    const expensesCol = collection(db, "users", uid, "expenses");
    const unsubscribe = onSnapshot(
      expensesCol,
      (snapshot) => {
        const liveExpenses = snapshot.docs.map(normalizeExpense);
        const sorted = liveExpenses.sort((a, b) => {
          const left = new Date(a.date || a.createdAt).getTime() || 0;
          const right = new Date(b.date || b.createdAt).getTime() || 0;
          return right - left;
        });
        if (typeof onData === "function") onData(sorted);
      },
      (err) => {
        console.error("Firestore subscribeToExpenses Error:", err);
        if (typeof onData === "function") onData([]);
        if (typeof onError === "function") onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("Firestore subscribeToExpenses Error:", err);
    if (typeof onData === "function") onData([]);
    if (typeof onError === "function") onError(err);
    return () => {};
  }
};

/**
 * Update an expense document in users/{uid}/expenses/{targetId}
 */
export const updateExpense = async (expenseOrId, dataOrUid = null, explicitUid = null) => {
  let targetId = null;
  let updateData = {};
  let uid = null;

  if (typeof expenseOrId === "object" && expenseOrId !== null) {
    targetId = expenseOrId.firestoreId || expenseOrId.id;
    updateData = { ...expenseOrId };
    uid = getActiveUid(dataOrUid);
  } else if (typeof expenseOrId === "string") {
    targetId = expenseOrId;
    updateData = typeof dataOrUid === "object" && dataOrUid !== null ? { ...dataOrUid } : {};
    uid = getActiveUid(explicitUid);
  }

  if (!targetId) {
    const err = new Error("Missing expense ID for update.");
    console.error("Firestore Error:", err);
    return { success: false, error: err.message };
  }

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID for updateExpense.");
    return { success: false, unauthenticated: true, error: "User is not authenticated." };
  }

  const category = updateData.category || updateData.source || "Others";
  const amount = toNumber(updateData.amount);

  const payload = {
    userId: uid,
    type: "Expense",
    amount,
    date: updateData.date || new Date().toISOString().slice(0, 10),
    accountType: updateData.accountType || "Cash",
    category,
    source: category,
    note: updateData.note || updateData.narration || updateData.description || "",
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = doc(db, "users", uid, "expenses", targetId);
    await updateDoc(docRef, payload);
    return { success: true };
  } catch (error) {
    console.error("Firestore updateExpense Error:", error);
    return { success: false, error: error.message || String(error) };
  }
};

/**
 * Delete an expense document from users/{uid}/expenses/{targetId}
 */
export const deleteExpense = async (expenseOrId, explicitUid = null) => {
  let targetId = null;
  let uid = null;

  if (typeof expenseOrId === "object" && expenseOrId !== null) {
    targetId = expenseOrId.firestoreId || expenseOrId.id;
    uid = getActiveUid(explicitUid || expenseOrId.userId);
  } else if (typeof expenseOrId === "string") {
    targetId = expenseOrId;
    uid = getActiveUid(explicitUid);
  }

  if (!targetId) {
    const err = new Error("Missing expense ID for delete.");
    console.error("Firestore Error:", err);
    return { success: false, error: err.message };
  }

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID for deleteExpense.");
    return { success: false, unauthenticated: true, error: "User is not authenticated." };
  }

  try {
    const docRef = doc(db, "users", uid, "expenses", targetId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Firestore deleteExpense Error:", error);
    return { success: false, error: error.message || String(error) };
  }
};

// ==========================================
// INCOME CRUD & REAL-TIME LISTENERS
// Scoped under users/{uid}/income
// ==========================================

/**
 * Add an income document strictly scoped under users/{uid}/income
 */
export const addIncome = async (incomeData = {}, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID found for addIncome.");
    return {
      success: false,
      unauthenticated: true,
      error: "User is not authenticated with Firebase.",
    };
  }

  const category = incomeData.category || incomeData.source || "Salary";
  const amount = toNumber(incomeData.amount);

  const payload = {
    userId: uid,
    type: "Income",
    amount,
    date: incomeData.date || new Date().toISOString().slice(0, 10),
    accountType: incomeData.accountType || "Cash",
    category,
    source: category,
    note: incomeData.note || incomeData.narration || incomeData.description || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const incomeCol = collection(db, "users", uid, "income");
    const docRef = await addDoc(incomeCol, payload);
    return {
      success: true,
      id: docRef.id,
      payload: { ...payload, id: docRef.id, firestoreId: docRef.id, collection: "income" },
    };
  } catch (error) {
    console.error("Firestore addIncome Error:", error);
    return { success: false, error: error.message || String(error) };
  }
};

/**
 * Fetch all income documents for the authenticated user from users/{uid}/income
 */
export const getIncome = async (explicitUid = null) => {
  const uid = getActiveUid(explicitUid);

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID found for getIncome.");
    return [];
  }

  try {
    const incomeCol = collection(db, "users", uid, "income");
    const snapshot = await getDocs(incomeCol);
    const incomes = snapshot.docs.map(normalizeIncome);
    return incomes.sort((a, b) => {
      const left = new Date(a.date || a.createdAt).getTime() || 0;
      const right = new Date(b.date || b.createdAt).getTime() || 0;
      return right - left;
    });
  } catch (error) {
    console.error("Firestore getIncome Error:", error);
    return [];
  }
};

export const getIncomes = getIncome;

/**
 * Real-time listener for user income under users/{uid}/income
 */
export const subscribeToIncome = (param1, param2, param3) => {
  let uid = null;
  let onData = null;
  let onError = null;

  if (typeof param1 === "function") {
    onData = param1;
    onError = param2;
    uid = auth.currentUser?.uid || null;
  } else {
    uid = (typeof param1 === "string" ? param1 : null) || auth.currentUser?.uid || null;
    onData = param2;
    onError = param3;
  }

  if (!uid) {
    if (typeof onData === "function") onData([]);
    return () => {};
  }

  try {
    const incomeCol = collection(db, "users", uid, "income");
    const unsubscribe = onSnapshot(
      incomeCol,
      (snapshot) => {
        const liveIncomes = snapshot.docs.map(normalizeIncome);
        const sorted = liveIncomes.sort((a, b) => {
          const left = new Date(a.date || a.createdAt).getTime() || 0;
          const right = new Date(b.date || b.createdAt).getTime() || 0;
          return right - left;
        });
        if (typeof onData === "function") onData(sorted);
      },
      (err) => {
        console.error("Firestore subscribeToIncome Error:", err);
        if (typeof onData === "function") onData([]);
        if (typeof onError === "function") onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("Firestore subscribeToIncome Error:", err);
    if (typeof onData === "function") onData([]);
    if (typeof onError === "function") onError(err);
    return () => {};
  }
};

export const subscribeToIncomes = subscribeToIncome;

/**
 * Update an income document in users/{uid}/income/{targetId}
 */
export const updateIncome = async (incomeOrId, dataOrUid = null, explicitUid = null) => {
  let targetId = null;
  let updateData = {};
  let uid = null;

  if (typeof incomeOrId === "object" && incomeOrId !== null) {
    targetId = incomeOrId.firestoreId || incomeOrId.id;
    updateData = { ...incomeOrId };
    uid = getActiveUid(dataOrUid);
  } else if (typeof incomeOrId === "string") {
    targetId = incomeOrId;
    updateData = typeof dataOrUid === "object" && dataOrUid !== null ? { ...dataOrUid } : {};
    uid = getActiveUid(explicitUid);
  }

  if (!targetId) {
    const err = new Error("Missing income ID for update.");
    console.error("Firestore Error:", err);
    return { success: false, error: err.message };
  }

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID for updateIncome.");
    return { success: false, unauthenticated: true, error: "User is not authenticated." };
  }

  const category = updateData.category || updateData.source || "Salary";
  const amount = toNumber(updateData.amount);

  const payload = {
    userId: uid,
    type: "Income",
    amount,
    date: updateData.date || new Date().toISOString().slice(0, 10),
    accountType: updateData.accountType || "Cash",
    category,
    source: category,
    note: updateData.note || updateData.narration || updateData.description || "",
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = doc(db, "users", uid, "income", targetId);
    await updateDoc(docRef, payload);
    return { success: true };
  } catch (error) {
    console.error("Firestore updateIncome Error:", error);
    return { success: false, error: error.message || String(error) };
  }
};

/**
 * Delete an income document from users/{uid}/income/{targetId}
 */
export const deleteIncome = async (incomeOrId, explicitUid = null) => {
  let targetId = null;
  let uid = null;

  if (typeof incomeOrId === "object" && incomeOrId !== null) {
    targetId = incomeOrId.firestoreId || incomeOrId.id;
    uid = getActiveUid(explicitUid || incomeOrId.userId);
  } else if (typeof incomeOrId === "string") {
    targetId = incomeOrId;
    uid = getActiveUid(explicitUid);
  }

  if (!targetId) {
    const err = new Error("Missing income ID for delete.");
    console.error("Firestore Error:", err);
    return { success: false, error: err.message };
  }

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID for deleteIncome.");
    return { success: false, unauthenticated: true, error: "User is not authenticated." };
  }

  try {
    const docRef = doc(db, "users", uid, "income", targetId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Firestore deleteIncome Error:", error);
    return { success: false, error: error.message || String(error) };
  }
};

// ==========================================
// UNIFIED TRANSACTIONS & HELPERS
// Automatically manages expenses and income
// ==========================================

/**
 * Add transaction automatically routing to users/{uid}/income or users/{uid}/expenses
 */
export const addTransaction = async (transaction = {}, explicitUid = null) => {
  const isIncome = String(transaction.type || "").toLowerCase() === "income";
  if (isIncome) {
    return addIncome(transaction, explicitUid);
  }
  return addExpense(transaction, explicitUid);
};

export const addImportedTransaction = async (transaction = {}, explicitUid = null) => {
  return addTransaction(transaction, explicitUid);
};

/**
 * Update an existing transaction in its respective collection
 */
export const updateTransaction = async (transaction, explicitUid = null) => {
  const isIncome =
    String(transaction?.type || transaction?.collection || "").toLowerCase() === "income";

  if (isIncome) {
    const res = await updateIncome(transaction, explicitUid);
    if (!res.success) {
      // Fallback try in expenses in case it previously resided there
      return updateExpense(transaction, explicitUid);
    }
    return res;
  } else {
    const res = await updateExpense(transaction, explicitUid);
    if (!res.success) {
      // Fallback try in income
      return updateIncome(transaction, explicitUid);
    }
    return res;
  }
};

/**
 * Delete an existing transaction from its respective collection
 */
export const deleteTransaction = async (transaction, explicitUid = null) => {
  const isIncome =
    String(transaction?.type || transaction?.collection || "").toLowerCase() === "income";

  if (isIncome) {
    const res = await deleteIncome(transaction, explicitUid);
    if (!res.success) {
      return deleteExpense(transaction, explicitUid);
    }
    return res;
  } else {
    const res = await deleteExpense(transaction, explicitUid);
    if (!res.success) {
      return deleteIncome(transaction, explicitUid);
    }
    return res;
  }
};

/**
 * Batch write multiple transactions to users/{uid}/expenses and users/{uid}/income in chunks of <= 450
 */
export const batchAddTransactions = async (transactionsList = [], explicitUid = null) => {
  const uid = getActiveUid(explicitUid);

  if (!uid) {
    console.warn("Firestore Warning: No authenticated user UID found for batch write.");
    return {
      success: false,
      unauthenticated: true,
      error: "User is not authenticated with Firebase.",
    };
  }

  if (!transactionsList || transactionsList.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const CHUNK_SIZE = 450;
    let savedCount = 0;

    for (let i = 0; i < transactionsList.length; i += CHUNK_SIZE) {
      const chunk = transactionsList.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      const expensesCol = collection(db, "users", uid, "expenses");
      const incomeCol = collection(db, "users", uid, "income");

      for (const t of chunk) {
        const isIncome = String(t.type || "").toLowerCase() === "income";
        const type = isIncome ? "Income" : "Expense";
        const category = t.category || t.source || (isIncome ? "Salary" : "Others");
        const amount = toNumber(t.amount);

        const payload = {
          userId: uid,
          type,
          amount,
          date: t.date || new Date().toISOString().slice(0, 10),
          accountType: t.accountType || "Online",
          category,
          source: category,
          note: t.note || t.narration || t.description || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const targetCol = isIncome ? incomeCol : expensesCol;
        const docRef = doc(targetCol);
        batch.set(docRef, payload);
      }

      await batch.commit();
      savedCount += chunk.length;
    }

    return { success: true, count: savedCount };
  } catch (error) {
    console.error("Firestore batchAddTransactions Error:", error);
    return { success: false, error: error.message || String(error) };
  }
};

/**
 * Dual real-time listener aggregating expenses and income for the authenticated user
 */
export const subscribeFinanceData = (param1, param2, param3) => {
  let uid = null;
  let onData = null;
  let onError = null;

  if (typeof param1 === "function") {
    onData = param1;
    onError = param2;
    uid = auth.currentUser?.uid || null;
  } else {
    uid = (typeof param1 === "string" ? param1 : null) || auth.currentUser?.uid || null;
    onData = param2;
    onError = param3;
  }

  if (!uid) {
    if (typeof onData === "function") {
      onData({ expenses: [], incomes: [], transactions: [] });
    }
    return () => {};
  }

  try {
    let latestExpenses = [];
    let latestIncomes = [];

    const emitMerged = () => {
      const merged = [...latestExpenses, ...latestIncomes].sort((a, b) => {
        const left = new Date(a.date || a.createdAt).getTime() || 0;
        const right = new Date(b.date || b.createdAt).getTime() || 0;
        return right - left;
      });

      if (typeof onData === "function") {
        onData({
          expenses: latestExpenses,
          incomes: latestIncomes,
          transactions: merged,
        });
      }
    };

    const unsubExpenses = subscribeToExpenses(
      uid,
      (expenses) => {
        latestExpenses = expenses || [];
        emitMerged();
      },
      (err) => {
        console.error("Firestore subscribeFinanceData (expenses) Error:", err);
        if (typeof onError === "function") onError(err);
      }
    );

    const unsubIncome = subscribeToIncome(
      uid,
      (incomes) => {
        latestIncomes = incomes || [];
        emitMerged();
      },
      (err) => {
        console.error("Firestore subscribeFinanceData (income) Error:", err);
        if (typeof onError === "function") onError(err);
      }
    );

    return () => {
      if (typeof unsubExpenses === "function") unsubExpenses();
      if (typeof unsubIncome === "function") unsubIncome();
    };
  } catch (err) {
    console.error("Firestore subscribeFinanceData Error:", err);
    if (typeof onData === "function") {
      onData({ expenses: [], incomes: [], transactions: [] });
    }
    if (typeof onError === "function") {
      onError(err);
    }
    return () => {};
  }
};

// ==========================================
// ACCOUNTS CRUD & REAL-TIME SUBSCRIPTION
// Scoped under users/{uid}/accounts
// ==========================================

export const subscribeAccounts = (uid, onData, onError) => {
  const activeUid = getActiveUid(uid);
  if (!activeUid) {
    if (typeof onData === "function") onData([]);
    return () => {};
  }

  const colRef = collection(db, "users", activeUid, "accounts");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        firestoreId: d.id,
      }));
      if (typeof onData === "function") onData(items);
    },
    (err) => {
      console.error("Firestore subscribeAccounts Error:", err);
      if (typeof onError === "function") onError(err);
    }
  );
};

export const saveAccount = async (accountData = {}, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid) return { success: false, error: "Authentication required" };

  try {
    const accountId = String(accountData.firestoreId || accountData.id || "").trim();
    const payload = {
      name: accountData.name || "Main Account",
      type: accountData.type || "Bank",
      iconType: accountData.iconType || "card",
      initialBalance: Number(accountData.initialBalance) || 0,
      color: accountData.color || "emerald",
      updatedAt: serverTimestamp(),
    };

    if (accountId) {
      const docRef = doc(db, "users", uid, "accounts", accountId);
      await setDoc(docRef, { ...payload, id: accountId, firestoreId: accountId }, { merge: true });
      return { success: true, id: accountId };
    } else {
      const colRef = collection(db, "users", uid, "accounts");
      const docRef = await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
      return { success: true, id: docRef.id };
    }
  } catch (err) {
    console.error("Firestore saveAccount Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

export const deleteAccount = async (accountId, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid || !accountId) return { success: false, error: "Missing parameters" };

  try {
    const docRef = doc(db, "users", uid, "accounts", String(accountId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error("Firestore deleteAccount Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

// ==========================================
// BUDGETS CRUD & REAL-TIME SUBSCRIPTION
// Scoped under users/{uid}/budgets
// ==========================================

export const subscribeBudgets = (uid, onData, onError) => {
  const activeUid = getActiveUid(uid);
  if (!activeUid) {
    if (typeof onData === "function") onData([]);
    return () => {};
  }

  const colRef = collection(db, "users", activeUid, "budgets");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        firestoreId: d.id,
      }));
      if (typeof onData === "function") onData(items);
    },
    (err) => {
      console.error("Firestore subscribeBudgets Error:", err);
      if (typeof onError === "function") onError(err);
    }
  );
};

export const saveBudget = async (budgetData = {}, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid) return { success: false, error: "Authentication required" };

  try {
    const budgetId = String(
      budgetData.firestoreId ||
      budgetData.id ||
      (budgetData.category ? budgetData.category.toLowerCase().replace(/[^a-z0-9]/g, "_") : "")
    ).trim();

    const payload = {
      category: budgetData.category || "General",
      limit: Number(budgetData.limit) || 0,
      period: budgetData.period || "monthly",
      updatedAt: serverTimestamp(),
    };

    if (budgetId) {
      const docRef = doc(db, "users", uid, "budgets", budgetId);
      await setDoc(docRef, { ...payload, id: budgetId, firestoreId: budgetId }, { merge: true });
      return { success: true, id: budgetId };
    } else {
      const colRef = collection(db, "users", uid, "budgets");
      const docRef = await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
      return { success: true, id: docRef.id };
    }
  } catch (err) {
    console.error("Firestore saveBudget Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

export const deleteBudget = async (budgetId, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid || !budgetId) return { success: false, error: "Missing parameters" };

  try {
    const docRef = doc(db, "users", uid, "budgets", String(budgetId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error("Firestore deleteBudget Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

// ==========================================
// GOALS CRUD & REAL-TIME SUBSCRIPTION
// Scoped under users/{uid}/goals
// ==========================================

export const subscribeGoals = (uid, onData, onError) => {
  const activeUid = getActiveUid(uid);
  if (!activeUid) {
    if (typeof onData === "function") onData([]);
    return () => {};
  }

  const colRef = collection(db, "users", activeUid, "goals");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        firestoreId: d.id,
      }));
      if (typeof onData === "function") onData(items);
    },
    (err) => {
      console.error("Firestore subscribeGoals Error:", err);
      if (typeof onError === "function") onError(err);
    }
  );
};

export const saveGoal = async (goalData = {}, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid) return { success: false, error: "Authentication required" };

  try {
    const goalId = String(goalData.firestoreId || goalData.id || "").trim();
    const payload = {
      name: goalData.name || "Goal",
      targetAmount: Number(goalData.targetAmount ?? goalData.target) || 0,
      currentAmount: Number(goalData.currentAmount ?? goalData.current) || 0,
      deadline: goalData.deadline || "2026-12-31",
      color: goalData.color || "#10b981",
      updatedAt: serverTimestamp(),
    };

    if (goalId) {
      const docRef = doc(db, "users", uid, "goals", goalId);
      await setDoc(docRef, { ...payload, id: goalId, firestoreId: goalId }, { merge: true });
      return { success: true, id: goalId };
    } else {
      const colRef = collection(db, "users", uid, "goals");
      const docRef = await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
      return { success: true, id: docRef.id };
    }
  } catch (err) {
    console.error("Firestore saveGoal Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

export const deleteGoal = async (goalId, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid || !goalId) return { success: false, error: "Missing parameters" };

  try {
    const docRef = doc(db, "users", uid, "goals", String(goalId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error("Firestore deleteGoal Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

// ==========================================
// BILLS CRUD & REAL-TIME SUBSCRIPTION
// Scoped under users/{uid}/bills
// ==========================================

export const subscribeBills = (uid, onData, onError) => {
  const activeUid = getActiveUid(uid);
  if (!activeUid) {
    if (typeof onData === "function") onData([]);
    return () => {};
  }

  const colRef = collection(db, "users", activeUid, "bills");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        firestoreId: d.id,
      }));
      if (typeof onData === "function") onData(items);
    },
    (err) => {
      console.error("Firestore subscribeBills Error:", err);
      if (typeof onError === "function") onError(err);
    }
  );
};

export const saveBill = async (billData = {}, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid) return { success: false, error: "Authentication required" };

  try {
    const billId = String(billData.firestoreId || billData.id || "").trim();
    const payload = {
      name: billData.name || "Bill",
      amount: Number(billData.amount) || 0,
      dueDate: billData.dueDate || "Due soon",
      paid: Boolean(billData.paid),
      updatedAt: serverTimestamp(),
    };

    if (billId) {
      const docRef = doc(db, "users", uid, "bills", billId);
      await setDoc(docRef, { ...payload, id: billId, firestoreId: billId }, { merge: true });
      return { success: true, id: billId };
    } else {
      const colRef = collection(db, "users", uid, "bills");
      const docRef = await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
      return { success: true, id: docRef.id };
    }
  } catch (err) {
    console.error("Firestore saveBill Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

export const deleteBill = async (billId, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid || !billId) return { success: false, error: "Missing parameters" };

  try {
    const docRef = doc(db, "users", uid, "bills", String(billId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error("Firestore deleteBill Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

// ==========================================
// SETTINGS / PREFERENCES
// Scoped under users/{uid}/settings/preferences
// ==========================================

export const subscribeSettings = (uid, onData, onError) => {
  const activeUid = getActiveUid(uid);
  if (!activeUid) {
    if (typeof onData === "function") onData(null);
    return () => {};
  }

  const docRef = doc(db, "users", activeUid, "settings", "preferences");
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        if (typeof onData === "function") onData(snapshot.data());
      } else {
        if (typeof onData === "function") onData(null);
      }
    },
    (err) => {
      console.error("Firestore subscribeSettings Error:", err);
      if (typeof onError === "function") onError(err);
    }
  );
};

export const saveSettings = async (settingsData = {}, explicitUid = null) => {
  const uid = getActiveUid(explicitUid);
  if (!uid) return { success: false, error: "Authentication required" };

  try {
    const docRef = doc(db, "users", uid, "settings", "preferences");
    await setDoc(
      docRef,
      {
        ...settingsData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err) {
    console.error("Firestore saveSettings Error:", err);
    return { success: false, error: err.message || String(err) };
  }
};

// ==========================================
// ONE-TIME LOCALSTORAGE MIGRATION & SEEDING
// ==========================================

export const migrateLocalStorageToFirestore = async (uid, defaultAccounts = []) => {
  if (!uid) return;

  try {
    // 1. Accounts Migration & Seeding
    const accountsCol = collection(db, "users", uid, "accounts");
    const accountsSnap = await getDocs(accountsCol);

    if (accountsSnap.empty) {
      const localAccKey = `finsight_user_accounts_${uid}`;
      const savedAccStr = localStorage.getItem(localAccKey);
      let accToSeed = defaultAccounts;

      if (savedAccStr) {
        try {
          const parsed = JSON.parse(savedAccStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            accToSeed = parsed;
          }
        } catch {
          // ignore parsing error
        }
      }

      if (Array.isArray(accToSeed) && accToSeed.length > 0) {
        const batch = writeBatch(db);
        accToSeed.forEach((acc, idx) => {
          const accId = String(acc.id || `acc_${Date.now()}_${idx}`);
          const ref = doc(db, "users", uid, "accounts", accId);
          batch.set(ref, {
            id: accId,
            name: acc.name || `Account ${idx + 1}`,
            type: acc.type || "Bank",
            iconType: acc.iconType || "card",
            initialBalance: Number(acc.initialBalance) || 0,
            color: acc.color || "emerald",
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
      localStorage.removeItem(localAccKey);
    }

    // 2. Budgets Migration
    const budgetsCol = collection(db, "users", uid, "budgets");
    const budgetsSnap = await getDocs(budgetsCol);
    if (budgetsSnap.empty) {
      const localBudgetsKey = `finsight_budgets_${uid}`;
      const savedBudgets = localStorage.getItem(localBudgetsKey);
      if (savedBudgets) {
        try {
          const parsed = JSON.parse(savedBudgets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const batch = writeBatch(db);
            parsed.forEach((b) => {
              const bId = String(b.id || (b.category ? b.category.toLowerCase().replace(/[^a-z0-9]/g, "_") : `budget_${Date.now()}`));
              const ref = doc(db, "users", uid, "budgets", bId);
              batch.set(ref, {
                id: bId,
                category: b.category,
                limit: Number(b.limit) || 0,
                createdAt: serverTimestamp(),
              });
            });
            await batch.commit();
          }
        } catch {
          // ignore
        }
        localStorage.removeItem(localBudgetsKey);
      }
    }

    // 3. Goals Migration
    const goalsCol = collection(db, "users", uid, "goals");
    const goalsSnap = await getDocs(goalsCol);
    if (goalsSnap.empty) {
      const localGoalsKey = `finsight_goals_${uid}`;
      const savedGoals = localStorage.getItem(localGoalsKey);
      if (savedGoals) {
        try {
          const parsed = JSON.parse(savedGoals);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const batch = writeBatch(db);
            parsed.forEach((g, idx) => {
              const gId = String(g.id || `goal_${Date.now()}_${idx}`);
              const ref = doc(db, "users", uid, "goals", gId);
              batch.set(ref, {
                id: gId,
                name: g.name || "Goal",
                targetAmount: Number(g.targetAmount ?? g.target) || 0,
                currentAmount: Number(g.currentAmount ?? g.current) || 0,
                deadline: g.deadline || "2026-12-31",
                color: g.color || "#10b981",
                createdAt: serverTimestamp(),
              });
            });
            await batch.commit();
          }
        } catch {
          // ignore
        }
        localStorage.removeItem(localGoalsKey);
      }
    }

    // 4. Bills Migration
    const billsCol = collection(db, "users", uid, "bills");
    const billsSnap = await getDocs(billsCol);
    if (billsSnap.empty) {
      const localBillsKey = `finsight_bills_${uid}`;
      const savedBills = localStorage.getItem(localBillsKey);
      if (savedBills) {
        try {
          const parsed = JSON.parse(savedBills);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const batch = writeBatch(db);
            parsed.forEach((b, idx) => {
              const bId = String(b.id || `bill_${Date.now()}_${idx}`);
              const ref = doc(db, "users", uid, "bills", bId);
              batch.set(ref, {
                id: bId,
                name: b.name || "Bill",
                amount: Number(b.amount) || 0,
                dueDate: b.dueDate || "Due soon",
                paid: Boolean(b.paid),
                createdAt: serverTimestamp(),
              });
            });
            await batch.commit();
          }
        } catch {
          // ignore
        }
        localStorage.removeItem(localBillsKey);
      }
    }

    // 5. Settings / Preferences Migration
    const settingsDocRef = doc(db, "users", uid, "settings", "preferences");
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      const localSettings = localStorage.getItem("finsightCommandSettings");
      const onboardingDismissed = localStorage.getItem(`finsight_hide_onboarding_${uid}`) === "true";
      let initialSettings = {};
      if (localSettings) {
        try {
          initialSettings = JSON.parse(localSettings) || {};
        } catch {
          // ignore
        }
      }
      if (onboardingDismissed) {
        initialSettings.onboardingDismissed = true;
      }
      if (Object.keys(initialSettings).length > 0) {
        await setDoc(settingsDocRef, { ...initialSettings, createdAt: serverTimestamp() }, { merge: true });
      }
      localStorage.removeItem("finsightCommandSettings");
      localStorage.removeItem(`finsight_hide_onboarding_${uid}`);
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
};

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
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

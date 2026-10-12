import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import Transactions from "../pages/Transactions";
import Accounts from "../pages/Accounts";
import AIAdvisor from "../pages/AIAdvisor";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";

function AppRoutes({
  totalBalance = 0,
  totalIncome = 0,
  totalExpense = 0,
  csvData = [],
  loadingData = false,
  isLoggedIn = false,
  currentUser = null,
  setShowForm = () => {},
  uploadedFiles = [],
  setUploadedFiles = () => {},
  onSaveTransaction = async () => true,
  onDeleteTransaction = async () => true,
  showToast = () => {},
  themeMode = "dark",
  toggleThemeMode = () => {},
}) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Landing
            onGetStarted={() => {
              navigate("/dashboard");
            }}
            onLogin={() => {
              setShowForm(true);
            }}
            setIsLoginOpen={setShowForm}
            onDemo={() => {
              navigate("/dashboard");
            }}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <Dashboard
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            csvData={csvData}
            loadingData={loadingData}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            setShowForm={setShowForm}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            onSaveTransaction={onSaveTransaction}
            onDeleteTransaction={onDeleteTransaction}
            showToast={showToast}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
          />
        }
      />
      <Route
        path="/transactions"
        element={
          <Transactions
            csvData={csvData}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalBalance={totalBalance}
            onUpdateTransaction={onSaveTransaction}
            onSaveTransaction={onSaveTransaction}
            onDeleteTransaction={onDeleteTransaction}
            showToast={showToast}
          />
        }
      />
      <Route
        path="/accounts"
        element={
          <Accounts
            csvData={csvData}
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            onSaveTransaction={onSaveTransaction}
            onDeleteTransaction={onDeleteTransaction}
            showToast={showToast}
          />
        }
      />
      <Route
        path="/ai-advisor"
        element={
          <AIAdvisor
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            csvData={csvData}
            onSaveTransaction={onSaveTransaction}
            showToast={showToast}
          />
        }
      />
      <Route
        path="/reports"
        element={
          <Reports
            csvData={csvData}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalBalance={totalBalance}
            onSaveTransaction={onSaveTransaction}
            showToast={showToast}
          />
        }
      />
      <Route
        path="/settings"
        element={
          <Settings
            currentUser={currentUser}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
            showToast={showToast}
          />
        }
      />
      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;

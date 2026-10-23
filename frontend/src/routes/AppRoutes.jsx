import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import Transactions from "../pages/Transactions";
import Accounts from "../pages/Accounts";
import AIAdvisor from "../pages/AIAdvisor";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes({
  totalBalance = 0,
  totalIncome = 0,
  totalExpense = 0,
  csvData = [],
  loadingData = false,
  isLoggedIn = false,
  authLoading = false,
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
              if (isLoggedIn) {
                navigate("/dashboard");
              } else {
                setShowForm(true);
              }
            }}
            onLogin={() => {
              setShowForm(true);
            }}
            setIsLoginOpen={setShowForm}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            setShowForm={setShowForm}
          >
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
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            setShowForm={setShowForm}
          >
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
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedRoute
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            setShowForm={setShowForm}
          >
            <Accounts
              csvData={csvData}
              totalBalance={totalBalance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              onSaveTransaction={onSaveTransaction}
              onDeleteTransaction={onDeleteTransaction}
              showToast={showToast}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-advisor"
        element={
          <ProtectedRoute
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            setShowForm={setShowForm}
          >
            <AIAdvisor
              totalBalance={totalBalance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              csvData={csvData}
              onSaveTransaction={onSaveTransaction}
              showToast={showToast}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            setShowForm={setShowForm}
          >
            <Reports
              csvData={csvData}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              totalBalance={totalBalance}
              onSaveTransaction={onSaveTransaction}
              showToast={showToast}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            setShowForm={setShowForm}
          >
            <Settings
              currentUser={currentUser}
              themeMode={themeMode}
              toggleThemeMode={toggleThemeMode}
              showToast={showToast}
            />
          </ProtectedRoute>
        }
      />
      {/* Wildcard Fallback */}
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}

export default AppRoutes;

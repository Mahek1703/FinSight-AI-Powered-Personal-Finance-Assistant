import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { FaSpinner } from "react-icons/fa";

const Landing = lazy(() => import("../pages/Landing"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Transactions = lazy(() => import("../pages/Transactions"));
const Accounts = lazy(() => import("../pages/Accounts"));
const AIAdvisor = lazy(() => import("../pages/AIAdvisor"));
const Reports = lazy(() => import("../pages/Reports"));
const Settings = lazy(() => import("../pages/Settings"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3 text-center">
      <FaSpinner className="animate-spin text-2xl text-emerald-400" />
      <p className="text-xs text-zinc-400 font-medium">Loading view...</p>
    </div>
  );
}

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
    <Suspense fallback={<RouteLoadingFallback />}>
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
              loadingData={loadingData}
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
              loadingData={loadingData}
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
              loadingData={loadingData}
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
              loadingData={loadingData}
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
              csvData={csvData}
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
    </Suspense>
  );
}

export default AppRoutes;

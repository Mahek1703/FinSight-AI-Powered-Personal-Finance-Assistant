import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { askAI } from "../services/aiService";
import AddTransactionModal from "../components/AddTransactionModal";
import {
  FaRobot,
  FaChartLine,
  FaShieldAlt,
  FaCoins,
  FaBolt,
  FaBullseye,
  FaPlus,
  FaInfoCircle,
  FaCheck,
  FaPercentage,
  FaTimes,
  FaLightbulb,
  FaWallet,
  FaArrowRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  formatCurrency,
  getCurrencySymbol,
  RISK_ALLOCATION,
  SUGGESTED_TRANSFER_RATIO,
} from "../config/constants.js";

function AIAdvisor({
  totalBalance = 0,
  totalIncome = 0,
  totalExpense = 0,
  onSaveTransaction = async () => true,
}) {
  const navigate = useNavigate();

  const [riskProfile, setRiskProfile] = useState("Moderate");
  const [deployed, setDeployed] = useState(false);
  const [addStrategyModal, setAddStrategyModal] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);

  // Custom strategy inputs
  const [strategyName, setStrategyName] = useState("");
  const [strategyHorizon, setStrategyHorizon] = useState("3 - 5 Years (Medium Term)");
  const [strategyAmount, setStrategyAmount] = useState("");
  const [customStrategies, setCustomStrategies] = useState([]);

  // AI states
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiUnavailable, setIsAiUnavailable] = useState(false);

  // Dynamic Discretionary Cash Flow calculation
  const discretionaryCashFlow = useMemo(() => {
    const raw = Number(totalIncome || 0) - Number(totalExpense || 0);
    return raw > 0 ? raw : 0;
  }, [totalIncome, totalExpense]);

  const hasPositiveCashFlow = discretionaryCashFlow > 0;

  const money = (val) => formatCurrency(val);

  // Risk profile allocation models based strictly on dynamic cash flow
  const allocation = useMemo(() => {
    const cash = hasPositiveCashFlow ? discretionaryCashFlow : 0;

    if (!hasPositiveCashFlow) {
      return {
        equity: { pct: 0, amount: 0 },
        debt: { pct: 0, amount: 0 },
        gold: { pct: 0, amount: 0 },
        growthRate: 0,
        growthText: "+0%",
        projectedGain: 0,
      };
    }

    if (riskProfile === "Low") {
      return {
        equity: { pct: 30, amount: Math.round(cash * 0.3) },
        debt: { pct: 30, amount: Math.round(cash * 0.3) },
        gold: { pct: 40, amount: Math.round(cash * 0.4) },
        growthRate: 8.5,
        growthText: "+8.5%",
        projectedGain: Math.round(cash * 12 * 0.085),
      };
    }

    if (riskProfile === "Aggressive") {
      return {
        equity: { pct: 70, amount: Math.round(cash * 0.7) },
        debt: { pct: 15, amount: Math.round(cash * 0.15) },
        gold: { pct: 15, amount: Math.round(cash * 0.15) },
        growthRate: 16.2,
        growthText: "+16.2%",
        projectedGain: Math.round(cash * 12 * 0.162),
      };
    }

    // Moderate (default)
    return {
      equity: { pct: 50, amount: Math.round(cash * 0.5) },
      debt: { pct: 25, amount: Math.round(cash * 0.25) },
      gold: { pct: 25, amount: Math.round(cash * 0.25) },
      growthRate: 12.4,
      growthText: "+12.4%",
      projectedGain: Math.round(cash * 12 * 0.124),
    };
  }, [riskProfile, discretionaryCashFlow, hasPositiveCashFlow]);

  // Gemini AI Request with computed financial fallback
  const handleAIAdvice = async () => {
    setAiLoading(true);
    setAiResponse("");
    setIsAiUnavailable(false);

    const prompt = `
You are FinSight AI, a premier personal finance assistant.
Provide a concise, practical, and highly personalized financial insight for the user based on their numbers:
- Total Monthly Income: ${formatCurrency(totalIncome)}
- Total Monthly Expenses: ${formatCurrency(totalExpense)}
- Available Cash Balance: ${formatCurrency(totalBalance)}
- Unallocated Discretionary Cash Flow: ${formatCurrency(discretionaryCashFlow)}
- Chosen Risk Profile: ${riskProfile}

Provide:
1. An evaluation of their current savings rate and cash flow health.
2. An actionable 30-day recommendation to optimize wealth building.
Keep it encouraging, punchy, and easy to understand for beginners.
`;

    try {
      const result = await askAI(prompt);
      setAiResponse(result);
      setIsAiUnavailable(false);
    } catch (error) {
      console.warn("AI Service fallback:", error);
      setIsAiUnavailable(true);

      const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
      const riskConfig = RISK_ALLOCATION[riskProfile] || RISK_ALLOCATION.Moderate;
      const suggestedTransfer = Math.round(discretionaryCashFlow * SUGGESTED_TRANSFER_RATIO);

      if (!hasPositiveCashFlow) {
        const fallbackText = `• Cash Flow Health: You currently have ${formatCurrency(0)} unallocated discretionary cash flow (Income: ${formatCurrency(totalIncome)}, Expenses: ${formatCurrency(totalExpense)}).
• Budgeting Priority: Before deploying investment portfolios, focus on creating positive cash flow by auditing recurring subscriptions and variable spending.
• Action Step: Log your recent income transactions in the Ledger to generate custom risk-weighted portfolio allocations.`;
        setAiResponse(fallbackText);
      } else {
        const fallbackText = `• Cash Flow Health: You are currently retaining ${savingsRate}% of your monthly income (${formatCurrency(discretionaryCashFlow)} surplus).
• ${riskProfile} Allocation Target: Channel ${riskConfig.equity}% into diversified index funds, and split the remaining between fixed income and capital reserve.
• Action Step: Automate a monthly transfer of ${formatCurrency(suggestedTransfer)} within 24 hours of salary credit to prevent lifestyle inflation.`;
        setAiResponse(fallbackText);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddStrategySubmit = (e) => {
    e.preventDefault();
    if (!strategyName.trim()) return;
    setCustomStrategies((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: strategyName.trim(),
        horizon: strategyHorizon,
        amount: Number(strategyAmount) || 5000,
      },
    ]);
    setStrategyName("");
    setStrategyAmount("");
    setAddStrategyModal(false);
  };

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Intelligent Portfolio
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Investment Advisor
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Smart portfolio allocation based on discretionary cash flow
          </p>
        </div>

        {/* Risk Profile Selector */}
        <div className="flex items-center gap-2 p-1 bg-[#08080b] border border-white/[0.08] rounded-2xl self-start sm:self-auto">
          <span className="text-xs text-zinc-400 font-semibold px-2.5 flex items-center gap-1.5 hidden sm:flex">
            <FaShieldAlt className="text-emerald-400 text-xs" /> Risk
          </span>
          {["Low", "Moderate", "Aggressive"].map((profile) => (
            <button
              key={profile}
              type="button"
              onClick={() => setRiskProfile(profile)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                riskProfile === profile
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20 border border-[#2563EB]"
                  : "bg-transparent text-zinc-400 hover:text-white border border-transparent"
              }`}
            >
              {profile}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column AI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Real-Time Allocation Engine */}
        <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.05]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FaRobot className="text-base" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Real-Time Allocation Engine
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {hasPositiveCashFlow
                    ? `Optimized for ${riskProfile} risk profile`
                    : "Zero cash flow detected"}
                </p>
              </div>
            </div>

            {/* Highlight Cash Flow Box */}
            <div className="p-4 rounded-2xl bg-[#0c0c10] border border-white/[0.05] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center text-base shrink-0 ${
                    hasPositiveCashFlow
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400"
                  }`}
                >
                  <FaCoins />
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 font-medium block">
                    Discretionary Cash Flow
                  </span>
                  <strong className="text-base sm:text-lg font-extrabold text-white">
                    {hasPositiveCashFlow ? money(discretionaryCashFlow) : formatCurrency(0)}
                    <small className="text-xs text-zinc-500 font-normal"> / month</small>
                  </strong>
                </div>
              </div>

              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  hasPositiveCashFlow
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
                }`}
              >
                {hasPositiveCashFlow ? `${riskProfile} Profile` : "Zero Surplus"}
              </span>
            </div>

            {/* Zero Cash Flow Empty State Card vs Active Allocation Rows */}
            {!hasPositiveCashFlow ? (
              <div className="p-6 rounded-2xl bg-[#0c0c10] border border-dashed border-zinc-700/60 text-center space-y-3.5 my-2">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 text-lg mx-auto shadow-inner">
                  <FaWallet />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    No Cash Flow Available to Allocate
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Add your income and expenses to unlock live AI investment strategies and smart portfolio allocation.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsAddTxModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <FaPlus className="text-[10px]" /> Add Income / Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/transactions")}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <span>View Ledger</span>
                    <FaArrowRight className="text-[10px] text-zinc-400" />
                  </button>
                </div>
              </div>
            ) : (
              /* Allocation Breakdown Rows */
              <div className="space-y-3">
                {/* 1. Equity */}
                <div className="p-3.5 rounded-xl bg-[#0c0c10] border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <strong className="text-xs text-white">Index Funds & Large Cap Equity</strong>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      {money(allocation.equity.amount)} ({allocation.equity.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${allocation.equity.pct}%` }}
                    />
                  </div>
                </div>

                {/* 2. Debt / Fixed Income */}
                <div className="p-3.5 rounded-xl bg-[#0c0c10] border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      <strong className="text-xs text-white">Short-Term Debt & Recurring Reserve</strong>
                    </div>
                    <span className="text-xs font-bold text-sky-400">
                      {money(allocation.debt.amount)} ({allocation.debt.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full transition-all duration-500"
                      style={{ width: `${allocation.debt.pct}%` }}
                    />
                  </div>
                </div>

                {/* 3. Gold & Liquid Fund */}
                <div className="p-3.5 rounded-xl bg-[#0c0c10] border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <strong className="text-xs text-white">Sovereign Gold & Capital Shield</strong>
                    </div>
                    <span className="text-xs font-bold text-amber-400">
                      {money(allocation.gold.amount)} ({allocation.gold.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${allocation.gold.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Deploy Button */}
          <button
            type="button"
            onClick={() => {
              if (hasPositiveCashFlow) {
                setDeployed(true);
              }
            }}
            disabled={!hasPositiveCashFlow || deployed}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              !hasPositiveCashFlow
                ? "bg-zinc-900/60 text-zinc-500 border border-zinc-800/80 cursor-not-allowed opacity-60"
                : deployed
                ? "bg-emerald-500/20 text-white border border-emerald-500 cursor-pointer"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500 cursor-pointer active:scale-[0.98]"
            }`}
          >
            <FaBolt className={hasPositiveCashFlow ? "text-emerald-400" : "text-zinc-500"} />
            {hasPositiveCashFlow
              ? deployed
                ? "Monthly Distribution Scheduled ✓"
                : "Deploy Cash Flow Distribution"
              : "No Cash Flow to Deploy"}
          </button>
        </div>

        {/* Right Column: AI Insights & Strategies */}
        <div className="bg-[#08080b] border border-white/[0.06] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FaLightbulb className="text-base" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    AI Advisor & Custom Strategies
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Live insights tuned for wealth creation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAddStrategyModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white hover:text-white border border-emerald-500/40 hover:border-emerald-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors active:scale-[0.98]"
              >
                <FaPlus className="text-[10px] text-emerald-400" />
                <span>Add Strategy</span>
              </button>
            </div>

            {/* Projected Performance Box */}
            <div className="p-4 rounded-2xl bg-[#0c0c10] border border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                    hasPositiveCashFlow
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-800/60 text-zinc-500"
                  }`}
                >
                  <FaChartLine />
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 font-medium block">
                    Estimated 1-Year Compound Growth
                  </span>
                  <span className="text-xs text-zinc-500">
                    {hasPositiveCashFlow
                      ? `Based on ${riskProfile} allocation model`
                      : "No active cash flow to compound"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-base font-extrabold block ${
                    hasPositiveCashFlow ? "text-emerald-400" : "text-zinc-500"
                  }`}
                >
                  {hasPositiveCashFlow ? allocation.growthText : `${formatCurrency(0)} (+0%)`}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {hasPositiveCashFlow
                    ? `(+${money(allocation.projectedGain)})`
                    : "No Active Allocation"}
                </span>
              </div>
            </div>

            {/* Custom Added Strategies */}
            {customStrategies.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-300">Custom Portfolios ({customStrategies.length})</h4>
                {customStrategies.map((st) => (
                  <div key={st.id} className="p-3 rounded-xl bg-[#0c0c10] border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">{st.name}</h5>
                      <span className="text-[10px] text-zinc-500">{st.horizon}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{formatCurrency(st.amount)}/mo</span>
                  </div>
                ))}
              </div>
            )}

            {/* Gemini AI Action Button */}
            <button
              type="button"
              onClick={handleAIAdvice}
              disabled={aiLoading}
              className="w-full py-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-purple-500/40 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <FaRobot className="text-purple-400" />
              <span>{aiLoading ? "Consulting Gemini AI..." : "Generate Live AI Financial Insight"}</span>
            </button>

            {/* AI Response Display */}
            {aiResponse && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                  isAiUnavailable
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                    : "bg-purple-950/20 border-purple-500/30 text-zinc-200"
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-bold ${
                    isAiUnavailable ? "text-amber-400" : "text-purple-400"
                  }`}
                >
                  {isAiUnavailable ? <FaExclamationTriangle /> : <FaRobot />}
                  <span>
                    {isAiUnavailable
                      ? "AI is unavailable, showing a summary computed from your data"
                      : "FinSight AI Financial Insight"}
                  </span>
                </div>
                <div className="leading-relaxed whitespace-pre-line text-[11px] sm:text-xs text-zinc-300">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="pt-3 border-t border-white/[0.04] flex items-center gap-2 text-[10px] text-zinc-500">
            <FaInfoCircle className="shrink-0" />
            <span>AI insights are for informational purposes only and do not constitute certified financial advice.</span>
          </div>
        </div>
      </div>

      {/* Add Custom Strategy Modal */}
      {addStrategyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setAddStrategyModal(false)}
        >
          <div
            className="bg-[#0c0c10] border border-white/[0.08] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FaBullseye className="text-emerald-400" /> Build Custom Strategy
              </h3>
              <button
                type="button"
                onClick={() => setAddStrategyModal(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 bg-transparent border-none cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddStrategySubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                  Strategy Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Early Retirement, Tech Growth SIP"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                  Investment Horizon
                </label>
                <select
                  value={strategyHorizon}
                  onChange={(e) => setStrategyHorizon(e.target.value)}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option>1 - 3 Years (Short Term)</option>
                  <option>3 - 5 Years (Medium Term)</option>
                  <option>5+ Years (Long Term Compounding)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                  Monthly Contribution ({getCurrencySymbol()})
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  value={strategyAmount}
                  onChange={(e) => setStrategyAmount(e.target.value)}
                  className="w-full bg-[#14141a] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-500 transition-all active:scale-[0.98]"
              >
                <FaCheck className="text-emerald-400" /> Save Investment Strategy
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal for Quick Action from Empty State */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        onSaveTransaction={onSaveTransaction}
        initialType="income"
      />
    </div>
  );
}

export default AIAdvisor;
import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaRegCircle,
  FaTimes,
  FaRocket,
  FaPlus,
  FaBullseye,
  FaSyncAlt,
} from "react-icons/fa";
import { subscribeSettings, saveSettings } from "../../services/firestore.js";

export default function BeginnerOnboarding({
  userId = null,
  hasTransactions = false,
  hasBudgets = false,
  hasImported = false,
  onOpenAddModal = () => {},
  onOpenAddBudget = () => {},
  onOpenSyncTab = () => {},
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeSettings(userId, (pref) => {
      if (pref?.onboardingDismissed) {
        setDismissed(true);
      }
    });
    return unsub;
  }, [userId]);

  if (dismissed) return null;

  const steps = [
    {
      title: "Log your first transaction",
      desc: "Record your daily food, travel, or salary inflow",
      done: hasTransactions,
      action: onOpenAddModal,
      btnLabel: "Add Now",
      icon: <FaPlus className="text-[10px]" />,
    },
    {
      title: "Set a monthly budget",
      desc: "Create spending guardrails for Food or Shopping",
      done: hasBudgets,
      action: onOpenAddBudget,
      btnLabel: "Set Budget",
      icon: <FaBullseye className="text-[10px]" />,
    },
    {
      title: "Auto-sync receipts or statements",
      desc: "Connect Gmail or drop a bank statement",
      done: hasImported,
      action: onOpenSyncTab,
      btnLabel: "Try Sync",
      icon: <FaSyncAlt className="text-[10px]" />,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  const handleDismiss = async () => {
    setDismissed(true);
    if (userId) {
      await saveSettings({ onboardingDismissed: true }, userId);
    }
  };

  if (allDone) return null;

  return (
    <div className="w-full bg-[#08080b] border border-emerald-500/30 rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
            <FaRocket />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Quick Start Checklist</span>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400">
                {completedCount}/3 Ready
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Complete these 3 simple steps to unlock your automated AI command center
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 bg-transparent border-none rounded-lg cursor-pointer transition-colors"
          title="Dismiss checklist"
          aria-label="Dismiss checklist"
        >
          <FaTimes className="text-xs" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
              step.done
                ? "bg-emerald-500/[0.04] border-emerald-500/20"
                : "bg-[#0c0c10] border-white/[0.05]"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {step.done ? (
                  <FaCheckCircle className="text-emerald-400 text-sm" />
                ) : (
                  <FaRegCircle className="text-zinc-600 text-sm" />
                )}
              </div>
              <div>
                <h4
                  className={`text-xs font-semibold ${
                    step.done ? "text-emerald-300 line-through opacity-80" : "text-white"
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{step.desc}</p>
              </div>
            </div>

            {!step.done && (
              <button
                type="button"
                onClick={step.action}
                className="self-start px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500/60 hover:border-emerald-500 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors active:scale-[0.98]"
              >
                {step.icon}
                <span>{step.btnLabel}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

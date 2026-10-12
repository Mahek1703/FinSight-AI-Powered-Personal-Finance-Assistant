import React, { useState, useMemo } from "react";
import {
  FaExclamationTriangle,
  FaTimes,
  FaCheck,
  FaShieldAlt,
  FaCopy,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaBell,
  FaCheckCircle,
  FaBolt,
  FaTrashAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  detectAnomalies,
  dismissAnomalyId,
} from "../../utils/AnomalyDetector";

/**
 * AnomalyAlertBanner Component
 * Real-time spending spike, duplicate charge, and recurring subscription alert banner.
 */
export default function AnomalyAlertBanner({
  transactions = [],
  onReviewTransaction = () => {},
  showToast = () => {},
  compact = false,
}) {
  const [dismissedVersion, setDismissedVersion] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  // Run dynamic anomaly detection
  const detectionResult = useMemo(() => {
    return detectAnomalies(transactions);
  }, [transactions, dismissedVersion]);

  const {
    status,
    badgeText,
    badgeColor,
    activeAnomaliesCount,
    anomalies = [],
  } = detectionResult;

  const handleDismiss = (e, anomalyId) => {
    e.stopPropagation();
    dismissAnomalyId(anomalyId);
    setDismissedVersion((v) => v + 1);
    showToast("Alert dismissed.", "info");
  };

  // If compact badge mode (e.g. for header / summary card)
  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
          badgeColor === "rose"
            ? "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
            : badgeColor === "amber"
            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full inline-block animate-pulse ${
            badgeColor === "rose"
              ? "bg-rose-400"
              : badgeColor === "amber"
              ? "bg-amber-400"
              : "bg-emerald-400"
          }`}
        />
        <span>{badgeText}</span>
      </div>
    );
  }

  // If no active anomalies, render clean health status pill
  if (activeAnomaliesCount === 0) {
    return (
      <div className="w-full p-3.5 sm:p-4 rounded-[18px] bg-gradient-to-r from-emerald-500/[0.07] via-emerald-500/[0.02] to-transparent border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FaCheckCircle className="text-xs" />
          </div>
          <div>
            <span className="font-bold text-white">Financial Health: Clean</span>
            <p className="text-[11px] text-zinc-400">
              No unusual spikes or duplicate debits detected across recent transactions
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <FaShieldAlt className="text-[9px]" /> AI Audit Active
        </span>
      </div>
    );
  }

  // Active Anomalies Banner
  return (
    <div className="w-full bg-[#08080b] border border-white/[0.08] rounded-[18px] shadow-2xl overflow-hidden transition-all duration-200">
      {/* Top Banner Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
          badgeColor === "rose"
            ? "bg-gradient-to-r from-rose-500/15 via-rose-500/[0.05] to-transparent hover:from-rose-500/20"
            : "bg-gradient-to-r from-amber-500/15 via-amber-500/[0.05] to-transparent hover:from-amber-500/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
              badgeColor === "rose"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            <FaExclamationTriangle />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                AI Spending Anomaly & Duplicate Alert
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  badgeColor === "rose"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {activeAnomaliesCount} {activeAnomaliesCount === 1 ? "Alert" : "Alerts"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Suspicious debits or outlier amounts flagged by statistical baseline analysis
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-2 text-zinc-400 hover:text-white bg-transparent border-none rounded-lg cursor-pointer"
          aria-label={isExpanded ? "Collapse alerts" : "Expand alerts"}
        >
          {isExpanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
        </button>
      </div>

      {/* Expandable Alert Items List */}
      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-2.5 border-t border-white/[0.06] bg-[#0c0c10]">
          {anomalies.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                alert.severity === "high"
                  ? "bg-rose-500/[0.06] border-rose-500/25 hover:border-rose-500/40"
                  : alert.severity === "medium"
                  ? "bg-amber-500/[0.06] border-amber-500/25 hover:border-amber-500/40"
                  : "bg-purple-500/[0.06] border-purple-500/25 hover:border-purple-500/40"
              }`}
            >
              {/* Alert Content */}
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-base shrink-0 pt-0.5">
                  {alert.type === "high_spike"
                    ? "🚨"
                    : alert.type === "duplicate"
                    ? "🔁"
                    : "📅"}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold text-white leading-snug break-words">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span>{alert.date}</span>
                    <span>•</span>
                    <span className="capitalize">{alert.category}</span>
                    {alert.percentageOverAverage && (
                      <>
                        <span>•</span>
                        <span className="text-rose-400 font-bold">
                          +{alert.percentageOverAverage}% vs Avg (₹{Math.round(alert.averageCategoryAmount)})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {/* Review Transaction Button */}
                <button
                  type="button"
                  onClick={() => onReviewTransaction(alert.transaction)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10 active:scale-95"
                >
                  <FaEye className="text-[10px] text-sky-400" />
                  <span>Review</span>
                </button>

                {/* Dismiss Alert Button */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(e, alert.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-500/20 active:scale-95"
                  title="Dismiss this alert"
                >
                  <FaTimes className="text-[10px]" />
                  <span className="hidden sm:inline">Dismiss</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

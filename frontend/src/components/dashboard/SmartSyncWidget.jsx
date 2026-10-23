import React, { useState } from "react";
import {
  FaEnvelope,
  FaFileAlt,
  FaMicrophone,
  FaCheckCircle,
  FaShieldAlt,
  FaCloudUploadAlt,
  FaSyncAlt,
  FaBolt,
  FaReceipt,
  FaRobot,
} from "react-icons/fa";
import GmailConnectButton from "../GmailConnectionButton";
import { getCurrencySymbol } from "../../config/constants";

export default function SmartSyncWidget({
  onTransactionsLoaded = () => {},
  onStatementFileSelected = () => {},
  onOpenVoiceModal = () => {},
  onOpenReceiptModal = () => {},
  existingIds = [],
  showToast = () => {},
}) {
  const [dragOverStatement, setDragOverStatement] = useState(false);
  const [dragOverReceipt, setDragOverReceipt] = useState(false);

  const handleStatementDrop = (e) => {
    e.preventDefault();
    setDragOverStatement(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onStatementFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleReceiptDrop = (e) => {
    e.preventDefault();
    setDragOverReceipt(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (typeof onOpenReceiptModal === "function") {
        onOpenReceiptModal(e.dataTransfer.files[0]);
      }
    }
  };

  return (
    <div className="bg-[#08080b] border border-white/[0.06] rounded-[18px] md:rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FaBolt className="text-xs" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Smart Auto-Sync Hub</h2>
            <p className="text-[11px] text-zinc-400">
              Zero manual typing — auto-import via Gmail, Gemini Vision OCR & bank statements
            </p>
          </div>
        </div>

        <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          <FaShieldAlt className="text-[10px]" /> End-to-End Encrypted
        </span>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Section A: AI Receipt & Invoice OCR (Gemini Vision) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverReceipt(true);
          }}
          onDragLeave={() => setDragOverReceipt(false)}
          onDrop={handleReceiptDrop}
          className={`p-4 sm:p-5 rounded-[18px] border transition-all flex flex-col justify-between space-y-4 ${
            dragOverReceipt
              ? "bg-emerald-500/15 border-emerald-400 scale-[1.01]"
              : "bg-[#0c0c10] border-white/[0.05] hover:border-emerald-500/30"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FaReceipt className="text-xs" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Gemini Receipt OCR</h3>
                  <p className="text-[10px] text-zinc-400">Gemini 1.5 Flash Vision</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                AI Vision
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              Drop any bill or receipt image to instantly extract merchant, items, amount, and category.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => onOpenReceiptModal()}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <FaRobot className="text-xs" />
              <span>Scan Receipt / Invoice</span>
            </button>
          </div>
        </div>

        {/* Section B: Gmail Direct Sync */}
        <div className="p-4 sm:p-5 rounded-[18px] bg-[#0c0c10] border border-white/[0.05] hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <FaEnvelope className="text-xs" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Gmail Auto-Reader</h3>
                <p className="text-[10px] text-zinc-400">
                  Swiggy, Zomato, Amazon & UPI
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              One-click Google authentication securely extracts expense amounts and dates into your live ledger.
            </p>
          </div>

          <div className="pt-2">
            <GmailConnectButton
              onTransactionsLoaded={onTransactionsLoaded}
              onError={(err) => showToast(err, "error")}
              existingIds={existingIds}
            />
          </div>
        </div>

        {/* Section C: Statement Drag & Drop (CSV/XLSX/PDF) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStatement(true);
          }}
          onDragLeave={() => setDragOverStatement(false)}
          onDrop={handleStatementDrop}
          className={`p-4 sm:p-5 rounded-[18px] border transition-all flex flex-col justify-between space-y-4 ${
            dragOverStatement
              ? "bg-sky-500/15 border-sky-400"
              : "bg-[#0c0c10] border-white/[0.05] hover:border-sky-500/30"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                <FaCloudUploadAlt className="text-xs" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Bank Statement Importer</h3>
                <p className="text-[10px] text-zinc-400">PDF, Excel (.xlsx), & CSV</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              Drag & drop bank statements to instantly parse hundreds of debit/credit entries.
            </p>
          </div>

          <div>
            <label className="w-full py-2.5 px-4 rounded-xl bg-[#14141a] hover:bg-[#1a1a24] text-zinc-200 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors text-center">
              <FaFileAlt className="text-sky-400 text-xs" />
              <span>Select Statement File</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onStatementFileSelected(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Voice Assistant Shortcut Card */}
      <div className="p-4 rounded-[18px] bg-gradient-to-r from-emerald-500/[0.06] to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <FaMicrophone className="text-xs" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Natural Language Voice Logger</h4>
            <p className="text-[11px] text-zinc-400">
              Speak naturally: {`"Spent ${getCurrencySymbol()}250 on coffee at Starbucks via Card"`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenVoiceModal}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-emerald-500 transition-all active:scale-[0.98]"
        >
          <FaMicrophone className="text-emerald-400" /> Open Voice Logger
        </button>
      </div>
    </div>
  );
}


import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaReceipt,
  FaCloudUploadAlt,
  FaTimes,
  FaCheck,
  FaEdit,
  FaRobot,
  FaUtensils,
  FaFileInvoiceDollar,
  FaShoppingBag,
  FaPlane,
  FaHeartbeat,
  FaGraduationCap,
  FaWallet,
  FaMoneyBillWave,
  FaCreditCard,
  FaCalendarAlt,
  FaStore,
  FaInfoCircle,
  FaSpinner,
  FaExchangeAlt,
  FaTrashAlt,
} from "react-icons/fa";

import { scanReceiptWithGemini } from "../services/geminiVision.service";
import { addExpense } from "../services/firestore";
import { auth } from "../firebase";
import { EXPENSE_CATEGORIES, formatCurrency, getCurrencySymbol } from "../config/constants";

const PAYMENT_TYPES = ["Credit", "Debit", "Cash", "Online"];

const getCategoryIcon = (category = "") => {
  const cat = String(category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("dining") || cat.includes("swiggy") || cat.includes("zomato"))
    return <FaUtensils className="text-emerald-400" />;
  if (cat.includes("bill") || cat.includes("utility") || cat.includes("recharge"))
    return <FaFileInvoiceDollar className="text-sky-400" />;
  if (cat.includes("shop") || cat.includes("cloth") || cat.includes("amazon"))
    return <FaShoppingBag className="text-purple-400" />;
  if (cat.includes("travel") || cat.includes("uber") || cat.includes("ola") || cat.includes("fuel"))
    return <FaPlane className="text-amber-400" />;
  if (cat.includes("health") || cat.includes("med") || cat.includes("doctor"))
    return <FaHeartbeat className="text-rose-400" />;
  if (cat.includes("education") || cat.includes("book") || cat.includes("course"))
    return <FaGraduationCap className="text-indigo-400" />;
  return <FaWallet className="text-zinc-400" />;
};

/**
 * ReceiptScanner Component
 * Drag-and-drop Receipt/Invoice OCR parser using Google Gemini 1.5 Flash Vision.
 * Pre-fills parsed details in an editable review drawer/modal and saves to users/{uid}/expenses.
 */
export default function ReceiptScanner({
  isOpen = false,
  onClose = () => {},
  onExpenseAdded = () => {},
  showToast = () => {},
  currentUser = null,
  embedded = false,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Review Form state
  const [formData, setFormData] = useState({
    merchant: "",
    date: new Date().toISOString().slice(0, 10),
    totalAmount: "",
    category: "Others",
    description: "",
    paymentType: "Cash",
  });

  const fileInputRef = useRef(null);

  // Clear preview URL on unmount or reset
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage("");
    setIsScanning(false);
    setScanStep("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = () => {
    handleReset();
    setShowReviewModal(false);
    onClose();
  };

  const startScan = useCallback(async (file) => {
    setIsScanning(true);
    setScanStep("Extracting image data...");

    try {
      setScanStep("Analyzing receipt with AI...");
      const result = await scanReceiptWithGemini(file);

      setScanStep("Extracting merchant & line items...");

      // Populate review form state
      setFormData({
        merchant: result.merchant || "Store Merchant",
        date: result.date || new Date().toISOString().slice(0, 10),
        totalAmount: result.totalAmount ? String(result.totalAmount) : "0",
        category: result.category || "Food",
        description: result.description || `${result.merchant || "Receipt"} expense`,
        paymentType: result.paymentType || "Cash",
      });

      setIsScanning(false);
      setShowReviewModal(true);
      showToast("Receipt parsed successfully with AI!", "success");
    } catch (err) {
      console.error("Receipt Scan Error:", err);
      setIsScanning(false);
      setErrorMessage(err.message || "Failed to parse receipt with AI Vision service.");
      showToast("OCR scanning error: " + (err.message || "Failed to process image"), "error");
    }
  }, [showToast]);

  // Process selected file
  const processImageFile = useCallback(async (file) => {
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      setErrorMessage("Please upload a valid image file (PNG, JPG, or WEBP).");
      showToast("Invalid file format. Please upload PNG, JPG, or WEBP.", "error");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("File size exceeds 15MB limit.");
      showToast("File size too large. Maximum size is 15MB.", "error");
      return;
    }

    setErrorMessage("");
    setSelectedFile(file);

    // Create instant preview thumbnail
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Trigger AI Vision scan
    await startScan(file);
  }, [showToast, startScan]);

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Clipboard Paste Support (Ctrl+V screenshot upload)
  useEffect(() => {
    const handlePaste = (e) => {
      if (!isOpen && !embedded) return;
      if (isScanning || showReviewModal) return;

      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              processImageFile(blob);
              break;
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, embedded, isScanning, showReviewModal, processImageFile]);

  // Form Submission & Database Persistence
  const handleConfirmAddExpense = async (e) => {
    e?.preventDefault();

    const amountNum = parseFloat(String(formData.totalAmount).replace(/[^0-9.]/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid expense amount.", "error");
      return;
    }

    const uid = currentUser?.uid || auth.currentUser?.uid || null;

    setIsSaving(true);

    try {
      const expensePayload = {
        amount: amountNum,
        date: formData.date || new Date().toISOString().slice(0, 10),
        category: formData.category || "Others",
        accountType: formData.paymentType || "Cash",
        source: formData.merchant || formData.category || "Store",
        note: formData.merchant
          ? `${formData.merchant} - ${formData.description || "Receipt purchase"}`
          : formData.description || "Receipt purchase",
        description: formData.description || "",
      };

      // Call firestore.js addExpense (strictly writes to users/{uid}/expenses)
      const res = await addExpense(expensePayload, uid);

      if (res.success) {
        showToast(`Added ${formatCurrency(amountNum)} expense for ${formData.merchant || "Receipt"}!`, "success");

        const fullRecord = {
          ...res.payload,
          id: res.id,
          firestoreId: res.id,
          type: "Expense",
          category: formData.category,
          amount: amountNum,
          date: formData.date,
          accountType: formData.paymentType,
          note: expensePayload.note,
        };

        if (typeof onExpenseAdded === "function") {
          onExpenseAdded(fullRecord);
        }

        // Close and cleanup
        handleReset();
        setShowReviewModal(false);
        if (!embedded) {
          onClose();
        }
      } else {
        throw new Error(res.error || "Failed to write expense to Firestore.");
      }
    } catch (err) {
      console.error("Failed to save receipt expense:", err);
      showToast("Failed to save expense: " + (err.message || String(err)), "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Main Drop Zone UI Content
  const renderScannerBody = () => (
    <div className="space-y-4">
      {/* Upload Zone */}
      {!previewUrl && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group p-6 sm:p-8 rounded-[18px] border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center select-none ${
            isDragging
              ? "bg-emerald-500/15 border-emerald-400 scale-[1.01] shadow-[0_0_25px_rgba(16,185,129,0.25)]"
              : "bg-[#0c0c10] hover:bg-[#121217] border-white/[0.12] hover:border-emerald-500/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                processImageFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-transform duration-200">
            <FaReceipt className="text-2xl" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white mb-1 tracking-tight">
            Drop your receipt or invoice here
          </h3>
          <p className="text-xs text-zinc-400 mb-3 max-w-xs">
            Drag & drop an image, browse files, or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] text-zinc-300">Ctrl+V</kbd> to paste
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-zinc-400 font-medium">
            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-white/[0.08]">PNG</span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-white/[0.08]">JPG</span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-white/[0.08]">WEBP</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ⚡ Gemini 1.5 Flash Vision
            </span>
          </div>
        </div>
      )}

      {/* Instant Preview Thumbnail & Glassmorphism Scanning Overlay */}
      {previewUrl && (
        <div className="relative rounded-[18px] overflow-hidden border border-white/[0.1] bg-[#0c0c10] p-4 flex flex-col items-center">
          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                <FaReceipt className="text-xs" />
              </div>
              <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                {selectedFile?.name || "Uploaded Receipt"}
              </span>
              {selectedFile?.size && (
                <span className="text-[10px] text-zinc-400">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              )}
            </div>

            {/* Circular Remove Button */}
            {!isScanning && (
              <button
                type="button"
                onClick={handleReset}
                title="Remove image and select another"
                aria-label="Remove image"
                className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          {/* Image Container with Scanning Animation */}
          <div className="relative w-full max-w-sm max-h-64 rounded-xl overflow-hidden bg-black/40 border border-white/[0.05] flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Receipt Preview"
              className={`w-full h-auto max-h-64 object-contain transition-all duration-300 ${
                isScanning ? "brightness-[0.4] blur-[1px]" : "brightness-100"
              }`}
            />

            {/* Laser scanning line & Glassmorphism loader */}
            {isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                {/* Laser Animation Bar */}
                <div className="fs-scan-laser-line" />

                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 animate-pulse">
                  <FaRobot className="text-xl" />
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-xs font-bold text-white tracking-wide flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin text-emerald-400 text-xs" />
                    Scanning Receipt with Gemini AI...
                  </h4>
                  <p className="text-[11px] text-emerald-400/90 font-mono">
                    {scanStep || "Analyzing visual structures..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions if Scan Failed or User wants to re-scan */}
          {!isScanning && (
            <div className="w-full flex items-center justify-end gap-2 pt-3 mt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Upload Different File
              </button>
              <button
                type="button"
                onClick={() => selectedFile && startScan(selectedFile)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <FaRobot className="text-xs" /> Re-scan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
          <FaInfoCircle className="text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-rose-400 hover:text-white"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );

  // Review Drawer / Modal content
  const renderReviewModal = () => {
    if (!showReviewModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div
          className="relative w-full max-w-lg bg-[#0d0d12] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <FaRobot className="text-lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Review Extracted Expense
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    AI Auto-Filled
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Verify or edit the parsed details before saving to your ledger
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close review modal"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>

          {/* Form Body (Scrollable) */}
          <form onSubmit={handleConfirmAddExpense} className="p-5 overflow-y-auto space-y-4">
            {/* Image Thumbnail Strip */}
            {previewUrl && (
              <div className="p-2.5 rounded-xl bg-[#121217] border border-white/[0.05] flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Receipt mini preview"
                  className="w-12 h-12 rounded-lg object-cover border border-white/10 bg-black/40"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {formData.merchant || "Extracted Receipt"}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Total: {formatCurrency(formData.totalAmount || 0)}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold px-2 py-1 bg-zinc-800 rounded">
                  {formData.category}
                </span>
              </div>
            )}

            {/* Merchant & Amount Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Merchant / Vendor */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <FaStore className="text-emerald-400 text-xs" /> Merchant / Store
                </label>
                <input
                  type="text"
                  required
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="e.g. Starbucks, Amazon, Shell"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-white/[0.08] focus:border-emerald-500 text-white text-xs font-medium placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <FaMoneyBillWave className="text-emerald-400 text-xs" /> Total Amount ({getCurrencySymbol()})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#14141a] border border-white/[0.08] focus:border-emerald-500 text-white text-xs font-bold placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Date & Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <FaCalendarAlt className="text-sky-400 text-xs" /> Transaction Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-white/[0.08] focus:border-emerald-500 text-white text-xs font-medium focus:outline-none transition-colors"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  {getCategoryIcon(formData.category)} Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-white/[0.08] focus:border-emerald-500 text-white text-xs font-medium focus:outline-none transition-colors"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method Pills */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <FaCreditCard className="text-purple-400 text-xs" /> Payment Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentType: type })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formData.paymentType === type
                        ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-[#14141a] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    {formData.paymentType === type && <FaCheck className="text-[10px]" />}
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Item Details */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <FaEdit className="text-zinc-400 text-xs" /> Item Details / Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Line items, order summary, or notes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-white/[0.08] focus:border-emerald-500 text-white text-xs font-medium placeholder-zinc-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Destination Security Notice */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.05] flex items-center gap-2 text-[11px] text-zinc-400">
              <FaCheck className="text-emerald-400 text-xs shrink-0" />
              <span>
                Record will be securely stored under{" "}
                <code className="text-zinc-300 font-mono text-[10px]">
                  users/{currentUser?.uid ? `${currentUser.uid.slice(0, 6)}...` : "auth.uid"}/expenses
                </code>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Back to Image
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" /> Saving to Ledger...
                  </>
                ) : (
                  <>
                    <FaCheck className="text-xs" /> Confirm & Add Expense
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // If embedded in a widget (like SmartSyncWidget)
  if (embedded) {
    return (
      <div className="w-full">
        {renderScannerBody()}
        {renderReviewModal()}
      </div>
    );
  }

  // Standalone Modal Mode
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0a0a0d] border border-white/[0.1] rounded-[18px] p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FaReceipt className="text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                AI Receipt & Invoice OCR
              </h2>
              <p className="text-xs text-zinc-400">
                Powered by Google Gemini 1.5 Flash Vision API
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>

        {/* Body */}
        {renderScannerBody()}
        {renderReviewModal()}
      </div>
    </div>
  );
}

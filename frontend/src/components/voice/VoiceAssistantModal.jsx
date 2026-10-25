import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaMicrophone,
  FaTimes,
  FaCheck,
  FaArrowRight,
  FaEdit,
  FaRedo,
  FaVolumeUp,
  FaUtensils,
  FaShoppingBag,
  FaFileInvoiceDollar,
  FaPlane,
  FaHeartbeat,
  FaGraduationCap,
  FaBriefcase,
  FaWallet,
  FaSpinner,
  FaLanguage,
  FaBolt,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { parseVoiceWithGemini } from "../../services/geminiVoice.service";
import { formatCurrency } from "../../config/constants";

const getCategoryIcon = (category = "") => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("swiggy") || cat.includes("zomato") || cat.includes("dining"))
    return <FaUtensils className="text-emerald-400" />;
  if (cat.includes("shop") || cat.includes("cloth") || cat.includes("amazon") || cat.includes("flipkart"))
    return <FaShoppingBag className="text-purple-400" />;
  if (cat.includes("bill") || cat.includes("recharge") || cat.includes("electr") || cat.includes("wifi"))
    return <FaFileInvoiceDollar className="text-sky-400" />;
  if (cat.includes("salary") || cat.includes("freelance") || cat.includes("bonus") || cat.includes("income"))
    return <FaBriefcase className="text-emerald-400" />;
  if (cat.includes("travel") || cat.includes("uber") || cat.includes("ola") || cat.includes("fuel") || cat.includes("petrol"))
    return <FaPlane className="text-amber-400" />;
  if (cat.includes("health") || cat.includes("med") || cat.includes("doctor"))
    return <FaHeartbeat className="text-rose-400" />;
  if (cat.includes("education") || cat.includes("book") || cat.includes("course"))
    return <FaGraduationCap className="text-indigo-400" />;
  return <FaWallet className="text-zinc-400" />;
};

const SAMPLE_VOICE_PRESETS = [
  { label: "🍔 Swiggy Dinner", text: "Swiggy par 450 rupees kharch kiye dinner ke liye" },
  { label: "⚡ Electricity Bill", text: "Paid 1200 for electricity bill via card" },
  { label: "🚕 Uber Ride", text: "Paid 350 for Uber ride today" },
  { label: "💼 Freelance Income", text: "Received 25000 freelance project payment in bank" },
];

export default function VoiceAssistantModal({
  isOpen = false,
  onClose = () => {},
  onSaveTransaction = async () => {},
  onOpenManualEdit = () => {},
  showToast = () => {},
}) {
  const [state, setState] = useState("idle"); // 'idle' | 'listening' | 'processing' | 'preview' | 'success' | 'error'
  const [language, setLanguage] = useState("en-IN"); // 'en-IN' | 'hi-IN'
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [parsedResult, setParsedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const recognitionRef = useRef(null);
  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const processWithAI = useCallback(async (textToParse) => {
    const clean = String(textToParse || "").trim();
    if (!clean) return;

    stopListening();
    setState("processing");
    setTranscript(clean);

    try {
      const parsed = await parseVoiceWithGemini(clean);
      setParsedResult(parsed);
      setState("preview");
    } catch (err) {
      console.error("AI Voice parsing error:", err);
      setState("error");
      setErrorMessage(err.message || "Failed to parse transaction via voice AI.");
    }
  }, [stopListening]);

  const startListening = useCallback(() => {
    setErrorMessage("");
    setParsedResult(null);
    setTranscript("");
    setInterimTranscript("");

    if (!speechSupported) {
      setState("error");
      setErrorMessage(
        "Web Speech Recognition is not supported by your browser. Please use Chrome, Edge, or enter text below."
      );
      return;
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setState("listening");
      };

      recognition.onresult = (event) => {
        let currentInterim = "";
        let finalTrans = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTrans += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTrans) {
          setTranscript(finalTrans);
          setInterimTranscript("");
          processWithAI(finalTrans);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          setState("idle");
          setErrorMessage("No voice detected. Tap the microphone and try speaking again.");
        } else if (event.error === "not-allowed") {
          setState("error");
          setErrorMessage(
            "Microphone access blocked. Please allow microphone permissions in your browser bar."
          );
        } else {
          setState("idle");
        }
      };

      recognition.onend = () => {
        setState((prev) => (prev === "listening" ? "idle" : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
      setState("idle");
    }
  }, [language, processWithAI, speechSupported]);

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    setState("idle");
    setTranscript("");
    setInterimTranscript("");
    setParsedResult(null);
    setErrorMessage("");
  }

  // Handle listening on open / stop on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      return;
    }

    if (!speechSupported) return;

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setState("listening");
      };

      recognition.onresult = (event) => {
        let currentInterim = "";
        let finalTrans = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTrans += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTrans) {
          setTranscript(finalTrans);
          setInterimTranscript("");
          processWithAI(finalTrans);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          setState("idle");
          setErrorMessage("No voice detected. Tap the microphone and try speaking again.");
        } else if (event.error === "not-allowed") {
          setState("error");
          setErrorMessage(
            "Microphone access blocked. Please allow microphone permissions in your browser bar."
          );
        } else {
          setState("idle");
        }
      };

      recognition.onend = () => {
        setState((prev) => (prev === "listening" ? "idle" : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
    }

    return () => {
      stopListening();
    };
  }, [isOpen, language, processWithAI, speechSupported, stopListening]);

  const handleConfirmAndSave = async () => {
    if (!parsedResult) return;
    setIsSaving(true);

    try {
      const payload = {
        type: parsedResult.type || "Expense",
        amount: Number(parsedResult.amount || 0),
        category: parsedResult.category || "Others",
        note: parsedResult.merchant
          ? `${parsedResult.merchant} - ${parsedResult.note || "Voice logged"}`
          : parsedResult.note || "Voice logged expense",
        date: parsedResult.date || new Date().toISOString().slice(0, 10),
        accountType: parsedResult.accountType || "Cash",
      };

      await onSaveTransaction(payload);
      setState("success");
      showToast(
        `Logged ${formatCurrency(payload.amount)} for ${payload.category} via Voice AI!`,
        "success"
      );

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to save voice transaction:", err);
      showToast("Failed to save transaction: " + err.message, "error");
      setState("preview");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditInManualForm = () => {
    if (parsedResult) {
      onOpenManualEdit({
        type: (parsedResult.type || "expense").toLowerCase(),
        amount: String(parsedResult.amount || ""),
        category: parsedResult.category || "Food",
        note: parsedResult.note || parsedResult.merchant || "",
        date: parsedResult.date || new Date().toISOString().slice(0, 10),
        accountType: parsedResult.accountType || "Cash",
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#0b0c10] border border-white/[0.08] rounded-3xl p-6 sm:p-7 text-white w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.07] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm">
              <FaMicrophone />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Voice AI Expense Assistant
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Gemini Flash
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Speak in English, Hindi, or Hinglish</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-zinc-900 border border-white/[0.08] rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLanguage("en-IN")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  language === "en-IN"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi-IN")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  language === "hi-IN"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                HI
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/[0.06] cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="py-6 space-y-6 relative z-10">
          {/* =========================================================================
              STATE: LISTENING
              ========================================================================= */}
          {state === "listening" && (
            <div className="text-center space-y-5">
              {/* Pulsing Animated Mic Orb */}
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
                <button
                  type="button"
                  onClick={stopListening}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-emerald-300 text-black text-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer active:scale-95 transition-transform"
                >
                  <FaMicrophone />
                </button>
              </div>

              {/* Soundwave Frequency Bars */}
              <div className="flex items-center justify-center gap-1.5 h-6">
                {[12, 24, 16, 28, 20, 32, 18, 26, 14].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-emerald-400 rounded-full animate-bounce"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${(i * 0.1).toFixed(1)}s`,
                      animationDuration: "0.8s",
                    }}
                  />
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-white tracking-tight">Listening to speech...</p>
                <p className="text-xs text-zinc-400 italic min-h-[20px]">
                  {interimTranscript || transcript ? `"${interimTranscript || transcript}"` : "Try: 'Swiggy par 450 kharch kiye' or 'Paid 1200 electricity bill'"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => processWithAI(interimTranscript || transcript)}
                disabled={!interimTranscript && !transcript}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                Done Speaking
              </button>
            </div>
          )}

          {/* =========================================================================
              STATE: PROCESSING WITH GEMINI AI
              ========================================================================= */}
          {state === "processing" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl mx-auto animate-spin">
                <FaSpinner />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Extracting Financial Details...</h3>
                <p className="text-xs text-zinc-400">Gemini AI is parsing amount, merchant, and category</p>
                {transcript && (
                  <p className="text-xs text-emerald-400/90 font-mono mt-2 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    "{transcript}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              STATE: PREVIEW STRUCTURED RESULT
              ========================================================================= */}
          {state === "preview" && parsedResult && (
            <div className="space-y-4 animate-in fade-in">
              {/* Spoken Transcript Chip */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/[0.06] text-xs text-zinc-400 flex items-start gap-2">
                <FaVolumeUp className="text-emerald-400 text-xs shrink-0 mt-0.5" />
                <span className="italic">"{transcript || parsedResult.rawTranscript}"</span>
              </div>

              {/* Parsed Result Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12141a] to-[#0d0e12] border border-emerald-500/30 shadow-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      parsedResult.type === "Income"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {parsedResult.type}
                  </span>

                  <span className="text-xs text-zinc-400">{parsedResult.date}</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <span className="text-[11px] text-zinc-400 block font-medium">Parsed Amount</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white">
                      {formatCurrency(Number(parsedResult.amount || 0))}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-zinc-400 block font-medium">Category</span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 text-white font-bold text-xs border border-white/10 mt-1">
                      {getCategoryIcon(parsedResult.category)}
                      <span>{parsedResult.category}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Merchant / Payee</span>
                    <span className="font-semibold text-zinc-200 truncate block">
                      {parsedResult.merchant || "Standard"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block">Payment Account</span>
                    <span className="font-semibold text-zinc-200 block">
                      {parsedResult.accountType || "Cash"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {/* Confirm & Log Button */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmAndSave}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  <span>{isSaving ? "Logging..." : "Confirm & Log Expense"}</span>
                </button>

                {/* Edit in manual form */}
                <button
                  type="button"
                  onClick={handleEditInManualForm}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center cursor-pointer transition-all"
                  title="Edit details in manual form"
                >
                  <FaEdit />
                </button>

                {/* Re-record */}
                <button
                  type="button"
                  onClick={startListening}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center cursor-pointer transition-all"
                  title="Speak again"
                >
                  <FaRedo />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STATE: SUCCESS
              ========================================================================= */}
          {state === "success" && (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                <FaCheckCircle />
              </div>
              <h3 className="text-base font-bold text-white">Expense Logged Successfully!</h3>
              <p className="text-xs text-zinc-400">Transaction synced securely to your Firestore ledger.</p>
            </div>
          )}

          {/* =========================================================================
              STATE: IDLE OR ERROR (WITH MANUAL INPUT & PRESETS)
              ========================================================================= */}
          {(state === "idle" || state === "error") && (
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                  <FaExclamationCircle className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Big Mic Center Trigger */}
              <div className="text-center py-2 space-y-2">
                <button
                  type="button"
                  onClick={startListening}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-2xl flex items-center justify-center mx-auto cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <FaMicrophone />
                </button>
                <p className="text-xs font-semibold text-zinc-300">Tap to Start Speaking</p>
              </div>

              {/* Manual Voice Text Input fallback */}
              <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                <label className="text-[11px] font-bold text-zinc-400 block">
                  Or Type Spoken Natural Language Sentence:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && transcript.trim()) {
                        processWithAI(transcript);
                      }
                    }}
                    placeholder="e.g. Swiggy par 450 rupees kharch kiye..."
                    className="flex-1 bg-zinc-900 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => processWithAI(transcript)}
                    disabled={!transcript.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer transition-all disabled:opacity-40"
                  >
                    Parse AI
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Quick Voice Examples
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_VOICE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTranscript(preset.text);
                        processWithAI(preset.text);
                      }}
                      className="p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-white/[0.06] text-left text-xs text-zinc-300 hover:text-white transition-all cursor-pointer truncate"
                    >
                      <span className="font-bold block truncate">{preset.label}</span>
                      <span className="text-[10px] text-zinc-500 truncate block mt-0.5">
                        "{preset.text}"
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { Component } from "react";
import { FaExclamationTriangle, FaRedo, FaHome } from "react-icons/fa";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FinSight AI ErrorBoundary caught an unhandled exception:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#08080b] text-white flex items-center justify-center p-6 selection:bg-rose-500/30">
          <div className="max-w-md w-full bg-[#101016] border border-white/[0.08] rounded-3xl p-7 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-3xl mx-auto shadow-inner animate-pulse">
              <FaExclamationTriangle />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Something went wrong
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                An unexpected interface issue occurred. Your financial data is securely preserved on Firestore.
              </p>
              {this.state.error?.message && (
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs flex items-center gap-2 border border-emerald-500/40 cursor-pointer transition-all active:scale-95"
              >
                <FaRedo className="text-[11px]" /> Reload App
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                className="px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs flex items-center gap-2 border border-white/[0.06] cursor-pointer transition-all active:scale-95"
              >
                <FaHome className="text-[11px]" /> Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

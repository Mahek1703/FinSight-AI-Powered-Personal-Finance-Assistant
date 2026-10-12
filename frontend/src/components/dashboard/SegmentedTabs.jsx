import React from "react";
import {
  FaChartPie,
  FaBullseye,
  FaSyncAlt,
  FaReceipt,
  FaFileInvoiceDollar,
} from "react-icons/fa";

export default function SegmentedTabs({
  activeTab = "overview",
  onTabChange = () => {},
  transactionCount = 0,
  goalsCount = 0,
  billsCount = 0,
}) {
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <FaReceipt className="text-xs" />,
      badge: transactionCount > 0 ? transactionCount : null,
    },
    {
      id: "budgets",
      label: "Budgets",
      icon: <FaChartPie className="text-xs" />,
    },
    {
      id: "goals_bills",
      label: "Goals & Bills",
      icon: <FaBullseye className="text-xs" />,
      badge: goalsCount + billsCount > 0 ? goalsCount + billsCount : null,
    },
    {
      id: "sync",
      label: "Smart Sync",
      icon: <FaSyncAlt className="text-xs" />,
      dot: true,
    },
  ];

  return (
    <div className="w-full flex items-center justify-between overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-1.5 p-1.5 bg-[#08080b] border border-white/[0.06] rounded-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-emerald-500/15 text-white border border-emerald-500 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {tab.dot && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

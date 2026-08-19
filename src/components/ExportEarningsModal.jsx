import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  X,
  Calendar,
  User,
  Users,
  Download,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Package,
} from "lucide-react";
import {
  exportAllRidersSummaryExcel,
  exportSingleRiderDetailedExcel,
  filterOrdersByDateRange,
} from "../utils/exportEarningsExcel";
import { riderCommissionFor, cashCollectedFor, foodValueFor } from "../utils/settlement";

export const ExportEarningsModal = ({
  isOpen,
  onClose,
  riders = [],
  orders = [],
  initialRiderId = "all",
}) => {
  const [exportTarget, setExportTarget] = useState(initialRiderId || "all"); // 'all' or riderId
  const [period, setPeriod] = useState("daily"); // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Preview stats for the selected filter
  const previewStats = useMemo(() => {
    let filtered = filterOrdersByDateRange(orders, period, fromDate, toDate);
    if (exportTarget !== "all") {
      filtered = filtered.filter(
        (o) => String(o.riderId || o.rider?._id || o.rider?.id || "") === String(exportTarget)
      );
    }

    const orderCount = filtered.length;
    const totalFood = filtered.reduce((sum, o) => sum + foodValueFor(o), 0);
    const totalCash = filtered.reduce((sum, o) => sum + cashCollectedFor(o), 0);
    const totalEarnings = filtered.reduce((sum, o) => sum + riderCommissionFor(o), 0);

    return {
      orderCount,
      totalFood,
      totalCash,
      totalEarnings,
    };
  }, [orders, period, fromDate, toDate, exportTarget]);

  if (!isOpen) return null;

  const handleExport = () => {
    if (exportTarget === "all") {
      exportAllRidersSummaryExcel({
        riders,
        orders,
        period,
        fromDate,
        toDate,
      });
    } else {
      const selectedRider = riders.find(
        (r) => String(r.id || r._id || "") === String(exportTarget)
      );
      if (selectedRider) {
        exportSingleRiderDetailedExcel({
          rider: selectedRider,
          orders,
          period,
          fromDate,
          toDate,
        });
      }
    }
    onClose();
  };

  const selectedRiderObj = riders.find(
    (r) => String(r.id || r._id || "") === String(exportTarget)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-neutral-900 dark:text-white">
                Export Rider Earnings to Excel
              </h3>
              <p className="text-xs text-neutral-400">
                Download structured Excel & CSV reports for financial calculations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* 1. Target Selector (All Riders vs Specific Rider) */}
          <div className="space-y-2">
            <label className="block font-bold text-neutral-700 dark:text-neutral-300">
              1. Select Report Target
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportTarget("all")}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                  exportTarget === "all"
                    ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-neutral-900 dark:text-white text-xs">
                    All Riders Fleet
                  </span>
                  <span className="block text-[10px] text-neutral-400">
                    Comprehensive fleet summary ({riders.length} riders)
                  </span>
                </div>
              </button>

              <div
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-center gap-1.5 ${
                  exportTarget !== "all"
                    ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-500" />
                  <span className="font-bold text-neutral-900 dark:text-white text-xs">
                    Individual Rider
                  </span>
                </div>
                <select
                  value={exportTarget === "all" ? "" : exportTarget}
                  onChange={(e) => setExportTarget(e.target.value || "all")}
                  className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-bold text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">-- Choose Rider --</option>
                  {riders.map((r) => (
                    <option key={r.id || r._id} value={r.id || r._id}>
                      {r.name} ({r.employmentType === "freelance" ? "Freelance" : "Permanent"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Date Range & Period Selector */}
          <div className="space-y-2">
            <label className="block font-bold text-neutral-700 dark:text-neutral-300">
              2. Select Date & Time Period
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { key: "daily", label: "Daily (Today)" },
                { key: "weekly", label: "Last 7 Days" },
                { key: "monthly", label: "This Month" },
                { key: "yearly", label: "This Year" },
                { key: "custom", label: "Custom Range" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`py-2 px-2.5 rounded-xl font-bold text-center transition-all cursor-pointer text-xs ${
                    period === p.key
                      ? "bg-primary-500 text-white shadow-sm shadow-primary-500/20"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {period === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Live Data Preview Card */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Report Preview for:{" "}
                <span className="text-neutral-900 dark:text-white">
                  {exportTarget === "all" ? "All Riders Fleet" : selectedRiderObj?.name || "Selected Rider"}
                </span>
              </span>
              <span className="text-[11px] font-semibold text-neutral-400">
                {previewStats.orderCount} Deliveries Found
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                <span className="block text-[10px] text-neutral-400 font-medium">Food Value</span>
                <span className="block text-xs font-black text-neutral-900 dark:text-white mt-0.5">
                  ৳{previewStats.totalFood.toFixed(0)}
                </span>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                <span className="block text-[10px] text-neutral-400 font-medium">Cash Collected</span>
                <span className="block text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  ৳{previewStats.totalCash.toFixed(0)}
                </span>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                <span className="block text-[10px] text-neutral-400 font-medium">Rider Earnings</span>
                <span className="block text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ৳{previewStats.totalEarnings.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={previewStats.orderCount === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download MS Excel Sheet (.csv)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportEarningsModal;

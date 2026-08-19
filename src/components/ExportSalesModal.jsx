import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  X,
  Calendar,
  Download,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  Layers,
  UtensilsCrossed,
  Filter,
  DollarSign,
} from "lucide-react";
import {
  filterSalesOrders,
  exportItemizedSalesExcel,
  exportPeriodicDailySummaryExcel,
  exportCategoryDishSalesExcel,
} from "../utils/exportSalesExcel";

export const ExportSalesModal = ({
  isOpen,
  onClose,
  orders = [],
}) => {
  const [reportType, setReportType] = useState("itemized"); // 'itemized' | 'periodic' | 'dishes'
  const [period, setPeriod] = useState("daily"); // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'all'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("delivered_only"); // 'delivered_only' | 'all_active_completed'

  // Live filtered preview stats
  const previewStats = useMemo(() => {
    const filtered = filterSalesOrders(orders, period, fromDate, toDate, statusFilter);

    const orderCount = filtered.length;
    let totalFood = 0;
    let totalDiscount = 0;
    let totalDelivery = 0;
    let totalSales = 0;
    let totalCod = 0;
    let totalOnline = 0;

    filtered.forEach((ord) => {
      const subtotal = Number(ord.subtotal) || Math.max(0, (Number(ord.total) || 0) - (Number(ord.deliveryCharge) || 0));
      const discount = Number(ord.couponDiscount || ord.discountAmount || ord.discount || 0);
      const delivery = Number(ord.deliveryCharge || 0);
      const total = Number(ord.total || 0);
      const isOnline = ord.paymentStatus === "Paid" || ord.paymentMethod?.toLowerCase().includes("online");

      totalFood += subtotal;
      totalDiscount += discount;
      totalDelivery += delivery;
      totalSales += total;
      if (isOnline) totalOnline += total;
      else totalCod += total;
    });

    return {
      orderCount,
      totalFood,
      totalDiscount,
      totalDelivery,
      totalSales,
      totalCod,
      totalOnline,
    };
  }, [orders, period, fromDate, toDate, statusFilter]);

  if (!isOpen) return null;

  const handleExport = () => {
    const payload = {
      orders,
      period,
      fromDate,
      toDate,
      statusFilter,
    };

    if (reportType === "itemized") {
      exportItemizedSalesExcel(payload);
    } else if (reportType === "periodic") {
      exportPeriodicDailySummaryExcel(payload);
    } else if (reportType === "dishes") {
      exportCategoryDishSalesExcel(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-neutral-900 dark:text-white">
                Export Sales & Financial Report
              </h3>
              <p className="text-xs text-neutral-400">
                Generate professional MS Excel & CSV spreadsheets with full sales breakdown
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
          {/* 1. Report Type Selection */}
          <div className="space-y-2">
            <label className="block font-bold text-neutral-700 dark:text-neutral-300">
              1. Choose Report Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "itemized",
                  label: "Itemized Orders",
                  desc: "Order-by-order breakdown with food items, discount, delivery & customer details",
                  icon: ShoppingBag,
                },
                {
                  id: "periodic",
                  label: "Periodic Summary",
                  desc: "Day-by-day / Month-by-month financial summary with COD vs Online split & AOV",
                  icon: Layers,
                },
                {
                  id: "dishes",
                  label: "Dish & Category",
                  desc: "Item performance, quantities sold, revenue share, and popular food dishes",
                  icon: UtensilsCrossed,
                },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = reportType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setReportType(t.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? "bg-emerald-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-neutral-900 dark:text-white text-xs">
                        {t.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                      {t.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Date Range & Period Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                2. Select Date & Time Period
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 cursor-pointer"
                >
                  <option value="delivered_only">Delivered Only (Realized Sales)</option>
                  <option value="all_active_completed">All Active & Delivered Orders</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { key: "daily", label: "Daily (Today)" },
                { key: "weekly", label: "Last 7 Days" },
                { key: "monthly", label: "This Month" },
                { key: "yearly", label: "This Year" },
                { key: "custom", label: "Custom Range" },
                { key: "all", label: "All-Time" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`py-2 px-2 rounded-xl font-bold text-center transition-all cursor-pointer text-xs ${
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
                    From Date (Start)
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
                    To Date (End)
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

          {/* 3. Live Financial Preview Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Live Financial Summary
              </span>
              <span className="text-[11px] font-semibold text-neutral-400">
                {previewStats.orderCount} Orders Selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                <span className="block text-[10px] text-neutral-400 font-medium">Food Subtotal</span>
                <span className="block text-xs font-black text-neutral-900 dark:text-white mt-0.5">
                  ৳{previewStats.totalFood.toFixed(0)}
                </span>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                <span className="block text-[10px] text-neutral-400 font-medium">Discounts Given</span>
                <span className="block text-xs font-black text-rose-500 mt-0.5">
                  -৳{previewStats.totalDiscount.toFixed(0)}
                </span>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                <span className="block text-[10px] text-neutral-400 font-medium">Delivery Revenue</span>
                <span className="block text-xs font-black text-blue-500 mt-0.5">
                  +৳{previewStats.totalDelivery.toFixed(0)}
                </span>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                <span className="block text-[10px] text-neutral-400 font-medium">Gross Total Sales</span>
                <span className="block text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ৳{previewStats.totalSales.toFixed(0)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-200/40 dark:border-neutral-800/40 text-[10px] text-neutral-500">
              <span>COD Collection: <b className="text-amber-600 dark:text-amber-400">৳{previewStats.totalCod.toFixed(0)}</b></span>
              <span>Online Gateway: <b className="text-purple-600 dark:text-purple-400">৳{previewStats.totalOnline.toFixed(0)}</b></span>
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

export default ExportSalesModal;

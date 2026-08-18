import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  CheckCircle2,
  Clock3,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  DollarSign,
  CreditCard,
  Banknote,
  AlertCircle,
  Filter,
  Check,
  User,
  Phone,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useVisiblePolling } from "../../hooks/useVisiblePolling";
import {
  buildDailySettlementLog,
  formatDateKey,
  orderSettlementDate,
  cashCollectedFor,
  riderCommissionFor,
  foodValueFor,
} from "../../utils/settlement";
import {
  getAllOrders,
  submitRiderDailyCash,
} from "../../services/ordersService";
import { socket } from "../../services/socket";
import { isAssignedToMe } from "../../layouts/RiderLayout";

export const RiderSettlement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingCashDate, setSubmittingCashDate] = useState(null);
  const [expandedDateKey, setExpandedDateKey] = useState(null);
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all"); // 'all' | 'pending' | 'settled' | 'online'

  const fetchRiderOrders = useCallback(() => {
    if (!user) return;
    getAllOrders()
      .then((data) => {
        const orderList = Array.isArray(data) ? data : data?.data || [];
        const assigned = orderList.filter((o) => isAssignedToMe(o, user));
        setOrders(assigned);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders:", err);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    fetchRiderOrders();
  }, [fetchRiderOrders]);

  // ⚡ রিয়েল-টাইম সকেট লিসেনার: এডমিন ক্যাশ সেটেল করলে বা অর্ডারের স্ট্যাটাস বদলালে রিলোড ছাড়াই সাথে সাথে আপডেট
  useEffect(() => {
    let burstTimer = null;
    const handleSettlementSync = (payload) => {
      if (
        !payload ||
        !user ||
        !payload.riderId ||
        String(payload.riderId) === String(user?.id || user?._id)
      ) {
        clearTimeout(burstTimer);
        burstTimer = setTimeout(fetchRiderOrders, 300);
      }
    };

    socket.on("rider_cash_settled", handleSettlementSync);
    socket.on("order_updated", handleSettlementSync);
    socket.on("rider_order_updated", handleSettlementSync);

    return () => {
      clearTimeout(burstTimer);
      socket.off("rider_cash_settled", handleSettlementSync);
      socket.off("order_updated", handleSettlementSync);
      socket.off("rider_order_updated", handleSettlementSync);
    };
  }, [fetchRiderOrders, user]);

  // Cash settlement figures fallback polling
  useVisiblePolling(fetchRiderOrders, {
    intervalMs: 30000,
    enabled: Boolean(user),
  });

  const handleSubmitCash = async (dateKey, e) => {
    if (e) e.stopPropagation();
    const label = formatDateKey(dateKey);
    const confirmSubmit = window.confirm(
      `Are you sure you want to submit all collected cash to Admin for ${label}?`
    );
    if (!confirmSubmit) return;

    try {
      setSubmittingCashDate(dateKey);
      await submitRiderDailyCash(dateKey);

      toast.success(
        `💰 Cash handover request submitted for ${label}! Awaiting admin confirmation.`,
        {
          id: `submit-cash-${dateKey}`,
        }
      );
      fetchRiderOrders();
    } catch (err) {
      toast.error(
        "Failed to submit cash: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setSubmittingCashDate(null);
    }
  };

  const toggleAccordion = (dateKey) => {
    setExpandedDateKey(expandedDateKey === dateKey ? null : dateKey);
    setOrderPaymentFilter("all");
  };

  const dailyLog = buildDailySettlementLog(orders);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 stroke-[2.5]" />
          </div>
          Daily Performance & Settlement Track Log
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
          Track daily earnings, cash collected, admin received payments, and pending payable orders.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-rose-500" />
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
              Daily Settlement History & Order Breakdown
            </h3>
          </div>
          <span className="text-xs text-neutral-400 font-semibold">
            {dailyLog.length} Days Recorded
          </span>
        </div>

        {dailyLog.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Package className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto" />
            <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
              No delivery history logs recorded yet.
            </p>
            <p className="text-xs text-neutral-400">
              Completed and delivered orders will automatically appear here grouped by day.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {dailyLog.map((log, index) => {
              // Extract all orders for this specific settlement date
              const dayOrders = orders.filter((o) => {
                const orderDateKey = orderSettlementDate(o);
                const isTargetDate = orderDateKey === log.dateKey;
                const isRelevantStatus =
                  o.riderAcceptStatus === "rejected" ||
                  o.status === "Delivered" ||
                  o.status === "Rejected" ||
                  Boolean(o.deliveredAt);
                return isTargetDate && isRelevantStatus;
              });

              const isExpanded = expandedDateKey === log.dateKey;

              // Filtered list of day orders based on selected payment tracking tab
              const filteredDayOrders = dayOrders.filter((ord) => {
                if (orderPaymentFilter === "all") return true;

                const isSettled = Boolean(
                  ord.isCashSettledByAdmin ||
                    ord.isCashSettled ||
                    ord.cashSettled ||
                    ord.isSettled ||
                    ord.cashStatus === "SETTLED" ||
                    ord.settlementStatus === "SETTLED" ||
                    ord.cashStatus === "CONFIRMED"
                );

                const isOnline =
                  ord.paymentMethod !== "cod" &&
                  (ord.paymentStatus === "Paid" || cashCollectedFor(ord) === 0);

                if (orderPaymentFilter === "settled") return isSettled;
                if (orderPaymentFilter === "pending")
                  return !isSettled && !isOnline && ord.status === "Delivered";
                if (orderPaymentFilter === "online") return isOnline;
                return true;
              });

              // Day order counts for badges
              const counts = {
                all: dayOrders.length,
                pending: dayOrders.filter((o) => {
                  const isSettled = Boolean(
                    o.isCashSettledByAdmin ||
                      o.isCashSettled ||
                      o.cashSettled ||
                      o.isSettled
                  );
                  const isOnline =
                    o.paymentMethod !== "cod" &&
                    (o.paymentStatus === "Paid" || cashCollectedFor(o) === 0);
                  return !isSettled && !isOnline && o.status === "Delivered";
                }).length,
                settled: dayOrders.filter((o) =>
                  Boolean(
                    o.isCashSettledByAdmin ||
                      o.isCashSettled ||
                      o.cashSettled ||
                      o.isSettled
                  )
                ).length,
                online: dayOrders.filter(
                  (o) =>
                    o.paymentMethod !== "cod" &&
                    (o.paymentStatus === "Paid" || cashCollectedFor(o) === 0)
                ).length,
              };

              return (
                <div
                  key={index}
                  className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-950/40 overflow-hidden transition-all shadow-xs"
                >
                  {/* ========================================================= */}
                  {/* MAIN DAILY SUMMARY ROW (Click to expand orders)           */}
                  {/* ========================================================= */}
                  <div
                    onClick={() => toggleAccordion(log.dateKey)}
                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl transition-transform ${
                          isExpanded
                            ? "bg-rose-500 text-white"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-neutral-900 dark:text-white block">
                          {log.date}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>{dayOrders.length} Orders Total</span>
                          <span>•</span>
                          <span className="text-primary-500 font-bold">
                            Click to view order breakdown & status
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                      <div>
                        <span className="text-neutral-400 text-[10px] block font-semibold uppercase">
                          Delivered
                        </span>
                        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> {log.delivered}
                        </span>
                      </div>

                      {log.rejected > 0 && (
                        <div>
                          <span className="text-neutral-400 text-[10px] block font-semibold uppercase">
                            Rejected
                          </span>
                          <span className="inline-flex items-center gap-1 font-extrabold text-red-500">
                            <XCircle className="w-3.5 h-3.5" /> {log.rejected}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-neutral-400 text-[10px] block font-semibold uppercase">
                          Commission
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ৳{log.riderCommission.toFixed(2)}
                        </span>
                      </div>

                      {/* 1. Cash Collected */}
                      <div>
                        <span className="text-neutral-400 text-[10px] block font-semibold uppercase">
                          Cash Collected
                        </span>
                        <span className="font-black text-rose-500">
                          ৳{log.cashCollected.toFixed(2)}
                        </span>
                      </div>

                      {/* 2. Admin Received (Paid to Admin) */}
                      <div>
                        <span className="text-neutral-400 text-[10px] block font-semibold uppercase">
                          Admin Received
                        </span>
                        <span
                          className={`font-black ${
                            (log.paidToAdmin || 0) > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-neutral-400"
                          }`}
                        >
                          ৳{(log.paidToAdmin || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* 3. Payable to Admin (Due) */}
                      <div>
                        <span className="text-neutral-400 text-[10px] block font-semibold uppercase">
                          Payable to Admin
                        </span>
                        <span
                          className={`font-black ${
                            log.outstandingNetPayable > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-neutral-500"
                          }`}
                        >
                          ৳{log.outstandingNetPayable.toFixed(2)}
                        </span>
                      </div>

                      {/* Daily Status Action Badge */}
                      <div className="text-right">
                        {log.delivered === 0 ? (
                          <span className="text-neutral-400 font-medium text-[10px]">
                            N/A
                          </span>
                        ) : log.outstandingNetPayable === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fully Settled
                          </span>
                        ) : log.isSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl shadow-xs">
                            <Clock3 className="w-3.5 h-3.5" /> Awaiting Admin Approval
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleSubmitCash(log.dateKey, e)}
                            disabled={submittingCashDate === log.dateKey}
                            className="inline-flex items-center gap-1.5 text-[11px] font-black text-white bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <Clock3 className="w-3.5 h-3.5 animate-pulse" />
                            {submittingCashDate === log.dateKey
                              ? "Submitting..."
                              : (log.paidToAdmin || 0) > 0
                                ? "Pay Remaining Cash"
                                : "Pay Day Cash to Admin"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* EXPANDED INDIVIDUAL ORDER PAYMENT BREAKDOWN                */}
                  {/* ========================================================= */}
                  {isExpanded && (
                    <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 bg-white dark:bg-neutral-900 space-y-4 animate-fade-in">
                      {/* Filter Bar & Header for individual orders */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Package className="w-4 h-4 text-rose-500" />
                            Individual Order Payment & Settlement Tracking
                          </h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Track which individual orders have their cash paid to admin and which are still pending.
                          </p>
                        </div>

                        {/* Quick filter tabs */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setOrderPaymentFilter("all")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              orderPaymentFilter === "all"
                                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
                            }`}
                          >
                            All ({counts.all})
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderPaymentFilter("pending")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              orderPaymentFilter === "pending"
                                ? "bg-amber-500 text-white shadow-xs"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 hover:bg-amber-100"
                            }`}
                          >
                            <span>Pending to Pay ({counts.pending})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderPaymentFilter("settled")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              orderPaymentFilter === "settled"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100"
                            }`}
                          >
                            <span>Paid to Admin ({counts.settled})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderPaymentFilter("online")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              orderPaymentFilter === "online"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40 hover:bg-purple-100"
                            }`}
                          >
                            Online Prepaid ({counts.online})
                          </button>
                        </div>
                      </div>

                      {/* Orders Grid */}
                      {filteredDayOrders.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic py-4 text-center">
                          No orders matching this filter for this date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                          {filteredDayOrders.map((ord, oIdx) => {
                            const isDelivered = ord.status === "Delivered";
                            const isRejected = ord.status === "Rejected";

                            // Per-order admin settlement state check
                            const isOrderSettledByAdmin = Boolean(
                              ord.isCashSettledByAdmin ||
                                ord.isCashSettled ||
                                ord.cashSettled ||
                                ord.isSettled ||
                                ord.cashStatus === "SETTLED" ||
                                ord.settlementStatus === "SETTLED" ||
                                ord.cashStatus === "CONFIRMED"
                            );

                            const isOrderSubmittedToAdmin = Boolean(
                              ord.isSubmittedToAdmin ||
                                ord.isSubmitted ||
                                ord.submitted ||
                                ord.cashSubmitted ||
                                ord.isCashSubmitted
                            );

                            const isOnlinePrepaid =
                              ord.paymentMethod !== "cod" &&
                              (ord.paymentStatus === "Paid" ||
                                cashCollectedFor(ord) === 0);

                            const cash = cashCollectedFor(ord);
                            const commission = riderCommissionFor(ord);
                            const foodPrice = foodValueFor(ord);
                            const orderPayable = Math.max(0, cash - commission);

                            // Delivered Time formatting
                            const timeStr = ord.deliveredAt
                              ? new Date(ord.deliveredAt).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : ord.createdAt
                                ? new Date(ord.createdAt).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : "";

                            return (
                              <div
                                key={oIdx}
                                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                  isOrderSettledByAdmin
                                    ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/40"
                                    : !isOnlinePrepaid && isDelivered
                                      ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/40"
                                      : "bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800"
                                } shadow-2xs`}
                              >
                                {/* Card Top: Order Number + Delivered Time + Delivery Status */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black text-xs text-neutral-900 dark:text-white">
                                      #{String(ord._id || ord.id).slice(-6).toUpperCase()}
                                    </span>
                                    {timeStr && (
                                      <span className="text-[10px] text-neutral-400 font-medium">
                                        • {timeStr}
                                      </span>
                                    )}
                                  </div>

                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                      isDelivered
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    }`}
                                  >
                                    {ord.status}
                                  </span>
                                </div>

                                {/* 🎯 INDIVIDUAL ORDER ADMIN PAYMENT STATUS BADGE */}
                                <div className="pt-0.5">
                                  {isRejected ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[10px] font-bold">
                                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                                      <span>Order Cancelled / Rejected (৳0 Cash)</span>
                                    </div>
                                  ) : isOnlinePrepaid ? (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                                      <span className="flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Online Paid (No Cash to Pay Admin)</span>
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded bg-purple-200/60 dark:bg-purple-900/60 text-[9px]">
                                        Prepaid
                                      </span>
                                    </div>
                                  ) : isOrderSettledByAdmin ? (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                                      <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>Paid to Admin (Settled)</span>
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[9px] font-black">
                                        PAID ✓
                                      </span>
                                    </div>
                                  ) : isOrderSubmittedToAdmin ? (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                      <span className="flex items-center gap-1.5">
                                        <Clock3 className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Cash Handover Submitted</span>
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded bg-blue-200/60 dark:bg-blue-900/60 text-[9px]">
                                        Awaiting Admin
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                                      <span className="flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Cash Pending to Pay Admin</span>
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 text-[9px] font-black">
                                        UNPAID
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Customer & Delivery Location Details */}
                                <div className="text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1 bg-white/70 dark:bg-neutral-900/70 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold truncate text-neutral-800 dark:text-neutral-100">
                                      {ord.user?.name || ord.customerName || "Customer"}
                                    </span>
                                    <span className="text-neutral-400 font-mono text-[10px]">
                                      {ord.user?.phone || ord.deliveryPhone || "N/A"}
                                    </span>
                                  </div>

                                  <div className="flex items-start gap-1.5 pt-0.5 text-neutral-500 dark:text-neutral-400">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                    <span className="text-[10px] leading-tight line-clamp-2">
                                      {ord.deliveryAddress ||
                                        ord.deliveryArea ||
                                        "No address provided"}
                                    </span>
                                  </div>
                                </div>

                                {/* Individual Order Money Matrix */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] pt-1.5 border-t border-neutral-200/60 dark:border-neutral-800 font-medium">
                                  <div>
                                    <span className="text-neutral-400 text-[9px] block">
                                      Order Total
                                    </span>
                                    <span className="font-bold text-neutral-900 dark:text-white">
                                      ৳{(ord.total || 0).toFixed(2)}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-neutral-400 text-[9px] block">
                                      Your Commission
                                    </span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                                      +৳{commission.toFixed(2)}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-neutral-400 text-[9px] block">
                                      Collected Cash (COD)
                                    </span>
                                    <span
                                      className={`font-black ${
                                        cash > 0
                                          ? "text-rose-500"
                                          : "text-neutral-400"
                                      }`}
                                    >
                                      {cash > 0
                                        ? `৳${cash.toFixed(2)}`
                                        : "৳0.00 (Online)"}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-neutral-400 text-[9px] block">
                                      Admin Received
                                    </span>
                                    <span
                                      className={`font-black ${
                                        isOrderSettledByAdmin
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-neutral-400"
                                      }`}
                                    >
                                      {isOrderSettledByAdmin
                                        ? `৳${orderPayable.toFixed(2)} ✓`
                                        : "৳0.00"}
                                    </span>
                                  </div>

                                  <div className="sm:col-span-2 text-right sm:text-left">
                                    <span className="text-neutral-400 text-[9px] block">
                                      Payable to Admin (Due)
                                    </span>
                                    <span
                                      className={`font-black ${
                                        !isOrderSettledByAdmin && orderPayable > 0
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-neutral-400"
                                      }`}
                                    >
                                      {!isOrderSettledByAdmin && orderPayable > 0
                                        ? `৳${orderPayable.toFixed(2)}`
                                        : "৳0.00 (Settled)"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderSettlement;
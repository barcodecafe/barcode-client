import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useVisiblePolling } from "../../hooks/useVisiblePolling";
import { buildDailySettlementLog, formatDateKey } from "../../utils/settlement";
import {
  getAllOrders,
  submitRiderDailyCash,
} from "../../services/ordersService";
import { socket } from "../../services/socket";

export const RiderSettlement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingCashDate, setSubmittingCashDate] = useState(null);
  const [expandedDateKey, setExpandedDateKey] = useState(null);

  const fetchRiderOrders = useCallback(() => {
    if (!user) return;
    getAllOrders()
      .then((data) => {
        const assigned = (data || []).filter(
          (o) =>
            o.riderId === user.id ||
            o.riderName?.toLowerCase() === user.name?.toLowerCase()
        );
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

  // Cash settlement figures change when a delivery completes or the admin
  // confirms a handover — not every four seconds. See RiderOverview for why the
  // old interval was a problem; the same reasoning applies here.
  useVisiblePolling(fetchRiderOrders, {
    intervalMs: 30000,
    enabled: Boolean(user),
  });

  const handleSubmitCash = async (dateKey, e) => {
    e.stopPropagation();
    const label = formatDateKey(dateKey);
    const confirmSubmit = window.confirm(
      `Are you sure you want to mark all collected cash as submitted for ${label}?`
    );
    if (!confirmSubmit) return;

    try {
      setSubmittingCashDate(dateKey);
      await submitRiderDailyCash(dateKey);
      
      socket.emit("rider_cash_submitted", {
        riderId: user?.id,
        riderName: user?.name || "Rider",
        date: label
      });
      socket.emit("order_updated", { action: "cash_submit" });

      alert(`Cash submission request sent to Admin for ${label}!`);
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to submit cash: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingCashDate(null);
    }
  };

  const toggleAccordion = (dateKey) => {
    setExpandedDateKey(expandedDateKey === dateKey ? null : dateKey);
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
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          Daily Performance Track Log
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
          Track daily earnings, total collected cash, delivered locations, and request admin settlement.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-rose-500" />
          <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
            Daily Track History & Locations
          </h3>
        </div>

        {dailyLog.length === 0 ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium py-2">
            No history logs recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {dailyLog.map((log, index) => {
              // 🎯 আপডেট: ওই নির্দিষ্ট তারিখের ডেলিভারি এবং রিজেক্ট হওয়া সব অর্ডারই ফিল্টার করে নিয়ে আসা
              const dayOrders = orders.filter((o) => {
                const orderDateKey = new Date(o.createdAt || o.updatedAt).toISOString().split("T")[0];
                const isTargetDate = orderDateKey === log.dateKey;
                const isRelevantStatus = o.riderAcceptStatus === "rejected" || o.status === "Delivered" || o.status === "Rejected";
                return isTargetDate && isRelevantStatus;
              });

              const isExpanded = expandedDateKey === log.dateKey;

              return (
                <div
                  key={index}
                  className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/40 dark:bg-neutral-950/20 overflow-hidden transition-all"
                >
                  {/* মেইন রো (ক্লিক করলে ড্রপডাউন ওপেন হবে) */}
                  <div
                    onClick={() => toggleAccordion(log.dateKey)}
                    className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-neutral-900 dark:text-white block">
                          {log.date}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          Click to view {dayOrders.length} orders & locations
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs">
                      <div>
                        <span className="text-neutral-400 text-[10px] block">Delivered</span>
                        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> {log.delivered}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] block">Rejected</span>
                        <span className="inline-flex items-center gap-1 font-extrabold text-red-500">
                          <XCircle className="w-3 h-3" /> {log.rejected}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] block">Food Price</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">৳{log.foodPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] block">Delivery Charge</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">৳{log.deliveryCharge.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] block">Commission</span>
                        <span className="font-black text-emerald-500">৳{log.riderCommission.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] block">Cash Collected</span>
                        <span className="font-black text-rose-500">৳{log.cashCollected.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] block">Payable to Admin</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">৳{log.outstandingNetPayable.toFixed(2)}</span>
                      </div>

                      <div className="text-right">
                        {log.delivered === 0 ? (
                          <span className="text-neutral-400 font-medium text-[10px]">N/A</span>
                        ) : log.isSettled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3 h-3" /> Settled
                          </span>
                        ) : log.isSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                            <Clock3 className="w-3 h-3" /> Awaiting admin
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleSubmitCash(log.dateKey, e)}
                            disabled={submittingCashDate === log.dateKey}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Clock3 className="w-3 h-3 animate-pulse" />
                            {submittingCashDate === log.dateKey ? "Submitting..." : "Pay to Admin"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ড্রপডাউন ডিটেইলস: সফল ডেলিভারি এবং রিজেক্ট হওয়া অর্ডার লিস্ট */}
                  {isExpanded && (
                    <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 space-y-3 animate-fadeIn">
                      <h4 className="text-[11px] font-extrabold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-rose-500" />
                        Delivered & Rejected Orders Breakdown ({dayOrders.length}):
                      </h4>

                      {dayOrders.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">No order details found for this date.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dayOrders.map((ord, oIdx) => (
                            <div
                              key={oIdx}
                              className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 space-y-2 shadow-2xs"
                            >
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-extrabold text-neutral-800 dark:text-white">
                                  Order #{String(ord._id).slice(-6).toUpperCase()}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[8px] font-extrabold ${
                                    ord.status === "Delivered"
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : "bg-red-500/10 text-red-500"
                                  }`}
                                >
                                  {ord.status.toUpperCase()}
                                </span>
                              </div>

                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
                                <p className="font-semibold text-neutral-700 dark:text-neutral-200">
                                  Customer: {ord.user?.name || "N/A"} ({ord.user?.phone || "N/A"})
                                </p>
                                <div className="flex items-start gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="text-[10px] leading-tight">
                                    {ord.deliveryAddress || ord.deliveryArea || "No address provided"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[10px] pt-2 border-t border-neutral-200/60 dark:border-neutral-800 font-semibold">
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  Total: ৳{ord.total?.toFixed(2) || 0}
                                </span>
                                <span className={ord.status === "Delivered" ? "text-emerald-600" : "text-red-500"}>
                                  {ord.status === "Delivered" ? `Commission: ৳${ord.riderCommission?.toFixed(2) || 50}` : "Rejected Order"}
                                </span>
                              </div>
                            </div>
                          ))}
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
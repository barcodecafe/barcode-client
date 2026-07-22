import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  MessageSquare,
  Send,
  X,
  Check,
  Calendar,
  MapPin,
  User,
  Phone,
  DollarSign,
  Bike,
  Utensils,
  TrendingUp,
  CheckCircle2,
  Clock3,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import {
  getAllOrders,
  updateOrderStatus,
  addChatMessage,
  assignRiderToOrder,
  acceptRiderOrder,
  rejectRiderOrder,
  confirmRiderCashSettlement, // New API function
} from "../../services/ordersService";
import { recheckPayment } from "../../services/paymentsService";
import { buildDailySettlementLog, businessDateKey, formatDateKey } from "../../utils/settlement";
import { getAllRiders, updateRiderStatus } from "../../services/ridersService";
import { getAllBranches } from "../../services/branchesService";
import { getAllRegions } from "../../services/regionsService";
import { useVisiblePolling } from "../../hooks/useVisiblePolling";

// The server stores paymentMethod as 'cod' / 'sslcommerz' — never the label.
const isOnlineOrder = (ord) =>
  String(ord?.paymentMethod || "cod").toLowerCase() !== "cod";

/**
 * An online order that hasn't been paid for must not look like a normal one:
 * before this, a customer whose payment failed left behind an order that was
 * indistinguishable from a fresh cash order, and the kitchen would cook it.
 * Returns null for anything that needs no warning (COD, or already paid).
 */
const getPaymentAlert = (ord) => {
  if (!isOnlineOrder(ord)) return null;
  const status = ord?.paymentStatus || "Pending";
  if (status === "Paid") return null;
  if (status === "Failed" || status === "Cancelled")
    return { label: `Payment ${status}`, tone: "bg-red-500/10 text-red-500 border-red-500/20" };
  return { label: "Awaiting payment", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
};

const getPaymentStatusColor = (status) => {
  if (status === "Paid") return "bg-emerald-500/10 text-emerald-500";
  if (status === "Failed" || status === "Cancelled") return "bg-red-500/10 text-red-500";
  return "bg-amber-500/10 text-amber-500";
};

const getStatusColor = (status) => {
  switch (status) {
    case "Placed":
    case "pick order":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Accepted":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "Rejected":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "Preparing":
    case "ready to cook":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse";
    case "ready to pick":
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    case "Out for Delivery":
    case "on the way":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "Delivered":
    case "order handover":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
  }
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRiderId, setConfirmingRiderId] = useState(null);
  const [recheckingOrderId, setRecheckingOrderId] = useState(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [adminChatMessage, setAdminChatMessage] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const chatEndRef = useRef(null);
  const currentChat = orders.find((o) => o.id === activeChatOrderId);
  const chatMessagesCount = currentChat?.chatHistory?.length || 0;

  // Live data fetch
  const fetchOrdersAndFleet = () =>
    Promise.all([getAllOrders(), getAllRiders()])
      .then(([ordersData, ridersData]) => {
        setOrders(ordersData || []);
        setRiders(ridersData || []);
        return ordersData || []; // callers may need the fresh list, not just the state update
      })
      .catch((err) => console.error("Orders/fleet sync failed:", err));

  // Initial load
  useEffect(() => {
    Promise.all([getAllOrders(), getAllRiders(), getAllBranches(), getAllRegions()])
      .then(([ordersData, ridersData, branchesData, regionsData]) => {
        setOrders(ordersData || []);
        setRiders(ridersData || []);
        setBranches(branchesData || []);
        setRegions(Array.isArray(regionsData) ? regionsData : []);
      })
      .catch((err) => console.error("Error loading admin orders data:", err))
      .finally(() => setLoading(false));
  }, []);

  useVisiblePolling(fetchOrdersAndFleet, { intervalMs: 20000 });

  useEffect(() => {
    if (chatEndRef.current && activeChatOrderId) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeChatOrderId, chatMessagesCount]);

  // Today's settlement position for one rider.
  // Shares utils/settlement.js with the rider's own dashboard and the server, so
  // all three agree — notably that an order paid online is ৳0 of cash in hand.
  const getRiderPerformanceStats = (riderId) => {
    const todayKey = businessDateKey(new Date());

    // ⚠️ riderId ONLY. Matching on riderName as well showed the admin orders the
    // server would never settle (it filters by riderId), so the figure on screen
    // couldn't be actioned — and two riders sharing a name merged their cash.
    const riderOrders = orders.filter((o) => o.riderId === riderId);

    const log = buildDailySettlementLog(riderOrders);
    const today = log.find((r) => r.dateKey === todayKey);

    // Earlier days that are still owed. Without this the admin could only ever
    // confirm today, so a day missed yesterday had no surface to settle from
    // even though the rider's own dashboard kept offering to submit it.
    // Oldest first: these are shown truncated, and the oldest debt is the one
    // that most needs a Confirm button — newest-first would hide exactly the
    // days that have been stuck longest.
    const pastDue = log
      .filter((r) => r.dateKey !== todayKey && r.delivered > 0 && !r.isSettled)
      .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));

    return {
      dateKey: todayKey,
      pastDue,
      daily: {
        foodDelivered: today?.foodPrice || 0,
        income: today?.riderCommission || 0,
        cashCollected: today?.cashCollected || 0,
        onlinePaid: today?.onlinePaid || 0,
        payable: today?.outstandingNetPayable || 0,
        deliveredCount: today?.delivered || 0,
      },
      cashStatus: {
        hasOrders: (today?.delivered || 0) > 0,
        isSubmittedByRider: !!today?.isSubmitted,
        hasUnsubmittedCash: !today?.isSubmitted,
        isConfirmedByAdmin: !!today?.isSettled,
      },
    };
  };

  // Ask the gateway what really happened to an online payment we never heard
  // about, and settle the order if it confirms one.
  const handleRecheckPayment = async (orderId) => {
    try {
      setRecheckingOrderId(orderId);
      const result = await recheckPayment(orderId);
      const updated = await fetchOrdersAndFleet();
      // keep the open modal in sync with what the re-check just changed
      if (Array.isArray(updated)) {
        const fresh = updated.find((o) => o.id === orderId);
        if (fresh) setSelectedOrderDetails(fresh);
      }
      alert(result?.reason || result?.message || "Re-check complete.");
    } catch (err) {
      alert("Re-check failed: " + (err.response?.data?.message || err.message));
    } finally {
      setRecheckingOrderId(null);
    }
  };

  // Handle Admin Settlement Confirmation.
  // dateKey is the stable YYYY-MM-DD business day the server settles by.
  const handleConfirmCashSettlement = async (riderId, riderName, dateKey) => {
    const confirmSettle = window.confirm(
      `Confirm you have received ${riderName}'s cash for ${formatDateKey(dateKey)}?\n\n` +
        `This marks their collection settled and cannot be undone.`
    );
    if (!confirmSettle) return;

    try {
      setConfirmingRiderId(riderId);
      await confirmRiderCashSettlement(riderId, dateKey);
      alert(`Cash settlement confirmed successfully for ${riderName}!`);
      fetchOrdersAndFleet();
    } catch (err) {
      alert("Failed to confirm cash settlement: " + (err.response?.data?.message || err.message));
    } finally {
      setConfirmingRiderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chatOrder = orders.find((o) => o.id === activeChatOrderId);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchOrdersAndFleet();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleAssignRider = async (orderId, riderId) => {
    const selectedRider = riders.find((r) => r.id === riderId);
    if (!selectedRider) return;
    try {
      await assignRiderToOrder(orderId, riderId, selectedRider.name);
      fetchOrdersAndFleet();
    } catch (err) {
      alert("Failed to assign rider: " + err.message);
    }
  };

  const handleAcceptRider = async (orderId) => {
    try {
      await acceptRiderOrder(orderId);
      fetchOrdersAndFleet();
    } catch (err) {
      alert("Failed to simulate rider acceptance: " + err.message);
    }
  };

  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!adminChatMessage.trim() || !activeChatOrderId) return;

    try {
      const updated = await addChatMessage(activeChatOrderId, {
        sender: "admin",
        senderName: "Barcode Admin",
        text: adminChatMessage.trim(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === activeChatOrderId ? updated : o)),
      );
      setAdminChatMessage("");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Orders & Live Chat
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Monitor incoming food deliveries, update delivery stages, and chat
            with customers/riders.
          </p>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs">
        <h3 className="text-xs font-bold font-display text-neutral-855 dark:text-white mb-3 flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary-500" />
          Riders Fleet Overview & Cash Settlement
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {riders.map((r) => {
            const stats = getRiderPerformanceStats(r.id);
            const { cashStatus } = stats;

            return (
              <div
                key={r.id}
                className="p-3 border border-neutral-150 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-950/20 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="block font-bold text-xs text-neutral-800 dark:text-neutral-100">
                        {r.name}
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        Phone: {r.phone}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        r.status === "Available"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <span className="block text-[10px] font-semibold mt-1 text-neutral-500 dark:text-neutral-300">
                    {r.activeOrders > 0
                      ? `🚴 ${r.activeOrders} active ${r.activeOrders === 1 ? "delivery" : "deliveries"}`
                      : "No active delivery"}
                  </span>

                  {/* Today Cash & Collection Stats */}
                  <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
                    <span className="block text-[9px] uppercase tracking-wider font-bold text-neutral-400">
                      Today's Collection ({stats.daily.deliveredCount} Delivered)
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[10px] bg-neutral-100/60 dark:bg-neutral-950/40 p-2 rounded-lg">
                      <div>
                        <span className="text-neutral-400 text-[9px] block">Cash Collected</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          ৳{stats.daily.cashCollected.toFixed(0)}
                        </span>
                        {stats.daily.onlinePaid > 0 && (
                          <span
                            className="block text-[8px] text-neutral-400 font-semibold"
                            title="Paid online — no cash passed through the rider"
                          >
                            ৳{stats.daily.onlinePaid.toFixed(0)} online
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-400 text-[9px] block">Rider Share</span>
                        <span className="font-bold text-primary-500">
                          ৳{stats.daily.income.toFixed(0)}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1.5 mt-0.5 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex items-baseline justify-between">
                        <span className="text-neutral-400 text-[9px]">
                          {stats.daily.payable < 0 ? "You owe rider" : "Payable to admin"}
                        </span>
                        <span
                          className={`font-black text-[11px] ${
                            stats.daily.payable < 0 ? "text-blue-500" : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          ৳{Math.abs(stats.daily.payable).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Admin Cash Status & Action Trigger */}
                    <div className="pt-1">
                      {!cashStatus.hasOrders ? (
                        <div className="text-[10px] text-neutral-400 font-medium text-center py-1 bg-neutral-100/30 dark:bg-neutral-900/30 rounded-md">
                          No Cash Pending Today
                        </div>
                      ) : cashStatus.isConfirmedByAdmin ? (
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 py-1 rounded-lg">
                          <CheckCircle2 className="w-3 h-3" /> Cash Settled & Confirmed
                        </div>
                      ) : cashStatus.isSubmittedByRider ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                            <span className="flex items-center gap-1">
                              <Clock3 className="w-3 h-3 animate-pulse" /> Submitted by Rider
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleConfirmCashSettlement(r.id, r.name, stats.dateKey)
                            }
                            disabled={confirmingRiderId === r.id}
                            className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            {confirmingRiderId === r.id ? "Confirming..." : "Approve & Mark Succeeded"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 py-1 rounded-lg">
                          <AlertCircle className="w-3 h-3" /> Cash Not Submitted Yet
                        </div>
                      )}

                      {/* Earlier days still owed — otherwise a day missed
                          yesterday could never be confirmed from anywhere. */}
                      {stats.pastDue.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 space-y-1.5">
                          <span className="block text-[9px] uppercase tracking-wider font-bold text-red-400">
                            Earlier days unsettled ({stats.pastDue.length})
                            {stats.pastDue.length > 5 && " · oldest 5 shown"}
                          </span>
                          {stats.pastDue.slice(0, 5).map((day) => (
                            <div key={day.dateKey} className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">
                                {day.date} · ৳{day.outstandingNetPayable.toFixed(0)}
                              </span>
                              <button
                                onClick={() =>
                                  handleConfirmCashSettlement(r.id, r.name, day.dateKey)
                                }
                                disabled={confirmingRiderId === r.id}
                                className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase transition-all active:scale-95 disabled:opacity-50 ${
                                  day.isSubmitted
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300"
                                }`}
                                title={
                                  day.isSubmitted
                                    ? "Rider submitted this day — confirm you received it"
                                    : "Rider has not submitted this day yet"
                                }
                              >
                                {day.isSubmitted ? "Confirm" : "Not submitted"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-150 dark:border-neutral-850">
                  <span className="text-[9px] font-bold text-neutral-400">Rider Status:</span>
                  <select
                    value={r.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      await updateRiderStatus(r.id, newStatus);
                      fetchOrdersAndFleet();
                    }}
                    className="text-[9px] font-bold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded p-0.5 cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table List */}
        <div
          className={`${activeChatOrderId ? "lg:col-span-7" : "lg:col-span-12"} bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs overflow-hidden`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-950/40">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Delivery Status</th>
                  <th className="px-4 py-3">Assigned Rider</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20"
                  >
                    <td
                      onClick={() => setSelectedOrderDetails(ord)}
                      className="px-4 py-3.5 font-bold text-primary-500 hover:text-primary-600 hover:underline cursor-pointer uppercase transition-colors"
                      title="Click to view details"
                    >
                      {ord.id}
                      {getPaymentAlert(ord) && (
                        <span
                          className={`block mt-1 w-fit px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide normal-case ${getPaymentAlert(ord).tone}`}
                        >
                          {getPaymentAlert(ord).label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-semibold text-neutral-855 dark:text-white truncate max-w-[120px]">
                        {ord.user?.name}
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        {ord.user?.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block text-neutral-600 dark:text-neutral-300 font-light truncate max-w-[150px]">
                        {ord.user?.address}
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        {ord.user?.pickArea}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-primary-500">
                      ৳{ord.total?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      {ord.status === "Placed" ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatusChange(ord.id, "Accepted")}
                            className="px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white font-bold text-[8px] uppercase active:scale-95 transition-all shadow-xs flex items-center gap-0.5"
                            title="Accept Order"
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(ord.id, "Rejected")}
                            className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-bold text-[8px] uppercase active:scale-95 transition-all shadow-xs flex items-center gap-0.5"
                            title="Reject Order"
                          >
                            <X className="w-2.5 h-2.5 stroke-[3]" /> Reject
                          </button>
                        </div>
                      ) : ord.status === "Rejected" ? (
                        <span className="px-2 py-1 rounded border border-red-500/25 bg-red-500/10 text-red-500 font-bold text-[9px] uppercase tracking-wide">
                          Rejected
                        </span>
                      ) : (
                        <select
                          value={ord.status}
                          disabled={
                            ord.riderId && ord.riderAcceptStatus !== "accepted"
                          }
                          onChange={(e) =>
                            handleStatusChange(ord.id, e.target.value)
                          }
                          className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                            ord.riderId && ord.riderAcceptStatus !== "accepted"
                              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed"
                              : getStatusColor(ord.status)
                          }`}
                        >
                          <option value="Accepted">Accepted</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={ord.riderId || ""}
                          disabled={ord.status === "Placed" || ord.status === "Rejected" || ord.status === "Delivered"}
                          onChange={(e) =>
                            handleAssignRider(ord.id, e.target.value)
                          }
                          className={`px-2 py-1 rounded-lg border font-bold text-[9px] uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                            ord.status === "Placed" || ord.status === "Rejected" || ord.status === "Delivered"
                              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed"
                              : "bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 cursor-pointer border-neutral-205 dark:border-neutral-800"
                          }`}
                        >
                          <option value="">-- Assign Rider --</option>
                          {riders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.vehicle})
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setActiveChatOrderId(ord.id)}
                        className={`p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:border-primary-500/40 active:scale-95 transition-all ${
                          activeChatOrderId === ord.id
                            ? "bg-primary-500/10 text-primary-500 border-primary-500/30"
                            : ""
                        }`}
                        title="Chat Console"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chat Console Panel */}
        {activeChatOrderId && chatOrder && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-5 flex flex-col h-[560px] bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-xs"
          >
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                  Chat for #{chatOrder.id.toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setActiveChatOrderId(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-neutral-50/20 dark:bg-neutral-950/10">
              {(chatOrder.chatHistory || []).map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="font-bold">{msg.senderName}: </span>
                  <span>{msg.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendAdminMessage}
              className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={adminChatMessage}
                onChange={(e) => setAdminChatMessage(e.target.value)}
                placeholder="Type message as Barcode Admin..."
                className="flex-grow px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* ------------------ Order Details Modal ------------------ */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h2 className="text-lg font-extrabold text-neutral-800 dark:text-neutral-100">
                    Order Details #{selectedOrderDetails.id?.toUpperCase()}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Status:{" "}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(selectedOrderDetails.status)}`}>
                      {selectedOrderDetails.status}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Info */}
              <div className="bg-neutral-50 dark:bg-neutral-950/50 p-3.5 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px]">
                  Customer Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-semibold">{selectedOrderDetails.user?.name || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{selectedOrderDetails.user?.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>
                      {selectedOrderDetails.user?.address}{" "}
                      {selectedOrderDetails.user?.pickArea && `(${selectedOrderDetails.user?.pickArea})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Ordered List */}
              <div>
                <h4 className="font-bold text-neutral-700 dark:text-neutral-300 text-xs mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-primary-500" />
                  Ordered Items ({selectedOrderDetails.items?.length || selectedOrderDetails.cart?.length || 0})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedOrderDetails.items || selectedOrderDetails.cart || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2.5 bg-neutral-50/60 dark:bg-neutral-950/30 rounded-xl text-xs border border-neutral-100 dark:border-neutral-800/60"
                    >
                      <div>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          {item.name}
                        </span>
                        {item.selectedSize && (
                          <span className="text-[10px] font-semibold text-primary-500 ml-1">
                            ({item.selectedSize})
                          </span>
                        )}
                        <span className="block text-[10px] text-neutral-400 mt-0.5">
                          Qty: {item.quantity} × ৳{item.price}
                        </span>
                      </div>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        ৳{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Summary */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
                <div className="flex justify-between text-neutral-500">
                  <span>Payment Method:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase">
                    {selectedOrderDetails.paymentMethod || "Cash on Delivery"}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Payment Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${getPaymentStatusColor(
                      selectedOrderDetails.paymentStatus
                    )}`}
                  >
                    {selectedOrderDetails.paymentStatus || "Pending"}
                  </span>
                </div>

                {/* Recovery path for an online order the gateway never told us
                    about. The server asks SSLCommerz what really happened — it
                    can only settle a payment the gateway itself confirms. */}
                {isOnlineOrder(selectedOrderDetails) &&
                  selectedOrderDetails.paymentStatus !== "Paid" && (
                    <div className="pt-1">
                      <button
                        onClick={() => handleRecheckPayment(selectedOrderDetails.id)}
                        disabled={recheckingOrderId === selectedOrderDetails.id}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary-500/30 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold text-[10px] uppercase tracking-wide hover:bg-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${
                            recheckingOrderId === selectedOrderDetails.id ? "animate-spin" : ""
                          }`}
                        />
                        {recheckingOrderId === selectedOrderDetails.id
                          ? "Checking with gateway…"
                          : "Re-check payment with gateway"}
                      </button>
                      <p className="text-[9px] text-neutral-400 mt-1 text-center normal-case">
                        Use this if the customer says they paid but the order still shows unpaid.
                      </p>
                    </div>
                  )}
                {selectedOrderDetails.deliveryCharge !== undefined && (
                  <div className="flex justify-between text-neutral-500">
                    <span>Delivery Charge:</span>
                    <span>৳{(selectedOrderDetails.deliveryCharge || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-neutral-800 dark:text-neutral-100 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                  <span>Total Amount:</span>
                  <span className="text-primary-500">
                    ৳{(selectedOrderDetails.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
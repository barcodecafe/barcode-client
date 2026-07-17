import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  MessageSquare,
  Send,
  LogOut,
  CheckCircle,
  ShieldAlert,
  Phone,
  MapPin,
  X,
  Clock,
  Package,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAllOrders,
  updateOrderStatus,
  addChatMessage,
  acceptRiderOrder,
  rejectRiderOrder,
} from "../services/ordersService";
import { updateRiderStatus } from "../services/ridersService";

// small stat tile for the rider overview row
const StatTile = ({ icon: Icon, label, value, tint }) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-lg font-extrabold text-neutral-800 dark:text-white leading-none truncate">{value}</p>
      <p className="text-[11px] text-neutral-400 font-medium mt-1">{label}</p>
    </div>
  </div>
);

// Canonical order statuses (must match the server's ORDER_STATUSES).
const getStatusColor = (status) => {
  switch (status) {
    case "Placed":
      return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    case "Accepted":
      return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
    case "Preparing":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    case "Out for Delivery":
      return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
    case "Delivered":
      return "bg-green-500/10 text-green-500 border border-green-500/20";
    case "Rejected":
      return "bg-red-500/10 text-red-500 border border-red-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-500 border border-neutral-500/20";
  }
};

// The rider's next one-click action for an accepted, in-flight order.
// Returns null when there's nothing for the rider to do (delivered/rejected).
const nextDeliveryAction = (status) => {
  if (status === "Out for Delivery") return { label: "Mark Delivered", next: "Delivered" };
  if (status === "Delivered" || status === "Rejected") return null;
  // Placed / Accepted / Preparing → rider heads out with the food
  return { label: "Picked Up — On the Way", next: "Out for Delivery" };
};

// Compact 3-step progress for a rider's delivery: Accepted → On the Way → Delivered.
const DELIVERY_STAGES = ["Accepted", "Out for Delivery", "Delivered"];
const STAGE_LABELS = { Accepted: "Accepted", "Out for Delivery": "On the Way", Delivered: "Delivered" };
const StageStepper = ({ status }) => {
  // Map any pre-dispatch status onto the "Accepted" step.
  const norm = status === "Delivered" || status === "Out for Delivery" ? status : "Accepted";
  const currentIdx = DELIVERY_STAGES.indexOf(norm);
  return (
    <div className="flex items-center gap-1.5">
      {DELIVERY_STAGES.map((stage, i) => {
        const done = i <= currentIdx;
        return (
          <div key={stage} className="flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide ${
                done ? "bg-primary-500/15 text-primary-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
              }`}
            >
              {done && <CheckCircle className="w-2.5 h-2.5" />}
              {STAGE_LABELS[stage]}
            </span>
            {i < DELIVERY_STAGES.length - 1 && (
              <span className={`h-px w-3 ${i < currentIdx ? "bg-primary-500/40" : "bg-neutral-200 dark:bg-neutral-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [riderChatMessage, setRiderChatMessage] = useState("");
  const [availability, setAvailability] = useState(user?.riderStatus || "Available");
  const [updatingAvail, setUpdatingAvail] = useState(false);
  const chatEndRef = useRef(null);

  // keep the toggle in sync with the hydrated user
  useEffect(() => {
    if (user?.riderStatus) setAvailability(user.riderStatus);
  }, [user?.riderStatus]);

  const handleToggleAvailability = async () => {
    if (!user) return;
    const next = availability === "Available" ? "Busy" : "Available";
    setUpdatingAvail(true);
    try {
      await updateRiderStatus(user.id, next);
      setAvailability(next);
    } catch (err) {
      alert("Failed to update availability: " + err.message);
    } finally {
      setUpdatingAvail(false);
    }
  };
  // const activeChatLength = orders.find((o) => o.id === activeChatOrderId)?.chatHistory?.length || 0;
  const currentChat = orders.find((o) => o.id === activeChatOrderId);
  const chatMessagesCount = currentChat?.chatHistory?.length || 0;

  const fetchRiderOrders = () => {
    if (!user) return;
    getAllOrders().then((data) => {
      // Filter orders assigned to this rider
      const assigned = data.filter(
        (o) =>
          o.riderId === user.id ||
          o.riderName?.toLowerCase() === user.name?.toLowerCase(),
      );
      setOrders(assigned);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRiderOrders();
    const interval = setInterval(fetchRiderOrders, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Scroll to bottom of chat
  // useEffect(() => {
  //   if (chatEndRef.current) {
  //     chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [activeChatOrderId, orders]);
  useEffect(() => {
    if (chatEndRef.current && activeChatOrderId) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeChatOrderId, chatMessagesCount]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleAccept = async (orderId) => {
    try {
      await acceptRiderOrder(orderId);
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to accept order: " + err.message);
    }
  };

  const handleReject = async (orderId) => {
    try {
      await rejectRiderOrder(orderId);
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to reject order: " + err.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleSendRiderMessage = async (e) => {
    e.preventDefault();
    if (!riderChatMessage.trim() || !activeChatOrderId) return;

    try {
      const updated = await addChatMessage(activeChatOrderId, {
        sender: "rider",
        senderName: user.name,
        text: riderChatMessage.trim(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === activeChatOrderId ? updated : o)),
      );
      setRiderChatMessage("");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  const chatOrder = orders.find((o) => o.id === activeChatOrderId);

  // Rider not yet approved → show a status screen instead of the order console.
  // (legacy riders / approved riders have status 'none' or 'approved'.)
  const approval = user?.riderApprovalStatus;
  if (approval === "pending" || approval === "rejected") {
    const pending = approval === "pending";
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-8 shadow-xl text-center"
        >
          <div
            className={`w-16 h-16 rounded-2xl ${pending ? "bg-amber-500/10" : "bg-red-500/10"} flex items-center justify-center mx-auto mb-6 ${pending ? "animate-pulse" : ""}`}
          >
            {pending ? (
              <Bike className="w-8 h-8 text-amber-500" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white tracking-tight">
            {pending ? "Application Under Review" : "Application Not Approved"}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
            {pending
              ? `Thanks for signing up, ${user.name}! Your rider profile and documents are being reviewed by our team. Once approved, your delivery orders will appear here automatically.`
              : "Unfortunately your rider application was not approved this time. Please contact the Barcode team if you believe this was a mistake."}
          </p>
          <div
            className={`mt-6 p-3 rounded-2xl border text-xs flex items-center justify-center gap-2 ${pending ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"}`}
          >
            <Clock className="w-4 h-4" />
            Status: <span className="font-bold capitalize">{approval}</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-semibold text-sm transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Overview stats derived from assigned orders (canonical statuses)
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Rejected",
  );
  const pendingAccept = orders.filter((o) => o.riderAcceptStatus === "pending");
  // Rider's delivery earnings = the delivery charge collected on completed orders.
  const earnings = deliveredOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-805 dark:text-neutral-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Dashboard Banner */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-neutral-850 dark:text-white">
                Rider Delivery Portal
              </h1>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 font-medium mt-0.5">
                Welcome back,{" "}
                <span className="text-primary-500 font-bold">{user.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Availability toggle */}
            <button
              onClick={handleToggleAvailability}
              disabled={updatingAvail}
              title="Toggle your availability for new deliveries"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-xs transition-all active:scale-95 disabled:opacity-60 ${
                availability === "Available"
                  ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  availability === "Available" ? "bg-green-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {updatingAvail ? "Updating…" : availability}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-semibold text-xs transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile icon={Package} label="Active Orders" value={activeOrders.length} tint="bg-indigo-500/10 text-indigo-500" />
          <StatTile icon={Clock} label="Pending Accept" value={pendingAccept.length} tint="bg-amber-500/10 text-amber-500" />
          <StatTile icon={CheckCircle} label="Delivered" value={deliveredOrders.length} tint="bg-green-500/10 text-green-500" />
          <StatTile icon={Wallet} label="Delivery Earnings" value={`৳${earnings.toFixed(0)}`} tint="bg-primary-500/10 text-primary-500" />
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Orders List */}
          <div
            className={`${activeChatOrderId ? "lg:col-span-7" : "lg:col-span-12"} space-y-4 transition-all duration-300`}
          >
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
              <h3 className="font-display font-extrabold text-sm text-neutral-850 dark:text-white mb-4 uppercase tracking-wider">
                Assigned Delivery Orders ({orders.length})
              </h3>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs font-semibold">
                    No orders assigned to you yet.
                  </p>
                  <p className="text-[10px] font-light">
                    Assigned orders will pop up here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="border border-neutral-100 dark:border-neutral-850 rounded-xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3.5 flex flex-col justify-between"
                    >
                      {/* Order info row */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div>
                          <span className="font-bold text-xs uppercase text-neutral-805 dark:text-white">
                            Order #{ord.id}
                          </span>
                          <span className="block text-[9px] text-neutral-400 font-light mt-0.5">
                            Placed:{" "}
                            {new Date(ord.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${getStatusColor(ord.status)}`}
                          >
                            {ord.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              ord.riderAcceptStatus === "accepted"
                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                            }`}
                          >
                            {ord.riderAcceptStatus === "accepted"
                              ? "Accepted"
                              : "Pending Accept"}
                          </span>
                        </div>
                      </div>

                      {/* Delivery workflow progress (accepted, in-flight orders) */}
                      {ord.riderAcceptStatus === "accepted" && ord.status !== "Rejected" && (
                        <div className="overflow-x-auto scrollbar-none">
                          <StageStepper status={ord.status} />
                        </div>
                      )}

                      {/* Location & customer info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-b border-neutral-100 dark:border-neutral-850 py-3">
                        <div className="space-y-1.5">
                          <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider">
                            Customer
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-200 text-[11px]">
                            <span>{ord.user.name}</span>
                          </div>
                          {ord.user.phone ? (
                            <a
                              href={`tel:${ord.user.phone}`}
                              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                              title="Call the customer"
                            >
                              <Phone className="w-3 h-3" />
                              {ord.user.phone}
                            </a>
                          ) : (
                            <span className="block text-[10px] text-neutral-400 italic">No phone on file</span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider">
                            Delivery Address
                          </span>
                          <div className="flex items-start gap-1 text-[10px] text-neutral-500">
                            <MapPin className="w-3 h-3 text-primary-500 mt-0.5 shrink-0" />
                            <span className="leading-tight">
                              {ord.user.address || "—"} {ord.user.pickArea ? `(${ord.user.pickArea})` : ""}
                            </span>
                          </div>
                          {(ord.user.address || ord.user.pickArea) && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ord.user.address || ""} ${ord.user.pickArea || ""}`.trim())}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              <MapPin className="w-3 h-3" /> Open in Maps
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Operations / Status controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="font-bold text-xs">
                          Total Invoice:{" "}
                          <span className="text-primary-500">
                            ৳{ord.total.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {ord.riderAcceptStatus === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAccept(ord.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all"
                              >
                                Accept Job
                              </button>
                              <button
                                onClick={() => handleReject(ord.id)}
                                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all"
                              >
                                Reject Job
                              </button>
                            </div>
                          ) : ord.status === "Delivered" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-xs">
                              <CheckCircle className="w-4 h-4" /> Delivered
                            </span>
                          ) : (
                            (() => {
                              const action = nextDeliveryAction(ord.status);
                              return action ? (
                                <button
                                  onClick={() => handleStatusChange(ord.id, action.next)}
                                  className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all"
                                >
                                  {action.label}
                                </button>
                              ) : null;
                            })()
                          )}

                          <button
                            onClick={() =>
                              setActiveChatOrderId(
                                ord.id === activeChatOrderId ? null : ord.id,
                              )
                            }
                            className={`p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:border-primary-500/40 active:scale-95 transition-all ${
                              activeChatOrderId === ord.id
                                ? "bg-primary-500/10 text-primary-500 border-primary-500/30"
                                : ""
                            }`}
                            title="Chat Console"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Console Panel */}
          <AnimatePresence>
            {activeChatOrderId && chatOrder && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-5 flex flex-col h-[560px] bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                      Chat for #{chatOrder.id.toUpperCase()}
                    </h3>
                    <span className="block text-[9px] text-neutral-400">
                      Customer: {chatOrder.user.name} ({chatOrder.user.phone})
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveChatOrderId(null)}
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-650"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-neutral-50/20 dark:bg-neutral-950/10">
                  {chatOrder.chatHistory.map((msg, i) => {
                    const isSelf =
                      msg.sender === "rider" && msg.senderName === user.name;
                    const isSystem = msg.senderName === "System";
                    const isAdmin =
                      msg.sender === "admin" && msg.senderName !== "System";
                    const isCustomer = msg.sender === "customer";

                    let alignClass = "justify-start";
                    let bubbleClass =
                      "bg-white dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-805 dark:text-neutral-100 rounded-2xl rounded-tl-none";
                    let labelColor = "text-neutral-400";

                    if (isSelf) {
                      alignClass = "justify-end";
                      bubbleClass =
                        "bg-primary-500 text-white rounded-2xl rounded-tr-none shadow-md shadow-primary-500/10";
                      labelColor = "text-primary-500";
                    } else if (isSystem) {
                      return (
                        <div key={i} className="flex justify-center my-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-neutral-150 dark:bg-neutral-800 text-[9px] text-neutral-500 dark:text-neutral-400 font-semibold">
                            {msg.text}
                          </span>
                        </div>
                      );
                    } else if (isAdmin) {
                      bubbleClass =
                        "bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-neutral-805 dark:text-neutral-150 rounded-2xl rounded-tl-none";
                      labelColor = "text-indigo-500";
                    } else if (isCustomer) {
                      bubbleClass =
                        "bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-neutral-805 dark:text-neutral-150 rounded-2xl rounded-tl-none";
                      labelColor = "text-emerald-505";
                    }

                    return (
                      <div key={i} className={`flex ${alignClass}`}>
                        <div className="max-w-[85%] flex flex-col gap-1">
                          {!isSelf && (
                            <span
                              className={`text-[10px] font-bold ${labelColor} px-1.5`}
                            >
                              {msg.senderName} ({msg.sender.toUpperCase()})
                            </span>
                          )}
                          <div
                            className={`px-3 py-2.5 text-xs leading-normal ${bubbleClass}`}
                          >
                            <p>{msg.text}</p>
                            <span
                              className={`block text-[9px] text-right mt-1 font-light ${isSelf ? "text-white/60" : "text-neutral-400"}`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Form */}
                <form
                  onSubmit={handleSendRiderMessage}
                  className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={riderChatMessage}
                    onChange={(e) => setRiderChatMessage(e.target.value)}
                    placeholder="Type message to Customer/Admin..."
                    className="flex-grow px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-850 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={!riderChatMessage.trim()}
                    className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all shadow-md shadow-primary-500/10"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;


// before paste 
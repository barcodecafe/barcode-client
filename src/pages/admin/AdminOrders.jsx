import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  MessageSquare,
  Send,
  X,
  Check,
  BellRing,
} from "lucide-react";
import {
  getAllOrders,
  updateOrderStatus,
  addChatMessage,
  assignRiderToOrder,
} from "../../services/ordersService";
import { getAllRiders } from "../../services/ridersService";
import { getAllBranches } from "../../services/branchesService";
import { getAllRegions } from "../../services/regionsService";

// Socket Client Connection Import
import { socket } from "../../services/socket";

// 💡 Separated Invoice Modal Component Import
import { OrderInvoice } from "./OrderInvoice";

// ⚡ ডুপ্লিকেট অর্ডার রিমুভ করার হেলপার
const deduplicateOrders = (orderList) => {
  if (!Array.isArray(orderList)) return [];
  const seen = new Set();
  return orderList.filter((item) => {
    const id = item?.id || item?._id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// 🎯 Order ID সংক্ষেপ করার হেলপার ফাংশন (যেমন: 6A6D...C7F90)
const formatShortOrderId = (id) => {
  if (!id) return "";
  const strId = String(id).toUpperCase();
  if (strId.length <= 10) return strId;
  return `${strId.slice(0, 4)}...${strId.slice(-5)}`;
};

// 🎯 পেমেন্ট ব্যাজ লজিক
const getPaymentBadge = (ord) => {
  const pm = String(ord?.paymentMethod || "cod").toLowerCase();
  const ps = String(ord?.paymentStatus || "").toLowerCase();
  const st = String(ord?.status || ord?.deliveryStatus || "").toUpperCase();
  const isPaid = ord?.isPaid || ps === "paid";
  const isRejected = st === "REJECTED";

  if (pm === "cod") {
    if (isRejected) {
      return {
        label: "CANCELLED",
        tone: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20 font-bold",
      };
    }
    if (isPaid || st === "DELIVERED") {
      return {
        label: "PAID (COD)",
        tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold",
      };
    }
    return {
      label: "AWAITING PAYMENT",
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold",
    };
  }

  if (isRejected) {
    if (ps === "refunded") {
      return {
        label: "REFUNDED",
        tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold",
      };
    }
    return {
      label: "REFUND REQUIRED",
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-extrabold animate-pulse",
    };
  }

  if (isPaid) {
    return {
      label: "PAID",
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold",
    };
  }

  if (ps === "failed" || ps === "cancelled") {
    return {
      label: "PAYMENT FAILED",
      tone: "bg-red-500/10 text-red-500 border-red-500/20 font-bold",
    };
  }

  return {
    label: "AWAITING PAYMENT",
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold",
  };
};

// 🟡 Delivery Status Color Handler
const getStatusColor = (status) => {
  switch (status?.toString().toUpperCase()) {
    case "PENDING":
    case "PLACED":
    case "AWAITING PAYMENT":
    case "AWAITING_PAYMENT":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "ACCEPTED":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "REJECTED":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "PREPARING":
    case "READY TO COOK":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse";
    case "READY TO PICK":
    case "FOOD READY":
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-bounce";
    case "OUT FOR DELIVERY":
    case "ON THE WAY":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "DELIVERED":
    case "ORDER HANDOVER":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
  }
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [, setBranches] = useState([]);
  const [, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [adminChatMessage, setAdminChatMessage] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const chatEndRef = useRef(null);
  const currentChat = orders.find((o) => (o.id || o._id) === activeChatOrderId);
  const chatMessagesCount = currentChat?.chatHistory?.length || 0;

  const fetchOrdersAndFleet = () =>
    Promise.all([getAllOrders(), getAllRiders()])
      .then(([ordersData, ridersData]) => {
        setOrders(deduplicateOrders(ordersData || []));
        setRiders(ridersData || []);
        window.dispatchEvent(new CustomEvent("order_updated"));
        return ordersData || [];
      })
      .catch((err) => console.error("Orders/fleet sync failed:", err));

  useEffect(() => {
    Promise.all([
      getAllOrders(),
      getAllRiders(),
      getAllBranches(),
      getAllRegions(),
    ])
      .then(([ordersData, ridersData, branchesData, regionsData]) => {
        setOrders(deduplicateOrders(ordersData || []));
        setRiders(ridersData || []);
        setBranches(branchesData || []);
        setRegions(Array.isArray(regionsData) ? regionsData : []);
        window.dispatchEvent(new CustomEvent("order_updated"));
      })
      .catch((err) => console.error("Error loading admin orders data:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleNewOrderIncoming = (newOrder) => {
      setOrders((prev) => {
        const newId = newOrder?.id || newOrder?._id;
        if (!newId) return prev;
        const exists = prev.some((o) => (o.id || o._id) === newId);
        if (exists) {
          return prev.map((o) => ((o.id || o._id) === newId ? newOrder : o));
        }
        return [newOrder, ...prev];
      });
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId: newOrder?.id || newOrder?._id },
        }),
      );
    };

    socket.on("order_created", handleNewOrderIncoming);
    socket.on("admin_new_order", handleNewOrderIncoming);

    socket.on("order_updated", (updatedOrder) => {
      const updatedId = updatedOrder?.id || updatedOrder?._id;
      setOrders((prev) =>
        prev.map((o) => ((o.id || o._id) === updatedId ? updatedOrder : o)),
      );
      setSelectedOrderDetails((prev) =>
        (prev?.id || prev?._id) === updatedId ? updatedOrder : prev,
      );
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId: updatedId, id: updatedId },
        }),
      );
    });

    socket.on("pending_count_updated", () => {
      window.dispatchEvent(new CustomEvent("order_updated"));
    });

    socket.on("rider_updated", (updatedRider) => {
      setRiders((prev) =>
        prev.map((r) => (r.id === updatedRider.id ? updatedRider : r)),
      );
    });

    socket.on("new_chat_message", ({ orderId, message }) => {
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          if ((ord.id || ord._id) === orderId) {
            const existingHistory = ord.chatHistory || [];

            const isDuplicate = existingHistory.some(
              (m) =>
                m.text === message.text &&
                m.sender === message.sender &&
                Math.abs(
                  new Date(m.timestamp || Date.now()) -
                    new Date(message.timestamp || Date.now()),
                ) < 3000,
            );

            if (isDuplicate) return ord;

            return {
              ...ord,
              chatHistory: [...existingHistory, message],
            };
          }
          return ord;
        }),
      );
    });

    return () => {
      socket.off("order_created", handleNewOrderIncoming);
      socket.off("admin_new_order", handleNewOrderIncoming);
      socket.off("order_updated");
      socket.off("pending_count_updated");
      socket.off("rider_updated");
      socket.off("new_chat_message");
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current && activeChatOrderId) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeChatOrderId, chatMessagesCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);

      socket.emit("order_status_updated", {
        orderId,
        id: orderId,
        status: newStatus,
      });
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId, id: orderId, status: newStatus },
        }),
      );

      fetchOrdersAndFleet();

      const shortId = orderId ? orderId.slice(-6).toUpperCase() : "";

      if (newStatus === "Accepted" || newStatus === "ACCEPTED") {
        toast.success(`Order #${shortId} has been Accepted!`, {
          duration: 3000,
          position: "top-right",
          style: {
            background: "#10B981",
            color: "#FFFFFF",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
      } else if (newStatus === "Rejected" || newStatus === "REJECTED") {
        toast.error(`Order #${shortId} has been Rejected!`, {
          duration: 3000,
          position: "top-right",
          style: {
            background: "#EF4444",
            color: "#FFFFFF",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
      } else {
        toast(`Order status updated to ${newStatus}`, {
          icon: "🔄",
          position: "top-right",
        });
      }
    } catch (err) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const handleAssignRider = async (orderId, riderId) => {
    const selectedRider = riders.find((r) => r.id === riderId);
    if (!selectedRider) return;
    try {
      await assignRiderToOrder(orderId, riderId, selectedRider.name);

      const payload = {
        id: orderId,
        orderId: orderId,
        riderId: riderId,
        riderName: selectedRider.name,
      };

      socket.emit("rider_order_assigned", payload);
      socket.emit("order_assigned", payload);
      socket.emit("order_updated", payload);

      toast.success(`Assigned to ${selectedRider.name}`);
      fetchOrdersAndFleet();
    } catch (err) {
      toast.error("Failed to assign rider: " + err.message);
    }
  };

  const handleSendAdminMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText || adminChatMessage;
    if (!textToSend.trim() || !activeChatOrderId) return;

    try {
      const messagePayload = {
        sender: "admin",
        senderName: "Barcode Admin",
        text: textToSend.trim(),
      };

      const updated = await addChatMessage(activeChatOrderId, messagePayload);

      socket.emit("send_message", {
        orderId: activeChatOrderId,
        message: messagePayload,
      });

      setOrders((prev) =>
        prev.map((o) => ((o.id || o._id) === activeChatOrderId ? updated : o)),
      );
      if (!customText) setAdminChatMessage("");
      toast.success("Message sent!");
    } catch (err) {
      toast.error("Failed to send message: " + err.message);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Toaster />

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Orders & Live Chat
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Monitor incoming food deliveries, update delivery stages, and chat with customers/riders.
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-6">
        {/* Table List Container */}
        <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-xs text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900 sticky top-0 z-20 shadow-xs">
                  <th className="px-2.5 py-3.5">Order ID</th>
                  <th className="px-2.5 py-3.5">Customer</th>
                  <th className="px-2.5 py-3.5">Address</th>
                  <th className="px-2.5 py-3.5">Total Amount</th>
                  <th className="px-2.5 py-3.5">Order Action</th>
                  <th className="px-2.5 py-3.5">Delivery Status</th>
                  <th className="px-2.5 py-3.5">Assigned Rider</th>
                  <th className="px-2.5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const ordId = ord.id || ord._id;
                  const currentStatus = String(ord.status || "").toUpperCase();

                  const isPendingUnhandled =
                    currentStatus === "PLACED" ||
                    currentStatus === "PENDING" ||
                    currentStatus === "AWAITING PAYMENT" ||
                    currentStatus === "AWAITING_PAYMENT" ||
                    !ord.status;

                  const isRejected = currentStatus === "REJECTED";
                  const badge = getPaymentBadge(ord);

                  return (
                    <tr
                      key={ordId}
                      className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20 transition-colors"
                    >
                      {/* 🎯 Order ID Column */}
                      <td
                        onClick={() => setSelectedOrderDetails(ord)}
                        className="px-2.5 py-3 font-bold text-primary-500 hover:text-primary-600 hover:underline cursor-pointer uppercase transition-colors whitespace-nowrap"
                        title={ordId}
                      >
                        {formatShortOrderId(ordId)}
                        {badge && (
                          <span
                            className={`block mt-0.5 w-fit px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wide ${badge.tone}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </td>

                      {/* Customer Column */}
                      <td className="px-2.5 py-3">
                        <span className="block font-semibold text-neutral-850 dark:text-white truncate max-w-[110px]">
                          {ord.user?.name}
                        </span>
                        <span className="block text-[10px] text-neutral-400 mt-0.5">
                          {ord.user?.phone}
                        </span>
                      </td>

                      {/* Address Column */}
                      <td className="px-2.5 py-3">
                        <span
                          className="block text-neutral-600 dark:text-neutral-300 font-light truncate max-w-[120px]"
                          title={ord.user?.address}
                        >
                          {ord.user?.address}
                        </span>
                        <span className="block text-[10px] text-neutral-400 mt-0.5 truncate max-w-[120px]">
                          {ord.user?.pickArea}
                        </span>
                      </td>

                      {/* Total Amount Column */}
                      <td className="px-2.5 py-3 font-bold text-primary-500 whitespace-nowrap">
                        ৳{ord.total?.toFixed(2)}
                      </td>

                      {/* Order Action Column */}
                      <td className="px-2.5 py-3 whitespace-nowrap">
                        {isPendingUnhandled ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleStatusChange(ordId, "Accepted")
                              }
                              className="px-2 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] uppercase active:scale-95 transition-all shadow-xs flex items-center gap-0.5 cursor-pointer"
                              title="Accept Order"
                            >
                              <Check className="w-3 h-3 stroke-[3]" /> Accept
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(ordId, "Rejected")
                              }
                              className="px-2 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] uppercase active:scale-95 transition-all shadow-xs flex items-center gap-0.5 cursor-pointer"
                              title="Reject Order"
                            >
                              <X className="w-3 h-3 stroke-[3]" /> Reject
                            </button>
                          </div>
                        ) : isRejected ? (
                          <span className="px-2 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-500 font-bold text-[9px] uppercase tracking-wide">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wide">
                            Accepted
                          </span>
                        )}
                      </td>

                      {/* Delivery Status Column */}
                      <td className="px-2.5 py-3 whitespace-nowrap">
                        {isPendingUnhandled ? (
                          <span className="px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wide inline-block">
                            Pending
                          </span>
                        ) : isRejected ? (
                          <span className="px-2 py-1 rounded border border-neutral-500/20 bg-neutral-500/10 text-neutral-400 font-bold text-[9px] uppercase tracking-wide inline-block">
                            Cancelled
                          </span>
                        ) : (
                          <div>
                            <select
                              value={
                                ord.riderAcceptStatus === "accepted" &&
                                (ord.status === "Accepted" ||
                                  ord.status === "ACCEPTED")
                                  ? "Preparing"
                                  : ord.status
                              }
                              disabled={
                                !ord.riderId ||
                                ord.riderAcceptStatus !== "accepted"
                              }
                              onChange={(e) =>
                                handleStatusChange(ordId, e.target.value)
                              }
                              className={`px-1.5 py-1 rounded-lg border font-bold text-[10px] uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                                !ord.riderId ||
                                ord.riderAcceptStatus !== "accepted"
                                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-75"
                                  : `${getStatusColor(
                                      ord.riderAcceptStatus === "accepted" &&
                                        (ord.status === "Accepted" ||
                                          ord.status === "ACCEPTED")
                                        ? "Preparing"
                                        : ord.status,
                                    )} cursor-pointer`
                              }`}
                            >
                              <option value="Accepted">Accepted</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Ready to Pick">
                                Ready to Pick
                              </option>
                              <option value="Out for Delivery">
                                Out for Delivery
                              </option>
                              <option value="Delivered">Delivered</option>
                            </select>

                            {(!ord.riderId ||
                              ord.riderAcceptStatus !== "accepted") && (
                              <span className="block text-[9px] text-orange-500 font-bold mt-0.5 tracking-tight">
                                {!ord.riderId
                                  ? "Assign Rider First"
                                  : "Awaiting Rider Accept"}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Assigned Rider Column */}
                      <td className="px-2.5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <select
                            value={ord.riderId || ""}
                            disabled={
                              isPendingUnhandled ||
                              isRejected ||
                              ord.status === "Delivered"
                            }
                            onChange={(e) =>
                              handleAssignRider(ordId, e.target.value)
                            }
                            className={`px-1.5 py-1 rounded-lg border font-bold text-[9px] uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 max-w-[125px] ${
                              isPendingUnhandled ||
                              isRejected ||
                              ord.status === "Delivered"
                                ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed"
                                : "bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 cursor-pointer border-neutral-200 dark:border-neutral-800"
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

                      {/* Actions Column */}
                      <td className="px-2.5 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setActiveChatOrderId(ordId)}
                          className={`p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:border-primary-500/40 active:scale-95 transition-all cursor-pointer ${
                            activeChatOrderId === ordId
                              ? "bg-primary-500/10 text-primary-500 border-primary-500/30"
                              : ""
                          }`}
                          title="Open Live Chat Console"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 💬 Live Chat Modal Popup */}
      <AnimatePresence>
        {activeChatOrderId && currentChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg flex flex-col h-[580px] bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                    Live Chat for Order #
                    {(currentChat.id || currentChat._id)?.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Customer: {currentChat.user?.name || "Guest"} (
                    {currentChat.user?.phone})
                  </p>
                </div>
                <button
                  onClick={() => setActiveChatOrderId(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Kitchen Alert */}
              <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5" /> Quick Kitchen Alert:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleSendAdminMessage(
                      null,
                      "🔔 Food is Ready / Ready to Pick! Please collect from the restaurant.",
                    );
                    handleStatusChange(
                      currentChat.id || currentChat._id,
                      "Ready to Pick",
                    );
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Set Ready & Notify Rider
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-neutral-950/20">
                {(currentChat.chatHistory || []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-xs gap-1">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  (currentChat.chatHistory || []).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === "admin" ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-neutral-400 mb-0.5 px-1">
                        {msg.senderName}
                      </span>
                      <div
                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${
                          msg.sender === "admin"
                            ? "bg-primary-500 text-white rounded-br-none"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => handleSendAdminMessage(e, null)}
                className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={adminChatMessage}
                  onChange={(e) => setAdminChatMessage(e.target.value)}
                  placeholder="Type message as Barcode Admin..."
                  className="flex-grow px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🧾 Order Details & Official Barcode Invoice Modal (Separated Component) */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <OrderInvoice
            selectedOrderDetails={selectedOrderDetails}
            onClose={() => setSelectedOrderDetails(null)}
            onOrderUpdated={fetchOrdersAndFleet}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
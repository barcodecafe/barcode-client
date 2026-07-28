import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Phone,
  MapPin,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllOrders,
  updateOrderStatus,
  addChatMessage,
  acceptRiderOrder,
  rejectRiderOrder,
} from "../../services/ordersService";

const getStatusColor = (status) => {
  switch (status) {
    case "Placed":
      return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    case "Accepted":
      return "bg-green-500/10 text-green-500 border border-green-500/20";
    case "Preparing":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    case "Ready to Pick":
      return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 animate-bounce";
    case "Out for Delivery":
      return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
    case "Delivered":
      return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    case "Rejected":
      return "bg-red-500/10 text-red-500 border border-red-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-500 border border-neutral-500/20";
  }
};

export const RiderOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [riderChatMessage, setRiderChatMessage] = useState("");

  const chatEndRef = useRef(null);
  
  const chatOrder = orders.find((o) => (o._id || o.id) === activeChatOrderId);
  const chatMessagesCount = chatOrder?.chatHistory?.length || 0;

  const fetchRiderOrders = useCallback(() => {
    if (!user) return;
    getAllOrders()
      .then((data) => {
        const assigned = (data || []).filter(
          (o) =>
            o.riderId === user.id ||
            o.riderId === user._id ||
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
    const interval = setInterval(fetchRiderOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchRiderOrders]);

  useEffect(() => {
    if (chatEndRef.current && activeChatOrderId) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeChatOrderId, chatMessagesCount]);

  const handleAccept = async (orderId) => {
    try {
      await acceptRiderOrder(orderId);
      await updateOrderStatus(orderId, "Preparing");
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to accept order: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (orderId) => {
    try {
      await rejectRiderOrder(orderId);
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to reject order: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSendRiderMessage = async (e) => {
    e.preventDefault();
    if (!riderChatMessage.trim() || !activeChatOrderId) return;

    try {
      const updated = await addChatMessage(activeChatOrderId, {
        text: riderChatMessage.trim(),
      });
      setOrders((prev) =>
        prev.map((o) => ((o._id || o.id) === activeChatOrderId ? updated : o))
      );
      setRiderChatMessage("");
    } catch (err) {
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
    }
  };

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
          Assigned Orders
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
          Accept jobs, update order delivery status, and communicate live with customers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Orders List */}
        <div
          className={`${
            activeChatOrderId ? "lg:col-span-7" : "lg:col-span-12"
          } space-y-4 transition-all duration-300`}
        >
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">
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
                {orders.map((ord) => {
                  const safeOrderId = ord._id || ord.id;

                  return (
                    <div
                      key={safeOrderId}
                      className="border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div>
                          <span className="font-bold text-xs uppercase text-neutral-800 dark:text-white">
                            Order #{safeOrderId}
                          </span>
                          <span className="block text-[9px] text-neutral-400 font-light mt-0.5">
                            Placed: {new Date(ord.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${getStatusColor(
                              ord.status
                            )}`}
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-b border-neutral-100 dark:border-neutral-800 py-3">
                        <div className="space-y-1.5">
                          <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider">
                            Customer
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-200 text-[11px]">
                            <span>{ord.deliveryPhone ? ord.deliveryPhone : ord.user?.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                            <Phone className="w-3 h-3 text-rose-500" />
                            <span>{ord.deliveryPhone || ord.user?.phone}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider">
                            Delivery Address
                          </span>
                          <div className="flex items-start gap-1 text-[10px] text-neutral-500">
                            <MapPin className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                            <span className="leading-tight">
                              {ord.deliveryAddress || ord.user?.address} ({ord.deliveryArea || ord.user?.pickArea})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="font-bold text-xs">
                          Total Invoice:{" "}
                          <span className="text-rose-500">
                            ৳{ord.total?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ord.riderAcceptStatus === "pending" || !ord.riderAcceptStatus ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAccept(safeOrderId)}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                              >
                                Accept Job
                              </button>
                              <button
                                onClick={() => handleReject(safeOrderId)}
                                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                              >
                                Reject Job
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  handleStatusChange(safeOrderId, e.target.value)
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 font-bold text-[10px] uppercase cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500"
                              >
                                <option value="Preparing">Preparing</option>
                                <option value="Ready to Pick">Ready to Pick</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            </div>
                          )}

                          <button
                            onClick={() =>
                              setActiveChatOrderId(
                                safeOrderId === activeChatOrderId ? null : safeOrderId
                              )
                            }
                            className={`p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-rose-500 hover:border-rose-500/40 active:scale-95 transition-all cursor-pointer ${
                              activeChatOrderId === safeOrderId
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                : ""
                            }`}
                            title="Chat Console"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Console Side Panel */}
        <AnimatePresence>
          {activeChatOrderId && chatOrder && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-5 flex flex-col h-[500px] bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl overflow-hidden shadow-xs"
            >
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-neutral-800 dark:text-white">
                    Chat for #{chatOrder._id || chatOrder.id}
                  </h3>
                  <span className="block text-[9px] text-neutral-400">
                    Customer: {chatOrder.deliveryPhone || chatOrder.user?.phone}
                  </span>
                </div>
                <button
                  onClick={() => setActiveChatOrderId(null)}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-neutral-50/20 dark:bg-neutral-950/10">
                {(chatOrder.chatHistory || []).map((msg, i) => {
                  const isSelf =
                    msg.sender === "rider" && msg.senderName === user.name;
                  const isSystem = msg.senderName === "System";
                  const isAdmin =
                    msg.sender === "admin" && msg.senderName !== "System";
                  const isCustomer = msg.sender === "customer";

                  let alignClass = "justify-start";
                  let bubbleClass =
                    "bg-white dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-100 rounded-2xl rounded-tl-none";
                  let labelColor = "text-neutral-400";

                  if (isSelf) {
                    alignClass = "justify-end";
                    bubbleClass =
                      "bg-rose-500 text-white rounded-2xl rounded-tr-none shadow-md shadow-rose-500/10";
                    labelColor = "text-rose-500";
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
                      "bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-neutral-800 dark:text-neutral-150 rounded-2xl rounded-tl-none";
                    labelColor = "text-indigo-500";
                  } else if (isCustomer) {
                    bubbleClass =
                      "bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-neutral-800 dark:text-neutral-150 rounded-2xl rounded-tl-none";
                    labelColor = "text-emerald-500";
                  }

                  return (
                    <div key={i} className={`flex ${alignClass}`}>
                      <div className="max-w-[85%] flex flex-col gap-1">
                        {!isSelf && (
                          <span className={`text-[10px] font-bold ${labelColor} px-1.5`}>
                            {msg.senderName} ({msg.sender?.toUpperCase()})
                          </span>
                        )}
                        <div className={`px-3 py-2.5 text-xs leading-normal ${bubbleClass}`}>
                          <p>{msg.text}</p>
                          <span
                            className={`block text-[9px] text-right mt-1 font-light ${
                              isSelf ? "text-white/60" : "text-neutral-400"
                            }`}
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

              <form
                onSubmit={handleSendRiderMessage}
                className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={riderChatMessage}
                  onChange={(e) => setRiderChatMessage(e.target.value)}
                  placeholder="Type message to Customer/Admin..."
                  className="grow px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-850 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <button
                  type="submit"
                  disabled={!riderChatMessage.trim()}
                  className="p-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all shadow-md shadow-rose-500/10 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RiderOrders;
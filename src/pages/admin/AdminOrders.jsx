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
} from "lucide-react";
import {
  getAllOrders,
  updateOrderStatus,
  addChatMessage,
  assignRiderToOrder,
  acceptRiderOrder,
  rejectRiderOrder,
} from "../../services/ordersService";
import { getAllRiders, updateRiderStatus } from "../../services/ridersService";
import { getAllBranches } from "../../services/branchesService";
import { getAllRegions } from "../../services/regionsService";
import { getAllFoods } from "../../services/foodsService";

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
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [adminChatMessage, setAdminChatMessage] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const chatEndRef = useRef(null);
  const currentChat = orders.find((o) => o.id === activeChatOrderId);
  const chatMessagesCount = currentChat?.chatHistory?.length || 0;

  const fetchOrdersAndFleet = () => {
    Promise.all([getAllOrders(), getAllRiders(), getAllBranches(), getAllFoods(), getAllRegions()]).then(
      ([ordersData, ridersData, branchesData, foodsData, regionsData]) => {
        setOrders(ordersData);
        setRiders(ridersData);
        setBranches(branchesData);
        setFoods(foodsData);
        setRegions(Array.isArray(regionsData) ? regionsData : []);
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    fetchOrdersAndFleet();
    const interval = setInterval(() => {
      Promise.all([getAllOrders(), getAllRiders(), getAllBranches(), getAllFoods(), getAllRegions()]).then(
        ([ordersData, ridersData, branchesData, foodsData, regionsData]) => {
          setOrders(ordersData);
          setRiders(ridersData);
          setBranches(branchesData);
          setFoods(foodsData);
          setRegions(Array.isArray(regionsData) ? regionsData : []);
        },
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
        <h3 className="text-xs font-bold font-display text-neutral-850 dark:text-white mb-3 flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary-500" />
          Riders Fleet Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {riders.map((r) => (
            <div
              key={r.id}
              className="p-3 border border-neutral-150 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-950/20 flex flex-col justify-between"
            >
              <div>
                <span className="block font-bold text-xs text-neutral-800 dark:text-neutral-100">
                  {r.name}
                </span>
                <span className="block text-[10px] text-neutral-400 mt-0.5">
                  Phone: {r.phone}
                </span>
                <span className="block text-[10px] text-neutral-400 mt-0.5">
                  Vehicle: {r.vehicle}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-150 dark:border-neutral-850">
                <span
                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                    r.status === "Available"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {r.status}
                </span>
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
          ))}
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
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-semibold text-neutral-850 dark:text-white truncate max-w-[120px]">
                        {ord.user.name}
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        {ord.user.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block text-neutral-600 dark:text-neutral-300 font-light truncate max-w-[150px]">
                        {ord.user.address}
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        {ord.user.pickArea}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-primary-500">
                      ৳{ord.total.toFixed(2)}
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
                      {ord.riderId && ord.riderAcceptStatus !== "accepted" && ord.status !== "Rejected" && (
                        <span className="block text-[9px] text-orange-500 font-bold mt-1.5 tracking-tight">
                          Awaiting Accept
                        </span>
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
                        {ord.riderId && ord.status !== "Rejected" && ord.status !== "Delivered" && (
                          <div className="shrink-0 flex items-center">
                            {ord.riderAcceptStatus === "pending" ? (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => handleAcceptRider(ord.id)}
                                  className="px-1 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[8px] uppercase active:scale-95 transition-all shadow-xs"
                                  title="Simulate Rider Accept"
                                >
                                  Accept?
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await rejectRiderOrder(ord.id);
                                      fetchOrdersAndFleet();
                                    } catch (err) {
                                      alert("Failed to reject rider: " + err.message);
                                    }
                                  }}
                                  className="px-1 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white font-bold text-[8px] uppercase active:scale-95 transition-all shadow-xs"
                                  title="Simulate Rider Reject"
                                >
                                  Reject?
                                </button>
                              </div>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[8px] uppercase">
                                Accepted
                              </span>
                            )}
                          </div>
                        )}
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
                const isAdmin =
                  msg.sender === "admin" && msg.senderName !== "System";
                const isSystem = msg.senderName === "System";
                const isRider = msg.sender === "rider";

                let alignClass = "justify-start";
                let bubbleClass =
                  "bg-white dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-100 rounded-2xl rounded-tl-none";
                let labelColor = "text-neutral-400";

                if (isAdmin) {
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
                } else if (isRider) {
                  bubbleClass =
                    "bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-neutral-855 dark:text-neutral-150 rounded-2xl rounded-tl-none";
                  labelColor = "text-amber-500";
                }

                return (
                  <div key={i} className={`flex ${alignClass}`}>
                    <div className="max-w-[85%] flex flex-col gap-1">
                      {!isAdmin && (
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
                          className={`block text-[9px] text-right mt-1 font-light ${isAdmin ? "text-white/60" : "text-neutral-400"}`}
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
              onSubmit={handleSendAdminMessage}
              className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={adminChatMessage}
                onChange={(e) => setAdminChatMessage(e.target.value)}
                placeholder="Type message as Barcode Admin..."
                className="flex-grow px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-850 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={!adminChatMessage.trim()}
                className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all shadow-md shadow-primary-500/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-base text-neutral-850 dark:text-white uppercase flex items-center gap-1.5">
                    Order Items: #{selectedOrderDetails.id}
                  </h3>
                  <span className="block text-[10px] text-neutral-400 mt-0.5">
                    Placed on{" "}
                    {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Customer, Shipping, and Billing Address Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/10 rounded-xl space-y-1.5">
                    <span className="block text-[9px] font-bold text-neutral-450 uppercase tracking-wider">
                      Customer Details
                    </span>
                    <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-100">
                      {selectedOrderDetails.user.name}
                    </span>
                    <span className="block text-[11px] text-neutral-500">
                      Phone: {selectedOrderDetails.user.phone}
                    </span>
                    <span className="block text-[11px] text-neutral-500">
                      Email: {selectedOrderDetails.user.email || "N/A"}
                    </span>
                  </div>

                  <div className="p-3 border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/10 rounded-xl space-y-1.5">
                    <span className="block text-[9px] font-bold text-neutral-450 uppercase tracking-wider">
                      {selectedOrderDetails.regionId ? "Delivery Region" : "Branch Details"}
                    </span>
                    <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-100">
                      {selectedOrderDetails.regionId
                        ? regions.find((r) => r.id === selectedOrderDetails.regionId)?.name ||
                          `Region #${selectedOrderDetails.regionId}`
                        : branches.find((b) => b.id === selectedOrderDetails.branchId)?.name ||
                          `Branch #${selectedOrderDetails.branchId}`}
                    </span>
                    <span className="block text-[11px] text-neutral-500 truncate">
                      {selectedOrderDetails.deliveryArea
                        ? `Area: ${selectedOrderDetails.deliveryArea}`
                        : branches.find((b) => b.id === selectedOrderDetails.branchId)?.location || "General Area"}
                    </span>
                  </div>

                  <div className="p-3 border border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/10 rounded-xl space-y-1.5 md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[9px] font-bold text-neutral-450 uppercase tracking-wider">
                          Shipping Address
                        </span>
                        <span className="block text-[11px] text-neutral-600 dark:text-neutral-300 font-light mt-1">
                          {selectedOrderDetails.user.address} (
                          {selectedOrderDetails.user.pickArea})
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-neutral-450 uppercase tracking-wider">
                          Billing Address
                        </span>
                        <span className="block text-[11px] text-neutral-600 dark:text-neutral-300 font-light mt-1">
                          {selectedOrderDetails.user.billingAddress ||
                            selectedOrderDetails.user.address}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Ordered Table */}
                <div className="border border-neutral-150 dark:border-neutral-850 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 font-semibold text-neutral-450 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Dish</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderDetails.items.map((item) => {
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-neutral-100 dark:border-neutral-850 last:border-b-0 animate-fade-in"
                          >
                            <td className="px-4 py-3 flex items-center gap-2.5">
                              <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                                {item.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-neutral-600 dark:text-neutral-300">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right">
                              ৳{item.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-neutral-800 dark:text-neutral-100">
                              ৳{(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal, Coupon discount, and Total */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 text-xs text-right border-t border-neutral-100 dark:border-neutral-800 pt-3">
                    <div className="flex justify-between text-neutral-500">
                      <span>Basket Subtotal:</span>
                      <span>৳{selectedOrderDetails.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedOrderDetails.discount > 0 && (
                      <div className="flex justify-between text-emerald-500 font-semibold">
                        <span>
                          Coupon Discount ({selectedOrderDetails.couponCode}):
                        </span>
                        <span>
                          -৳{selectedOrderDetails.discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-neutral-850 dark:text-white pt-1">
                      <span>Total Invoice:</span>
                      <span className="text-primary-500">
                        ৳{selectedOrderDetails.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method / Gateway Status Info */}
                <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-850 rounded-xl flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div>
                    <span className="block font-bold text-neutral-450 uppercase text-[9px] tracking-wider">
                      Payment Method
                    </span>
                    <span className="block font-bold text-neutral-855 dark:text-neutral-100 mt-1 uppercase text-[10px]">
                      {selectedOrderDetails.paymentMethod === "sslcommerz"
                        ? "SSLCommerz (Online)"
                        : "Cash on Delivery (COD)"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-neutral-450 uppercase text-[9px] tracking-wider">
                      Payment Status
                    </span>
                    <span
                      className={`inline-block font-extrabold px-2 py-0.5 rounded text-[9px] uppercase mt-1 ${
                        selectedOrderDetails.paymentStatus === "Paid"
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {selectedOrderDetails.paymentStatus || "Pending"}
                    </span>
                  </div>
                  {selectedOrderDetails.transactionId && (
                    <div>
                      <span className="block font-bold text-neutral-450 uppercase text-[9px] tracking-wider">
                        Transaction ID
                      </span>
                      <span className="block font-mono text-[9px] text-neutral-600 dark:text-neutral-450 mt-1">
                        {selectedOrderDetails.transactionId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-all active:scale-95"
                >
                  Close details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;


// before accept or decline

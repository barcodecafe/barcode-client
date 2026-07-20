import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  MessageSquare,
  Send,
  LogOut,
  ShieldAlert,
  Phone,
  MapPin,
  X,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ClipboardList,
  Utensils
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAllOrders,
  updateOrderStatus,
  addChatMessage,
  acceptRiderOrder,
  rejectRiderOrder,
} from "../services/ordersService";

const getStatusColor = (status) => {
  switch (status) {
    case "Placed":
      return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    case "Accepted":
      return "bg-green-500/10 text-green-500 border border-green-500/20";
    case "Preparing":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    case "Out for Delivery":
      return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
    case "Delivered":
      return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    case "Rejected":
      return "bg-red-500/10 text-red-500 border border-red-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-500 border border-neutral-500/20";
  }
};

export const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [riderChatMessage, setRiderChatMessage] = useState("");
  
  // Earning & Delivery Filter States
  const [timeFilter, setTimeFilter] = useState("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const chatEndRef = useRef(null);
  const currentChat = orders.find((o) => o.id === activeChatOrderId);
  const chatMessagesCount = currentChat?.chatHistory?.length || 0;

  const fetchRiderOrders = useCallback(() => {
    if (!user) return;
    getAllOrders().then((data) => {
      const assigned = data.filter(
        (o) =>
          o.riderId === user.id ||
          o.riderName?.toLowerCase() === user.name?.toLowerCase(),
      );
      setOrders(assigned);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    fetchRiderOrders();
    const interval = setInterval(fetchRiderOrders, 3000);
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

  // --- Filtered Stats Calculation ---
  const getFilteredStats = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deliveredOrders = orders.filter((o) => o.status === "Delivered");

    const filtered = deliveredOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      if (timeFilter === "daily") return orderDate >= startOfToday;
      if (timeFilter === "weekly") {
        const oneWeekAgo = new Date(startOfToday);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return orderDate >= oneWeekAgo;
      }
      if (timeFilter === "monthly") {
        return orderDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (timeFilter === "yearly") {
        return orderDate >= new Date(now.getFullYear(), 0, 1);
      }
      if (timeFilter === "custom") {
        let matches = true;
        if (fromDate) {
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          matches = matches && orderDate >= start;
        }
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          matches = matches && orderDate <= end;
        }
        return matches;
      }
      return true;
    });

    const totalEarnings = filtered.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
    const totalFoodPrice = filtered.reduce((sum, o) => sum + ((o.total - (o.deliveryCharge || 0)) || 0), 0);

    return {
      deliveryCount: filtered.length,
      earnings: totalEarnings,
      foodPrice: totalFoodPrice,
    };
  };

  // --- Performance Log Grouped by Date (With Detailed Money Calculations) ---
  const getDailyPerformanceLog = () => {
    const logMap = {};

    orders.forEach((order) => {
      if (!order.createdAt) return;
      
      const dateKey = new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      if (!logMap[dateKey]) {
        logMap[dateKey] = {
          delivered: 0,
          rejected: 0,
          foodPrice: 0,
          deliveryCharge: 0,
          riderCommission: 0,
          totalCollection: 0,
        };
      }

      if (order.status === "Delivered") {
        logMap[dateKey].delivered += 1;
        
        const delCharge = order.deliveryCharge || 0;
        const totalInvoice = order.total || 0;
        const pureFoodPrice = totalInvoice - delCharge;
        const commission = delCharge; // রাইডারের কমিশন (ডেলিভারি ফি)

        logMap[dateKey].foodPrice += pureFoodPrice > 0 ? pureFoodPrice : 0;
        logMap[dateKey].deliveryCharge += delCharge;
        logMap[dateKey].riderCommission += commission;
        logMap[dateKey].totalCollection += totalInvoice;
      } else if (order.status === "Rejected") {
        logMap[dateKey].rejected += 1;
      }
    });

    return Object.keys(logMap)
      .map((date) => ({ date, ...logMap[date] }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredStats = getFilteredStats();
  const dailyLog = getDailyPerformanceLog();
  
  const activeOrdersCount = orders.filter((o) => o.status !== "Delivered" && o.status !== "Rejected").length;
  const pendingAcceptCount = orders.filter((o) => o.riderAcceptStatus === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
                <span className="text-primary-500 font-bold">{user?.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-semibold text-xs transition-all active:scale-95 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>

        {/* Filter and Stats Cards */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Filter Earnings & Performance:
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 grow sm:grow-0 justify-end">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-950 text-neutral-805 dark:text-neutral-100 font-bold text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="daily">Daily (Today)</option>
                <option value="weekly">Weekly (Last 7 Days)</option>
                <option value="monthly">Monthly (This Month)</option>
                <option value="yearly">Yearly (This Year)</option>
                <option value="custom">Custom Date Range</option>
              </select>

              {timeFilter === "custom" && (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-950 text-neutral-805 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <span className="text-xs text-neutral-400">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-950 text-neutral-805 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-neutral-850 dark:text-white leading-none">
                  {activeOrdersCount}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1 block">
                  Active Orders
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-neutral-850 dark:text-white leading-none">
                  {pendingAcceptCount}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1 block">
                  Pending Accept
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-500/10 text-neutral-500 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-neutral-850 dark:text-white leading-none">
                  {filteredStats.deliveryCount}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1 block">
                  Delivered ({timeFilter})
                </span>
              </div>
            </div>

            {/* Total Food Value Delivered */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs flex items-center gap-3 border-l-4 border-l-indigo-500">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-neutral-850 dark:text-white leading-none">
                  ৳{filteredStats.foodPrice.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase mt-1 block">
                  Food Delivered
                </span>
              </div>
            </div>

            {/* Rider Actual Income */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs flex items-center gap-3 border-l-4 border-l-primary-500">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-primary-500 dark:text-primary-400 leading-none">
                  ৳{filteredStats.earnings.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase mt-1 block">
                  Rider Income
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Performance Track Log Table (Updated With Scrollbar & New Detailed Columns) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-primary-500" />
            <h3 className="font-display font-extrabold text-sm text-neutral-850 dark:text-white uppercase tracking-wider">
              Daily Performance Track Log
            </h3>
          </div>

          {dailyLog.length === 0 ? (
            <p className="text-xs text-neutral-450 dark:text-neutral-500 font-medium py-2">No history logs recorded yet.</p>
          ) : (
            <div className="max-h-[280px] overflow-y-auto overflow-x-auto pr-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white dark:bg-neutral-900 z-10 shadow-xs">
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-450 dark:text-neutral-500 uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Delivered</th>
                    <th className="py-2.5 px-3">Rejected</th>
                    <th className="py-2.5 px-3">Food Price</th>
                    <th className="py-2.5 px-3">Delivery Charge</th>
                    <th className="py-2.5 px-3">Rider Commission</th>
                    <th className="py-2.5 px-3 text-right">Total Money Collection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
                  {dailyLog.map((log, index) => (
                    <tr key={index} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20 transition-colors">
                      <td className="py-3 px-3 font-bold text-neutral-700 dark:text-neutral-300">{log.date}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3" /> {log.delivered}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-extrabold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3" /> {log.rejected}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                        ৳{log.foodPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-600 dark:text-amber-400">
                        ৳{log.deliveryCharge.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-500">
                        ৳{log.riderCommission.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-primary-500">
                        ৳{log.totalCollection.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Orders List */}
          <div className={`${activeChatOrderId ? "lg:col-span-7" : "lg:col-span-12"} space-y-4 transition-all duration-300`}>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
              <h3 className="font-display font-extrabold text-sm text-neutral-850 dark:text-white mb-4 uppercase tracking-wider">
                Assigned Delivery Orders ({orders.length})
              </h3>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs font-semibold">No orders assigned to you yet.</p>
                  <p className="text-[10px] font-light">Assigned orders will pop up here in real-time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div key={ord.id} className="border border-neutral-100 dark:border-neutral-850 rounded-xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3.5 flex flex-col justify-between">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div>
                          <span className="font-bold text-xs uppercase text-neutral-805 dark:text-white">Order #{ord.id}</span>
                          <span className="block text-[9px] text-neutral-400 font-light mt-0.5">
                            Placed: {new Date(ord.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${getStatusColor(ord.status)}`}>
                            {ord.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${ord.riderAcceptStatus === "accepted" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-orange-500/10 text-orange-500 border border-orange-500/20"}`}>
                            {ord.riderAcceptStatus === "accepted" ? "Accepted" : "Pending Accept"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-b border-neutral-100 dark:border-neutral-850 py-3">
                        <div className="space-y-1.5">
                          <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Customer</span>
                          <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-200 text-[11px]">
                            <span>{ord.user?.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                            <Phone className="w-3 h-3 text-primary-500" />
                            <span>{ord.user?.phone}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Delivery Address</span>
                          <div className="flex items-start gap-1 text-[10px] text-neutral-500">
                            <MapPin className="w-3 h-3 text-primary-500 mt-0.5 shrink-0" />
                            <span className="leading-tight">{ord.user?.address} ({ord.user?.pickArea})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="font-bold text-xs">Total Invoice: <span className="text-primary-500">৳{ord.total?.toFixed(2)}</span></div>
                        <div className="flex items-center gap-2">
                          {ord.riderAcceptStatus === "pending" ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleAccept(ord.id)} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all">Accept Job</button>
                              <button onClick={() => handleReject(ord.id)} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all">Reject Job</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select value={ord.status} onChange={(e) => handleStatusChange(ord.id, e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-neutral-100 font-bold text-[10px] uppercase cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500">
                                <option value="Out for Delivery">On Way</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            </div>
                          )}

                          <button onClick={() => setActiveChatOrderId(ord.id === activeChatOrderId ? null : ord.id)} className={`p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:border-primary-500/40 active:scale-95 transition-all ${activeChatOrderId === ord.id ? "bg-primary-500/10 text-primary-500 border-primary-500/30" : ""}`} title="Chat Console">
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
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:col-span-5 flex flex-col h-140 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">Chat for #{chatOrder.id.toUpperCase()}</h3>
                    <span className="block text-[9px] text-neutral-400">Customer: {chatOrder.user?.name} ({chatOrder.user?.phone})</span>
                  </div>
                  <button onClick={() => setActiveChatOrderId(null)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-650">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-neutral-50/20 dark:bg-neutral-950/10">
                  {chatOrder.chatHistory.map((msg, i) => {
                    const isSelf = msg.sender === "rider" && msg.senderName === user.name;
                    const isSystem = msg.senderName === "System";
                    const isAdmin = msg.sender === "admin" && msg.senderName !== "System";
                    const isCustomer = msg.sender === "customer";

                    let alignClass = "justify-start";
                    let bubbleClass = "bg-white dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-805 dark:text-neutral-100 rounded-2xl rounded-tl-none";
                    let labelColor = "text-neutral-400";

                    if (isSelf) {
                      alignClass = "justify-end";
                      bubbleClass = "bg-primary-500 text-white rounded-2xl rounded-tr-none shadow-md shadow-primary-500/10";
                      labelColor = "text-primary-500";
                    } else if (isSystem) {
                      return (
                        <div key={i} className="flex justify-center my-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-neutral-150 dark:bg-neutral-800 text-[9px] text-neutral-500 dark:text-neutral-400 font-semibold">{msg.text}</span>
                        </div>
                      );
                    } else if (isAdmin) {
                      bubbleClass = "bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-neutral-805 dark:text-neutral-150 rounded-2xl rounded-tl-none";
                      labelColor = "text-indigo-500";
                    } else if (isCustomer) {
                      bubbleClass = "bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-neutral-805 dark:text-neutral-150 rounded-2xl rounded-tl-none";
                      labelColor = "text-emerald-555";
                    }

                    return (
                      <div key={i} className={`flex ${alignClass}`}>
                        <div className="max-w-[85%] flex flex-col gap-1">
                          {!isSelf && <span className={`text-[10px] font-bold ${labelColor} px-1.5`}>{msg.senderName} ({msg.sender.toUpperCase()})</span>}
                          <div className={`px-3 py-2.5 text-xs leading-normal ${bubbleClass}`}>
                            <p>{msg.text}</p>
                            <span className={`block text-[9px] text-right mt-1 font-light ${isSelf ? "text-white/60" : "text-neutral-400"}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendRiderMessage} className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0">
                  <input type="text" value={riderChatMessage} onChange={(e) => setRiderChatMessage(e.target.value)} placeholder="Type message to Customer/Admin..." className="grow px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-850 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
                  <button type="submit" disabled={!riderChatMessage.trim()} className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all shadow-md shadow-primary-500/10">
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
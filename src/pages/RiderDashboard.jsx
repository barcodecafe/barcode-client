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
  Utensils,
  CheckCircle2,
  Clock3,
  Menu,
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  User,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { buildDailySettlementLog, formatDateKey } from "../utils/settlement";
import {
  getAllOrders,
  updateOrderStatus,
  addChatMessage,
  acceptRiderOrder,
  rejectRiderOrder,
  submitRiderDailyCash,
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

  // --- Primary States ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingCashDate, setSubmittingCashDate] = useState(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [riderChatMessage, setRiderChatMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // --- Earning & Delivery Filter States ---
  const [timeFilter, setTimeFilter] = useState("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const chatEndRef = useRef(null);
  const chatOrder = orders.find((o) => o.id === activeChatOrderId);
  const chatMessagesCount = chatOrder?.chatHistory?.length || 0;

  // --- Fetch Orders Callback ---
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

  // Direct Auto-Polling Effect (every 4 seconds)
  useEffect(() => {
    fetchRiderOrders();
    const interval = setInterval(fetchRiderOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchRiderOrders]);

  // Chat Scroll to Bottom Effect
  useEffect(() => {
    if (chatEndRef.current && activeChatOrderId) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeChatOrderId, chatMessagesCount]);

  // --- Event Handlers ---
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleAccept = async (orderId) => {
    try {
      await acceptRiderOrder(orderId);
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

  const handleSubmitCash = async (dateKey) => {
    const label = formatDateKey(dateKey);
    const confirmSubmit = window.confirm(
      `Are you sure you want to mark all collected cash as submitted for ${label}?`
    );
    if (!confirmSubmit) return;

    try {
      setSubmittingCashDate(dateKey);
      await submitRiderDailyCash(dateKey);
      alert(`Cash submission request sent to Admin for ${label}!`);
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to submit cash: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingCashDate(null);
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
        prev.map((o) => (o.id === activeChatOrderId ? updated : o))
      );
      setRiderChatMessage("");
    } catch (err) {
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
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
    const totalFoodPrice = filtered.reduce(
      (sum, o) => sum + ((o.total - (o.deliveryCharge || 0)) || 0),
      0
    );

    return {
      deliveryCount: filtered.length,
      earnings: totalEarnings,
      foodPrice: totalFoodPrice,
    };
  };

  // --- Performance Log Grouped by Date ---
  const getDailyPerformanceLog = () => buildDailySettlementLog(orders);

  const filteredStats = getFilteredStats();
  const dailyLog = getDailyPerformanceLog();

  const activeOrdersCount = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Rejected"
  ).length;
  const pendingAcceptCount = orders.filter(
    (o) => o.riderAcceptStatus === "pending"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100 dark:bg-neutral-950">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Navigation Items for Left Sidebar
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Assigned Orders", icon: ShoppingBag, badge: orders.length > 0 ? orders.length : null },
    { id: "settlement", label: "Daily Track Log", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans text-neutral-800 dark:text-neutral-100 flex">
      {/* ---------------- LEFT SIDEBAR ---------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white font-black shadow-md shadow-rose-500/20">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-white uppercase">
                  Rider Portal
                </h2>
                <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase block">
                  Express Delivery
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 shadow-xs"
                      : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-rose-600 dark:text-rose-400" : ""}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT WRAPPER ---------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navbar */}
        <header className="h-16 px-4 sm:px-8 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 lg:hidden text-neutral-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 hidden sm:inline-block">
              Welcome back, <strong className="text-neutral-900 dark:text-white">{user?.name}</strong> 👋
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200 dark:border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-600 font-extrabold flex items-center justify-center text-xs uppercase">
                {user?.name ? user.name.slice(0, 2) : "RD"}
              </div>
              <div className="hidden md:block">
                <span className="block text-xs font-bold leading-tight text-neutral-900 dark:text-white">
                  {user?.name}
                </span>
                <span className="block text-[9px] text-emerald-500 font-bold uppercase">
                  Active Rider
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Dashboard Title */}
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              Real-time snapshot of your active deliveries, income metrics, and daily settlement logs.
            </p>
          </div>

          {/* Filter Bar Controls */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Filter Earnings & Performance:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 grow sm:grow-0 justify-end">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 font-bold text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500"
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
                    className="px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <span className="text-xs text-neutral-400">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 5 Primary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Active Orders */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-neutral-900 dark:text-white leading-none">
                  {activeOrdersCount}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1 block">
                  Active Orders
                </span>
              </div>
            </div>

            {/* 2. Pending Accept */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-neutral-900 dark:text-white leading-none">
                  {pendingAcceptCount}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1 block">
                  Pending Accept
                </span>
              </div>
            </div>

            {/* 3. Delivered */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-neutral-900 dark:text-white leading-none">
                  {filteredStats.deliveryCount}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1 block">
                  Delivered ({timeFilter})
                </span>
              </div>
            </div>

            {/* 4. Food Delivered */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3 border-l-4 border-l-indigo-500">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-neutral-900 dark:text-white leading-none">
                  ৳{filteredStats.foodPrice.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1 block">
                  Food Delivered
                </span>
              </div>
            </div>

            {/* 5. Rider Income */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3 border-l-4 border-l-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xl font-black text-rose-500 dark:text-rose-400 leading-none">
                  ৳{filteredStats.earnings.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1 block">
                  Rider Income
                </span>
              </div>
            </div>
          </div>

          {/* Daily Performance Track Log Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-rose-500" />
              <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
                Daily Performance Track Log
              </h3>
            </div>

            {dailyLog.length === 0 ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium py-2">
                No history logs recorded yet.
              </p>
            ) : (
              <div className="max-h-[280px] overflow-y-auto overflow-x-auto pr-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-white dark:bg-neutral-900 z-10 shadow-xs">
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Delivered</th>
                      <th className="py-2.5 px-3">Rejected</th>
                      <th className="py-2.5 px-3">Food Price</th>
                      <th className="py-2.5 px-3">Delivery Charge</th>
                      <th className="py-2.5 px-3">Rider Commission</th>
                      <th className="py-2.5 px-3">Cash Collected</th>
                      <th className="py-2.5 px-3">Payable to Admin</th>
                      <th className="py-2.5 px-3 text-right">Admin Cash Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {dailyLog.map((log, index) => (
                      <tr
                        key={index}
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-neutral-800 dark:text-neutral-200">
                          {log.date}
                        </td>
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
                        <td className="py-3 px-3 font-black text-rose-500">
                          ৳{log.cashCollected.toFixed(2)}
                          {log.onlinePaid > 0 && (
                            <span
                              className="block text-[9px] font-semibold text-neutral-400 normal-case"
                              title="Paid online — the rider collected no cash for these"
                            >
                              +৳{log.onlinePaid.toFixed(2)} paid online
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-black text-amber-600 dark:text-amber-400">
                          ৳{log.outstandingNetPayable.toFixed(2)}
                          {log.outstandingNetPayable < 0 && (
                            <span className="block text-[9px] font-semibold text-emerald-500 normal-case">
                              admin owes you
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {log.delivered === 0 ? (
                            <span className="text-neutral-400 font-medium text-[10px]">
                              N/A
                            </span>
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
                              onClick={() => handleSubmitCash(log.dateKey)}
                              disabled={submittingCashDate === log.dateKey}
                              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                              title="Click to submit collected cash to admin"
                            >
                              <Clock3 className="w-3 h-3 animate-pulse" />
                              {submittingCashDate === log.dateKey
                                ? "Submitting..."
                                : "Pay to Admin"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Main Work Area (Assigned Orders + Chat Panel Grid) */}
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
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3.5 flex flex-col justify-between"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div>
                            <span className="font-bold text-xs uppercase text-neutral-800 dark:text-white">
                              Order #{ord.id}
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
                            {ord.riderAcceptStatus === "pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAccept(ord.id)}
                                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                                >
                                  Accept Job
                                </button>
                                <button
                                  onClick={() => handleReject(ord.id)}
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
                                    handleStatusChange(ord.id, e.target.value)
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 font-bold text-[10px] uppercase cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                  <option value="Out for Delivery">On Way</option>
                                  <option value="Delivered">Delivered</option>
                                </select>
                              </div>
                            )}

                            <button
                              onClick={() =>
                                setActiveChatOrderId(
                                  ord.id === activeChatOrderId ? null : ord.id
                                )
                              }
                              className={`p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-rose-500 hover:border-rose-500/40 active:scale-95 transition-all cursor-pointer ${
                                activeChatOrderId === ord.id
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
                    ))}
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
                        Chat for #{chatOrder.id}
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
        </main>
      </div>
    </div>
  );
};

export default RiderDashboard;
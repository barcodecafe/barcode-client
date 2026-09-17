import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle,
  Utensils,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAllOrders } from "../../services/ordersService";
import { useVisiblePolling } from "../../hooks/useVisiblePolling";
import { isAssignedToMe } from "../../utils/rider";
import { riderCommissionFor } from "../../utils/settlement";
import { socket } from "../../services/socket";

export const RiderOverview = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Earning & Delivery Filter States
  const [timeFilter, setTimeFilter] = useState("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  // ⚡ Real-time instant sync when admin assigns/updates order
  useEffect(() => {
    let timer = null;
    const handleRealtimeSync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fetchRiderOrders();
      }, 300);
    };

    socket.on("rider_order_assigned", handleRealtimeSync);
    socket.on("order_assigned", handleRealtimeSync);
    socket.on("order_updated", handleRealtimeSync);
    socket.on("order_status_updated", handleRealtimeSync);
    socket.on("rider_order_updated", handleRealtimeSync);

    return () => {
      clearTimeout(timer);
      socket.off("rider_order_assigned", handleRealtimeSync);
      socket.off("order_assigned", handleRealtimeSync);
      socket.off("order_updated", handleRealtimeSync);
      socket.off("order_status_updated", handleRealtimeSync);
      socket.off("rider_order_updated", handleRealtimeSync);
    };
  }, [fetchRiderOrders]);

  // Was setInterval(…, 4000), which kept running in hidden tabs: one rider
  // sitting on this page spent 225 requests per 15 minutes — 45% of the whole
  // server budget — on an earnings summary that changes a few times a day.
  // useVisiblePolling pauses while the tab is hidden and refetches immediately
  // when it comes back, so the numbers are still fresh when anyone is looking.
  useVisiblePolling(fetchRiderOrders, {
    intervalMs: 30000,
    enabled: Boolean(user),
  });

  // Filtered Stats Calculation
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

    const totalEarnings = filtered.reduce((sum, o) => sum + riderCommissionFor(o), 0);
    const totalFoodPrice = filtered.reduce(
      (sum, o) => sum + (o.total - (o.deliveryCharge || 0) || 0),
      0
    );

    return {
      deliveryCount: filtered.length,
      earnings: totalEarnings,
      foodPrice: totalFoodPrice,
    };
  };

  const filteredStats = getFilteredStats();
  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Rejected"
  );
  const activeOrdersCount = activeOrders.length;
  const pendingAcceptCount = activeOrders.filter(
    (o) => o.riderAcceptStatus === "pending" || !o.riderAcceptStatus
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Dashboard Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
          Real-time snapshot of your active deliveries and income metrics.
        </p>
      </div>

      {/* Filter Bar Controls */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Filter Earnings & Performance:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between sm:justify-end">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 font-bold text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="daily">Daily (Today)</option>
            <option value="weekly">Weekly (Last 7 Days)</option>
            <option value="monthly">Monthly (This Month)</option>
            <option value="yearly">Yearly (This Year)</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {timeFilter === "custom" && (
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-1/2 sm:w-auto px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <span className="text-xs text-neutral-400 shrink-0">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-1/2 sm:w-auto px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5 Primary Stat Cards (2-col grid on mobile, hero earnings card, 5-col on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* 1. Active Orders */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-none truncate">
              {activeOrdersCount}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase mt-1 block truncate">
              Active Orders
            </span>
          </div>
        </div>

        {/* 2. New Orders */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-none truncate">
              {pendingAcceptCount}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase mt-1 block truncate">
              New Orders
            </span>
          </div>
        </div>

        {/* 3. Delivered */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-none truncate">
              {filteredStats.deliveryCount}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase mt-1 block truncate">
              Delivered
            </span>
          </div>
        </div>

        {/* 4. Food Delivered */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center gap-2.5 sm:gap-3 border-l-4 border-l-indigo-500">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-none truncate" title={`৳${filteredStats.foodPrice.toFixed(2)}`}>
              ৳{filteredStats.foodPrice.toFixed(0)}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase mt-1 block truncate">
              Food Delivered
            </span>
          </div>
        </div>

        {/* 5. Rider Income (Spans full 2 columns on mobile as prominent hero card) */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-gradient-to-r from-rose-500/5 via-white to-white dark:from-rose-500/10 dark:via-neutral-900 dark:to-neutral-900 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between lg:justify-start gap-3 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xl sm:text-xl font-black text-rose-500 dark:text-rose-400 leading-none truncate">
                ৳{filteredStats.earnings.toFixed(2)}
              </span>
              <span className="text-[10px] sm:text-[10px] font-extrabold text-rose-600/80 dark:text-rose-400/80 uppercase mt-1 block tracking-wide">
                Rider Income ({timeFilter})
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full lg:hidden shrink-0">
            Net Earn
          </span>
        </div>
      </div>

      {/* Quick Action Link Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">
              Assigned Orders Management
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              You have {activeOrdersCount} active orders waiting for action.
            </p>
          </div>
        </div>
        <Link
          to="/rider/orders"
          className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Manage Orders</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default RiderOverview;
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

    const totalEarnings = filtered.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
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
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Rejected"
  ).length;
  const pendingAcceptCount = orders.filter(
    (o) => o.riderAcceptStatus === "pending"
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
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
          Real-time snapshot of your active deliveries and income metrics.
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
            <div className="flex items-center gap-2">
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

      {/* Quick Action Link Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">
              Assigned Orders Management
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              You have {activeOrdersCount} active orders waiting for action.
            </p>
          </div>
        </div>
        <Link
          to="/rider/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all shadow-md shadow-rose-500/20 active:scale-95 cursor-pointer"
        >
          <span>Manage Orders</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default RiderOverview;
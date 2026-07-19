import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Wallet, DollarSign, ShoppingBag, Building2, Star, Flame, Bike, User } from 'lucide-react';

import { StatCard } from '../../components/admin/StatCard';
import { ChartCard } from '../../components/admin/charts/ChartCard';
import { BarChart } from '../../components/admin/charts/BarChart';
import { PieChart } from '../../components/admin/charts/PieChart';
import { LineChart } from '../../components/admin/charts/LineChart';

import {
  getDashboardSummary,
  getRevenueByBranch,
  getOrdersByCategory,
  getRevenueTrend,
  getTopDishes,
  getTopRiders,       // নতুন সার্ভিস ফাংশন যুক্ত করা হয়েছে
  getTopCustomers,    // নতুন সার্ভিস ফাংশন যুক্ত করা হয়েছে
} from '../../services/analyticsService';

const currency = (v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`;
const compactNumber = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v);

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [revenueByBranch, setRevenueByBranch] = useState([]);
  const [ordersByCategory, setOrdersByCategory] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [topRiders, setTopRiders] = useState([]);       // নতুন স্টেট যুক্ত করা হয়েছে
  const [topCustomers, setTopCustomers] = useState([]); // নতুন স্টেট যুক্ত করা হয়েছে
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getRevenueByBranch(),
      getOrdersByCategory(),
      getRevenueTrend(12),
      getTopDishes(5),
      getTopRiders(5),       // ৫ জন টপ রাইডার ডেটা আনা হচ্ছে
      getTopCustomers(5),    // ৫ জন টপ কাস্টমার ডেটা আনা হচ্ছে
    ]).then(([summaryData, branchData, categoryData, trendData, dishesData, ridersData, customersData]) => {
      setSummary(summaryData);
      setRevenueByBranch(branchData);
      setOrdersByCategory(categoryData);
      setRevenueTrend(trendData);
      setTopDishes(dishesData);
      setTopRiders(ridersData || []);       // স্টেট আপডেট করা হয়েছে
      setTopCustomers(customersData || []); // স্টেট আপডেট করা হয়েছে
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const barData = [...revenueByBranch]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((b) => ({ id: b.branchId, label: b.shortName, fullLabel: b.name, value: b.revenue }));

  const pieData = ordersByCategory.map((c) => ({ label: c.category, value: c.value }));
  const lineData = revenueTrend.map((t) => ({ label: t.month, value: t.revenue }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
          Dashboard Overview
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          A snapshot of performance across all {summary.totalBranches} Barcode branches.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue" 
          value={currency(summary.totalRevenue)}
          changePct={summary.revenueChangePct}
          delay={0}
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={compactNumber(summary.totalOrders)}
          changePct={summary.ordersChangePct}
          delay={0.05}
        />
        <StatCard
          icon={Building2}
          label="Active Branches"
          value={summary.totalBranches}
          delay={0.1}
        />
        <StatCard
          icon={Star}
          label="Avg. Rating"
          value={summary.avgRating}
          delay={0.15}
        />
      </div>

      {/* Charts Row 1: Bar + Pie */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <ChartCard
          title="Revenue by Branch"
          subtitle="Top 8 branches this period"
          className="xl:col-span-3"
        >
          <BarChart data={barData} valueFormatter={currency} barLabel="Revenue" />
        </ChartCard>

        <ChartCard
          title="Orders by Category"
          subtitle="Share of total order volume"
          className="xl:col-span-2"
        >
          <PieChart data={pieData} valueFormatter={compactNumber} />
        </ChartCard>
      </div>

      {/* Charts Row 2: Line + Top Dishes */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <ChartCard
          title="Revenue Trend"
          subtitle="Last 12 months, all branches combined"
          className="xl:col-span-3"
        >
          <LineChart data={lineData} valueFormatter={currency} />
        </ChartCard>

        <ChartCard
          title="Top Dishes"
          subtitle="By order volume"
          className="xl:col-span-2"
        >
          <div className="flex flex-col gap-1">
            {topDishes.map((dish, i) => (
              <div
                key={dish.id}
                className="flex items-center gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
              >
                <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                    {dish.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {dish.category}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-primary-500 font-semibold text-sm shrink-0">
                  <Flame className="w-3.5 h-3.5" />
                  {dish.mockOrders}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* 🆕 নতুন রো: মূল কোন লজিক পরিবর্তন না করে শুধুমাত্র নিচে Top Riders & Top Customers কার্ড যুক্ত করা হয়েছে */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top Riders */}
        <ChartCard
          title="Top Riders"
          subtitle="By completed deliveries"
        >
          <div className="flex flex-col gap-1">
            {topRiders.map((rider, i) => (
              <div
                key={rider.id}
                className="flex items-center gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
              >
                <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                    {rider.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Rating: {rider.rating} ⭐
                  </p>
                </div>
                <div className="flex items-center gap-1 text-primary-500 font-semibold text-sm shrink-0">
                  <Bike className="w-4 h-4" />
                  {rider.deliveries} Deliveries
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Top Customers */}
        <ChartCard
          title="Top Customers"
          subtitle="By order count & spending"
        >
          <div className="flex flex-col gap-1">
            {topCustomers.map((customer, i) => (
              <div
                key={customer.id}
                className="flex items-center gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
              >
                <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                    {customer.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {customer.orders} Orders
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-semibold text-sm shrink-0">
                  <User className="w-4 h-4 text-neutral-400" />
                  {currency(customer.totalSpent)}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

    </div>
  );
};

export default AdminDashboard;
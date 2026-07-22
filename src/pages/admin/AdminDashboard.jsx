import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Wallet, DollarSign, ShoppingBag, Building2, Star, Flame, User, Bike } from 'lucide-react';

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
  getTopCustomers, // getTopCustomers সার্ভিস যুক্ত করা হয়েছে
  getTopRiders,
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
  const [topCustomers, setTopCustomers] = useState([]); // টপ কাস্টমারের স্টেট
  const [topRiders, setTopRiders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardSummary().catch(() => null),
      getRevenueByBranch().catch(() => []),
      getOrdersByCategory().catch(() => []),
      getRevenueTrend(12).catch(() => []),
      getTopDishes(5).catch(() => []),
      getTopCustomers(5).catch(() => []), // ৫ জন টপ কাস্টমার ডাটা ফেচ করা হচ্ছে
      getTopRiders(5).catch(() => []),
    ]).then(([summaryData, branchData, categoryData, trendData, dishesData, customersData, ridersData]) => {
      setSummary(summaryData);
      setRevenueByBranch(branchData || []);
      setOrdersByCategory(categoryData || []);
      setRevenueTrend(trendData || []);
      setTopDishes(dishesData || []);
      setTopCustomers(customersData || []);
      setTopRiders(ridersData || []);
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
          A snapshot of performance across all {summary?.totalBranches || 0} Barcode branches.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue" 
          value={currency(summary?.totalRevenue || 0)}
          changePct={summary?.revenueChangePct}
          delay={0}
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={compactNumber(summary?.totalOrders || 0)}
          changePct={summary?.ordersChangePct}
          delay={0.05}
        />
        <StatCard
          icon={Building2}
          label="Active Branches"
          value={summary?.totalBranches || 0}
          delay={0.1}
        />
        <StatCard
          icon={Star}
          label="Avg. Rating"
          value={summary?.avgRating || 0}
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
                key={dish.id || i}
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

      {/* Row 3: Top Customers Section */}
      <ChartCard
        title="Top Customers"
        subtitle="Ranked by total spend & orders"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {topCustomers.length > 0 ? (
            topCustomers.slice(0, 6).map((customer, i) => (
              <div
                key={customer._id || customer.id || i}
                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50"
              >
                <span className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 text-sm font-bold flex items-center justify-center shrink-0">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                    {customer.name || customer.fullName || 'Customer'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {customer.totalOrders || customer.ordersCount || 0} Orders
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm shrink-0">
                  <User className="w-4 h-4 text-neutral-400" />
                  {currency(customer.totalSpent || customer.totalSpend || 0)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-400 py-4 text-center col-span-full">
              No customer data available
            </p>
          )}
        </div>
      </ChartCard>

      {/* Row 4: Top Riders — ranked on deliveries completed, since that is what
          a rider controls. Earnings are shown but never the ranking: carrying
          expensive orders doesn't make someone a better rider. */}
      <ChartCard
        title="Top Riders"
        subtitle="Ranked by completed deliveries"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {topRiders.length > 0 ? (
            topRiders.map((rider, i) => (
              <div
                key={rider.riderId || i}
                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center justify-center shrink-0">
                  #{rider.rank || i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                    {rider.name}
                  </p>
                  {/* Reliability is the whole point of this list, so show it
                      always — not only for riders who have refused something. */}
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {rider.deliveries} {rider.deliveries === 1 ? 'delivery' : 'deliveries'}
                    {' · '}
                    <span
                      className={rider.acceptanceRate < 80 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}
                    >
                      {rider.acceptanceRate}% accepted
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {/* The rider's own earnings lead; the value they carried is
                      context, not their money. */}
                  <span className="flex items-center justify-end gap-1 text-primary-500 font-bold text-sm">
                    <Bike className="w-3.5 h-3.5" />
                    {currency(rider.earnings || 0)}
                  </span>
                  <span className="block text-[10px] text-neutral-400 font-medium">
                    {currency(rider.deliveredValue || 0)} delivered
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-400 py-4 text-center col-span-full">
              No rider deliveries yet
            </p>
          )}
        </div>
      </ChartCard>
    </div>
  );
};

export default AdminDashboard;
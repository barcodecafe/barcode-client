import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Wallet,
  DollarSign,
  ShoppingBag,
  Building2,
  Star,
  Flame,
  User,
  Bike,
  FileSpreadsheet,
} from 'lucide-react';

import { StatCard } from '../../components/admin/StatCard';
import { ChartCard } from '../../components/admin/charts/ChartCard';
import { BarChart } from '../../components/admin/charts/BarChart';
import { PieChart } from '../../components/admin/charts/PieChart';
import { LineChart } from '../../components/admin/charts/LineChart';
import { ExportSalesModal } from '../../components/ExportSalesModal';
import { getAllOrders } from '../../services/ordersService';

import {
  getDashboardAll,
  getDashboardSummary,
  getRevenueByBranch,
  getOrdersByCategory,
  getRevenueTrend,
  getTopDishes,
  getTopCustomers,
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
  const [topCustomers, setTopCustomers] = useState([]);
  const [topRiders, setTopRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // ⚡ Unified high-speed endpoint (single network roundtrip)
    getDashboardAll()
      .then((res) => {
        if (!active) return;
        if (res) {
          setSummary(res.summary || null);
          setRevenueByBranch(res.revenueByBranch || []);
          setOrdersByCategory(res.ordersByCategory || []);
          setRevenueTrend(res.revenueTrend || []);
          setTopDishes(res.topDishes || []);
          setTopCustomers(res.topCustomers || []);
          setTopRiders(res.topRiders || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        // Fallback to separate endpoints if ever needed
        Promise.all([
          getDashboardSummary().catch(() => null),
          getRevenueByBranch().catch(() => []),
          getOrdersByCategory().catch(() => []),
          getRevenueTrend(12).catch(() => []),
          getTopDishes(5).catch(() => []),
          getTopCustomers(5).catch(() => []),
          getTopRiders(5).catch(() => []),
        ]).then(([summaryData, branchData, categoryData, trendData, dishesData, customersData, ridersData]) => {
          if (!active) return;
          setSummary(summaryData);
          setRevenueByBranch(branchData || []);
          setOrdersByCategory(categoryData || []);
          setRevenueTrend(trendData || []);
          setTopDishes(dishesData || []);
          setTopCustomers(customersData || []);
          setTopRiders(ridersData || []);
          setIsLoading(false);
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-4 w-96 bg-neutral-100 dark:bg-neutral-850 rounded-lg" />
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                <div className="w-14 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800" />
              </div>
              <div className="space-y-1.5">
                <div className="w-20 h-3.5 rounded bg-neutral-100 dark:bg-neutral-800" />
                <div className="w-28 h-6 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 sm:gap-6">
          <div className="xl:col-span-3 h-80 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="w-40 h-5 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="w-56 h-3 bg-neutral-100 dark:bg-neutral-800 rounded" />
            </div>
            <div className="h-48 w-full bg-neutral-50 dark:bg-neutral-850 rounded-xl flex items-end justify-around p-4 gap-2">
              {[...Array(8)].map((_, j) => (
                <div key={j} className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-t" style={{ height: `${30 + (j * 15) % 60}%` }} />
              ))}
            </div>
          </div>

          <div className="xl:col-span-2 h-80 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="w-36 h-5 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="w-48 h-3 bg-neutral-100 dark:bg-neutral-800 rounded" />
            </div>
            <div className="h-44 w-44 rounded-full border-8 border-neutral-100 dark:border-neutral-800 mx-auto my-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-neutral-50 dark:bg-neutral-850" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [expandedCard, setExpandedCard] = useState(null); // 'branch' | 'category' | 'trend' | 'performers' | null
  const [activePerformerTab, setActivePerformerTab] = useState('dishes'); // 'dishes' | 'customers' | 'riders'
  const [trendMonths, setTrendMonths] = useState(12);

  const toggleExpand = (cardKey) => {
    setExpandedCard((prev) => (prev === cardKey ? null : cardKey));
  };

  const handleOpenSalesExport = async () => {
    if (orders.length === 0) {
      try {
        setIsFetchingOrders(true);
        const data = await getAllOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch orders for sales export:", err);
      } finally {
        setIsFetchingOrders(false);
      }
    }
    setIsExportModalOpen(true);
  };

  const barData = [...revenueByBranch]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, expandedCard === 'branch' ? 12 : 8)
    .map((b) => ({ id: b.branchId, label: b.shortName, fullLabel: b.name, value: b.revenue }));

  const pieData = ordersByCategory.map((c) => ({ label: c.category, value: c.value }));
  const lineData = revenueTrend
    .slice(trendMonths === 6 ? -6 : -12)
    .map((t) => ({ label: t.month, value: t.revenue }));

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Dashboard Overview
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time analytics across {summary?.totalBranches || 0} Barcode branches. Click expand on any card to zoom.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {expandedCard && (
            <button
              type="button"
              onClick={() => setExpandedCard(null)}
              className="px-3 py-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Reset to 2-Row Grid
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenSalesExport}
            disabled={isFetchingOrders}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isFetchingOrders ? "Loading Sales..." : "Export Sales to Excel"}</span>
          </button>
        </div>
      </motion.div>

      {/* 🎯 Stat Cards: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
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

      {/* ========================================================================= */}
      {/* 🎯 CHARTS ROW 1: Revenue by Branch (Bar) + Category Distribution (Donut)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 sm:gap-6 items-start">
        {/* Card 1: Revenue by Branch */}
        {(expandedCard === null || expandedCard === 'branch') && (
          <ChartCard
            title="Revenue by Branch"
            subtitle={expandedCard === 'branch' ? "Full breakdown across all active branches" : "Top branches this period"}
            className={expandedCard === 'branch' ? 'col-span-full' : 'xl:col-span-3'}
            isExpanded={expandedCard === 'branch'}
            onToggleExpand={() => toggleExpand('branch')}
          >
            <BarChart
              data={barData}
              valueFormatter={currency}
              barLabel="Revenue"
              height={expandedCard === 'branch' ? 340 : 240}
            />
          </ChartCard>
        )}

        {/* Card 2: Orders by Category */}
        {(expandedCard === null || expandedCard === 'category') && (
          <ChartCard
            title="Orders by Category"
            subtitle="Share of total order volume"
            className={expandedCard === 'category' ? 'col-span-full' : 'xl:col-span-2'}
            isExpanded={expandedCard === 'category'}
            onToggleExpand={() => toggleExpand('category')}
          >
            <PieChart data={pieData} valueFormatter={compactNumber} />
          </ChartCard>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🎯 CHARTS ROW 2: Revenue Trend (Line) + Top Performers Showcase (Tabbed)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 sm:gap-6 items-start">
        {/* Card 3: Revenue Trend */}
        {(expandedCard === null || expandedCard === 'trend') && (
          <ChartCard
            title="Revenue Growth Trend"
            subtitle={`Monthly trajectory (${trendMonths} months)`}
            className={expandedCard === 'trend' ? 'col-span-full' : 'xl:col-span-3'}
            isExpanded={expandedCard === 'trend'}
            onToggleExpand={() => toggleExpand('trend')}
            action={
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTrendMonths(6)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trendMonths === 6
                      ? 'bg-white dark:bg-neutral-900 text-primary-500 shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  6M
                </button>
                <button
                  type="button"
                  onClick={() => setTrendMonths(12)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trendMonths === 12
                      ? 'bg-white dark:bg-neutral-900 text-primary-500 shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  12M
                </button>
              </div>
            }
          >
            <LineChart
              data={lineData}
              valueFormatter={currency}
              height={expandedCard === 'trend' ? 320 : 220}
            />
          </ChartCard>
        )}

        {/* Card 4: Top Performers (Tabbed / Expandable) */}
        {(expandedCard === null || expandedCard === 'performers') && (
          <ChartCard
            title="Top Performers"
            subtitle={
              expandedCard === 'performers'
                ? "Full side-by-side performance matrix"
                : "Top contributors to sales & operations"
            }
            className={expandedCard === 'performers' ? 'col-span-full' : 'xl:col-span-2'}
            isExpanded={expandedCard === 'performers'}
            onToggleExpand={() => toggleExpand('performers')}
            action={
              expandedCard !== 'performers' && (
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActivePerformerTab('dishes')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activePerformerTab === 'dishes'
                        ? 'bg-white dark:bg-neutral-900 text-primary-500 shadow-xs'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>Dishes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePerformerTab('customers')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activePerformerTab === 'customers'
                        ? 'bg-white dark:bg-neutral-900 text-primary-500 shadow-xs'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Customers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePerformerTab('riders')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activePerformerTab === 'riders'
                        ? 'bg-white dark:bg-neutral-900 text-primary-500 shadow-xs'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <Bike className="w-3 h-3" />
                    <span>Riders</span>
                  </button>
                </div>
              )
            }
          >
            {/* If Expanded: Show All 3 in a balanced 3-column grid */}
            {expandedCard === 'performers' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* 1. Top Dishes */}
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary-500 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    Top Selling Dishes
                  </h4>
                  <div className="flex flex-col gap-2">
                    {topDishes.map((dish, i) => (
                      <div key={dish.id || i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[160px]">
                          {i + 1}. {dish.name}
                        </span>
                        <span className="text-xs font-extrabold text-primary-500 shrink-0">
                          {dish.orders ?? 0} orders
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Top Customers */}
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Top Valued Customers
                  </h4>
                  <div className="flex flex-col gap-2">
                    {topCustomers.slice(0, 5).map((customer, i) => (
                      <div key={customer._id || i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[160px]">
                          #{i + 1} {customer.name || 'Customer'}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {currency(customer.totalSpent || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Top Riders */}
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5" />
                    Top Delivery Riders
                  </h4>
                  <div className="flex flex-col gap-2">
                    {topRiders.slice(0, 5).map((rider, i) => (
                      <div key={rider.riderId || i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[160px]">
                          #{i + 1} {rider.name}
                        </span>
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100 shrink-0">
                          {rider.deliveries} trips
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* When in standard Split View: Show the active selected Tab */
              <div className="flex flex-col gap-1">
                {activePerformerTab === 'dishes' &&
                  topDishes.slice(0, 5).map((dish, i) => (
                    <div
                      key={dish.id || i}
                      className="flex items-center gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                    >
                      <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                          {dish.name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {dish.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-primary-500 font-bold text-sm shrink-0">
                        <Flame className="w-3.5 h-3.5" />
                        {dish.orders ?? 0}
                      </div>
                    </div>
                  ))}

                {activePerformerTab === 'customers' &&
                  (topCustomers.length > 0 ? (
                    topCustomers.slice(0, 5).map((customer, i) => (
                      <div
                        key={customer._id || i}
                        className="flex items-center gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                      >
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                          #{i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                            {customer.name || customer.fullName || 'Customer'}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {customer.orderCount ?? 0} Orders placed
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">
                          {currency(customer.totalSpent || 0)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-400 py-6 text-center">No customer data available</p>
                  ))}

                {activePerformerTab === 'riders' &&
                  (topRiders.length > 0 ? (
                    topRiders.slice(0, 5).map((rider, i) => (
                      <div
                        key={rider.riderId || i}
                        className="flex items-center gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                      >
                        <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">
                          #{rider.rank || i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                            {rider.name}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {rider.deliveries} deliveries ({rider.acceptanceRate || 100}% accepted)
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-primary-500">
                            {currency(rider.earnings || 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-400 py-6 text-center">No rider data available</p>
                  ))}
              </div>
            )}
          </ChartCard>
        )}
      </div>

      {/* 📥 EXPORT SALES MODAL */}
      <ExportSalesModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        orders={orders}
      />
    </div>
  );
};

export default AdminDashboard;
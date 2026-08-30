import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingBag,
  Building2,
  Star,
  Flame,
  User,
  Bike,
  FileSpreadsheet,
  Columns2,
  Columns3,
  Columns4,
  Rows3,
  Minimize,
  Maximize,
} from 'lucide-react';

import { StatCard } from '../../components/admin/StatCard';
import { ChartCard } from '../../components/admin/charts/ChartCard';
import { BarChart } from '../../components/admin/charts/BarChart';
import { PieChart } from '../../components/admin/charts/PieChart';
import { LineChart } from '../../components/admin/charts/LineChart';
import { RadialBarChart } from '../../components/admin/charts/RadialBarChart';
import { TreemapChart } from '../../components/admin/charts/TreemapChart';
import { RadarChart } from '../../components/admin/charts/RadarChart';
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

  // Layout & Density controls
  const [trendMonths, setTrendMonths] = useState(12);

  const [gridCols, setGridCols] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_dashboard_grid_cols');
      return saved ? Number(saved) : 3;
    } catch {
      return 3;
    }
  });

  const [cardDensity, setCardDensity] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_dashboard_card_density');
      return saved || 'normal'; // 'compact' | 'normal' | 'comfort'
    } catch {
      return 'normal';
    }
  });

  const handleSetGridCols = (cols) => {
    setGridCols(cols);
    try {
      localStorage.setItem('admin_dashboard_grid_cols', cols);
    } catch {
      // ignore
    }
  };

  const handleSetDensity = (density) => {
    setCardDensity(density);
    try {
      localStorage.setItem('admin_dashboard_card_density', density);
    } catch {
      // ignore
    }
  };

  const getGridColsClass = () => {
    switch (gridCols) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case 6:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
      case 3:
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  useEffect(() => {
    let active = true;

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

        {/* Charts Skeleton: Dynamic Grid */}
        <div className={`grid gap-5 sm:gap-6 ${getGridColsClass()}`}>
          {[...Array(6)].map((_, j) => (
            <div
              key={j}
              className="h-80 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="w-36 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
                <div className="w-48 h-3 bg-neutral-100 dark:bg-neutral-800 rounded-md" />
              </div>
              <div className="h-44 w-full bg-neutral-50 dark:bg-neutral-850 rounded-2xl flex items-center justify-center p-4">
                <div className="w-full h-full bg-neutral-200/50 dark:bg-neutral-800/50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
    .slice(0, 8)
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
            Real-time analytics across {summary?.totalBranches || 0} Barcode branches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* 📐 Card Density / Scale Selector */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/90 p-1 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs">
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 pl-2 pr-1 hidden sm:inline">
              Size:
            </span>
            <button
              type="button"
              onClick={() => handleSetDensity('compact')}
              title="Compact Size (ছোট - আরও কমপ্যাক্ট চার্ট)"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                cardDensity === 'compact'
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Minimize className="w-3 h-3" />
              <span>Compact</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetDensity('normal')}
              title="Standard Size (মিডিয়াম)"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                cardDensity === 'normal'
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Maximize className="w-3 h-3" />
              <span>Normal</span>
            </button>
          </div>

          {/* 🔲 Grid Columns Selector (1, 2, 3, 4, 6 Cols) */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/90 p-1 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs">
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 pl-2 pr-1 hidden sm:inline">
              Cols:
            </span>
            <button
              type="button"
              onClick={() => handleSetGridCols(1)}
              title="1 Column (Full Width Rows)"
              className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                gridCols === 1
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Rows3 className="w-3.5 h-3.5" />
              <span>1</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetGridCols(2)}
              title="2 Columns Grid"
              className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                gridCols === 2
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>2</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetGridCols(3)}
              title="3 Columns Grid (Standard 3x2)"
              className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                gridCols === 3
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>3</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetGridCols(4)}
              title="4 Columns Grid"
              className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                gridCols === 4
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Columns4 className="w-3.5 h-3.5" />
              <span>4</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenSalesExport}
            disabled={isFetchingOrders}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">{isFetchingOrders ? "Loading..." : "Export Sales"}</span>
            <span className="sm:hidden">Export</span>
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
      {/* 🎯 PRISTINE MINIMALIST CHARTS GRID (6 Charts Total)                       */}
      {/* ========================================================================= */}
      <div className={`grid gap-4 sm:gap-5 items-stretch ${getGridColsClass()}`}>
        {/* Card 1: Revenue by Branch (Bar Chart) */}
        <ChartCard
          title="Revenue by Branch"
          subtitle="Top branches this period"
          density={cardDensity}
        >
          <BarChart
            data={barData}
            valueFormatter={currency}
            barLabel="Revenue"
            height={cardDensity === 'compact' ? 150 : 200}
          />
        </ChartCard>

        {/* Card 2: Orders by Category (Donut / Pie Chart) */}
        <ChartCard
          title="Orders by Category"
          subtitle="Share of total order volume"
          density={cardDensity}
        >
          <PieChart
            data={pieData}
            valueFormatter={compactNumber}
            size={cardDensity === 'compact' ? 125 : 155}
          />
        </ChartCard>

        {/* Card 3: Revenue Growth Trend (Line Chart) */}
        <ChartCard
          title="Revenue Growth Trend"
          subtitle={`Monthly trajectory (${trendMonths} months)`}
          density={cardDensity}
          action={
            <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setTrendMonths(6)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
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
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
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
            height={cardDensity === 'compact' ? 150 : 200}
          />
        </ChartCard>

        {/* Card 4: Top Selling Dishes (Radial Bar Chart / Concentric Rings) */}
        <ChartCard
          title="Top Selling Dishes"
          subtitle="Radial order distribution"
          density={cardDensity}
          action={
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black">
              <Flame className="w-3 h-3" />
              <span>Radial</span>
            </div>
          }
        >
          <RadialBarChart
            items={topDishes}
            maxItems={5}
            size={cardDensity === 'compact' ? 135 : 165}
            emptyMessage="No dish orders recorded yet"
          />
        </ChartCard>

        {/* Card 5: Top Valued Customers (Treemap Chart / Weighted Mosaic) */}
        <ChartCard
          title="Top Valued Customers"
          subtitle="VIP revenue contribution mosaic"
          density={cardDensity}
          action={
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
              <User className="w-3 h-3" />
              <span>Treemap</span>
            </div>
          }
        >
          <TreemapChart
            items={topCustomers}
            maxItems={5}
            density={cardDensity}
            valueFormatter={currency}
            emptyMessage="No customer spending recorded yet"
          />
        </ChartCard>

        {/* Card 6: Top Delivery Riders (Radar / Spider Chart) */}
        <ChartCard
          title="Top Delivery Riders"
          subtitle="Rider efficiency spider web"
          density={cardDensity}
          action={
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black">
              <Bike className="w-3 h-3" />
              <span>Radar</span>
            </div>
          }
        >
          <RadarChart
            items={topRiders}
            maxItems={3}
            size={cardDensity === 'compact' ? 145 : 180}
            valueFormatter={currency}
            emptyMessage="No rider trips recorded yet"
          />
        </ChartCard>
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

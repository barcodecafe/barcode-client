import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  CircleDollarSign,
  ShoppingBag,
  Building2,
  Star,
  Flame,
  User,
  Bike,
  Download,
  FileSpreadsheet,
  Columns2,
  Columns3,
  Columns4,
  Rows3,
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

const DEFAULT_CARD_SIZES = {
  branch: { colSpan: 1, height: 200 },
  category: { colSpan: 1, height: 200 },
  trend: { colSpan: 1, height: 200 },
  dishes: { colSpan: 1, height: 200 },
  customers: { colSpan: 1, height: 200 },
  riders: { colSpan: 1, height: 200 },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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

  // Layout & Density controls (ALL HOOKS DECLARED AT TOP BEFORE ANY RETURNS)
  const [trendMonths, setTrendMonths] = useState(12);
  const [branchLimit, setBranchLimit] = useState(10);
  const [categoryLimit, setCategoryLimit] = useState(10);
  const [dishesLimit, setDishesLimit] = useState(10);
  const [customersLimit, setCustomersLimit] = useState(10);
  const [ridersLimit, setRidersLimit] = useState(10);

  // 🎛️ Metric Toggle Modes (By Volume vs By Money / Value)
  const [categoryMetric, setCategoryMetric] = useState('orders'); // 'orders' | 'revenue'
  const [dishesMetric, setDishesMetric] = useState('orders'); // 'orders' | 'revenue'
  const [customersMetric, setCustomersMetric] = useState('orders'); // 'orders' | 'spent'
  const [ridersMetric, setRidersMetric] = useState('trips'); // 'trips' | 'value'

  const [gridCols, setGridCols] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_dashboard_grid_cols');
      return saved ? Number(saved) : 3;
    } catch {
      return 3;
    }
  });

  const [heightMode, setHeightMode] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_dashboard_height_mode');
      return saved || 'small';
    } catch {
      return 'small';
    }
  });

  // 🔄 Synchronized Global Card Height across ALL cards
  const [globalCardHeight, setGlobalCardHeight] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_dashboard_card_height');
      return saved ? Number(saved) : 200;
    } catch {
      return 200;
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

  const handleSetHeightMode = (mode) => {
    setHeightMode(mode);
    const targetHeight = mode === 'small' ? 200 : 280;
    setGlobalCardHeight(targetHeight);
    try {
      localStorage.setItem('admin_dashboard_height_mode', mode);
      localStorage.setItem('admin_dashboard_card_height', targetHeight);
    } catch {
      // ignore
    }
  };

  // When ANY single card is resized via drag, ALL cards update their height synchronously!
  const handleResizeCard = (_cardId, newSettings) => {
    if (newSettings && newSettings.height) {
      setGlobalCardHeight(newSettings.height);
      try {
        localStorage.setItem('admin_dashboard_card_height', newSettings.height);
      } catch {
        // ignore
      }
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
          getTopDishes(15).catch(() => []),
          getTopCustomers(15).catch(() => []),
          getTopRiders(15).catch(() => []),
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
              className="h-56 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="w-36 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
                <div className="w-48 h-3 bg-neutral-100 dark:bg-neutral-800 rounded-md" />
              </div>
              <div className="h-32 w-full bg-neutral-50 dark:bg-neutral-850 rounded-2xl flex items-center justify-center p-4">
                <div className="w-full h-full bg-neutral-200/50 dark:bg-neutral-800/50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cleanBranchName = (name, shortName) => {
    const raw = (shortName || name || '').trim();
    const cleaned = raw
      .replace(/^Barcode\s+(Cafe|Restaurant|Lounge|Diner|Express|Bistro|Group)?\s*[-–—:]\s*/i, '')
      .replace(/^Barcode\s+/i, '')
      .trim();
    return cleaned || raw || 'Branch';
  };

  const currentBranchLimit = branchLimit === 'All' ? revenueByBranch.length : Number(branchLimit);
  const barData = [...revenueByBranch]
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, currentBranchLimit)
    .map((b) => ({
      id: b.branchId,
      label: cleanBranchName(b.name, b.shortName),
      fullLabel: b.name,
      value: b.revenue || 0,
    }));

  const currentCategoryLimit = categoryLimit === 'All' ? ordersByCategory.length : Number(categoryLimit);
  const pieData = [...ordersByCategory]
    .sort((a, b) => {
      if (categoryMetric === 'revenue') {
        return (b.revenue || 0) - (a.revenue || 0);
      }
      return (b.quantity || b.value || 0) - (a.quantity || a.value || 0);
    })
    .slice(0, currentCategoryLimit)
    .map((c) => ({
      label: c.category,
      value: categoryMetric === 'revenue' ? (c.revenue || 0) : (c.quantity || c.value || 0),
      quantity: c.quantity || c.value || 0,
      revenue: c.revenue || 0,
    }));
  
  const lineData = revenueTrend
    .slice(trendMonths === 6 ? -6 : -12)
    .map((t) => ({ label: t.month, value: t.revenue }));

  const currentDishesLimit = dishesLimit === 'All' ? Math.max(topDishes.length, 50) : Number(dishesLimit);
  const currentCustomersLimit = customersLimit === 'All' ? Math.max(topCustomers.length, 50) : Number(customersLimit);
  const currentRidersLimit = ridersLimit === 'All' ? Math.max(topRiders.length, 50) : Number(ridersLimit);

  const cardDensity = globalCardHeight < 220 ? 'compact' : 'normal';

  const renderLimitSwitcher = (value, onChange, options = [5, 10, 15, 'All']) => (
    <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50 shadow-2xs shrink-0">
      {options.map((opt) => {
        const isSelected = String(value).toLowerCase() === String(opt).toLowerCase();
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs font-black'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );

  const renderMetricSwitcher = (value, onChange, options = []) => (
    <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50 shadow-2xs shrink-0">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs font-black'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
      >
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Dashboard Overview
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time analytics across {summary?.totalBranches || 0} Barcode branches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* ↕️ Height Switcher: Show Small / Show Large */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800/90 p-0.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 pl-2 pr-1 hidden sm:inline">
              Height:
            </span>
            <button
              type="button"
              onClick={() => handleSetHeightMode('small')}
              title="Show Small (কমপ্যাক্ট হাইট - যাতে সব এক স্ক্রিনে ফিট হয়)"
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                heightMode === 'small'
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs font-black'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Small
            </button>
            <button
              type="button"
              onClick={() => handleSetHeightMode('large')}
              title="Show Large (স্ট্যান্ডার্ড হাইট)"
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                heightMode === 'large'
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs font-black'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Large
            </button>
          </div>

          {/* 🎛️ Column Selector Pill Switcher */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800/90 p-0.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 pl-2 pr-1 hidden sm:inline">
              Cols:
            </span>
            {[1, 2, 3, 4].map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => handleSetGridCols(cols)}
                className={`w-6 h-6 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  gridCols === cols
                    ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs font-black'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title={`Show ${cols} column${cols > 1 ? 's' : ''} layout`}
              >
                {cols === 1 && <span className="text-[10px]">🔲 1</span>}
                {cols === 2 && <span className="text-[10px]">🪟 2</span>}
                {cols === 3 && <span className="text-[10px]">⊞ 3</span>}
                {cols === 4 && <span className="text-[10px]">▦ 4</span>}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors shadow-xs shadow-primary-600/20 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sales</span>
          </button>
        </div>
      </motion.div>

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          icon={CircleDollarSign}
          label="Total Revenue"
          value={currency(summary?.totalRevenue || 0)}
          change={summary?.revenueChange}
          delay={0}
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={summary?.totalOrders || 0}
          change={summary?.orderChange}
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
      {/* 🎯 SYNCHRONIZED EQUAL HEIGHT CHARTS GRID (6 Charts Total)                 */}
      {/* ========================================================================= */}
      <div className={`grid gap-2.5 sm:gap-3 items-stretch ${getGridColsClass()}`}>
        {/* Card 1: Revenue by Branch (Bar Chart) */}
        <ChartCard
          id="branch"
          title="Revenue by Branch"
          subtitle="Branch sales leaderboard"
          height={globalCardHeight}
          density={cardDensity}
          maxCols={gridCols}
          onResize={handleResizeCard}
          action={renderLimitSwitcher(branchLimit, setBranchLimit, [5, 10, 15, 'All'])}
        >
          <BarChart
            data={barData}
            valueFormatter={currency}
            barLabel="Revenue"
            height={Math.max(95, globalCardHeight - 80)}
          />
        </ChartCard>

        {/* Card 2: Orders by Category (Donut Chart with Orders vs Sales ৳ Mode) */}
        <ChartCard
          id="category"
          title="Orders by Category"
          subtitle={categoryMetric === 'revenue' ? 'Ranked by total category sales revenue (৳)' : 'Share of total order volume'}
          height={globalCardHeight}
          density={cardDensity}
          maxCols={gridCols}
          onResize={handleResizeCard}
          action={
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {renderMetricSwitcher(categoryMetric, setCategoryMetric, [
                { label: 'Orders', value: 'orders' },
                { label: 'Sales ৳', value: 'revenue' },
              ])}
              {renderLimitSwitcher(categoryLimit, setCategoryLimit, [5, 10, 15, 'All'])}
            </div>
          }
        >
          <PieChart
            data={pieData}
            mode={categoryMetric}
            valueFormatter={compactNumber}
          />
        </ChartCard>

        {/* Card 3: Revenue Growth Trend (Line Chart) */}
        <ChartCard
          id="trend"
          title="Revenue Growth Trend"
          subtitle={`Monthly trajectory (${trendMonths} months)`}
          height={globalCardHeight}
          density={cardDensity}
          maxCols={gridCols}
          onResize={handleResizeCard}
          action={
            <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50 shadow-2xs">
              <button
                type="button"
                onClick={() => setTrendMonths(6)}
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all cursor-pointer ${
                  trendMonths === 6
                    ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs font-black'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => setTrendMonths(12)}
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all cursor-pointer ${
                  trendMonths === 12
                    ? 'bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-xs font-black'
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
            height={Math.max(95, globalCardHeight - 80)}
          />
        </ChartCard>

        {/* Card 4: Top Selling Dishes (Column Bar Chart with Orders vs Sales ৳ Mode) */}
        <ChartCard
          id="dishes"
          title="Top Selling Dishes"
          subtitle={dishesMetric === 'revenue' ? 'Ranked by total sales revenue (৳)' : 'Ranked by total dish order volume'}
          height={globalCardHeight}
          density={cardDensity}
          maxCols={gridCols}
          onResize={handleResizeCard}
          action={
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {renderMetricSwitcher(dishesMetric, setDishesMetric, [
                { label: 'Orders', value: 'orders' },
                { label: 'Sales ৳', value: 'revenue' },
              ])}
              {renderLimitSwitcher(dishesLimit, setDishesLimit, [5, 10, 15, 'All'])}
            </div>
          }
        >
          <RadialBarChart
            items={topDishes}
            maxItems={currentDishesLimit}
            mode={dishesMetric}
            height={Math.max(95, globalCardHeight - 80)}
            valueFormatter={currency}
            emptyMessage="No dish orders recorded yet"
          />
        </ChartCard>

        {/* Card 5: Top Valued Customers (Column Bar Chart with Orders vs Spent ৳ Mode) */}
        <ChartCard
          id="customers"
          title="Top Valued Customers"
          subtitle={customersMetric === 'spent' ? 'Ranked by lifetime spending (৳)' : 'Ranked by total order frequency'}
          height={globalCardHeight}
          density={cardDensity}
          maxCols={gridCols}
          onResize={handleResizeCard}
          action={
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {renderMetricSwitcher(customersMetric, setCustomersMetric, [
                { label: 'Orders', value: 'orders' },
                { label: 'Spent ৳', value: 'spent' },
              ])}
              {renderLimitSwitcher(customersLimit, setCustomersLimit, [5, 10, 15, 'All'])}
            </div>
          }
        >
          <TreemapChart
            items={topCustomers}
            maxItems={currentCustomersLimit}
            mode={customersMetric}
            height={Math.max(95, globalCardHeight - 80)}
            valueFormatter={currency}
            emptyMessage="No customer spending recorded yet"
          />
        </ChartCard>

        {/* Card 6: Top Delivery Riders (Column Bar Chart with Deliveries vs Delivered Value ৳ Mode) */}
        <ChartCard
          id="riders"
          title="Top Delivery Riders"
          subtitle={ridersMetric === 'value' ? 'Ranked by total delivered order value (৳)' : 'Ranked by completed deliveries'}
          height={globalCardHeight}
          density={cardDensity}
          maxCols={gridCols}
          onResize={handleResizeCard}
          action={
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {renderMetricSwitcher(ridersMetric, setRidersMetric, [
                { label: 'Deliveries', value: 'trips' },
                { label: 'Delivered Value ৳', value: 'value' },
              ])}
              {renderLimitSwitcher(ridersLimit, setRidersLimit, [5, 10, 15, 'All'])}
            </div>
          }
        >
          <RadarChart
            items={topRiders}
            maxItems={currentRidersLimit}
            mode={ridersMetric}
            height={Math.max(95, globalCardHeight - 80)}
            valueFormatter={currency}
            emptyMessage="No rider deliveries recorded yet"
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



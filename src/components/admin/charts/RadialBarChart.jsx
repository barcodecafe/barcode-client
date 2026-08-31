import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

// ---------------------------------------------------------------------------
// RadialBarChart.jsx -> Column Bar Chart for Top Selling Dishes
// Supports toggling between 'orders' (Volume) and 'revenue' (Taka collected)
// ---------------------------------------------------------------------------

const DISH_BAR_COLORS = [
  '#e02424', // Primary Red (Top Dish #1)
  '#f97316', // Orange (#2)
  '#f59e0b', // Amber (#3)
  '#10b981', // Emerald (#4)
  '#8b5cf6', // Violet (#5)
  '#06b6d4', // Cyan (#6)
  '#ec4899', // Pink (#7)
  '#3b82f6', // Blue (#8)
];

const compactNumber = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v);

export const RadialBarChart = ({
  items = [],
  valueFormatter = (v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`,
  maxItems = 15,
  mode = 'orders', // 'orders' | 'revenue'
  height = 120,
  emptyMessage = 'No dish orders recorded yet',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Sort items according to active metric mode
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (mode === 'revenue') {
        const revA = a.revenue || (a.price || 0) * (a.orders || 0);
        const revB = b.revenue || (b.price || 0) * (b.orders || 0);
        return revB - revA;
      }
      return (b.orders || 0) - (a.orders || 0);
    });
  }, [items, mode]);

  const displayedItems = useMemo(() => {
    return sortedItems.slice(0, maxItems);
  }, [sortedItems, maxItems]);

  const maxValue = useMemo(() => {
    if (displayedItems.length === 0) return 1;
    return Math.max(
      ...displayedItems.map((d) => {
        if (mode === 'revenue') {
          return d.revenue || (d.price || 0) * (d.orders || 0);
        }
        return d.orders || 0;
      }),
      1
    );
  }, [displayedItems, mode]);

  const gridLines = [0, 0.33, 0.66, 1];

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <Flame className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  const isDense = displayedItems.length > 8;

  return (
    <div className="w-full flex flex-col justify-between select-none">
      {/* 📊 Chart Canvas with Y-Axis Gridlines & Vertical Bars */}
      <div className="relative w-full" style={{ height: Math.max(90, height) }}>
        {/* Y-axis guideline levels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
          {gridLines
            .slice()
            .reverse()
            .map((g, idx) => {
              const tickVal = Math.round(maxValue * g);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 w-9 text-right shrink-0 leading-none">
                    {mode === 'revenue' ? valueFormatter(tickVal) : compactNumber(tickVal)}
                  </span>
                  <div className="flex-1 border-b border-neutral-100 dark:border-neutral-800/80" />
                </div>
              );
            })}
        </div>

        {/* Vertical Bars Container */}
        <div
          className="absolute inset-0 pl-11 flex items-end"
          style={{ gap: isDense ? 4 : displayedItems.length > 5 ? 6 : 12 }}
        >
          {displayedItems.map((dish, i) => {
            const orders = dish.orders || 0;
            const revenue = dish.revenue || (dish.price || 0) * orders;
            const metricVal = mode === 'revenue' ? revenue : orders;
            const heightPct = (metricVal / maxValue) * 100;
            const isHovered = hoveredIndex === i;
            const color = DISH_BAR_COLORS[i % DISH_BAR_COLORS.length];

            return (
              <div
                key={`${dish.id || dish.name || i}-${mode}`}
                title={`${dish.name}: ${orders} orders • ${valueFormatter(revenue)}`}
                className="relative flex-1 h-full flex flex-col justify-end items-center min-w-0 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full z-20 px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold whitespace-nowrap shadow-xl pointer-events-none flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span>#{i + 1} {dish.name}:</span>
                    <span className="font-black text-amber-300 dark:text-primary-600">
                      {mode === 'revenue' ? valueFormatter(revenue) : `${orders} orders`}
                    </span>
                    <span className="text-white/60 dark:text-neutral-500 font-semibold">
                      ({mode === 'revenue' ? `${orders} ord` : valueFormatter(revenue)})
                    </span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-neutral-100" />
                  </div>
                )}

                {/* Vertical Column Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(6, heightPct)}%` }}
                  transition={{ duration: 0.45, delay: i * 0.02, ease: 'easeOut' }}
                  className="w-full rounded-t-sm sm:rounded-t-md transition-all duration-150"
                  style={{
                    backgroundColor: color,
                    opacity: hoveredIndex === null || isHovered ? 1 : 0.45,
                    transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    boxShadow: isHovered ? `0 0 10px ${color}60` : 'none',
                    minHeight: 4,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Guaranteed Visible X-Axis Dish Labels Row */}
      <div
        className="flex items-center pl-11 mt-1.5 w-full"
        style={{ gap: isDense ? 4 : displayedItems.length > 5 ? 6 : 12 }}
      >
        {displayedItems.map((dish, i) => (
          <span
            key={`lbl-${dish.id || dish.name || i}-${mode}`}
            title={dish.name}
            className={`flex-1 ${isDense ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'} text-center truncate px-0.5 leading-none transition-colors ${
              hoveredIndex === i
                ? 'font-black text-neutral-900 dark:text-white scale-105'
                : 'font-semibold text-neutral-500 dark:text-neutral-400'
            }`}
          >
            #{i + 1} {dish.name.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RadialBarChart;

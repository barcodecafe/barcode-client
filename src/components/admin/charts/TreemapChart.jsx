import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

// ---------------------------------------------------------------------------
// TreemapChart.jsx -> MUI X Multi-Color Column Bar Chart for Top Customers
// Displays VIP customer spending comparisons on clean vertical bars with Y-axis
// ---------------------------------------------------------------------------

const VIP_BAR_COLORS = [
  '#10b981', // Emerald #1 TOP VIP
  '#06b6d4', // Cyan #2
  '#f59e0b', // Amber #3
  '#8b5cf6', // Violet #4
  '#ec4899', // Pink #5
  '#3b82f6', // Blue #6
];

export const TreemapChart = ({
  items = [],
  valueFormatter = (v) => v,
  maxItems = 20,
  height = 120,
  emptyMessage = 'No customer spending data available',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const displayedItems = useMemo(() => {
    return items.slice(0, Math.min(6, maxItems));
  }, [items, maxItems]);

  const maxSpent = useMemo(() => {
    if (displayedItems.length === 0) return 1;
    return Math.max(...displayedItems.map((c) => c.totalSpent || 0), 1);
  }, [displayedItems]);

  const totalSpent = useMemo(() => {
    return displayedItems.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  }, [displayedItems]);

  const gridLines = [0, 0.33, 0.66, 1];

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <User className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-between select-none">
      {/* 📊 Chart Canvas with Y-Axis Gridlines & Vertical Bars */}
      <div className="relative w-full" style={{ height: Math.max(90, height) }}>
        {/* Y-axis guideline levels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
          {gridLines
            .slice()
            .reverse()
            .map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 w-9 text-right shrink-0 leading-none">
                  {valueFormatter(Math.round(maxSpent * g))}
                </span>
                <div className="flex-1 border-b border-neutral-100 dark:border-neutral-800/80" />
              </div>
            ))}
        </div>

        {/* Vertical Bars Container */}
        <div
          className="absolute inset-0 pl-11 flex items-end"
          style={{ gap: displayedItems.length > 4 ? 8 : 14 }}
        >
          {displayedItems.map((customer, i) => {
            const spent = customer.totalSpent || 0;
            const heightPct = (spent / maxSpent) * 100;
            const sharePct = totalSpent > 0 ? ((spent / totalSpent) * 100).toFixed(1) : 0;
            const isHovered = hoveredIndex === i;
            const color = VIP_BAR_COLORS[i % VIP_BAR_COLORS.length];

            return (
              <div
                key={customer.userId || customer.name || i}
                title={`${customer.name}: ${valueFormatter(spent)} • ${customer.orderCount || 0} orders (${sharePct}%)`}
                className="relative flex-1 h-full flex flex-col justify-end items-center min-w-0 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full z-20 px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold whitespace-nowrap shadow-xl pointer-events-none flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span>#{i + 1} {customer.name}:</span>
                    <span className="font-black text-amber-300 dark:text-primary-600">{valueFormatter(spent)}</span>
                    <span className="text-white/60 dark:text-neutral-500 font-semibold">({customer.orderCount || 0} ord)</span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-neutral-100" />
                  </div>
                )}

                {/* Vertical Column Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(6, heightPct)}%` }}
                  transition={{ duration: 0.45, delay: i * 0.04, ease: 'easeOut' }}
                  className="w-full rounded-t-md transition-all duration-150"
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

      {/* Guaranteed Visible X-Axis Customer Labels Row */}
      <div className="flex items-center pl-11 mt-1.5 w-full" style={{ gap: displayedItems.length > 4 ? 8 : 14 }}>
        {displayedItems.map((customer, i) => (
          <span
            key={`lbl-${customer.userId || customer.name || i}`}
            title={customer.name}
            className={`flex-1 text-[9px] sm:text-[10px] text-center truncate px-0.5 leading-none transition-colors ${
              hoveredIndex === i
                ? 'font-black text-neutral-900 dark:text-white scale-105'
                : 'font-semibold text-neutral-500 dark:text-neutral-400'
            }`}
          >
            #{i + 1} {customer.name.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TreemapChart;

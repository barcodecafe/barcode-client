import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Trophy } from 'lucide-react';

// ---------------------------------------------------------------------------
// TreemapChart.jsx -> MUI X Inspired VIP Customer Contribution Ranking Chart
// ---------------------------------------------------------------------------

const CUSTOMER_PALETTE = [
  '#10b981', // Emerald #1 VIP
  '#06b6d4', // Cyan #2
  '#f59e0b', // Amber #3
  '#8b5cf6', // Purple #4
  '#64748b', // Slate #5
];

export const TreemapChart = ({
  items = [],
  valueFormatter = (v) => v,
  maxItems = 5,
  emptyMessage = 'No customer spending data available',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const displayedItems = useMemo(() => {
    return items.slice(0, maxItems);
  }, [items, maxItems]);

  const maxSpent = useMemo(() => {
    if (displayedItems.length === 0) return 1;
    return Math.max(...displayedItems.map((c) => c.totalSpent || 0), 1);
  }, [displayedItems]);

  const totalSpent = useMemo(() => {
    return displayedItems.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  }, [displayedItems]);

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <User className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-center gap-1.5 min-w-0 select-none">
      {displayedItems.map((customer, i) => {
        const spent = customer.totalSpent || 0;
        const pct = Math.max(5, Math.round((spent / maxSpent) * 100));
        const sharePct = totalSpent > 0 ? ((spent / totalSpent) * 100).toFixed(1) : 0;
        const barColor = CUSTOMER_PALETTE[i % CUSTOMER_PALETTE.length];
        const isHovered = hoveredIndex === i;

        return (
          <div
            key={customer.userId || customer.name || i}
            title={`${customer.name}: ${valueFormatter(spent)} • ${customer.orderCount || 0} orders (${sharePct}% share)`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex flex-col gap-0.5 p-1.5 rounded-lg transition-all cursor-pointer ${
              isHovered
                ? 'bg-neutral-100/90 dark:bg-neutral-800/90 shadow-2xs'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
            }`}
          >
            {/* Top Row: VIP badge + Customer name + Spending amount */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className="w-4 h-4 rounded-md text-[9px] font-black flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: barColor }}
                >
                  #{i + 1}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {customer.name}
                </span>
                {i === 0 && (
                  <span className="px-1 py-0.2 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[8px] font-black shrink-0">
                    TOP VIP
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className="text-[11px] sm:text-xs font-black"
                  style={{ color: barColor }}
                >
                  {valueFormatter(spent)}
                </span>
                <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                  ({customer.orderCount || 0} ord)
                </span>
              </div>
            </div>

            {/* Bottom Row: Spending progress bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: barColor,
                  boxShadow: isHovered ? `0 0 8px ${barColor}80` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TreemapChart;

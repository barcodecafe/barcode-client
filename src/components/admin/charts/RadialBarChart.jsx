import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

// ---------------------------------------------------------------------------
// RadialBarChart.jsx -> MUI X Inspired Ranked Progress Chart for Top Dishes
// ---------------------------------------------------------------------------

const PALETTE = [
  { stroke: '#e02424', bg: '#fee2e2', darkBg: '#37181c' }, // #1 Primary Red
  { stroke: '#f97316', bg: '#ffedd5', darkBg: '#3a2016' }, // #2 Orange
  { stroke: '#eab308', bg: '#fef9c3', darkBg: '#382f14' }, // #3 Amber
  { stroke: '#10b981', bg: '#d1fae5', darkBg: '#132d22' }, // #4 Emerald
  { stroke: '#8b5cf6', bg: '#ede9fe', darkBg: '#2a1b3d' }, // #5 Purple
];

export const RadialBarChart = ({
  items = [],
  maxItems = 5,
  emptyMessage = 'No dish order data available',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const displayedItems = useMemo(() => {
    return items.slice(0, maxItems);
  }, [items, maxItems]);

  const maxOrders = useMemo(() => {
    if (displayedItems.length === 0) return 1;
    return Math.max(...displayedItems.map((d) => d.orders || 0), 1);
  }, [displayedItems]);

  const totalOrders = useMemo(() => {
    return displayedItems.reduce((sum, d) => sum + (d.orders || 0), 0);
  }, [displayedItems]);

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <Flame className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-center gap-1.5 min-w-0 select-none">
      {displayedItems.map((dish, i) => {
        const orders = dish.orders || 0;
        const pct = Math.max(5, Math.round((orders / maxOrders) * 100));
        const sharePct = totalOrders > 0 ? Math.round((orders / totalOrders) * 100) : 0;
        const colorScheme = PALETTE[i % PALETTE.length];
        const isHovered = hoveredIndex === i;

        return (
          <div
            key={dish.dishId || dish.name || i}
            title={`${dish.name}: ${orders} orders (${sharePct}% of top dishes)`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex flex-col gap-0.5 p-1.5 rounded-lg transition-all cursor-pointer ${
              isHovered
                ? 'bg-neutral-100/90 dark:bg-neutral-800/90 shadow-2xs'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
            }`}
          >
            {/* Top row: Rank badge + Dish name + Orders count */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className="w-4 h-4 rounded-md text-[9px] font-black flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: colorScheme.stroke }}
                >
                  {i + 1}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {dish.name}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span
                  className="text-[10px] sm:text-[11px] font-black px-1.5 py-0.2 rounded"
                  style={{
                    color: colorScheme.stroke,
                    backgroundColor: `${colorScheme.stroke}16`,
                  }}
                >
                  {orders} orders
                </span>
                <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                  ({sharePct}%)
                </span>
              </div>
            </div>

            {/* Bottom row: MUI X Style Progress bar track & fill */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: colorScheme.stroke,
                  boxShadow: isHovered ? `0 0 8px ${colorScheme.stroke}80` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RadialBarChart;

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bike, Award, CheckCircle2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// RadarChart.jsx -> MUI X Inspired Rider Efficiency Performance Chart
// ---------------------------------------------------------------------------

const RIDER_PALETTE = [
  '#8b5cf6', // Purple #1
  '#10b981', // Emerald #2
  '#f59e0b', // Amber #3
];

export const RadarChart = ({
  items = [],
  valueFormatter = (v) => v,
  maxItems = 3,
  emptyMessage = 'No rider delivery data available',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const displayedRiders = useMemo(() => {
    return items.slice(0, maxItems);
  }, [items, maxItems]);

  const maxTrips = useMemo(() => {
    if (displayedRiders.length === 0) return 1;
    return Math.max(...displayedRiders.map((r) => r.deliveries || 0), 1);
  }, [displayedRiders]);

  if (!displayedRiders || displayedRiders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <Bike className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-center gap-2 min-w-0 select-none">
      {displayedRiders.map((rider, i) => {
        const deliveries = rider.deliveries || 0;
        const acceptRate = rider.acceptanceRate ?? 100;
        const earnings = rider.earnings || 0;
        const tripsPct = Math.max(8, Math.round((deliveries / maxTrips) * 100));
        const color = RIDER_PALETTE[i % RIDER_PALETTE.length];
        const isHovered = hoveredIndex === i;

        return (
          <div
            key={rider.riderId || rider.name || i}
            title={`${rider.name}: ${deliveries} trips • ${acceptRate}% acceptance • ${valueFormatter(earnings)} earned`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex flex-col gap-1 p-2 rounded-xl transition-all cursor-pointer ${
              isHovered
                ? 'bg-neutral-100/90 dark:bg-neutral-800/90 shadow-2xs'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
            }`}
          >
            {/* Top row: Rank badge + Rider name + Metrics pill */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className="w-4 h-4 rounded-md text-[9px] font-black flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: color }}
                >
                  #{i + 1}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {rider.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {acceptRate}% acc • {deliveries} trips
                </span>
                <span
                  className="text-[11px] sm:text-xs font-black px-1.5 py-0.2 rounded"
                  style={{
                    color,
                    backgroundColor: `${color}16`,
                  }}
                >
                  {valueFormatter(earnings)}
                </span>
              </div>
            </div>

            {/* Bottom row: Comparative performance bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tripsPct}%` }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: isHovered ? `0 0 8px ${color}80` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RadarChart;

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bike } from 'lucide-react';

// ---------------------------------------------------------------------------
// RadarChart.jsx -> Column Bar Chart for Top Delivery Riders
// Supports toggling between 'trips' (Volume) and 'value' (Delivered Value ৳)
// ---------------------------------------------------------------------------

const RIDER_BAR_COLORS = [
  '#3b82f6', // Blue #1 TOP
  '#8b5cf6', // Violet #2
  '#06b6d4', // Cyan #3
  '#10b981', // Emerald #4
  '#f59e0b', // Amber #5
  '#ec4899', // Pink #6
  '#e02424', // Red #7
];

const compactNumber = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v);

export const RadarChart = ({
  items = [],
  valueFormatter = (v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`,
  maxItems = 15,
  mode = 'trips', // 'trips' | 'value'
  height = 120,
  emptyMessage = 'No rider delivery data available',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Sort riders according to active metric mode
  const sortedRiders = useMemo(() => {
    return [...items].sort((a, b) => {
      if (mode === 'value') {
        const valA = a.deliveredValue || a.earnings || 0;
        const valB = b.deliveredValue || b.earnings || 0;
        return valB - valA;
      }
      return (b.deliveries || 0) - (a.deliveries || 0);
    });
  }, [items, mode]);

  const displayedRiders = useMemo(() => {
    return sortedRiders.slice(0, maxItems);
  }, [sortedRiders, maxItems]);

  const maxValue = useMemo(() => {
    if (displayedRiders.length === 0) return 1;
    return Math.max(
      ...displayedRiders.map((r) => {
        if (mode === 'value') {
          return r.deliveredValue || r.earnings || 0;
        }
        return r.deliveries || 0;
      }),
      1
    );
  }, [displayedRiders, mode]);

  const gridLines = [0, 0.33, 0.66, 1];

  if (!displayedRiders || displayedRiders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <Bike className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  const isDense = displayedRiders.length > 8;

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
                    {mode === 'value' ? valueFormatter(tickVal) : compactNumber(tickVal)}
                  </span>
                  <div className="flex-1 border-b border-neutral-100 dark:border-neutral-800/80" />
                </div>
              );
            })}
        </div>

        {/* Vertical Bars Container */}
        <div
          className="absolute inset-0 pl-11 flex items-end"
          style={{ gap: isDense ? 4 : displayedRiders.length > 5 ? 6 : 12 }}
        >
          {displayedRiders.map((rider, i) => {
            const trips = rider.deliveries || 0;
            const deliveredVal = rider.deliveredValue || rider.earnings || 0;
            const metricVal = mode === 'value' ? deliveredVal : trips;
            const heightPct = (metricVal / maxValue) * 100;
            const isHovered = hoveredIndex === i;
            const color = RIDER_BAR_COLORS[i % RIDER_BAR_COLORS.length];

            return (
              <div
                key={`${rider.riderId || rider._id || rider.name || i}-${mode}`}
                title={`${rider.name}: ${trips} trips • ${valueFormatter(deliveredVal)}`}
                className="relative flex-1 h-full flex flex-col justify-end items-center min-w-0 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full z-20 px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold whitespace-nowrap shadow-xl pointer-events-none flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span>#{i + 1} {rider.name}:</span>
                    <span className="font-black text-amber-300 dark:text-primary-600">
                      {mode === 'value' ? valueFormatter(deliveredVal) : `${trips} trips`}
                    </span>
                    <span className="text-white/60 dark:text-neutral-500 font-semibold">
                      ({mode === 'value' ? `${trips} trips` : valueFormatter(deliveredVal)})
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

      {/* Guaranteed Visible X-Axis Rider Labels Row */}
      <div
        className="flex items-center pl-11 mt-1.5 w-full"
        style={{ gap: isDense ? 4 : displayedRiders.length > 5 ? 6 : 12 }}
      >
        {displayedRiders.map((rider, i) => (
          <span
            key={`lbl-${rider.riderId || rider._id || rider.name || i}-${mode}`}
            title={rider.name}
            className={`flex-1 ${isDense ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'} text-center truncate px-0.5 leading-none transition-colors ${
              hoveredIndex === i
                ? 'font-black text-neutral-900 dark:text-white scale-105'
                : 'font-semibold text-neutral-500 dark:text-neutral-400'
            }`}
          >
            #{i + 1} {rider.name.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;

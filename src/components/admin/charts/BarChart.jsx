import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// BarChart.jsx - MUI X Inspired Multi-Color Branch Bar Chart
// ---------------------------------------------------------------------------

const PALETTE = [
  '#3b82f6', // Royal Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const BarChart = ({ data = [], valueFormatter = (v) => v, barLabel = 'Revenue', height = 120 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map((d) => d.value || 0), 1);
  }, [data]);

  const gridLines = [0, 0.33, 0.66, 1];

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
        <p className="text-xs font-medium">No {barLabel.toLowerCase()} data available</p>
      </div>
    );
  }

  const displayedData = data.slice(0, 15);

  const isDense = displayedData.length > 8;

  return (
    <div className="w-full flex flex-col justify-between select-none">
      <div className="relative w-full" style={{ height }}>
        {/* Y-axis guideline levels (MUI X Style) */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
          {gridLines
            .slice()
            .reverse()
            .map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 w-9 text-right shrink-0 leading-none">
                  {valueFormatter(Math.round(maxValue * g))}
                </span>
                <div className="flex-1 border-b border-neutral-100 dark:border-neutral-800/80" />
              </div>
            ))}
        </div>

        {/* Bars Container */}
        <div
          className="absolute inset-0 pl-11 flex items-end"
          style={{ gap: isDense ? 4 : displayedData.length > 5 ? 6 : 12 }}
        >
          {displayedData.map((d, i) => {
            const heightPct = ((d.value || 0) / maxValue) * 100;
            const isHovered = hoveredIndex === i;
            const barColor = PALETTE[i % PALETTE.length];

            return (
              <div
                key={d.id ?? d.label ?? i}
                title={`${d.fullLabel || d.label}: ${valueFormatter(d.value)}`}
                className="relative flex-1 h-full flex flex-col justify-end items-center min-w-0 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* MUI X Style Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full z-20 px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold whitespace-nowrap shadow-xl pointer-events-none flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: barColor }} />
                    <span>{d.fullLabel || d.label}:</span>
                    <span className="font-black text-amber-300 dark:text-primary-600">{valueFormatter(d.value)}</span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-neutral-100" />
                  </div>
                )}

                {/* The Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(5, heightPct)}%` }}
                  transition={{ duration: 0.45, delay: i * 0.02, ease: 'easeOut' }}
                  className="w-full rounded-t-sm sm:rounded-t-md transition-all duration-150"
                  style={{
                    backgroundColor: barColor,
                    opacity: hoveredIndex === null || isHovered ? 1 : 0.45,
                    transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    boxShadow: isHovered ? `0 0 10px ${barColor}60` : 'none',
                    minHeight: 4,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Guaranteed Visible X-Axis Labels Row */}
      <div
        className="flex items-center pl-11 mt-1.5 w-full"
        style={{ gap: isDense ? 4 : displayedData.length > 5 ? 6 : 12 }}
      >
        {displayedData.map((d, i) => (
          <span
            key={`lbl-${d.id ?? d.label ?? i}`}
            title={d.fullLabel || d.label}
            className={`flex-1 ${isDense ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'} text-center truncate px-0.5 leading-none transition-colors ${
              hoveredIndex === i
                ? 'font-black text-neutral-900 dark:text-white scale-105'
                : 'font-semibold text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BarChart;

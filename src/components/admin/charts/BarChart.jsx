import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// BarChart.jsx
//
// Custom SVG bar chart — no charting library dependency. Built to read
// `data` as an array of { label, value } and render proportional vertical
// bars with a hover tooltip, using the project's primary-500 token family.
// ---------------------------------------------------------------------------

const CHART_HEIGHT = 240;
const BAR_GAP = 14;

export const BarChart = ({ data, valueFormatter = (v) => v, barLabel = 'Revenue' }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  // Horizontal gridlines at 0%, 25%, 50%, 75%, 100% of max value.
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
        <p className="text-sm font-medium">No {barLabel.toLowerCase()} data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative" style={{ height: CHART_HEIGHT + 40 }}>
        {/* Gridlines + Y-axis labels */}
        <div className="absolute inset-0 flex flex-col justify-between pb-10">
          {gridLines
            .slice()
            .reverse()
            .map((g) => (
              <div key={g} className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-400 dark:text-neutral-600 w-10 text-right shrink-0">
                  {valueFormatter(Math.round(maxValue * g))}
                </span>
                <div className="flex-1 border-t border-neutral-100 dark:border-neutral-800" />
              </div>
            ))}
        </div>

        {/* Bars */}
        <div
          className="absolute inset-0 pl-12 pb-10 flex items-end"
          style={{ gap: BAR_GAP }}
        >
          {data.map((d, i) => {
            const heightPct = (d.value / maxValue) * 100;
            const isHovered = hoveredIndex === i;
            return (
              <div
                key={d.label}
                className="relative flex-1 h-full flex flex-col justify-end items-center min-w-0"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full z-10 px-2.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold whitespace-nowrap shadow-lg pointer-events-none">
                    {d.fullLabel || d.label}: {valueFormatter(d.value)}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-neutral-100" />
                  </div>
                )}

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                  className={`w-full rounded-t-md transition-colors duration-200 ${
                    isHovered ? 'bg-primary-600' : 'bg-primary-500'
                  }`}
                  style={{ minHeight: 2 }}
                />

                {/* X-axis label */}
                <span className="absolute -bottom-9 text-[10px] text-neutral-500 dark:text-neutral-400 text-center leading-tight max-w-full truncate w-full px-0.5">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 dark:text-neutral-600 mt-2 text-center sm:hidden">
        Scroll or rotate device for full {barLabel.toLowerCase()} breakdown
      </p>
    </div>
  );
};

export default BarChart;

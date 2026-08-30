import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// BarChart.jsx
//
// Custom SVG bar chart — no charting library dependency. Built to read
// `data` as an array of { label, value } and render proportional vertical
// bars with a hover tooltip, using the project's primary-500 token family.
// ---------------------------------------------------------------------------

export const BarChart = ({ data, valueFormatter = (v) => v, barLabel = 'Revenue', height = 120 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  // Horizontal gridlines at 0%, 25%, 50%, 75%, 100% of max value.
  const gridLines = [0, 0.33, 0.66, 1];

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
        <p className="text-xs font-medium">No {barLabel.toLowerCase()} data available</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-between">
      <div className="relative w-full" style={{ height }}>
        {/* Y-axis guideline levels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
          {gridLines
            .slice()
            .reverse()
            .map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 w-9 text-right shrink-0 leading-none">
                  {valueFormatter(Math.round(maxValue * g))}
                </span>
                <div className="flex-1 border-b border-dashed border-neutral-200 dark:border-neutral-800" />
              </div>
            ))}
        </div>

        {/* Bars */}
        <div
          className="absolute inset-0 pl-11 flex items-end"
          style={{ gap: data.length > 5 ? 6 : 12 }}
        >
          {data.slice(0, 6).map((d, i) => {
            const heightPct = (d.value / maxValue) * 100;
            const isHovered = hoveredIndex === i;
            return (
              <div
                key={d.id ?? d.label}
                title={`${d.fullLabel || d.label}: ${valueFormatter(d.value)}`}
                className="relative flex-1 h-full flex flex-col justify-end items-center min-w-0"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full z-10 px-2 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold whitespace-nowrap shadow-lg pointer-events-none">
                    {d.fullLabel || d.label}: {valueFormatter(d.value)}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-neutral-100" />
                  </div>
                )}

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, heightPct)}%` }}
                  transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
                  className={`w-full rounded-t transition-colors duration-200 ${
                    isHovered ? 'bg-primary-600' : 'bg-primary-500'
                  }`}
                  style={{ minHeight: 4 }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Guaranteed Visible X-Axis Labels Row */}
      <div className="flex items-center pl-11 mt-1.5 w-full" style={{ gap: data.length > 5 ? 6 : 12 }}>
        {data.slice(0, 6).map((d) => (
          <span
            key={`lbl-${d.id ?? d.label}`}
            title={d.fullLabel || d.label}
            className="flex-1 text-[9px] sm:text-[10px] font-bold text-neutral-600 dark:text-neutral-300 text-center truncate px-0.5 leading-none"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BarChart;

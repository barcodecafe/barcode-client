import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart as PieIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// PieChart.jsx -> Modern Interactive Donut Chart for Categories
// Dynamically adjusts donut size and legend density based on gridCols / screen,
// ensuring zero text-overlap on 3 & 4 column layouts on all screens.
// ---------------------------------------------------------------------------

const CATEGORY_PALETTE = [
  '#e02424', // Primary Red #1
  '#f97316', // Orange #2
  '#f59e0b', // Amber #3
  '#10b981', // Emerald #4
  '#06b6d4', // Cyan #5
  '#3b82f6', // Royal Blue #6
  '#8b5cf6', // Violet #7
  '#ec4899', // Pink #8
  '#14b8a6', // Teal #9
  '#6366f1', // Indigo #10
  '#84cc16', // Lime #11
  '#d946ef', // Fuchsia #12
  '#0ea5e9', // Sky #13
  '#64748b', // Slate #14
];

const compactNumber = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v);
const currencyFormat = (v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`;

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const clampedEnd = Math.min(endAngle, 359.99);
  const start = polarToCartesian(cx, cy, r, clampedEnd);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = clampedEnd - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export const PieChart = ({
  data = [],
  mode = 'orders', // 'orders' | 'revenue'
  gridCols = 3,
  valueFormatter = (v) => v,
  emptyMessage = 'No category order data available',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Total value calculation based on active mode
  const total = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, d) => sum + (d.value || 0), 0);
  }, [data]);

  const totalQuantity = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, d) => sum + (d.quantity ?? d.value ?? 0), 0);
  }, [data]);

  const totalRevenue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, d) => sum + (d.revenue || 0), 0);
  }, [data]);

  // Compute proportional segments for EVERY category
  const segments = useMemo(() => {
    if (total === 0 || !data || data.length === 0) return [];
    let cumulativeAngle = 0;
    return data.map((d, i) => {
      let angle = (d.value / total) * 360;
      if (angle === 360) angle = 359.99;
      const segment = {
        ...d,
        startAngle: cumulativeAngle,
        endAngle: cumulativeAngle + angle,
        color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
        pct: ((d.value / total) * 100).toFixed(1),
        quantity: d.quantity ?? (mode === 'orders' ? d.value : 0),
        revenue: d.revenue ?? (mode === 'revenue' ? d.value : 0),
      };
      cumulativeAngle += angle;
      return segment;
    });
  }, [data, total, mode]);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <PieIcon className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  const isCompact = gridCols >= 3;

  // Vector canvas dimensions
  const SIZE = 160;
  const CENTER = SIZE / 2;
  const RADIUS = SIZE * 0.38;
  const STROKE = SIZE * 0.17;

  const activeSegment = hoveredIndex !== null && segments[hoveredIndex] ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full h-full min-w-0 select-none">
      {/* 🎯 Donut SVG Canvas (Scaled to fit without crowding 3/4 column layouts) */}
      <div
        className={`relative shrink-0 flex items-center justify-center ${
          isCompact
            ? 'w-[105px] h-[105px] sm:w-[115px] sm:h-[115px] xl:w-[125px] xl:h-[125px]'
            : 'w-[130px] h-[130px] sm:w-[155px] sm:h-[155px] 2xl:w-[185px] 2xl:h-[185px] flex-1'
        }`}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-full transform -rotate-90 drop-shadow-xs overflow-visible"
        >
          {segments.map((seg, i) => (
            <motion.path
              key={`${seg.label}-${mode}`}
              d={describeArc(CENTER, CENTER, RADIUS, seg.startAngle, seg.endAngle)}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIndex === i ? STROKE + 4 : STROKE}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: i * 0.02, ease: 'easeOut' }}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease, opacity 0.2s ease' }}
              opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.4}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Center Summary Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-1">
          {activeSegment ? (
            <>
              <span
                className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base 2xl:text-lg'} font-black font-display tracking-tight leading-tight`}
                style={{ color: activeSegment.color }}
              >
                {activeSegment.pct}%
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-neutral-800 dark:text-neutral-100 max-w-[65px] truncate leading-tight">
                {activeSegment.label}
              </span>
              <span className="text-[7px] sm:text-[8px] font-semibold text-neutral-400 dark:text-neutral-500 leading-tight">
                {mode === 'revenue' ? currencyFormat(activeSegment.revenue) : `${activeSegment.quantity} ord`}
              </span>
            </>
          ) : (
            <>
              <span className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base 2xl:text-lg'} font-black text-neutral-900 dark:text-neutral-100 font-display tracking-tight leading-tight`}>
                {mode === 'revenue' ? currencyFormat(totalRevenue) : compactNumber(totalQuantity)}
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-tighter leading-tight">
                {mode === 'revenue' ? 'Sales' : 'Total'}
              </span>
              <span className="text-[7px] sm:text-[8px] font-semibold text-neutral-500 dark:text-neutral-400 leading-tight">
                {segments.length} Cat
              </span>
            </>
          )}
        </div>
      </div>

      {/* 📋 Legend: Right-Aligned, zero-wrap clean tabular format */}
      <div className="flex-1 min-w-0 w-full max-w-full">
        <div
          className="w-full flex flex-col gap-0.5 max-h-[165px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
        >
          {segments.map((seg, i) => {
            const isHovered = hoveredIndex === i;
            const hasRevenue = typeof seg.revenue === 'number' && seg.revenue > 0;

            return (
              <div
                key={`${seg.label}-${mode}`}
                title={`${seg.label}: ${seg.quantity} orders • ${currencyFormat(seg.revenue)} (${seg.pct}%)`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded-lg cursor-pointer transition-colors duration-150 min-w-0 ${
                  isHovered
                    ? 'bg-neutral-100 dark:bg-neutral-800 shadow-2xs'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                {/* Left: Dot + Category Name (Cleanly truncated, never overflows) */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-150"
                    style={{
                      backgroundColor: seg.color,
                      transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                  <span
                    className={`text-[10px] sm:text-[11px] truncate transition-colors ${
                      isHovered
                        ? 'font-black text-neutral-900 dark:text-white'
                        : 'font-semibold text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {seg.label}
                  </span>
                </div>

                {/* Right: Numbers with zero wrapping */}
                <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                  {mode === 'revenue' ? (
                    <>
                      <span
                        className="text-[10px] sm:text-[11px] font-black shrink-0"
                        style={{ color: isHovered ? seg.color : undefined }}
                      >
                        {currencyFormat(seg.revenue)}
                      </span>
                      {!isCompact && (
                        <span className="text-[8px] font-semibold text-neutral-400 dark:text-neutral-500 shrink-0">
                          ({seg.quantity} ord)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span
                        className="text-[10px] sm:text-[11px] font-black shrink-0"
                        style={{ color: isHovered ? seg.color : undefined }}
                      >
                        {seg.quantity} ord
                      </span>
                      {!isCompact && hasRevenue && (
                        <span className="text-[8px] font-semibold text-neutral-400 dark:text-neutral-500 shrink-0">
                          ({currencyFormat(seg.revenue)})
                        </span>
                      )}
                    </>
                  )}
                  <span
                    className={`text-[10px] sm:text-[11px] font-extrabold w-9 text-right shrink-0 ${
                      isHovered ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {seg.pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PieChart;

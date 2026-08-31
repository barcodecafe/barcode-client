import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart as PieIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// PieChart.jsx -> Modern Interactive Donut Chart for Categories
// Sized prominently on lg/2xl/3xl/4xl screens with expanding donut and
// compact right-aligned legend where category names sit close to their values.
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

  // Large crisp vector canvas
  const SIZE = 180;
  const CENTER = SIZE / 2;
  const RADIUS = SIZE * 0.38;
  const STROKE = SIZE * 0.17;

  const activeSegment = hoveredIndex !== null && segments[hoveredIndex] ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 w-full h-full min-w-0 select-none">
      {/* 🎯 Expanding Large Donut SVG Canvas (Takes space on 2xl/3xl/4xl) */}
      <div className="relative flex-1 flex items-center justify-center min-w-0 h-full py-1">
        <div className="relative w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] md:w-[160px] md:h-[160px] lg:w-[170px] lg:h-[170px] xl:w-[185px] xl:h-[185px] 2xl:w-[200px] 2xl:h-[200px] max-h-full aspect-square flex items-center justify-center">
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
                transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease, opacity 0.2s ease' }}
                opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.4}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>

          {/* Center Summary Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-1.5">
            {activeSegment ? (
              <>
                <span
                  className="text-base sm:text-lg 2xl:text-xl font-black font-display tracking-tight leading-tight"
                  style={{ color: activeSegment.color }}
                >
                  {activeSegment.pct}%
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-100 max-w-[85px] truncate">
                  {activeSegment.label}
                </span>
                <span className="text-[8px] sm:text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
                  {mode === 'revenue' ? currencyFormat(activeSegment.revenue) : `${activeSegment.quantity} ord`}
                </span>
              </>
            ) : (
              <>
                <span className="text-base sm:text-lg 2xl:text-xl font-black text-neutral-900 dark:text-neutral-100 font-display tracking-tight leading-tight">
                  {mode === 'revenue' ? currencyFormat(totalRevenue) : compactNumber(totalQuantity)}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-tighter">
                  {mode === 'revenue' ? 'Category Sales' : 'Total Orders'}
                </span>
                <span className="text-[8px] sm:text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {segments.length} Categories
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 📋 Right-Aligned Compact Legend (Names sit close to their numbers on 2xl/3xl/4xl) */}
      <div className="shrink-0 w-full sm:w-auto min-w-[210px] sm:max-w-[280px] md:max-w-[300px] lg:max-w-[330px] 2xl:max-w-[360px]">
        <div
          className="w-full flex flex-col gap-0.5 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
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
                className={`flex items-center justify-between gap-2 px-2 py-0.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  isHovered
                    ? 'bg-neutral-100 dark:bg-neutral-800 shadow-2xs'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                {/* Left: Dot + Category Name (Placed close to metrics) */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 transition-transform duration-150"
                    style={{
                      backgroundColor: seg.color,
                      transform: isHovered ? 'scale(1.3)' : 'scale(1)',
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

                {/* Right: Quantity, Sales ৳ and Percentage */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {mode === 'revenue' ? (
                    <>
                      <span
                        className="text-[10px] sm:text-[11px] font-black"
                        style={{ color: isHovered ? seg.color : undefined }}
                      >
                        {currencyFormat(seg.revenue)}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
                        ({seg.quantity} ord)
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className="text-[10px] sm:text-[11px] font-black"
                        style={{ color: isHovered ? seg.color : undefined }}
                      >
                        {seg.quantity} ord
                      </span>
                      {hasRevenue && (
                        <span className="text-[8px] sm:text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
                          ({currencyFormat(seg.revenue)})
                        </span>
                      )}
                    </>
                  )}
                  <span
                    className={`text-[10px] sm:text-[11px] font-extrabold w-10 text-right ${
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

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

// ---------------------------------------------------------------------------
// RadialBarChart.jsx -> MUI X Donut Chart for Top Selling Dishes
// Displays both order volume AND total revenue generated (সবচেয়ে বেশি বিক্রিত টাকা)
// ---------------------------------------------------------------------------

const PALETTE = [
  '#e02424', // Primary Red (Top Dish #1)
  '#f97316', // Orange (#2)
  '#f59e0b', // Amber (#3)
  '#10b981', // Emerald (#4)
  '#8b5cf6', // Purple (#5)
  '#64748b', // Slate (Others)
];

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

export const RadialBarChart = ({
  items = [],
  maxItems = 20,
  emptyMessage = 'No dish order data available',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const displayedItems = useMemo(() => {
    return items.slice(0, maxItems);
  }, [items, maxItems]);

  const totalOrders = useMemo(() => {
    return displayedItems.reduce((sum, d) => sum + (d.orders || 0), 0);
  }, [displayedItems]);

  const totalRevenue = useMemo(() => {
    return displayedItems.reduce((sum, d) => sum + (d.revenue || (d.price || 0) * (d.orders || 0)), 0);
  }, [displayedItems]);

  // Aggregate top 4 dishes + "Others" if > 5 dishes exist
  const segments = useMemo(() => {
    if (totalOrders === 0 || displayedItems.length === 0) return [];

    let list = [];
    if (displayedItems.length <= 5) {
      list = displayedItems.map((d, i) => ({
        label: d.name,
        orders: d.orders || 0,
        revenue: d.revenue || (d.price || 0) * (d.orders || 0),
        rank: i + 1,
        color: PALETTE[i % PALETTE.length],
      }));
    } else {
      const top4 = displayedItems.slice(0, 4);
      const others = displayedItems.slice(4);
      const othersOrders = others.reduce((sum, d) => sum + (d.orders || 0), 0);
      const othersRevenue = others.reduce((sum, d) => sum + (d.revenue || (d.price || 0) * (d.orders || 0)), 0);

      list = [
        ...top4.map((d, i) => ({
          label: d.name,
          orders: d.orders || 0,
          revenue: d.revenue || (d.price || 0) * (d.orders || 0),
          rank: i + 1,
          color: PALETTE[i % PALETTE.length],
        })),
        {
          label: `Other ${others.length} Dishes`,
          orders: othersOrders,
          revenue: othersRevenue,
          rank: '5+',
          color: '#64748b',
        },
      ];
    }

    let cumulativeAngle = 0;
    return list.map((item) => {
      let angle = (item.orders / totalOrders) * 360;
      if (angle === 360) angle = 359.99;
      const segment = {
        ...item,
        startAngle: cumulativeAngle,
        endAngle: cumulativeAngle + angle,
        pct: ((item.orders / totalOrders) * 100).toFixed(1),
      };
      cumulativeAngle += angle;
      return segment;
    });
  }, [displayedItems, totalOrders]);

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <Flame className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  const SIZE = 110;
  const CENTER = SIZE / 2;
  const RADIUS = SIZE * 0.38;
  const STROKE = SIZE * 0.18;

  const activeSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full h-full min-w-0 select-none">
      {/* 🎯 Donut SVG Canvas */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {segments.map((seg, i) => (
            <motion.path
              key={seg.label}
              d={describeArc(CENTER, CENTER, RADIUS, seg.startAngle, seg.endAngle)}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIndex === i ? STROKE + 3 : STROKE}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Center Label: Total Dish Sales Revenue in ৳ or Active Dish Revenue */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-1">
          {activeSegment ? (
            <>
              <span
                className="text-xs sm:text-sm font-black font-display tracking-tight leading-tight truncate max-w-[65px]"
                style={{ color: activeSegment.color }}
              >
                {currencyFormat(activeSegment.revenue)}
              </span>
              <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 max-w-[65px] truncate">
                {activeSegment.orders} ord ({activeSegment.pct}%)
              </span>
            </>
          ) : (
            <>
              <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-neutral-100 font-display tracking-tight leading-tight">
                {currencyFormat(totalRevenue)}
              </span>
              <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-tighter">
                {totalOrders} Orders
              </span>
            </>
          )}
        </div>
      </div>

      {/* 📋 Interactive Dish Ranking Legend with Orders & Sales Revenue (৳) */}
      <div className="flex flex-col gap-0.5 w-full min-w-0 flex-1 justify-center">
        {segments.map((seg, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={seg.label}
              title={`${seg.label}: ${seg.orders} orders • ${currencyFormat(seg.revenue)} total sales (${seg.pct}%)`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                isHovered
                  ? 'bg-neutral-100 dark:bg-neutral-800 shadow-2xs'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-[10px] sm:text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {typeof seg.rank === 'number' ? `#${seg.rank}` : seg.rank} {seg.label}
                </span>
                {i === 0 && (
                  <span className="px-1 py-0.1 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[8px] font-black shrink-0">
                    TOP
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span
                  className="text-[10px] sm:text-[11px] font-black"
                  style={{ color: seg.color }}
                >
                  {currencyFormat(seg.revenue)}
                </span>
                <span className="text-[8px] font-semibold text-neutral-400 dark:text-neutral-500">
                  ({seg.orders} ord)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadialBarChart;

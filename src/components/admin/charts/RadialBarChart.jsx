import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

// ---------------------------------------------------------------------------
// RadialBarChart.jsx
//
// Multi-ring concentric radial bar chart (Apple Activity style).
// Perfect for comparing Top Dishes by order volume with glowing arcs.
// ---------------------------------------------------------------------------

const PALETTE = [
  { stroke: '#e02424', bg: '#fee2e2', darkBg: '#37181c' }, // #1 Primary Red
  { stroke: '#f97316', bg: '#ffedd5', darkBg: '#3a2016' }, // #2 Orange
  { stroke: '#eab308', bg: '#fef9c3', darkBg: '#382f14' }, // #3 Amber
  { stroke: '#06b6d4', bg: '#cffafe', darkBg: '#132d36' }, // #4 Cyan
  { stroke: '#8b5cf6', bg: '#ede9fe', darkBg: '#2a1b3d' }, // #5 Purple
];

const SIZE = 180;
const CENTER = SIZE / 2;
const BASE_RADIUS = 78;
const RING_THICKNESS = 9;
const RING_GAP = 3.5;

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  // Clamp angle so it doesn't wrap 360 into a zero-length path
  const clampedEnd = Math.min(endAngle, 359.99);
  const start = polarToCartesian(cx, cy, r, clampedEnd);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = clampedEnd - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export const RadialBarChart = ({
  items = [],
  maxItems = 5,
  size = 170,
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

  const SIZE = size;
  const CENTER = SIZE / 2;
  const BASE_RADIUS = (SIZE / 2) * 0.85;
  const RING_THICKNESS = SIZE < 150 ? 7 : 8.5;
  const RING_GAP = SIZE < 150 ? 2.5 : 3.5;

  const rings = useMemo(() => {
    return displayedItems.map((item, index) => {
      const radius = BASE_RADIUS - index * (RING_THICKNESS + RING_GAP);
      const orders = item.orders || 0;
      const pct = Math.max(2, Math.min(100, (orders / maxOrders) * 100));
      const angle = (pct / 100) * 360;
      const colorScheme = PALETTE[index % PALETTE.length];

      return {
        ...item,
        index,
        radius,
        orders,
        pct: Math.round(pct),
        angle,
        color: colorScheme.stroke,
        bgTrack: colorScheme.bg,
        darkBgTrack: colorScheme.darkBg,
      };
    });
  }, [displayedItems, maxOrders, BASE_RADIUS, RING_THICKNESS, RING_GAP]);

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6">
        <Flame className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  const activeItem = hoveredIndex !== null ? rings[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 w-full">
      {/* 🎯 Multi-Ring Concentric SVG Canvas */}
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Background Track Rings */}
          {rings.map((ring) => (
            <circle
              key={`bg-${ring.id || ring.index}`}
              cx={CENTER}
              cy={CENTER}
              r={ring.radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={RING_THICKNESS}
              className="dark:stroke-neutral-800/70"
            />
          ))}

          {/* Active Colored Arcs */}
          {rings.map((ring, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <motion.path
                key={`arc-${ring.id || ring.index}`}
                d={describeArc(CENTER, CENTER, ring.radius, 0, ring.angle)}
                fill="none"
                stroke={ring.color}
                strokeWidth={isHovered ? RING_THICKNESS + 2 : RING_THICKNESS}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                style={{
                  cursor: 'pointer',
                  filter: isHovered ? `drop-shadow(0 0 4px ${ring.color}80)` : 'none',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Dynamic Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 text-center">
          {activeItem ? (
            <>
              <span
                className="text-lg sm:text-xl font-black font-display tracking-tight leading-tight truncate max-w-[85px]"
                style={{ color: activeItem.color }}
              >
                {activeItem.orders}
              </span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 truncate max-w-[85px] leading-tight">
                {activeItem.name}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg sm:text-xl font-black text-neutral-800 dark:text-neutral-100 font-display tracking-tight leading-tight">
                {totalOrders}
              </span>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Top Orders
              </span>
            </>
          )}
        </div>
      </div>

      {/* 📋 Interactive Legend & Rankings */}
      <div className="flex flex-col gap-2 w-full min-w-0 flex-1">
        {rings.map((ring, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={ring.id || i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                isHovered
                  ? 'bg-neutral-100 dark:bg-neutral-800 shadow-xs scale-[1.02]'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: ring.color }}
                />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  #{i + 1} {ring.name}
                </span>
              </div>
              <span
                className="text-xs font-black shrink-0 px-2 py-0.5 rounded-md"
                style={{
                  color: ring.color,
                  backgroundColor: `${ring.color}18`,
                }}
              >
                {ring.orders} orders
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadialBarChart;

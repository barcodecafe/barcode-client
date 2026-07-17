import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// PieChart.jsx
//
// Custom SVG pie/donut chart — no charting library dependency. Reads
// `data` as an array of { label, value } and renders proportional arcs
// using a palette built from the project's primary-500 family plus
// complementary neutrals, with a hoverable legend.
// ---------------------------------------------------------------------------

const SIZE = 200;
const RADIUS = 80;
const STROKE = 32;
const CENTER = SIZE / 2;

// Palette walks from primary-500 down through the warm family, then adds
// a couple of neutral-friendly accents so 6 categories stay distinguishable
// without introducing colors outside the existing design language.
const PALETTE = [
  '#e02424', // primary-500
  '#f98080', // primary-400
  '#be1018', // primary-600
  '#fbbf24', // amber-400 (complementary accent)
  '#a50e15', // primary-700
  '#94a3b8', // slate-400 (neutral accent)
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export const PieChart = ({ data, valueFormatter = (v) => v }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  const segments = useMemo(() => {
    if (total === 0) return [];
    let cumulativeAngle = 0;
    return data.map((d, i) => {
      let angle = (d.value / total) * 360;
      // If there's only one segment or a segment is 100%, set it to 359.99
      // so the SVG arc doesn't collapse to a single point (which renders nothing)
      if (angle === 360) {
        angle = 359.99;
      }
      const segment = {
        ...d,
        startAngle: cumulativeAngle,
        endAngle: cumulativeAngle + angle,
        color: PALETTE[i % PALETTE.length],
        pct: ((d.value / total) * 100).toFixed(1),
      };
      cumulativeAngle += angle;
      return segment;
    });
  }, [data, total]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
      {/* Donut */}
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {total === 0 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={STROKE}
              className="dark:stroke-neutral-800"
            />
          ) : (
            segments.map((seg, i) => (
              <motion.path
                key={seg.label}
                d={describeArc(CENTER, CENTER, RADIUS, seg.startAngle, seg.endAngle)}
                fill="none"
                stroke={seg.color}
                strokeWidth={hoveredIndex === i ? STROKE + 4 : STROKE}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {total === 0 ? (
            <>
              <span className="text-xl font-extrabold text-neutral-400 dark:text-neutral-500 font-display">
                0
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                No Orders
              </span>
            </>
          ) : hoveredIndex !== null && segments[hoveredIndex] ? (
            <>
              <span className="text-xl font-extrabold text-neutral-800 dark:text-neutral-100 font-display">
                {segments[hoveredIndex].pct}%
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 max-w-[90px] text-center truncate">
                {segments[hoveredIndex].label}
              </span>
            </>
          ) : (
            <>
              <span className="text-xl font-extrabold text-neutral-800 dark:text-neutral-100 font-display">
                {valueFormatter(total)}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Total Orders
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend — min-w-0 lets it shrink beside the fixed-width donut in the
          sm:flex-row layout; without it the legend can't shrink below its
          content and pushes the dashboard into horizontal overflow. */}
      <div className="flex flex-col gap-2.5 w-full min-w-0">
        {total === 0 ? (
          <div className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">
            No order data available
          </div>
        ) : (
          segments.map((seg, i) => (
            <div
              key={seg.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors duration-200 ${
                hoveredIndex === i ? 'bg-neutral-100 dark:bg-neutral-800' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                  {seg.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 shrink-0">
                {seg.pct}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PieChart;

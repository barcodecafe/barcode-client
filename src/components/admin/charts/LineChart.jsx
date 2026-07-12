import { useState, useMemo, useId, useRef } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// LineChart.jsx
//
// Custom SVG line chart — no charting library dependency. Reads `data` as
// an array of { label, value }, renders a smoothed path with a soft
// primary-500 gradient fill beneath it, plus hoverable points with a
// tooltip. Matches the visual language of BarChart/PieChart in this folder.
// ---------------------------------------------------------------------------

const WIDTH = 600;
const HEIGHT = 220;
const PADDING_X = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;

export const LineChart = ({ data, valueFormatter = (v) => v }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const gradientId = useId();
  const svgRef = useRef(null);

  const { points, linePath, areaPath, maxValue, minValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], linePath: '', areaPath: '', maxValue: 0, minValue: 0 };
    }
    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const usableWidth = WIDTH - PADDING_X * 2;
    const usableHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const pts = data.map((d, i) => {
      const x = PADDING_X + (i / (data.length - 1 || 1)) * usableWidth;
      const y = PADDING_TOP + usableHeight - ((d.value - min) / range) * usableHeight;
      return { ...d, x, y };
    });

    // Smooth the polyline into a catmull-rom-ish cubic bezier path for a
    // gentler curve than straight line segments between points.
    const buildSmoothPath = (pointsArr) => {
      if (pointsArr.length < 2) return '';
      let path = `M ${pointsArr[0].x} ${pointsArr[0].y}`;
      for (let i = 0; i < pointsArr.length - 1; i++) {
        const p0 = pointsArr[i];
        const p1 = pointsArr[i + 1];
        const midX = (p0.x + p1.x) / 2;
        path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return path;
    };

    const line = buildSmoothPath(pts);
    const area = pts.length > 0
      ? `${line} L ${pts[pts.length - 1].x} ${HEIGHT - PADDING_BOTTOM} L ${pts[0].x} ${HEIGHT - PADDING_BOTTOM} Z`
      : '';

    return { points: pts, linePath: line, areaPath: area, maxValue: max, minValue: min };
  }, [data]);

  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * WIDTH;

    let closestIndex = 0;
    let minDiff = Math.abs(points[0].x - svgX);
    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    setHoveredIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[220px] text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
        <p className="text-sm font-medium">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-full overflow-visible select-none"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e02424" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#e02424" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => {
            const y = PADDING_TOP + (HEIGHT - PADDING_TOP - PADDING_BOTTOM) * g;
            return (
              <line
                key={g}
                x1={PADDING_X}
                x2={WIDTH - PADDING_X}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-neutral-100 dark:text-neutral-800"
              />
            );
          })}

          {/* Area fill */}
          {areaPath && (
            <motion.path
              d={areaPath}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Line */}
          {linePath && (
            <motion.path
              d={linePath}
              fill="none"
              stroke="#e02424"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          )}

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={p.label}
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 5 : 3}
              fill="white"
              stroke="#e02424"
              strokeWidth="2"
              className="transition-all duration-150 dark:fill-neutral-900 pointer-events-none"
            />
          ))}

          {/* Vertical hover guide */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <line
              x1={points[hoveredIndex].x}
              x2={points[hoveredIndex].x}
              y1={PADDING_TOP}
              y2={HEIGHT - PADDING_BOTTOM}
              stroke="#e02424"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Tooltip (HTML, positioned over the SVG point) */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 px-2.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold whitespace-nowrap shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(points[hoveredIndex].x / WIDTH) * 100}%`,
              top: `${(points[hoveredIndex].y / HEIGHT) * 100}%`,
              marginTop: -10,
            }}
          >
            {points[hoveredIndex].label}: {valueFormatter(points[hoveredIndex].value)}
          </div>
        )}

        {/* X-axis labels */}
        <div className="absolute left-0 right-0 bottom-0 flex justify-between px-1 pointer-events-none">
          {data.map((d, i) => (
            <span
              key={d.label}
              className={`text-[10px] transition-colors ${
                hoveredIndex === i
                  ? 'text-primary-500 font-semibold'
                  : 'text-neutral-400 dark:text-neutral-600'
              }`}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LineChart;

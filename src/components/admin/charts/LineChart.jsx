import { useState, useMemo, useId, useRef } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// LineChart.jsx
//
// High-fidelity MUI X / Apple-style interactive curved line chart.
// Renders smooth Bézier splines, glowing gradient fills, subtle gridlines,
// interactive tracking crosshair, and floating badge tooltips.
// ---------------------------------------------------------------------------

const WIDTH = 600;
const PADDING_X = 20;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 22;

export const LineChart = ({ data = [], valueFormatter = (v) => v, height = 120 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const gradientId = useId();
  const glowFilterId = useId();
  const svgRef = useRef(null);

  const { points, linePath, areaPath, maxValue, minValue, yTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], linePath: '', areaPath: '', maxValue: 0, minValue: 0, yTicks: [] };
    }
    const values = data.map((d) => d.value || 0);
    const max = Math.max(...values, 100);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const usableWidth = WIDTH - PADDING_X * 2;
    const usableHeight = Math.max(40, height - PADDING_TOP - PADDING_BOTTOM);

    const pts = data.map((d, i) => {
      const x = PADDING_X + (i / Math.max(1, data.length - 1)) * usableWidth;
      const y = PADDING_TOP + usableHeight - (((d.value || 0) - min) / range) * usableHeight;
      return { ...d, x, y };
    });

    // Smooth cubic spline curvature
    const buildSmoothPath = (pointsArr) => {
      if (pointsArr.length < 2) return '';
      let path = `M ${pointsArr[0].x} ${pointsArr[0].y}`;
      for (let i = 0; i < pointsArr.length - 1; i++) {
        const p0 = pointsArr[i];
        const p1 = pointsArr[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) * 0.45;
        const cpX2 = p1.x - (p1.x - p0.x) * 0.45;
        path += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return path;
    };

    const line = buildSmoothPath(pts);
    const bottomY = height - PADDING_BOTTOM;
    const area = pts.length > 0
      ? `${line} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`
      : '';

    const yTicks = [max, Math.round(max * 0.5), 0];

    return { points: pts, linePath: line, areaPath: area, maxValue: max, minValue: min, yTicks };
  }, [data, height]);

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
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
        <p className="text-xs font-medium">No trend data available</p>
      </div>
    );
  }

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="w-full flex flex-col justify-between select-none">
      <div className="relative w-full" style={{ height }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e02424" stopOpacity="0.32" />
              <stop offset="65%" stopColor="#e02424" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#e02424" stopOpacity="0" />
            </linearGradient>

            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#e02424" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Horizontal gridlines */}
          {[0, 0.5, 1].map((g, idx) => {
            const y = PADDING_TOP + (height - PADDING_TOP - PADDING_BOTTOM) * g;
            return (
              <line
                key={idx}
                x1={PADDING_X}
                x2={WIDTH - PADDING_X}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray={idx === 1 ? '3 3' : 'none'}
                className="text-neutral-200/70 dark:text-neutral-800/80"
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
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Main glowing curved line */}
          {linePath && (
            <motion.path
              d={linePath}
              fill="none"
              stroke="#e02424"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowFilterId})`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          )}

          {/* Interactive Hover Crosshair */}
          {activePoint && (
            <g className="pointer-events-none">
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={PADDING_TOP}
                y2={height - PADDING_BOTTOM}
                stroke="#e02424"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill="#e02424"
                stroke="#ffffff"
                strokeWidth="2.5"
                className="shadow-md"
              />
            </g>
          )}

          {/* Static Point Dots */}
          {!activePoint && points.map((p, i) => (
            <circle
              key={p.label || i}
              cx={p.x}
              cy={p.y}
              r={points.length > 8 ? 2.5 : 3.5}
              fill="white"
              stroke="#e02424"
              strokeWidth="2"
              className="dark:fill-neutral-900 pointer-events-none"
            />
          ))}
        </svg>

        {/* Floating Tooltip Card */}
        {activePoint && (
          <div
            className="absolute z-20 px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-extrabold whitespace-nowrap shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-75 flex items-center gap-1.5 border border-white/10 dark:border-black/10"
            style={{
              left: `${(activePoint.x / WIDTH) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
              marginTop: -8,
            }}
          >
            <span className="text-neutral-400 dark:text-neutral-500 font-bold">{activePoint.label}:</span>
            <span className="text-amber-400 dark:text-primary-600 font-black">{valueFormatter(activePoint.value)}</span>
          </div>
        )}
      </div>

      {/* Guaranteed Visible X-axis Month Labels */}
      <div className="flex items-center justify-between px-2 mt-1 w-full pointer-events-none">
        {data.map((d, i) => (
          <span
            key={d.label || i}
            className={`text-[9px] sm:text-[10px] font-bold transition-colors leading-none ${
              hoveredIndex === i
                ? 'text-primary-600 dark:text-primary-400 font-black scale-105'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LineChart;

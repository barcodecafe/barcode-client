import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bike } from 'lucide-react';

// ---------------------------------------------------------------------------
// RadarChart.jsx -> MUI X Multi-Series Comparison Line Chart for Riders
// Exactly matching Image 2: Multi-series comparison line chart (Trips vs Earnings)
// ---------------------------------------------------------------------------

const WIDTH = 500;
const PADDING_X = 24;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 22;

export const RadarChart = ({
  items = [],
  valueFormatter = (v) => v,
  maxItems = 15,
  height = 120,
  emptyMessage = 'No rider delivery data available',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const svgRef = useRef(null);

  const displayedRiders = useMemo(() => {
    return items.slice(0, Math.min(15, maxItems));
  }, [items, maxItems]);

  const maxTrips = useMemo(() => {
    if (displayedRiders.length === 0) return 1;
    return Math.max(...displayedRiders.map((r) => r.deliveries || 0), 1);
  }, [displayedRiders]);

  const maxEarnings = useMemo(() => {
    if (displayedRiders.length === 0) return 1;
    return Math.max(...displayedRiders.map((r) => r.earnings || 0), 1);
  }, [displayedRiders]);

  const { tripsPoints, earningsPoints, tripsPath, earningsPath } = useMemo(() => {
    if (displayedRiders.length === 0) {
      return { tripsPoints: [], earningsPoints: [], tripsPath: '', earningsPath: '' };
    }

    const usableWidth = WIDTH - PADDING_X * 2;
    const usableHeight = Math.max(40, height - PADDING_TOP - PADDING_BOTTOM);

    const tPts = displayedRiders.map((r, i) => {
      const x = PADDING_X + (i / Math.max(1, displayedRiders.length - 1)) * usableWidth;
      const y = PADDING_TOP + usableHeight - ((r.deliveries || 0) / maxTrips) * usableHeight;
      return { ...r, x, y, value: r.deliveries || 0 };
    });

    const ePts = displayedRiders.map((r, i) => {
      const x = PADDING_X + (i / Math.max(1, displayedRiders.length - 1)) * usableWidth;
      const y = PADDING_TOP + usableHeight - ((r.earnings || 0) / maxEarnings) * usableHeight;
      return { ...r, x, y, value: r.earnings || 0 };
    });

    const buildPath = (pts) => {
      if (pts.length < 2) return '';
      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) * 0.45;
        const cpX2 = p1.x - (p1.x - p0.x) * 0.45;
        path += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return path;
    };

    return {
      tripsPoints: tPts,
      earningsPoints: ePts,
      tripsPath: buildPath(tPts),
      earningsPath: buildPath(ePts),
    };
  }, [displayedRiders, maxTrips, maxEarnings, height]);

  const handleMouseMove = (e) => {
    if (!svgRef.current || tripsPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * WIDTH;

    let closestIndex = 0;
    let minDiff = Math.abs(tripsPoints[0].x - svgX);
    for (let i = 1; i < tripsPoints.length; i++) {
      const diff = Math.abs(tripsPoints[i].x - svgX);
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

  if (!displayedRiders || displayedRiders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4">
        <Bike className="w-6 h-6 opacity-40 mb-1" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  const activeRider = hoveredIndex !== null ? displayedRiders[hoveredIndex] : null;
  const activeTripsPt = hoveredIndex !== null ? tripsPoints[hoveredIndex] : null;
  const activeEarnPt = hoveredIndex !== null ? earningsPoints[hoveredIndex] : null;
  const isDense = displayedRiders.length > 8;

  return (
    <div className="w-full flex flex-col justify-between select-none">
      {/* 🏷️ Top Legend Indicator (Trips vs Delivered Value) */}
      <div className="flex items-center justify-end gap-3 px-2 mb-1">
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
          <span className="w-2.5 h-0.5 bg-blue-500 border-t border-dashed border-blue-500" />
          <span>Trips (pv)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
          <span className="w-2.5 h-0.5 bg-amber-500" />
          <span>Delivered (uv)</span>
        </div>
      </div>

      {/* 📈 Multi-Series SVG Line Canvas */}
      <div className="relative w-full" style={{ height: Math.max(80, height - 15) }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${Math.max(80, height - 15)}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Horizontal Gridlines */}
          {[0, 0.5, 1].map((g, idx) => {
            const y = PADDING_TOP + (Math.max(80, height - 15) - PADDING_TOP - PADDING_BOTTOM) * g;
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

          {/* Series 1: Trips (Blue Dashed Line) */}
          {tripsPath && (
            <motion.path
              d={tripsPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Series 2: Earnings (Amber Solid Line) */}
          {earningsPath && (
            <motion.path
              d={earningsPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Static / Active Points for Trips */}
          {tripsPoints.map((pt, i) => (
            <circle
              key={`t-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hoveredIndex === i ? 5 : isDense ? 2 : 3}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="pointer-events-none shadow-xs"
            />
          ))}

          {/* Static / Active Points for Earnings */}
          {earningsPoints.map((pt, i) => (
            <rect
              key={`e-${i}`}
              x={pt.x - (hoveredIndex === i ? 4 : isDense ? 1.5 : 2.5)}
              y={pt.y - (hoveredIndex === i ? 4 : isDense ? 1.5 : 2.5)}
              width={hoveredIndex === i ? 8 : isDense ? 3 : 5}
              height={hoveredIndex === i ? 8 : isDense ? 3 : 5}
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="pointer-events-none shadow-xs"
            />
          ))}

          {/* Crosshair on Hover */}
          {activeTripsPt && (
            <line
              x1={activeTripsPt.x}
              x2={activeTripsPt.x}
              y1={PADDING_TOP}
              y2={Math.max(80, height - 15) - PADDING_BOTTOM}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 2"
              className="pointer-events-none opacity-60"
            />
          )}
        </svg>

        {/* 🪟 MUI X Floating Multi-Series Tooltip */}
        {activeRider && activeTripsPt && (
          <div
            className="absolute z-20 px-2.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold whitespace-nowrap shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full flex flex-col gap-0.5 border border-white/10"
            style={{
              left: `${(activeTripsPt.x / WIDTH) * 100}%`,
              top: `${(Math.min(activeTripsPt.y, activeEarnPt?.y || activeTripsPt.y) / Math.max(80, height - 15)) * 100}%`,
              marginTop: -8,
            }}
          >
            <p className="font-black text-white dark:text-neutral-900 border-b border-white/10 dark:border-black/10 pb-0.5">
              {activeRider.name}
            </p>
            <div className="flex items-center justify-between gap-2 text-[9px]">
              <span className="flex items-center gap-1 text-blue-400 dark:text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Trips:
              </span>
              <span className="font-bold">{activeRider.deliveries || 0}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[9px]">
              <span className="flex items-center gap-1 text-emerald-400 dark:text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Delivered:
              </span>
              <span className="font-bold">{valueFormatter(activeRider.deliveredValue || 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[9px]">
              <span className="flex items-center gap-1 text-amber-400 dark:text-amber-600">
                <span className="w-1.5 h-1.5 rounded-xs bg-amber-500" /> Earnings:
              </span>
              <span className="font-bold">{valueFormatter(activeRider.earnings || 0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Guaranteed Visible X-axis Rider Labels */}
      <div className="flex items-center justify-between px-2 mt-1 w-full pointer-events-none">
        {displayedRiders.map((r, i) => (
          <span
            key={r.riderId || r.name || i}
            title={r.name}
            className={`${isDense ? 'text-[8px] max-w-[32px]' : 'text-[9px] sm:text-[10px] max-w-[55px]'} truncate text-center transition-colors leading-none ${
              hoveredIndex === i
                ? 'text-neutral-900 dark:text-white font-black scale-105'
                : 'text-neutral-400 dark:text-neutral-500 font-semibold'
            }`}
          >
            {r.name.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;

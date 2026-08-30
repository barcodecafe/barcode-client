import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bike } from 'lucide-react';

// ---------------------------------------------------------------------------
// RadarChart.jsx
//
// Multi-axis Spider / Radar Chart.
// Compares Top Delivery Riders across Deliveries, Acceptance, Earnings,
// and Reliability metrics on a polygonal coordinate web.
// ---------------------------------------------------------------------------

const AXES = [
  { key: 'deliveries', label: 'Trips' },
  { key: 'acceptanceRate', label: 'Accept %' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'activity', label: 'Activity' },
];

const RIDER_PALETTE = [
  { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.35)', dot: '#a855f7' }, // Rider #1 Purple
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.25)', dot: '#10b981' }, // Rider #2 Emerald
  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', dot: '#f59e0b' }, // Rider #3 Amber
];

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 68;
const NUM_AXES = AXES.length;

function getCoordinates(axisIndex, valuePct, maxRadius = RADIUS) {
  // Angle rotated so Axis 0 points straight UP (-90 deg)
  const angleRad = ((axisIndex * (360 / NUM_AXES) - 90) * Math.PI) / 180;
  const r = (valuePct / 100) * maxRadius;
  return {
    x: CENTER + r * Math.cos(angleRad),
    y: CENTER + r * Math.sin(angleRad),
  };
}

export const RadarChart = ({
  items = [],
  valueFormatter = (v) => v,
  maxItems = 3,
  size = 180,
  emptyMessage = 'No rider delivery data available',
}) => {
  const [selectedRiderIndex, setSelectedRiderIndex] = useState(null); // null = show all top 3

  const displayedRiders = useMemo(() => {
    return items.slice(0, maxItems);
  }, [items, maxItems]);

  const maxDeliveries = useMemo(() => {
    if (displayedRiders.length === 0) return 1;
    return Math.max(...displayedRiders.map((r) => r.deliveries || 0), 1);
  }, [displayedRiders]);

  const maxEarnings = useMemo(() => {
    if (displayedRiders.length === 0) return 1;
    return Math.max(...displayedRiders.map((r) => r.earnings || 0), 1);
  }, [displayedRiders]);

  const SIZE = size;
  const CENTER = SIZE / 2;
  const RADIUS = (SIZE / 2) * 0.70;

  if (!displayedRiders || displayedRiders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6">
        <Bike className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  // Calculate polygon points for each rider
  const riderPolygons = displayedRiders.map((rider, riderIdx) => {
    const deliveriesPct = Math.min(100, Math.max(15, ((rider.deliveries || 0) / maxDeliveries) * 100));
    const acceptancePct = Math.min(100, Math.max(20, rider.acceptanceRate ?? 100));
    const earningsPct = Math.min(100, Math.max(15, ((rider.earnings || 0) / maxEarnings) * 100));
    const reliabilityPct = Math.min(100, Math.max(25, (rider.acceptanceRate ?? 100) * 0.95));
    const activityPct = Math.min(100, Math.max(30, ((rider.deliveries || 0) / maxDeliveries) * 90 + 10));

    const values = [deliveriesPct, acceptancePct, earningsPct, reliabilityPct, activityPct];
    const points = values.map((val, axisIdx) => getCoordinates(axisIdx, val));
    const svgPathString = points.map((p) => `${p.x},${p.y}`).join(' ');

    return {
      ...rider,
      riderIdx,
      points,
      svgPathString,
      style: RIDER_PALETTE[riderIdx % RIDER_PALETTE.length],
    };
  });

  // Concentric polygon web levels (25%, 50%, 75%, 100%)
  const webLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full h-full min-w-0">
      {/* 🕸️ SVG Radar / Spider Web Canvas */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Concentric Grid Webs */}
          {webLevels.map((level, lvlIdx) => {
            const levelPoints = Array.from({ length: NUM_AXES }).map((_, axisIdx) => {
              const pt = getCoordinates(axisIdx, level * 100);
              return `${pt.x},${pt.y}`;
            }).join(' ');

            return (
              <polygon
                key={`web-${lvlIdx}`}
                points={levelPoints}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={lvlIdx === webLevels.length - 1 ? 1.5 : 1}
                className="dark:stroke-neutral-800"
              />
            );
          })}

          {/* Spokes radiating from center */}
          {AXES.map((axis, axisIdx) => {
            const outerPt = getCoordinates(axisIdx, 100);
            return (
              <line
                key={`spoke-${axis.key}`}
                x1={CENTER}
                y1={CENTER}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="2 2"
                className="dark:stroke-neutral-800"
              />
            );
          })}

          {/* Axis Labels */}
          {AXES.map((axis, axisIdx) => {
            const labelPt = getCoordinates(axisIdx, 122);
            return (
              <text
                key={`label-${axis.key}`}
                x={labelPt.x}
                y={labelPt.y + 3}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                className="fill-neutral-400 dark:fill-neutral-500 uppercase tracking-tighter"
              >
                {axis.label}
              </text>
            );
          })}

          {/* Rider Polygons */}
          {riderPolygons.map((rider, i) => {
            const isDimmed = selectedRiderIndex !== null && selectedRiderIndex !== i;
            const isHighlighted = selectedRiderIndex === i;

            return (
              <g
                key={`rider-poly-${rider.riderId || i}`}
                className="transition-opacity duration-300"
                style={{ opacity: isDimmed ? 0.15 : 1 }}
              >
                <motion.polygon
                  points={rider.svgPathString}
                  fill={rider.style.fill}
                  stroke={rider.style.stroke}
                  strokeWidth={isHighlighted ? 2.5 : 1.8}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                />

                {/* Vertex Dots */}
                {rider.points.map((pt, pIdx) => (
                  <circle
                    key={`dot-${i}-${pIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHighlighted ? 3.5 : 2.5}
                    fill={rider.style.dot}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 📋 Rider Legend & Comparison List */}
      <div className="flex flex-col gap-1 w-full min-w-0 flex-1 justify-center">
        {riderPolygons.map((rider, i) => {
          const isSelected = selectedRiderIndex === i;
          return (
            <div
              key={rider.riderId || i}
              title={`${rider.name} • ${rider.acceptanceRate || 100}% accept • ${rider.deliveries} trips • ${valueFormatter(rider.earnings || 0)}`}
              onMouseEnter={() => setSelectedRiderIndex(i)}
              onMouseLeave={() => setSelectedRiderIndex(null)}
              onClick={() => setSelectedRiderIndex((prev) => (prev === i ? null : i))}
              className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-neutral-100 dark:bg-neutral-800 shadow-xs'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: rider.style.stroke }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                    #{i + 1} {rider.name}
                  </p>
                  <p className="text-[9px] text-neutral-400 truncate">
                    {rider.acceptanceRate || 100}% acc • {rider.deliveries} trips
                  </p>
                </div>
              </div>

              <span
                className="text-[10px] sm:text-xs font-black shrink-0 px-1.5 py-0.5 rounded-md ml-1"
                style={{
                  color: rider.style.stroke,
                  backgroundColor: `${rider.style.stroke}18`,
                }}
              >
                {valueFormatter(rider.earnings || 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadarChart;

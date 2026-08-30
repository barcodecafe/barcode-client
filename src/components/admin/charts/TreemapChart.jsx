import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Award, Medal } from 'lucide-react';

// ---------------------------------------------------------------------------
// TreemapChart.jsx
//
// Hierarchical proportional area tile chart (Treemap).
// Represents VIP customer revenue contributions as visual weighted mosaic blocks.
// ---------------------------------------------------------------------------

const TILE_STYLES = [
  {
    bgGradient: 'from-emerald-600 via-emerald-700 to-teal-800',
    border: 'border-emerald-500/40',
    badge: 'bg-amber-400 text-amber-950 font-black',
    glow: 'shadow-emerald-500/20',
  },
  {
    bgGradient: 'from-teal-600 via-teal-700 to-emerald-800',
    border: 'border-teal-500/40',
    badge: 'bg-slate-200 text-slate-900 font-bold',
    glow: 'shadow-teal-500/20',
  },
  {
    bgGradient: 'from-cyan-600 via-cyan-700 to-teal-800',
    border: 'border-cyan-500/40',
    badge: 'bg-amber-600 text-white font-bold',
    glow: 'shadow-cyan-500/20',
  },
  {
    bgGradient: 'from-emerald-700 via-emerald-800 to-slate-900',
    border: 'border-emerald-600/30',
    badge: 'bg-neutral-200/80 text-neutral-800 font-semibold',
    glow: 'shadow-emerald-700/10',
  },
  {
    bgGradient: 'from-teal-700 via-slate-800 to-slate-900',
    border: 'border-teal-600/30',
    badge: 'bg-neutral-200/80 text-neutral-800 font-semibold',
    glow: 'shadow-teal-700/10',
  },
];

export const TreemapChart = ({
  items = [],
  valueFormatter = (v) => v,
  maxItems = 5,
  density = 'normal',
  emptyMessage = 'No customer spending data available',
}) => {
  const [hoveredId, setHoveredId] = useState(null);

  const displayedItems = useMemo(() => {
    return items.slice(0, maxItems);
  }, [items, maxItems]);

  const totalSpent = useMemo(() => {
    return displayedItems.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  }, [displayedItems]);

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6">
        <User className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  // Pre-calculate percentage share of top customer pool
  const tiles = displayedItems.map((item, index) => {
    const spent = item.totalSpent || 0;
    const sharePct = totalSpent > 0 ? ((spent / totalSpent) * 100).toFixed(1) : 0;
    const style = TILE_STYLES[index % TILE_STYLES.length];

    return {
      ...item,
      rank: item.rank || index + 1,
      spent,
      sharePct,
      style,
    };
  });

  const gridHeight =
    density === 'compact'
      ? 'h-28 sm:h-32'
      : density === 'comfort'
      ? 'h-52 sm:h-56'
      : 'h-40 sm:h-44';

  return (
    <div className="w-full h-full flex flex-col justify-center">
      {/* 🧩 Proportional Mosaic Treemap Grid */}
      <div className="grid grid-cols-12 gap-1.5 sm:gap-2 w-full h-full min-h-[140px]">
        {/* Tile 1: Top Customer (Dominant Left Block) */}
        {tiles[0] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0 }}
            onMouseEnter={() => setHoveredId(tiles[0].userId || 0)}
            onMouseLeave={() => setHoveredId(null)}
            className={`col-span-12 sm:col-span-6 relative rounded-xl p-2.5 sm:p-3 bg-gradient-to-br ${tiles[0].style.bgGradient} border ${tiles[0].style.border} text-white shadow-sm flex flex-col justify-between overflow-hidden cursor-pointer transition-all hover:brightness-110`}
          >
            <div className="flex items-start justify-between gap-1.5 z-10">
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${tiles[0].style.badge} shadow-xs`}>
                #{tiles[0].rank} VIP
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                {tiles[0].sharePct}% Share
              </span>
            </div>

            <div className="z-10 mt-auto pt-1">
              <h4 className="text-xs sm:text-sm font-extrabold truncate drop-shadow-xs">
                {tiles[0].name}
              </h4>
              <p className="text-[10px] text-white/80 truncate">
                {tiles[0].email || `${tiles[0].orderCount || 0} orders`}
              </p>
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/15">
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  {valueFormatter(tiles[0].spent)}
                </span>
                <span className="text-[9px] font-bold text-white/70">
                  {tiles[0].orderCount || 0} orders
                </span>
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-white/10 blur-lg pointer-events-none" />
          </motion.div>
        )}

        {/* Secondary Tiles 2, 3, 4, 5 (Right Grid) */}
        <div className="col-span-12 sm:col-span-6 grid grid-cols-2 gap-1.5 h-full">
          {tiles.slice(1, 5).map((tile, i) => (
            <motion.div
              key={tile.userId || i + 1}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: (i + 1) * 0.08 }}
              onMouseEnter={() => setHoveredId(tile.userId || i + 1)}
              onMouseLeave={() => setHoveredId(null)}
              className={`relative rounded-xl p-2 bg-gradient-to-br ${tile.style.bgGradient} border ${tile.style.border} text-white shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer transition-all hover:brightness-110`}
            >
              <div className="flex items-center justify-between gap-1 z-10">
                <span className={`px-1 py-0.2 rounded text-[9px] ${tile.style.badge}`}>
                  #{tile.rank}
                </span>
                <span className="text-[9px] font-extrabold text-white/80">
                  {tile.sharePct}%
                </span>
              </div>

              <div className="z-10 mt-1">
                <p className="text-[11px] font-extrabold truncate leading-tight">
                  {tile.name}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] font-black text-amber-300">
                    {valueFormatter(tile.spent)}
                  </span>
                  <span className="text-[9px] font-semibold text-white/70">
                    {tile.orderCount || 0} ord
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TreemapChart;

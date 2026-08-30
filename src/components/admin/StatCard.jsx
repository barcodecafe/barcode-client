import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// StatCard.jsx
//
// Small metric card for the dashboard header row (revenue, orders, branches,
// avg rating). Optional `changePct` renders a small up/down trend indicator,
// matching the same red/green semantic colors used nowhere else in the app
// yet — kept scoped to this component so it doesn't leak into the public
// site's palette.
// ---------------------------------------------------------------------------
export const StatCard = ({ icon: Icon, label, value, changePct, delay = 0 }) => {
  const isPositive = (changePct ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/80 rounded-xl shadow-2xs py-2 px-3 sm:px-3.5 flex items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 truncate">
              {label}
            </span>
            {changePct !== undefined && (
              <span
                className={`inline-flex items-center text-[10px] font-extrabold ${
                  isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                }`}
              >
                {isPositive ? '↑' : '↓'}{Math.abs(changePct)}%
              </span>
            )}
          </div>
          <p className="font-display text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight truncate">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl sm:rounded-2xl shadow-2xs p-3 sm:p-3.5 flex items-center justify-between gap-2.5"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 truncate">
          {label}
        </p>
        <p className="font-display text-lg sm:text-xl font-extrabold text-neutral-800 dark:text-neutral-100 mt-0.5 truncate tracking-tight">
          {value}
        </p>
        {changePct !== undefined ? (
          <div
            className={`flex items-center gap-1 mt-0.5 text-[10px] sm:text-[11px] font-bold ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(changePct)}% vs last mo</span>
          </div>
        ) : (
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-medium">All Branches</p>
        )}
      </div>
      <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
    </motion.div>
  );
};

export default StatCard;

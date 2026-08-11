import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ icon: Icon, label, value, changePct, delay = 0 }) => {
  const isPositive = (changePct ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-4 sm:p-5 2xl:p-6 flex items-start justify-between gap-3 w-full"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs 2xl:text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
          {label}
        </p>
        <p className="font-display text-xl sm:text-2xl 2xl:text-3xl font-extrabold text-neutral-800 dark:text-neutral-100 mt-1 truncate">
          {value}
        </p>
        {changePct !== undefined && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs 2xl:text-sm font-semibold ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" /> : <TrendingDown className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />}
            {Math.abs(changePct)}% vs last month
          </div>
        )}
      </div>
      <div className="w-10 h-10 2xl:w-12 2xl:h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 2xl:w-6 2xl:h-6" />
      </div>
    </motion.div>
  );
};

export default StatCard;
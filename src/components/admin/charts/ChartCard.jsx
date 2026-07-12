import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// ChartCard.jsx
//
// Shared card shell for every chart on the Admin Dashboard — keeps padding,
// border, radius, and the title/subtitle layout consistent across the Bar,
// Pie, and Line charts without each one re-implementing the wrapper.
// ---------------------------------------------------------------------------
export const ChartCard = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
};

export default ChartCard;

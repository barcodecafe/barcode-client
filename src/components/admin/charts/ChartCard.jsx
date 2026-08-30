import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// ChartCard.jsx
//
// Clean, minimalist card shell for Admin Dashboard charts.
// Zero clutter, pure elegant layout with density scaling (compact/normal/comfort).
// ---------------------------------------------------------------------------

export const ChartCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  density = 'normal', // 'compact' | 'normal' | 'comfort'
}) => {
  const paddingClass =
    density === 'compact'
      ? 'p-3.5 sm:p-4'
      : density === 'comfort'
      ? 'p-6 sm:p-7'
      : 'p-4 sm:p-5';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`bg-white dark:bg-neutral-900 border border-neutral-200/75 dark:border-neutral-800/80 rounded-2xl sm:rounded-3xl shadow-xs transition-all flex flex-col justify-between overflow-hidden ${paddingClass} ${className}`}
    >
      {/* Card Header */}
      <div className={`flex items-start justify-between gap-2.5 ${density === 'compact' ? 'mb-2.5' : 'mb-3.5'}`}>
        <div className="min-w-0 flex-1">
          <h3 className={`font-display font-extrabold text-neutral-900 dark:text-white truncate ${
            density === 'compact' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          }`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-neutral-500 dark:text-neutral-400 truncate ${
              density === 'compact' ? 'text-[10px] mt-0.5' : 'text-xs mt-0.5'
            }`}>
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* Chart Canvas Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {children}
      </div>
    </motion.div>
  );
};

export default ChartCard;



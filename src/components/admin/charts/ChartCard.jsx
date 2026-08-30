import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// ChartCard.jsx
//
// Shared card shell for every chart on the Admin Dashboard — keeps padding,
// border, radius, and the title/subtitle layout consistent across the Bar,
// Pie, and Line charts. Includes dynamic Expand/Collapse controls for Admin.
// ---------------------------------------------------------------------------
export const ChartCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  isExpanded = false,
  onToggleExpand,
  expandable = true,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-3xl shadow-xs p-5 sm:p-6 transition-all relative overflow-hidden flex flex-col justify-between ${
        isExpanded ? 'col-span-full ring-2 ring-primary-500/30 dark:ring-primary-500/20' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">
              {title}
            </h3>
            {isExpanded && (
              <span className="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                Expanded View
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {action}
          {expandable && onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              title={isExpanded ? 'Collapse View' : 'Expand to Full Width'}
              className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>
    </motion.div>
  );
};

export default ChartCard;

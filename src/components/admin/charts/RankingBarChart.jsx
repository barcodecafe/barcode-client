import { motion } from 'framer-motion';
import { Flame, User, Bike, Trophy, Award, Medal } from 'lucide-react';

// ---------------------------------------------------------------------------
// RankingBarChart.jsx
//
// Interactive horizontal bar chart for top performers (Dishes, Customers, Riders).
// Renders proportional progress bars, rank badges (Gold, Silver, Bronze),
// secondary indicators, and formatted value pills.
// ---------------------------------------------------------------------------

const rankBadges = {
  1: {
    bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30',
    icon: Trophy,
  },
  2: {
    bg: 'bg-slate-400/15 text-slate-600 dark:text-slate-300 border border-slate-300/30',
    icon: Award,
  },
  3: {
    bg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-400/30',
    icon: Medal,
  },
};

const themeStyles = {
  dishes: {
    barGradient: 'from-rose-500 to-primary-600',
    glowColor: 'shadow-rose-500/20',
    pillText: 'text-primary-600 dark:text-primary-400',
    pillBg: 'bg-rose-500/10',
    icon: Flame,
  },
  customers: {
    barGradient: 'from-emerald-500 to-teal-600',
    glowColor: 'shadow-emerald-500/20',
    pillText: 'text-emerald-600 dark:text-emerald-400',
    pillBg: 'bg-emerald-500/10',
    icon: User,
  },
  riders: {
    barGradient: 'from-purple-500 to-indigo-600',
    glowColor: 'shadow-purple-500/20',
    pillText: 'text-purple-600 dark:text-purple-400',
    pillBg: 'bg-purple-500/10',
    icon: Bike,
  },
};

export const RankingBarChart = ({
  items = [],
  type = 'dishes', // 'dishes' | 'customers' | 'riders'
  valueFormatter = (v) => v,
  emptyMessage = 'No data available',
  maxItems = 5,
}) => {
  const displayedItems = maxItems ? items.slice(0, maxItems) : items;
  const theme = themeStyles[type] || themeStyles.dishes;

  // Compute maximum metric to calculate proportional horizontal bars
  const maxValue = Math.max(
    1,
    ...displayedItems.map((item) => {
      if (type === 'dishes') return item.orders || 0;
      if (type === 'customers') return item.totalSpent || 0;
      if (type === 'riders') return item.deliveries || 0;
      return 1;
    })
  );

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6">
        <theme.icon className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {displayedItems.map((item, index) => {
        const rank = item.rank || index + 1;
        const badgeConfig = rankBadges[rank];

        let title = '';
        let subtitle = '';
        let primaryMetric = '';
        let rawValue = 0;
        let secondaryMetric = null;

        if (type === 'dishes') {
          title = item.name;
          subtitle = item.category || 'Food';
          rawValue = item.orders || 0;
          primaryMetric = `${rawValue} orders`;
        } else if (type === 'customers') {
          title = item.name || 'Customer';
          subtitle = item.email ? item.email : `${item.orderCount || 0} orders`;
          rawValue = item.totalSpent || 0;
          primaryMetric = valueFormatter(rawValue);
          secondaryMetric = `${item.orderCount || 0} orders placed`;
        } else if (type === 'riders') {
          title = item.name || 'Rider';
          subtitle = `${item.acceptanceRate ?? 100}% acceptance • ${item.phone || 'Rider'}`;
          rawValue = item.deliveries || 0;
          primaryMetric = `${rawValue} trips`;
          secondaryMetric = `Earned: ${valueFormatter(item.earnings || 0)}`;
        }

        const widthPct = Math.max(6, Math.min(100, (rawValue / maxValue) * 100));

        return (
          <div
            key={item.id || item.userId || item.riderId || index}
            className="group relative flex flex-col gap-1.5 p-2 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
          >
            {/* Top row: Rank badge + Name/Subtitle + Value pill */}
            <div className="flex items-center justify-between gap-2.5 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Rank Badge */}
                <div
                  className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 shadow-xs ${
                    badgeConfig
                      ? badgeConfig.bg
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {rank}
                </div>

                {/* Name & Subtitle */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {title}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {subtitle}
                  </p>
                </div>
              </div>

              {/* Value metrics */}
              <div className="flex flex-col items-end shrink-0">
                <span
                  className={`text-xs sm:text-sm font-black flex items-center gap-1 ${theme.pillText}`}
                >
                  {primaryMetric}
                </span>
                {secondaryMetric && (
                  <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                    {secondaryMetric}
                  </span>
                )}
              </div>
            </div>

            {/* Visual Horizontal Proportional Bar Chart */}
            <div className="relative w-full h-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.7, delay: index * 0.06, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${theme.barGradient} shadow-xs ${theme.glowColor}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RankingBarChart;

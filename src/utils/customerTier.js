/**
 * Strips non-digits, country code (+88 / 88), and leading 0 from a phone number
 * e.g. "01712345678" -> "1712345678"
 */
export const cleanPhoneForMembership = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('880')) digits = digits.slice(3);
  else if (digits.startsWith('88')) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '');
  return digits;
};

/**
 * Formats Membership ID as BRG- + mobile number without leading zero.
 * e.g. 01712345678 -> BRG-1712345678
 */
export const membershipIdOf = (c) => {
  if (c?.membershipId && c.membershipId.startsWith('BRG-')) {
    return c.membershipId;
  }
  const clean = cleanPhoneForMembership(c?.phone);
  if (clean && clean.length >= 6) {
    return `BRG-${clean}`;
  }
  return `BRG-${String(c?.id || c?._id || '').slice(-8).toUpperCase() || '0000'}`;
};

/**
 * Spending Tier Breakpoints:
 * - 100k+  (>= ৳100,000) -> Elite (👑)
 * - 80k+   (>= ৳80,000)  -> Platinum (💎)
 * - 60k+   (>= ৳60,000)  -> Diamond (🔷)
 * - 20k+   (>= ৳20,000)  -> Gold (🥇)
 * - 10k+   (>= ৳10,000)  -> Classic (⭐)
 * - < 10k  (< ৳10,000)   -> Classic (🏷️)
 */
export const getCustomerTier = (totalSpent = 0) => {
  const spent = Number(totalSpent) || 0;
  if (spent >= 100000) {
    return {
      tier: 'Elite',
      badge: 'Elite',
      color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      badgeGradient: 'from-purple-600 via-pink-600 to-indigo-600',
      icon: '👑',
      minSpend: 100000,
      nextTier: null,
      nextMinSpend: null,
    };
  }
  if (spent >= 80000) {
    return {
      tier: 'Platinum',
      badge: 'Platinum',
      color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      badgeGradient: 'from-cyan-500 via-blue-600 to-indigo-600',
      icon: '💎',
      minSpend: 80000,
      nextTier: 'Elite',
      nextMinSpend: 100000,
    };
  }
  if (spent >= 60000) {
    return {
      tier: 'Diamond',
      badge: 'Diamond',
      color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      badgeGradient: 'from-blue-600 to-indigo-600',
      icon: '🔷',
      minSpend: 60000,
      nextTier: 'Platinum',
      nextMinSpend: 80000,
    };
  }
  if (spent >= 20000) {
    return {
      tier: 'Gold',
      badge: 'Gold',
      color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      badgeGradient: 'from-amber-500 to-yellow-600',
      icon: '🥇',
      minSpend: 20000,
      nextTier: 'Diamond',
      nextMinSpend: 60000,
    };
  }
  if (spent >= 10000) {
    return {
      tier: 'Classic',
      badge: 'Classic',
      color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      badgeGradient: 'from-emerald-500 to-teal-600',
      icon: '⭐',
      minSpend: 10000,
      nextTier: 'Gold',
      nextMinSpend: 20000,
    };
  }
  return {
    tier: 'Classic',
    badge: 'Classic',
    color: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
    badgeGradient: 'from-neutral-600 to-neutral-700',
    icon: '🏷️',
    minSpend: 0,
    nextTier: 'Gold',
    nextMinSpend: 20000,
  };
};

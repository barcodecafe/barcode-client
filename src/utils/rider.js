/**
 * Unified helper function to check whether an order is assigned to a given rider user.
 * Evaluates riderId (populated/raw), rider._id, and fallback riderName matching consistently across all pages.
 */
export const isAssignedToMe = (order, user) => {
  if (!order || !user) return false;

  const currentUserId = String(user._id || user.id || '').trim();
  const currentUserName = String(user.name || '').trim().toLowerCase();

  // 1. Check riderId (string or populated object) or rider sub-document
  const orderRiderId = String(
    typeof order.riderId === 'object'
      ? order.riderId?._id || order.riderId?.id || ''
      : order.riderId || order.rider?._id || order.rider?.id || ''
  ).trim();

  if (currentUserId && orderRiderId && currentUserId === orderRiderId) {
    return true;
  }

  // 2. Fallback check by rider name
  const orderRiderName = String(order.riderName || order.rider?.name || '').trim().toLowerCase();
  if (currentUserName && orderRiderName && currentUserName === orderRiderName) {
    return true;
  }

  return false;
};

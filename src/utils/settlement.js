// ---------------------------------------------------------------------------
// Rider cash settlement — client-side mirror of the server's money rules.
//
// The server is authoritative (see barcode-server settlement.config.ts); these
// helpers exist so the rider and admin screens agree with it while rendering,
// instead of each inventing its own arithmetic. Keep the two in step.
// ---------------------------------------------------------------------------

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Has the money been snapshotted? `deliveredAt` is the flag, not a non-zero
 * amount — ৳0 is a legitimate snapshot for a prepaid order, and treating it as
 * "missing" would re-derive the full total as cash the moment that payment was
 * later marked Failed.
 */
const isSnapshotted = (order) => !!order?.deliveredAt;

/** What the rider earns for a delivery — currently the whole delivery charge. */
export const riderCommissionFor = (order) =>
  isSnapshotted(order) && Number.isFinite(order?.riderCommission)
    ? round2(order.riderCommission)
    : round2(order?.deliveryCharge || 0);

/**
 * Cash actually taken from the customer at the door.
 *
 * An order already settled online is ৳0. This was the client's complaint: every
 * delivered order counted its full total as cash, so riders were asked to hand
 * over money that had been paid online and never passed through their hands.
 */
export const cashCollectedFor = (order) => {
  if (isSnapshotted(order) && Number.isFinite(order?.cashCollected))
    return round2(order.cashCollected);
  return order?.paymentStatus === "Paid" ? 0 : round2(order?.total || 0);
};

/** Food value of a delivery, excluding the delivery charge. */
export const foodValueFor = (order) =>
  Math.max(0, round2((order?.total || 0) - (order?.deliveryCharge || 0)));

/**
 * Business day, as YYYY-MM-DD in Asia/Dhaka — matches the server. Grouping by
 * the raw UTC date would push a late-evening delivery onto the next day.
 */
const BUSINESS_UTC_OFFSET_MINUTES = 6 * 60;

export const businessDateKey = (date) => {
  const d = date ? new Date(date) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const shifted = new Date(d.getTime() + BUSINESS_UTC_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
};

/**
 * The day an order's cash changed hands.
 *
 * ⚠️ Never `updatedAt` — it moves on every later save (a chat message, a rider
 * re-assignment), which would migrate a delivered order onto another settlement
 * day. Must stay identical to orderSettlementDate() on the server, or the rider
 * submits one day and the server settles a different one.
 */
export const orderSettlementDate = (order) =>
  businessDateKey(order?.deliveredAt || order?.createdAt);

/** 'Jul 22, 2026' for display, from a YYYY-MM-DD key. */
export const formatDateKey = (key) => {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Group a rider's orders into per-day settlement rows, newest first.
 *
 * `outstanding*` is what still has to change hands — an order the admin has
 * confirmed leaves the balance entirely, which is how a rider's collection
 * reaches zero after settlement.
 */
export const buildDailySettlementLog = (orders) => {
  const byDay = new Map();

  for (const order of orders || []) {
    // Membership is the snapshot, not the current status — must match the
    // server's settlementOrdersFor(). An order delivered and later flipped to
    // Rejected still had its cash handed over, and dropping it here would make
    // confirmed money disappear from the day.
    const wasDelivered = order.status === "Delivered" || !!order.deliveredAt;
    const isRejected = !wasDelivered && order.status === "Rejected";
    if (!wasDelivered && !isRejected) continue;

    const key = orderSettlementDate(order);
    if (!key) continue;

    if (!byDay.has(key)) {
      byDay.set(key, {
        dateKey: key,
        date: formatDateKey(key),
        delivered: 0,
        rejected: 0,
        foodPrice: 0,
        deliveryCharge: 0,
        riderCommission: 0,
        cashCollected: 0,
        onlinePaid: 0,
        outstandingCash: 0,
        outstandingCommission: 0,
        isSubmitted: true,
        isSettled: true,
        hasCash: false,
      });
    }
    const row = byDay.get(key);

    if (isRejected) {
      row.rejected += 1;
      continue;
    }

    const cash = cashCollectedFor(order);
    const commission = riderCommissionFor(order);

    row.delivered += 1;
    row.foodPrice = round2(row.foodPrice + foodValueFor(order));
    row.deliveryCharge = round2(row.deliveryCharge + (order.deliveryCharge || 0));
    row.riderCommission = round2(row.riderCommission + commission);
    row.cashCollected = round2(row.cashCollected + cash);
    if (cash === 0) row.onlinePaid = round2(row.onlinePaid + (order.total || 0));
    if (cash > 0) row.hasCash = true;

    if (!order.isCashSettledByAdmin) {
      row.outstandingCash = round2(row.outstandingCash + cash);
      row.outstandingCommission = round2(row.outstandingCommission + commission);
      row.isSettled = false;
      if (!order.isSubmittedToAdmin) row.isSubmitted = false;
    }
  }

  return [...byDay.values()]
    .map((row) => ({
      ...row,
      netPayable: round2(row.cashCollected - row.riderCommission),
      outstandingNetPayable: round2(row.outstandingCash - row.outstandingCommission),
    }))
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
};

// ---------------------------------------------------------------------------
// deliveryService.js — region-ভিত্তিক delivery charge (checkout display helper)
//
// ⚠️ Mirror of barcode_server/src/app/modules/order/delivery.config.ts.
// The SERVER re-computes and owns the final charge on the order; this is only
// for showing a live estimate as the customer picks their delivery area.
// পরে #13-এ এটা branch coordinate থেকে distance-based হবে।
// ---------------------------------------------------------------------------

export const DELIVERY_CHARGE_BY_AREA = {
  Dhaka: 60,
  Chattogram: 80,
  "Cox's Bazar": 120,
};

export const DEFAULT_DELIVERY_CHARGE = 100;

export const DELIVERY_AREAS = ['Dhaka', 'Chattogram', "Cox's Bazar"];

export function getDeliveryCharge(area) {
  if (!area) return DEFAULT_DELIVERY_CHARGE;
  const key = String(area).trim();
  return DELIVERY_CHARGE_BY_AREA[key] ?? DEFAULT_DELIVERY_CHARGE;
}

// Per-branch: match the chosen zone on the branch → its charge; else the branch's
// default charge; else the region fallback. Mirrors server chargeFromBranch().
export function getBranchDeliveryCharge(branch, zoneName) {
  const key = String(zoneName || '').trim();
  if (key && branch && Array.isArray(branch.deliveryZones)) {
    const z = branch.deliveryZones.find((x) => String(x.name).trim() === key);
    if (z) return Number(z.charge) || 0;
  }
  if (branch && branch.defaultDeliveryCharge !== undefined && branch.defaultDeliveryCharge !== null) {
    return Number(branch.defaultDeliveryCharge) || 0;
  }
  return getDeliveryCharge(zoneName);
}

import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Bike } from "lucide-react";
import { ErrorBanner } from "../../components/ErrorBanner";
import { getAllOrders, confirmRiderCashSettlement } from "../../services/ordersService";
import { getAllRiders } from "../../services/ridersService";
import { formatDateKey } from "../../utils/settlement";
import { socket } from "../../services/socket";
import RidersFleetOverview from "./RidersFleetOverview"; // 👈 আপনার তৈরি করা নতুন কম্পোনেন্ট

// The API is supposed to answer with arrays, but a single non-array slipping
// through used to reach `.map` during render — and with no ErrorBoundary in the
// app that unmounts the entire React tree to a white page rather than breaking
// one card.
const asArray = (value) => (Array.isArray(value) ? value : []);

export const AdminRidersFleet = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [confirmingRiderId, setConfirmingRiderId] = useState(null);

  // allSettled: orders and riders are independent, so one failing must not
  // discard the other. Previously either rejection left both lists empty and
  // the page looked like a fleet with no riders and no deliveries.
  const fetchOrdersAndFleet = async () => {
    const [ordersRes, ridersRes] = await Promise.allSettled([
      getAllOrders(),
      getAllRiders(),
    ]);

    if (ordersRes.status === "fulfilled") setOrders(asArray(ordersRes.value));
    else console.error("Fleet sync failed (orders):", ordersRes.reason);

    if (ridersRes.status === "fulfilled") setRiders(asArray(ridersRes.value));
    else console.error("Fleet sync failed (riders):", ridersRes.reason);

    setLoadError(
      ordersRes.status === "rejected"
        ? ordersRes.reason
        : ridersRes.status === "rejected"
          ? ridersRes.reason
          : null,
    );
  };

  useEffect(() => {
    let cancelled = false;

    // .finally is what guarantees the spinner clears. apiClient now also
    // enforces a request timeout, so a request that never answers can no longer
    // pin this page on a loading spinner indefinitely.
    fetchOrdersAndFleet().finally(() => {
      if (!cancelled) setLoading(false);
    });

    // Named handler passed to BOTH on and off — socket.off('order_updated')
    // with no handler removed every other component's listener for that event
    // too, which silently broke realtime updates elsewhere in the app.
    //
    // Coalesced, because the server broadcasts to every client and a single
    // admin action emits several events back to back (assign-rider alone sends
    // three). Refetching per event meant six requests for one click; this
    // collapses a burst into one refresh.
    let burstTimer = null;
    const handleFleetChanged = () => {
      clearTimeout(burstTimer);
      burstTimer = setTimeout(() => {
        if (!cancelled) fetchOrdersAndFleet();
      }, 600);
    };

    socket.on("order_updated", handleFleetChanged);
    socket.on("rider_updated", handleFleetChanged);

    return () => {
      cancelled = true;
      clearTimeout(burstTimer);
      socket.off("order_updated", handleFleetChanged);
      socket.off("rider_updated", handleFleetChanged);
    };
  }, []);

  const handleConfirmCashSettlement = async (riderId, riderName, dateKey) => {
    const confirmSettle = window.confirm(
      `Confirm you have received ${riderName}'s cash for ${formatDateKey(dateKey)}?`
    );
    if (!confirmSettle) return;

    try {
      setConfirmingRiderId(riderId);
      await confirmRiderCashSettlement(riderId, dateKey);
      toast.success(`Cash settlement confirmed for ${riderName}!`);
      fetchOrdersAndFleet();
    } catch (err) {
      toast.error("Settlement failed: " + (err.response?.data?.message || err.message));
    } finally {
      setConfirmingRiderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Bike className="w-8 h-8 text-primary-500" />
            Riders Fleet & Cash Settlement
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage rider availability, track daily cash collections, and confirm settlements.
          </p>
        </div>
      </div>

      <ErrorBanner
        title="Fleet data could not be loaded"
        error={loadError}
        onRetry={fetchOrdersAndFleet}
      />

      {/* আপনার তৈরি করা কম্পোনেন্ট */}
      <RidersFleetOverview
        riders={riders}
        orders={orders}
        confirmingRiderId={confirmingRiderId}
        onConfirmCashSettlement={handleConfirmCashSettlement}
        onRefresh={fetchOrdersAndFleet}
      />
    </div>
  );
};

export default AdminRidersFleet;
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Bike } from "lucide-react";
import { getAllOrders, confirmRiderCashSettlement } from "../../services/ordersService";
import { getAllRiders } from "../../services/ridersService";
import { formatDateKey } from "../../utils/settlement";
import { socket } from "../../services/socket";
import RidersFleetOverview from "./RidersFleetOverview"; // 👈 আপনার তৈরি করা নতুন কম্পোনেন্ট

export const AdminRidersFleet = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRiderId, setConfirmingRiderId] = useState(null);

  const fetchOrdersAndFleet = () =>
    Promise.all([getAllOrders(), getAllRiders()])
      .then(([ordersData, ridersData]) => {
        setOrders(ordersData || []);
        setRiders(ridersData || []);
      })
      .catch((err) => console.error("Fleet sync failed:", err));

  useEffect(() => {
    fetchOrdersAndFleet().finally(() => setLoading(false));

    socket.on("order_updated", fetchOrdersAndFleet);
    socket.on("rider_updated", fetchOrdersAndFleet);

    return () => {
      socket.off("order_updated");
      socket.off("rider_updated");
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
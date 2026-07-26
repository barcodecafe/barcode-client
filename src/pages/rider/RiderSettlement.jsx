import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { buildDailySettlementLog, formatDateKey } from "../../utils/settlement";
import {
  getAllOrders,
  submitRiderDailyCash,
} from "../../services/ordersService";

export const RiderSettlement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingCashDate, setSubmittingCashDate] = useState(null);

  const fetchRiderOrders = useCallback(() => {
    if (!user) return;
    getAllOrders()
      .then((data) => {
        const assigned = (data || []).filter(
          (o) =>
            o.riderId === user.id ||
            o.riderName?.toLowerCase() === user.name?.toLowerCase()
        );
        setOrders(assigned);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders:", err);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    fetchRiderOrders();
    const interval = setInterval(fetchRiderOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchRiderOrders]);

  const handleSubmitCash = async (dateKey) => {
    const label = formatDateKey(dateKey);
    const confirmSubmit = window.confirm(
      `Are you sure you want to mark all collected cash as submitted for ${label}?`
    );
    if (!confirmSubmit) return;

    try {
      setSubmittingCashDate(dateKey);
      await submitRiderDailyCash(dateKey);
      alert(`Cash submission request sent to Admin for ${label}!`);
      fetchRiderOrders();
    } catch (err) {
      alert("Failed to submit cash: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingCashDate(null);
    }
  };

  const dailyLog = buildDailySettlementLog(orders);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          Daily Performance Track Log
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
          Track daily earnings, total collected cash, and request admin settlement.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-rose-500" />
          <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
            Daily Track History
          </h3>
        </div>

        {dailyLog.length === 0 ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium py-2">
            No history logs recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto pr-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Delivered</th>
                  <th className="py-2.5 px-3">Rejected</th>
                  <th className="py-2.5 px-3">Food Price</th>
                  <th className="py-2.5 px-3">Delivery Charge</th>
                  <th className="py-2.5 px-3">Rider Commission</th>
                  <th className="py-2.5 px-3">Cash Collected</th>
                  <th className="py-2.5 px-3">Payable to Admin</th>
                  <th className="py-2.5 px-3 text-right">Admin Cash Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {dailyLog.map((log, index) => (
                  <tr
                    key={index}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-neutral-800 dark:text-neutral-200">
                      {log.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3 h-3" /> {log.delivered}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-extrabold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3 h-3" /> {log.rejected}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                      ৳{log.foodPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-600 dark:text-amber-400">
                      ৳{log.deliveryCharge.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-500">
                      ৳{log.riderCommission.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-black text-rose-500">
                      ৳{log.cashCollected.toFixed(2)}
                      {log.onlinePaid > 0 && (
                        <span
                          className="block text-[9px] font-semibold text-neutral-400 normal-case"
                          title="Paid online — the rider collected no cash for these"
                        >
                          +৳{log.onlinePaid.toFixed(2)} paid online
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-black text-amber-600 dark:text-amber-400">
                      ৳{log.outstandingNetPayable.toFixed(2)}
                      {log.outstandingNetPayable < 0 && (
                        <span className="block text-[9px] font-semibold text-emerald-500 normal-case">
                          admin owes you
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {log.delivered === 0 ? (
                        <span className="text-neutral-400 font-medium text-[10px]">
                          N/A
                        </span>
                      ) : log.isSettled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </span>
                      ) : log.isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                          <Clock3 className="w-3 h-3" /> Awaiting admin
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSubmitCash(log.dateKey)}
                          disabled={submittingCashDate === log.dateKey}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                          title="Click to submit collected cash to admin"
                        >
                          <Clock3 className="w-3 h-3 animate-pulse" />
                          {submittingCashDate === log.dateKey
                            ? "Submitting..."
                            : "Pay to Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderSettlement;
import React from "react";
import {
  Bike,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Check,
} from "lucide-react";
import { updateRiderStatus } from "../../services/ridersService";
import {
  buildDailySettlementLog,
  businessDateKey,
} from "../../utils/settlement";

export const RidersFleetOverview = ({
  riders = [],
  orders = [],
  confirmingRiderId,
  onConfirmCashSettlement,
  onRefresh,
}) => {
  // 🎯 রাইডারের পারফর্মেন্স ও ক্যাশ সেটেলমেন্ট হিসাব করার লজিক
  const getRiderPerformanceStats = (riderId) => {
    const todayKey = businessDateKey(new Date());
    const riderOrders = orders.filter((o) => o.riderId === riderId);

    const log = buildDailySettlementLog(riderOrders);
    const today = log.find((r) => r.dateKey === todayKey);

    const pastDue = log
      .filter((r) => r.dateKey !== todayKey && r.delivered > 0 && !r.isSettled)
      .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));

    return {
      dateKey: todayKey,
      pastDue,
      daily: {
        foodDelivered: today?.foodPrice || 0,
        income: today?.riderCommission || 0,
        cashCollected: today?.cashCollected || 0,
        onlinePaid: today?.onlinePaid || 0,
        payable: today?.outstandingNetPayable || 0,
        deliveredCount: today?.delivered || 0,
      },
      cashStatus: {
        hasOrders: (today?.delivered || 0) > 0,
        isSubmittedByRider: !!today?.isSubmitted,
        hasUnsubmittedCash: !today?.isSubmitted,
        isConfirmedByAdmin: !!today?.isSettled,
      },
    };
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xs">
      <h3 className="text-xs font-bold font-display text-neutral-855 dark:text-white mb-3 flex items-center gap-2">
        <Bike className="w-4 h-4 text-primary-500" />
        Riders Fleet Overview & Cash Settlement
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {riders.map((r) => {
          const stats = getRiderPerformanceStats(r.id);
          const { cashStatus } = stats;

          return (
            <div
              key={r.id}
              className="p-3 border border-neutral-150 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-950/20 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <span className="block font-bold text-xs text-neutral-800 dark:text-neutral-100">
                      {r.name}
                    </span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5">
                      Phone: {r.phone}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      r.status === "Available"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <span className="block text-[10px] font-semibold mt-1 text-neutral-500 dark:text-neutral-300">
                  {r.activeOrders > 0
                    ? `🚴 ${r.activeOrders} active ${
                        r.activeOrders === 1 ? "delivery" : "deliveries"
                      }`
                    : "No active delivery"}
                </span>

                <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="block text-[9px] uppercase tracking-wider font-bold text-neutral-400">
                    Today's Collection ({stats.daily.deliveredCount}{" "}
                    Delivered)
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[10px] bg-neutral-100/60 dark:bg-neutral-950/40 p-2 rounded-lg">
                    <div>
                      <span className="text-neutral-400 text-[9px] block">
                        Cash Collected
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        ৳{stats.daily.cashCollected.toFixed(0)}
                      </span>
                      {stats.daily.onlinePaid > 0 && (
                        <span
                          className="block text-[8px] text-neutral-400 font-semibold"
                          title="Paid online — no cash passed through the rider"
                        >
                          ৳{stats.daily.onlinePaid.toFixed(0)} online
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-400 text-[9px] block">
                        Rider Share
                      </span>
                      <span className="font-bold text-primary-500">
                        ৳{stats.daily.income.toFixed(0)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1.5 mt-0.5 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex items-baseline justify-between">
                      <span className="text-neutral-400 text-[9px]">
                        {stats.daily.payable < 0
                          ? "You owe rider"
                          : "Payable to admin"}
                      </span>
                      <span
                        className={`font-black text-[11px] ${
                          stats.daily.payable < 0
                            ? "text-blue-500"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        ৳{Math.abs(stats.daily.payable).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    {!cashStatus.hasOrders ? (
                      <div className="text-[10px] text-neutral-400 font-medium text-center py-1 bg-neutral-100/30 dark:bg-neutral-900/30 rounded-md">
                        No Cash Pending Today
                      </div>
                    ) : cashStatus.isConfirmedByAdmin ? (
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 py-1 rounded-lg">
                        <CheckCircle2 className="w-3 h-3" /> Cash Settled &
                        Confirmed
                      </div>
                    ) : cashStatus.isSubmittedByRider ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                          <span className="flex items-center gap-1">
                            <Clock3 className="w-3 h-3 animate-pulse" />{" "}
                            Submitted by Rider
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            onConfirmCashSettlement(
                              r.id,
                              r.name,
                              stats.dateKey
                            )
                          }
                          disabled={confirmingRiderId === r.id}
                          className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          {confirmingRiderId === r.id
                            ? "Confirming..."
                            : "Approve & Mark Succeeded"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 py-1 rounded-lg">
                        <AlertCircle className="w-3 h-3" /> Cash Not Submitted
                        Yet
                      </div>
                    )}

                    {stats.pastDue.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 space-y-1.5">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-red-400">
                          Earlier days unsettled ({stats.pastDue.length})
                          {stats.pastDue.length > 5 && " · oldest 5 shown"}
                        </span>
                        {stats.pastDue.slice(0, 5).map((day) => (
                          <div
                            key={day.dateKey}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">
                              {day.date} · ৳
                              {day.outstandingNetPayable.toFixed(0)}
                            </span>
                            <button
                              onClick={() =>
                                onConfirmCashSettlement(
                                  r.id,
                                  r.name,
                                  day.dateKey
                                )
                              }
                              disabled={confirmingRiderId === r.id}
                              className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase transition-all active:scale-95 disabled:opacity-50 ${
                                day.isSubmitted
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300"
                              }`}
                              title={
                                day.isSubmitted
                                  ? "Rider submitted this day — confirm you received it"
                                  : "Rider has not submitted this day yet"
                              }
                            >
                              {day.isSubmitted ? "Confirm" : "Not submitted"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-150 dark:border-neutral-850">
                <span className="text-[9px] font-bold text-neutral-400">
                  Rider Status:
                </span>
                <select
                  value={r.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    await updateRiderStatus(r.id, newStatus);
                    if (onRefresh) onRefresh();
                  }}
                  className="text-[9px] font-bold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded p-0.5 cursor-pointer"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RidersFleetOverview;
import React, { useState, useMemo } from "react";
import {
  Bike,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Check,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Percent,
  Search,
  X,
  User,
  Phone,
  Lock,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  updateRiderStatus,
  createRiderManual,
  updateRiderProfile,
  deleteRider,
} from "../../services/ridersService";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'permanent' | 'freelance'

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    vehicle: "Motorbike",
    employmentType: "permanent", // 'permanent' | 'freelance'
    commissionRate: 15,
    agencyName: "",
    pickArea: "",
    address: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      vehicle: "Motorbike",
      employmentType: "permanent",
      commissionRate: 15,
      agencyName: "",
      pickArea: "",
      address: "",
    });
    setSelectedRider(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (rider) => {
    setSelectedRider(rider);
    setFormData({
      name: rider.name || "",
      phone: rider.phone || "",
      email: rider.email || "",
      password: "", // empty means keep existing
      vehicle: rider.vehicle || "Motorbike",
      employmentType: rider.employmentType || "permanent",
      commissionRate: rider.commissionRate ?? 15,
      agencyName: rider.agencyName || "",
      pickArea: rider.pickArea || "",
      address: rider.address || "",
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Name and Phone Number are required.");
      return;
    }

    try {
      setSubmitting(true);
      await createRiderManual(formData);
      toast.success(`Rider ${formData.name} created successfully!`);
      setIsAddModalOpen(false);
      resetForm();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create rider.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRider) return;

    try {
      setSubmitting(true);
      await updateRiderProfile(selectedRider.id, formData);
      toast.success(`Rider ${formData.name} updated successfully!`);
      setIsEditModalOpen(false);
      resetForm();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update rider.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRider = async (rider) => {
    const result = await Swal.fire({
      title: "Remove Rider?",
      text: `Are you sure you want to remove ${rider.name} from active fleet?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Remove",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteRider(rider.id);
        toast.success(`Rider ${rider.name} removed from fleet.`);
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || "Failed to delete rider.");
      }
    }
  };

  // Performance stats calculation
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

  // Filtered Riders
  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      const matchesSearch =
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone?.includes(searchQuery) ||
        r.agencyName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        filterType === "all"
          ? true
          : filterType === "permanent"
          ? r.employmentType === "permanent" || !r.employmentType
          : r.employmentType === "freelance";

      return matchesSearch && matchesType;
    });
  }, [riders, searchQuery, filterType]);

  const permanentCount = riders.filter(
    (r) => r.employmentType === "permanent" || !r.employmentType
  ).length;
  const freelanceCount = riders.filter((r) => r.employmentType === "freelance").length;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-4 sm:p-5 shadow-xs w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto space-y-4">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h3 className="text-sm sm:text-base font-bold font-display text-neutral-800 dark:text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary-500" />
            Riders Fleet Overview & Cash Settlement
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Total active riders: {riders.length} ({permanentCount} Permanent, {freelanceCount} Freelance)
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-primary-500/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add New Rider
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Employment Type Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/60 p-1 rounded-xl">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400"
            }`}
          >
            All Riders ({riders.length})
          </button>
          <button
            onClick={() => setFilterType("permanent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "permanent"
                ? "bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-neutral-500 hover:text-emerald-600 dark:text-neutral-400"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Permanent ({permanentCount})
          </button>
          <button
            onClick={() => setFilterType("freelance")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "freelance"
                ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-neutral-500 hover:text-blue-600 dark:text-neutral-400"
            }`}
          >
            <Percent className="w-3.5 h-3.5" /> Freelance / Agency ({freelanceCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rider, phone, agency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-100/70 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 🎯 Ultra-wide Grid */}
      {filteredRiders.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-xs font-medium bg-neutral-50/50 dark:bg-neutral-950/20 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
          No riders found matching the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-4">
          {filteredRiders.map((r) => {
            const stats = getRiderPerformanceStats(r.id);
            const { cashStatus } = stats;
            const isFreelance = r.employmentType === "freelance";

            return (
              <div
                key={r.id}
                className="p-3.5 border border-neutral-150 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-955/20 flex flex-col justify-between space-y-3 relative group transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
              >
                <div>
                  {/* Rider Header Details */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-neutral-800 dark:text-neutral-100 truncate">
                          {r.name}
                        </span>
                      </div>
                      <span className="block text-[10px] text-neutral-400 mt-0.5 truncate">
                        Phone: {r.phone} {r.vehicle ? `· ${r.vehicle}` : ""}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          r.status === "Available"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {/* Employment Model Badge */}
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    {isFreelance ? (
                      <span
                        className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] font-extrabold flex items-center gap-1"
                        title={`Freelance Rider: ${r.commissionRate || 15}% Food Cost Commission`}
                      >
                        <Percent className="w-2.5 h-2.5" /> Freelance ({r.commissionRate || 15}%)
                        {r.agencyName ? `· ${r.agencyName}` : ""}
                      </span>
                    ) : (
                      <span
                        className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold flex items-center gap-1"
                        title="Permanent Rider: Standard Area Delivery Fee"
                      >
                        <Building2 className="w-2.5 h-2.5" /> Permanent (Area Fee)
                      </span>
                    )}

                    <span className="text-[9px] text-neutral-400 font-semibold ml-auto">
                      {r.activeOrders > 0 ? `🚴 ${r.activeOrders} active` : "Idle"}
                    </span>
                  </div>

                  {/* Today's Daily Stats */}
                  <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-bold text-neutral-400">
                      <span>Today's Log ({stats.daily.deliveredCount} Del.)</span>
                      <span>
                        {isFreelance ? "15% Food Comm." : "Area Del. Fee"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] bg-neutral-100/60 dark:bg-neutral-955/40 p-2 rounded-lg">
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
                            title="Paid online — no cash passed through rider"
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
                          <CheckCircle2 className="w-3 h-3" /> Cash Settled & Confirmed
                        </div>
                      ) : cashStatus.isSubmittedByRider ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                            <span className="flex items-center gap-1">
                              <Clock3 className="w-3 h-3 animate-pulse" /> Submitted by Rider
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              onConfirmCashSettlement(r.id, r.name, stats.dateKey)
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
                          <AlertCircle className="w-3 h-3" /> Cash Not Submitted Yet
                        </div>
                      )}

                      {stats.pastDue.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 space-y-1.5">
                          <span className="block text-[9px] uppercase tracking-wider font-bold text-red-400">
                            Earlier days unsettled ({stats.pastDue.length})
                          </span>
                          {stats.pastDue.slice(0, 3).map((day) => (
                            <div
                              key={day.dateKey}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">
                                {day.date} · ৳{day.outstandingNetPayable.toFixed(0)}
                              </span>
                              <button
                                onClick={() =>
                                  onConfirmCashSettlement(r.id, r.name, day.dateKey)
                                }
                                disabled={confirmingRiderId === r.id}
                                className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                                  day.isSubmitted
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300"
                                }`}
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

                {/* Footer Controls: Edit, Delete & Availability Selector */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-150 dark:border-neutral-850 gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(r)}
                      title="Edit Rider Profile & Compensation"
                      className="p-1 rounded-md text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRider(r)}
                      title="Remove Rider"
                      className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

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
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 🚀 ADD NEW RIDER MODAL                                     */}
      {/* ────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-900 dark:text-white">
                    Add New Rider
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Create active rider account with instant login credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Rider Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shakib Ahmed"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone Number (Login ID) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 017XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="rider@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Login Password (Default: 123456)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Default: 123456"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 🎯 Employment Model Selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Employment Model & Compensation *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Permanent Option */}
                  <label
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.employmentType === "permanent"
                        ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="employmentType"
                        value="permanent"
                        checked={formData.employmentType === "permanent"}
                        onChange={() => setFormData({ ...formData, employmentType: "permanent" })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-xs text-neutral-800 dark:text-white flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Permanent
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 pl-5 leading-tight">
                      Earns standard area-based delivery fee (e.g. ৳60).
                    </p>
                  </label>

                  {/* Freelance Option */}
                  <label
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.employmentType === "freelance"
                        ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="employmentType"
                        value="freelance"
                        checked={formData.employmentType === "freelance"}
                        onChange={() => setFormData({ ...formData, employmentType: "freelance" })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-xs text-neutral-800 dark:text-white flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-blue-500" /> Freelance / Agency
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 pl-5 leading-tight">
                      Earns percentage commission on total food cost.
                    </p>
                  </label>
                </div>
              </div>

              {/* Freelance Specific Settings */}
              {formData.employmentType === "freelance" && (
                <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 mb-1">
                        Food Cost Commission Rate (%) *
                      </label>
                      <div className="relative">
                        <Percent className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="1"
                          max="100"
                          required
                          value={formData.commissionRate}
                          onChange={(e) =>
                            setFormData({ ...formData, commissionRate: Number(e.target.value) || 0 })
                          }
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700/60 rounded-xl text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Default: 15% (e.g. ৳1,000 food order yields ৳150)
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 mb-1">
                        Agency / Company Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pathao Fleet, RedX, etc."
                        value={formData.agencyName}
                        onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700/60 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  >
                    <option value="Motorbike">Motorbike</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Electric Bike">Electric Bike</option>
                    <option value="Van">Delivery Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Preferred Area (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dhanmondi, Gulshan"
                    value={formData.pickArea}
                    onChange={(e) => setFormData({ ...formData, pickArea: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {submitting ? "Creating..." : "Save & Activate Rider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ✏️ EDIT RIDER MODAL                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {isEditModalOpen && selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-900 dark:text-white">
                    Edit Rider Profile: {selectedRider.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Update employment model, commission rate, vehicle, or password
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Employment Model */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Employment Model & Compensation *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.employmentType === "permanent"
                        ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="editEmploymentType"
                        value="permanent"
                        checked={formData.employmentType === "permanent"}
                        onChange={() => setFormData({ ...formData, employmentType: "permanent" })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-xs text-neutral-800 dark:text-white flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Permanent
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 pl-5 leading-tight">
                      Earns standard area-based delivery fee.
                    </p>
                  </label>

                  <label
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.employmentType === "freelance"
                        ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10"
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="editEmploymentType"
                        value="freelance"
                        checked={formData.employmentType === "freelance"}
                        onChange={() => setFormData({ ...formData, employmentType: "freelance" })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-xs text-neutral-800 dark:text-white flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-blue-500" /> Freelance / Agency
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 pl-5 leading-tight">
                      Earns percentage commission on total food cost.
                    </p>
                  </label>
                </div>
              </div>

              {formData.employmentType === "freelance" && (
                <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 mb-1">
                        Commission Rate (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={formData.commissionRate}
                        onChange={(e) =>
                          setFormData({ ...formData, commissionRate: Number(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700/60 rounded-xl text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 mb-1">
                        Agency / Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pathao Fleet"
                        value={formData.agencyName}
                        onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700/60 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Password & Vehicle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  >
                    <option value="Motorbike">Motorbike</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Electric Bike">Electric Bike</option>
                    <option value="Van">Delivery Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep unchanged"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {submitting ? "Saving..." : "Update Rider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidersFleetOverview;
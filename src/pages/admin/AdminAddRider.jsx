import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Bike,
  Plus,
  Building2,
  Percent,
  User,
  Phone,
  Lock,
  Mail,
  MapPin,
  Check,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { createRiderManual } from "../../services/ridersService";

export const AdminAddRider = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Name and Phone Number are required.");
      return;
    }

    try {
      setSubmitting(true);
      await createRiderManual(formData);
      toast.success(`🎉 Rider ${formData.name} successfully created & activated!`);
      navigate("/admin/fleet-overview");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create rider.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-5xl 3xl:max-w-6xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200/70 dark:border-neutral-800/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-1">
            <Link
              to="/admin/fleet-overview"
              className="hover:text-primary-500 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Rider Fleet
            </Link>
            <span>/</span>
            <span className="text-neutral-700 dark:text-neutral-200">Add New Rider</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-display text-neutral-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            Add New Rider
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manually create an active rider profile with custom compensation model and login credentials.
          </p>
        </div>

        <Link
          to="/admin/fleet-overview"
          className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          View Active Fleet
        </Link>
      </div>

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container (2 Cols on lg) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Information */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs sm:text-sm font-bold font-display text-neutral-800 dark:text-white flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <User className="w-4 h-4 text-primary-500" />
              1. Basic Credentials & Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Rider Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sajib Khan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Phone Number (Login ID) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Login Password (Default: 123456)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Default: 123456"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="rider@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Employment Model & Compensation */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs sm:text-sm font-bold font-display text-neutral-800 dark:text-white flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <Percent className="w-4 h-4 text-primary-500" />
              2. Employment Model & Earning Structure *
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Permanent Model Option */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  formData.employmentType === "permanent"
                    ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs"
                    : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="employmentType"
                      value="permanent"
                      checked={formData.employmentType === "permanent"}
                      onChange={() => setFormData({ ...formData, employmentType: "permanent" })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-500" /> Permanent Rider
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    Earns the standard area-based delivery charge (e.g. ৳60 or zone rate) as their fixed delivery fee.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ Fixed Area Rate Payout
                </div>
              </label>

              {/* Freelance / Agency Model Option */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  formData.employmentType === "freelance"
                    ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-xs"
                    : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="employmentType"
                      value="freelance"
                      checked={formData.employmentType === "freelance"}
                      onChange={() => setFormData({ ...formData, employmentType: "freelance" })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-blue-500" /> Freelance / Agency
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    Earns a percentage commission on the total food cost of each delivered order (default 15%).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-blue-500/20 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  ✓ % Commission on Food Subtotal
                </div>
              </label>
            </div>

            {/* Freelance Commission Customization */}
            {formData.employmentType === "freelance" && (
              <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1.5">
                      Food Cost Commission Rate (%) *
                    </label>
                    <div className="relative">
                      <Percent className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={formData.commissionRate}
                        onChange={(e) =>
                          setFormData({ ...formData, commissionRate: Number(e.target.value) || 0 })
                        }
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700/60 rounded-xl text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      Example: 15% on a ৳1,000 food order yields ৳150 commission.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1.5">
                      Agency / Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pathao Fleet, RedX, FastCourier"
                      value={formData.agencyName}
                      onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700/60 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      Optional agency or partner tag displayed on cards.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Vehicle & Service Details */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs sm:text-sm font-bold font-display text-neutral-800 dark:text-white flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <Bike className="w-4 h-4 text-primary-500" />
              3. Vehicle & Service Area
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Vehicle Type
                </label>
                <select
                  value={formData.vehicle}
                  onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                >
                  <option value="Motorbike">Motorbike</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Electric Bike">Electric Bike</option>
                  <option value="Van">Delivery Van</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Preferred Area (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Dhanmondi, Banani, Mirpur"
                    value={formData.pickArea}
                    onChange={(e) => setFormData({ ...formData, pickArea: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Street address or residence info"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/admin/fleet-overview"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-lg shadow-primary-500/25 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {submitting ? "Creating..." : "Save & Activate Rider"}
            </button>
          </div>
        </form>

        {/* Live Preview Sidebar (1 Col on lg) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs space-y-4 sticky top-20">
            <h3 className="text-xs sm:text-sm font-bold font-display text-neutral-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Live Fleet Card Preview
            </h3>

            {/* Mock Rider Card */}
            <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/70 dark:bg-neutral-950/40 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="block font-bold text-xs text-neutral-900 dark:text-white">
                    {formData.name.trim() || "Rider Name"}
                  </span>
                  <span className="block text-[10px] text-neutral-400 mt-0.5">
                    📱 {formData.phone.trim() || "017XXXXXXXX"} · 🛵 {formData.vehicle}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                  Available
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {formData.employmentType === "freelance" ? (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] font-extrabold flex items-center gap-1">
                    <Percent className="w-2.5 h-2.5" /> Freelance ({formData.commissionRate || 15}%)
                    {formData.agencyName ? ` · ${formData.agencyName}` : ""}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5" /> Permanent (Area Fee)
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 text-[10px] space-y-1">
                <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                  <span>Compensation Rule:</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {formData.employmentType === "freelance"
                      ? `${formData.commissionRate || 15}% Food Cost`
                      : "Area Delivery Fee"}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                  <span>Login Password:</span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {formData.password || "123456"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Helper Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Instant Account Activation
              </span>
              <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-400/90">
                The rider can immediately log in at <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">/rider/login</code> using this phone number and password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAddRider;

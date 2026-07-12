import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getAllCoupons, createCoupon, deleteCoupon } from '../../services/couponsService';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponMinSpend, setCouponMinSpend] = useState('');
  const [couponError, setCouponError] = useState('');

  const fetchCoupons = () => {
    getAllCoupons().then((data) => {
      setCoupons(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');

    if (!couponCode.trim() || !couponDiscount) {
      setCouponError('Please enter Coupon Code and Discount Percentage.');
      return;
    }

    try {
      await createCoupon({
        code: couponCode,
        discountPct: parseInt(couponDiscount, 10),
        minSpend: parseFloat(couponMinSpend) || 0,
        isActive: true,
      });
      setCouponCode('');
      setCouponDiscount('');
      setCouponMinSpend('');
      fetchCoupons();
    } catch (err) {
      setCouponError(err.message || 'Failed to create coupon.');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      await deleteCoupon(id);
      fetchCoupons();
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
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
          Coupons Control
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Generate discount coupon codes and configure minimum spend thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs h-fit">
          <h3 className="font-display font-extrabold text-base text-neutral-850 dark:text-white mb-4">Create Discount Coupon</h3>
          
          {couponError && (
            <div className="p-3 mb-4 text-xs text-red-650 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
              {couponError}
            </div>
          )}

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Coupon Code
              </label>
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. MONSOON30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Discount (%)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(e.target.value)}
                  placeholder="30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Min Spend (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={couponMinSpend}
                  onChange={(e) => setCouponMinSpend(e.target.value)}
                  placeholder="৳500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/10 active:scale-95 transition-all mt-4"
            >
              <Plus className="w-4 h-4" />
              Generate Coupon Code
            </button>
          </form>
        </div>

        {/* Coupons List Table */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
          <h3 className="font-display font-extrabold text-base text-neutral-850 dark:text-white mb-4">Active Coupons</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-950/40">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount Pct</th>
                  <th className="px-4 py-3">Minimum Spend</th>
                  <th className="px-4 py-3">Active Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((cp) => (
                  <tr key={cp.id} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                    <td className="px-4 py-3.5 font-bold text-primary-500 tracking-wider">
                      {cp.code}
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-neutral-800 dark:text-neutral-100">
                      {cp.discountPct}% OFF
                    </td>
                    <td className="px-4 py-3.5 font-medium text-neutral-605 dark:text-neutral-300">
                      ৳{(cp.minSpend || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                        cp.isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {cp.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(cp.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;

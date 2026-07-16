import { useState, useEffect } from 'react';
import { Plus, Trash2, QrCode, Download, X, Copy, Check } from 'lucide-react';
import { getAllCoupons, createCoupon, deleteCoupon, couponDiscountLabel } from '../../services/couponsService';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('percent'); // 'percent' | 'flat'
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponMinSpend, setCouponMinSpend] = useState('');
  const [couponError, setCouponError] = useState('');
  const [creating, setCreating] = useState(false);
  const [qrModal, setQrModal] = useState(null); // coupon shown in the QR modal
  const [copiedId, setCopiedId] = useState('');

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

    // Code is now optional — the server auto-generates a unique one when blank.
    if (!couponDiscount) {
      setCouponError(couponType === 'flat' ? 'Please enter the discount amount (৳).' : 'Please enter the discount percentage.');
      return;
    }

    setCreating(true);
    try {
      await createCoupon({
        code: couponCode.trim(), // blank => server generates a unique code
        discountType: couponType,
        discountPct: couponType === 'percent' ? parseInt(couponDiscount, 10) : 0,
        discountAmount: couponType === 'flat' ? parseFloat(couponDiscount) || 0 : 0,
        minSpend: parseFloat(couponMinSpend) || 0,
        isActive: true,
      });
      setCouponCode('');
      setCouponDiscount('');
      setCouponMinSpend('');
      fetchCoupons();
    } catch (err) {
      setCouponError(err.message || 'Failed to create coupon.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      await deleteCoupon(id);
      fetchCoupons();
    }
  };

  const copyId = async (couponId) => {
    try {
      await navigator.clipboard.writeText(couponId);
      setCopiedId(couponId);
      setTimeout(() => setCopiedId(''), 1500);
    } catch {
      /* clipboard blocked — ignore */
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
          Generate discount coupons with a unique ID and a scannable QR for POS terminals.
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
                Coupon Code <span className="text-neutral-400 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. MONSOON30 — blank = auto-generate"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">A unique ID + QR code are generated automatically.</p>
            </div>

            {/* Discount type toggle: percentage or flat ৳ amount */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Discount Type
              </label>
              <div className="flex gap-2">
                {[
                  { key: 'percent', label: 'Percentage (%)' },
                  { key: 'flat', label: 'Flat (৳)' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setCouponType(opt.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      couponType === opt.key
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-primary-500/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  {couponType === 'flat' ? 'Discount (৳)' : 'Discount (%)'}
                </label>
                <input
                  type="number"
                  required
                  min={couponType === 'flat' ? '1' : '1'}
                  max={couponType === 'flat' ? undefined : '100'}
                  step={couponType === 'flat' ? '1' : '1'}
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(e.target.value)}
                  placeholder={couponType === 'flat' ? '৳100' : '30'}
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
              disabled={creating}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/10 active:scale-95 transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Generating…' : 'Generate Coupon Code'}
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
                  <th className="px-4 py-3">Unique ID / QR</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Min Spend</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((cp) => (
                  <tr key={cp.id} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                    <td className="px-4 py-3.5 font-bold text-primary-500 tracking-wider">
                      {cp.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {cp.qrImage ? (
                          <button
                            type="button"
                            onClick={() => setQrModal(cp)}
                            title="View / print QR for POS"
                            className="shrink-0 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white p-0.5 hover:ring-2 hover:ring-primary-500/40 transition-all"
                          >
                            <img src={cp.qrImage} alt={`QR for ${cp.code}`} className="w-9 h-9 object-contain" />
                          </button>
                        ) : (
                          <span className="w-9 h-9 grid place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 shrink-0">
                            <QrCode className="w-4 h-4" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => cp.couponId && copyId(cp.couponId)}
                          title="Copy unique ID"
                          className="font-mono text-[11px] text-neutral-600 dark:text-neutral-300 inline-flex items-center gap-1 hover:text-primary-500"
                        >
                          {cp.couponId || '—'}
                          {cp.couponId && (copiedId === cp.couponId
                            ? <Check className="w-3 h-3 text-emerald-500" />
                            : <Copy className="w-3 h-3 opacity-60" />)}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-neutral-800 dark:text-neutral-100">
                      {couponDiscountLabel(cp)}
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
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                      No coupons yet — create one to generate its ID &amp; QR.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR modal — enlarge for scanning / printing at the POS */}
      {qrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setQrModal(null)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white text-center">
              {qrModal.code}
            </h3>
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {couponDiscountLabel(qrModal)}{qrModal.minSpend ? ` · min ৳${qrModal.minSpend}` : ''}
            </p>

            <div className="mt-4 flex justify-center">
              <div className="rounded-xl bg-white p-3 border border-neutral-200 shadow-inner">
                <img src={qrModal.qrImage} alt={`QR for ${qrModal.code}`} className="w-56 h-56 object-contain" />
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Unique ID</p>
              <p className="font-mono text-sm text-neutral-700 dark:text-neutral-200">{qrModal.couponId || '—'}</p>
            </div>

            <p className="text-[11px] text-neutral-400 text-center mt-3">
              Scan at the POS to apply this coupon. The discount is verified on the server.
            </p>

            <a
              href={qrModal.qrImage}
              download={`coupon-${qrModal.code}.png`}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Download QR (PNG)
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, QrCode, Download, X, Copy, Check, Printer, User, Tag } from 'lucide-react';
import { getAllCoupons, createCoupon, deleteCoupon, couponDiscountLabel } from '../../services/couponsService';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Coupon Form States
  const [couponCategory, setCouponCategory] = useState('standard'); // 'standard' | 'printable'
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('percent'); // 'percent' | 'flat'
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponMinSpend, setCouponMinSpend] = useState('');
  
  // Printable Coupon Extra Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [couponError, setCouponError] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Modals
  const [qrModal, setQrModal] = useState(null); // coupon shown in the QR modal
  const [printModal, setPrintModal] = useState(null); // coupon shown in the Printable Card Modal
  const [copiedId, setCopiedId] = useState('');

  const printCardRef = useRef();

  const fetchCoupons = () => {
    // .catch/.finally: without them a failed request left `loading` true and
    // the page spun forever instead of showing the (empty) list.
    getAllCoupons()
      .then((data) => setCoupons(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load coupons:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');

    if (!couponDiscount) {
      setCouponError(couponType === 'flat' ? 'Please enter the discount amount (৳).' : 'Please enter the discount percentage.');
      return;
    }

    if (couponCategory === 'printable' && (!customerName.trim() || !customerPhone.trim())) {
      setCouponError('Customer Name and Phone Number are required for printable coupons.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        code: couponCode.trim(), // blank => server generates unique code
        category: couponCategory, // 'standard' or 'printable'
        discountType: couponType,
        discountPct: couponType === 'percent' ? parseInt(couponDiscount, 10) : 0,
        discountAmount: couponType === 'flat' ? parseFloat(couponDiscount) || 0 : 0,
        minSpend: parseFloat(couponMinSpend) || 0,
        customerName: couponCategory === 'printable' ? customerName.trim() : '',
        customerPhone: couponCategory === 'printable' ? customerPhone.trim() : '',
        isOneTime: true, // Force One-Time Usable
        isUsed: false,   // Initial Usage State
        isActive: true,
      };

      const created = await createCoupon(payload);

      // Clear fields
      setCouponCode('');
      setCouponDiscount('');
      setCouponMinSpend('');
      setCustomerName('');
      setCustomerPhone('');
      fetchCoupons();

      // If printable, open print modal directly
      if (couponCategory === 'printable' && created) {
        setPrintModal(created);
      }
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
      /* clipboard blocked */
    }
  };

  const handleTriggerPrint = () => {
    window.print();
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
          Generate 1-time usable coupons (Digital Code or Printable Custom Card with QR Code).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs h-fit">
          <h3 className="font-display font-extrabold text-base text-neutral-850 dark:text-white mb-4">
            Create Discount Coupon
          </h3>

          {couponError && (
            <div className="p-3 mb-4 text-xs text-red-650 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
              {couponError}
            </div>
          )}

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            {/* Coupon Category Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Coupon Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCouponCategory('standard')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    couponCategory === 'standard'
                      ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Standard Code
                </button>
                <button
                  type="button"
                  onClick={() => setCouponCategory('printable')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    couponCategory === 'printable'
                      ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Printable Card
                </button>
              </div>
            </div>

            {/* Customer Details for Printable Coupons */}
            {couponCategory === 'printable' && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                <p className="text-[11px] font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3" /> Customer Details
                </p>
                <div>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name *"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone Number *"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Coupon Code <span className="text-neutral-400 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. VIP200 — blank = auto-generate"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Discount type toggle */}
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
                        : 'bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
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
                  min="1"
                  max={couponType === 'flat' ? undefined : '100'}
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
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/10 active:scale-95 transition-all mt-4 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Generating…' : couponCategory === 'printable' ? 'Generate & Open Printable Card' : 'Generate Coupon Code'}
            </button>
          </form>
        </div>

        {/* Coupons List Table */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
          <h3 className="font-display font-extrabold text-base text-neutral-850 dark:text-white mb-4">
            Coupons List
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-950/40">
                  <th className="px-4 py-3">Code / Type</th>
                  <th className="px-4 py-3">Customer (If Printed)</th>
                  <th className="px-4 py-3">Unique ID / QR</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((cp) => (
                  <tr key={cp.id} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                    <td className="px-4 py-3.5 font-bold text-primary-500 tracking-wider">
                      <div>{cp.code}</div>
                      <span className="text-[10px] font-normal text-neutral-400 capitalize">
                        {cp.category || 'standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {cp.customerName ? (
                        <div>
                          <div className="font-semibold text-neutral-800 dark:text-neutral-200">{cp.customerName}</div>
                          <div className="text-[10px] text-neutral-400">{cp.customerPhone}</div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {cp.qrImage ? (
                          <button
                            type="button"
                            onClick={() => setQrModal(cp)}
                            title="View / print QR"
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
                    <td className="px-4 py-3.5">
                      {/* One-Time Used vs Active Status */}
                      {cp.isUsed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[9px] uppercase bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                          USED (Expired)
                        </span>
                      ) : cp.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[9px] uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Active (1-Time)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[9px] uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      {cp.category === 'printable' && (
                        <button
                          onClick={() => setPrintModal(cp)}
                          className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 transition-all"
                          title="Print Coupon Card"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}
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
                      No coupons found — create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR MODAL */}
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
              One-Time Usable Coupon. Scan at POS to redeem.
            </p>

            <a
              href={qrModal.qrImage}
              download={`coupon-${qrModal.code}.png`}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs transition-all"
            >
              <Download className="w-4 h-4" />
              Download QR (PNG)
            </a>
          </div>
        </div>
      )}

      {/* PRINTABLE CUSTOM COUPON CARD MODAL */}
      {printModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setPrintModal(null)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md p-6 relative print:p-0 print:border-none print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPrintModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Voucher Card Template */}
            <div ref={printCardRef} className="border-2 border-dashed border-primary-500 rounded-2xl p-5 bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 text-neutral-800">
              <div className="flex justify-between items-start border-b border-neutral-200 pb-3 mb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-primary-600 tracking-tight">GIFT VOUCHER</h2>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">One-Time Discount Coupon</p>
                </div>
                <span className="bg-primary-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase">
                  {couponDiscountLabel(printModal)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 items-center my-4">
                <div className="col-span-2 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold">Customer Name</span>
                    <span className="font-bold text-sm text-neutral-900">{printModal.customerName || 'Valued Customer'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold">Phone Number</span>
                    <span className="font-medium text-neutral-700">{printModal.customerPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold">Coupon Code</span>
                    <span className="font-mono font-bold text-primary-600 bg-neutral-100 px-2 py-0.5 rounded text-xs">{printModal.code}</span>
                  </div>
                  {printModal.minSpend > 0 && (
                    <div className="text-[10px] text-neutral-500 italic">
                      * Min Spend: ৳{printModal.minSpend}
                    </div>
                  )}
                </div>

                <div className="text-center flex flex-col items-center justify-center">
                  {printModal.qrImage ? (
                    <img src={printModal.qrImage} alt="QR" className="w-24 h-24 object-contain border p-1 rounded-lg bg-white" />
                  ) : (
                    <QrCode className="w-16 h-16 text-neutral-300" />
                  )}
                  <span className="font-mono text-[9px] text-neutral-400 mt-1">{printModal.couponId}</span>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-2 text-[9px] text-center text-neutral-400">
                This coupon is valid for a single transaction only. Terms &amp; Conditions apply.
              </div>
            </div>

            <div className="mt-5 flex gap-3 print:hidden">
              <button
                onClick={handleTriggerPrint}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Coupon Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
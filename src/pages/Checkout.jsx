import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Tag, Phone, MapPin, Mail, Lock, User, LogOut, ArrowRight,
  Loader2, Coins, Truck, CreditCard, Wallet, ShieldCheck, Minus, Plus,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { validateCoupon, couponDiscountAmount, couponDiscountLabel } from '../services/couponsService';
import { createOrder } from '../services/ordersService';
import { getAllRegions } from '../services/regionsService';
import { getDiscountedPrice } from '../services/foodsService';
import { getRegionDeliveryCharge } from '../services/deliveryService';
import { initPayment, MIN_ONLINE_AMOUNT } from '../services/paymentsService';

// ---------------------------------------------------------------------------
// Checkout.jsx — dedicated /checkout page (replaces the in-drawer wizard).
// Left: live order summary (items, coupon, points, delivery charge, total).
// Right: step-by-step form (account → delivery → payment).
// The server re-computes every amount; the client only sends ids/choices.
// ---------------------------------------------------------------------------
export const Checkout = () => {
  const { cart, updateCartQuantity, clearCart } = useCart();
  const { isAuthenticated, isAuthLoaded, user, login, register, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Ordering is region-based: the customer picks a delivery region (auto-picked
  // when only one region delivers, e.g. a Chattogram-only launch), then an area.
  const [regions, setRegions] = useState([]);
  const [regionId, setRegionId] = useState(null);
  const deliverableRegions = useMemo(
    () => regions.filter((r) => Array.isArray(r.deliveryZones) && r.deliveryZones.length > 0),
    [regions]
  );
  const region = regions.find((r) => r.id === regionId) || null;

  useEffect(() => {
    getAllRegions()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setRegions(arr);
        const deliverable = arr.filter((r) => Array.isArray(r.deliveryZones) && r.deliveryZones.length > 0);
        if (deliverable.length === 1) setRegionId(deliverable[0].id); // only one region delivers → auto-select
      })
      .catch(() => setRegions([]));
  }, []);

  // Auth (inline, only when logged out)
  const [authTab, setAuthTab] = useState('login');
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Delivery details
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState(''); // selected zone name; '' = Other/outside zones
  const [address, setAddress] = useState('');
  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'sslcommerz'

  // Coupon + points
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Status
  const [orderError, setOrderError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill from profile once loaded
  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      // delivery `area` is driven by the region's zones (set in the region effect), not here
      setAddress(user.address || '');
      setBillingAddress(user.address || '');
    }
  }, [user]);

  // When the region changes, default the delivery area to its first zone.
  useEffect(() => {
    if (region && Array.isArray(region.deliveryZones) && region.deliveryZones.length > 0) {
      setArea(region.deliveryZones[0].name);
    } else {
      setArea('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId, regions.length]);

  // ── Prices (region-based → base price, no per-branch adjustment) ─────────
  // The cart line's own `price` was discounted at add-time, so we price off the
  // raw base (`basePrice`) to avoid double-applying the discount.
  const unitPrice = (item) =>
    getDiscountedPrice({ ...item, price: item.basePrice ?? item.price }, undefined, item.selectedSize);
  const lineTotal = (item) => unitPrice(item) * item.quantity;
  const cartTotal = cart.reduce((sum, item) => sum + lineTotal(item), 0);

  // ── Derived money (mirrors the server) ──────────────────────────────────
  const couponDiscount = appliedCoupon ? couponDiscountAmount(cartTotal, appliedCoupon) : 0;
  const afterCoupon = cartTotal - couponDiscount;
  const availablePoints = Math.max(0, Math.floor(user?.points || 0));
  const maxRedeemablePoints = Math.max(0, Math.min(availablePoints, Math.floor(afterCoupon)));
  const pointsDiscount = redeemPoints ? maxRedeemablePoints : 0;
  const deliveryCharge = getRegionDeliveryCharge(region, area);
  const orderTotal = afterCoupon - pointsDiscount + deliveryCharge;
  // The gateway rejects totals below its configured minimum, so keep small
  // orders on cash-on-delivery instead of failing at the payment page.
  const canPayOnline = orderTotal >= MIN_ONLINE_AMOUNT;

  // If the total drops below the gateway minimum (item removed, coupon applied),
  // don't leave the customer stuck on an online method they can't use.
  useEffect(() => {
    if (!canPayOnline && paymentMethod === 'sslcommerz') setPaymentMethod('cod');
  }, [canPayOnline, paymentMethod]);
  const pointsToEarn = Math.floor(cartTotal / 100) * 5;
  const canPlaceOrder = isAuthenticated && !!regionId;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      if (authTab === 'login') {
        if (!loginEmail || !loginPassword) throw new Error('Please enter your email and password.');
        await login({ email: loginEmail, password: loginPassword });
      } else {
        if (!signupName || !signupEmail || !signupPassword) throw new Error('All registration fields are required.');
        await register({ name: signupName, email: signupEmail, password: signupPassword, role: 'user' });
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const coupon = await validateCoupon(couponInput, cartTotal);
      setAppliedCoupon(coupon);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setOrderError('');
    if (!regionId) return setOrderError('Please choose your delivery region.');
    if (!phone.trim()) return setOrderError('Delivery phone number is required.');
    if (!address.trim()) return setOrderError('Delivery address is required.');
    if (!billingSame && !billingAddress.trim()) return setOrderError('Billing address is required.');
    if (paymentMethod === 'sslcommerz' && !canPayOnline) {
      return setOrderError(`Online payment needs a total of at least ৳${MIN_ONLINE_AMOUNT}. Please switch to Cash on Delivery.`);
    }

    setIsLoading(true);
    try {
      const orderData = {
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize || null,
        })),
        regionId,
        couponCode: appliedCoupon?.code || '',
        pointsToRedeem: pointsDiscount,
        deliveryArea: area,
        deliveryAddress: address,
        deliveryPhone: phone,
        paymentMethod,
      };
      const newOrder = await createOrder(orderData);
      if (pointsDiscount > 0 && refreshUser) {
        try { await refreshUser(); } catch { /* non-fatal */ }
      }
      clearCart();

      // Online payment: hand the browser to SSLCommerz's hosted page. The server
      // settles the order from the gateway's verified callback, so we never see
      // card details. On failure the order still exists — payable from tracking.
      if (paymentMethod === 'sslcommerz') {
        try {
          const { gatewayUrl } = await initPayment(newOrder.id);
          if (gatewayUrl) {
            window.location.href = gatewayUrl;
            return;
          }
          throw new Error('The payment gateway did not return a checkout link.');
        } catch (payErr) {
          // Order is placed; only the gateway hand-off failed. Send them to
          // tracking so they can retry payment instead of losing the order.
          console.error('Payment init failed:', payErr);
          navigate(`/order-tracking/${newOrder.id}?payment=unstarted`);
          return;
        }
      }

      navigate(`/order-tracking/${newOrder.id}`);
    } catch (err) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Empty / loading states ──────────────────────────────────────────────
  if (isAuthLoaded && cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-5">
          <ShoppingBag className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-xl font-black text-neutral-800 dark:text-white">Your basket is empty</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5">Add some dishes before heading to checkout.</p>
        <Link to="/menu" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/15 transition-all">
          Browse Menu <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const fieldCls = 'w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500';
  const StepBadge = ({ n }) => (
    <span className="w-6 h-6 shrink-0 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center text-xs font-black">{n}</span>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Checkout</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Review your order and confirm delivery details.</p>
      </div>

      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">

        {/* ── ORDER SUMMARY (left on desktop, bottom on mobile) ──────────── */}
        <aside className="order-2 lg:order-1 lg:sticky lg:top-24 space-y-4">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <h2 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-primary-500" /> Order Summary
            </h2>

            {/* Delivery region — ordering is region-based (drives delivery areas + charge) */}
            <div className="mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">📍 Delivery Region</label>
              {deliverableRegions.length === 0 ? (
                <p className="text-[11px] text-amber-500 font-semibold">Online delivery isn't available yet — please check back soon.</p>
              ) : deliverableRegions.length === 1 ? (
                <div className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm font-semibold text-neutral-800 dark:text-white">
                  {deliverableRegions[0].name}
                </div>
              ) : (
                <select
                  value={regionId || ''}
                  onChange={(e) => setRegionId(Number(e.target.value))}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer ${regionId ? 'border-neutral-200 dark:border-neutral-800' : 'border-amber-400'}`}
                >
                  <option value="" disabled>Select your region…</option>
                  {deliverableRegions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
              {deliverableRegions.length > 1 && !regionId && (
                <p className="text-[10px] text-amber-500 font-semibold mt-1.5">অর্ডার করতে আগে region বাছুন</p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.cartId || item.id} className="flex gap-3 items-center">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">{item.name}</p>
                    {item.selectedSize && (
                      <span className="inline-block text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold px-1.5 py-0.5 rounded mt-0.5">{item.selectedSize}</span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg px-1 py-0.5">
                        <button onClick={() => updateCartQuantity(item.cartId || item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"><Minus className="w-3 h-3" /></button>
                        <span className="text-[11px] font-bold w-4 text-center text-neutral-800 dark:text-neutral-100">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.cartId || item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 shrink-0">৳{lineTotal(item).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-grow">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Promo code" disabled={!!appliedCoupon} className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60" />
                </div>
                {appliedCoupon ? (
                  <button type="button" onClick={() => setAppliedCoupon(null)} className="px-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 font-semibold text-xs border border-red-200 dark:border-red-500/20">Remove</button>
                ) : (
                  <button type="submit" disabled={couponLoading} className="px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 text-white font-bold text-xs">{couponLoading ? '...' : 'Apply'}</button>
                )}
              </form>
              {couponError && <p className="text-[10px] font-semibold text-red-500 mt-1 pl-1">{couponError}</p>}
              {appliedCoupon && <p className="text-[10px] font-bold text-emerald-500 mt-1 pl-1">✓ {appliedCoupon.code} applied ({couponDiscountLabel(appliedCoupon)})</p>}
            </div>

            {/* Points redeem */}
            {availablePoints > 0 && (
              <button type="button" onClick={() => setRedeemPoints((v) => !v)} disabled={maxRedeemablePoints < 1}
                className={`mt-3 w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${redeemPoints ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300'} ${maxRedeemablePoints < 1 ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${redeemPoints ? 'bg-amber-400 text-white' : 'bg-amber-500/10 text-amber-500'}`}><Coins className="w-4 h-4" /></div>
                <div className="flex-grow min-w-0">
                  <span className="block text-xs font-bold text-neutral-800 dark:text-white">{availablePoints} points available</span>
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-400">{maxRedeemablePoints < 1 ? 'Nothing left to discount' : redeemPoints ? `Redeeming ${maxRedeemablePoints} pts — ৳${maxRedeemablePoints} off` : `Tap to use (up to ৳${maxRedeemablePoints} off)`}</span>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 shrink-0 transition-colors ${redeemPoints ? 'bg-amber-400' : 'bg-neutral-300 dark:bg-neutral-700'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${redeemPoints ? 'translate-x-4' : ''}`} /></div>
              </button>
            )}

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400 text-xs"><span>Subtotal</span><span>৳{cartTotal.toFixed(2)}</span></div>
              {appliedCoupon && <div className="flex justify-between text-emerald-500 text-xs font-semibold"><span>Coupon ({appliedCoupon.code})</span><span>-৳{couponDiscount.toFixed(2)}</span></div>}
              {pointsDiscount > 0 && <div className="flex justify-between text-amber-500 text-xs font-semibold"><span>Points ({pointsDiscount} pts)</span><span>-৳{pointsDiscount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400 text-xs"><span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery ({area || 'Other'})</span><span>৳{deliveryCharge.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base text-neutral-800 dark:text-white pt-1.5 border-t border-neutral-100 dark:border-neutral-800 mt-1"><span>Total</span><span className="text-primary-500">৳{orderTotal.toFixed(2)}</span></div>
              {pointsToEarn > 0 && <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-semibold pt-0.5"><Coins className="w-3 h-3" /> You'll earn {pointsToEarn} points on delivery</div>}
            </div>

            {orderError && <div className="mt-3 p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">{orderError}</div>}

            {/* Place order */}
            <button onClick={handlePlaceOrder} disabled={isLoading || !canPlaceOrder}
              className="mt-4 w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/15 active:scale-95 transition-all">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
                : !isAuthenticated ? 'Log in to place order'
                : !regionId ? 'Select a region to continue'
                : <>{paymentMethod === 'sslcommerz' ? `Pay ৳${orderTotal.toFixed(2)} & Place Order` : 'Confirm & Place Order'} <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-neutral-400"><ShieldCheck className="w-3 h-3" /> Prices are re-verified securely on our server.</p>
          </div>
        </aside>

        {/* ── FORM (right on desktop, top on mobile) ─────────────────────── */}
        <div className="order-1 lg:order-2 space-y-4">

          {/* Step 1 — Account */}
          <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <h2 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2 mb-4"><StepBadge n={1} /> Account</h2>
            {isAuthenticated ? (
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-800 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-sm">{(user?.name || '?').charAt(0).toUpperCase()}</div>
                  <div><span className="block text-sm font-semibold text-neutral-800 dark:text-white leading-tight">{user?.name}</span><span className="block text-[11px] text-neutral-400">{user?.email}</span></div>
                </div>
                <button type="button" onClick={logout} className="flex items-center gap-1 text-[11px] text-red-500 font-bold hover:underline"><LogOut className="w-3.5 h-3.5" /> Logout</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl">
                  <button type="button" onClick={() => { setAuthTab('login'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'login' ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm' : 'text-neutral-500'}`}>Log In</button>
                  <button type="button" onClick={() => { setAuthTab('signup'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'signup' ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm' : 'text-neutral-500'}`}>Register</button>
                </div>
                {authError && <div className="p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">{authError}</div>}
                <form onSubmit={handleAuth} className="space-y-3">
                  {authTab === 'signup' && (
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="text" required value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Full name" className={fieldCls} /></div>
                  )}
                  <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="email" required value={authTab === 'login' ? loginEmail : signupEmail} onChange={(e) => authTab === 'login' ? setLoginEmail(e.target.value) : setSignupEmail(e.target.value)} placeholder="Email address" className={fieldCls} /></div>
                  <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="password" required value={authTab === 'login' ? loginPassword : signupPassword} onChange={(e) => authTab === 'login' ? setLoginPassword(e.target.value) : setSignupPassword(e.target.value)} placeholder="Password" className={fieldCls} /></div>
                  <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{authTab === 'login' ? 'Log In & Continue' : 'Create Account & Continue'}<ArrowRight className="w-4 h-4" /></>}</button>
                </form>
              </div>
            )}
          </section>

          {/* Step 2 — Delivery details (only once logged in) */}
          {isAuthenticated && (
            <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2 mb-1"><StepBadge n={2} /> Delivery Details</h2>
              {region && <p className="text-[11px] text-neutral-400 mb-4 ml-8">📍 Delivering in <span className="font-semibold text-neutral-500 dark:text-neutral-300">{region.name}</span> — charge is from your selected area</p>}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801712345678" className={fieldCls} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Delivery Area</label>
                    <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer">
                      {(region?.deliveryZones || []).map((z) => <option key={z.name} value={z.name}>{z.name} (৳{z.charge})</option>)}
                      <option value="">Other area (৳{region?.defaultDeliveryCharge ?? 100})</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Detailed Address</label>
                    <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House #, Road #, Area" className={fieldCls} /></div>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer pt-1">
                  <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500/50" /> Billing address same as delivery
                </label>
                {!billingSame && (
                  <div className="relative"><MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-400" /><textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows="2" placeholder="Billing address" className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none" /></div>
                )}
              </div>
            </section>
          )}

          {/* Step 3 — Payment (only once logged in) */}
          {isAuthenticated && (
            <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2 mb-4"><StepBadge n={3} /> Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaymentMethod('cod')} className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${paymentMethod === 'cod' ? 'border-primary-500 bg-primary-500/5 text-primary-500' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300'}`}>
                  <Wallet className="w-5 h-5" /><span className="text-xs font-bold">Cash on Delivery</span><span className="text-[9px] opacity-75">Pay at your door</span>
                </button>
                <button
                  type="button"
                  disabled={!canPayOnline}
                  onClick={() => setPaymentMethod('sslcommerz')}
                  title={canPayOnline ? 'Pay securely on SSLCommerz' : `Available on orders of ৳${MIN_ONLINE_AMOUNT} or more`}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                    !canPayOnline
                      ? 'border-neutral-200 dark:border-neutral-800 text-neutral-400 opacity-60 cursor-not-allowed'
                      : paymentMethod === 'sslcommerz'
                        ? 'border-primary-500 bg-primary-500/5 text-primary-500'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5" /><span className="text-xs font-bold">Online (SSLCommerz)</span><span className="text-[9px] opacity-75">Card, bKash, Nagad</span>
                </button>
              </div>

              {!canPayOnline && (
                <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
                  Online payment is available on orders of ৳{MIN_ONLINE_AMOUNT} or more — this order is Cash on Delivery.
                </p>
              )}

              {paymentMethod === 'sslcommerz' && canPayOnline && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mt-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl p-3 border border-neutral-200 dark:border-neutral-800">
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />
                    You'll be taken to SSLCommerz's secure page to pay by card, bKash, Nagad or bank. We never see or store your card details.
                  </p>
                </motion.div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;

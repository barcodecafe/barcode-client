import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, X, Tag, Phone, MapPin, Mail, Lock, User, LogOut, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateCoupon } from '../services/couponsService';
import { createOrder } from '../services/ordersService';

// Renders the toast notification + sidebar cart drawer.
// Mounted once in RootLayout so "Order Now" works the same from any page.
export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    notification,
    cartTotal,
    updateCartQuantity,
    clearCart,
    closeCart,
  } = useCart();

  const {
    isAuthenticated,
    user,
    login,
    register,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  // Wizard Steps: 'cart' | 'auth' | 'details'
  const [step, setStep] = useState('cart');
  const [authTab, setAuthTab] = useState('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPickArea, setSignupPickArea] = useState('Dhaka');
  const [signupAddress, setSignupAddress] = useState('');

  // Checkout Info Form State
  const [phone, setPhone] = useState('');
  const [pickArea, setPickArea] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');

  // Shipping & Billing Address & Payment States
  const [billingAddress, setBillingAddress] = useState('');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'sslcommerz'

  // SSLCommerz Gateway Form States
  const [paymentTab, setPaymentTab] = useState('card'); // 'card' | 'mobile'
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [mobileProvider, setMobileProvider] = useState('bKash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobilePin, setMobilePin] = useState('');
  
  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Status/Errors
  const [authError, setAuthError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill checkout info when user logs in
  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setPickArea(user.pickArea || 'Dhaka');
      setAddress(user.address || '');
      setBillingAddress(user.address || '');
    }
  }, [user]);

  // Reset steps on drawer close
  useEffect(() => {
    if (!isCartOpen) {
      setStep('cart');
      setAuthError('');
      setOrderError('');
      setCouponError('');
      setCouponCodeInput('');
      setAppliedCoupon(null);
      setBillingSameAsShipping(true);
      setBillingAddress('');
      setPaymentMethod('cod');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setMobileNumber('');
      setMobilePin('');
    }
  }, [isCartOpen]);

  const handleProceedToCheckout = () => {
    if (isAuthenticated) {
      setStep('details');
    } else {
      setStep('auth');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    try {
      if (authTab === 'login') {
        if (!loginEmail || !loginPassword) {
          throw new Error('Please fill in all credentials.');
        }
        await login({ email: loginEmail, password: loginPassword });
        setStep('details');
      } else {
        if (!signupName || !signupEmail || !signupPassword || !signupPhone || !signupAddress) {
          throw new Error('All registration fields are required.');
        }
        await register({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          phone: signupPhone,
          pickArea: signupPickArea,
          address: signupAddress,
          role: 'user',
        });
        setStep('details');
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
    if (!couponCodeInput.trim()) return;

    setCouponLoading(true);
    try {
      const coupon = await validateCoupon(couponCodeInput, cartTotal);
      setAppliedCoupon(coupon);
      setCouponCodeInput('');
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async (overridePaymentStatus = 'Pending', overrideTxnId = '') => {
    setOrderError('');
    if (!phone.trim()) {
      setOrderError('Phone number is required.');
      return;
    }
    if (!address.trim()) {
      setOrderError('Delivery address is required.');
      return;
    }
    if (!billingSameAsShipping && !billingAddress.trim()) {
      setOrderError('Billing address is required.');
      return;
    }

    setIsLoading(true);
    try {
      const discountVal = appliedCoupon ? (cartTotal * appliedCoupon.discountPct) / 100 : 0;
      const finalTotal = cartTotal - discountVal;

      const orderPayload = {
        user: {
          id: user?.id || 'guest',
          name: user?.name || 'Guest User',
          email: user?.email || '',
          phone,
          pickArea,
          address, // shipping address
          billingAddress: billingSameAsShipping ? address : billingAddress,
        },
        items: cart.map((item) => ({
          id: item.id,
          name: item.name + (item.selectedSize ? ` (${item.selectedSize})` : ''),
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          selectedSize: item.selectedSize || null,
        })),
        subtotal: cartTotal,
        discount: discountVal,
        couponCode: appliedCoupon?.code || '',
        total: finalTotal,
        paymentMethod: paymentMethod, // 'cod' or 'sslcommerz'
        paymentStatus: overridePaymentStatus, // 'Paid' or 'Pending'
        transactionId: overrideTxnId || '',
        branchId: Number(localStorage.getItem('selectedBranchId')) || 1,
      };

      const newOrder = await createOrder(orderPayload);
      
      // Clear Cart
      clearCart();
      closeCart();
      
      // Navigate to order tracking page
      navigate(`/order-tracking/${newOrder.id}`);
    } catch (err) {
      setOrderError(err.message || 'Failed to place order. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const couponDiscountAmount = appliedCoupon ? (cartTotal * appliedCoupon.discountPct) / 100 : 0;
  const finalOrderTotal = cartTotal - couponDiscountAmount;

  return (
    <>
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary-500" />
                  <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">
                    {step === 'cart' && 'Your Order Selection'}
                    {step === 'auth' && 'Log In / Register'}
                    {step === 'details' && 'Delivery Details'}
                    {step === 'payment' && 'SSLCommerz Gateway'}
                  </h3>
                </div>
                <button
                  onClick={closeCart}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Wizard Content (Scrollable Container) */}
              <div className="flex-grow overflow-y-auto py-4 pr-1">
                
                {/* STEP 1: CART ITEMS VIEW */}
                {step === 'cart' && (
                  <>
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500">
                        <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                        <p className="text-sm font-medium">Your basket is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div
                            key={item.cartId || item.id}
                            className="flex gap-3 items-center justify-between bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-14 h-14 rounded-lg object-cover bg-neutral-100"
                            />

                            <div className="flex-grow min-w-0">
                              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                                {item.name}
                              </h4>
                              {item.selectedSize && (
                                <span className="inline-block text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold px-1.5 py-0.5 rounded mt-0.5">
                                  Option: {item.selectedSize}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-primary-500 font-bold">
                                  ৳{item.price.toFixed(2)}
                                </span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="text-[10px] text-neutral-455 dark:text-neutral-500 line-through">
                                    ৳{item.originalPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg p-0.5">
                              <button
                                onClick={() => updateCartQuantity(item.cartId || item.id, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-semibold text-neutral-500"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold w-4 text-center text-neutral-800 dark:text-neutral-100">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(item.cartId || item.id, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-semibold text-neutral-500"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* STEP 2: LOGIN / REGISTER ACCORDION */}
                {step === 'auth' && (
                  <div className="space-y-4">
                    {/* Tabs Selector */}
                    <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => { setAuthTab('login'); setAuthError(''); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          authTab === 'login'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-xs'
                            : 'text-neutral-500 dark:text-neutral-450 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        Log In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          authTab === 'signup'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-xs'
                            : 'text-neutral-500 dark:text-neutral-450 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        Register
                      </button>
                    </div>

                    {authError && (
                      <div className="p-3 text-xs text-red-650 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        {authError}
                      </div>
                    )}

                    <form onSubmit={handleAuthSubmit} className="space-y-3.5 pt-2">
                      {authTab === 'signup' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              required
                              value={signupName}
                              onChange={(e) => setSignupName(e.target.value)}
                              placeholder="Rahat Islam"
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="email"
                            required
                            value={authTab === 'login' ? loginEmail : signupEmail}
                            onChange={(e) => authTab === 'login' ? setLoginEmail(e.target.value) : setSignupEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="password"
                            required
                            value={authTab === 'login' ? loginPassword : signupPassword}
                            onChange={(e) => authTab === 'login' ? setLoginPassword(e.target.value) : setSignupPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      {authTab === 'signup' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                              Phone Number
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                              <input
                                type="text"
                                required
                                value={signupPhone}
                                onChange={(e) => setSignupPhone(e.target.value)}
                                placeholder="+8801712345678"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                                Pick Area (Region)
                              </label>
                              <select
                                value={signupPickArea}
                                onChange={(e) => setSignupPickArea(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                              >
                                <option value="Dhaka">Dhaka</option>
                                <option value="Chattogram">Chattogram</option>
                                <option value="Cox's Bazar">Cox's Bazar</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                                Address details
                              </label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                  type="text"
                                  required
                                  value={signupAddress}
                                  onChange={(e) => setSignupAddress(e.target.value)}
                                  placeholder="House/Road info"
                                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 mt-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-primary-500/15 transition-all"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Authenticating...
                          </>
                        ) : (
                          <>
                            {authTab === 'login' ? 'Log In & Continue' : 'Create Account & Continue'}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* STEP 3: DETAILS FORM */}
                {step === 'details' && (
                  <div className="space-y-4">
                    {user && (
                      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-850 rounded-xl shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-neutral-800 dark:text-white leading-tight">{user.name}</span>
                            <span className="block text-[10px] text-neutral-400">{user.email}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { logout(); setStep('auth'); }}
                          className="flex items-center gap-1 text-[10px] text-red-500 font-bold hover:underline"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Logout
                        </button>
                      </div>
                    )}

                    {orderError && (
                      <div className="p-3 text-xs text-red-650 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        {orderError}
                      </div>
                    )}

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Delivery Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +8801712345678"
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                            Delivery Area (Region)
                          </label>
                          <select
                            value={pickArea}
                            onChange={(e) => setPickArea(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                          >
                            <option value="Dhaka">Dhaka</option>
                            <option value="Chattogram">Chattogram</option>
                            <option value="Cox's Bazar">Cox's Bazar</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                            Detailed Address
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              required
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="House #, Road #, Apartment"
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Billing Address Selection */}
                      <div className="pt-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-neutral-705 dark:text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={billingSameAsShipping}
                            onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                            className="w-4 h-4 rounded border-neutral-350 text-primary-500 focus:ring-primary-500/50"
                          />
                          Billing Address same as Shipping
                        </label>
                      </div>

                      {!billingSameAsShipping && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="overflow-hidden"
                        >
                          <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                            Billing Address (Detailed)
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                            <textarea
                              required
                              value={billingAddress}
                              onChange={(e) => setBillingAddress(e.target.value)}
                              placeholder="Billing House #, Road #, Apartment"
                              rows="2"
                              className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Payment Option Selector */}
                      <div className="border-t border-neutral-100 dark:border-neutral-850 pt-3">
                        <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cod')}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all text-center ${
                              paymentMethod === 'cod'
                                ? 'border-primary-500 bg-primary-500/5 text-primary-500 font-bold'
                                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-350 hover:border-neutral-300'
                            }`}
                          >
                            <span className="text-xs font-semibold">Cash on Delivery</span>
                            <span className="text-[9px] opacity-75 font-normal">Pay with cash at door</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('sslcommerz')}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all text-center ${
                              paymentMethod === 'sslcommerz'
                                ? 'border-primary-500 bg-primary-500/5 text-primary-500 font-bold'
                                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-350 hover:border-neutral-300'
                            }`}
                          >
                            <span className="text-xs font-semibold">Online (SSLCommerz)</span>
                            <span className="text-[9px] opacity-75 font-normal">Cards, bKash, Nagad</span>
                          </button>
                        </div>
                      </div>

                      {/* Promo Code Input */}
                      <div className="border-t border-neutral-100 dark:border-neutral-850 pt-3">
                        <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Promo Coupon Code
                        </label>
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <div className="relative flex-grow">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              value={couponCodeInput}
                              onChange={(e) => setCouponCodeInput(e.target.value)}
                              placeholder="e.g. WELCOME20"
                              disabled={appliedCoupon}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60"
                            />
                          </div>
                          {appliedCoupon ? (
                            <button
                              type="button"
                              onClick={() => setAppliedCoupon(null)}
                              className="px-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 font-semibold text-xs border border-red-200 dark:border-red-500/20"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="submit"
                              disabled={couponLoading}
                              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs active:scale-95 transition-all"
                            >
                              {couponLoading ? '...' : 'Apply'}
                            </button>
                          )}
                        </form>
                        {couponError && (
                          <span className="text-[10px] font-semibold text-red-500 mt-1 block pl-1">
                            {couponError}
                          </span>
                        )}
                        {appliedCoupon && (
                          <span className="text-[10px] font-bold text-emerald-500 mt-1 block pl-1 flex items-center gap-1">
                            ✓ Coupon "{appliedCoupon.code}" successfully applied! ({appliedCoupon.discountPct}% OFF)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: SIMULATED SSLCOMMERZ PORTAL */}
                {step === 'payment' && (
                  <div className="space-y-4">
                    <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-4">
                      {/* Header Logo */}
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-blue-600 tracking-tight uppercase">SSLCommerz</span>
                          <span className="text-[9px] text-neutral-400">Secure Online Payment Gateway</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] text-neutral-400">Total Pay</span>
                          <span className="block text-sm font-bold text-primary-500">৳{finalOrderTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Payment Tabs Selector */}
                      <div className="flex bg-neutral-200/50 dark:bg-neutral-900 p-0.5 rounded-xl text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setPaymentTab('card')}
                          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                            paymentTab === 'card' ? 'bg-white dark:bg-neutral-800 text-neutral-850 dark:text-white shadow-xs' : 'text-neutral-500'
                          }`}
                        >
                          Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentTab('mobile')}
                          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                            paymentTab === 'mobile' ? 'bg-white dark:bg-neutral-800 text-neutral-850 dark:text-white shadow-xs' : 'text-neutral-500'
                          }`}
                        >
                          Mobile Banking
                        </button>
                      </div>

                      {/* Card Payments Content */}
                      {paymentTab === 'card' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 pb-1">
                            <div className="h-7 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center justify-center bg-white dark:bg-neutral-900 text-[9px] font-extrabold text-neutral-400">VISA</div>
                            <div className="h-7 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center justify-center bg-white dark:bg-neutral-900 text-[9px] font-extrabold text-neutral-400">MasterCard</div>
                            <div className="h-7 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center justify-center bg-white dark:bg-neutral-900 text-[9px] font-extrabold text-neutral-400">AMEX</div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Card Number</label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                              placeholder="4242 4242 4242 4242"
                              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Expiry Date</label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM/YY"
                                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">CVV</label>
                              <input
                                type="password"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                placeholder="•••"
                                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mobile Banking Content */}
                      {paymentTab === 'mobile' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 pb-1">
                            <button
                              type="button"
                              onClick={() => { setMobileProvider('bKash'); setMobileNumber('01712345678'); }}
                              className={`h-7 border rounded-lg flex items-center justify-center text-[9px] font-bold transition-all ${
                                mobileProvider === 'bKash' ? 'border-pink-500 bg-pink-500/5 text-pink-500' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-400'
                              }`}
                            >
                              bKash
                            </button>
                            <button
                              type="button"
                              onClick={() => { setMobileProvider('Nagad'); setMobileNumber('01812345678'); }}
                              className={`h-7 border rounded-lg flex items-center justify-center text-[9px] font-bold transition-all ${
                                mobileProvider === 'Nagad' ? 'border-orange-500 bg-orange-500/5 text-orange-500' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-400'
                              }`}
                            >
                              Nagad
                            </button>
                            <button
                              type="button"
                              onClick={() => { setMobileProvider('Rocket'); setMobileNumber('01512345678'); }}
                              className={`h-7 border rounded-lg flex items-center justify-center text-[9px] font-bold transition-all ${
                                mobileProvider === 'Rocket' ? 'border-purple-500 bg-purple-500/5 text-purple-500' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-400'
                              }`}
                            >
                              Rocket
                            </button>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">{mobileProvider} Number</label>
                            <input
                              type="text"
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                              placeholder="017••••••••"
                              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Enter PIN</label>
                            <input
                              type="password"
                              value={mobilePin}
                              onChange={(e) => setMobilePin(e.target.value.replace(/\D/g, ''))}
                              placeholder="••••"
                              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              {cart.length > 0 && (
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-4 shrink-0">
                  <div className="space-y-1.5 text-sm">
                    {appliedCoupon && (
                      <>
                        <div className="flex justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                          <span>Subtotal Basket</span>
                          <span>৳{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-500 text-xs font-semibold">
                          <span>Discount Coupon ({appliedCoupon.code})</span>
                          <span>-৳{couponDiscountAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-bold text-base text-neutral-800 dark:text-white pt-1">
                      <span>Total Amount Due</span>
                      <span className="text-primary-500">৳{finalOrderTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    {step !== 'cart' && step !== 'payment' && (
                      <button
                        onClick={() => setStep(step === 'details' && !isAuthenticated ? 'auth' : 'cart')}
                        className="px-3 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-95 transition-all"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    {step === 'cart' ? (
                      <button
                        onClick={handleProceedToCheckout}
                        className="flex-grow py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-center shadow-lg shadow-primary-500/10 hover:shadow-primary-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : step === 'details' ? (
                      <button
                        onClick={() => {
                          if (paymentMethod === 'sslcommerz') {
                            if (!phone.trim() || !address.trim() || (!billingSameAsShipping && !billingAddress.trim())) {
                              setOrderError('Please fill out all required delivery and billing details.');
                              return;
                            }
                            setStep('payment');
                          } else {
                            handlePlaceOrder('Pending', '');
                          }
                        }}
                        disabled={isLoading}
                        className="flex-grow py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-center shadow-lg shadow-primary-500/10 hover:shadow-primary-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            {paymentMethod === 'sslcommerz' ? 'Proceed to Pay Online' : 'Confirm & Place Order'}
                            <ArrowRight className="w-4.5 h-4.5" />
                          </>
                        )}
                      </button>
                    ) : step === 'payment' ? (
                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={() => {
                            const transactionId = `txn_${Date.now()}`;
                            handlePlaceOrder('Paid', transactionId);
                          }}
                          disabled={isLoading}
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4.5 h-4.5 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              Pay Now ৳{finalOrderTotal.toFixed(2)}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setStep('details')}
                          disabled={isLoading}
                          className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850 font-semibold text-xs active:scale-95 transition-all"
                        >
                          Cancel Payment
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;

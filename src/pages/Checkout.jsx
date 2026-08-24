import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Tag,
  Phone,
  MapPin,
  Lock,
  User,
  LogOut,
  ArrowRight,
  Loader2,
  Coins,
  Truck,
  CreditCard,
  Wallet,
  ShieldCheck,
  Minus,
  Plus,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Gift,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFulfillment } from "../context/FulfillmentContext";
import {
  validateCoupon,
  couponDiscountAmount,
  couponDiscountLabel,
} from "../services/couponsService";
import { createOrder } from "../services/ordersService";
import { getAllRegions } from "../services/regionsService";
import { getAllBranches } from "../services/branchesService";
import { getRegionDeliveryCharge, checkFreeDeliveryEligibility } from "../services/deliveryService";
import { initPayment, MIN_ONLINE_AMOUNT } from "../services/paymentsService";
import { getAuthErrorMessage } from "../services/authService";
import { useSettings } from "../context/SettingsContext";
import { socket } from "../services/socket";

// ---------------------------------------------------------------------------
// Validation Constants
// ---------------------------------------------------------------------------
const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/;
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
];

export const Checkout = () => {
  const { cart, updateCartQuantity, clearCart, getCartItemLineTotal } =
    useCart();
  const {
    isAuthenticated,
    isAuthLoaded,
    user,
    login,
    register,
    logout,
    refreshUser,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Region state
  const [regions, setRegions] = useState([]);
  const [regionId, setRegionId] = useState(null);
  const deliverableRegions = useMemo(
    () =>
      regions.filter(
        (r) => Array.isArray(r.deliveryZones) && r.deliveryZones.length > 0,
      ),
    [regions],
  );
  const region = regions.find((r) => r.id === regionId) || null;

  useEffect(() => {
    getAllRegions()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setRegions(arr);
        const deliverable = arr.filter(
          (r) => Array.isArray(r.deliveryZones) && r.deliveryZones.length > 0,
        );
        if (deliverable.length === 1) setRegionId(deliverable[0].id);
      })
      .catch(() => setRegions([]));
  }, []);

  // Auth
  const [authTab, setAuthTab] = useState("login");
  const [authError, setAuthError] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Live Password & Phone Validations
  const signupPhoneValid = BD_PHONE.test(signupPhone.trim());
  const passwordChecks = PASSWORD_RULES.map((r) => ({
    label: r.label,
    passed: r.test(signupPassword),
  }));
  const passwordScore = passwordChecks.filter((c) => c.passed).length;
  const isPasswordValid = passwordScore === PASSWORD_RULES.length;
  const passwordsMatch =
    signupConfirmPassword.length > 0 &&
    signupPassword === signupConfirmPassword;

  const strengthLabel =
    passwordScore <= 2 ? "Weak" : passwordScore === 3 ? "Medium" : "Strong";
  const strengthColor =
    passwordScore <= 2
      ? "text-red-500"
      : passwordScore === 3
        ? "text-amber-500"
        : "text-green-600 dark:text-green-400";

  // Delivery details
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState("");

  // Fulfillment Mode (Home Delivery vs Self Pickup)
  const { fulfillmentMode, selectedBranch, openFulfillmentModal } = useFulfillment();
  const [orderType, setOrderType] = useState(fulfillmentMode || "delivery");
  const [branches, setBranches] = useState([]);
  const [pickupBranchId, setPickupBranchId] = useState(null);
  const [expectedPickupTime, setExpectedPickupTime] = useState("ASAP (20-30 mins)");

  useEffect(() => {
    if (fulfillmentMode === "pickup") {
      setOrderType("pickup");
      if (selectedBranch) {
        setPickupBranchId(selectedBranch.id || selectedBranch._id || null);
      }
    } else {
      setOrderType("delivery");
    }
  }, [fulfillmentMode, selectedBranch]);

  useEffect(() => {
    getAllBranches()
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.branches) ? res.branches : [];
        setBranches(list);
        if (list.length > 0 && !pickupBranchId) {
          setPickupBranchId(selectedBranch ? (selectedBranch.id || selectedBranch._id) : (list[0].id || list[0]._id));
        }
      })
      .catch(() => setBranches([]));
  }, [selectedBranch]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Coupon + points
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Status
  const [orderError, setOrderError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill from profile once loaded
  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setBillingAddress(user.address || "");
    }
  }, [user]);

  useEffect(() => {
    if (
      region &&
      Array.isArray(region.deliveryZones) &&
      region.deliveryZones.length > 0
    ) {
      setArea(region.deliveryZones[0].name);
    } else {
      setArea("");
    }
  }, [regionId, region]);

  // 🎯 BOGO Offer Text Helper Function
  const getOfferText = (offerType) => {
    if (offerType === "bogo_1g1") return "BUY 1 GET 1 FREE";
    if (offerType === "bogo_1g2") return "BUY 1 GET 2 FREE";
    if (offerType === "combo") return "SPECIAL COMBO DEAL";
    return null;
  };

  // ── Prices (BOGO & Discount Calculation) ──────────────────────────────
  const lineTotal = (item) => {
    if (typeof getCartItemLineTotal === "function") {
      return getCartItemLineTotal(item);
    }
    return (item.price || 0) * (item.quantity || 1);
  };

  const cartTotal = cart.reduce((sum, item) => sum + lineTotal(item), 0);

  // 🎯 কার্টের মূল মোট দাম, এড-অনস ও সেভিংসের আলাদা নিখুঁত হিসেব
  const overallOriginalTotal = cart.reduce((sum, item) => {
    const origUnitPrice = item.originalPrice || item.price;
    return sum + origUnitPrice * item.quantity;
  }, 0);

  const totalAddonsPrice = cart.reduce((sum, item) => {
    const itemAddons = Array.isArray(item.selectedAddons)
      ? item.selectedAddons.reduce((s, a) => s + (Number(a.price) || 0), 0)
      : 0;
    return sum + itemAddons * item.quantity;
  }, 0);

  const totalBaseDishesPrice = Math.max(0, cartTotal - totalAddonsPrice);
  const totalSavings = Math.max(0, overallOriginalTotal - cartTotal);

  // ── Derived money ──────────────────────────────────────────────────────
  const couponDiscount = appliedCoupon
    ? couponDiscountAmount(cartTotal, appliedCoupon)
    : 0;
  const afterCoupon = cartTotal - couponDiscount;
  const availablePoints = Math.max(0, Math.floor(user?.points || 0));
  const maxRedeemablePoints = Math.max(
    0,
    Math.min(availablePoints, Math.floor(afterCoupon)),
  );
  const pointsDiscount = redeemPoints ? maxRedeemablePoints : 0;
  const { settings } = useSettings();
  const isPickup = orderType === "pickup";
  const standardDeliveryCharge = isPickup ? 0 : getRegionDeliveryCharge(region, area);
  const isFreeDelivery = isPickup || checkFreeDeliveryEligibility(settings, {
    subtotal: cartTotal,
    cartItems: cart,
    area,
    region,
  });
  const deliveryCharge = (isFreeDelivery || isPickup) ? 0 : standardDeliveryCharge;
  const orderTotal = Math.max(0, afterCoupon - pointsDiscount + deliveryCharge);
  const canPayOnline = orderTotal >= MIN_ONLINE_AMOUNT;

  // 💡 Coupon Auto-Apply Handler Function
  const applyPromoCode = useCallback(
    async (codeToApply) => {
      if (!codeToApply || cartTotal <= 0) return;
      setCouponLoading(true);
      setCouponError("");

      const customerPhone =
        phone.trim() || user?.phone || searchParams.get("phone") || "";

      try {
        const coupon = await validateCoupon(
          codeToApply,
          cartTotal,
          customerPhone,
        );
        setAppliedCoupon(coupon);
        setCouponInput("");

        // Successfully applied - clear stored promo
        localStorage.removeItem("scanned_promo");

        Swal.fire({
          icon: "success",
          title: "Coupon Applied!",
          text: `Promo code "${coupon.code}" applied successfully.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        setCouponError(err.message);
        setAppliedCoupon(null);
      } finally {
        setCouponLoading(false);
      }
    },
    [cartTotal, phone, user, searchParams],
  );

  // 💡 Auto-catch Promo Code (From URL Query or LocalStorage)
  useEffect(() => {
    if (cartTotal <= 0 || appliedCoupon) return;

    const promoFromUrl = searchParams.get("promo");
    const storedPromo = localStorage.getItem("scanned_promo");
    const codeToValidate = promoFromUrl || storedPromo;

    if (codeToValidate) {
      applyPromoCode(codeToValidate.trim().toUpperCase());

      // If promo was in URL, clean up the query param
      if (promoFromUrl) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("promo");
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [cartTotal, appliedCoupon, searchParams, setSearchParams, applyPromoCode]);

  useEffect(() => {
    if (!canPayOnline && paymentMethod === "sslcommerz")
      setPaymentMethod("cod");
  }, [canPayOnline, paymentMethod]);

  const pointsToEarn = Math.floor(cartTotal / 100) * 5;
  const canPlaceOrder = isAuthenticated && !!regionId;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (authTab === "login") {
      if (!loginPhone || !loginPassword) {
        const msg = "Please enter your mobile number and password.";
        setAuthError(msg);
        Swal.fire({
          icon: "warning",
          title: "Missing Credentials",
          text: msg,
          confirmButtonColor: "#f97316",
        });
        return;
      }
      setIsLoading(true);
      try {
        await login({ phone: loginPhone, password: loginPassword });
        Swal.fire({
          icon: "success",
          title: "Logged In Successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        const errMsg = getAuthErrorMessage(err);
        setAuthError(errMsg);
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: errMsg,
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!signupName.trim()) {
        const msg = "Please enter your full name.";
        setAuthError(msg);
        Swal.fire({
          icon: "warning",
          title: "Missing Name",
          text: msg,
          confirmButtonColor: "#f97316",
        });
        return;
      }
      if (!signupPhoneValid) {
        const msg = "Please enter a valid Bangladeshi mobile number.";
        setAuthError(msg);
        Swal.fire({
          icon: "warning",
          title: "Invalid Mobile Number",
          text: msg,
          confirmButtonColor: "#f97316",
        });
        return;
      }
      if (!isPasswordValid) {
        const msg = "Please meet all the password requirements below.";
        setAuthError(msg);
        Swal.fire({
          icon: "warning",
          title: "Weak Password",
          text: msg,
          confirmButtonColor: "#f97316",
        });
        return;
      }
      if (signupPassword !== signupConfirmPassword) {
        const msg = "Passwords don't match.";
        setAuthError(msg);
        Swal.fire({
          icon: "warning",
          title: "Password Mismatch",
          text: msg,
          confirmButtonColor: "#f97316",
        });
        return;
      }

      setIsLoading(true);
      try {
        await register({
          name: signupName.trim(),
          phone: signupPhone.trim(),
          password: signupPassword,
          role: "user",
        });
        Swal.fire({
          icon: "success",
          title: "Account Created!",
          text: "Welcome to Barcode!",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        const errMsg = getAuthErrorMessage(err);
        setAuthError(errMsg);
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: errMsg,
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    if (!couponInput.trim()) return;
    await applyPromoCode(couponInput.trim().toUpperCase());
  };

  const handlePlaceOrder = async () => {
    setOrderError("");
    if (!regionId) {
      const msg = "Please choose your delivery region.";
      setOrderError(msg);
      Swal.fire({
        icon: "warning",
        title: "Region Required",
        text: msg,
        confirmButtonColor: "#f97316",
      });
      return;
    }
    if (!phone.trim()) {
      const msg = "Delivery phone number is required.";
      setOrderError(msg);
      Swal.fire({
        icon: "warning",
        title: "Phone Required",
        text: msg,
        confirmButtonColor: "#f97316",
      });
      return;
    }
    if (orderType === "delivery" && !address.trim()) {
      const msg = "Delivery address is required.";
      setOrderError(msg);
      Swal.fire({
        icon: "warning",
        title: "Address Required",
        text: msg,
        confirmButtonColor: "#f97316",
      });
      return;
    }
    if (!billingSame && !billingAddress.trim()) {
      const msg = "Billing address is required.";
      setOrderError(msg);
      Swal.fire({
        icon: "warning",
        title: "Billing Address Required",
        text: msg,
        confirmButtonColor: "#f97316",
      });
      return;
    }
    if (paymentMethod === "sslcommerz" && !canPayOnline) {
      const msg = `Online payment needs a total of at least ৳${MIN_ONLINE_AMOUNT}. Please switch to Cash on Delivery.`;
      setOrderError(msg);
      Swal.fire({
        icon: "warning",
        title: "Minimum Amount Limit",
        text: msg,
        confirmButtonColor: "#f97316",
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedBranch = branches.find((b) => String(b.id || b._id) === String(pickupBranchId));
      const orderData = {
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize || null,
          selectedAddons: Array.isArray(item.selectedAddons) ? item.selectedAddons : [],
          // 🎯 ফিক্স: ব্রাঞ্চের ফাইনাল অ্যাডজাস্টেড প্রাইস এবং ব্রাঞ্চ আইডি সঠিকভাবে ব্যাকএন্ডে পাঠানো হচ্ছে
          price: item.price,
          originalPrice: item.originalPrice || item.price,
          offerType: item.offerType || null,
          promoCode: item.promoCode || null,
          discountPct: Number(item.discountPct) || 0,
          discountAmount: Number(item.discountAmount) || 0,
          discountType: item.discountType || 'percent',
          branchId:
            item.branchId ||
            Number(localStorage.getItem("selected_branch_id")) ||
            null,
        })),
        regionId,
        couponCode: appliedCoupon?.code || "",
        pointsToRedeem: pointsDiscount,
        deliveryArea: isPickup ? (selectedBranch?.name || "Self Pickup") : area,
        deliveryAddress: isPickup ? `Self Pickup at ${selectedBranch?.name || "Selected Branch"}` : address,
        deliveryPhone: phone,
        paymentMethod,
        orderType,
        expectedPickupTime: isPickup ? expectedPickupTime : "",
        pickupBranchId: isPickup ? (pickupBranchId ? Number(pickupBranchId) : null) : null,
        pickupBranchName: isPickup ? (selectedBranch?.name || "") : "",
      };

      const orderObj = await createOrder(orderData);

      const orderId =
        orderObj?._id ||
        orderObj?.id ||
        orderObj?.data?._id ||
        orderObj?.data?.id;

      if (!orderId) {
        console.error("Failed to extract ID. Order API Response:", orderObj);
        throw new Error("Order placed, but failed to retrieve valid Order ID.");
      }

      try {
        socket.emit("create_order", orderObj);
      } catch (sErr) {
        console.error("Socket notification failed:", sErr);
      }

      if (pointsDiscount > 0 && refreshUser) {
        try {
          await refreshUser();
        } catch {
          /* non-fatal */
        }
      }

      if (paymentMethod === "sslcommerz") {
        try {
          const { gatewayUrl } = await initPayment(orderId);
          if (gatewayUrl) {
            clearCart();
            window.location.href = gatewayUrl;
            return;
          }
          throw new Error(
            "The payment gateway did not return a checkout link.",
          );
        } catch (payErr) {
          console.error("Payment init failed:", payErr);
          Swal.fire({
            icon: "error",
            title: "Payment Initialization Failed",
            text: payErr.message || "Could not redirect to payment gateway.",
            confirmButtonColor: "#ef4444",
          });
          navigate(`/order-tracking/${orderId}?payment=unstarted`, {
            replace: true,
          });
          return;
        }
      }

      await Swal.fire({
        icon: "success",
        title: "Order Placed Successfully!",
        text: "Thank you for your order. We are preparing your meal!",
        timer: 1800,
        showConfirmButton: false,
      });

      navigate(`/order-tracking/${orderId}`, { replace: true });

      setTimeout(() => {
        clearCart();
      }, 150);
    } catch (err) {
      const errMsg = err.message || "Failed to place order. Please try again.";
      setOrderError(errMsg);
      Swal.fire({
        icon: "error",
        title: "Order Placement Failed",
        text: errMsg,
        confirmButtonColor: "#ef4444",
      });
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
        <h1 className="text-xl font-black text-neutral-800 dark:text-white">
          Your basket is empty
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5">
          Add some dishes before heading to checkout.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/15 transition-all"
        >
          Browse Menu <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const fieldCls =
    "w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500";
  const StepBadge = ({ n }) => (
    <span className="w-6 h-6 shrink-0 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center text-xs font-black">
      {n}
    </span>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
          Checkout
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Review your order and confirm delivery details.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
        {/* ── ORDER SUMMARY (left) ───────────────────────────────────────── */}
        <aside className="order-2 lg:order-1 lg:sticky lg:top-24 space-y-4">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <h2 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-primary-500" /> Order Summary
            </h2>

            {/* Delivery region */}
            <div className="mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                📍 Delivery Region
              </label>
              {deliverableRegions.length === 0 ? (
                <p className="text-[11px] text-amber-500 font-semibold">
                  Online delivery isn't available yet — please check back soon.
                </p>
              ) : deliverableRegions.length === 1 ? (
                <div className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm font-semibold text-neutral-800 dark:text-white">
                  {deliverableRegions[0].name}
                </div>
              ) : (
                <select
                  value={regionId || ""}
                  onChange={(e) => setRegionId(Number(e.target.value))}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer ${regionId ? "border-neutral-200 dark:border-neutral-800" : "border-amber-400"}`}
                >
                  <option value="" disabled>
                    Select your region…
                  </option>
                  {deliverableRegions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
              {deliverableRegions.length > 1 && !regionId && (
                <p className="text-[10px] text-amber-500 font-semibold mt-1.5">
                  Please select a region before placing your order.
                </p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => {
                const offerLabel = getOfferText(item.offerType);
                const step =
                  item.offerType === "bogo_1g1"
                    ? 2
                    : item.offerType === "bogo_1g2"
                      ? 3
                      : 1;

                const itemOriginalTotal =
                  (item.originalPrice || item.price) * item.quantity;
                const itemFinalPayable = lineTotal(item);
                const itemSavings = itemOriginalTotal - itemFinalPayable;

                return (
                  <div
                    key={item.cartId || item.id}
                    className="flex gap-3 items-center"
                  >
                    <img
                      src={item.selectedVariation?.image || item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                        {item.name}
                      </p>

                      {/* BOGO Offer Badge */}
                      {offerLabel && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded mt-0.5 border border-purple-200 dark:border-purple-800/60">
                          <Gift className="w-2.5 h-2.5" />
                          {offerLabel}
                        </span>
                      )}

                      {(item.selectedSize || item.selectedVariation?.name) && (
                        <span className="inline-block text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold px-1.5 py-0.5 rounded mt-0.5 ml-1">
                          Option: {item.selectedSize || item.selectedVariation?.name}
                        </span>
                      )}

                      {Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedAddons.map((addon, aIdx) => (
                            <span
                              key={aIdx}
                              className="text-[9px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 font-semibold px-1.5 py-0.5 rounded"
                            >
                              +{addon.name} (৳{Number(addon.price).toFixed(0)})
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg px-1 py-0.5">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.cartId || item.id,
                                item.quantity - step,
                              )
                            }
                            className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-bold w-4 text-center text-neutral-800 dark:text-neutral-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.cartId || item.id,
                                item.quantity + step,
                              )
                            }
                            className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item Price Breakdown */}
                    <div className="text-right shrink-0">
                      {(offerLabel && itemSavings > 0) ||
                      (item.originalPrice &&
                        item.originalPrice > item.price) ? (
                        <>
                          <span className="block text-[10px] text-neutral-400 line-through">
                            ৳{itemOriginalTotal.toFixed(2)}
                          </span>
                          <span className="text-xs font-black text-primary-500">
                            ৳{itemFinalPayable.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                          ৳{itemFinalPayable.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-grow">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Promo code"
                    disabled={!!appliedCoupon}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60"
                  />
                </div>
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    className="px-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 font-semibold text-xs border border-red-200 dark:border-red-500/20 cursor-pointer"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 text-white font-bold text-xs cursor-pointer"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                )}
              </form>
              {couponError && (
                <p className="text-[10px] font-semibold text-red-500 mt-1 pl-1">
                  {couponError}
                </p>
              )}
              {appliedCoupon && (
                <p className="text-[10px] font-bold text-emerald-500 mt-1 pl-1">
                  ✓ {appliedCoupon.code} applied (
                  {couponDiscountLabel(appliedCoupon)})
                </p>
              )}
            </div>

            {/* Points redeem */}
            {availablePoints > 0 && (
              <button
                type="button"
                onClick={() => setRedeemPoints((v) => !v)}
                disabled={maxRedeemablePoints < 1}
                className={`mt-3 w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${redeemPoints ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10" : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300"} ${maxRedeemablePoints < 1 ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${redeemPoints ? "bg-amber-400 text-white" : "bg-amber-500/10 text-amber-500"}`}
                >
                  <Coins className="w-4 h-4" />
                </div>
                <div className="flex-grow min-w-0">
                  <span className="block text-xs font-bold text-neutral-800 dark:text-white">
                    {availablePoints} points available
                  </span>
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-400">
                    {maxRedeemablePoints < 1
                      ? "Nothing left to discount"
                      : redeemPoints
                        ? `Redeeming ${maxRedeemablePoints} pts — ৳${maxRedeemablePoints} off`
                        : `Tap to use (up to ৳${maxRedeemablePoints} off)`}
                  </span>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 shrink-0 transition-colors ${redeemPoints ? "bg-amber-400" : "bg-neutral-300 dark:bg-neutral-700"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${redeemPoints ? "translate-x-4" : ""}`}
                  />
                </div>
              </button>
            )}

            {/* 🎯 Totals Section in Checkout with Savings Badge */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-sm">
              {/* মোট সেভিংস থাকলে Green Badge দিয়ে দেখানো হবে */}
              {totalSavings > 0 && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Total Savings & Free Offers:
                  </span>
                  <span className="text-xs font-black">
                    -৳{totalSavings.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between items-center">
                  <span>Dishes Base Total</span>
                  <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                    ৳{totalBaseDishesPrice.toFixed(2)}
                  </span>
                </div>

                {totalAddonsPrice > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Extras & Add-ons</span>
                    <span className="font-mono font-bold">
                      +৳{totalAddonsPrice.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t border-neutral-100 dark:border-neutral-800/80 font-bold">
                  <span className="text-neutral-700 dark:text-neutral-300">Subtotal</span>
                  <div className="text-right">
                    {totalSavings > 0 && (
                      <span className="text-[11px] text-neutral-400 line-through mr-1.5 font-normal">
                        ৳{overallOriginalTotal.toFixed(2)}
                      </span>
                    )}
                    <span className="text-neutral-900 dark:text-neutral-100 font-extrabold">
                      ৳{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-500 text-xs font-semibold">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-৳{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-500 text-xs font-semibold">
                  <span>Points ({pointsDiscount} pts)</span>
                  <span>-৳{pointsDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Delivery ({area || "Other"})
                  {isFreeDelivery && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[9px] tracking-wider uppercase ml-1">
                      Campaign FREE
                    </span>
                  )}
                </span>
                {isFreeDelivery ? (
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="line-through text-neutral-400 font-normal">
                      ৳{standardDeliveryCharge.toFixed(2)}
                    </span>
                    <span className="text-emerald-500 font-extrabold uppercase">FREE</span>
                  </div>
                ) : (
                  <span>৳{deliveryCharge.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between font-bold text-base text-neutral-800 dark:text-white pt-1.5 border-t border-neutral-100 dark:border-neutral-800 mt-1">
                <span>Total</span>
                <span className="text-primary-500">
                  ৳{orderTotal.toFixed(2)}
                </span>
              </div>
              {pointsToEarn > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-semibold pt-0.5">
                  <Coins className="w-3 h-3" /> You'll earn {pointsToEarn}{" "}
                  points on delivery
                </div>
              )}
            </div>

            {orderError && (
              <div className="mt-3 p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                {orderError}
              </div>
            )}

            {/* Place order */}
            <button
              onClick={handlePlaceOrder}
              disabled={isLoading || !canPlaceOrder}
              className="mt-4 w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/15 active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                </>
              ) : !isAuthenticated ? (
                "Log in to place order"
              ) : !regionId ? (
                "Select a region to continue"
              ) : (
                <>
                  {paymentMethod === "sslcommerz"
                    ? `Pay ৳${orderTotal.toFixed(2)} & Place Order`
                    : "Confirm & Place Order"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-neutral-400">
              <ShieldCheck className="w-3 h-3" /> Prices are re-verified
              securely on our server.
            </p>
          </div>
        </aside>

        {/* ── FORM (right) ───────────────────────────────────────────────── */}
        <div className="order-1 lg:order-2 space-y-4">
          {/* Step 1 — Account */}
          <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <h2 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
              <StepBadge n={1} /> Account
            </h2>
            {isAuthenticated ? (
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-800 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-sm">
                    {(user?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-neutral-800 dark:text-white leading-tight">
                      {user?.name}
                    </span>
                    {user?.phone && (
                      <span className="block text-[11px] text-neutral-400">
                        {user?.phone}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 text-[11px] text-red-500 font-bold hover:underline cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("login");
                      setAuthError("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authTab === "login" ? "bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm" : "text-neutral-500"}`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("signup");
                      setAuthError("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authTab === "signup" ? "bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm" : "text-neutral-500"}`}
                  >
                    Register
                  </button>
                </div>

                {authError && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-3">
                  {authTab === "signup" ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            required
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            placeholder="Your full name"
                            className={fieldCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="tel"
                            required
                            inputMode="numeric"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="01813616130"
                            className={fieldCls}
                          />
                        </div>
                        {signupPhone.length > 0 && (
                          <p
                            className={`mt-1 text-[11px] flex items-center gap-1 ${signupPhoneValid ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
                          >
                            {signupPhoneValid ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {signupPhoneValid
                              ? "Looks good"
                              : "Enter a valid Bangladeshi mobile number"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Create a password"
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {signupPassword.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="flex gap-1 flex-1">
                                {[0, 1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                      i < passwordScore
                                        ? passwordScore <= 2
                                          ? "bg-red-400"
                                          : passwordScore === 3
                                            ? "bg-amber-400"
                                            : "bg-green-500"
                                        : "bg-neutral-200 dark:bg-neutral-800"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span
                                className={`text-[10px] font-semibold ${strengthColor}`}
                              >
                                {strengthLabel}
                              </span>
                            </div>
                            <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                              {passwordChecks.map((c) => (
                                <li
                                  key={c.label}
                                  className={`flex items-center gap-1 text-[10px] ${
                                    c.passed
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-neutral-400 dark:text-neutral-500"
                                  }`}
                                >
                                  {c.passed ? (
                                    <Check className="w-3 h-3 shrink-0" />
                                  ) : (
                                    <X className="w-3 h-3 shrink-0" />
                                  )}
                                  {c.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={signupConfirmPassword}
                            onChange={(e) =>
                              setSignupConfirmPassword(e.target.value)
                            }
                            placeholder="Re-enter password"
                            className={fieldCls}
                          />
                        </div>
                        {signupConfirmPassword.length > 0 && (
                          <p
                            className={`mt-1 text-[11px] flex items-center gap-1 ${passwordsMatch ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
                          >
                            {passwordsMatch ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {passwordsMatch
                              ? "Passwords match"
                              : "Passwords don't match"}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="tel"
                          required
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="Mobile number"
                          className={fieldCls}
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      (authTab === "signup" &&
                        (!signupName.trim() ||
                          !signupPhoneValid ||
                          !isPasswordValid ||
                          !passwordsMatch))
                    }
                    className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {authTab === "login"
                          ? "Log In & Continue"
                          : "Create Account & Continue"}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* Step 2 — Delivery / Fulfillment details */}
          {isAuthenticated && (
            <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2 mb-3">
                <StepBadge n={2} /> {orderType === "pickup" ? "Pickup & Contact Details" : "Delivery Details"}
              </h2>

              {/* Sleek Fulfillment Summary Header */}
              <div className="mb-4 p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${orderType === "pickup" ? "bg-emerald-500" : "bg-primary-500"}`}>
                    {orderType === "pickup" ? <ShoppingBag className="w-4.5 h-4.5" /> : <Truck className="w-4.5 h-4.5" />}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-neutral-900 dark:text-white block truncate">
                      {orderType === "pickup"
                        ? `🛍️ Self-Pickup (${selectedBranch?.name || pickupBranchName || "Selected Branch"})`
                        : "🚚 Home Delivery"}
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate mt-0.5">
                      {orderType === "pickup"
                        ? "Fulfillment Fee: ৳0.00 (FREE) • Collect at counter"
                        : "Standard delivery rates & regions apply"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openFulfillmentModal}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 transition-all shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+8801712345678"
                      className={fieldCls}
                    />
                  </div>
                </div>

                {orderType === "pickup" ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Select Pickup Branch Outlet
                      </label>
                      <select
                        value={pickupBranchId || ""}
                        onChange={(e) => setPickupBranchId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer font-semibold"
                      >
                        {branches.map((b) => (
                          <option key={b.id || b._id} value={b.id || b._id}>
                            {b.name} ({b.location || b.address || "Outlet"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Estimated Pickup Time
                      </label>
                      <select
                        value={expectedPickupTime}
                        onChange={(e) => setExpectedPickupTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer font-semibold"
                      >
                        <option value="ASAP (20-30 mins)">ASAP (20 - 30 minutes)</option>
                        <option value="In 30 minutes">In 30 minutes</option>
                        <option value="In 45 minutes">In 45 minutes</option>
                        <option value="In 1 hour">In 1 hour</option>
                        <option value="In 1.5 hours">In 1.5 hours</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Delivery Area
                      </label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                      >
                        {(region?.deliveryZones || []).map((z) => (
                          <option key={z.name} value={z.name}>
                            {z.name} (৳{z.charge})
                          </option>
                        ))}
                        <option value="">
                          Other area (৳{region?.defaultDeliveryCharge ?? 100})
                        </option>
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
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="House #, Road #, Area"
                          className={fieldCls}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={billingSame}
                    onChange={(e) => setBillingSame(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500/50 cursor-pointer"
                  />{" "}
                  Billing address same as delivery
                </label>
                {!billingSame && (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                    <textarea
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      rows="2"
                      placeholder="Billing address"
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Step 3 — Payment */}
          {isAuthenticated && (
            <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
                <StepBadge n={3} /> Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${paymentMethod === "cod" ? "border-primary-500 bg-primary-500/5 text-primary-500" : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300"}`}
                >
                  <Wallet className="w-5 h-5" />
                  <span className="text-xs font-bold">Cash on Delivery</span>
                  <span className="text-[9px] opacity-75">
                    Pay at your door
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!canPayOnline}
                  onClick={() => setPaymentMethod("sslcommerz")}
                  title={
                    canPayOnline
                      ? "Pay securely on SSLCommerz"
                      : `Available on orders of ৳${MIN_ONLINE_AMOUNT} or more`
                  }
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    !canPayOnline
                      ? "border-neutral-200 dark:border-neutral-800 text-neutral-400 opacity-60 cursor-not-allowed"
                      : paymentMethod === "sslcommerz"
                        ? "border-primary-500 bg-primary-500/5 text-primary-500"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-bold">Online (SSLCommerz)</span>
                  <span className="text-[9px] opacity-75">
                    Card, bKash, Nagad
                  </span>
                </button>
              </div>

              {!canPayOnline && (
                <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
                  Online payment is available on orders of ৳{MIN_ONLINE_AMOUNT}{" "}
                  or more — this order is Cash on Delivery.
                </p>
              )}

              {paymentMethod === "sslcommerz" && canPayOnline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden mt-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl p-3 border border-neutral-200 dark:border-neutral-800"
                >
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />
                    You'll be taken to SSLCommerz's secure page to pay by card,
                    bKash, Nagad or bank. We never see or store your card
                    details.
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

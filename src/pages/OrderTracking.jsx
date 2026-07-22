import { useState, useEffect, useRef } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  ArrowLeft,
  Check,
  X,
  Send,
  Bike,
  Home,
  Building,
  ChevronRight,
  ShoppingBag,
  Map,
  User,
  DollarSign,
  Calendar,
  CreditCard,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { getOrderById, addChatMessage } from "../services/ordersService";
import { useAuth } from "../context/AuthContext";

export const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // URL Parameter পড়ার জন্য searchParams যুক্ত করা হলো
  const [searchParams] = useSearchParams();
  const paymentParam = searchParams.get("payment"); // 'fail', 'cancel' ইত্যাদি রিড করবে

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [activeTab, setActiveTab] = useState("map"); // 'map' or 'details'

  // Ref for auto-scrolling chat
  const chatEndRef = useRef(null);

  // Poll order every 3 seconds to get instant updates if status is changed in admin dashboard
  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      try {
        const data = await getOrderById(id);
        if (active) {
          if (!data) {
            navigate("/", { replace: true });
            return;
          }
          setOrder(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id, navigate]);

  // Auto-scroll chat to bottom when chatHistory updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [order?.chatHistory?.length]);

  // পেমেন্ট পুনরায় চেষ্টা করার হ্যান্ডলার
  // handleRetryPayment ফাংশনটি রিপ্লেস করুন:
  const handleRetryPayment = async () => {
    try {
      setRetryLoading(true);

      const response = await fetch(`${API_BASE_URL}/payments/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      const result = await response.json();

      if (result.success && result.data?.gatewayUrl) {
        window.location.href = result.data.gatewayUrl; // SSLCommerz Gateway-তে রিডাইরেক্ট করবে
      } else {
        alert(result.message || "Failed to initialize payment gateway.");
      }
    } catch (err) {
      console.error("Retry payment error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setRetryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-neutral-500 font-medium">
          Locating your order tracker...
        </span>
      </div>
    );
  }

  // Stepper configurations
  const steps = [
    { key: "Placed", label: "Order Placed", desc: "Waiting for confirmation" },
    { key: "Accepted", label: "Accepted", desc: "Kitchen preparing soon" },
    {
      key: "Preparing",
      label: "Preparing",
      desc: "Chefs are cooking your meal",
    },
    {
      key: "Out for Delivery",
      label: "On The Way",
      desc: "Rider is out for delivery",
    },
    { key: "Delivered", label: "Delivered", desc: "Handed over successfully" },
  ];

  const getStepIndex = (status) => {
    return steps.findIndex((s) => s.key === status);
  };

  const currentStepIdx = getStepIndex(order.status);

  // Calculate rider position (t along Bezier path)
  let riderT = 0.05;
  if (order.status === "Accepted") riderT = 0.08;
  else if (order.status === "Preparing") riderT = 0.15;
  else if (order.status === "Out for Delivery") {
    riderT = 0.2 + ((Date.now() % 30000) / 30000) * 0.7;
  } else if (order.status === "Delivered") riderT = 0.95;

  const getBezierPoint = (t) => {
    const x = (1 - t) * (1 - t) * 50 + 2 * (1 - t) * t * 250 + t * t * 450;
    const y = (1 - t) * (1 - t) * 100 + 2 * (1 - t) * t * 40 + t * t * 100;
    return { x, y };
  };

  const riderPos = getBezierPoint(riderT);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      const updatedOrder = await addChatMessage(order.id, {
        sender: "customer",
        senderName: user?.name || "Customer",
        text: chatMessage.trim(),
      });
      setOrder(updatedOrder);
      setChatMessage("");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  // চেক করা হচ্ছে পেমেন্ট ফেইল বা ক্যানসেল হয়েছে কিনা
  // NOTE: the server stores paymentMethod as 'cod' / 'sslcommerz'. The old check
  // compared against the display label "Cash on Delivery", so it was true even
  // for COD orders.
  const isOnlinePayment = String(order.paymentMethod || "cod").toLowerCase() !== "cod";

  // The server now records Failed/Cancelled on the order itself, so the banner
  // still shows when the customer comes back later without a ?payment= param.
  const paymentFailed =
    order.paymentStatus === "Failed" || order.paymentStatus === "Cancelled";

  // Either the gateway hand-off never started (Checkout sends ?payment=unstarted)
  // or the customer bounced off the gateway without paying.
  const paymentIncomplete =
    isOnlinePayment &&
    order.paymentStatus === "Pending" &&
    ["fail", "cancel", "unstarted"].includes(paymentParam);

  const isPaymentFailedOrCancelled = paymentFailed || paymentIncomplete;

  // A successful payment now lands the customer straight here, so confirm it on
  // arrival. The persistent value lives in the Payment Status row further down.
  const showPaymentSuccess =
    paymentParam === "success" && order.paymentStatus === "Paid";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/menu"
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs text-primary-500 font-bold uppercase tracking-wider">
              Live Tracking Panel
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-neutral-800 dark:text-white mt-0.5">
              Track Order #{order.id.toUpperCase()}
            </h1>
          </div>
        </div>

        <div
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border font-bold text-xs uppercase tracking-wide ${
            order.status === "Rejected"
              ? "bg-red-500/10 border-red-500/20 text-red-500"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Status: {steps[currentStepIdx]?.label || order.status}</span>
        </div>
      </div>

      {/* Payment Confirmed Banner — shown on arrival from the gateway */}
      {showPaymentSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 mb-8 flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">
              Payment Successful
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-normal">
              We've received your payment. Your order is confirmed and we'll
              start preparing it shortly.
            </p>
          </div>
        </div>
      )}

      {/* Payment Failed / Cancelled Banner */}
      {order.status !== "Rejected" && isPaymentFailedOrCancelled && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">
                {order.paymentStatus === "Cancelled" || paymentParam === "cancel"
                  ? "Payment Cancelled"
                  : paymentParam === "unstarted"
                  ? "Payment Not Started"
                  : "Payment Unsuccessful"}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-normal">
                Your order is safely recorded, but payment was not completed.
                You can retry paying online right now.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRetryPayment}
              disabled={retryLoading}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-primary-500/20 disabled:opacity-50"
            >
              {retryLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span>Retry Online Payment</span>
            </button>
          </div>
        </div>
      )}

      {order.status === "Rejected" ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 rounded-2xl p-5 mb-8 flex items-center gap-4 text-red-850 dark:text-red-400">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-650 shrink-0">
            <X className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Order Rejected</h3>
            <p className="text-xs mt-1 font-light opacity-95">
              We regret to inform you that your order has been rejected. Any
              online transactions will be refunded automatically.
            </p>
          </div>
        </div>
      ) : (
        /* Stepper progress */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 mb-8 shadow-xs">
          <div className="hidden md:flex items-center justify-between relative">
            <div className="absolute top-[18px] left-[7%] right-[7%] h-[3px] bg-neutral-150 dark:bg-neutral-800 z-0 rounded-full" />
            <div
              className="absolute top-[18px] left-[7%] h-[3px] bg-gradient-to-r from-primary-500 to-emerald-500 z-0 rounded-full transition-all duration-1000"
              style={{
                width: `${(currentStepIdx / (steps.length - 1)) * 86}%`,
              }}
            />

            {steps.map((s, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;

              return (
                <div
                  key={s.key}
                  className="flex flex-col items-center text-center z-10 w-36"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 transition-all ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/10"
                        : isActive
                          ? "bg-primary-500 border-primary-400 text-white shadow-primary-500/25 ring-4 ring-primary-500/10 animate-pulse"
                          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-bold mt-2.5 block ${isActive ? "text-primary-500" : "text-neutral-850 dark:text-neutral-200"}`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light mt-0.5 line-clamp-1 max-w-[120px]">
                    {s.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile Stepper */}
          <div className="md:hidden flex flex-col gap-4 relative pl-8">
            <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-neutral-150 dark:bg-neutral-800 z-0 rounded-full" />
            <div
              className="absolute left-[15px] top-4 w-[2px] bg-primary-500 z-0 rounded-full transition-all duration-1000"
              style={{
                height: `${(currentStepIdx / (steps.length - 1)) * 88}%`,
              }}
            />

            {steps.map((s, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;

              return (
                <div key={s.key} className="flex gap-4 relative z-10">
                  <div
                    className={`absolute -left-[25px] w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm border transition-all ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/10"
                        : isActive
                          ? "bg-primary-500 border-primary-400 text-white shadow-primary-500/20 ring-2 ring-primary-500/10 animate-pulse"
                          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold ${isActive ? "text-primary-500" : "text-neutral-800 dark:text-white"}`}
                    >
                      {s.label}
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-light mt-0.5">
                      {s.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Map/Details */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Tabs Selector */}
          <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "map"
                  ? "bg-white dark:bg-neutral-850 text-neutral-850 dark:text-white shadow-xs"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              }`}
            >
              <Map className="w-4 h-4" />
              Live Route Map
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "details"
                  ? "bg-white dark:bg-neutral-850 text-neutral-850 dark:text-white shadow-xs"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Order Details
            </button>
          </div>

          <AnimatePresence>
            {activeTab === "map" ? (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col gap-5"
              >
                <div>
                  <h3 className="font-display font-bold text-base text-neutral-800 dark:text-white">
                    Active Delivery Path
                  </h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                    View the courier riding path connecting the restaurant and
                    your location in real time.
                  </p>
                </div>

                {/* SVG Map */}
                <div className="relative w-full aspect-[5/2.2] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 shadow-inner flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />

                  <svg
                    viewBox="0 0 500 160"
                    className="w-full h-full relative z-10 overflow-visible"
                  >
                    <path
                      d="M 50 100 Q 250 40 450 100"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    <path
                      d="M 50 100 Q 250 40 450 100"
                      fill="none"
                      stroke="url(#gradient-path)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="500"
                      strokeDashoffset={500 - riderT * 500}
                      className="transition-all duration-300"
                    />

                    <defs>
                      <linearGradient
                        id="gradient-path"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <filter
                        id="glow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite
                          in="SourceGraphic"
                          in2="blur"
                          operator="over"
                        />
                      </filter>
                    </defs>

                    <path
                      d="M 50 100 Q 250 40 450 100"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeDasharray="4 6"
                      className="opacity-40"
                    />

                    <g
                      transform="translate(50, 100)"
                      className="cursor-pointer"
                    >
                      <circle
                        r="12"
                        fill="#ef4444"
                        fillOpacity="0.2"
                        className="animate-ping"
                        style={{ animationDuration: "3s" }}
                      />
                      <circle r="7" fill="#ef4444" />
                      <circle r="4" fill="#ffffff" />
                      <text
                        y="-14"
                        textAnchor="middle"
                        fill="#ef4444"
                        className="text-[9px] font-extrabold uppercase tracking-wide font-sans"
                      >
                        Barcode Kitchen
                      </text>
                    </g>

                    <g transform="translate(450, 100)">
                      <circle
                        r="12"
                        fill="#10b981"
                        fillOpacity="0.2"
                        className="animate-ping"
                        style={{ animationDuration: "4s" }}
                      />
                      <circle r="7" fill="#10b981" />
                      <circle r="4" fill="#ffffff" />
                      <text
                        y="-14"
                        textAnchor="middle"
                        fill="#10b981"
                        className="text-[9px] font-extrabold uppercase tracking-wide font-sans"
                      >
                        Your House
                      </text>
                    </g>

                    <g
                      transform={`translate(${riderPos.x}, ${riderPos.y})`}
                      className="transition-transform duration-300"
                      filter="url(#glow)"
                    >
                      <circle r="16" fill="#f59e0b" className="animate-pulse" />
                      <g
                        transform="translate(-8, -8) scale(0.65)"
                        className="text-white"
                      >
                        <Bike className="w-6 h-6 stroke-[2.5]" />
                      </g>
                    </g>
                  </svg>
                </div>

                {order.riderName && order.riderAcceptStatus === "accepted" ? (
                  <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-850 rounded-2xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Bike className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs text-neutral-400">
                          Delivery Courier
                        </span>
                        <span className="block text-sm font-semibold text-neutral-800 dark:text-white truncate">
                          {order.riderName}
                        </span>
                        {order.riderPhone && (
                          <span className="block text-[11px] text-neutral-400">
                            {order.riderPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    {order.riderPhone ? (
                      <a
                        href={`tel:${order.riderPhone}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call Rider
                      </a>
                    ) : (
                      <span className="text-[11px] text-neutral-400 shrink-0">
                        No contact number
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-850 rounded-2xl">
                    <div className="w-11 h-11 rounded-full bg-neutral-500/10 text-neutral-400 flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {order.riderName
                        ? `${order.riderName} is confirming your delivery…`
                        : "Assigning a delivery rider…"}
                    </span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 shadow-sm flex flex-col gap-6"
              >
                <div>
                  <h3 className="font-display font-bold text-base text-neutral-800 dark:text-white">
                    Basket Summary
                  </h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                    Invoice items list and customer delivery address details.
                  </p>
                </div>

                {/* Items List */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-850 max-h-60 overflow-y-auto pr-1">
                  {(order.items || order.cart || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-neutral-850 dark:text-neutral-100 truncate">
                            {item.name}{" "}
                            {item.selectedSize && `(${item.selectedSize})`}
                          </span>
                          <span className="block text-[10px] text-neutral-400">
                            Qty: {item.quantity} × ৳{item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        ৳{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Address and metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-100 dark:border-neutral-850 pt-5">
                  <div className="flex gap-2.5">
                    <MapPin className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Delivery Address
                      </span>
                      <span className="block text-xs text-neutral-700 dark:text-neutral-300 font-medium mt-0.5 leading-normal">
                        {order.user?.address}, {order.user?.pickArea}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <User className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Receiver Info
                      </span>
                      <span className="block text-xs text-neutral-700 dark:text-neutral-300 font-medium mt-0.5 leading-normal">
                        {order.user?.name} ({order.user?.phone})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-neutral-100 dark:border-neutral-850 pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase">
                      {order.paymentMethod || "Cash on Delivery"}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Payment Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                        order.paymentStatus === "Paid"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : paymentFailed
                          ? "bg-red-500/10 border-red-500/20 text-red-500"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                      }`}
                    >
                      {order.paymentStatus || "Pending"}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-neutral-400 pt-1 border-t border-dashed border-neutral-100 dark:border-neutral-850">
                    <span>Subtotal Basket</span>
                    <span>৳{order.subtotal?.toFixed(2) || "0.00"}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-500 font-semibold">
                      <span>
                        Promo Discount{" "}
                        {order.couponCode ? `(${order.couponCode})` : ""}
                      </span>
                      <span>-৳{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.pointsRedeemed > 0 && (
                    <div className="flex justify-between text-xs text-amber-500 font-semibold">
                      <span>Points Redeemed ({order.pointsRedeemed} pts)</span>
                      <span>-৳{order.pointsRedeemed.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>
                      Delivery Charge{" "}
                      {order.deliveryArea ? `(${order.deliveryArea})` : ""}
                    </span>
                    <span>৳{(order.deliveryCharge || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-neutral-800 dark:text-white border-t border-dashed border-neutral-200 dark:border-neutral-850 pt-2.5">
                    <span>Total Amount</span>
                    <span className="text-primary-500">
                      ৳{order.total?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {order.pointsEarned > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-semibold pt-0.5">
                      <span>
                        🎁 You earned {order.pointsEarned} reward points on this
                        order
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Chat Console */}
        <div className="lg:col-span-5 flex flex-col h-[520px] bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                  Order Discussion
                </h3>
                <span className="block text-[9px] text-neutral-400">
                  Live feed with rider & support staff
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-neutral-250 dark:bg-neutral-800 text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
              3-Way Chat
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-neutral-50/20 dark:bg-neutral-950/10">
            {(order.chatHistory || []).map((msg, i) => {
              const isMe = msg.sender === "customer";
              const isRider = msg.sender === "rider";
              const isAdmin = msg.sender === "admin";

              let alignClass = "justify-start";
              let bubbleClass =
                "bg-white dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-100 rounded-2xl rounded-tl-none";
              let senderLabelColor = "text-neutral-550 dark:text-neutral-400";

              if (isMe) {
                alignClass = "justify-end";
                bubbleClass =
                  "bg-primary-500 text-white rounded-2xl rounded-tr-none shadow-md shadow-primary-500/10";
                senderLabelColor = "text-primary-500";
              } else if (isRider) {
                bubbleClass =
                  "bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-neutral-800 dark:text-neutral-100 rounded-2xl rounded-tl-none";
                senderLabelColor = "text-amber-600 dark:text-amber-400";
              } else if (isAdmin && msg.senderName === "System") {
                return (
                  <div key={i} className="flex justify-center my-1.5">
                    <span className="px-3 py-1 rounded-full bg-neutral-150 dark:bg-neutral-800 text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold border border-neutral-200/20">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={i} className={`flex ${alignClass}`}>
                  <div className="max-w-[85%] flex flex-col gap-1">
                    {!isMe && (
                      <span
                        className={`text-[10px] font-bold ${senderLabelColor} px-1.5`}
                      >
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={`px-3.5 py-2.5 text-xs font-normal leading-relaxed ${bubbleClass}`}
                    >
                      <p>{msg.text}</p>
                      <span
                        className={`block text-[9px] text-right mt-1 font-light ${isMe ? "text-white/60" : "text-neutral-400"}`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask for updates or send delivery instructions..."
              className="flex-grow px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={!chatMessage.trim()}
              className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all shadow-md shadow-primary-500/10 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Heart,
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Wallet,
  Coins,
  Calendar,
  Info,
  Save,
  RotateCcw,
  Truck,
  Receipt,
  Star,
  ClipboardList,
  ArrowRight,
  MessageSquarePlus,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Send,
  Check,
  Building2,
  Download,
  X,
  Copy,
  QrCode,
  Printer,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { socket } from "../services/socket";
import {
  getAllOrders,
  getActiveOrdersForUser,
} from "../services/ordersService";
import {
  getAllFoods,
  hasFoodDiscount,
  applyFoodDiscount,
} from "../services/foodsService";
import { getAllBranches } from "../services/branchesService";
import { submitFeedback, getMyFeedbacks } from "../services/feedbackService";
import { getCustomerTier, membershipIdOf } from "./admin/AdminCustomers";
import StarRatingInput from "../components/StarRatingInput";
import QRCode from "qrcode";
import html2canvas from "html2canvas-pro";

const SECTIONS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orders", label: "My Orders", icon: ShoppingBag },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "reviews", label: "Experience & Review", icon: MessageSquarePlus },
  { key: "settings", label: "Settings", icon: Settings },
];

const ACTIVE_STATUSES = ["Placed", "Accepted", "Preparing", "Out for Delivery"];

const taka = (v) => `৳${Number(v || 0).toFixed(2)}`;

const shortId = (id) =>
  `#${String(id || "")
    .replace(/^order_/, "")
    .slice(-6)
    .toUpperCase()}`;

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMonth = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const isActive = (status) => ACTIVE_STATUSES.includes(status);

const getStatusColor = (status) => {
  switch (status) {
    case "Placed":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Accepted":
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    case "Preparing":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "Out for Delivery":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "Delivered":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Rejected":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
  }
};

const paymentMethodLabel = (method) => {
  switch (method) {
    case "sslcommerz":
      return "SSLCommerz (Online)";
    case "cod":
      return "Cash on Delivery";
    default:
      return method ? String(method).toUpperCase() : "Cash on Delivery";
  }
};

const derivePaymentStatus = (order) => {
  if (order.paymentStatus) return order.paymentStatus;
  if (order.status === "Rejected") return "Cancelled";
  if (order.status === "Delivered") return "Paid";
  if (
    String(order.paymentMethod || "cod").toLowerCase() !== "cod" &&
    Boolean(order.transactionId)
  ) {
    return "Paid";
  }
  return "Pending";
};

const paymentStatusLabel = (order) => {
  const status = derivePaymentStatus(order);
  if (status !== "Pending") return status;
  const isCod = String(order.paymentMethod || "cod").toLowerCase() === "cod";
  return isCod ? "Pay on delivery" : "Awaiting payment";
};

const getPaymentStatusColor = (status) => {
  switch (status) {
    case "Paid":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Pending":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "Cancelled":
    case "Failed":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
  }
};

const StatTile = ({ icon: Icon, label, value, hint, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-5 flex items-start justify-between gap-3"
  >
    <div className="min-w-0">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
        {label}
      </p>
      <p className="font-display text-2xl font-extrabold text-neutral-800 dark:text-neutral-100 mt-1 truncate">
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1.5 truncate">
          {hint}
        </p>
      )}
    </div>
    <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </div>
  </motion.div>
);

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
      <Icon className="w-4.5 h-4.5" />
    </div>
    <div>
      <h2 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, message, cta }) => (
  <div className="text-center py-14 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
    <Icon className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
    <p className="text-neutral-600 dark:text-neutral-300 text-sm font-semibold">
      {title}
    </p>
    {message && <p className="text-neutral-400 text-xs mt-1">{message}</p>}
    {cta}
  </div>
);

const Card = ({ children, className = "", innerRef }) => (
  <div
    ref={innerRef}
    className={`bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-xs ${className}`}
  >
    {children}
  </div>
);

const getResponsiveItemsPerPage = (width) => {
  if (width < 640) return 5;        // Mobile (<640px)
  if (width < 1024) return 8;       // Tablet (640px - 1023px)
  if (width < 1536) return 10;      // Laptop/Desktop (1024px - 1535px)
  if (width < 1920) return 12;      // 2xl (1536px - 1919px)
  if (width < 2560) return 15;      // 3xl (1920px - 2559px: 1-col list)
  return 20;                        // 4xl (2560px+: 1-col list)
};

const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPageOption,
  effectiveItemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  label = "items",
  containerRef,
}) => {
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * effectiveItemsPerPage + 1;
  const endItem = Math.min(currentPage * effectiveItemsPerPage, totalItems);

  const handlePageSelect = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
    if (containerRef && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mt-6 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        <span>
          Showing <span className="font-bold text-neutral-800 dark:text-neutral-200">{startItem}–{endItem}</span> of{" "}
          <span className="font-bold text-neutral-800 dark:text-neutral-200">{totalItems}</span> {label}
        </span>

        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
          <span className="text-[11px] text-neutral-400">Per page:</span>
          <select
            value={itemsPerPageOption}
            onChange={(e) => {
              const val =
                e.target.value === "auto" || e.target.value === "all"
                  ? e.target.value
                  : Number(e.target.value);
              onItemsPerPageChange(val);
            }}
            className="bg-transparent font-bold text-neutral-800 dark:text-neutral-100 cursor-pointer focus:outline-none text-xs"
          >
            <option value="auto" className="dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">Auto (Responsive)</option>
            <option value={5} className="dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">5</option>
            <option value={8} className="dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">8</option>
            <option value={10} className="dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">10</option>
            <option value={15} className="dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">15</option>
            <option value={20} className="dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">20</option>
            <option value="all" className="dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">All ({totalItems})</option>
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageSelect(1)}
            disabled={currentPage === 1}
            title="First Page"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-neutral-700 dark:text-neutral-300"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handlePageSelect(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-neutral-700 dark:text-neutral-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-neutral-400 font-bold">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageSelect(p)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    currentPage === p
                      ? "bg-primary-500 text-white shadow-sm shadow-primary-500/30"
                      : "border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => handlePageSelect(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next Page"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-neutral-700 dark:text-neutral-300"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handlePageSelect(totalPages)}
            disabled={currentPage === totalPages}
            title="Last Page"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-neutral-700 dark:text-neutral-300"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// Profile.jsx এর ভেতর OrderCard কম্পোনেন্ট এবং রেন্ডার সেকশনে ট্র্যাক বাটনটি এভাবে আপডেট করুন:

const OrderCard = ({ order, expanded, onToggle, onRateExperience }) => {
  const active = isActive(order.status);
  const orderId = order.id || order._id; // 🎯 সঠিক আইডি পিক করার জন্য
  const isDelivered = order.status === "Delivered";

  return (
    <div className="rounded-2xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-950/20 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-neutral-800 dark:text-white">
                {shortId(orderId)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wide ${getStatusColor(order.status)}`}
              >
                {order.status || "Placed"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-400 mt-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(order.createdAt)}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span>
                {order.items?.length || 0} item
                {(order.items?.length || 0) === 1 ? "" : "s"}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                {taka(order.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={onToggle}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-primary-500/40 hover:text-primary-500 font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            Details
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>

          {/* 🎯 ট্র্যাক বাটনে সঠিক `orderId` পাস করা হলো */}
          {active && orderId && (
            <Link
              to={`/order-tracking/${orderId}`}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/10 active:scale-95 transition-all"
            >
              <Truck className="w-3.5 h-3.5" />
              Track
            </Link>
          )}

          {/* 🌟 Delivered হলে Rate Experience বাটন */}
          {isDelivered && onRateExperience && (
            <button
              onClick={() => onRateExperience(order)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              Rate Experience
            </button>
          )}
        </div>
      </div>
      {/* ...বাকি কোড... */}
    </div>
  );
};

export const Profile = () => {
  const { user, logout, isAuthLoaded, updateProfile } = useAuth();
  const { favoriteIds, toggleFavorite, isFavoritesLoaded } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const branchIdParam = searchParams.get("branchId");
  const branchNameParam = searchParams.get("branchName");

  const VALID_TABS = [
    "overview",
    "orders",
    "payments",
    "favorites",
    "reviews",
    "settings",
  ];

  const [activeSection, setActiveSection] = useState(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview"
  );

  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // 📄 Pagination States (Dynamic per device)
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState("auto");
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPerPage, setPaymentsPerPage] = useState("auto");

  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  const ordersCardRef = useRef(null);
  const paymentsCardRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    pickArea: "",
    address: "",
  });
  const [settingsNotice, setSettingsNotice] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // 🎯 Feedback & Review States
  const [feedbackForm, setFeedbackForm] = useState({
    userName: "",
    phone: "",
    email: "",
    branchId: branchIdParam || "",
    branchName: branchNameParam || "General / Online Delivery",
    foodQuality: 0,
    serviceSpeed: 0,
    staffBehavior: 0,
    likedMost: "",
    improvements: "",
    comments: "",
    heardFrom: "",
    visitAgain: "",
  });
  const [feedbackNotice, setFeedbackNotice] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        pickArea: user.pickArea || "",
        address: user.address || "",
      });
      setFeedbackForm((prev) => ({
        ...prev,
        userName: prev.userName || user.name || "",
        phone: prev.phone || user.phone || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (branchIdParam || branchNameParam) {
      const matched = branches.find(
        (b) => String(b.id || b._id) === String(branchIdParam) || b.name === branchNameParam
      );
      setFeedbackForm((prev) => ({
        ...prev,
        branchId: matched ? String(matched.id ?? matched._id) : (branchIdParam || prev.branchId),
        branchName: matched ? matched.name : (branchNameParam || prev.branchName),
      }));
    }
  }, [branches, branchIdParam, branchNameParam]);

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);

  // 🔄 Real-time order status sync via socket (e.g. when rider/admin updates status to Delivered)
  useEffect(() => {
    const handleOrderUpdate = (data) => {
      const updatedOrder = data?.order || data;
      const orderId = updatedOrder?._id || updatedOrder?.id || data?.orderId || data?.id;
      if (!orderId) return;

      setOrders((prevOrders) => {
        const exists = prevOrders.some(
          (o) => String(o.id || o._id) === String(orderId)
        );
        if (!exists) return prevOrders;

        return prevOrders.map((o) => {
          if (String(o.id || o._id) === String(orderId)) {
            const merged = { ...o, ...updatedOrder };
            if (data?.status) merged.status = data.status;
            return merged;
          }
          return o;
        });
      });
    };

    socket.on("order_status_updated", handleOrderUpdate);
    socket.on("order_updated", handleOrderUpdate);
    socket.on("rider_order_updated", handleOrderUpdate);

    return () => {
      socket.off("order_status_updated", handleOrderUpdate);
      socket.off("order_updated", handleOrderUpdate);
      socket.off("rider_order_updated", handleOrderUpdate);
    };
  }, []);

  const handleRateExperience = (ord) => {
    setActiveSection("reviews");
    let matchedBranch = null;

    // 1. If Self-Pickup order, strictly match by pickup branch ID or Name
    if (ord.pickupBranchId || ord.pickupBranchName) {
      matchedBranch = branches.find(
        (b) =>
          (ord.pickupBranchId && String(b.id || b._id) === String(ord.pickupBranchId)) ||
          (ord.pickupBranchName && b.name.trim().toLowerCase() === ord.pickupBranchName.trim().toLowerCase())
      );
    }

    // 2. If explicit branchId on order
    if (!matchedBranch && (ord.branchId || ord.branch?.id || ord.branch?._id)) {
      const bId = ord.branchId || ord.branch?.id || ord.branch?._id;
      matchedBranch = branches.find((b) => String(b.id || b._id) === String(bId));
    }

    // 3. If explicit branchName on order
    if (!matchedBranch && (ord.branchName || ord.branch?.name)) {
      const bName = ord.branchName || ord.branch?.name;
      matchedBranch = branches.find((b) => b.name.trim().toLowerCase() === bName.trim().toLowerCase());
    }

    // 4. Only for Home Delivery orders without branch, match region branch
    if (!matchedBranch && ord.orderType === "delivery" && ord.regionId) {
      matchedBranch = branches.find((b) => b.regionId === ord.regionId);
    }

    const bId = matchedBranch
      ? String(matchedBranch.id ?? matchedBranch._id)
      : (ord.pickupBranchId ? String(ord.pickupBranchId) : (ord.branchId ? String(ord.branchId) : ""));

    const bName = matchedBranch
      ? matchedBranch.name
      : (ord.pickupBranchName || ord.branchName || ord.branch?.name || "General / Online Delivery");

    setFeedbackForm((prev) => ({
      ...prev,
      branchId: bId,
      branchName: bName,
    }));
    setSearchParams({
      tab: "reviews",
      ...(bId ? { branchId: String(bId) } : {}),
      ...(bName ? { branchName: bName } : {}),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getAllOrders()
        .catch(() => getActiveOrdersForUser(user.id))
        .catch(() => []),
      getAllFoods().catch(() => []),
      getAllBranches().catch(() => []),
    ]).then(([ordersData, foodsData, branchesData]) => {
      if (cancelled) return;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setFoods(Array.isArray(foodsData) ? foodsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setLoading(false);
    });

    setLoadingFeedbacks(true);
    getMyFeedbacks(user.phone || "")
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setMyFeedbacks(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingFeedbacks(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const [profileQr, setProfileQr] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState(null);
  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);

  useEffect(() => {
    if (user) {
      const memId = membershipIdOf(user);
      const verifyUrl = `${window.location.origin}/membership/${encodeURIComponent(memId)}`;
      QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 1, width: 280 })
        .then((url) => setProfileQr(url))
        .catch(() => setProfileQr(user.membershipQr || ''));
    }
  }, [user]);

  const copyCardUrl = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCardId(text);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  const downloadSingleCard = async (targetRef, cardType) => {
    if (!targetRef.current || !user || downloadingCard) return;
    setDownloadingCard(true);
    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Membership_Card_${cardType}_${membershipIdOf(user)}.png`;
      link.click();
    } catch (err) {
      console.error('Card download failed:', err);
      alert(`Could not generate ${cardType} card image. Please try again.`);
    } finally {
      setDownloadingCard(false);
    }
  };

  // 1-Click Download BOTH Front & Back cards on a SINGLE combined image
  const downloadBothCards = async () => {
    if (!frontCardRef.current || !backCardRef.current || !user || downloadingCard) return;
    setDownloadingCard(true);
    try {
      const [canvasFront, canvasBack] = await Promise.all([
        html2canvas(frontCardRef.current, { scale: 3, useCORS: true, backgroundColor: null }),
        html2canvas(backCardRef.current, { scale: 3, useCORS: true, backgroundColor: null }),
      ]);

      const cardW = canvasFront.width;
      const cardH = canvasFront.height;
      const gap = 40;
      const padding = 30;

      // Single composite canvas with both Front & Back side-by-side
      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = cardW * 2 + gap + padding * 2;
      combinedCanvas.height = cardH + padding * 2;

      const ctx = combinedCanvas.getContext('2d');
      if (ctx) {
        // Draw Front Side
        ctx.drawImage(canvasFront, padding, padding, cardW, cardH);
        // Draw Back Side
        ctx.drawImage(canvasBack, padding + cardW + gap, padding, cardW, cardH);
      }

      const image = combinedCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Membership_Card_${membershipIdOf(user)}.png`;
      link.click();
    } catch (err) {
      console.error('Download card failed:', err);
      alert('Could not download card. Please try again.');
    } finally {
      setDownloadingCard(false);
    }
  };

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      ),
    [orders],
  );

  // 📄 Dynamic Responsive Pagination Calculations
  const responsiveItemsPerPage = useMemo(
    () => getResponsiveItemsPerPage(windowWidth),
    [windowWidth]
  );

  const effectiveOrdersPerPage = useMemo(() => {
    if (ordersPerPage === "auto") return responsiveItemsPerPage;
    if (ordersPerPage === "all") return Math.max(sortedOrders.length, 1);
    return Number(ordersPerPage) || responsiveItemsPerPage;
  }, [ordersPerPage, responsiveItemsPerPage, sortedOrders.length]);

  const totalOrdersPages = useMemo(
    () => Math.max(1, Math.ceil(sortedOrders.length / effectiveOrdersPerPage)),
    [sortedOrders.length, effectiveOrdersPerPage]
  );

  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * effectiveOrdersPerPage;
    return sortedOrders.slice(start, start + effectiveOrdersPerPage);
  }, [sortedOrders, ordersPage, effectiveOrdersPerPage]);

  const effectivePaymentsPerPage = useMemo(() => {
    if (paymentsPerPage === "auto") return responsiveItemsPerPage;
    if (paymentsPerPage === "all") return Math.max(sortedOrders.length, 1);
    return Number(paymentsPerPage) || responsiveItemsPerPage;
  }, [paymentsPerPage, responsiveItemsPerPage, sortedOrders.length]);

  const totalPaymentsPages = useMemo(
    () => Math.max(1, Math.ceil(sortedOrders.length / effectivePaymentsPerPage)),
    [sortedOrders.length, effectivePaymentsPerPage]
  );

  const paginatedPayments = useMemo(() => {
    const start = (paymentsPage - 1) * effectivePaymentsPerPage;
    return sortedOrders.slice(start, start + effectivePaymentsPerPage);
  }, [sortedOrders, paymentsPage, effectivePaymentsPerPage]);

  useEffect(() => {
    if (ordersPage > totalOrdersPages) {
      setOrdersPage(1);
    }
  }, [totalOrdersPages, ordersPage]);

  useEffect(() => {
    if (paymentsPage > totalPaymentsPages) {
      setPaymentsPage(1);
    }
  }, [totalPaymentsPages, paymentsPage]);

  const stats = useMemo(() => {
    const totalSpent = orders
      .filter((o) => o.status !== "Rejected")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return {
      totalOrders: orders.length,
      totalSpent,
      activeOrders: orders.filter((o) => isActive(o.status)).length,
    };
  }, [orders]);

  const favoriteFoods = useMemo(
    () =>
      favoriteIds.map((id) => foods.find((f) => f.id === id)).filter(Boolean),
    [favoriteIds, foods],
  );

  if (!isAuthLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const firstName = (user.name || "there").trim().split(" ")[0];

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const toggleOrder = (id) =>
    setExpandedOrderId((cur) => (cur === id ? null : id));

  const handleTabChange = (key) => {
    setActiveSection(key);
    setSearchParams(key === "overview" ? {} : { tab: key });
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setSettingsNotice(null);
    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        pickArea: form.pickArea.trim(),
        address: form.address.trim(),
      });
      setSettingsNotice({ ok: true, text: "Profile updated successfully." });
    } catch (err) {
      setSettingsNotice({
        ok: false,
        text: err.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      pickArea: user.pickArea || "",
      address: user.address || "",
    });
    setSettingsNotice(null);
  };

  const spinner = (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const renderOverview = () => {
    const active = sortedOrders.filter((o) => isActive(o.status));
    const recent = sortedOrders.slice(0, 3);
    const tier = getCustomerTier(stats.totalSpent);
    const memId = membershipIdOf(user);

    return (
      <div className="space-y-6">
        {/* 👑 Customer Membership & Tier Badge Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0">
              {tier.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                  {user.name}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${tier.color}`}>
                  {tier.icon} {tier.badge}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-2 font-mono">
                <span>Membership ID:</span>
                <span className="font-bold text-primary-400">
                  {memId}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Lifetime Spend</span>
              <span className="font-black text-sm sm:text-base text-emerald-400">{taka(stats.totalSpent)}</span>
            </div>
            {(profileQr || user.membershipQr) && (
              <button
                type="button"
                onClick={() => setShowCardModal(true)}
                className="p-1 bg-white rounded-xl shadow-md shrink-0 hover:scale-105 transition-transform cursor-pointer"
                title="Click to view Membership Card"
              >
                <img src={profileQr || user.membershipQr} alt="Membership QR" className="w-11 h-11 object-contain" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-600 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-md cursor-pointer text-xs flex items-center gap-1.5 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Membership Card</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile
            icon={ShoppingBag}
            label="Total Orders"
            value={stats.totalOrders}
            hint={`${stats.activeOrders} active`}
            delay={0}
          />
          <StatTile
            icon={Wallet}
            label="Total Spent"
            value={taka(stats.totalSpent)}
            hint="Excludes cancelled"
            delay={0.05}
          />
          <StatTile
            icon={Heart}
            label="Favorites"
            value={favoriteIds.length}
            hint="Saved dishes"
            delay={0.1}
          />
          <StatTile
            icon={Coins}
            label="Reward Points"
            value={user?.points ?? 0}
            hint="1 pt = ৳1 · redeem at checkout"
            delay={0.15}
          />
        </div>

        {active.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4.5 h-4.5 text-primary-500" />
              <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                Active Deliveries
              </h3>
            </div>
            <div className="space-y-3">
              {active.map((order) => {
                const orderId = order.id || order._id;
                return (
                  <Link
                    key={orderId}
                    to={`/order-tracking/${orderId}`}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/40 dark:bg-neutral-950/20 hover:border-primary-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-800 dark:text-white">
                            {shortId(orderId)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <span className="block text-[11px] text-neutral-400 mt-0.5">
                          {order.items?.length || 0} items • {taka(order.total)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-primary-500" />
              <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                Recent Orders
              </h3>
            </div>
            {orders.length > 0 && (
              <button
                onClick={() => handleTabChange("orders")}
                className="flex items-center gap-1 text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors cursor-pointer"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {loading ? (
            spinner
          ) : recent.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              message="Your recent orders will show up here."
              cta={
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-primary-500 text-white font-bold text-xs shadow-md shadow-primary-500/15"
                >
                  Browse Menu
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recent.map((order) => (
                <OrderCard
                  key={order.id || order._id}
                  order={order}
                  expanded={expandedOrderId === (order.id || order._id)}
                  onToggle={() => toggleOrder(order.id || order._id)}
                  onRateExperience={handleRateExperience}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderOrders = () => (
    <Card className="p-5 sm:p-6" innerRef={ordersCardRef}>
      <SectionHeading
        icon={ShoppingBag}
        title="My Orders"
        subtitle="Your complete order history and live tracking."
      />
      {loading ? (
        spinner
      ) : sortedOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          message="Browse our menu and place your first order today!"
          cta={
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-primary-500 text-white font-bold text-xs shadow-md shadow-primary-500/15"
            >
              Browse Menu
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {paginatedOrders.map((order) => (
              <OrderCard
                key={order.id || order._id}
                order={order}
                expanded={expandedOrderId === (order.id || order._id)}
                onToggle={() => toggleOrder(order.id || order._id)}
                onRateExperience={handleRateExperience}
              />
            ))}
          </div>

          <PaginationControls
            currentPage={ordersPage}
            totalPages={totalOrdersPages}
            totalItems={sortedOrders.length}
            itemsPerPageOption={ordersPerPage}
            effectiveItemsPerPage={effectiveOrdersPerPage}
            onPageChange={setOrdersPage}
            onItemsPerPageChange={(val) => {
              setOrdersPerPage(val);
              setOrdersPage(1);
            }}
            label="orders"
            containerRef={ordersCardRef}
          />
        </>
      )}
    </Card>
  );

  const renderPayments = () => {
    const paid = orders
      .filter((o) => derivePaymentStatus(o) === "Paid")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const pending = orders
      .filter((o) => derivePaymentStatus(o) === "Pending")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const failedOrders = orders.filter((o) =>
      ["Failed", "Cancelled"].includes(derivePaymentStatus(o)),
    );
    const failed = failedOrders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0,
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            icon={Wallet}
            label="Total Paid"
            value={taka(paid)}
            hint="Completed payments"
            delay={0}
          />
          <StatTile
            icon={CreditCard}
            label="Pending"
            value={taka(pending)}
            hint="Not yet paid"
            delay={0.05}
          />
          <StatTile
            icon={Receipt}
            label="Transactions"
            value={orders.length}
            hint="All time"
            delay={0.1}
          />
          {failedOrders.length > 0 && (
            <StatTile
              icon={CreditCard}
              label="Unsuccessful"
              value={taka(failed)}
              hint={`${failedOrders.length} payment${failedOrders.length === 1 ? "" : "s"} — retry from tracking`}
              delay={0.15}
            />
          )}
        </div>

        <Card className="p-5 sm:p-6" innerRef={paymentsCardRef}>
          <SectionHeading
            icon={CreditCard}
            title="Payment History"
            subtitle="Transactions derived from your orders."
          />
          {loading ? (
            spinner
          ) : sortedOrders.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              message="Payments appear here once you place an order."
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs text-left min-w-[560px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
                      <th className="px-3 py-3">Order</th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Method</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="px-3 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((order) => {
                      const payStatus = derivePaymentStatus(order);
                      const orderId = order.id || order._id;
                      return (
                        <tr
                          key={orderId}
                          className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20"
                        >
                          <td className="px-3 py-3.5 font-bold text-neutral-800 dark:text-white">
                            {shortId(orderId)}
                          </td>
                          <td className="px-3 py-3.5 text-neutral-500 dark:text-neutral-400">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-3 py-3.5 text-neutral-600 dark:text-neutral-300">
                            {paymentMethodLabel(order.paymentMethod)}
                          </td>
                          <td className="px-3 py-3.5 text-right font-bold text-primary-500">
                            {taka(order.total)}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wide ${getPaymentStatusColor(payStatus)}`}
                            >
                              {paymentStatusLabel(order)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                currentPage={paymentsPage}
                totalPages={totalPaymentsPages}
                totalItems={sortedOrders.length}
                itemsPerPageOption={paymentsPerPage}
                effectiveItemsPerPage={effectivePaymentsPerPage}
                onPageChange={setPaymentsPage}
                onItemsPerPageChange={(val) => {
                  setPaymentsPerPage(val);
                  setPaymentsPage(1);
                }}
                label="transactions"
                containerRef={paymentsCardRef}
              />
            </>
          )}
        </Card>
      </div>
    );
  };

  const renderFavorites = () => (
    <Card className="p-5 sm:p-6">
      <SectionHeading
        icon={Heart}
        title="Favorites"
        subtitle="Dishes you saved for later."
      />
      {loading || !isFavoritesLoaded ? (
        spinner
      ) : favoriteFoods.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          message="Tap the heart on any dish to save it here."
          cta={
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-primary-500 text-white font-bold text-xs shadow-md shadow-primary-500/15"
            >
              Explore Menu
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favoriteFoods.map((food) => {
            const hasDiscount = hasFoodDiscount(food);
            const discounted = applyFoodDiscount(food.price, food);
            return (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="group relative flex gap-3 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-950/20 hover:border-neutral-200 dark:hover:border-neutral-800 transition-all"
              >
                <Link
                  to={`/menu/${food.id}`}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0"
                >
                  <img
                    src={food.image}
                    alt={food.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </Link>
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      {food.category}
                    </span>
                    <Link to={`/menu/${food.id}`} className="block">
                      <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors line-clamp-1">
                        {food.name}
                      </h3>
                    </Link>
                    {food.rating !== undefined && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-primary-500 mt-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        {food.rating}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-display font-extrabold text-sm text-primary-500">
                        {taka(discounted)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[11px] text-neutral-400 line-through">
                          {taka(food.price)}
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => toggleFavorite(food.id)}
                      className="p-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-90 transition-all cursor-pointer"
                      aria-label={`Remove ${food.name} from favorites`}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const renderSettings = () => {
    const inputClass =
      "w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm";
    const labelClass =
      "block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5";

    return (
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={Settings}
            title="Profile & Settings"
            subtitle="Manage your personal details."
          />

          {settingsNotice && (
            <div
              className={`mb-5 flex items-start gap-2 p-3 rounded-xl border text-sm ${
                settingsNotice.ok
                  ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{settingsNotice.text}</span>
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pf-name" className={labelClass}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="pf-name"
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Your full name"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pf-email" className={labelClass}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="pf-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="e.g. yourname@example.com"
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  Used for order receipts and digital invoices.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="pf-phone" className={labelClass}>
                Phone Number (Membership &amp; Account ID)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="pf-phone"
                  type="tel"
                  value={user.phone || ""}
                  readOnly
                  disabled
                  className={`${inputClass} pl-10 opacity-70 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800/60`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-none">
                  Locked
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Your mobile number is permanently tied to your Loyalty Membership ID (<strong className="font-mono text-primary-600 dark:text-primary-400">{user.membershipId || "BRG-Member"}</strong>) and cannot be changed here.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pf-area" className={labelClass}>
                  Pick Area
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="pf-area"
                    type="text"
                    value={form.pickArea}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pickArea: e.target.value }))
                    }
                    placeholder="e.g. Dhaka"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="pf-address" className={labelClass}>
                  Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="pf-address"
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder="House, road, area"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-semibold text-sm active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={Info}
            title="Account"
            subtitle="Your account details."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/40 dark:bg-neutral-950/20">
              <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Account Type
              </span>
              <span className="block text-sm font-semibold text-neutral-800 dark:text-neutral-100 capitalize mt-1">
                {user.role || "user"}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/40 dark:bg-neutral-950/20">
              <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Member Since
              </span>
              <span className="block text-sm font-semibold text-neutral-800 dark:text-neutral-100 mt-1">
                {formatMonth(user.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 mt-5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 font-bold text-sm active:scale-95 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            LogOut
          </button>
        </Card>
      </div>
    );
  };

  const feedbackProgress = useMemo(() => {
    const isPhoneValid = /^(?:\+88|88)?01[3-9]\d{8}$/.test(
      (feedbackForm.phone || "").trim()
    );
    const criteria = [
      {
        id: "food",
        label: "Food Quality Rating",
        done: feedbackForm.foodQuality > 0,
      },
      {
        id: "speed",
        label: "Service Speed Rating",
        done: feedbackForm.serviceSpeed > 0,
      },
      {
        id: "staff",
        label: "Staff Behavior Rating",
        done: feedbackForm.staffBehavior > 0,
      },
      {
        id: "heard",
        label: "How You Heard About Us",
        done: Boolean(feedbackForm.heardFrom),
      },
      {
        id: "visit",
        label: "Would You Visit Again",
        done: Boolean(feedbackForm.visitAgain),
      },
      {
        id: "name",
        label: "Customer Name",
        done: Boolean((feedbackForm.userName || "").trim()),
      },
      {
        id: "phone",
        label: "Valid Phone (+88 Mandatory)",
        done: isPhoneValid,
      },
    ];

    const completed = criteria.filter((c) => c.done).length;
    const percentage = Math.round((completed / criteria.length) * 100);
    const remaining = criteria.length - completed;

    return { criteria, completed, total: criteria.length, percentage, remaining };
  }, [feedbackForm]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackNotice(null);

    if (!feedbackForm.userName.trim()) {
      setFeedbackNotice({ ok: false, text: "Please enter your full name." });
      return;
    }

    const cleanPhone = feedbackForm.phone.trim();
    if (!/^(?:\+88|88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      setFeedbackNotice({
        ok: false,
        text: "Please enter a valid Bangladeshi mobile number (e.g. +8801XXXXXXXXX or 01XXXXXXXXX).",
      });
      return;
    }

    if (
      feedbackForm.foodQuality < 1 ||
      feedbackForm.serviceSpeed < 1 ||
      feedbackForm.staffBehavior < 1
    ) {
      setFeedbackNotice({
        ok: false,
        text: "Please select ratings for Food Quality, Service Speed, and Staff Behavior.",
      });
      return;
    }

    if (!feedbackForm.heardFrom) {
      setFeedbackNotice({
        ok: false,
        text: "Please choose how you heard about us.",
      });
      return;
    }

    if (!feedbackForm.visitAgain) {
      setFeedbackNotice({
        ok: false,
        text: "Please answer if you would visit us again.",
      });
      return;
    }

    setSubmittingFeedback(true);
    try {
      const selectedBranch = branches.find(
        (b) =>
          String(b.id || b._id) === String(feedbackForm.branchId) ||
          b.name === feedbackForm.branchName
      );

      const finalBranchId = selectedBranch
        ? (selectedBranch.id ?? selectedBranch._id)
        : (feedbackForm.branchId ? Number(feedbackForm.branchId) || feedbackForm.branchId : null);

      const finalBranchName = selectedBranch
        ? selectedBranch.name
        : (feedbackForm.branchName && feedbackForm.branchName !== "General / Online Delivery"
            ? feedbackForm.branchName
            : "General / Online Delivery");

      const formattedPhone = cleanPhone.startsWith("+88")
        ? cleanPhone
        : cleanPhone.startsWith("88")
        ? `+${cleanPhone}`
        : `+88${cleanPhone}`;

      const payload = {
        userName: feedbackForm.userName.trim(),
        phone: formattedPhone,
        email: feedbackForm.email.trim(),
        branchId: finalBranchId,
        branchName: finalBranchName,
        foodQuality: Number(feedbackForm.foodQuality),
        serviceSpeed: Number(feedbackForm.serviceSpeed),
        staffBehavior: Number(feedbackForm.staffBehavior),
        likedMost: feedbackForm.likedMost.trim(),
        improvements: feedbackForm.improvements.trim(),
        comments: feedbackForm.comments.trim(),
        heardFrom: feedbackForm.heardFrom,
        visitAgain: feedbackForm.visitAgain,
      };

      const result = await submitFeedback(payload);
      setFeedbackNotice({
        ok: true,
        text: "Thank you so much! Your experience feedback has been recorded successfully.",
      });

      if (result?.data) {
        setMyFeedbacks((prev) => [result.data, ...prev]);
      }

      setFeedbackForm((prev) => ({
        ...prev,
        foodQuality: 0,
        serviceSpeed: 0,
        staffBehavior: 0,
        likedMost: "",
        improvements: "",
        comments: "",
        heardFrom: "",
        visitAgain: "",
      }));
    } catch (err) {
      setFeedbackNotice({
        ok: false,
        text: err.message || "Failed to submit feedback. Please try again.",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const renderReviews = () => {
    const inputClass =
      "w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm";
    const labelClass =
      "block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5";

    const HEARD_FROM_OPTIONS = [
      { value: "friends_family", label: "Friends & Family" },
      { value: "social_media", label: "Social Media (Facebook / Instagram / TikTok)" },
      { value: "advertisement", label: "Online Advertisements" },
      { value: "billboard", label: "Billboard / Outdoor Signage" },
      { value: "walk_in", label: "Walk-in / Passed by" },
      { value: "other", label: "Others" },
    ];

    const VISIT_AGAIN_OPTIONS = [
      { value: "definitely", label: "Definitely" },
      { value: "maybe", label: "Maybe" },
      { value: "no", label: "No / Unlikely" },
    ];

    return (
      <div className="space-y-6">
        {/* Progress Tracker Banner */}
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-white via-white to-primary-500/5 dark:from-neutral-900 dark:via-neutral-900 dark:to-primary-500/10 border border-primary-500/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <h3 className="font-display font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white">
                  Your Progress Tracker
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {feedbackProgress.remaining > 0
                  ? `${feedbackProgress.remaining} required field${feedbackProgress.remaining > 1 ? "s" : ""} left to complete your review.`
                  : "All required criteria met! Ready for submission."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-36 sm:w-48 bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-primary-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${feedbackProgress.percentage}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-sm font-black font-display text-primary-600 dark:text-primary-400 min-w-12 text-right">
                {feedbackProgress.percentage}%
              </span>
            </div>
          </div>

          {/* Real-time Checklist Chips */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            {feedbackProgress.criteria.map((c) => (
              <span
                key={c.id}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  c.done
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700"
                }`}
              >
                {c.done ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                )}
                {c.label}
              </span>
            ))}
          </div>
        </Card>

        {/* Main Review Form */}
        <Card className="p-5 sm:p-8 space-y-8">
          <SectionHeading
            icon={MessageSquarePlus}
            title="Restaurant Experience & Review"
            subtitle="Your honest feedback helps us elevate our food, service, and hospitality."
          />

          {feedbackNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2.5 p-4 rounded-2xl border text-sm ${
                feedbackNotice.ok
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium"
                  : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-medium"
              }`}
            >
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{feedbackNotice.text}</span>
            </motion.div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-8">
            {/* 1. Performance Ratings */}
            <div className="space-y-6">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white font-display flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary-500" />
                  1. Performance Ratings (1 to 5 Stars with Half-Star Options)
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Rate your satisfaction on food quality, service speed, and staff hospitality.
                </p>
              </div>

              {/* Food Quality */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Food Quality <span className="text-red-500">*</span>
                </label>
                <StarRatingInput
                  value={feedbackForm.foodQuality}
                  onChange={(val) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      foodQuality: val,
                    }))
                  }
                  size="md"
                  showLabel={true}
                />
              </div>

              {/* Service Speed */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Service Speed <span className="text-red-500">*</span>
                </label>
                <StarRatingInput
                  value={feedbackForm.serviceSpeed}
                  onChange={(val) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      serviceSpeed: val,
                    }))
                  }
                  size="md"
                  showLabel={true}
                />
              </div>

              {/* Staff Behavior */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Staff Behavior <span className="text-red-500">*</span>
                </label>
                <StarRatingInput
                  value={feedbackForm.staffBehavior}
                  onChange={(val) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      staffBehavior: val,
                    }))
                  }
                  size="md"
                  showLabel={true}
                />
              </div>
            </div>

            {/* 2. Qualitative Feedback */}
            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white font-display flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary-500" />
                  2. Qualitative Feedback
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Share what you enjoyed most and suggestions to help us improve.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  What did you like most about your visit?
                </label>
                <input
                  type="text"
                  value={feedbackForm.likedMost}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      likedMost: e.target.value,
                    }))
                  }
                  placeholder="e.g. Delicious grilled platter, cozy ambience, courteous staff..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  What can we improve?
                </label>
                <textarea
                  rows={3}
                  value={feedbackForm.improvements}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      improvements: e.target.value,
                    }))
                  }
                  placeholder="e.g. Faster beverage serving, more parking space, dessert varieties..."
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Additional Comments
                </label>
                <textarea
                  rows={2}
                  value={feedbackForm.comments}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      comments: e.target.value,
                    }))
                  }
                  placeholder="Any other thoughts you want to share with us..."
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </div>
            </div>

            {/* 3. Marketing & Customer Retention Data */}
            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white font-display flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary-500" />
                  3. Marketing & Customer Retention Data
                </h4>
              </div>

              {/* How did you hear about us */}
              <div className="space-y-2">
                <label className={labelClass}>
                  How did you hear about us? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {HEARD_FROM_OPTIONS.map((item) => {
                    const isSelected = feedbackForm.heardFrom === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setFeedbackForm((prev) => ({
                            ...prev,
                            heardFrom: item.value,
                          }))
                        }
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                            : "bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-primary-500/40 hover:text-primary-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Would you visit again */}
              <div className="space-y-2">
                <label className={labelClass}>
                  Would you visit us again? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {VISIT_AGAIN_OPTIONS.map((item) => {
                    const isSelected = feedbackForm.visitAgain === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setFeedbackForm((prev) => ({
                            ...prev,
                            visitAgain: item.value,
                          }))
                        }
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                            : "bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-primary-500/40 hover:text-primary-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Customer Contact & Branch Info */}
            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white font-display flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-500" />
                  4. Contact Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={feedbackForm.userName}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({
                        ...prev,
                        userName: e.target.value,
                      }))
                    }
                    placeholder="Full Name"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={feedbackForm.phone}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="e.g. +8801700000000"
                    className={inputClass}
                    required
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Mandatory with Bangladeshi +88 format for promotional offers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Branch Visited
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={feedbackForm.branchId}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = branches.find((b) => String(b.id || b._id) === String(val));
                        setFeedbackForm((prev) => ({
                          ...prev,
                          branchId: val,
                          branchName: matched ? matched.name : "General / Online Delivery",
                        }));
                      }}
                      className={`${inputClass} pl-10`}
                    >
                      <option value="">General / Online Delivery</option>
                      {branches.map((b) => (
                        <option key={b.id || b._id} value={b.id || b._id}>
                          {b.name} {b.location ? `(${b.location})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email Address (Optional)</label>
                  <input
                    type="email"
                    value={feedbackForm.email}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="email@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="text-xs text-neutral-400">
                <span>Progress: </span>
                <span className="font-bold text-primary-500">
                  {feedbackProgress.percentage}% Completed
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFeedbackForm({
                      userName: user.name || "",
                      phone: user.phone || "",
                      email: user.email || "",
                      branchId: "",
                      branchName: "General / Online Delivery",
                      foodQuality: 0,
                      serviceSpeed: 0,
                      staffBehavior: 0,
                      likedMost: "",
                      improvements: "",
                      comments: "",
                      heardFrom: "",
                      visitAgain: "",
                    })
                  }
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-xs transition-all cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback || feedbackProgress.percentage < 100}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {submittingFeedback ? "Submitting..." : "Submit Experience Review"}
                </button>
              </div>
            </div>
          </form>
        </Card>

        {/* 6. Past Feedback History */}
        <Card className="p-5 sm:p-6 space-y-4">
          <SectionHeading
            icon={ClipboardList}
            title="My Past Feedback History"
            subtitle="Reviews and experiences you have shared with Barcode Restaurant Group."
          />

          {loadingFeedbacks ? (
            spinner
          ) : myFeedbacks.length === 0 ? (
            <EmptyState
              icon={MessageSquarePlus}
              title="No previous reviews"
              message="When you submit your dining feedback, it will appear here for your reference."
            />
          ) : (
            <div className="space-y-3">
              {myFeedbacks.map((fb, idx) => (
                <div
                  key={fb._id || fb.id || idx}
                  className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/40 dark:bg-neutral-950/20 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 dark:text-white">
                        {fb.branchName || "General / Delivery"}
                      </span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        Submitted on: {formatDate(fb.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20 uppercase">
                        Visit Again: {fb.visitAgain}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50">
                      <span className="text-[10px] text-neutral-400 block">Food Quality</span>
                      <span className="font-bold text-neutral-800 dark:text-white">
                        {Number(fb.foodQuality) % 1 !== 0 ? Number(fb.foodQuality).toFixed(1) : fb.foodQuality} / 5
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50">
                      <span className="text-[10px] text-neutral-400 block">Service Speed</span>
                      <span className="font-bold text-neutral-800 dark:text-white">
                        {Number(fb.serviceSpeed) % 1 !== 0 ? Number(fb.serviceSpeed).toFixed(1) : fb.serviceSpeed} / 5
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50">
                      <span className="text-[10px] text-neutral-400 block">Staff Behavior</span>
                      <span className="font-bold text-neutral-800 dark:text-white">
                        {Number(fb.staffBehavior) % 1 !== 0 ? Number(fb.staffBehavior).toFixed(1) : fb.staffBehavior} / 5
                      </span>
                    </div>
                  </div>

                  {fb.likedMost && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      <strong className="text-neutral-800 dark:text-neutral-200">Liked most: </strong>
                      {fb.likedMost}
                    </p>
                  )}

                  {fb.improvements && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      <strong className="text-neutral-800 dark:text-neutral-200">Suggestions: </strong>
                      {fb.improvements}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const sectionContent = {
    overview: renderOverview,
    orders: renderOrders,
    payments: renderPayments,
    favorites: renderFavorites,
    reviews: renderReviews,
    settings: renderSettings,
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-50/50 dark:bg-neutral-950/50 transition-colors duration-300">
      {/* 🎯 Global site-container class applied */}
      <div className="site-container py-6 sm:py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-xs p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-display font-black text-2xl border border-primary-500/25 shadow-sm shrink-0">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-800 dark:text-white truncate">
              Welcome back, {firstName}!
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </span>
              <span className="text-[10px] capitalize px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-500 dark:text-neutral-400">
                {user.role || "user"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-500/30 font-semibold text-xs active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            LogOut
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar / tab nav */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-2">
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible scrollbar-none">
                {SECTIONS.map((s) => {
                  const active = activeSection === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => handleTabChange(s.key)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 lg:w-full cursor-pointer ${
                        active
                          ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                          : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <s.icon className="w-4 h-4 shrink-0" />
                      {s.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Section content */}
          <div className="min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {sectionContent[activeSection]()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* 👑 CUSTOMER MEMBERSHIP CARD MODAL */}
      <AnimatePresence>
        {showCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl max-w-4xl w-full border border-neutral-200 dark:border-neutral-800 space-y-6 my-auto"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-neutral-800 dark:text-white text-base uppercase tracking-wide flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-500" />
                    <span>Official Membership Card</span>
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCustomerTier(stats.totalSpent).color}`}>
                    {getCustomerTier(stats.totalSpent).icon} {getCustomerTier(stats.totalSpent).badge}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CARDS DISPLAY CONTAINER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center items-center p-2">
                
                {/* FRONT CARD DESIGN */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Front Side</p>
                  <div
                    ref={frontCardRef}
                    className="relative w-[340px] sm:w-[384px] h-[198px] sm:h-[224px] rounded-xl overflow-hidden shadow-xl border border-neutral-800 select-none bg-neutral-900 shrink-0"
                  >
                    <img
                      src="/card_1_front.png"
                      alt="Card Front BG"
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />

                    {/* Dynamic overlay values */}
                    <div className="relative z-10 w-full h-full p-4 flex flex-col justify-between">
                      {/* Top Right: QR Code (Positioned 8px lower as requested) */}
                      <div className="flex items-start justify-end pt-[49px] pr-4">
                        <div className="p-1 bg-white rounded-lg shadow-lg">
                          {profileQr || user.membershipQr ? (
                            <img
                              src={profileQr || user.membershipQr}
                              alt={`QR ${membershipIdOf(user)}`}
                              className="w-13 h-13 sm:w-14 sm:h-14 object-contain"
                            />
                          ) : (
                            <QrCode className="w-13 h-13 stroke-[1.5] text-neutral-800" />
                          )}
                        </div>
                      </div>

                      {/* Name & Membership ID Stacked Together on Bottom Right */}
                      <div className="flex flex-col items-end pr-4 pb-4 leading-tight">
                        <span className="block font-bold text-xs sm:text-sm tracking-wide text-white uppercase truncate max-w-[200px]">
                          {user.name}
                        </span>
                        <span className="block font-mono font-bold text-xs text-neutral-200 tracking-wider mt-0.5">
                          {membershipIdOf(user)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              {/* BACK CARD DESIGN */}
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Back Side</p>
                <div
                  ref={backCardRef}
                  className="relative w-[340px] sm:w-[384px] h-[198px] sm:h-[224px] rounded-xl overflow-hidden shadow-xl border border-neutral-800 select-none bg-neutral-900 shrink-0"
                >
                  <img
                    src="/card_2_front.png"
                    alt="Card Back BG"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

            </div>

            {/* 🎯 1-CLICK DOWNLOAD BOTH SIDES BAR */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={downloadBothCards}
                disabled={downloadingCard}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-500 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingCard ? 'Generating Cards...' : 'Download Membership Card (Front & Back)'}</span>
              </button>
            </div>

              {/* 🔗 DIRECT VERIFICATION LINK & TEST BAR */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-750 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                  <QrCode className="w-4 h-4 text-primary-500 shrink-0" />
                  <span className="text-neutral-500 dark:text-neutral-400 shrink-0 font-medium">Digital Verification Link:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate select-all">
                    {window.location.origin}/membership/{membershipIdOf(user)}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => copyCardUrl(`${window.location.origin}/membership/${membershipIdOf(user)}`)}
                    className="px-2.5 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-200 font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedCardId === `${window.location.origin}/membership/${membershipIdOf(user)}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy URL
                      </>
                    )}
                  </button>
                  <a
                    href={`/membership/${encodeURIComponent(membershipIdOf(user))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>Open Digital Pass</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Bottom Modal Actions */}
              <div className="flex gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 rounded-xl transition-all cursor-pointer text-center"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;

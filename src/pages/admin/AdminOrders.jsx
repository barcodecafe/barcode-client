import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  MessageSquare,
  Send,
  X,
  Check,
  RefreshCw,
  BellRing,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ErrorBanner } from "../../components/ErrorBanner";
import { ExportSalesModal } from "../../components/ExportSalesModal";
import {
  getAllOrders,
  getOrderMessages,
  updateOrderStatus,
  addChatMessage,
  assignRiderToOrder,
} from "../../services/ordersService";
import { recheckPayment } from "../../services/paymentsService";
import { getAllRiders } from "../../services/ridersService";
import { getAllBranches } from "../../services/branchesService";
import { getAllRegions } from "../../services/regionsService";

import invoiceHeaderImg from "../../assets/invoiceheader.png";
import invoiceFooterImg from "../../assets/invoicefooter.png";
import { socket } from "../../services/socket";

const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.orders)) return data.orders;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.result)) return data.result;
  return [];
};

const deduplicateOrders = (orderList) => {
  const cleanList = extractArray(orderList);
  if (cleanList.length === 0) return [];

  const seen = new Set();
  return cleanList.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const id = item?.id || item?._id || item?.orderId;
    if (!id) return true;
    const strId = String(id);
    if (seen.has(strId)) return false;
    seen.add(strId);
    return true;
  });
};

const formatShortOrderId = (id) => {
  if (!id) return "";
  const strId = String(id).toUpperCase();
  if (strId.length <= 10) return strId;
  return `${strId.slice(0, 4)}...${strId.slice(-5)}`;
};

export const numberToWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return "Zero Taka Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const convertGroup = (n) => {
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "") + " ";
    } else if (n > 0) {
      str += a[n] + " ";
    }
    return str;
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return "Zero Taka Only";

  let result = "";
  let n = integerPart;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  if (crore > 0) {
    result += convertGroup(crore) + "Crore ";
  }
  if (lakh > 0) {
    result += convertGroup(lakh) + "Lakh ";
  }
  if (thousand > 0) {
    result += convertGroup(thousand) + "Thousand ";
  }
  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  result = result.trim() + " Taka";

  if (decimalPart > 0) {
    result += " and " + convertGroup(decimalPart).trim() + " Paisa";
  }

  return result + " Only";
};

export const computeInvoiceItemDetails = (item) => {
  if (!item || typeof item !== "object") {
    return {
      origUnitPrice: 0,
      paidUnitPrice: 0,
      qty: 0,
      paidQty: 0,
      freeQty: 0,
      grossTotal: 0,
      lineTotal: 0,
      totalItemDiscount: 0,
      promoBadge: null,
      promoBadgeColor: "",
      isBogo1g1: false,
      isBogo1g2: false,
      isCombo: false,
    };
  }

  const qty = Number(item.quantity) || 1;
  const rawPrice = Number(item.price) || 0;
  const rawOriginalPrice = Number(item.originalPrice) || 0;
  const discountPct = Number(item.discountPct) || 0;
  const discountAmount = Number(item.discountAmount) || 0;
  const directDiscount = Number(item.discount) || 0;

  const offerType = item.offerType || (item.isBogo ? "bogo_1g1" : null) || null;
  const isBogo1g1 = offerType === "bogo_1g1";
  const isBogo1g2 = offerType === "bogo_1g2";
  const isCombo = offerType === "combo";

  // 1. Determine effective original unit price before item discount
  let origUnitPrice = rawPrice;
  if (rawOriginalPrice > 0) {
    origUnitPrice = rawOriginalPrice;
  } else if (discountPct > 0 && discountPct < 100) {
    origUnitPrice = rawPrice / (1 - discountPct / 100);
  } else if (discountAmount > 0) {
    origUnitPrice = rawPrice + discountAmount;
  } else if (directDiscount > 0 && qty > 0) {
    origUnitPrice = rawPrice + directDiscount / qty;
  }

  // 2. Determine paid unit price (after direct discount, before BOGO deduction)
  let paidUnitPrice = rawPrice;
  if (rawOriginalPrice > 0 && rawPrice < rawOriginalPrice) {
    paidUnitPrice = rawPrice;
  } else if (discountPct > 0) {
    paidUnitPrice = origUnitPrice * (1 - discountPct / 100);
  } else if (discountAmount > 0) {
    paidUnitPrice = Math.max(0, origUnitPrice - discountAmount);
  } else if (directDiscount > 0 && qty > 0) {
    paidUnitPrice = Math.max(0, origUnitPrice - directDiscount / qty);
  } else {
    paidUnitPrice = origUnitPrice;
  }

  // 3. Paid quantity for BOGO promotions
  let paidQty = qty;
  let freeQty = 0;
  if (isBogo1g1) {
    paidQty = Math.ceil(qty / 2);
    freeQty = qty - paidQty;
  } else if (isBogo1g2) {
    paidQty = Math.ceil(qty / 3);
    freeQty = qty - paidQty;
  }

  // 4. Gross Total, Net Payable (line total), and Total Item Discount
  const grossTotal = Number(origUnitPrice * qty) || 0;
  const lineTotal = Number(paidUnitPrice * paidQty) || 0;
  const totalItemDiscount = Math.max(0, grossTotal - lineTotal);

  // 5. Discount / Promotion Offer Label
  let promoBadge = null;
  let promoBadgeColor = "";
  if (isBogo1g1) {
    promoBadge = "BUY 1 GET 1 FREE";
    promoBadgeColor = "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
  } else if (isBogo1g2) {
    promoBadge = "BUY 1 GET 2 FREE";
    promoBadgeColor = "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
  } else if (isCombo) {
    promoBadge = "COMBO DEAL";
    promoBadgeColor = "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
  } else if (discountPct > 0) {
    promoBadge = `${discountPct}% OFF`;
    promoBadgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  } else if (discountAmount > 0) {
    promoBadge = `৳${discountAmount} OFF`;
    promoBadgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  } else if (rawOriginalPrice > rawPrice && rawOriginalPrice > 0) {
    const diff = rawOriginalPrice - rawPrice;
    promoBadge = `৳${diff.toFixed(0)} OFF`;
    promoBadgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  } else if (item.promoCode) {
    promoBadge = `PROMO: ${item.promoCode}`;
    promoBadgeColor = "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
  }

  return {
    origUnitPrice: Number(origUnitPrice) || 0,
    paidUnitPrice: Number(paidUnitPrice) || 0,
    qty: Number(qty) || 0,
    paidQty: Number(paidQty) || 0,
    freeQty: Number(freeQty) || 0,
    grossTotal,
    lineTotal,
    totalItemDiscount,
    promoBadge,
    promoBadgeColor,
    isBogo1g1,
    isBogo1g2,
    isCombo,
  };
};

const getItemPayableTotal = (item) => {
  return computeInvoiceItemDetails(item).lineTotal;
};

const getPaymentBadge = (ord) => {
  const pm = String(ord?.paymentMethod || "cod").toLowerCase();
  const ps = String(ord?.paymentStatus || "").toLowerCase();
  const st = String(ord?.status || ord?.deliveryStatus || "").toUpperCase();
  const isPaid = ord?.isPaid || ps === "paid";
  const isRejected = st === "REJECTED";

  if (pm === "cod") {
    if (isRejected) {
      return {
        label: "CANCELLED",
        tone: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20 font-bold",
      };
    }
    if (isPaid || st === "DELIVERED") {
      return {
        label: "PAID (COD)",
        tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold",
      };
    }
    return {
      label: "AWAITING PAYMENT",
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold",
    };
  }

  if (isRejected) {
    if (ps === "refunded") {
      return {
        label: "REFUNDED",
        tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold",
      };
    }
    return {
      label: "REFUND REQUIRED",
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-extrabold animate-pulse",
    };
  }

  if (isPaid) {
    return {
      label: "PAID",
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold",
    };
  }

  if (ps === "failed" || ps === "cancelled") {
    return {
      label: "PAYMENT FAILED",
      tone: "bg-red-500/10 text-red-500 border-red-500/20 font-bold",
    };
  }

  return {
    label: "AWAITING PAYMENT",
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold",
  };
};

const getStatusColor = (status) => {
  switch (status?.toString().toUpperCase()) {
    case "PENDING":
    case "PLACED":
    case "AWAITING PAYMENT":
    case "AWAITING_PAYMENT":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "ACCEPTED":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "REJECTED":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "PREPARING":
    case "READY TO COOK":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse";
    case "READY TO PICK":
    case "FOOD READY":
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-bounce";
    case "OUT FOR DELIVERY":
    case "ON THE WAY":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "DELIVERED":
    case "ORDER HANDOVER":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
  }
};

export const AdminOrders = () => {
  const { user: currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [recheckingOrderId, setRecheckingOrderId] = useState(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [adminChatMessage, setAdminChatMessage] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [adjustments, setAdjustments] = useState({});
  const [isExportSalesModalOpen, setIsExportSalesModalOpen] = useState(false);

  const isManager = ['manager', 'restaurant_manager'].includes(currentUser?.role);
  const managerAssignedBranches = Array.isArray(currentUser?.assignedBranches)
    ? currentUser.assignedBranches.map(Number)
    : [];

  const managedBranchNames = useMemo(() => {
    if (!isManager || managerAssignedBranches.length === 0) return '';
    return branches
      .filter((b) => managerAssignedBranches.includes(Number(b.id)))
      .map((b) => b.name)
      .join(', ');
  }, [isManager, managerAssignedBranches, branches]);

  // 🎯 Search, Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const invoiceRef = useRef(null);
  const currentChat = orders.find((o) => String(o.id || o._id) === String(activeChatOrderId));
  const chatMessagesCount = currentChat?.chatHistory?.length || 0;

  // 💬 Load full chat history when opening chat panel in admin
  useEffect(() => {
    if (!activeChatOrderId) return;
    socket.emit("join_order_room", activeChatOrderId);
    getOrderMessages(activeChatOrderId)
      .then((history) => {
        if (Array.isArray(history)) {
          setOrders((prev) =>
            prev.map((o) =>
              String(o._id || o.id) === String(activeChatOrderId)
                ? { ...o, chatHistory: history }
                : o
            )
          );
        }
      })
      .catch((err) => console.error("Failed to load chat history in Admin:", err));
  }, [activeChatOrderId]);

  const isOrderMatchingBranch = useCallback(
    (ord, branchIds) => {
      if (!ord) return false;
      const ids = (Array.isArray(branchIds) ? branchIds : [branchIds])
        .map(Number)
        .filter((n) => Number.isFinite(n));
      if (ids.length === 0) return true;

      const isPickupOrder =
        ord.orderType === "pickup" ||
        ord.deliveryArea === "Self Pickup" ||
        String(ord.user?.pickArea || "").toLowerCase().includes("self pickup") ||
        String(ord.user?.address || "").toLowerCase().includes("self pickup") ||
        String(ord.deliveryAddress || "").toLowerCase().includes("self pickup");

      const targetBranches = (branches || []).filter((b) => ids.includes(Number(b.id)));

      // ── 1. SELF-PICKUP MATCHING LOGIC (Directly bound to pickup outlet) ──
      if (isPickupOrder) {
        const pBranchId = Number(ord.pickupBranchId || ord.branchId);
        if (Number.isFinite(pBranchId) && ids.includes(pBranchId)) {
          return true;
        }

        const ordPickupName = String(ord.pickupBranchName || "").trim().toLowerCase();
        const ordPickArea = String(ord.user?.pickArea || "").trim().toLowerCase();
        const ordAddress = String(ord.user?.address || ord.deliveryAddress || "").toLowerCase();

        for (const b of targetBranches) {
          const bName = (b.name || "").trim().toLowerCase();
          if (bName) {
            if (ordPickupName && (ordPickupName === bName || ordPickupName.includes(bName) || bName.includes(ordPickupName))) {
              return true;
            }
            if (ordPickArea && (ordPickArea.includes(bName) || bName.includes(ordPickArea))) {
              return true;
            }
            if (ordAddress && ordAddress.includes(bName)) {
              return true;
            }
          }
        }
        return false;
      }

      // ── 2. DELIVERY ORDER MATCHING LOGIC (Bound to fulfilling kitchen / branch zones) ──
      const orderBranchId = Number(ord.branchId);
      if (Number.isFinite(orderBranchId) && ids.includes(orderBranchId)) {
        return true;
      }

      for (const b of targetBranches) {
        const bName = (b.name || "").trim().toLowerCase();
        if (bName) {
          const pickArea = String(ord.user?.pickArea || "").toLowerCase();
          const addr = String(ord.user?.address || "").toLowerCase();
          if (pickArea.includes(bName) || addr.includes(bName)) {
            return true;
          }
        }

        const zones = (b.deliveryZones || []).map((z) => (z.name || "").trim().toLowerCase()).filter(Boolean);
        const area = String(ord.deliveryArea || ord.user?.pickArea || "").trim().toLowerCase();
        if (area && zones.some((zn) => area.includes(zn) || zn.includes(area))) {
          return true;
        }

        if (b.regionId && Number(ord.regionId) === Number(b.regionId)) {
          return true;
        }
      }

      return false;
    },
    [branches]
  );

  const checkOrderBelongsToManager = useCallback(
    (ord) => {
      if (!isManager || managerAssignedBranches.length === 0) return true;
      return isOrderMatchingBranch(ord, managerAssignedBranches);
    },
    [isManager, managerAssignedBranches, isOrderMatchingBranch]
  );

  const applyResult = (result, setter, transform, label) => {
    if (result.status === "fulfilled") {
      const transformed = transform(result.value);
      if (label === "orders" && Array.isArray(transformed)) {
        let branchFiltered = transformed;
        if (isManager && managerAssignedBranches.length > 0) {
          branchFiltered = transformed.filter(checkOrderBelongsToManager);
        }
        setOrders((prevOrders) => {
          const prevMap = new Map(prevOrders.map((o) => [String(o._id || o.id), o]));
          return branchFiltered.map((newOrder) => {
            const key = String(newOrder._id || newOrder.id);
            const prev = prevMap.get(key);
            if (prev && Array.isArray(prev.chatHistory) && prev.chatHistory.length > 0) {
              return { ...newOrder, chatHistory: prev.chatHistory };
            }
            return newOrder;
          });
        });
      } else {
        setter(transformed);
      }
      return null;
    }
    console.error(`Failed to load ${label}:`, result.reason);
    return result.reason;
  };

  const fetchOrdersAndFleet = async () => {
    const [ordersRes, ridersRes] = await Promise.allSettled([
      getAllOrders(),
      getAllRiders(),
    ]);

    const ordersErr = applyResult(
      ordersRes,
      setOrders,
      deduplicateOrders,
      "orders",
    );
    applyResult(ridersRes, setRiders, extractArray, "riders");

    setLoadError(ordersErr);
    if (!ordersErr) window.dispatchEvent(new CustomEvent("order_updated"));

    return ordersRes.status === "fulfilled"
      ? deduplicateOrders(ordersRes.value)
      : null;
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [ordersRes, ridersRes, branchesRes, regionsRes] =
        await Promise.allSettled([
          getAllOrders(),
          getAllRiders(),
          getAllBranches(),
          getAllRegions(),
        ]);
      if (cancelled) return;

      const ordersErr = applyResult(
        ordersRes,
        setOrders,
        deduplicateOrders,
        "orders",
      );
      applyResult(ridersRes, setRiders, extractArray, "riders");
      applyResult(branchesRes, setBranches, extractArray, "branches");
      applyResult(regionsRes, setRegions, extractArray, "regions");

      setLoadError(ordersErr);
      if (!ordersErr) window.dispatchEvent(new CustomEvent("order_updated"));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleNewOrderIncoming = (data) => {
      const newOrder = data?.order || data;
      if (!newOrder || typeof newOrder !== "object") return;
      const newId = String(newOrder.id || newOrder._id || newOrder.orderId || "");
      if (!newId) return;

      // 🔒 Restaurant Manager Scoping: Only process new orders matching manager assigned branches
      if (isManager && managerAssignedBranches.length > 0) {
        if (!checkOrderBelongsToManager(newOrder)) {
          return;
        }
      }

      setOrders((prev) => {
        const exists = prev.some((o) => String(o?.id || o?._id || o?.orderId) === newId);
        if (exists) {
          return prev.map((o) =>
            String(o?.id || o?._id || o?.orderId) === newId ? { ...o, ...newOrder } : o,
          );
        }
        return [newOrder, ...prev];
      });
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId: newId },
        }),
      );
    };

    const handleOrderUpdated = (data) => {
      const updatedOrder = data?.order || data;
      if (!updatedOrder || typeof updatedOrder !== "object") return;
      const updatedId = String(
        updatedOrder.id || updatedOrder._id || updatedOrder.orderId || data?.orderId || "",
      );
      if (!updatedId) return;

      setOrders((prev) =>
        prev.map((o) => {
          if (String(o?.id || o?._id || o?.orderId) === updatedId) {
            return { ...o, ...updatedOrder };
          }
          return o;
        }),
      );

      setSelectedOrderDetails((prev) => {
        if (!prev) return prev;
        const prevId = String(prev.id || prev._id || prev.orderId || "");
        return prevId === updatedId ? { ...prev, ...updatedOrder } : prev;
      });

      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId: updatedId, id: updatedId },
        }),
      );
    };

    const handlePendingCount = () => {
      window.dispatchEvent(new CustomEvent("order_updated"));
    };

    const handleRiderCashSubmitted = () => {
      fetchOrdersAndFleet();
    };

    const handleRiderUpdated = (data) => {
      const updatedRider = data?.rider || data;
      if (!updatedRider || typeof updatedRider !== "object") return;
      const updatedId = String(updatedRider.id || updatedRider._id || "");
      if (!updatedId) return;

      setRiders((prev) =>
        prev.map((r) =>
          String(r?.id || r?._id) === updatedId ? { ...r, ...updatedRider } : r,
        ),
      );
    };

    const handleChatMessage = ({ orderId, message }) => {
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          if ((ord.id || ord._id) === orderId) {
            const existingHistory = ord.chatHistory || [];

            const isDuplicate = existingHistory.some(
              (m) =>
                m.text === message.text &&
                m.sender === message.sender &&
                Math.abs(
                  new Date(m.timestamp || Date.now()) -
                    new Date(message.timestamp || Date.now()),
                ) < 3000,
            );

            if (isDuplicate) return ord;

            return {
              ...ord,
              chatHistory: [...existingHistory, message],
            };
          }
          return ord;
        }),
      );
    };

    socket.on("order_created", handleNewOrderIncoming);
    socket.on("order_updated", handleOrderUpdated);
    socket.on("pending_count_updated", handlePendingCount);
    socket.on("rider_cash_submitted", handleRiderCashSubmitted);
    socket.on("rider_updated", handleRiderUpdated);
    socket.on("new_chat_message", handleChatMessage);

    return () => {
      socket.off("order_created", handleNewOrderIncoming);
      socket.off("order_updated", handleOrderUpdated);
      socket.off("pending_count_updated", handlePendingCount);
      socket.off("rider_cash_submitted", handleRiderCashSubmitted);
      socket.off("rider_updated", handleRiderUpdated);
      socket.off("new_chat_message", handleChatMessage);
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current && activeChatOrderId) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeChatOrderId, chatMessagesCount]);

  const handleRecheckPayment = async (orderId) => {
    try {
      setRecheckingOrderId(orderId);
      const result = await recheckPayment(orderId);
      const updated = await fetchOrdersAndFleet();
      if (Array.isArray(updated)) {
        const fresh = updated.find((o) => (o.id || o._id) === orderId);
        if (fresh) setSelectedOrderDetails(fresh);
      }
      toast.success(result?.reason || result?.message || "Re-check complete.");
    } catch (err) {
      toast.error(
        "Re-check failed: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setRecheckingOrderId(null);
    }
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const invoiceNumber = (
      selectedOrderDetails?.id || selectedOrderDetails?._id || ""
    )
      .slice(-10)
      .toUpperCase();

    // Create a hidden iframe for seamless printing without popup blocker issues
    let printFrame = document.getElementById("invoice-print-frame");
    if (printFrame) {
      document.body.removeChild(printFrame);
    }

    printFrame = document.createElement("iframe");
    printFrame.id = "invoice-print-frame";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.zIndex = "-9999";
    document.body.appendChild(printFrame);

    const frameDoc =
      printFrame.contentWindow ||
      printFrame.contentDocument.document ||
      printFrame.contentDocument;

    frameDoc.document.open();
    frameDoc.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${invoiceNumber}</title>
  <style>
    @page {
      size: auto;
      margin: 0 !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #1f2937 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      font-size: 11.5px !important;
      line-height: 1.35 !important;
    }
    .invoice-container {
      width: 100% !important;
      max-width: 100% !important;
      min-height: 100vh !important;
      height: 100vh !important;
      max-height: 100vh !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
      padding: 4mm 6mm 3mm 6mm !important;
      overflow: hidden !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      page-break-before: avoid !important;
      background: #ffffff !important;
    }
    .invoice-header {
      flex-shrink: 0 !important;
      width: 100% !important;
      text-align: center !important;
      padding-bottom: 2px !important;
    }
    .invoice-header img {
      width: 100% !important;
      height: auto !important;
      max-height: 70px !important;
      object-fit: fill !important;
      margin: 0 auto !important;
      display: block !important;
    }
    .invoice-title {
      text-align: center !important;
      font-weight: 800 !important;
      font-size: 14px !important;
      letter-spacing: 0.15em !important;
      text-transform: uppercase !important;
      color: #1f2937 !important;
      padding: 4px 0 !important;
      border-bottom: 1px solid #e5e7eb !important;
      margin-top: 4px !important;
    }
    .invoice-content {
      flex-grow: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      gap: 7px !important;
      overflow: hidden !important;
    }
    .bill-to-box {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      gap: 16px !important;
      background-color: #f9fafb !important;
      padding: 9px 13px !important;
      border-radius: 10px !important;
      border: 1px solid #e5e7eb !important;
      font-size: 11px !important;
      line-height: 1.4 !important;
    }
    .bill-to-left {
      flex: 1 !important;
      min-width: 0 !important;
    }
    .bill-to-right {
      width: 220px !important;
      flex-shrink: 0 !important;
    }
    .bill-row {
      display: flex !important;
      flex-direction: row !important;
      gap: 6px !important;
      margin-bottom: 2px !important;
    }
    .bill-label {
      color: #6b7280 !important;
      font-weight: 500 !important;
      width: 90px !important;
      flex-shrink: 0 !important;
    }
    .bill-value {
      color: #1f2937 !important;
      font-weight: 600 !important;
      flex: 1 !important;
    }
    .invoice-table-wrap {
      width: 100% !important;
      overflow: hidden !important;
    }
    table.invoice-table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border: 1px solid #d1d5db !important;
      font-size: 11px !important;
      display: table !important;
    }
    table.invoice-table thead {
      display: table-header-group !important;
    }
    table.invoice-table tbody {
      display: table-row-group !important;
    }
    table.invoice-table tr {
      display: table-row !important;
    }
    table.invoice-table thead tr {
      background-color: #f3f4f6 !important;
      color: #374151 !important;
      text-transform: uppercase !important;
      font-size: 9.5px !important;
      font-weight: 700 !important;
      border-bottom: 1px solid #d1d5db !important;
    }
    table.invoice-table th {
      display: table-cell !important;
      padding: 5px 6px !important;
      border-right: 1px solid #d1d5db !important;
      text-align: left !important;
      vertical-align: middle !important;
      overflow: hidden !important;
    }
    table.invoice-table th:last-child {
      border-right: none !important;
    }
    table.invoice-table td {
      display: table-cell !important;
      padding: 4px 6px !important;
      border-right: 1px solid #d1d5db !important;
      border-bottom: 1px solid #e5e7eb !important;
      vertical-align: middle !important;
      word-break: break-word !important;
      overflow: hidden !important;
    }
    table.invoice-table td:last-child {
      border-right: none !important;
    }
    .col-items { width: 32% !important; text-align: left !important; font-weight: 600 !important; }
    .col-price { width: 15% !important; text-align: right !important; font-weight: 500 !important; font-size: 10.5px !important; white-space: nowrap !important; }
    .col-qty   { width: 10% !important; text-align: center !important; font-weight: 700 !important; }
    .col-disc  { width: 15% !important; text-align: right !important; font-weight: 700 !important; color: #059669 !important; font-size: 10.5px !important; white-space: nowrap !important; }
    .col-vat   { width: 10% !important; text-align: right !important; }
    .col-total { width: 18% !important; text-align: right !important; font-weight: 800 !important; color: #111827 !important; font-size: 11px !important; white-space: nowrap !important; }
    
    .promo-badge {
      display: inline-block !important;
      margin-top: 2px !important;
      padding: 1px 4px !important;
      border-radius: 3px !important;
      font-size: 7.5px !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      border: 1px solid #c4b5fd !important;
      background-color: #f5f3ff !important;
      color: #7c3aed !important;
    }
    .addons-list {
      font-size: 9px !important;
      color: #047857 !important;
      margin-top: 2px !important;
    }
    .summary-section {
      display: flex !important;
      justify-content: flex-end !important;
      padding-top: 4px !important;
    }
    .summary-box {
      width: 270px !important;
      font-size: 10.5px !important;
    }
    .summary-row {
      display: flex !important;
      justify-content: space-between !important;
      padding: 2.5px 0 !important;
      border-bottom: 1px solid #e5e7eb !important;
    }
    .summary-row.total-row {
      border-bottom: 2px solid #111827 !important;
      font-weight: 900 !important;
      font-size: 12.5px !important;
      color: #111827 !important;
      padding: 3.5px 0 !important;
    }
    .words-section {
      font-size: 10px !important;
      color: #4b5563 !important;
      font-weight: 500 !important;
      padding-top: 2px !important;
    }
    .invoice-footer {
      flex-shrink: 0 !important;
      width: 100% !important;
      margin-top: auto !important;
      padding-top: 6px !important;
      text-align: center !important;
      page-break-inside: avoid !important;
      display: block !important;
      visibility: visible !important;
    }
    .invoice-footer img {
      width: 100% !important;
      height: auto !important;
      max-height: 46px !important;
      object-fit: fill !important;
      margin: 0 auto !important;
      display: block !important;
      visibility: visible !important;
    }
    /* 🎯 Dynamic A5 Scale: Triggered automatically when A5 paper (width <= 175mm / 620px) is chosen */
    @media print and (max-width: 175mm), (max-width: 620px) {
      html, body {
        font-size: 8.5px !important;
        line-height: 1.2 !important;
      }
      .invoice-container {
        padding: 3mm 5mm 2mm 5mm !important;
      }
      .invoice-header img {
        max-height: 52px !important;
      }
      .invoice-title {
        font-size: 11px !important;
        padding: 2px 0 !important;
        margin-top: 2px !important;
      }
      .invoice-content {
        gap: 4px !important;
      }
      .bill-to-box {
        padding: 5px 8px !important;
        font-size: 8px !important;
        border-radius: 6px !important;
        gap: 8px !important;
      }
      .bill-to-right {
        width: 165px !important;
      }
      .bill-label {
        width: 68px !important;
        font-size: 8px !important;
      }
      .bill-value {
        font-size: 8px !important;
      }
      table.invoice-table {
        font-size: 8px !important;
      }
      table.invoice-table thead tr {
        font-size: 7px !important;
      }
      table.invoice-table th {
        padding: 2.5px 3px !important;
      }
      table.invoice-table td {
        padding: 2.5px 3px !important;
        font-size: 8px !important;
      }
      .col-price {
        font-size: 8px !important;
      }
      .col-qty {
        font-size: 8px !important;
      }
      .col-disc {
        font-size: 8px !important;
      }
      .col-vat {
        font-size: 8px !important;
      }
      .col-total {
        font-size: 8px !important;
      }
      .promo-badge {
        font-size: 6px !important;
        padding: 1px 3px !important;
      }
      .addons-list {
        font-size: 6.5px !important;
      }
      .summary-box {
        width: 200px !important;
        font-size: 8px !important;
      }
      .summary-box * {
        font-size: 8px !important;
      }
      .summary-row {
        padding: 1px 0 !important;
        font-size: 8px !important;
      }
      .summary-row span {
        font-size: 8px !important;
      }
      .summary-row input {
        font-size: 8px !important;
        width: 45px !important;
        padding: 0 !important;
        height: auto !important;
        border: none !important;
        background: transparent !important;
      }
      .summary-row.total-row,
      .summary-row.total-row span {
        font-size: 9.5px !important;
        font-weight: 900 !important;
        padding: 2px 0 !important;
      }
      .words-section,
      .words-section span {
        font-size: 7.5px !important;
        padding-top: 1px !important;
      }
      .invoice-footer img {
        max-height: 38px !important;
      }
    }
    .no-print {
      display: none !important;
    }
  </style>
</head>
<body>
  ${printContent.outerHTML}
</body>
</html>`);
    frameDoc.document.close();

    setTimeout(() => {
      try {
        frameDoc.focus();
        frameDoc.print();
      } catch (err) {
        console.error("Print error:", err);
      }
    }, 450);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          const ordId = ord.id || ord._id;
          if (ordId === orderId) {
            return {
              ...ord,
              status: newStatus,
              deliveryStatus: newStatus,
            };
          }
          return ord;
        }),
      );

      await updateOrderStatus(orderId, newStatus);

      socket.emit("order_status_updated", {
        orderId,
        id: orderId,
        status: newStatus,
      });
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId, id: orderId, status: newStatus },
        }),
      );

      fetchOrdersAndFleet();

      const shortId = orderId ? orderId.slice(-6).toUpperCase() : "";

      if (newStatus === "Accepted" || newStatus === "ACCEPTED") {
        toast.success(`Order #${shortId} has been Accepted!`, {
          duration: 3000,
          position: "top-right",
          style: {
            background: "#10B981",
            color: "#FFFFFF",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
      } else if (newStatus === "Rejected" || newStatus === "REJECTED") {
        toast.error(`Order #${shortId} has been Rejected!`, {
          duration: 3000,
          position: "top-right",
          style: {
            background: "#EF4444",
            color: "#FFFFFF",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
      } else {
        toast(`Order status updated to ${newStatus}`, {
          icon: "🔄",
          position: "top-right",
        });
      }
    } catch (err) {
      toast.error("Failed to update status: " + err.message);
      fetchOrdersAndFleet();
    }
  };

  const handleAssignRider = async (orderId, riderId) => {
    const selectedRider = riders.find((r) => (r.id || r._id) === riderId);
    if (!selectedRider) return;
    try {
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          const ordId = ord.id || ord._id;
          if (ordId === orderId) {
            return {
              ...ord,
              riderId: riderId,
              riderName: selectedRider.name,
              riderPhone: selectedRider.phone || "",
              riderAcceptStatus: "pending",
            };
          }
          return ord;
        }),
      );

      await assignRiderToOrder(orderId, riderId, selectedRider.name);

      const payload = {
        id: orderId,
        orderId: orderId,
        riderId: riderId,
        riderName: selectedRider.name,
        riderAcceptStatus: "pending",
      };

      socket.emit("rider_order_assigned", payload);
      socket.emit("order_assigned", payload);
      socket.emit("order_updated", payload);

      toast.success(`Assigned to ${selectedRider.name}`);

      fetchOrdersAndFleet();
    } catch (err) {
      toast.error("Failed to assign rider: " + err.message);
      fetchOrdersAndFleet();
    }
  };

  const handleAdminRiderAcceptStatus = async (orderId, newAcceptStatus) => {
    try {
      if (newAcceptStatus === "accepted") {
        setOrders((prevOrders) =>
          prevOrders.map((ord) => {
            const ordId = ord.id || ord._id;
            if (ordId === orderId) {
              return {
                ...ord,
                riderAcceptStatus: "accepted",
                status: "Preparing",
                deliveryStatus: "Preparing",
              };
            }
            return ord;
          }),
        );

        await updateOrderStatus(orderId, "Preparing", "accepted");

        const payload = {
          id: orderId,
          orderId: orderId,
          riderAcceptStatus: "accepted",
          status: "Preparing",
        };

        socket.emit("order_updated", payload);
        socket.emit("order_status_updated", {
          id: orderId,
          orderId: orderId,
          status: "Preparing",
          ...payload,
        });
        socket.emit("rider_order_updated", payload);

        toast.success(
          "Rider acceptance confirmed and status updated to Preparing!",
        );
      } else if (newAcceptStatus === "rejected") {
        setOrders((prevOrders) =>
          prevOrders.map((ord) => {
            const ordId = ord.id || ord._id;
            if (ordId === orderId) {
              return {
                ...ord,
                riderId: null,
                riderName: "",
                riderAcceptStatus: "rejected",
              };
            }
            return ord;
          }),
        );

        await assignRiderToOrder(orderId, "", "");

        const payload = {
          id: orderId,
          orderId: orderId,
          riderId: null,
          riderName: "",
          riderAcceptStatus: "rejected",
        };

        socket.emit("order_updated", payload);
        socket.emit("rider_order_updated", payload);

        toast.error("Rider unassigned. You can now assign another rider.");
      }

      fetchOrdersAndFleet();
    } catch (err) {
      toast.error(
        "Failed to update rider status: " +
          (err.response?.data?.message || err.message),
      );
      fetchOrdersAndFleet();
    }
  };

  const handleSendAdminMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText || adminChatMessage;
    if (!textToSend.trim() || !activeChatOrderId) return;

    try {
      const messagePayload = {
        sender: "admin",
        senderName: "Barcode Admin",
        text: textToSend.trim(),
      };

      const updated = await addChatMessage(activeChatOrderId, messagePayload);

      socket.emit("send_message", {
        orderId: activeChatOrderId,
        message: messagePayload,
      });

      setOrders((prev) =>
        prev.map((o) => ((o.id || o._id) === activeChatOrderId ? updated : o)),
      );
      if (!customText) setAdminChatMessage("");
      toast.success("Message sent!");
    } catch (err) {
      toast.error("Failed to send message: " + err.message);
    }
  };

  const currentOrderId = String(selectedOrderDetails?.id || selectedOrderDetails?._id || "");
  const currentAdjustment = parseFloat(adjustments[currentOrderId]) || 0;

  const orderItems = Array.isArray(selectedOrderDetails?.items)
    ? selectedOrderDetails.items.filter(Boolean)
    : Array.isArray(selectedOrderDetails?.cart)
    ? selectedOrderDetails.cart.filter(Boolean)
    : [];

  const subTotal = orderItems.reduce(
    (sum, item) => sum + (Number(getItemPayableTotal(item)) || 0),
    0,
  );

  const orderAddonsTotal = orderItems.reduce((sum, item) => {
    const itemAddons = Array.isArray(item?.selectedAddons)
      ? item.selectedAddons.filter(Boolean).reduce((s, a) => s + (Number(a?.price) || 0), 0)
      : 0;
    return sum + itemAddons * (Number(item?.quantity) || 1);
  }, 0);

  const orderDishesBaseTotal = Math.max(0, subTotal - orderAddonsTotal);

  const couponDiscount = Number(
    selectedOrderDetails?.couponDiscount ||
      selectedOrderDetails?.discountAmount ||
      selectedOrderDetails?.discount ||
      0,
  );

  const couponCodeApplied =
    selectedOrderDetails?.couponCode || selectedOrderDetails?.promoCode || null;

  const pointsDiscount = Number(selectedOrderDetails?.pointsRedeemed || 0);

  const deliveryCharge = Number(selectedOrderDetails?.deliveryCharge) || 0;
  const grandTotal = Math.max(
    0,
    subTotal + deliveryCharge + currentAdjustment - couponDiscount - pointsDiscount,
  );

  const isRejectedOrder =
    String(selectedOrderDetails?.status || "").toUpperCase() === "REJECTED" ||
    String(selectedOrderDetails?.status || "").toUpperCase() === "CANCELLED";

  const isPaidOrder =
    !isRejectedOrder &&
    (String(selectedOrderDetails?.paymentStatus || "").toLowerCase() === "paid" ||
      Boolean(selectedOrderDetails?.isPaid) ||
      String(selectedOrderDetails?.status || "").toUpperCase() === "DELIVERED" ||
      (String(selectedOrderDetails?.paymentMethod || "cod").toLowerCase() !== "cod" &&
        Boolean(selectedOrderDetails?.transactionId)));

  const advanceAmount = isPaidOrder ? grandTotal : 0;
  const remainingAmount = isRejectedOrder ? 0 : isPaidOrder ? 0 : grandTotal;

  const isOrderMatchingSelectedBranch = useCallback(
    (ord, targetBranchId) => {
      if (!targetBranchId || targetBranchId === "all") return true;
      return isOrderMatchingBranch(ord, [targetBranchId]);
    },
    [isOrderMatchingBranch]
  );

  // 🎯 Base orders for count calculation & filtering
  const baseOrders = useMemo(() => {
    let list = orders.filter(Boolean);
    if (isManager && managerAssignedBranches.length > 0) {
      list = list.filter(checkOrderBelongsToManager);
    } else if (!isManager && branchFilter !== "all") {
      list = list.filter((ord) => isOrderMatchingSelectedBranch(ord, branchFilter));
    }
    return list;
  }, [orders, isManager, managerAssignedBranches, checkOrderBelongsToManager, branchFilter, isOrderMatchingSelectedBranch]);

  // 🎯 Status counts for quick filter tabs
  const orderCounts = useMemo(() => {
    const counts = {
      all: baseOrders.length,
      pending: 0,
      preparing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      rejected: 0,
    };

    baseOrders.forEach((ord) => {
      if (!ord) return;
      const st = String(ord.status || "").trim().toLowerCase();
      if (st === "placed" || st === "pending" || st === "awaiting payment" || st === "awaiting_payment" || !st) {
        counts.pending += 1;
      } else if (st === "preparing") {
        counts.preparing += 1;
      } else if (st === "ready to pick" || st === "ready_to_pick") {
        counts.ready += 1;
      } else if (st === "out for delivery" || st === "out_for_delivery") {
        counts.out_for_delivery += 1;
      } else if (st === "delivered") {
        counts.delivered += 1;
      } else if (st === "rejected" || st === "cancelled") {
        counts.rejected += 1;
      }
    });

    return counts;
  }, [baseOrders]);

  // 🎯 Dynamic counts for Order Type (Delivery vs Self-Pickup within current branch scope)
  const orderTypeCounts = useMemo(() => {
    let delivery = 0;
    let pickup = 0;
    baseOrders.forEach((ord) => {
      if (!ord) return;
      const isPickup =
        ord.orderType === "pickup" ||
        ord.deliveryArea === "Self Pickup" ||
        String(ord.user?.pickArea || "").toLowerCase().includes("self pickup") ||
        String(ord.user?.address || "").toLowerCase().includes("self pickup") ||
        String(ord.deliveryAddress || "").toLowerCase().includes("self pickup");
      if (isPickup) pickup += 1;
      else delivery += 1;
    });
    return { all: baseOrders.length, delivery, pickup };
  }, [baseOrders]);

  // 🎯 Filtered Orders list
  const filteredOrders = useMemo(() => {
    let list = baseOrders;

    // 1. Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        list = list.filter((ord) => {
          const st = String(ord.status || "").toUpperCase();
          return st === "PLACED" || st === "PENDING" || st === "AWAITING PAYMENT" || st === "AWAITING_PAYMENT" || !ord.status;
        });
      } else if (statusFilter === "rejected") {
        list = list.filter((ord) => {
          const st = String(ord.status || "").toUpperCase();
          return st === "REJECTED" || st === "CANCELLED";
        });
      } else if (statusFilter === "ready") {
        list = list.filter((ord) => {
          const st = String(ord.status || "").toLowerCase();
          return st === "ready to pick" || st === "ready_to_pick";
        });
      } else if (statusFilter === "out_for_delivery") {
        list = list.filter((ord) => {
          const st = String(ord.status || "").toLowerCase();
          return st === "out for delivery" || st === "out_for_delivery";
        });
      } else {
        list = list.filter((ord) => String(ord.status || "").toLowerCase() === statusFilter.toLowerCase());
      }
    }

    // 2. Order Type Filter (Delivery / Pickup)
    if (orderTypeFilter !== "all") {
      list = list.filter((ord) => {
        const isPickup =
          ord.orderType === "pickup" ||
          ord.deliveryArea === "Self Pickup" ||
          String(ord.user?.pickArea || "").toLowerCase().includes("self pickup") ||
          String(ord.user?.address || "").toLowerCase().includes("self pickup") ||
          String(ord.deliveryAddress || "").toLowerCase().includes("self pickup");
        return orderTypeFilter === "pickup" ? isPickup : !isPickup;
      });
    }

    // 3. Payment Filter (Paid / Unpaid)
    if (paymentFilter !== "all") {
      list = list.filter((ord) => {
        const isPaid =
          String(ord.paymentStatus || "").toLowerCase() === "paid" ||
          Boolean(ord.isPaid) ||
          String(ord.status || "").toUpperCase() === "DELIVERED" ||
          (String(ord.paymentMethod || "cod").toLowerCase() !== "cod" && Boolean(ord.transactionId));
        return paymentFilter === "paid" ? isPaid : !isPaid;
      });
    }

    // 4. Search Filter (Order ID, Name, Phone, Address, Area, Rider)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((ord) => {
        const id = String(ord.id || ord._id || ord.orderId || "").toLowerCase();
        const name = String(ord.user?.name || ord.customerName || "").toLowerCase();
        const phone = String(ord.user?.phone || ord.customerPhone || "").toLowerCase();
        const addr = String(ord.user?.address || ord.deliveryAddress || "").toLowerCase();
        const area = String(ord.user?.pickArea || ord.area || ord.deliveryArea || "").toLowerCase();
        const rider = String(ord.riderName || ord.rider?.name || "").toLowerCase();
        return id.includes(q) || name.includes(q) || phone.includes(q) || addr.includes(q) || area.includes(q) || rider.includes(q);
      });
    }

    return list;
  }, [baseOrders, statusFilter, orderTypeFilter, paymentFilter, searchQuery]);

  // 🎯 Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredOrders.length);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, startIndex, pageSize]);

  // Page Numbers Generator
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (validCurrentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const statusTabItems = [
    { id: "all", label: "All Orders", count: orderCounts.all, tone: "neutral" },
    { id: "pending", label: "Pending", count: orderCounts.pending, tone: "amber" },
    { id: "preparing", label: "Preparing", count: orderCounts.preparing, tone: "blue" },
    { id: "ready", label: "Ready to Pick", count: orderCounts.ready, tone: "purple" },
    { id: "out_for_delivery", label: "Out for Delivery", count: orderCounts.out_for_delivery, tone: "orange" },
    { id: "delivered", label: "Delivered", count: orderCounts.delivered, tone: "emerald" },
    { id: "rejected", label: "Cancelled", count: orderCounts.rejected, tone: "rose" },
  ];

  return (
    <div className="w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto space-y-6">

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
              Orders & Live Chat
            </h1>
            {isManager && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>{managedBranchNames ? `Branch: ${managedBranchNames}` : 'All Outlets'}</span>
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Monitor incoming food deliveries, update delivery stages, and chat
            with customers/riders.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchOrdersAndFleet}
            className="px-3.5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportSalesModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Sales to Excel</span>
          </button>
        </div>
      </div>

      {/* 🎯 Quick Status Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {statusTabItems.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? "bg-primary-500 text-white border-primary-500 shadow-sm shadow-primary-500/20"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-primary-500/40"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.tone === "amber"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : tab.tone === "blue"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : tab.tone === "purple"
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : tab.tone === "orange"
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    : tab.tone === "emerald"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : tab.tone === "rose"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 🎯 Live Search & Advanced Filter Controls Bar */}
      <div className="p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Order ID, Customer Name, Phone, Area or Rider..."
            className="w-full pl-9 pr-8 py-2 bg-neutral-50 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch Filter (Super Admin & Sub-Admin Only) */}
          {!isManager && (
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-neutral-50 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="all">🏢 All Branches ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  📍 {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Order Type */}
          <select
            value={orderTypeFilter}
            onChange={(e) => {
              setOrderTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
          >
            <option value="all">📦 All Types ({orderTypeCounts.all})</option>
            <option value="delivery">🚚 Delivery Only ({orderTypeCounts.delivery})</option>
            <option value="pickup">🛍️ Self Pickup Only ({orderTypeCounts.pickup})</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
          >
            <option value="all">💳 All Payments</option>
            <option value="paid">✅ Paid Only</option>
            <option value="unpaid">⏳ Unpaid / COD</option>
          </select>
        </div>
      </div>

      <ErrorBanner
        title="Could not load orders"
        error={loadError}
        onRetry={fetchOrdersAndFleet}
      />

      <div className="w-full flex flex-col gap-6">
        {/* 🎯 Ultra-wide Table Container Optimization */}
        <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-xs text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900 sticky top-0 z-20 shadow-xs">
                  <th className="px-3 py-3.5 sm:px-4">Order ID</th>
                  <th className="px-3 py-3.5 sm:px-4">Customer</th>
                  <th className="px-3 py-3.5 sm:px-4">Address</th>
                  <th className="px-3 py-3.5 sm:px-4">Total Amount</th>
                  <th className="px-3 py-3.5 sm:px-4">Order Action</th>
                  <th className="px-3 py-3.5 sm:px-4">Delivery Status</th>
                  <th className="px-3 py-3.5 sm:px-4">Assigned Rider</th>
                  <th className="px-3 py-3.5 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16 text-neutral-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-neutral-400 font-bold">Loading live orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-12 text-neutral-400 font-medium"
                    >
                      {loadError
                        ? "Orders could not be loaded — see the message above."
                        : searchQuery || statusFilter !== "all" || orderTypeFilter !== "all" || paymentFilter !== "all"
                        ? "No orders match your filter criteria."
                        : "No orders found."}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.filter(Boolean).map((ord) => {
                    const ordId = String(ord.id || ord._id || ord.orderId || "");
                    const currentStatus = String(
                      ord.status || "",
                    ).toUpperCase();

                    const isPendingUnhandled =
                      currentStatus === "PLACED" ||
                      currentStatus === "PENDING" ||
                      currentStatus === "AWAITING PAYMENT" ||
                      currentStatus === "AWAITING_PAYMENT" ||
                      !ord.status;

                    const isRejected = currentStatus === "REJECTED";
                    const badge = getPaymentBadge(ord);

                    const assignedRiderId = String(
                      ord.riderId ||
                      ord.rider?._id ||
                      ord.rider?.id ||
                      (typeof ord.rider === "string" ? ord.rider : "") ||
                      ""
                    );

                    const isPickupOrder =
                      ord.orderType === "pickup" ||
                      ord.deliveryArea === "Self Pickup" ||
                      String(ord.user?.pickArea || "").toLowerCase().includes("self pickup") ||
                      String(ord.user?.address || "").toLowerCase().includes("self pickup") ||
                      String(ord.deliveryAddress || "").toLowerCase().includes("self pickup");

                    return (
                      <tr
                        key={ordId || Math.random()}
                        className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-955/20 transition-colors"
                      >
                        <td
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="px-3 py-3 sm:px-4 font-bold text-primary-500 hover:text-primary-600 hover:underline cursor-pointer uppercase transition-colors whitespace-nowrap"
                          title={ordId}
                        >
                          {formatShortOrderId(ordId)}
                          <span
                            className={`block mt-0.5 w-fit px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wide font-extrabold ${
                              isPickupOrder
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            }`}
                          >
                            {isPickupOrder ? "🛍️ Pickup" : "🚚 Delivery"}
                          </span>
                          {badge && (
                            <span
                              className={`block mt-0.5 w-fit px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wide ${badge.tone}`}
                            >
                              {badge.label}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-4">
                          <span className="block font-semibold text-neutral-850 dark:text-white truncate max-w-[120px] 2xl:max-w-[160px]">
                            {ord.user?.name || ord.customerName || "Guest"}
                          </span>
                          <span className="block text-[10px] text-neutral-400 mt-0.5">
                            {ord.user?.phone || ord.customerPhone || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-3 sm:px-4">
                          {isPickupOrder ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                <span className="truncate max-w-[140px] 2xl:max-w-[200px]" title={ord.pickupBranchName || ord.user?.pickArea}>
                                  {ord.pickupBranchName || ord.user?.pickArea?.replace(/^Self Pickup at /i, '').trim() || "Pickup Outlet"}
                                </span>
                              </span>
                              <span className="block text-[10px] text-neutral-400 mt-0.5 truncate max-w-[140px] 2xl:max-w-[200px]" title={ord.user?.address || ord.deliveryAddress}>
                                {ord.user?.address && !ord.user.address.toLowerCase().includes("self pickup") ? ord.user.address : "Customer In-Store Collection"}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span
                                className="block text-neutral-700 dark:text-neutral-200 font-medium text-xs truncate max-w-[140px] 2xl:max-w-[200px]"
                                title={ord.user?.address || ord.deliveryAddress}
                              >
                                {ord.user?.address || ord.deliveryAddress || "-"}
                              </span>
                              <span className="block text-[10px] text-neutral-400 mt-0.5 truncate max-w-[140px] 2xl:max-w-[200px]">
                                📍 {ord.deliveryArea || ord.user?.pickArea || "Standard Delivery Area"}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-4 font-bold text-primary-500 whitespace-nowrap">
                          ৳{Number(ord.total || ord.grandTotal || 0).toFixed(2)}
                        </td>

                        <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                          {isPendingUnhandled ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleStatusChange(ordId, "Accepted")
                                }
                                className="px-2 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] uppercase active:scale-95 transition-all shadow-xs flex items-center gap-0.5 cursor-pointer"
                                title="Accept Order"
                              >
                                <Check className="w-3 h-3 stroke-[3]" /> Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(ordId, "Rejected")
                                }
                                className="px-2 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] uppercase active:scale-95 transition-all shadow-xs flex items-center gap-0.5 cursor-pointer"
                                title="Reject Order"
                              >
                                <X className="w-3 h-3 stroke-[3]" /> Reject
                              </button>
                            </div>
                          ) : isRejected ? (
                            <span className="px-2 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-500 font-bold text-[9px] uppercase tracking-wide">
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wide">
                              Accepted
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                          {isPendingUnhandled ? (
                            <span className="px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wide inline-block">
                              Pending
                            </span>
                          ) : isRejected ? (
                            <span className="px-2 py-1 rounded border border-neutral-500/20 bg-neutral-500/10 text-neutral-400 font-bold text-[9px] uppercase tracking-wide inline-block">
                              Cancelled
                            </span>
                          ) : ord.status === "Delivered" ? (
                            <span className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wide inline-flex items-center gap-1 shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Delivered
                            </span>
                          ) : (
                            <div>
                              <select
                                value={ord.status}
                                disabled={
                                  !isPickupOrder &&
                                  (!assignedRiderId || ord.riderAcceptStatus !== "accepted")
                                }
                                onChange={(e) =>
                                  handleStatusChange(ordId, e.target.value)
                                }
                                className={`px-1.5 py-1 rounded-lg border font-bold text-[10px] uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                                  !isPickupOrder &&
                                  (!assignedRiderId || ord.riderAcceptStatus !== "accepted")
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-75"
                                    : `${getStatusColor(ord.status)} cursor-pointer`
                                }`}
                              >
                                <option value="Accepted">Accepted</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready to Pick">
                                  {isPickupOrder ? "Ready for Pickup" : "Ready to Pick"}
                                </option>
                                {!isPickupOrder && (
                                  <option value="Out for Delivery">
                                    Out for Delivery
                                  </option>
                                )}
                                <option value="Delivered">
                                  {isPickupOrder ? "Collected / Handed Over" : "Delivered"}
                                </option>
                              </select>

                              {!isPickupOrder &&
                                (!assignedRiderId ||
                                  ord.riderAcceptStatus !== "accepted") && (
                                  <span className="block text-[9px] text-orange-500 font-bold mt-0.5 tracking-tight">
                                    {!assignedRiderId
                                      ? "Assign Rider First"
                                      : "Awaiting Rider Accept"}
                                  </span>
                                )}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                          {isPickupOrder ? (
                            <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase tracking-wide inline-flex items-center gap-1">
                              🛍️ Self-Pickup
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <select
                                value={assignedRiderId}
                                disabled={
                                  isPendingUnhandled ||
                                  isRejected ||
                                  ord.status === "Delivered"
                                }
                                onChange={(e) =>
                                  handleAssignRider(ordId, e.target.value)
                                }
                                className={`px-1.5 py-1 rounded-lg border font-bold text-[9px] uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 max-w-[140px] 2xl:max-w-[180px] ${
                                  isPendingUnhandled ||
                                  isRejected ||
                                  ord.status === "Delivered"
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed"
                                    : "bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 cursor-pointer border-neutral-200 dark:border-neutral-800"
                                }`}
                              >
                                <option value="">-- ASSIGN RIDER --</option>
                              {Array.isArray(riders) &&
                                riders.filter(Boolean).map((r) => {
                                  const rId = String(r.id || r._id || "");
                                  return (
                                    <option
                                      key={rId}
                                      value={rId}
                                    >
                                      {r.name} (
                                      {r.vehicle || r.vehicleType || "RIDER"})
                                    </option>
                                  );
                                })}
                            </select>

                            {assignedRiderId &&
                              !isPendingUnhandled &&
                              !isRejected &&
                              ord.status !== "Delivered" && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  {ord.riderAcceptStatus === "accepted" ? (
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                      ✓ Accepted
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAdminRiderAcceptStatus(
                                            ordId,
                                            "accepted",
                                          )
                                        }
                                        className="px-1.5 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 shadow-xs"
                                        title="Force Accept Rider Status"
                                      >
                                        ✓ Accept
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAdminRiderAcceptStatus(
                                            ordId,
                                            "rejected",
                                          )
                                        }
                                        className="px-1.5 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 shadow-xs"
                                        title="Reject and Unassign Rider"
                                      >
                                        ✕ Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setActiveChatOrderId(ordId)}
                            className={`p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:border-primary-500/40 active:scale-95 transition-all cursor-pointer ${
                              activeChatOrderId === ordId
                                ? "bg-primary-500/10 text-primary-500 border-primary-500/30"
                                : ""
                            }`}
                            title="Open Live Chat Console"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 🎯 Pagination Control Bar */}
          {filteredOrders.length > 0 && (
            <div className="px-4 py-3.5 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Left Info & Page Size */}
              <div className="flex items-center gap-4 flex-wrap text-neutral-500 dark:text-neutral-400">
                <span>
                  Showing <span className="font-bold text-neutral-800 dark:text-neutral-200">{filteredOrders.length === 0 ? 0 : startIndex + 1}</span> to{" "}
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">{endIndex}</span> of{" "}
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">{filteredOrders.length}</span> orders
                  {filteredOrders.length !== orders.length && (
                    <span className="text-neutral-400 ml-1">(filtered from {orders.length} total)</span>
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Right Pagination Buttons */}
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1 text-neutral-400 font-bold select-none">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = p === validCurrentPage;
                    return (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => setCurrentPage(Number(p))}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isCurrent
                            ? "bg-primary-500 text-white shadow-xs"
                            : "border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Chat Modal */}
      <AnimatePresence>
        {activeChatOrderId && currentChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg 2xl:max-w-xl flex flex-col h-[580px] bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                    Live Chat for Order #
                    {(currentChat.id || currentChat._id)?.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Customer:{" "}
                    {currentChat.user?.name ||
                      currentChat.customerName ||
                      "Guest"}{" "}
                    (
                    {currentChat.user?.phone ||
                      currentChat.customerPhone ||
                      "N/A"}
                    )
                  </p>
                </div>
                <button
                  onClick={() => setActiveChatOrderId(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Kitchen Alert Banner: Only active during kitchen prep stages */}
              {(() => {
                const normChatStatus = String(currentChat.status || "").toLowerCase().replace(/_/g, " ");
                const isPrepStage = ["placed", "pending", "accepted", "preparing"].includes(normChatStatus);
                const isReadyStage = normChatStatus === "ready to pick";

                if (isPrepStage) {
                  return (
                    <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between shrink-0 animate-in fade-in duration-150">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5" /> Quick Kitchen Alert:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleSendAdminMessage(
                            null,
                            "🔔 Food is Ready / Ready to Pick! Please collect from the restaurant.",
                          );
                          handleStatusChange(
                            currentChat.id || currentChat._id,
                            "Ready to Pick",
                          );
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase active:scale-95 transition-all shadow-xs cursor-pointer"
                      >
                        Set Ready & Notify Rider
                      </button>
                    </div>
                  );
                }

                if (isReadyStage) {
                  return (
                    <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Food is Ready for Pickup (Rider Notified)
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400">
                        Waiting for Rider
                      </span>
                    </div>
                  );
                }

                return null;
              })()}

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-neutral-955/20"
              >
                {(currentChat.chatHistory || []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-xs gap-1">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  (currentChat.chatHistory || []).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === "admin" ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-neutral-400 mb-0.5 px-1">
                        {msg.senderName}
                      </span>
                      <div
                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${
                          msg.sender === "admin"
                            ? "bg-primary-500 text-white rounded-br-none"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={(e) => handleSendAdminMessage(e, null)}
                className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={adminChatMessage}
                  onChange={(e) => setAdminChatMessage(e.target.value)}
                  placeholder="Type message as Barcode Admin..."
                  className="flex-grow px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl max-w-4xl 2xl:max-w-5xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 print:hidden">
                <div>
                  <h2 className="text-lg font-extrabold text-neutral-800 dark:text-neutral-100">
                    Official Invoice Preview
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Order ID: #
                    {(
                      selectedOrderDetails.id || selectedOrderDetails._id
                    )?.toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Print / Save as PDF"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderDetails(null)}
                    className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div
                ref={invoiceRef}
                className="invoice-container relative bg-white text-neutral-800 p-6 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto min-h-0 text-xs font-sans overflow-hidden"
              >
                {/* ❌ VOID / CANCELLED Watermark Stamp for Rejected Orders */}
                {isRejectedOrder && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 overflow-hidden select-none">
                    <div className="border-4 border-rose-500/30 text-rose-500/25 dark:border-rose-500/40 dark:text-rose-500/30 text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-[0.2em] px-8 py-4 rotate-[-22deg] rounded-3xl text-center shadow-xs">
                      VOID / CANCELLED
                      <span className="block text-[11px] sm:text-xs tracking-normal font-bold mt-1 text-rose-500/40">
                        (ORDER REJECTED BY RESTAURANT)
                      </span>
                    </div>
                  </div>
                )}

                {/* 🎯 Invoice Header (Pinned at Top) */}
                <div className="invoice-header w-full shrink-0 pb-2 text-center">
                  <img
                    src={invoiceHeaderImg}
                    alt="Barcode Restaurant Group Header"
                    className="w-full h-auto max-h-[75px] object-fill block mx-auto"
                  />
                  <div className="invoice-title text-center font-bold text-sm sm:text-base tracking-widest uppercase text-neutral-800 py-1.5 border-b border-neutral-200 mt-2">
                    {isRejectedOrder ? (
                      <span className="text-rose-600 font-extrabold flex items-center justify-center gap-1.5">
                        <X className="w-4 h-4 stroke-[3]" /> Invoice (Void / Cancelled)
                      </span>
                    ) : (
                      "Invoice"
                    )}
                  </div>
                </div>

                {/* 🎯 Invoice Body Content (Middle Space) */}
                <div className="invoice-content flex-grow space-y-4 py-2">
                  <div className="bill-to-box flex flex-row justify-between items-start gap-4 sm:gap-6 bg-neutral-50 p-3.5 sm:p-4 rounded-xl border border-neutral-200 text-xs leading-normal">
                    <div className="bill-to-left space-y-1.5 flex-1 min-w-0">
                      <p className="font-bold text-neutral-900 uppercase text-[11px] mb-1.5">
                        Bill To:
                      </p>
                      <div className="bill-row grid grid-cols-[95px_1fr] gap-x-2">
                        <span className="bill-label text-neutral-500 font-medium">
                          Customer Name
                        </span>
                        <span className="bill-value font-bold text-neutral-800">
                          :{" "}
                          {selectedOrderDetails.user?.name ||
                            selectedOrderDetails.customerName ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="bill-row grid grid-cols-[95px_1fr] gap-x-2">
                        <span className="bill-label text-neutral-500 font-medium">
                          Mobile
                        </span>
                        <span className="bill-value font-semibold text-neutral-800">
                          :{" "}
                          {selectedOrderDetails.user?.phone ||
                            selectedOrderDetails.customerPhone ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="bill-row grid grid-cols-[95px_1fr] gap-x-2">
                        <span className="bill-label text-neutral-500 font-medium">
                          Address
                        </span>
                        <span className="bill-value text-neutral-800">
                          :{" "}
                          {selectedOrderDetails.user?.address ||
                            selectedOrderDetails.deliveryAddress ||
                            "N/A"}{" "}
                          {selectedOrderDetails.user?.pickArea
                            ? `(${selectedOrderDetails.user?.pickArea})`
                            : selectedOrderDetails.deliveryArea
                            ? `(${selectedOrderDetails.deliveryArea})`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="bill-to-right space-y-1.5 w-56 sm:w-60 shrink-0 pt-0">
                      <div className="bill-row grid grid-cols-[85px_1fr] gap-x-2">
                        <span className="bill-label text-neutral-500 font-medium">
                          Invoice Date
                        </span>
                        <span className="bill-value font-semibold text-neutral-800">
                          :{" "}
                          {(() => {
                            try {
                              return selectedOrderDetails?.createdAt
                                ? new Date(selectedOrderDetails.createdAt).toISOString().split("T")[0]
                                : new Date().toISOString().split("T")[0];
                            } catch {
                              return new Date().toISOString().split("T")[0];
                            }
                          })()}
                        </span>
                      </div>
                      <div className="bill-row grid grid-cols-[85px_1fr] gap-x-2">
                        <span className="bill-label text-neutral-500 font-medium">
                          Invoice #
                        </span>
                        <span className="bill-value font-bold text-neutral-800 uppercase">
                          : IN-
                          {String(
                            selectedOrderDetails?.id || selectedOrderDetails?._id || ""
                          ).slice(-10).toUpperCase()}
                        </span>
                      </div>
                      <div className="bill-row grid grid-cols-[85px_1fr] gap-x-2">
                        <span className="bill-label text-neutral-500 font-medium">
                          Payment
                        </span>
                        <span className="bill-value font-bold text-neutral-800 uppercase">
                          : {selectedOrderDetails.paymentMethod || "COD"}{" "}
                          {isRejectedOrder ? (
                            <span className="text-rose-600 font-black">(CANCELLED)</span>
                          ) : isPaidOrder ? (
                            "(PAID)"
                          ) : (
                            "(DUE)"
                          )}
                        </span>
                      </div>
                      {isRejectedOrder && (
                        <div className="bill-row grid grid-cols-[85px_1fr] gap-x-2">
                          <span className="bill-label text-neutral-500 font-medium">
                            Status
                          </span>
                          <span className="bill-value font-black text-rose-600 uppercase">
                            : REJECTED
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="invoice-table-wrap w-full overflow-hidden">
                    <table className="invoice-table w-full text-xs text-left border-collapse border border-neutral-300 table-fixed">
                      <colgroup>
                        <col className="w-[32%]" style={{ width: "32%" }} />
                        <col className="w-[15%]" style={{ width: "15%" }} />
                        <col className="w-[10%]" style={{ width: "10%" }} />
                        <col className="w-[15%]" style={{ width: "15%" }} />
                        <col className="w-[10%]" style={{ width: "10%" }} />
                        <col className="w-[18%]" style={{ width: "18%" }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-neutral-100 text-neutral-700 uppercase text-[10px] border-b border-neutral-300">
                          <th className="col-items p-2 sm:p-2.5 border-r border-neutral-300">
                            Items
                          </th>
                          <th className="col-price p-2 sm:p-2.5 border-r border-neutral-300 text-right">
                            Unit Price
                          </th>
                          <th className="col-qty p-2 sm:p-2.5 border-r border-neutral-300 text-center">
                            Quantity
                          </th>
                          <th className="col-disc p-2 sm:p-2.5 border-r border-neutral-300 text-right">
                            Discount
                          </th>
                          <th className="col-vat p-2 sm:p-2.5 border-r border-neutral-300 text-right">
                            Vat
                          </th>
                          <th className="col-total p-2 sm:p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item, idx) => {
                          const details = computeInvoiceItemDetails(item);
                          const {
                            origUnitPrice,
                            qty,
                            lineTotal,
                            totalItemDiscount,
                            promoBadge,
                            promoBadgeColor,
                          } = details;

                          return (
                            <tr key={idx} className="border-b border-neutral-200">
                              <td className="col-items p-2 sm:p-2.5 border-r border-neutral-300 font-semibold break-words">
                                <div className="text-neutral-850">
                                  {item.name}{" "}
                                  {item.selectedSize
                                    ? `(${item.selectedSize})`
                                    : ""}
                                </div>
                                {promoBadge && (
                                  <span
                                    className={`promo-badge inline-block mt-1 px-1.5 py-0.2 rounded border text-[9px] font-black uppercase tracking-wider ${promoBadgeColor}`}
                                  >
                                    {promoBadge}
                                  </span>
                                )}
                                {Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                                  <div className="addons-list text-[10px] text-emerald-700 font-normal mt-0.5">
                                    {item.selectedAddons
                                      .map((a) => `+${a.name} (৳${Number(a.price).toFixed(2)})`)
                                      .join(", ")}
                                  </div>
                                )}
                              </td>
                              <td className="col-price p-2 sm:p-2.5 border-r border-neutral-300 text-right font-medium whitespace-nowrap">
                                ৳{origUnitPrice.toFixed(2)}
                              </td>
                              <td className="col-qty p-2 sm:p-2.5 border-r border-neutral-300 text-center font-bold">
                                {qty}
                              </td>
                              <td className="col-disc p-2 sm:p-2.5 border-r border-neutral-300 text-right font-bold text-emerald-600 whitespace-nowrap">
                                {totalItemDiscount > 0
                                  ? `-৳${totalItemDiscount.toFixed(2)}`
                                  : "0.00"}
                              </td>
                              <td className="col-vat p-2 sm:p-2.5 border-r border-neutral-300 text-right font-medium">
                                0.00
                              </td>
                              <td className="col-total p-2 sm:p-2.5 text-right font-extrabold text-neutral-900 whitespace-nowrap">
                                ৳{lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="summary-section flex justify-end pt-2">
                    <div className="summary-box w-full sm:w-80 space-y-1.5 text-xs">
                      {/* 🎯 Subtotal Breakdown */}
                      {orderAddonsTotal > 0 ? (
                        <>
                          <div className="summary-row flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Dishes Base Total:</span>
                            <span className="font-semibold text-neutral-800">
                              ৳{orderDishesBaseTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="summary-row flex justify-between py-1 border-b border-neutral-200 text-emerald-700 font-semibold">
                            <span>Extras & Add-ons:</span>
                            <span>+৳{orderAddonsTotal.toFixed(2)}</span>
                          </div>
                          <div className="summary-row flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Total SD:</span>
                            <span className="font-medium">0.00</span>
                          </div>
                          <div className="summary-row flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Total Vat:</span>
                            <span className="font-medium">0.00</span>
                          </div>
                          <div className="summary-row flex justify-between py-1 border-b border-neutral-200 font-extrabold text-neutral-900 bg-neutral-50 px-1.5 py-1 rounded">
                            <span>Sub Total (Including Vat):</span>
                            <span>৳{subTotal.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="summary-row flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Total SD:</span>
                            <span className="font-medium">0.00</span>
                          </div>
                          <div className="summary-row flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Total Vat:</span>
                            <span className="font-medium">0.00</span>
                          </div>
                          <div className="summary-row flex justify-between py-1 border-b border-neutral-200 font-extrabold text-neutral-900">
                            <span>Sub Total (Including Vat):</span> 
                            <span>৳{subTotal.toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      <div className="summary-row flex justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Service Charge:</span>
                        <span className="font-medium">0.00</span>
                      </div>
                      <div className="summary-row flex justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Shipping Charge:</span>
                        <span className="font-medium">
                          ৳{deliveryCharge.toFixed(2)}
                        </span>
                      </div>

                      {couponDiscount > 0 && (
                        <div className="summary-row flex justify-between py-1 border-b border-neutral-200 font-bold text-emerald-600">
                          <span>
                            Coupon Discount{" "}
                            {couponCodeApplied ? `(${couponCodeApplied})` : ""}:
                          </span>
                          <span>-৳{couponDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {pointsDiscount > 0 && (
                        <div className="summary-row flex justify-between py-1 border-b border-neutral-200 font-bold text-emerald-600">
                          <span>
                            Points ({selectedOrderDetails.pointsRedeemed} pts):
                          </span>
                          <span>-৳{pointsDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="summary-row flex justify-between items-center py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Adjustment:</span>
                        <input
                          type="number"
                          value={
                            adjustments[currentOrderId] !== undefined
                              ? adjustments[currentOrderId]
                              : ""
                          }
                          onChange={(e) => {
                            setAdjustments({
                              ...adjustments,
                              [currentOrderId]: e.target.value,
                            });
                          }}
                          placeholder="0.00"
                          className="w-24 px-2 py-0.5 text-right border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 print:border-none print:bg-transparent"
                        />
                      </div>

                      <div className="summary-row total-row flex justify-between py-1.5 border-b-2 border-neutral-800 font-black text-sm text-neutral-900">
                        <span>Total:</span>
                        <span>৳{grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="summary-row flex justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Advance Amount:</span>
                        <span className="font-semibold text-neutral-800">
                          ৳{advanceAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="summary-row flex justify-between py-1 font-black text-neutral-900">
                        <span>{isRejectedOrder ? "Remaining Due:" : "Remaining Amount:"}</span>
                        <span className={remainingAmount > 0 ? "text-rose-600" : isRejectedOrder ? "text-rose-600 font-bold" : "text-emerald-600"}>
                          ৳{remainingAmount.toFixed(2)} {isRejectedOrder ? "(VOID / CANCELLED)" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="words-section pt-2 text-xs text-neutral-600 font-medium">
                    Amount in Words:{" "}
                    <span className="italic font-bold text-neutral-800 capitalize">
                      {isRejectedOrder ? "Zero Taka (Void / Cancelled Invoice)" : numberToWords(grandTotal)}
                    </span>
                  </div>

                  {/* 🚫 Official Notice for Void / Cancelled Invoices */}
                  {isRejectedOrder && (
                    <div className="p-3 mt-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      ⚠️ NOTICE: This order was rejected and cancelled by restaurant administration. This invoice is officially VOID / CANCELLED and invalid for food collection, delivery, or payment.
                      {selectedOrderDetails.pointsRedeemed > 0 && (
                        <span className="block text-[10px] text-emerald-600 mt-0.5 font-bold">
                          🪙 {selectedOrderDetails.pointsRedeemed} Loyalty Points have been restored to customer account.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 🎯 Invoice Footer (Pinned at Bottom) */}
                <div className="invoice-footer w-full shrink-0 mt-auto pt-6 text-center">
                  <img
                    src={invoiceFooterImg}
                    alt="Barcode Restaurant Group Footer"
                    className="w-full h-auto max-h-[50px] object-fill block mx-auto"
                  />
                </div>
              </div>

              {String(
                selectedOrderDetails.paymentMethod || "cod",
              ).toLowerCase() !== "cod" &&
                selectedOrderDetails.paymentStatus !== "Paid" &&
                selectedOrderDetails.status !== "Rejected" && (
                  <div className="pt-2 print:hidden">
                    <button
                      type="button"
                      onClick={() =>
                        handleRecheckPayment(
                          selectedOrderDetails.id || selectedOrderDetails._id,
                        )
                      }
                      disabled={
                        recheckingOrderId ===
                        (selectedOrderDetails.id || selectedOrderDetails._id)
                      }
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary-500/30 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold text-[10px] uppercase tracking-wide hover:bg-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${recheckingOrderId === (selectedOrderDetails.id || selectedOrderDetails._id) ? "animate-spin" : ""}`}
                      />
                      {recheckingOrderId ===
                      (selectedOrderDetails.id || selectedOrderDetails._id)
                        ? "Checking with gateway…"
                        : "Re-check payment with gateway"}
                    </button>
                  </div>
                )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📥 EXPORT SALES MODAL */}
      <ExportSalesModal
        isOpen={isExportSalesModalOpen}
        onClose={() => setIsExportSalesModalOpen(false)}
        orders={orders}
      />
    </div>
  );
};

export default AdminOrders;
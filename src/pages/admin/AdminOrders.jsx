import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { ErrorBanner } from "../../components/ErrorBanner";
import {
  getAllOrders,
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
    const id = item?.id || item?._id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const formatShortOrderId = (id) => {
  if (!id) return "";
  const strId = String(id).toUpperCase();
  if (strId.length <= 10) return strId;
  return `${strId.slice(0, 4)}...${strId.slice(-5)}`;
};

const getItemPayableTotal = (item) => {
  const price = Number(item.price) || 0;
  const qty = Number(item.quantity) || 0;
  const fullGross = price * qty;

  const oType = item.offerType;
  const isBogo1g1 = oType === "bogo_1g1" || item.isBogo;
  const isBogo1g2 = oType === "bogo_1g2";

  if (isBogo1g1) {
    const paidQuantity = Math.ceil(qty / 2);
    return price * paidQuantity;
  }

  if (isBogo1g2) {
    const paidQuantity = Math.ceil(qty / 3);
    return price * paidQuantity;
  }

  const itemDiscountPct = Number(item.discountPct) || 0;
  if (itemDiscountPct > 0) {
    return fullGross - (fullGross * itemDiscountPct) / 100;
  }

  const itemDiscountAmount =
    Number(item.discountAmount) || Number(item.discount) || 0;
  if (itemDiscountAmount > 0) {
    return Math.max(0, fullGross - itemDiscountAmount);
  }

  return fullGross;
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
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [, setBranches] = useState([]);
  const [, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [recheckingOrderId, setRecheckingOrderId] = useState(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [adminChatMessage, setAdminChatMessage] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [adjustments, setAdjustments] = useState({});

  const chatEndRef = useRef(null);
  const invoiceRef = useRef(null);
  const currentChat = orders.find((o) => (o.id || o._id) === activeChatOrderId);
  const chatMessagesCount = currentChat?.chatHistory?.length || 0;

  const applyResult = (result, setter, transform, label) => {
    if (result.status === "fulfilled") {
      setter(transform(result.value));
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
    const handleNewOrderIncoming = (newOrder) => {
      setOrders((prev) => {
        const newId = newOrder?.id || newOrder?._id;
        if (!newId) return prev;
        const exists = prev.some((o) => (o.id || o._id) === newId);

        if (exists) {
          return prev.map((o) =>
            (o.id || o._id) === newId ? { ...o, ...newOrder } : o,
          );
        }
        return [newOrder, ...prev];
      });
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId: newOrder?.id || newOrder?._id },
        }),
      );
    };

    const handleOrderUpdated = (updatedOrder) => {
      const updatedId = updatedOrder?.id || updatedOrder?._id;
      setOrders((prev) =>
        prev.map((o) => {
          if ((o.id || o._id) === updatedId) {
            return { ...o, ...updatedOrder };
          }
          return o;
        }),
      );
      setSelectedOrderDetails((prev) =>
        (prev?.id || prev?._id) === updatedId
          ? { ...prev, ...updatedOrder }
          : prev,
      );
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId: updatedId, id: updatedId },
        }),
      );
    };

    const handlePendingCount = () => {
      window.dispatchEvent(new CustomEvent("order_updated"));
    };

    const handleRiderUpdated = (updatedRider) => {
      const updatedId = updatedRider?.id || updatedRider?._id;
      if (!updatedId) return;
      setRiders((prev) =>
        prev.map((r) =>
          (r.id || r._id) === updatedId ? { ...r, ...updatedRider } : r,
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
    socket.on("rider_updated", handleRiderUpdated);
    socket.on("new_chat_message", handleChatMessage);

    return () => {
      socket.off("order_created", handleNewOrderIncoming);
      socket.off("order_updated", handleOrderUpdated);
      socket.off("pending_count_updated", handlePendingCount);
      socket.off("rider_updated", handleRiderUpdated);
      socket.off("new_chat_message", handleChatMessage);
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current && activeChatOrderId) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
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

  const handlePrint = (e) => {
    if (e) e.preventDefault();
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const invoiceNumber = (selectedOrderDetails?.id || selectedOrderDetails?._id || '').slice(-10).toUpperCase();
    const WindowPrt = window.open(
      "",
      "_blank",
      "left=0,top=0,width=850,height=950",
    );
    if (!WindowPrt) {
      toast.error("Please allow popups for this website to print.");
      return;
    }

    WindowPrt.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${invoiceNumber}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: portrait;
      margin: 0;
    }
    @media print {
      *, *::before, *::after {
        box-sizing: border-box !important;
      }
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-container {
        width: 100% !important;
        min-height: 100vh !important;
        height: 100vh !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
        padding: 8mm 10mm 6mm 10mm !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
      .invoice-header {
        flex-shrink: 0 !important;
        width: 100% !important;
      }
      .invoice-content {
        flex-grow: 1 !important;
      }
      .invoice-footer {
        flex-shrink: 0 !important;
        width: 100% !important;
        margin-top: auto !important;
        page-break-inside: avoid !important;
      }
      .no-print {
        display: none !important;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #111827;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-container {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      padding: 8mm 10mm 6mm 10mm;
    }
    .invoice-header {
      flex-shrink: 0;
      width: 100%;
    }
    .invoice-content {
      flex-grow: 1;
    }
    .invoice-footer {
      flex-shrink: 0;
      width: 100%;
      margin-top: auto;
    }
  </style>
</head>
<body>
  ${printContent.outerHTML}
</body>
</html>`);
    WindowPrt.document.close();
    WindowPrt.focus();
    setTimeout(() => {
      WindowPrt.print();
      WindowPrt.close();
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

  const currentOrderId = selectedOrderDetails?.id || selectedOrderDetails?._id;
  const currentAdjustment = parseFloat(adjustments[currentOrderId]) || 0;

  const orderItems =
    selectedOrderDetails?.items || selectedOrderDetails?.cart || [];

  const subTotal = orderItems.reduce(
    (sum, item) => sum + getItemPayableTotal(item),
    0,
  );

  const orderAddonsTotal = orderItems.reduce((sum, item) => {
    const itemAddons = Array.isArray(item.selectedAddons)
      ? item.selectedAddons.reduce((s, a) => s + (Number(a.price) || 0), 0)
      : 0;
    return sum + itemAddons * (Number(item.quantity) || 1);
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

  const deliveryCharge = Number(selectedOrderDetails?.deliveryCharge) || 0;
  const grandTotal = Math.max(
    0,
    subTotal + deliveryCharge + currentAdjustment - couponDiscount,
  );

  return (
    <div className="w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto space-y-6">
      <Toaster />

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Orders & Live Chat
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Monitor incoming food deliveries, update delivery stages, and chat
            with customers/riders.
          </p>
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
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-12 text-neutral-400 font-medium"
                    >
                      {loadError
                        ? "Orders could not be loaded — see the message above."
                        : "No orders found."}
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const ordId = ord.id || ord._id;
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

                    const assignedRiderId =
                      ord.riderId || ord.rider?._id || ord.rider?.id || "";

                    return (
                      <tr
                        key={ordId}
                        className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-955/20 transition-colors"
                      >
                        <td
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="px-3 py-3 sm:px-4 font-bold text-primary-500 hover:text-primary-600 hover:underline cursor-pointer uppercase transition-colors whitespace-nowrap"
                          title={ordId}
                        >
                          {formatShortOrderId(ordId)}
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
                          <span
                            className="block text-neutral-600 dark:text-neutral-300 font-light truncate max-w-[140px] 2xl:max-w-[200px]"
                            title={ord.user?.address || ord.deliveryAddress}
                          >
                            {ord.user?.address || ord.deliveryAddress || "-"}
                          </span>
                          <span className="block text-[10px] text-neutral-400 mt-0.5 truncate max-w-[140px] 2xl:max-w-[200px]">
                            {ord.user?.pickArea || ord.area || ""}
                          </span>
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
                          ) : (
                            <div>
                              <select
                                value={ord.status}
                                disabled={
                                  !assignedRiderId ||
                                  ord.riderAcceptStatus !== "accepted"
                                }
                                onChange={(e) =>
                                  handleStatusChange(ordId, e.target.value)
                                }
                                className={`px-1.5 py-1 rounded-lg border font-bold text-[10px] uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                                  !assignedRiderId ||
                                  ord.riderAcceptStatus !== "accepted"
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-75"
                                    : `${getStatusColor(ord.status)} cursor-pointer`
                                }`}
                              >
                                <option value="Accepted">Accepted</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready to Pick">
                                  Ready to Pick
                                </option>
                                <option value="Out for Delivery">
                                  Out for Delivery
                                </option>
                                <option value="Delivered">Delivered</option>
                              </select>

                              {(!assignedRiderId ||
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
                              {riders.map((r) => (
                                <option
                                  key={r.id || r._id}
                                  value={r.id || r._id}
                                >
                                  {r.name} (
                                  {r.vehicle || r.vehicleType || "RIDER"})
                                </option>
                              ))}
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

              <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between shrink-0">
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

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-neutral-955/20">
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
                className="invoice-container bg-white text-neutral-800 p-6 sm:p-8 flex flex-col justify-between min-h-[960px] text-xs font-sans"
              >
                {/* 🎯 Invoice Header (Pinned at Top) */}
                <div className="invoice-header w-full shrink-0 pb-2">
                  <img
                    src={invoiceHeaderImg}
                    alt="Barcode Restaurant Group Header"
                    className="w-full h-auto object-contain block"
                  />
                  <div className="text-center font-bold text-base tracking-widest uppercase text-neutral-800 py-1.5 border-b border-neutral-200 mt-2">
                    Invoice
                  </div>
                </div>

                {/* 🎯 Invoice Body Content (Middle Space) */}
                <div className="invoice-content flex-grow space-y-5 py-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <div className="space-y-1.5 flex-1">
                      <p className="font-bold text-neutral-900 uppercase text-[11px] mb-2">
                        Bill To:
                      </p>
                      <div className="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                        <span className="text-neutral-500 font-medium">
                          Customer Name
                        </span>
                        <span className="font-bold text-neutral-800">
                          :{" "}
                          {selectedOrderDetails.user?.name ||
                            selectedOrderDetails.customerName ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                        <span className="text-neutral-500 font-medium">
                          Mobile
                        </span>
                        <span className="font-semibold text-neutral-800">
                          :{" "}
                          {selectedOrderDetails.user?.phone ||
                            selectedOrderDetails.customerPhone ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                        <span className="text-neutral-500 font-medium">
                          Address
                        </span>
                        <span className="text-neutral-800">
                          :{" "}
                          {selectedOrderDetails.user?.address ||
                            selectedOrderDetails.deliveryAddress ||
                            "N/A"}{" "}
                          {selectedOrderDetails.user?.pickArea
                            ? `(${selectedOrderDetails.user?.pickArea})`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 w-full sm:w-64 pt-6 sm:pt-0">
                      <div className="grid grid-cols-[100px_1fr] gap-x-2 text-xs">
                        <span className="text-neutral-500 font-medium">
                          Invoice Date
                        </span>
                        <span className="font-semibold text-neutral-800">
                          :{" "}
                          {
                            new Date(selectedOrderDetails.createdAt || Date.now())
                              .toISOString()
                              .split("T")[0]
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-x-2 text-xs">
                        <span className="text-neutral-500 font-medium">
                          Invoice #
                        </span>
                        <span className="font-bold text-neutral-800 uppercase">
                          : IN-
                          {(
                            selectedOrderDetails.id || selectedOrderDetails._id
                          )?.slice(-10)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-neutral-300">
                      <thead>
                        <tr className="bg-neutral-100 text-neutral-700 uppercase text-[10px] border-b border-neutral-300">
                          <th className="p-2.5 border-r border-neutral-300">
                            Items
                          </th>
                          <th className="p-2.5 border-r border-neutral-300 text-right">
                            Unit Price
                          </th>
                          <th className="p-2.5 border-r border-neutral-300 text-center">
                            Quantity
                          </th>
                          <th className="p-2.5 border-r border-neutral-300 text-right">
                            Discount / Free
                          </th>
                          <th className="p-2.5 border-r border-neutral-300 text-right">
                            Vat
                          </th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item, idx) => {
                          const qty = Number(item.quantity) || 1;
                          const unitPrice = Number(item.price) || 0;

                          const detectedOfferType = item.offerType;
                          const isBogo1g1 =
                            detectedOfferType === "bogo_1g1" || item.isBogo;
                          const isBogo1g2 = detectedOfferType === "bogo_1g2";

                          const itemDiscountPct = Number(item.discountPct) || 0;
                          const itemDiscountAmount =
                            Number(item.discountAmount) || 0;
                          const directDiscount = Number(item.discount) || 0;

                          const fullGross = unitPrice * qty;
                          let netPayable = fullGross;

                          if (isBogo1g1) {
                            const paidQuantity = Math.ceil(qty / 2);
                            netPayable = unitPrice * paidQuantity;
                          } else if (isBogo1g2) {
                            const paidQuantity = Math.ceil(qty / 3);
                            netPayable = unitPrice * paidQuantity;
                          } else if (itemDiscountPct > 0) {
                            netPayable =
                              fullGross - (fullGross * itemDiscountPct) / 100;
                          } else if (itemDiscountAmount > 0) {
                            netPayable = Math.max(
                              0,
                              fullGross - itemDiscountAmount * qty,
                            );
                          } else if (directDiscount > 0) {
                            netPayable = Math.max(0, fullGross - directDiscount);
                          }

                          const freeDiscount = Math.max(
                            0,
                            fullGross - netPayable,
                          );

                          return (
                            <tr key={idx} className="border-b border-neutral-200">
                              <td className="p-2.5 border-r border-neutral-300 font-bold">
                                {item.name}{" "}
                                {item.selectedSize
                                  ? `(${item.selectedSize})`
                                  : ""}
                                {Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                                  <div className="text-[10px] text-emerald-700 font-normal mt-0.5">
                                    {item.selectedAddons.map((a) => `+${a.name} (৳${a.price})`).join(", ")}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 border-r border-neutral-300 text-right">
                                ৳{unitPrice.toFixed(2)}
                              </td>
                              <td className="p-2.5 border-r border-neutral-300 text-center font-bold">
                                {qty}
                              </td>
                              <td className="p-2.5 border-r border-neutral-300 text-right font-extrabold text-emerald-600">
                                {freeDiscount > 0
                                  ? `-৳${freeDiscount.toFixed(2)}`
                                  : "0.00"}
                              </td>
                              <td className="p-2.5 border-r border-neutral-300 text-right">
                                0.00
                              </td>
                              <td className="p-2.5 text-right font-extrabold text-neutral-900">
                                ৳{netPayable.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <div className="w-full sm:w-80 space-y-1.5 text-xs">
                      {/* 🎯 Subtotal Breakdown: Add-ons থাকলে সুন্দর স্প্লিট, না থাকলে As It Is */}
                      {orderAddonsTotal > 0 ? (
                        <>
                          <div className="flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Dishes Base Total:</span>
                            <span className="font-semibold text-neutral-800">
                              ৳{orderDishesBaseTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-neutral-200 text-emerald-700 font-semibold">
                            <span>Extras & Add-ons:</span>
                            <span>+৳{orderAddonsTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Total SD:</span>
                            <span className="font-medium">0.00</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Total Vat:</span>
                            <span className="font-medium">0.00</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-neutral-200 font-extrabold text-neutral-900 bg-neutral-50 px-1 rounded">
                            <span>Sub Total (Including Tax & Add-ons):</span>
                            <span>৳{subTotal.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Total SD:</span>
                            <span className="font-medium">0.00</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Total Vat:</span>
                            <span className="font-medium">0.00</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-neutral-200 font-extrabold text-neutral-900">
                            <span>Sub Total (Including Tax):</span>
                            <span>৳{subTotal.toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Service Charge:</span>
                        <span className="font-medium">0.00</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Shipping Charge:</span>
                        <span className="font-medium">
                          ৳{deliveryCharge.toFixed(2)}
                        </span>
                      </div>

                      {couponDiscount > 0 && (
                        <div className="flex justify-between py-1 border-b border-neutral-200 font-semibold text-emerald-600">
                          <span>
                            Discount{" "}
                            {couponCodeApplied ? `(${couponCodeApplied})` : ""}:
                          </span>
                          <span>-৳{couponDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1 border-b border-neutral-200">
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

                      <div className="flex justify-between py-1.5 border-b-2 border-neutral-800 font-black text-sm text-neutral-900">
                        <span>Total:</span>
                        <span>৳{grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Advance Amount:</span>
                        <span className="font-medium">0.00</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-black text-neutral-900">
                        <span>Remaining Amount:</span>
                        <span>৳{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-neutral-600 font-medium">
                    Amount in Words (BDT):{" "}
                    <span className="italic font-semibold text-neutral-800 uppercase">
                      BDT {grandTotal.toFixed(0)} Taka Only
                    </span>
                  </div>
                </div>

                {/* 🎯 Invoice Footer (Pinned at Bottom) */}
                <div className="invoice-footer w-full shrink-0 mt-auto pt-6">
                  <img
                    src={invoiceFooterImg}
                    alt="Barcode Restaurant Group Footer"
                    className="w-full h-auto object-contain block"
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
    </div>
  );
};

export default AdminOrders;
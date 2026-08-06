import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  MessageSquare,
  Send,
  X,
  Check,
  MapPin,
  User,
  Phone,
  Utensils,
  RefreshCw,
  BellRing,
  Printer,
  Gift,
} from "lucide-react";
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

// Socket Client Connection Import
import { socket } from "../../services/socket";

// ⚡ ডুপ্লিকেট অর্ডার রিমুভ করার হেলপার
const deduplicateOrders = (orderList) => {
  if (!Array.isArray(orderList)) return [];
  const seen = new Set();
  return orderList.filter((item) => {
    const id = item?.id || item?._id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// 🎯 Order ID সংক্ষেপ করার হেলপার ফাংশন (যেমন: 6A6D...C7F90)
const formatShortOrderId = (id) => {
  if (!id) return "";
  const strId = String(id).toUpperCase();
  if (strId.length <= 10) return strId;
  return `${strId.slice(0, 4)}...${strId.slice(-5)}`;
};

// 🎯 BOGO Offer Text Helper Function
const getOfferText = (offerType) => {
  if (offerType === "bogo_1g1") return "BUY 1 GET 1 FREE";
  if (offerType === "bogo_1g2") return "BUY 1 GET 2 FREE";
  if (offerType === "combo") return "SPECIAL COMBO DEAL";
  return null;
};

// 🎯 BOGO এবং নরমাল ডিসকাউন্ট বিবেচনা করে প্রতিটি আইটেমের লাইন টোটাল হিসেব করার হেলপার
const getItemPayableTotal = (item) => {
  const name = String(item.name || "").toLowerCase();
  const price = Number(item.price) || 0;
  const qty = Number(item.quantity) || 0;

  let oType = item.offerType;
  if (!oType) {
    if (name.includes("fuchka platter") && qty >= 3) oType = "bogo_1g2";
  }

  if (oType === "bogo_1g1") {
    const paidQuantity = Math.ceil(qty / 2);
    return price * paidQuantity;
  }

  if (oType === "bogo_1g2") {
    const paidQuantity = Math.ceil(qty / 3);
    return price * paidQuantity;
  }

  return price * qty;
};

// 🎯 পেমেন্ট ব্যাজ লজিক
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

// 🟡 Delivery Status Color Handler
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
  const [recheckingOrderId, setRecheckingOrderId] = useState(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [adminChatMessage, setAdminChatMessage] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [adjustments, setAdjustments] = useState({});

  const chatEndRef = useRef(null);
  const invoiceRef = useRef(null);
  const currentChat = orders.find((o) => (o.id || o._id) === activeChatOrderId);
  const chatMessagesCount = currentChat?.chatHistory?.length || 0;

  const fetchOrdersAndFleet = () =>
    Promise.all([getAllOrders(), getAllRiders()])
      .then(([ordersData, ridersData]) => {
        // নতুন ডেটা আসার পর সাইলেন্টলি স্টেট আপডেট করবে, মেইন loading ট্রিগার করবে না
        setOrders(deduplicateOrders(ordersData || []));
        setRiders(ridersData || []);
        window.dispatchEvent(new CustomEvent("order_updated"));
        return ordersData || [];
      })
      .catch((err) => console.error("Orders/fleet sync failed:", err));

  useEffect(() => {
    Promise.all([
      getAllOrders(),
      getAllRiders(),
      getAllBranches(),
      getAllRegions(),
    ])
      .then(([ordersData, ridersData, branchesData, regionsData]) => {
        setOrders(deduplicateOrders(ordersData || []));
        setRiders(ridersData || []);
        setBranches(branchesData || []);
        setRegions(Array.isArray(regionsData) ? regionsData : []);
        window.dispatchEvent(new CustomEvent("order_updated"));
      })
      .catch((err) => console.error("Error loading admin orders data:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // ⚡ ডাবল ট্রিগার এড়ানোর জন্য সেফটি চেক
    const handleNewOrderIncoming = (newOrder) => {
      setOrders((prev) => {
        const newId = newOrder?.id || newOrder?._id;
        if (!newId) return prev;
        const exists = prev.some((o) => (o.id || o._id) === newId);

        // যদি অর্ডারটি অলরেডি স্টেট-এ থেকে থাকে, তবে ডাবল কাউন্ট বা সাউন্ড হতে দেব না
        if (exists) {
          return prev.map((o) => ((o.id || o._id) === newId ? newOrder : o));
        }
        return [newOrder, ...prev];
      });
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId: newOrder?.id || newOrder?._id },
        }),
      );
    };

    // যেকোনো একটিভ সকেট ইভেন্ট ব্যবহার করুন অথবা একটিকে কমেন্ট করে দিন যাতে ডাবল ফায়ার না হয়
    socket.on("order_created", handleNewOrderIncoming);
    // socket.on("admin_new_order", handleNewOrderIncoming); // 👈 ডাবল ট্রিগার রোধ করতে এটি অফ রাখতে পারেন

    socket.on("order_updated", (updatedOrder) => {
      const updatedId = updatedOrder?.id || updatedOrder?._id;
      setOrders((prev) =>
        prev.map((o) => ((o.id || o._id) === updatedId ? updatedOrder : o)),
      );
      setSelectedOrderDetails((prev) =>
        (prev?.id || prev?._id) === updatedId ? updatedOrder : prev,
      );
      window.dispatchEvent(
        new CustomEvent("order_updated", {
          detail: { orderId: updatedId, id: updatedId },
        }),
      );
    });

    socket.on("pending_count_updated", () => {
      window.dispatchEvent(new CustomEvent("order_updated"));
    });

    socket.on("rider_updated", (updatedRider) => {
      setRiders((prev) =>
        prev.map((r) => (r.id === updatedRider.id ? updatedRider : r)),
      );
    });

    socket.on("new_chat_message", ({ orderId, message }) => {
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
    });

    return () => {
      socket.off("order_created", handleNewOrderIncoming);
      socket.off("admin_new_order", handleNewOrderIncoming);
      socket.off("order_updated");
      socket.off("pending_count_updated");
      socket.off("rider_updated");
      socket.off("new_chat_message");
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

    const WindowPrt = window.open(
      "",
      "_blank",
      "left=0,top=0,width=800,height=900",
    );
    if (!WindowPrt) {
      toast.error("Please allow popups for this website to print.");
      return;
    }
    WindowPrt.document.write("<html><head><title>Barcode Invoice</title>");
    WindowPrt.document.write(
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    WindowPrt.document.write(
      "<style>body { font-family: Arial, sans-serif; background: #fff; color: #111; }</style>",
    );
    WindowPrt.document.write('</head><body class="p-8">');
    WindowPrt.document.write(printContent.innerHTML);
    WindowPrt.document.write("</body></html>");
    WindowPrt.document.close();
    WindowPrt.focus();
    setTimeout(() => {
      WindowPrt.print();
      WindowPrt.close();
    }, 500);
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
      // 🎯 ইনস্ট্যান্ট লোকাল আপডেট (সম্পূর্ণ অর্ডার অবজেক্ট অক্ষুণ্ণ রেখে শুধু স্ট্যাটাস আপডেট হবে)
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

      const updatedOrder = await updateOrderStatus(orderId, newStatus);

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

      // ব্যাকএন্ড থেকে লেটেস্ট ডেটা সাইলেন্টলি সিঙ্ক করা
      const freshOrders = await getAllOrders();
      if (Array.isArray(freshOrders)) {
        setOrders(deduplicateOrders(freshOrders));
      }

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
    const selectedRider = riders.find((r) => r.id === riderId);
    if (!selectedRider) return;
    try {
      // 🎯 ইনস্ট্যান্ট লোকাল আপডেট (যাতে রাইডার এসাইন করার সাথে সাথে স্টেট আপডেট হয়ে যায়)
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          const ordId = ord.id || ord._id;
          if (ordId === orderId) {
            return {
              ...ord,
              riderId: riderId,
              riderName: selectedRider.name,
              riderPhone: selectedRider.phone || "",
              riderAcceptStatus: "pending", // রাইডার এসাইন হলে পেন্ডিং থাকবে যতক্ষণ না সে এক্সেপ্ট করে
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
      
      // ব্যাকগ্রাউন্ডে লেটেস্ট ডেটা সিঙ্ক করা
      const freshOrders = await getAllOrders();
      if (Array.isArray(freshOrders)) {
        setOrders(deduplicateOrders(freshOrders));
      }
    } catch (err) {
      toast.error("Failed to assign rider: " + err.message);
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

  const deliveryCharge = selectedOrderDetails?.deliveryCharge || 0;
  const grandTotal = subTotal + deliveryCharge + currentAdjustment;

  return (
    <div className="w-full space-y-6">
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

      <div className="w-full flex flex-col gap-6">
        {/* Table List Container */}
        <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-xs text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900 sticky top-0 z-20 shadow-xs">
                  <th className="px-2.5 py-3.5">Order ID</th>
                  <th className="px-2.5 py-3.5">Customer</th>
                  <th className="px-2.5 py-3.5">Address</th>
                  <th className="px-2.5 py-3.5">Total Amount</th>
                  <th className="px-2.5 py-3.5">Order Action</th>
                  <th className="px-2.5 py-3.5">Delivery Status</th>
                  <th className="px-2.5 py-3.5">Assigned Rider</th>
                  <th className="px-2.5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const ordId = ord.id || ord._id;
                  const currentStatus = String(ord.status || "").toUpperCase();

                  const isPendingUnhandled =
                    currentStatus === "PLACED" ||
                    currentStatus === "PENDING" ||
                    currentStatus === "AWAITING PAYMENT" ||
                    currentStatus === "AWAITING_PAYMENT" ||
                    !ord.status;

                  const isRejected = currentStatus === "REJECTED";
                  const badge = getPaymentBadge(ord);

                  return (
                    <tr
                      key={ordId}
                      className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20 transition-colors"
                    >
                      {/* 🎯 Order ID Column — ট্রাঙ্কেট ফর্মে দেখাবে (যেমন: 6A6D...C7F90) */}
                      <td
                        onClick={() => setSelectedOrderDetails(ord)}
                        className="px-2.5 py-3 font-bold text-primary-500 hover:text-primary-600 hover:underline cursor-pointer uppercase transition-colors whitespace-nowrap"
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

                      {/* Customer Column */}
                      <td className="px-2.5 py-3">
                        <span className="block font-semibold text-neutral-850 dark:text-white truncate max-w-[110px]">
                          {ord.user?.name}
                        </span>
                        <span className="block text-[10px] text-neutral-400 mt-0.5">
                          {ord.user?.phone}
                        </span>
                      </td>

                      {/* Address Column — নির্দিষ্ট উইডথ শেষে ... চলে আসবে */}
                      <td className="px-2.5 py-3">
                        <span
                          className="block text-neutral-600 dark:text-neutral-300 font-light truncate max-w-[120px]"
                          title={ord.user?.address}
                        >
                          {ord.user?.address}
                        </span>
                        <span className="block text-[10px] text-neutral-400 mt-0.5 truncate max-w-[120px]">
                          {ord.user?.pickArea}
                        </span>
                      </td>

                      {/* Total Amount Column */}
                      <td className="px-2.5 py-3 font-bold text-primary-500 whitespace-nowrap">
                        ৳{ord.total?.toFixed(2)}
                      </td>

                      {/* Order Action Column */}
                      <td className="px-2.5 py-3 whitespace-nowrap">
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

                      {/* Delivery Status Column */}
                      <td className="px-2.5 py-3 whitespace-nowrap">
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
                              value={
                                ord.riderAcceptStatus === "accepted" &&
                                (ord.status === "Accepted" ||
                                  ord.status === "ACCEPTED")
                                  ? "Preparing"
                                  : ord.status
                              }
                              disabled={
                                !ord.riderId ||
                                ord.riderAcceptStatus !== "accepted"
                              }
                              onChange={(e) =>
                                handleStatusChange(ordId, e.target.value)
                              }
                              className={`px-1.5 py-1 rounded-lg border font-bold text-[10px] uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                                !ord.riderId ||
                                ord.riderAcceptStatus !== "accepted"
                                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-75"
                                  : `${getStatusColor(
                                      ord.riderAcceptStatus === "accepted" &&
                                        (ord.status === "Accepted" ||
                                          ord.status === "ACCEPTED")
                                        ? "Preparing"
                                        : ord.status,
                                    )} cursor-pointer`
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

                            {(!ord.riderId ||
                              ord.riderAcceptStatus !== "accepted") && (
                              <span className="block text-[9px] text-orange-500 font-bold mt-0.5 tracking-tight">
                                {!ord.riderId
                                  ? "Assign Rider First"
                                  : "Awaiting Rider Accept"}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Assigned Rider Column */}
                      <td className="px-2.5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <select
                            value={ord.riderId || ""}
                            disabled={
                              isPendingUnhandled ||
                              isRejected ||
                              ord.status === "Delivered"
                            }
                            onChange={(e) =>
                              handleAssignRider(ordId, e.target.value)
                            }
                            className={`px-1.5 py-1 rounded-lg border font-bold text-[9px] uppercase focus:outline-none focus:ring-1 focus:ring-primary-500 max-w-[125px] ${
                              isPendingUnhandled ||
                              isRejected ||
                              ord.status === "Delivered"
                                ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed"
                                : "bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 cursor-pointer border-neutral-200 dark:border-neutral-800"
                            }`}
                          >
                            <option value="">-- Assign Rider --</option>
                            {riders.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.vehicle})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-2.5 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setActiveChatOrderId(ordId)}
                          className={`p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:border-primary-500/40 active:scale-95 transition-all cursor-pointer ${
                            activeChatOrderId === ordId
                              ? "bg-primary-500/10 text-primary-500 border-primary-500/30"
                              : ""
                          }`}
                          title="Open Live Chat Console"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 💬 Live Chat Modal Popup */}
      <AnimatePresence>
        {activeChatOrderId && currentChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg flex flex-col h-[580px] bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                    Live Chat for Order #
                    {(currentChat.id || currentChat._id)?.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Customer: {currentChat.user?.name || "Guest"} (
                    {currentChat.user?.phone})
                  </p>
                </div>
                <button
                  onClick={() => setActiveChatOrderId(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Kitchen Alert */}
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

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-neutral-950/20">
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

              {/* Input Form */}
              <form
                onSubmit={(e) => handleSendAdminMessage(e, null)}
                className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={adminChatMessage}
                  onChange={(e) => setAdminChatMessage(e.target.value)}
                  placeholder="Type message as Barcode Admin..."
                  className="flex-grow px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
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

      {/* Order Details & Official Barcode Invoice Modal */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6"
            >
              {/* Modal Top Action Bar */}
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

              {/* 🧾 অফিশিয়াল ইনভয়েস প্রিন্ট লেআউট */}
              <div
                ref={invoiceRef}
                className="bg-white text-neutral-800 p-6 space-y-6 text-xs font-sans"
              >
                {/* ১. হেডার সেশন */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-neutral-800 gap-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-wider text-rose-900 uppercase">
                      BARCODE
                    </h1>
                    <h2 className="text-sm font-bold tracking-widest text-neutral-800 uppercase">
                      RESTAURANT GROUP
                    </h2>
                    <p className="text-[9px] text-neutral-500 tracking-wider mt-0.5">
                      concern of N. MOHAMMAD GROUP
                    </p>
                  </div>
                  <div className="text-left sm:text-right border-l-2 sm:border-l-2 border-neutral-300 pl-3 sm:pl-4">
                    <p className="font-bold text-[11px] text-neutral-800">
                      Head Office: N. Mohammad Engineering Industries Ltd.
                    </p>
                    <p className="text-[10px] text-neutral-600">
                      222/250, Paschim Sholasahar, C.D.A Avenue, Muradpur,
                      Chittagong.
                    </p>
                    <p className="text-[10px] text-neutral-600">
                      Phone: +88 031 6553558
                    </p>
                  </div>
                </div>

                {/* ইনভয়েস টাইটেল */}
                <div className="text-center font-bold text-sm tracking-widest uppercase text-neutral-700 py-1">
                  Invoice
                </div>

                {/* ২. বিল টু ও ইনভয়েস ইনফো */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div className="space-y-1.5 flex-1">
                    <p className="font-bold text-neutral-900 uppercase text-[11px] border-b pb-1 mb-2">
                      Bill To:
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-neutral-500 font-medium">
                        Customer Name
                      </span>
                      <span className="col-span-2 font-bold text-neutral-800">
                        : {selectedOrderDetails.user?.name || "N/A"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-neutral-500 font-medium">
                        Mobile
                      </span>
                      <span className="col-span-2 font-semibold text-neutral-800">
                        : {selectedOrderDetails.user?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-neutral-500 font-medium">
                        Address
                      </span>
                      <span className="col-span-2 text-neutral-800">
                        : {selectedOrderDetails.user?.address || "N/A"}{" "}
                        {selectedOrderDetails.user?.pickArea
                          ? `(${selectedOrderDetails.user?.pickArea})`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 w-full sm:w-72">
                    <div className="grid grid-cols-2 gap-1">
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
                    <div className="grid grid-cols-2 gap-1">
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

                {/* ৩. লজিক্যাল আইটেম টেবিল */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-neutral-300">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-700 uppercase text-[10px] border-b border-neutral-300">
                        <th className="p-2.5 border-r border-neutral-300">
                          Custom Item
                        </th>
                        <th className="p-2.5 border-r border-neutral-300">
                          Description
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
                          TAX
                        </th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, idx) => {
                        const itemName = String(item.name || "").toLowerCase();
                        const qty = Number(item.quantity) || 1;
                        const unitPrice = Number(item.price) || 0;

                        // 🔍 চেকআউট পেজের সাথে হুবহু মিলিয়ে অফার ও ডিসকাউন্ট ডেটেকশন
                        let detectedOfferType = item.offerType;
                        let origUnitPrice =
                          Number(item.originalPrice) ||
                          Number(item.basePrice) ||
                          unitPrice;

                        if (origUnitPrice < unitPrice) {
                          origUnitPrice = unitPrice;
                        }

                        // ফুচকা বা অন্যান্য অফার অটো-ডিটেক্ট
                        if (
                          !detectedOfferType ||
                          detectedOfferType === "none"
                        ) {
                          if (itemName.includes("fuchka platter") && qty >= 3) {
                            detectedOfferType = "bogo_1g2";
                          } else if (item.isBogo || item.freeQty > 0) {
                            detectedOfferType = "bogo_1g1";
                          }
                        }

                        // অফার লেবেল বা ডিসকাউন্ট ডেসক্রিপশন তৈরি
                        let offerLabel = getOfferText(detectedOfferType);
                        const itemDiscountPct = Number(item.discountPct) || 0;
                        const itemDiscountAmount =
                          Number(item.discountAmount) || 0;
                        const directDiscount = Number(item.discount) || 0;

                        if (!offerLabel) {
                          if (item.discountDescription) {
                            offerLabel = item.discountDescription;
                          } else if (item.promoCode) {
                            offerLabel = `PROMO: ${item.promoCode}`;
                          } else if (itemDiscountPct > 0) {
                            offerLabel = `${itemDiscountPct}% OFF`;
                          } else if (itemDiscountAmount > 0) {
                            offerLabel = `৳${itemDiscountAmount} OFF`;
                          } else if (origUnitPrice > unitPrice) {
                            offerLabel = "SPECIAL DISCOUNT";
                          } else {
                            offerLabel = "-";
                          }
                        }

                        const fullGross = origUnitPrice * qty;
                        let netPayable = unitPrice * qty;

                        // সঠিক নেট পেবল এবং ডিসকাউন্ট ক্যালকুলেশন
                        if (detectedOfferType === "bogo_1g1") {
                          const paidQuantity = Math.ceil(qty / 2);
                          netPayable = unitPrice * paidQuantity;
                        } else if (detectedOfferType === "bogo_1g2") {
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
                            </td>
                            {/* ডেসক্রিপশন কলামে অফার বা ডিসকাউন্টের নাম শো করবে */}
                            <td className="p-2.5 border-r border-neutral-300 font-semibold text-purple-700 uppercase">
                              {offerLabel}
                            </td>
                            <td className="p-2.5 border-r border-neutral-300 text-right">
                              ৳{origUnitPrice.toFixed(2)}
                            </td>
                            <td className="p-2.5 border-r border-neutral-300 text-center font-bold">
                              {qty}
                            </td>
                            {/* ডিসকাউন্ট অ্যামাউন্ট সঠিকভাবে এখানে রেন্ডার হবে */}
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

                {/* ৪. হিসাব-নিকাশ সেকশন */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-80 space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-neutral-200">
                      <span className="text-neutral-500">Total SD:</span>
                      <span className="font-medium">0.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-200">
                      <span className="text-neutral-500">Total Tax:</span>
                      <span className="font-medium">0.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-200 font-extrabold text-neutral-900">
                      <span>Sub Total (Including Tax):</span>
                      <span>৳{subTotal.toFixed(2)}</span>
                    </div>
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

                {/* ৫. ফুটার ব্র্যান্ড লিস্ট */}
                <div className="pt-8 mt-6 border-t border-neutral-200 text-center space-y-3">
                  <p className="text-[10px] text-neutral-400 italic">
                    This is a system-generated document and does not require any
                    signature.
                  </p>

                  <div className="flex flex-wrap justify-center items-center gap-2 opacity-75 pt-1 text-[9px] font-bold uppercase tracking-wider">
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Barcode Café
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Burgwich Fusion
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Premium Kabab
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Mezzan Haile Ayun
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Outdoor Catering
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Bakery & Pastry
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Paner Botta
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Premium Burgers
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Food Junction
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded">
                      Goram Cha
                    </span>
                  </div>
                </div>
              </div>

              {/* Gateway Re-check option */}
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

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { X, VolumeX } from 'lucide-react';
import { socket } from '../services/socket'; // ⚡ সেন্ট্রাল socket.js ফাইল থেকে ইমপোর্ট করা হলো
import { getAllOrders } from '../services/ordersService';
import { useAuth } from './AuthContext';
import { soundNotification } from '../utils/soundNotification';

const OrderContext = createContext();

// Roles that are actually allowed to read the order list.
const ORDER_ROLES = ['admin', 'super_admin', 'superadmin', 'manager', 'restaurant_manager', 'rider'];

export const OrderProvider = ({ children }) => {
  const { user, isAuthLoaded } = useAuth();
  const [orders, setOrders] = useState([]);
  // Server truth: how many orders are currently pending.
  const [pendingCount, setPendingCount] = useState(0);
  // The count the admin last acknowledged. `null` = never acknowledged.
  const [acknowledgedCount, setAcknowledgedCount] = useState(null);
  const prevCountRef = useRef(null);

  const unreadOrderCount =
    acknowledgedCount !== null && pendingCount <= acknowledgedCount ? 0 : pendingCount;

  const markOrdersAsRead = useCallback(() => {
    setAcknowledgedCount(pendingCount);
  }, [pendingCount]);

  const role = String(user?.role || '').toLowerCase();
  const canReadOrders = Boolean(user) && ORDER_ROLES.includes(role);
  const isAdmin = ['admin', 'super_admin', 'superadmin', 'manager', 'restaurant_manager'].includes(role);

  /**
   * 🛑 Helper: Stop sound and vibration alert
   */
  const stopContinuousAlert = useCallback(() => {
    soundNotification.stopContinuousOrderAlert();
  }, []);

  /**
   * 🚨 Helper: Start sound and vibration alert (for admin)
   */
  const startContinuousAlert = useCallback(() => {
    if (isAdmin) {
      soundNotification.startContinuousOrderAlert();
    }
  }, [isAdmin]);

  /**
   * 🔍 Helper: Check if any unhandled pending orders remain. If none, stop sound and vibration!
   */
  const checkAndManageAlert = useCallback((ordersList) => {
    if (!isAdmin) return;
    const hasUnhandledPending = Array.isArray(ordersList) && ordersList.some((o) => {
      const s = String(o?.status || '').toUpperCase();
      return s === 'PLACED' || s === 'PENDING' || s === 'AWAITING PAYMENT' || s === 'AWAITING_PAYMENT' || !o?.status;
    });

    if (!hasUnhandledPending) {
      soundNotification.stopContinuousOrderAlert();
    }
  }, [isAdmin]);

  const fetchAndUpdateOrders = useCallback(async () => {
    if (!canReadOrders) return;
    try {
      const response = await getAllOrders();
      let ordersList = Array.isArray(response) ? response
                       : Array.isArray(response?.data) ? response.data
                       : Array.isArray(response?.data?.data) ? response.data.data : [];

      setOrders(ordersList);
      checkAndManageAlert(ordersList);
    } catch (err) {
      console.error("Background order sync failed:", err?.message || err);
    }
  }, [canReadOrders, checkAndManageAlert]);

  useEffect(() => {
    if (!isAuthLoaded || !canReadOrders) {
      setOrders([]);
      setPendingCount(0);
      setAcknowledgedCount(null);
      prevCountRef.current = null;
      soundNotification.stopContinuousOrderAlert();
      return undefined;
    }

    // 🔔 Prompt for native OS notification permission for Admin
    if (isAdmin) {
      soundNotification.requestPermission();
    }

    // ১. প্রথমবার কম্পোনেন্ট লোড হলে ডাটা ফেচ করবে
    fetchAndUpdateOrders();

    // ২. সকেট কানেক্ট হলে ব্যাকএন্ড থেকে পেন্ডিং কাউন্ট চাইবে
    const handleConnect = () => socket.emit('get_pending_count');
    if (socket.connected) handleConnect();

    // ⚡ ৩. ব্যাকএন্ড থেকে রিয়েল-টাইম কাউন্ট আপডেট রিসিভ করা
    const handlePendingCount = (payload) => {
      const newCount = payload?.count || payload?.pendingCount || 0;

      if (prevCountRef.current !== null && newCount > prevCountRef.current) {
        if (isAdmin) {
          soundNotification.startContinuousOrderAlert();
        }
      }

      prevCountRef.current = newCount;
      setPendingCount(newCount);

      if (newCount === 0) {
        soundNotification.stopContinuousOrderAlert();
      }
    };

    // 🛒 ৪+৫. নতুন অর্ডার / স্ট্যাটাস পরিবর্তনে লিস্ট রিলোড
    let burstTimer = null;
    const handleOrdersChanged = () => {
      clearTimeout(burstTimer);
      burstTimer = setTimeout(fetchAndUpdateOrders, 600);
    };

    const handleNewOrder = (order) => {
      if (isAdmin && order) {
        // 🚨 Start Continuous Loop Sound & Mobile Vibration until Accept/Reject
        soundNotification.startContinuousOrderAlert();

        const orderId = order.displayId || order.id || order._id || 'New';
        const shortId = String(orderId).slice(-6).toUpperCase();
        const customerName = order.customerName || order.customer?.name || 'Customer';
        const totalAmount = Number(order.totalAmount || order.total || 0).toFixed(0);
        const orderType = order.orderType === 'pickup' ? 'Self-Pickup' : 'Home Delivery';

        soundNotification.sendNotification({
          title: `🔔 New Order #${shortId} Received!`,
          body: `৳${totalAmount} • ${customerName} (${orderType})\nClick to view and manage order details.`,
          url: '/admin/orders',
          tag: `order-${shortId}`,
        });

        // 🎯 Show Slim Production-Grade Red Themed Toast on Admin Screen
        toast.custom(
          (t) => (
            <div
              onClick={() => {
                window.location.href = '/admin/orders';
                toast.dismiss(t.id);
              }}
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-lg w-full bg-white/95 dark:bg-neutral-900/95 shadow-xl shadow-neutral-900/10 rounded-xl pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 border border-primary-500/25 border-l-4 border-l-primary-500 backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0 animate-bounce">🔔</span>
                <div className="min-w-0 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                  <span className="text-xs font-black text-primary-600 dark:text-primary-500 whitespace-nowrap">
                    New Order:
                  </span>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">
                    #{shortId} • {customerName} (৳{totalAmount}) • {orderType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = '/admin/orders';
                    toast.dismiss(t.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-primary-500 hover:bg-primary-600 active:scale-95 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundNotification.stopContinuousOrderAlert();
                    toast.dismiss(t.id);
                  }}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  title="Silence & Dismiss"
                  aria-label="Silence"
                >
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>
            </div>
          ),
          {
            duration: 12000,
            id: `admin-order-${shortId}`,
          }
        );
      }
      handleOrdersChanged();
    };

    socket.on('connect', handleConnect);
    socket.on('pending_count_updated', handlePendingCount);
    socket.on('admin_new_order', handleNewOrder);
    socket.on('order_created', handleNewOrder);
    socket.on('order_updated', handleOrdersChanged);
    socket.on('order_status_updated', handleOrdersChanged);
    socket.on('rider_cash_submitted', handleOrdersChanged);
    socket.on('rider_cash_settled', handleOrdersChanged);
    socket.on('rider_order_updated', handleOrdersChanged);

    return () => {
      clearTimeout(burstTimer);
      soundNotification.stopContinuousOrderAlert();
      socket.off('connect', handleConnect);
      socket.off('pending_count_updated', handlePendingCount);
      socket.off('admin_new_order', handleNewOrder);
      socket.off('order_created', handleNewOrder);
      socket.off('order_updated', handleOrdersChanged);
      socket.off('order_status_updated', handleOrdersChanged);
      socket.off('rider_cash_submitted', handleOrdersChanged);
      socket.off('rider_cash_settled', handleOrdersChanged);
      socket.off('rider_order_updated', handleOrdersChanged);
    };
  }, [isAuthLoaded, canReadOrders, isAdmin, fetchAndUpdateOrders]);

  // ローカルステータス更新
  const updateLocalOrderStatus = (orderId, newStatus) => {
    setOrders((prevOrders) => {
      const updated = prevOrders.map((ord) =>
        (ord.id === orderId || ord._id === orderId) ? { ...ord, status: newStatus } : ord
      );
      checkAndManageAlert(updated);
      return updated;
    });
  };

  return (
    <OrderContext.Provider value={{
      orders,
      unreadOrderCount,
      markOrdersAsRead,
      fetchAndUpdateOrders,
      updateLocalOrderStatus,
      startContinuousAlert,
      stopContinuousAlert,
      socket
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);

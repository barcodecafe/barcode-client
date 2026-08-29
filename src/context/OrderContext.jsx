import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { socket } from '../services/socket'; // ⚡ আপনার সেন্ট্রাল socket.js ফাইল থেকে ইমপোর্ট করা হলো
import { getAllOrders } from '../services/ordersService';
import { useAuth } from './AuthContext';
import { soundNotification } from '../utils/soundNotification';

const OrderContext = createContext();

// Roles that are actually allowed to read the order list. GET /api/orders is
// auth-gated, so anyone else fetching it just collects a 401 — see the gate in
// the effect below for why that mattered.
const ORDER_ROLES = ['admin', 'super_admin', 'superadmin', 'rider'];

export const OrderProvider = ({ children }) => {
  const { user, isAuthLoaded } = useAuth();
  const [orders, setOrders] = useState([]);
  // Server truth: how many orders are currently pending.
  const [pendingCount, setPendingCount] = useState(0);
  // The count the admin last acknowledged. `null` = never acknowledged.
  const [acknowledgedCount, setAcknowledgedCount] = useState(null);
  const prevCountRef = useRef(null);

  // The badge hides once acknowledged and reappears the moment a NEW order
  // pushes the pending count above what was last seen. Clearing the raw count
  // instead would not work: the server keeps reporting the same pending total,
  // so the badge would immediately come back.
  const unreadOrderCount =
    acknowledgedCount !== null && pendingCount <= acknowledgedCount ? 0 : pendingCount;

  // ⚠️ AdminLayout destructures and calls this from the bell and the Orders nav
  // item. It was never provided here, so every click threw
  // "markOrdersAsRead is not a function" — and with no ErrorBoundary that
  // unmounted the entire admin to a white page.
  const markOrdersAsRead = useCallback(() => {
    setAcknowledgedCount(pendingCount);
  }, [pendingCount]);

  const role = String(user?.role || '').toLowerCase();
  const canReadOrders = Boolean(user) && ORDER_ROLES.includes(role);
  const isAdmin = ['admin', 'super_admin', 'superadmin'].includes(role);

  const playNotificationSound = () => {
    if (!isAdmin) return;
    soundNotification.playKitchenBellChime();
  };

  const fetchAndUpdateOrders = useCallback(async () => {
    if (!canReadOrders) return;
    try {
      const response = await getAllOrders();
      let ordersList = Array.isArray(response) ? response
                       : Array.isArray(response?.data) ? response.data
                       : Array.isArray(response?.data?.data) ? response.data.data : [];

      setOrders(ordersList);
    } catch (err) {
      // Keep whatever we already had on screen. Overwriting it with [] on a
      // transient failure is what made the list flash empty and then refill.
      console.error("Background order sync failed:", err?.message || err);
    }
  }, [canReadOrders]);

  useEffect(() => {
    // ⚠️ This provider wraps EVERY route, including the public home page, menu
    // and login. It used to fetch GET /api/orders unconditionally, so every
    // anonymous visitor fired an admin-only request that 401'd — wasted work
    // that still consumed the server's rate-limit budget, and which could wipe
    // a valid token on the way out. Wait for auth to settle, then only fetch
    // for roles that may actually read orders.
    if (!isAuthLoaded || !canReadOrders) {
      setOrders([]);
      setPendingCount(0);
      setAcknowledgedCount(null);
      prevCountRef.current = null;
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
        playNotificationSound(); // নতুন অর্ডার আসলে সাউন্ড বাজবে
      }

      prevCountRef.current = newCount;
      setPendingCount(newCount);
    };

    // 🛒 ৪+৫. নতুন অর্ডার / স্ট্যাটাস পরিবর্তনে লিস্ট রিলোড।
    let burstTimer = null;
    const handleOrdersChanged = () => {
      clearTimeout(burstTimer);
      burstTimer = setTimeout(fetchAndUpdateOrders, 600);
    };

    const handleNewOrder = (order) => {
      if (isAdmin && order) {
        soundNotification.playKitchenBellChime();
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
                <span className="text-base shrink-0">🔔</span>
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
                    toast.dismiss(t.id);
                  }}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ),
          {
            duration: 8000,
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

    // ⚠️ Cleanup passes the handler reference. socket.off('order_status_updated')
    // with no handler used to remove RiderLayout's and RiderOrders' listeners
    // as well, quietly dropping the rider portal to poll-only.
    return () => {
      clearTimeout(burstTimer);
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

  // (ঐচ্ছিক) যদি ব্যাকএন্ডের মিলি-সেকেন্ড রেসপন্সের আগেও 0ms-এ ইউআই আপডেট করতে চান
  const updateLocalOrderStatus = (orderId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((ord) =>
        (ord.id === orderId || ord._id === orderId) ? { ...ord, status: newStatus } : ord
      )
    );
  };

  return (
    <OrderContext.Provider value={{
      orders,
      unreadOrderCount,
      markOrdersAsRead,
      fetchAndUpdateOrders,
      updateLocalOrderStatus,
      socket // চাইলে অন্য কম্পোনেন্টে সকেট ব্যবহারের জন্য এক্সপোর্ট করে দিতে পারেন
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
// before counting logic fix 154

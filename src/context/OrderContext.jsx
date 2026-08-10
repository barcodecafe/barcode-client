import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../services/socket'; 
import { getAllOrders } from '../services/ordersService';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

const ORDER_ROLES = ['admin', 'super_admin', 'superadmin', 'rider'];

export const OrderProvider = ({ children }) => {
  const { user, isAuthLoaded } = useAuth();
  const [orders, setOrders] = useState([]);
  // Server truth: how many orders are currently pending.
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef(null);

  // 🎯 নোটিফিকেশন কাউন্ট সরাসরি পেন্ডিং অর্ডার কাউন্ট দেখাবে।
  // পেজে বা বেল আইকনে ক্লিক করলেও কাউন্ট ০ হবে না, যতক্ষণ না অর্ডার Accept বা Reject করা হচ্ছে।
  const unreadOrderCount = pendingCount;

  // ব্যাকওয়ার্ড কম্প্যাটিবিলিটির জন্য ফাঁকা রাখা হলো যাতে অন্য ফাইল থেকে ডাকলে কোনো এরর না আসে
  const markOrdersAsRead = useCallback(() => {}, []);

  const role = String(user?.role || '').toLowerCase();
  const canReadOrders = Boolean(user) && ORDER_ROLES.includes(role);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => console.warn("Audio blocked:", err));
      }
    } catch (e) {
      console.error("Sound error:", e);
    }
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
      console.error("Background order sync failed:", err?.message || err);
    }
  }, [canReadOrders]);

  useEffect(() => {
    if (!isAuthLoaded || !canReadOrders) {
      setOrders([]);
      setPendingCount(0);
      prevCountRef.current = null;
      return undefined;
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

    socket.on('connect', handleConnect);
    socket.on('pending_count_updated', handlePendingCount);
    socket.on('order_created', handleOrdersChanged);
    socket.on('order_status_updated', handleOrdersChanged);

    return () => {
      clearTimeout(burstTimer);
      socket.off('connect', handleConnect);
      socket.off('pending_count_updated', handlePendingCount);
      socket.off('order_created', handleOrdersChanged);
      socket.off('order_status_updated', handleOrdersChanged);
    };
  }, [isAuthLoaded, canReadOrders, fetchAndUpdateOrders]);

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
      socket
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
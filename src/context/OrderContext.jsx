import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getAllOrders } from '../services/ordersService';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const prevCountRef = useRef(null);

  // 🔔 পাবলিক ফোল্ডার থেকে লোকাল নোটিফিকেশন সাউন্ড বাজানোর ফাংশন
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Browser blocked autoplay sound until user interacts:", err);
        });
      }
    } catch (e) {
      console.error("Sound error:", e);
    }
  };

  const fetchAndUpdateOrders = async () => {
    try {
      const response = await getAllOrders();
      
      let ordersList = [];
      if (Array.isArray(response)) {
        ordersList = response;
      } else if (Array.isArray(response?.data)) {
        ordersList = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        ordersList = response.data.data;
      }

      setOrders(ordersList);

      // নতুন বা চলমান অর্ডার ফিল্টার (Placed বা Awaiting Payment)
      const pendingNewOrders = ordersList.filter(ord => {
        const status = String(ord.status || '').trim();
        return status === 'Placed' || status === 'Awaiting Payment';
      });

      const currentCount = pendingNewOrders.length;

      // যদি আগের মানের চেয়ে বর্তমান কাউন্ট বেশি হয়, তবেই সাউন্ড বাজবে
      if (prevCountRef.current !== null && currentCount > prevCountRef.current) {
        playNotificationSound();
      }

      prevCountRef.current = currentCount;
      setUnreadOrderCount(currentCount);

    } catch (err) {
      console.error("Background order sync failed:", err);
    }
  };

  useEffect(() => {
    fetchAndUpdateOrders();
    // প্রতি 1 সেকেন্ড পর পর ব্যাকগ্রাউন্ডে চেক করবে
    const interval = setInterval(fetchAndUpdateOrders, 1000);
    return () => clearInterval(interval);
  }, []);

  // ⚡ গ্রাহক অর্ডার কনফার্ম করলে ইনস্ট্যান্ট কাউন্ট বাড়িয়ে দেওয়ার এবং সাউন্ড বাজানোর ফাংশন
  const incrementOrderCount = () => {
    setUnreadOrderCount((prev) => {
      const newCount = prev + 1;
      prevCountRef.current = newCount;
      return newCount;
    });
    playNotificationSound();
  };

  // ⚡ অ্যাডমিন Accept/Reject করলে ইনস্ট্যান্ট কাউন্ট কমানোর ফাংশন
  const decrementOrderCount = () => {
    setUnreadOrderCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      prevCountRef.current = newCount;
      return newCount;
    });
  };

  const markOrdersAsRead = () => {
    // প্রয়োজন অনুযায়ী
  };

  return (
    <OrderContext.Provider value={{ orders, unreadOrderCount, markOrdersAsRead, fetchAndUpdateOrders, incrementOrderCount, decrementOrderCount }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
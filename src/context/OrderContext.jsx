import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getAllOrders } from '../services/ordersService';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const prevCountRef = useRef(0);

  // নোটিফিকেশন সাউন্ড বাজানোর ফাংশন
  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch((err) => console.log("Audio play blocked:", err));
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

      // 🎯 মূল লজিক: শুধুমাত্র যেগুলো একেবারে নতুন (Placed বা Awaiting Payment) 
      // সেগুলোই কাউন্ট হবে। Accept বা Reject হলে এগুলো এই লিস্ট থেকে বাদ যাবে এবং count কমে যাবে (-1 হবে)।
      const pendingNewOrders = ordersList.filter(ord => {
        const status = String(ord.status || '').trim();
        return status === 'Placed' || status === 'Awaiting Payment';
      });

      const currentCount = pendingNewOrders.length;

      // যদি আগের তুলনায় নতুন অর্ডারের সংখ্যা বাড়ে, তবে সাউন্ড বাজবে (+1 হলে)
      if (prevCountRef.current > 0 && currentCount > prevCountRef.current) {
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
    const interval = setInterval(fetchAndUpdateOrders, 15000); // প্রতি ১৫ সেকেন্ড পর পর সিঙ্ক হবে
    return () => clearInterval(interval);
  }, []);

  const markOrdersAsRead = () => {
    // প্রয়োজন অনুযায়ী হ্যান্ডেল করার জন্য
  };

  return (
    <OrderContext.Provider value={{ orders, unreadOrderCount, markOrdersAsRead, fetchAndUpdateOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
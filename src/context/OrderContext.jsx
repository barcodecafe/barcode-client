import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getAllOrders } from '../services/ordersService';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const prevCountRef = useRef(null); // ইনিশিয়াল স্টেট null রাখা হলো

  // নোটিফিকেশন সাউন্ড বাজানোর ফাংশন
  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => console.log("Audio play blocked by browser:", err));
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

      // 🎯 শুধুমাত্র নতুন বা অপেক্ষমাণ অর্ডারগুলো ফিল্টার করা
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
    // প্রথমে একবার ফেচ হবে
    fetchAndUpdateOrders();

    // প্রতি ১০ সেকেন্ড পর পর ব্যাকগ্রাউন্ডে চেক করবে (পেজ রিফ্রেশ ছাড়াই আপডেট হবে)
    const interval = setInterval(fetchAndUpdateOrders, 10000); 
    return () => clearInterval(interval);
  }, []);

  const markOrdersAsRead = () => {
    // প্রয়োজন অনুযায়ী
  };

  return (
    <OrderContext.Provider value={{ orders, unreadOrderCount, markOrdersAsRead, fetchAndUpdateOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getAllOrders } from '../services/ordersService';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const prevCountRef = useRef(null);

  // 🔔 ১০০% কার্যকরী বেস-৬৪ (Base64) শর্ট বীপ সাউন্ড বা লোকাল অডিও
  const playNotificationSound = () => {
    try {
      // এটি একটি জেনারেটেড বীপ সাউন্ড অডিও, যা কোনো এক্সটার্নাল লিংকের ওপর ডিপেন্ড করে না
      const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAALAAABXADDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw//8AAAAATGF2ZjU3LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAANPAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAALAAABXADDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw//8AAAAATGF2ZjU3LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAANPAAAAAAAAAAAAA');
      audio.volume = 1.0;
      audio.play().catch((err) => {
        console.log("Audio autoplay blocked by browser policy:", err);
      });
    } catch (e) {
      console.error("Sound error:", e);
    }
  };

  const fetchAndUpdateOrders = async () => {
    try {
      // ক্যাশ এড়াতে বা রিয়েল-টাইম ডাটা নিশ্চিত করতে এপিআই কল
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

      // নতুন অর্ডার ফিল্টার (Placed বা Awaiting Payment)
      const pendingNewOrders = ordersList.filter(ord => {
        const status = String(ord.status || '').trim();
        return status === 'Placed' || status === 'Awaiting Payment';
      });

      const currentCount = pendingNewOrders.length;

      // যদি আগের কাউন্টের চেয়ে বর্তমান কাউন্ট বেশি হয়, তবেই সাউন্ড বাজবে
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
    // পেজ লোড হওয়ার সাথে সাথে ফেচ করবে
    fetchAndUpdateOrders();

    // প্রতি ৮ সেকেন্ড পর পর ব্যাকগ্রাউন্ডে চেক করবে (রিফ্রেশ ছাড়াই অটো আপডেট হবে)
    const interval = setInterval(fetchAndUpdateOrders, 8000); 
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
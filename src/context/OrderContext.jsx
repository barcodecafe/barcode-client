import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket'; // ⚡ আপনার সেন্ট্রাল socket.js ফাইল থেকে ইমপোর্ট করা হলো
import { getAllOrders } from '../services/ordersService';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const prevCountRef = useRef(null);

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

  const fetchAndUpdateOrders = async () => {
    try {
      const response = await getAllOrders();
      let ordersList = Array.isArray(response) ? response 
                       : Array.isArray(response?.data) ? response.data 
                       : Array.isArray(response?.data?.data) ? response.data.data : [];

      setOrders(ordersList);
    } catch (err) {
      console.error("Background order sync failed:", err);
    }
  };

  useEffect(() => {
    // ১. প্রথমবার কম্পোনেন্ট লোড হলে ডাটা ফেচ করবে[cite: 8]
    fetchAndUpdateOrders();

    // ২. সকেট কানেক্ট হলে ব্যাকএন্ড থেকে পেন্ডিং কাউন্ট চাইবে[cite: 8]
    socket.on('connect', () => {
      socket.emit('get_pending_count');
    });

    // ⚡ ৩. ব্যাকএন্ড থেকে রিয়েল-টাইম কাউন্ট আপডেট রিসিভ করা[cite: 8]
    socket.on('pending_count_updated', (payload) => {
      const newCount = payload.count || payload.pendingCount || 0;
      
      if (prevCountRef.current !== null && newCount > prevCountRef.current) {
        playNotificationSound(); // নতুন অর্ডার আসলে সাউন্ড বাজবে[cite: 8]
      }
      
      prevCountRef.current = newCount;
      setUnreadOrderCount(newCount);
    });

    // 🛒 ৪. নতুন অর্ডার তৈরি হলে লিস্ট রিলোড করা[cite: 8]
    socket.on('order_created', (newOrder) => {
      fetchAndUpdateOrders();
      // কাউন্ট আপডেট এবং সাউন্ড pending_count_updated ইভেন্ট থেকেই হবে[cite: 8]
    });

    // 🔄 ৫. অর্ডারের স্ট্যাটাস (Accept/Reject) পরিবর্তন হলে লিস্ট রিলোড করা[cite: 8]
    socket.on('order_status_updated', (data) => {
      fetchAndUpdateOrders();
    });

    // ক্লিনআপ (কম্পোনেন্ট আনমাউন্ট হলে লিসেনার রিমুভ করা)[cite: 8]
    return () => {
      socket.off('connect');
      socket.off('pending_count_updated');
      socket.off('order_created');
      socket.off('order_status_updated');
    };
  }, []);

  // (ঐচ্ছিক) যদি ব্যাকএন্ডের মিলি-সেকেন্ড রেসপন্সের আগেও 0ms-এ ইউআই আপডেট করতে চান[cite: 8]
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
      fetchAndUpdateOrders, 
      updateLocalOrderStatus,
      socket // চাইলে অন্য কম্পোনেন্টে সকেট ব্যবহারের জন্য এক্সপোর্ট করে দিতে পারেন[cite: 8]
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
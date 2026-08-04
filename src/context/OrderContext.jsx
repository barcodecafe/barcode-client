import { createContext, useContext, useState, useEffect } from 'react';
import { getAllOrders } from '../services/ordersService';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);

  const fetchAndUpdateOrders = async () => {
    try {
      const response = await getAllOrders();
      
      // 🛠️ ব্যাকএন্ডের রেসপন্স ফরম্যাট হ্যান্ডেল করার সেফটি চেক
      let ordersList = [];
      if (Array.isArray(response)) {
        ordersList = response;
      } else if (Array.isArray(response?.data)) {
        ordersList = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        ordersList = response.data.data;
      }

      setOrders(ordersList);

      // 'Placed' বা নতুন অর্ডারগুলোর কাউন্ট ফিল্টার করা
      const newOrders = ordersList.filter(ord => ord.status === 'Placed');
      setUnreadOrderCount(newOrders.length);
    } catch (err) {
      console.error("Background order sync failed:", err);
    }
  };

  useEffect(() => {
    fetchAndUpdateOrders();
    const interval = setInterval(fetchAndUpdateOrders, 20000); // প্রতি ২০ সেকেন্ড পর পর ব্যাকগ্রাউন্ডে চেক করবে
    return () => clearInterval(interval);
  }, []);

  const markOrdersAsRead = () => {
    setUnreadOrderCount(0);
  };

  return (
    <OrderContext.Provider value={{ orders, unreadOrderCount, markOrdersAsRead, fetchAndUpdateOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { useAuth } from '../context/AuthContext'; // 👈 AuthContext ইমপোর্ট
import { socket } from '../services/socket';

export const RootLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 🚚 Rider কাস্টমারদের পেজে চলে আসলে স্বয়ংক্রিয়ভাবে তাদের পোর্টালে পাঠিয়ে দেবে
    if (user?.role === 'rider' && !location.pathname.startsWith('/rider')) {
      navigate('/rider', { replace: true });
    }
  }, [user, navigate, location]);

  // 🔔 Global Delivery Toast Listener for logged in customers
  useEffect(() => {
    if (!user || user.role === 'admin' || user.role === 'rider') return;

    const handleDeliveryBroadcast = (data) => {
      const order = data?.order || data;
      const status = data?.status || order?.status;

      if (status !== 'Delivered') return;

      const orderUserId = order?.user?.id || order?.user?._id || order?.userId;
      const orderPhone = order?.user?.phone || order?.deliveryPhone;
      const currentUserId = user.id || user._id;
      const currentPhone = user.phone;

      const isMyOrder =
        (orderUserId && currentUserId && String(orderUserId) === String(currentUserId)) ||
        (orderPhone && currentPhone && String(orderPhone) === String(currentPhone));

      if (isMyOrder && !location.pathname.startsWith('/order-tracking')) {
        const bId = order.branchId || order.branch?._id || '';
        const bName = order.branchName || order.branch?.name || '';
        const query = new URLSearchParams({ tab: 'reviews' });
        if (bId) query.set('branchId', bId);
        if (bName) query.set('branchName', bName);
        const reviewUrl = `/profile?${query.toString()}`;

        toast(
          (t) => (
            <div className="flex items-center justify-between gap-3 w-full py-0.5">
              <div>
                <p className="font-bold text-xs text-neutral-900 dark:text-white">
                  🎉 Order Delivered!
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  How was your food? Rate your dining experience!
                </p>
              </div>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate(reviewUrl);
                }}
                className="px-3 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
              >
                Review Now
              </button>
            </div>
          ),
          {
            duration: 9000,
            icon: '🍽️',
            style: {
              borderRadius: '16px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 30px -5px rgba(0,0,0,0.12)',
            },
          }
        );
      }
    };

    socket.on('order_status_updated', handleDeliveryBroadcast);
    socket.on('order_updated', handleDeliveryBroadcast);

    return () => {
      socket.off('order_status_updated', handleDeliveryBroadcast);
      socket.off('order_updated', handleDeliveryBroadcast);
    };
  }, [user, location.pathname, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
      {/* Sticky Navbar */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-grow w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Global cart toast + drawer */}
      <CartDrawer />
    </div>
  );
};

export default RootLayout;
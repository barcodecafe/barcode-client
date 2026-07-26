import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Building2,
  Store,
  Map,
  Menu as MenuIcon,
  X,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  Home as HomeIcon,
  Info,
  ShoppingBag,
  Users,
  Tag,
  Image,
  Bike,
  Settings,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { socket } from '../services/socket';

import resB from '../assets/Barcode_restaurant_group-B.png';
import resW from '../assets/Barcode_restaurant_groupW.png';

const navItems = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Dishes', path: '/admin/dishes', icon: UtensilsCrossed },
  { name: 'Brands', path: '/admin/brands', icon: Store },
  { name: 'Regions', path: '/admin/regions', icon: Map },
  { name: 'Branches', path: '/admin/branches', icon: Building2 },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Coupons', path: '/admin/coupons', icon: Tag },
  { name: 'Hero Carousel', path: '/admin/hero', icon: Image },
  { name: 'About Info', path: '/admin/about', icon: Info },
  { name: 'Rider Applications', path: '/admin/rider-applications', icon: Bike },
  { name: 'Site Settings', path: '/admin/settings', icon: Settings },
];

export const AdminLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  });

  // 🎯 ১. পেন্ডিং (Pending) এবং মোট আন-ডেলিভার্ড অর্ডারের কাউন্ট
  const [pendingCount, setPendingCount] = useState(0);
  const [undeliveredCount, setUndeliveredCount] = useState(0);
  const initialAlertTriggered = useRef(false);

  // 🔊 সাউন্ড প্লে করার ফাংশন
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        }
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // 🎯 ২. ব্যাকএন্ড থেকে অর্ডার কাউন্ট ফেচ করা
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const resData = await res.json();

        const ordersList = Array.isArray(resData) 
          ? resData 
          : Array.isArray(resData?.data) 
            ? resData.data 
            : Array.isArray(resData?.data?.orders) 
              ? resData.data.orders 
              : [];

        // ১. পেন্ডিং অর্ডার গণনা (যেগুলো Accept/Reject করতে হবে)
        const pendingOrders = ordersList.filter(o => {
          const status = (o.status || '').toUpperCase();
          return status === 'PENDING' || status === 'PLACED';
        });

        // ২. মোট সক্রিয় অর্ডার (ডেলিভারি না হওয়া পর্যন্ত)
        const terminalStatuses = ['DELIVERED', 'CANCELLED', 'REJECTED'];
        const activeOrders = ordersList.filter(o => {
          const status = (o.status || '').toUpperCase();
          return !terminalStatuses.includes(status);
        });

        setPendingCount(pendingOrders.length);
        setUndeliveredCount(activeOrders.length);

        // 🚨 শিফটের শুরুতে বা পেজ লোড হওয়ার সাথে সাথে যদি পেন্ডিং অর্ডার থাকে, ডেস্কটপ নোটিফিকেশন দেবে
        if (pendingOrders.length > 0 && !initialAlertTriggered.current) {
          initialAlertTriggered.current = true;
          playNotificationSound();

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⚠️ পেন্ডিং অর্ডার সতর্কবার্তা!', {
              body: `🚨 বর্তমানে ${pendingOrders.length} টি অর্ডার এক্সেপ্ট করার জন্য অপেক্ষা করছে!`,
              icon: settings?.logoLight || resB,
              requireInteraction: true,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch orders count:', err);
      }
    };

    fetchOrdersData();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleNewOrder = (newOrder) => {
      fetchOrdersData();
      playNotificationSound();

      if ('Notification' in window && Notification.permission === 'granted') {
        const orderId = newOrder?.id || newOrder?._id || 'New';
        const customerName = newOrder?.deliveryAddress?.name || newOrder?.customerName || newOrder?.user?.name || newOrder?.name || 'Customer';
        const totalAmount = newOrder?.totalAmount || newOrder?.total || 0;

        const desktopNotif = new Notification('🚨 নতুন অর্ডার এসেছে!', {
          body: `🛒 Order #${String(orderId).slice(-6)}\n👤 ${customerName}\n💰 ৳${totalAmount}`,
          icon: settings?.logoLight || resB,
          requireInteraction: true,
        });

        desktopNotif.onclick = () => {
          window.focus();
          navigate('/admin/orders');
        };
      }
    };

    const handleStatusUpdate = () => {
      fetchOrdersData();
    };

    socket.on('admin_new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('admin_new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [navigate, settings?.logoLight]);

  // 🎯 ৩. ট্যাবের টাইটেলে পেন্ডিং অর্ডারের সংখ্যা ব্র্যাকেটে দেখানো
  useEffect(() => {
    if (pendingCount > 0) {
      document.title = `(${pendingCount} Pending) Barcode Admin`;
    } else if (undeliveredCount > 0) {
      document.title = `(${undeliveredCount} Active) Barcode Admin`;
    } else {
      document.title = 'Barcode Restaurant - Admin';
    }
  }, [pendingCount, undeliveredCount]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const SidebarContent = ({ onNavigate }) => (
    <>
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2 px-2 mb-8">
        <div className="h-10 flex items-center rounded-xl px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <img
            src={theme === 'dark' ? (settings.logoDark || resW) : (settings.logoLight || resB)}
            alt="Barcode Cafe"
            className="h-6 w-auto object-contain"
          />
        </div>
      </Link>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/10 text-primary-500 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-500'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </div>

            {/* 🔴 সাইডবারে পেন্ডিং অর্ডারের লাল ব্লিঙ্কিং ব্যাজ */}
            {item.name === 'Orders' && (pendingCount > 0 || undeliveredCount > 0) && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm text-white ${
                pendingCount > 0 ? 'bg-red-600 animate-bounce' : 'bg-amber-500'
              }`}>
                {pendingCount > 0 ? `${pendingCount} Pending` : undeliveredCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-1 pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-500 transition-all duration-200"
        >
          <HomeIcon className="w-4 h-4 shrink-0" />
          Back to Site
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ 
          width: isDrawerOpen ? 256 : 0,
        }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="shrink-0 overflow-hidden flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200/60 dark:border-neutral-800/60 shadow-sm z-50 md:z-20 md:sticky md:top-0 md:h-screen fixed left-0 top-0 bottom-0"
      >
        <div className="w-64 flex flex-col px-4 py-6 h-full relative shrink-0">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="absolute top-5 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent onNavigate={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setIsDrawerOpen(false);
            }
          }} />
        </div>
      </motion.aside>

      <div className="flex-grow flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 border-b border-neutral-200/50 dark:border-neutral-800/50 glass bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 active:scale-95 transition-all"
              aria-label="Toggle Navigation Menu"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to Site
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 hover:scale-105 transition-all duration-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 dark:border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center font-display font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="leading-tight hidden sm:block">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* 🚨🚨 ৪. গ্লোবাল ফ্লোটিং ওয়ার্নিং ব্যানার (সব পেজে দেখাবে যদি ১টিও পেন্ডিং অর্ডার থাকে) 🚨🚨 */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between z-20 text-xs sm:text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
                <span>
                  <strong>🚨 সতর্কবার্তা:</strong> বর্তমানে <strong>{pendingCount} টি অর্ডার</strong> এক্সেপ্ট করার জন্য অপেক্ষা করছে!
                </span>
              </div>
              <Link
                to="/admin/orders"
                className="flex items-center gap-1 bg-white text-red-600 font-bold px-3 py-1 rounded-lg shadow hover:bg-neutral-100 transition-all shrink-0 text-xs"
              >
                অর্ডারগুলো দেখুন <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
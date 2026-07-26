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
  Bell,
  BellOff,
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // 🎯 1. পেন্ডিং কাউন্ট, সাউন্ড ও টাইম স্টেট
  const [pendingCount, setPendingCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // ⏰ লাইভ ঘড়ি
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🎯 2. ব্যাকএন্ড থেকে পেন্ডিং ও প্লেসড অর্ডার সংখ্যা লোড করা ও সকেটে আপডেট রাখা
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          // 🔴 FIX: 'PENDING' বা 'PLACED' স্ট্যাটাসের অর্ডার ফিল্টার
          const pending = data.data.filter(
            (o) => o.status?.toUpperCase() === 'PENDING' || o.status?.toUpperCase() === 'PLACED'
          );
          setPendingCount(pending.length);
        }
      } catch (err) {
        console.error('Failed to fetch pending count:', err);
      }
    };

    fetchPendingOrders();

    // 🔔 ডেসktop নোটিফিকেশন পারমিশন চাওয়া
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 🔊 নতুন অর্ডার এলে কাউন্ট ১ বাড়ানো এবং সাউন্ড ও ডেসktop নোটিফিকেশন দেওয়া
    const handleNewOrder = (newOrder) => {
      setPendingCount(prev => prev + 1);

      if (soundEnabledRef.current) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        const desktopNotif = new Notification('🚨 নতুন অর্ডার এসেছে!', {
          body: `Order ID: #${newOrder?.id || newOrder?._id || ''}\nTotal: ৳${newOrder?.totalAmount || newOrder?.total || 0}`,
          icon: settings?.logoLight || resB,
          requireInteraction: true,
        });

        desktopNotif.onclick = () => {
          window.focus();
          navigate('/admin/orders');
        };
      }
    };

    // 🔄 স্ট্যাটাস আপডেট হলে (Accept/Reject করলে) কাউন্ট পুনরায় রিলোড করা
    const handleStatusUpdate = () => {
      fetchPendingOrders();
    };

    socket.on('admin_new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('admin_new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [navigate, settings?.logoLight]);

  // 🎯 3. ট্যাবের টাইটেলে পেন্ডিং সংখ্যা দেখানো
  useEffect(() => {
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) New Orders - Barcode Admin`;
    } else {
      document.title = 'Barcode Restaurant - Admin';
    }
  }, [pendingCount]);

  useState(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    setIsDrawerOpen(isDesktop);
  });

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

            {/* 🔴 সাইডবারে Orders এর পাশে লাল রঙে ব্যাজ */}
            {item.name === 'Orders' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                {pendingCount}
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
        className={`shrink-0 overflow-hidden flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200/60 dark:border-neutral-800/60 shadow-sm z-50 md:z-20 md:sticky md:top-0 md:h-screen fixed left-0 top-0 bottom-0`}
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

          <div className="flex items-center gap-4">
            {/* 🔔 হেডার নোটিফিকেশন উইজেট (লাইভ সময়, বেল ও সবুজ ব্যাজ) */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                {currentTime || '10:14 AM'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                  title={soundEnabled ? 'Sound Enabled (Click to Mute)' : 'Sound Muted (Click to Unmute)'}
                >
                  {soundEnabled ? (
                    <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <BellOff className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
                <Link
                  to="/admin/orders"
                  className="w-5 h-5 rounded-full bg-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs hover:scale-110 transition-transform cursor-pointer"
                  title="Click to view orders"
                >
                  {pendingCount}
                </Link>
              </div>
            </div>

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

        <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
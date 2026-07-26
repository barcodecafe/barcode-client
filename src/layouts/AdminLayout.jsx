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
  Volume2,
  VolumeX,
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

  // 🎯 ১. যেসকল অর্ডার এখনো Accept বা Reject করা হয়নি সেগুলোর কাউন্ট
  const [pendingCount, setPendingCount] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioCtxRef = useRef(null);

  // 🔊 ডাবল-বিপ সাউন্ড জেনারেটর (Web Audio API - কোনো MP3 ফাইল লাগবে না, ১০০% বাজবেই)
  const playAlarmSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // ১ম বিওপ টোন
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      // ২য় বিওপ টোন (Ding-Dong Effect)
      setTimeout(() => {
        if (ctx.state === 'closed') return;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, ctx.currentTime); // Higher C6
        gain2.gain.setValueAtTime(0.4, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      }, 150);

    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  // 🔓 ব্রাউজারে ইউজার ১ম ক্লিক করলে অডিও সিস্টেম আনলক করা
  const unlockAudioSystem = () => {
    if (!audioUnlocked) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      }
      setAudioUnlocked(true);
    }
  };

  // 🎯 ২. ব্যাকএন্ড থেকে পেন্ডিং অর্ডার ফেচ এবং কাউন্ট নির্ণয়
  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();

      const ordersList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.orders)
          ? resData.orders
          : Array.isArray(resData?.data)
            ? resData.data
            : Array.isArray(resData?.data?.orders)
              ? resData.data.orders
              : [];

      // 🔍 যেসব অর্ডার এখনো ACCEPT বা REJECT করা হয়নি (Pending/Placed/Unaccepted)
      const unhandledOrders = ordersList.filter(o => {
        const st = (o.status || o.orderStatus || '').toUpperCase();
        
        // যেসব স্ট্যাটাস মানে অর্ডার এক্সেপ্ট/প্রসেসড হয়ে গেছে
        const processedStatuses = [
          'ACCEPTED', 'CONFIRMED', 'COOKING', 'PREPARING', 
          'ON_THE_WAY', 'DELIVERING', 'OUT_FOR_DELIVERY', 
          'DELIVERED', 'CANCELLED', 'REJECTED'
        ];

        if (processedStatuses.includes(st)) return false;
        if (o.isAccepted === true || o.isRejected === true) return false;

        return true;
      });

      setPendingCount(unhandledOrders.length);
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    }
  };

  useEffect(() => {
    fetchPendingOrders();

    // 🔔 ডেস্কটপ পারমিশন চাওয়া
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 🔄 প্রতি ৮ সেকেন্ড পর পর স্বয়ংক্রিয়ভাবে ব্যাকএন্ড চেক করবে (যাতে সকেট মিস হলেও আপডেট হয়)
    const interval = setInterval(fetchPendingOrders, 8000);

    // 🔊 নতুন অর্ডার আসার সকেট ইভেন্ট
    const handleNewOrder = (newOrder) => {
      fetchPendingOrders();
      playAlarmSound();

      if ('Notification' in window && Notification.permission === 'granted') {
        const orderId = newOrder?.id || newOrder?._id || 'New';
        const customerName = newOrder?.deliveryAddress?.name || newOrder?.customerName || newOrder?.user?.name || 'Customer';
        const totalAmount = newOrder?.totalAmount || newOrder?.total || 0;

        const notif = new Notification('🚨 নতুন অর্ডার এসেছে!', {
          body: `🛒 Order #${String(orderId).slice(-6)}\n👤 ${customerName}\n💰 ৳${totalAmount}`,
          icon: settings?.logoLight || resB,
          requireInteraction: true,
        });

        notif.onclick = () => {
          window.focus();
          navigate('/admin/orders');
        };
      }
    };

    const handleStatusUpdate = () => {
      fetchPendingOrders();
    };

    socket.on('admin_new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      clearInterval(interval);
      socket.off('admin_new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [navigate, settings?.logoLight]);

  // 🎯 ৩. ব্রাউজার ট্যাবের টাইটেলে পেন্ডিং অর্ডার কাউন্ট আপডেট
  useEffect(() => {
    if (pendingCount > 0) {
      document.title = `🚨 (${pendingCount}) New Orders - Barcode Admin`;
    } else {
      document.title = 'Barcode Restaurant - Admin';
    }
  }, [pendingCount]);

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
            {item.name === 'Orders' && pendingCount > 0 && (
              <span className="bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full animate-pulse shadow-md">
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
    <div 
      onClick={unlockAudioSystem}
      onKeyDown={unlockAudioSystem}
      className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300"
    >
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
            {/* 🔊 সাউন্ড টেস্ট/অ্যাক্টিভ বাটন */}
            <button
              onClick={() => {
                unlockAudioSystem();
                playAlarmSound();
              }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-300 hover:border-primary-500 transition-all"
              title="Click to test notification sound"
            >
              {audioUnlocked ? <Volume2 className="w-3.5 h-3.5 text-green-500" /> : <VolumeX className="w-3.5 h-3.5 text-amber-500" />}
              <span className="hidden md:inline font-medium">{audioUnlocked ? 'Sound Ready' : 'Enable Sound'}</span>
            </button>

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

        {/* 🚨🚨 গ্লোবাল লাল নোটিফিকেশন বার (যতগুলো এক্সেপ্ট/রিজেক্ট করা বাকি থাকবে তা ওপরে দেখাবে) 🚨🚨 */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-600 text-white px-4 py-3 shadow-lg flex items-center justify-between z-20 text-xs sm:text-sm font-semibold border-b-2 border-red-700 sticky top-14"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 bg-white/20 rounded-full animate-ping">
                  <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                </div>
                <span>
                  🚨 মোট <strong>{pendingCount} টি নতুন অর্ডার</strong> এক্সেপ্ট বা রিজেক্ট করার জন্য অপেক্ষা করছে!
                </span>
              </div>
              <Link
                to="/admin/orders"
                className="flex items-center gap-1.5 bg-white text-red-600 font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-neutral-100 transition-all shrink-0 text-xs"
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
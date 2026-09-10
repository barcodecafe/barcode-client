import { useState, useEffect, useMemo } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
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
  Info,
  ShoppingBag,
  Users,
  Tag,
  Image,
  Bike,
  Settings,
  Bell,
  BellRing,
  Volume2,
  ShieldCheck,
  MessageSquarePlus,
  UserPlus,
  Truck,
} from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useTheme } from '../hooks/useTheme';
import { useWakeLock } from '../hooks/useWakeLock';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useOrders } from '../context/OrderContext';
import { socket } from '../services/socket';
import { soundNotification } from '../utils/soundNotification';
import {
  subscribeUserToPush,
  sendTestPushNotification,
  getPushPermissionState,
  isPushSupported,
} from '../services/webPushService';

import resB from '../assets/Barcode_restaurant_group-B.png';
import resW from '../assets/Barcode_restaurant_groupW.png';

// ---------------------------------------------------------------------------
// AdminLayout.jsx
//
// Admin layout shell: sidebar behaves as an inline panel on desktop screens
// and overlay on mobile sizes.
// ---------------------------------------------------------------------------

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true, permission: 'dashboard' },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag, permission: 'orders' },
  { name: 'Dishes', path: '/admin/dishes', icon: UtensilsCrossed, permission: 'dishes' },
  { name: 'Brands', path: '/admin/brands', icon: Store, permission: 'brands' },
  { name: 'Regions', path: '/admin/regions', icon: Map, permission: 'regions' },
  { name: 'Branches', path: '/admin/branches', icon: Building2, permission: 'branches' },
  { name: 'Rider Fleet', path: '/admin/fleet-overview', icon: Bike, permission: 'fleet' },
  { name: 'Add Rider', path: '/admin/add-rider', icon: UserPlus, permission: 'add_rider' },
  { name: 'Customers', path: '/admin/customers', icon: Users, permission: 'customers' },
  { name: 'Customer Reviews', path: '/admin/reviews', icon: MessageSquarePlus, permission: 'reviews' },
  { name: 'Coupons', path: '/admin/coupons', icon: Tag, permission: 'coupons' },
  { name: 'Free Delivery', path: '/admin/free-delivery', icon: Truck, permission: 'free_delivery' },
  { name: 'Hero Carousel', path: '/admin/hero', icon: Image, permission: 'hero' },
  { name: 'About Info', path: '/admin/about', icon: Info, permission: 'about' },
  { name: 'Policies & Terms', path: '/admin/policies', icon: ShieldCheck, permission: 'policies' },
  { name: 'Rider Applications', path: '/admin/rider-applications', icon: Bike, permission: 'rider_applications' },
  { name: 'Site Settings', path: '/admin/settings', icon: Settings, permission: 'settings' },
  { name: 'Staff & Roles', path: '/admin/staff', icon: ShieldCheck, permission: 'staff_management' },
];

export const AdminLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, hasPermission, isSuperAdmin } = useAuth();

  // 📱 Keep mobile screen awake while admin is logged in
  useWakeLock(Boolean(user));

  const getRoleDisplayTitle = (role) => {
    if (['super_admin', 'superadmin'].includes(role)) return 'Super Admin';
    if (role === 'admin') return 'Sub-Admin';
    if (['manager', 'restaurant_manager'].includes(role)) return 'Restaurant Manager';
    return 'Staff Administrator';
  };
  const { settings } = useSettings();
  const { unreadOrderCount, markOrdersAsRead, orders, isAlertActive, stopContinuousAlert } = useOrders();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768,
  );

  const [pushState, setPushState] = useState(() => getPushPermissionState());

  const handleTestAndEnableAlerts = async () => {
    // 🚨 1. Start continuous alert loop immediately (sound + mobile vibration)
    soundNotification.startContinuousOrderAlert();

    // 🔔 2. Dispatch simulated New Order Notification to device
    soundNotification.sendNotification({
      title: '🔔 [TEST] New Order #TEST01 Received!',
      body: '৳650 • Test Customer (Home Delivery)\nClick to view and manage order details.',
      url: '/admin/orders',
      tag: 'admin-test-alert',
    });

    if (!isPushSupported()) {
      toast.success('🔊 Continuous Alert & Vibration started! (Click top banner or Mute to stop)', { id: 'test-sound-toast', duration: 5000 });
      return;
    }

    toast.loading('🔄 Connecting mobile lock-screen push...', { id: 'test-sound-toast' });
    try {
      const res = await subscribeUserToPush({ user });
      const currentState = getPushPermissionState();
      setPushState(currentState);

      if (res?.success === false && res?.reason === 'permission_not_granted') {
        toast.error('⚠️ Please click "Allow" on the notification popup to get lock-screen alerts!', {
          id: 'test-sound-toast',
          duration: 6000,
        });
        return;
      }

      toast.success(
        '🔊 Alert played! 📱 Sending lock-screen test push in 3s... Lock your screen now!',
        { id: 'test-sound-toast', duration: 7000 }
      );

      setTimeout(async () => {
        try {
          await sendTestPushNotification({ user });
        } catch (pushErr) {
          console.warn('Test push error:', pushErr);
        }
      }, 3000);
    } catch (err) {
      toast.error('Could not activate push: ' + (err?.message || err), { id: 'test-sound-toast' });
    }
  };

  const pendingSettlementCount = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return 0;
    return orders.filter((o) => o.isSubmittedToAdmin && !o.isCashSettledByAdmin).length;
  }, [orders]);

  useEffect(() => {
    const handleRiderCashSubmitted = (payload) => {
      const riderName = payload?.riderName || "A rider";
      const date = payload?.date || "today";

      // 🔊 Play notification chime & desktop notification
      soundNotification.playKitchenBellChime();
      soundNotification.sendNotification({
        title: '💰 Cash Handover Submitted!',
        body: `Rider ${riderName} submitted collected cash for ${date}. Click to verify.`,
        url: '/admin/fleet-overview',
        tag: `cash-${riderName}-${date}`,
      });

      toast.custom(
        (t) => (
          <div
            onClick={() => {
              navigate('/admin/fleet-overview');
              toast.dismiss(t.id);
            }}
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-lg w-full bg-white/95 dark:bg-neutral-900/95 shadow-xl shadow-neutral-900/10 rounded-xl pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 border border-primary-500/25 border-l-4 border-l-primary-500 backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base shrink-0">💰</span>
              <div className="min-w-0 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                <span className="text-xs font-black text-primary-600 dark:text-primary-500 whitespace-nowrap">
                  Cash Submitted:
                </span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">
                  {riderName} ({date})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/admin/fleet-overview');
                  toast.dismiss(t.id);
                }}
                className="px-2.5 py-1 rounded-lg bg-primary-500 hover:bg-primary-600 active:scale-95 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                View
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000,
          id: `cash-handover-${payload?.riderId || 'sub'}-${payload?.date || 'today'}`,
        }
      );
    };

    socket.on("rider_cash_submitted", handleRiderCashSubmitted);
    return () => {
      socket.off("rider_cash_submitted", handleRiderCashSubmitted);
    };
  }, [navigate]);

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
        {navItems
          .filter((item) => hasPermission(item.permission))
          .map((item) => {
          const isOrdersRoute = item.path === '/admin/orders';
          const isFleetRoute = item.path === '/admin/fleet-overview';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => {
                if (isOrdersRoute) markOrdersAsRead();
                onNavigate();
              }}
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
                {item.name}
              </div>

              {isOrdersRoute && unreadOrderCount > 0 && (
                <span className="px-2 py-0.5 bg-primary-500 text-white text-[10px] font-extrabold rounded-full animate-bounce">
                  {unreadOrderCount}
                </span>
              )}

              {isFleetRoute && pendingSettlementCount > 0 && (
                <span 
                  className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full animate-pulse shadow-xs" 
                  title={`${pendingSettlementCount} cash handover pending`}
                >
                  {pendingSettlementCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      {/* Mobile Sidebar Backdrop Overlay */}
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

      {/* Sidebar Panel */}
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

      {/* Main content body */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 border-b border-neutral-200/50 dark:border-neutral-800/50 glass bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestAndEnableAlerts}
              className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-1.5"
              title="Test Sound & Send Lock-Screen Notification"
              aria-label="Test Sound and Mobile Notification"
            >
              <Volume2 className="w-4 h-4" />
              {pushState === 'granted' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Mobile Push Connected" />
              )}
            </button>

            <Link
              to="/admin/orders"
              onClick={markOrdersAsRead}
              className="relative p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 transition-all duration-300 flex items-center gap-1.5"
              aria-label="Order Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-primary-500 text-white min-w-5 text-center">
                {unreadOrderCount}
              </span>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 hover:scale-105 transition-all duration-300 cursor-pointer"
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
                  {user?.name || 'Staff User'}
                </p>
                <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                  {getRoleDisplayTitle(user?.role)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 📱 Mobile Push Setup Prompt */}
        {pushState !== 'granted' && isPushSupported() && (
          <div className="bg-amber-500/95 text-neutral-950 px-3.5 py-2 flex items-center justify-between gap-3 text-xs font-bold border-b border-amber-600/40 shadow-xs backdrop-blur-md sticky top-14 z-20">
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className="w-4 h-4 text-neutral-950 animate-bounce shrink-0" />
              <span className="truncate">
                📱 স্ক্রিন লক বা ফেসবুক/ইউটিউব চলাকালীন রিং ও ভাইব্রেশন পেতে নোটিফিকেশন Allow করুন
              </span>
            </div>
            <button
              type="button"
              onClick={handleTestAndEnableAlerts}
              className="px-3 py-1 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              Allow Alerts
            </button>
          </div>
        )}

        {/* 🚨 Continuous Looping Alarm Banner with Mute Control */}
        {isAlertActive && (
          <div className="bg-red-600 text-white px-3.5 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between shadow-xl animate-pulse sticky top-14 z-20 border-b border-red-700 backdrop-blur-md">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm min-w-0">
              <BellRing className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce shrink-0 text-amber-300" />
              <span className="truncate">🚨 New Unaccepted Order! Ringing Alarm & Vibrating...</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/admin/orders"
                className="px-2.5 py-1 bg-white text-red-600 rounded-lg text-xs font-black hover:bg-neutral-100 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                View Orders
              </Link>
              <button
                type="button"
                onClick={stopContinuousAlert}
                className="px-2.5 py-1 bg-red-850 hover:bg-red-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-red-400/50 shadow-xs whitespace-nowrap flex items-center gap-1"
              >
                🔕 Mute
              </button>
            </div>
          </div>
        )}

        {/* 🎯 dynamic responsive container */}
        <main className={`flex-grow py-2 sm:py-2.5 lg:py-3 w-full transition-all duration-250 ${isDrawerOpen ? 'admin-sidebar-open' : 'admin-sidebar-closed'}`}>
          <div className="w-full px-2.5 sm:px-4 lg:px-4 xl:px-6 max-w-full">
            <ErrorBoundary key={location.pathname}>
              <Outlet context={{ isDrawerOpen }} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
// before counting logic

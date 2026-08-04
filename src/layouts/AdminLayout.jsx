import { useState, useEffect, useRef } from "react";
import { getPendingOrderCount } from "../services/ordersService";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  BellOff,
  ShoppingBag as ToastIcon,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { socket } from "../services/socket";

import resB from "../assets/Barcode_restaurant_group-B.png";
import resW from "../assets/Barcode_restaurant_groupW.png";

const navItems = [
  { name: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
  { name: "Dishes", path: "/admin/dishes", icon: UtensilsCrossed },
  { name: "Brands", path: "/admin/brands", icon: Store },
  { name: "Regions", path: "/admin/regions", icon: Map },
  { name: "Branches", path: "/admin/branches", icon: Building2 },
  { name: "Riders Fleet", path: "/admin/fleet-overview", icon: Bike },
  { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
  { name: "Customers", path: "/admin/customers", icon: Users },
  { name: "Coupons", path: "/admin/coupons", icon: Tag },
  { name: "Hero Carousel", path: "/admin/hero", icon: Image },
  { name: "About Info", path: "/admin/about", icon: Info },
  { name: "Rider Applications", path: "/admin/rider-applications", icon: Bike },
  { name: "Site Settings", path: "/admin/settings", icon: Settings },
];

export const AdminLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 🛡️ Role Protection Check
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/admin/login', { replace: true });
    }
  }, [user, navigate]);

  // 🎯 পেন্ডিং কাউন্ট, সাউন্ড ও ইন-অ্যাপ টোস্টার স্টেট
  const [pendingCount, setPendingCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastNotification, setToastNotification] = useState(null);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // ⚡ ১০০% ব্যাকএন্ড ডিপেন্ডেন্ট কাউন্ট এপিআই কল
  const fetchPendingOrders = async () => {
    try {
      const res = await getPendingOrderCount();
      const rawCount =
        typeof res === "number"
          ? res
          : (res?.pendingCount ??
            res?.count ??
            res?.data?.pendingCount ??
            res?.data?.count ??
            (typeof res?.data === "number" ? res.data : 0));

      setPendingCount(Number(rawCount) || 0);
    } catch (err) {
      console.error("Failed to fetch pending count from backend:", err);
    }
  };

  useEffect(() => {
    fetchPendingOrders();

    // 🔔 ব্রাউজার নোটিফিকেশন পারমিশন চাওয়া
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    // ⚡ 1. রিয়েল-টাইম সকেট দিয়ে সরাসরি লাইভ কাউন্ট সিঙ্ক
    const handlePendingCountUpdated = (data) => {
      const rawCount =
        typeof data === "number"
          ? data
          : (data?.pendingCount ?? data?.count ?? data?.data ?? 0);
      setPendingCount(Number(rawCount) || 0);
    };

    // ⚡ 2. নতুন কাস্টমার অর্ডার ইভেন্ট
    const handleNewOrder = (newOrder) => {
      const orderId = newOrder?.id || newOrder?._id || "NEW";
      const totalAmount = newOrder?.totalAmount || newOrder?.total || 0;
      const customerName =
        newOrder?.user?.name || newOrder?.customerName || "Guest";

      // 🔊 অডিও প্লে
      if (soundEnabledRef.current) {
        try {
          const audio = new Audio(
            "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
          );
          audio.play().catch(() => {});
        } catch (e) {}
      }

      // 🚨 ইন-অ্যাপ টোস্টার নোটিফিকেশন
      setToastNotification({
        id: orderId,
        total: totalAmount,
        customer: customerName,
      });

      // ৭ সেকেন্ড পর টোস্টার অটো-ক্লোজ
      setTimeout(() => {
        setToastNotification((prev) => (prev?.id === orderId ? null : prev));
      }, 7000);

      // 💻 সিস্টেম নোটিফিকেশন
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const systemNotif = new Notification("🚨 নতুন অর্ডার এসেছে!", {
            body: `Order ID: #${orderId}\nCustomer: ${customerName}\nTotal: ৳${totalAmount}`,
            icon: settings?.logoLight || resB,
            tag: `order-${orderId}`,
            renotify: true,
            requireInteraction: true,
          });

          systemNotif.onclick = () => {
            window.focus();
            navigate("/admin/orders");
            systemNotif.close();
          };
        } catch (e) {
          console.error("System notification error:", e);
        }
      }

      // ব্যাকএন্ড থেকে কাউন্ট রিফ্রেশ
      fetchPendingOrders();
    };

    // ⚡ 3. অর্ডারের স্ট্যাটাস আপডেট
    const handleStatusUpdate = (data) => {
      fetchPendingOrders();
      if (data?.orderId || data?.id) {
        const updatedId = data?.orderId || data?.id;
        setToastNotification((prev) => (prev?.id === updatedId ? null : prev));
      }
    };

    // ⚡ 4. Rider Cash Submit Notification
    const handleRiderCashSubmitted = (data) => {
      if (soundEnabledRef.current) {
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play().catch(() => {});
        } catch (e) {}
      }

      setToastNotification({
        id: "CASH_REQ",
        customer: `${data.riderName || "Rider"} has submitted cash for ${data.date}`,
        total: "Check Fleet Overview"
      });

      setTimeout(() => setToastNotification(null), 7000);
      window.dispatchEvent(new CustomEvent("order_updated"));
    };

    // Socket Events Listening
    socket.emit("get_pending_count");
    socket.on("pending_count_updated", handlePendingCountUpdated);
    socket.on("admin_new_order", handleNewOrder);
    socket.on("order_updated", handleStatusUpdate);
    socket.on("order_status_updated", handleStatusUpdate);
    socket.on("rider_cash_submitted", handleRiderCashSubmitted);

    const handleCustomOrderUpdate = (e) => {
      fetchPendingOrders();
      if (e?.detail?.orderId || e?.detail?.id) {
        const updatedId = e.detail.orderId || e.detail.id;
        setToastNotification((prev) => (prev?.id === updatedId ? null : prev));
      }
    };
    window.addEventListener("order_updated", handleCustomOrderUpdate);

    return () => {
      socket.off("pending_count_updated", handlePendingCountUpdated);
      socket.off("admin_new_order", handleNewOrder);
      socket.off("order_updated", handleStatusUpdate);
      socket.off("order_status_updated", handleStatusUpdate);
      socket.off("rider_cash_submitted", handleRiderCashSubmitted);
      window.removeEventListener("order_updated", handleCustomOrderUpdate);
    };
  }, [navigate, settings?.logoLight]);

  // ব্রাউজার ট্যাবের টাইটেল আপডেট
  useEffect(() => {
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) New Orders - Barcode Admin`;
    } else {
      document.title = "Barcode Restaurant - Admin";
    }
  }, [pendingCount]);

  useEffect(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    setIsDrawerOpen(isDesktop);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const SidebarContent = ({ onNavigate }) => (
    <>
      <Link
        to="/admin"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 mb-8"
      >
        <div className="h-10 flex items-center rounded-xl px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <img
            src={
              theme === "dark"
                ? settings.logoDark || resW
                : settings.logoLight || resB
            }
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
                  ? "bg-primary-500/10 text-primary-500 font-semibold"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-500"
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </div>

            {item.name === "Orders" && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
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
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300 relative">
      {/* 🚨 In-App Toast Popup */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-white dark:bg-neutral-900 border-2 border-primary-500 shadow-2xl rounded-2xl p-4 flex items-start gap-3 cursor-pointer"
            onClick={() => {
              navigate(toastNotification.id === "CASH_REQ" ? "/admin/fleet-overview" : "/admin/orders");
              setToastNotification(null);
            }}
          >
            <div className="p-2.5 bg-primary-500/10 text-primary-500 rounded-xl shrink-0 animate-bounce">
              <ToastIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  {toastNotification.id === "CASH_REQ" ? "💰 ক্যাশ সাবমিট রিকোয়েস্ট!" : "🚨 নতুন অর্ডার এসেছে!"}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToastNotification(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
                {toastNotification.id === "CASH_REQ" ? "Action Required" : `Order ID: #${toastNotification.id}`}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {toastNotification.id === "CASH_REQ" ? toastNotification.customer : `Customer: ${toastNotification.customer} • Total: ৳${toastNotification.total}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        transition={{ type: "tween", duration: 0.25 }}
        className={`shrink-0 overflow-hidden flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200/60 dark:border-neutral-800/60 shadow-xs z-50 md:z-20 md:sticky md:top-0 md:h-screen fixed left-0 top-0 bottom-0`}
      >
        <div className="w-64 flex flex-col px-4 py-6 h-full relative shrink-0">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="absolute top-5 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          {/* 🎯 ফাংশন হিসেবে কল করা হলো রেন্ডারিং ইস্যু ফিক্স করার জন্য */}
          {SidebarContent({
            onNavigate: () => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setIsDrawerOpen(false);
              }
            }
          })}
        </div>
      </motion.aside>

      <div className="flex-grow flex flex-col min-w-0">
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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer p-1"
                title={
                  soundEnabled
                    ? "Sound Enabled (Click to Mute)"
                    : "Sound Muted (Click to Unmute)"
                }
              >
                {soundEnabled ? (
                  <Bell className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                )}
              </button>

              <Link
                to="/admin/orders"
                className={`min-w-[20px] h-5 px-1.5 rounded-full text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                  pendingCount > 0
                    ? "bg-red-500 scale-105"
                    : "bg-neutral-400 dark:bg-neutral-600"
                }`}
                title="Click to view orders"
              >
                {pendingCount}
              </Link>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 hover:scale-105 transition-all duration-300 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 dark:border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center font-display font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="leading-tight hidden sm:block">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
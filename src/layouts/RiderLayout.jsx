import { useState, useEffect, useRef } from "react";
import { getAllOrders } from "../services/ordersService";
import { updateRiderStatus } from "../services/ridersService";
import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  ShoppingBag,
  Bike,
  Menu as MenuIcon,
  X,
  Sun,
  Moon,
  LogOut,
  Bell,
  BellOff,
  Volume2,
  ClipboardList,
  ShoppingBag as ToastIcon,
  Power,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { socket } from "../services/socket";

import resB from "../assets/Barcode_restaurant_group-B.png";
import resW from "../assets/Barcode_restaurant_groupW.png";

const navItems = [
  { name: "Overview", path: "/rider", icon: LayoutDashboard, end: true },
  { name: "Assigned Orders", path: "/rider/orders", icon: ShoppingBag },
  { name: "Daily Track Log", path: "/rider/settlement", icon: ClipboardList },
];

// 🎯 FIX: অর্ডারটি এই রাইডারের কি না তা চেক করার জন্য বুলেটপ্রুফ গ্লোবাল ফাংশন
export const isAssignedToMe = (orderOrData, user) => {
  if (!user || !orderOrData) return false;
  
  const uId = String(user.id || user._id || "").trim();
  const uName = String(user.name || "").trim().toLowerCase();

  const oId1 = String(orderOrData.riderId || "").trim();
  const oId2 = String(orderOrData.rider?._id || "").trim();
  const oId3 = String(orderOrData.rider || "").trim();
  const oId4 = String(orderOrData.order?.riderId || "").trim();

  const oName1 = String(orderOrData.riderName || "").trim().toLowerCase();
  const oName2 = String(orderOrData.rider?.name || "").trim().toLowerCase();
  const oName3 = String(orderOrData.order?.riderName || "").trim().toLowerCase();

  const idMatch = uId !== "" && (uId === oId1 || uId === oId2 || uId === oId3 || uId === oId4);
  const nameMatch = uName !== "" && (uName === oName1 || uName === oName2 || uName === oName3);

  return idMatch || nameMatch;
};

export const RiderLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [pendingCount, setPendingCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastNotification, setToastNotification] = useState(null);
  const [isDutyUpdating, setIsDutyUpdating] = useState(false);
  const riderStatus = user?.riderStatus || 'Available';

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const audioCtxRef = useRef(null);
  const ordersRef = useRef([]);
  const notifiedOrdersRef = useRef(new Set());

  useEffect(() => {
    const unlockAudioContext = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
      } catch (err) {
        console.error("Audio Context Unlock Error:", err);
      }
      window.removeEventListener("click", unlockAudioContext);
      window.removeEventListener("touchstart", unlockAudioContext);
    };

    window.addEventListener("click", unlockAudioContext);
    window.addEventListener("touchstart", unlockAudioContext);

    return () => {
      window.removeEventListener("click", unlockAudioContext);
      window.removeEventListener("touchstart", unlockAudioContext);
    };
  }, []);

  const playLoudNotificationChime = () => {
    if (!soundEnabledRef.current) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, now + 0.15);
      gain2.gain.setValueAtTime(0.8, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.error("Failed to play synth sound:", e);
    }
  };

  const fetchRiderPendingOrders = async () => {
    if (!user) return;
    try {
      const ordersData = await getAllOrders();
      const ordersList = Array.isArray(ordersData) ? ordersData : ordersData?.data || [];

      // 🎯 FIX: নতুন লজিক ব্যবহার করে ফিল্টার করা
      const assigned = ordersList.filter((o) => {
        const isMyOrder = isAssignedToMe(o, user);
        const isActive = o.status !== "Delivered" && o.status !== "Rejected";
        return isMyOrder && isActive;
      });

      ordersRef.current = assigned;

      // প্রথম লোডে থাকা অর্ডারগুলো সেভ রাখা যাতে রিলোডে অযথা এলার্ম না বাজে
      if (notifiedOrdersRef.current.size === 0) {
        assigned.forEach((o) => {
          const id = String(o._id || o.id);
          if (id) notifiedOrdersRef.current.add(id);
        });
      }

      const pendingAcceptance = assigned.filter((o) => {
        return o.riderAcceptStatus === "pending" || !o.riderAcceptStatus;
      });

      setPendingCount(pendingAcceptance.length);
    } catch (err) {
      console.error("Failed to fetch rider pending orders:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRiderPendingOrders();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    let refetchTimer = null;
    const scheduleRefetch = () => {
      clearTimeout(refetchTimer);
      refetchTimer = setTimeout(fetchRiderPendingOrders, 500);
    };

    // 🚴 ১. শুধুমাত্র নতুন ডেলিভারি অ্যাসাইন হলেই এলার্ম ও পপআপ আসবে
    const handleNewOrderAssigned = (data) => {
      scheduleRefetch();

      const incomingOrder = data?.order || data;
      if (!incomingOrder) return;

      const isForMe = isAssignedToMe(incomingOrder, user);
      if (!isForMe) return;

      const rawId = incomingOrder.id || incomingOrder._id || incomingOrder.orderId;
      const orderId = rawId ? String(rawId) : "NEW";

      // ইতিমধ্যে নোটিফাই করা হয়ে থাকলে বা এক্সেপ্টেড/ডেলিভার্ড হলে আর এলার্ম বাজবে না
      if (orderId !== "NEW" && notifiedOrdersRef.current.has(orderId)) {
        return;
      }

      const acceptStatus = incomingOrder.riderAcceptStatus;
      const orderStatus = incomingOrder.status;
      if (acceptStatus === "accepted" || orderStatus === "Delivered" || orderStatus === "Rejected") {
        return;
      }

      if (orderId !== "NEW") {
        notifiedOrdersRef.current.add(orderId);
      }

      playLoudNotificationChime();

      const totalAmount = incomingOrder.total || incomingOrder.totalAmount || 0;
      const customerName = incomingOrder.user?.name || incomingOrder.customerName || "Customer";

      setToastNotification({
        id: orderId,
        total: totalAmount,
        customer: customerName,
      });

      setTimeout(() => {
        setToastNotification((prev) => (prev?.id === orderId ? null : prev));
      }, 7000);

      if ("Notification" in window && Notification.permission === "granted") {
        const displayId = orderId !== "NEW" ? `#${orderId.slice(-6).toUpperCase()}` : "";
        const desktopNotif = new Notification(
          "🚴 New Delivery Assigned!",
          {
            body: `Order ${displayId}\nCustomer: ${customerName}\nTotal: ৳${totalAmount}`,
            icon: settings?.logoLight || resB,
            requireInteraction: true,
          }
        );

        desktopNotif.onclick = () => {
          window.focus();
          navigate("/rider/orders");
          desktopNotif.close();
        };
      }
    };

    // 🔄 ২. স্ট্যাটাস পরিবর্তন হলে নিঃশব্দে ডাটা রিফ্রেশ হবে (কোনো নতুন অর্ডার এলার্ম বাজবে না)
    const handleSilentSync = () => {
      scheduleRefetch();
    };

    // 💰 ৩. এডমিন ক্যাশ সেটেল করলে নোটিফিকেশন
    const handleCashSettled = (payload) => {
      scheduleRefetch();
      const targetRiderId = payload?.riderId;
      const currentRiderId = String(user?.id || user?._id || "");
      if (!targetRiderId || String(targetRiderId) === currentRiderId) {
        toast.success(`💰 Admin confirmed your cash settlement for ${payload?.date || "today"}!`, {
          duration: 6000,
          id: `rider-cash-settled-${targetRiderId || currentRiderId}-${payload?.date || "today"}`,
        });
      }
    };

    // 👤 ৪. রাইডারের ডিউটি স্ট্যাটাস (Online/On Break) রিয়েল-টাইমে সিঙ্ক করা
    const handleRiderStatusSync = (payload) => {
      const targetRiderId = String(payload?.riderId || payload?._id || payload?.id || "");
      const currentRiderId = String(user?.id || user?._id || "");
      if (!targetRiderId || targetRiderId === currentRiderId) {
        refreshUser();
      }
    };

    socket.on("rider_order_assigned", handleNewOrderAssigned);
    socket.on("order_assigned", handleNewOrderAssigned);
    socket.on("order_updated", handleSilentSync);
    socket.on("order_status_updated", handleSilentSync);
    socket.on("rider_order_updated", handleSilentSync);
    socket.on("rider_cash_settled", handleCashSettled);
    socket.on("rider_status_changed", handleRiderStatusSync);
    socket.on("rider_updated", handleRiderStatusSync);

    return () => {
      clearTimeout(refetchTimer);
      socket.off("rider_order_assigned", handleNewOrderAssigned);
      socket.off("order_assigned", handleNewOrderAssigned);
      socket.off("order_updated", handleSilentSync);
      socket.off("order_status_updated", handleSilentSync);
      socket.off("rider_order_updated", handleSilentSync);
      socket.off("rider_cash_settled", handleCashSettled);
      socket.off("rider_status_changed", handleRiderStatusSync);
      socket.off("rider_updated", handleRiderStatusSync);
    };
  }, [user, navigate, refreshUser, settings?.logoLight]);

  useEffect(() => {
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) Action Needed - Rider Portal`;
    } else {
      document.title = "Rider Portal - Barcode Restaurant";
    }
  }, [pendingCount]);

  useEffect(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    setIsDrawerOpen(isDesktop);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const SidebarContent = ({ onNavigate }) => (
    <>
      <Link
        to="/rider"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 mb-8"
      >
        <div className="h-10 flex items-center gap-3 rounded-xl px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <img
            src={
              theme === "dark"
                ? settings?.logoDark || resW
                : settings?.logoLight || resB
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
                  ? "bg-rose-500/10 text-rose-500 font-semibold"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-rose-500"
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </div>

            {item.name === "Assigned Orders" && pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
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

  const handleToggleDuty = async () => {
    if (!user) return;
    const nextStatus = riderStatus === 'Available' ? 'Busy' : 'Available';
    try {
      setIsDutyUpdating(true);
      await updateRiderStatus(user.id || user._id, nextStatus);
      await refreshUser();
      toast.success(
        nextStatus === 'Available'
          ? '🟢 You are now Online (Available for deliveries)'
          : '🔴 You are now Offline / Busy (On Break)',
        { duration: 4000 }
      );
    } catch (err) {
      toast.error('Failed to change status: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDutyUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300 relative">
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-white dark:bg-neutral-900 border-2 border-rose-500 shadow-2xl rounded-2xl p-4 flex items-start gap-3 cursor-pointer"
            onClick={() => {
              navigate("/rider/orders");
              setToastNotification(null);
            }}
          >
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl shrink-0 animate-bounce">
              <ToastIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  🚴 New Delivery Assigned!
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToastNotification(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                Order ID: #{toastNotification.id}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Customer: {toastNotification.customer}
                {toastNotification.total ? ` • ৳${toastNotification.total}` : ""}
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
        className="shrink-0 overflow-hidden flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200/60 dark:border-neutral-800/60 shadow-xs z-50 md:z-20 md:sticky md:top-0 md:h-screen fixed left-0 top-0 bottom-0"
      >
        <div className="w-64 flex flex-col px-4 py-6 h-full relative shrink-0">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="absolute top-5 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent
            onNavigate={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setIsDrawerOpen(false);
              }
            }}
          />
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
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 hidden sm:inline-block">
              Rider Delivery Panel
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Duty Availability Toggle */}
            <button
              onClick={handleToggleDuty}
              disabled={isDutyUpdating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                riderStatus === "Available"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              }`}
              title="Click to toggle Online / Offline Duty Status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  riderStatus === "Available"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span>{riderStatus === "Available" ? "Online" : "On Break"}</span>
            </button>

            <button
              onClick={playLoudNotificationChime}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
              title="Test Sound Engine"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Test Sound</span>
            </button>

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
                <Bell className="w-4 h-4 text-rose-500" />
              ) : (
                <BellOff className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              )}
            </button>

            <Link
              to="/rider/orders"
              className={`min-w-[20px] h-5 px-1.5 rounded-full text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                pendingCount > 0
                  ? "bg-rose-500"
                  : "bg-neutral-400 dark:bg-neutral-600"
              }`}
              title="Click to view assigned orders"
            >
              {pendingCount}
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-rose-500 hover:scale-105 transition-all duration-300 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 dark:border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-sm">
                <Bike className="w-4 h-4" />
              </div>
              <div className="leading-tight hidden sm:block">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                  {user?.name || "Rider"}
                </p>
                <p
                  className={`text-[10px] font-bold uppercase ${
                    riderStatus === "Available"
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }`}
                >
                  {riderStatus === "Available" ? "Active Hero" : "On Break"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          {/* Keyed on the path so leaving a page that crashed clears the
              boundary. Inside the shell, so a broken page keeps the rider's
              navigation usable instead of blanking the portal. */}
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default RiderLayout;
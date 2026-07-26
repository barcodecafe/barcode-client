import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Users,
  UtensilsCrossed,
  MapPin,
  GitBranch,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Bell,
  BellOff,
} from "lucide-react";
import { getAllOrders } from "../services/ordersService";
import { socket } from "../services/socket";

// Web Audio API দিয়ে তৈরি টিং-টিং নোটিফিকেশন সাউন্ড
const playOrderChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 Tone
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5 Tone

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const soundEnabledRef = useRef(soundEnabled);

  const navigate = useNavigate();
  const location = useLocation();

  // Ref আপডেট রাখা যাতে সকেটের ভেতরের কলব্যাক লেটেস্ট স্টেট পায়
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // ১. লাইভ ঘড়ি (Live Clock - 10:14 AM ফরম্যাটে)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // ২. পেন্ডিং অর্ডার গণনা করার হেলপার
  const updatePendingCountFromOrders = (ordersList) => {
    if (!Array.isArray(ordersList)) return;
    const pending = ordersList.filter((ord) => {
      const st = String(ord.status || "").toUpperCase();
      return st === "PLACED" || st === "PENDING" || st === "PICK ORDER" || !ord.status;
    });
    setPendingCount(pending.length);
  };

  const fetchPendingOrders = () => {
    getAllOrders()
      .then((data) => updatePendingCountFromOrders(data))
      .catch((err) => console.error("Error fetching pending count:", err));
  };

  // ৩. ইনিশিয়াল ডাটা লোড ও সকেট লিসেনার
  useEffect(() => {
    fetchPendingOrders();

    // নতুন অর্ডার আসলে
    socket.on("order_created", (newOrder) => {
      if (soundEnabledRef.current) {
        playOrderChime();
      }
      fetchPendingOrders();
    });

    // অর্ডারের স্ট্যাটাস আপডেট হলে
    socket.on("order_updated", () => {
      fetchPendingOrders();
    });

    // কাস্টম ইভেন্ট লিসেনার (AdminOrders থেকে ট্রিগার হলে)
    const handleOrderEvent = () => fetchPendingOrders();
    window.addEventListener("order_updated", handleOrderEvent);

    return () => {
      socket.off("order_created");
      socket.off("order_updated");
      window.removeEventListener("order_updated", handleOrderEvent);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      playOrderChime(); // টেস্ট হিসেবে একবার রিং বাজবে
    }
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Orders & Live Chat", path: "/admin/orders", icon: ShoppingBag, badge: pendingCount },
    { name: "Food Menu", path: "/admin/menu", icon: UtensilsCrossed },
    { name: "Riders Fleet", path: "/admin/riders", icon: Users },
    { name: "Branches", path: "/admin/branches", icon: GitBranch },
    { name: "Delivery Regions", path: "/admin/regions", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col md:flex-row text-neutral-800 dark:text-neutral-100 font-sans">
      {/* Top Header Widget (Mobile + Desktop Header Bar) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-display font-extrabold text-lg text-primary-500">
          Barcode Admin
        </span>

        {/* Live Clock, Mute & Badge Widget (Mobile) */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {currentTime}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <button
                onClick={toggleSound}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                title={soundEnabled ? "Sound On (Click to Mute)" : "Sound Muted (Click to Enable)"}
              >
                {soundEnabled ? (
                  <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-neutral-400" />
                )}
              </button>

              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
                {pendingCount}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between shrink-0 z-40`}
      >
        <div className="space-y-6">
          <div className="hidden md:flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-xl tracking-tight text-primary-500">
                Barcode Admin
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">
                Management Portal
              </p>
            </div>
          </div>

          {/* Desktop Notification Widget Widget (Time + Bell + Green Count Badge) */}
          <div className="hidden md:flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800">
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wide">
              {currentTime || "10:14 AM"}
            </span>

            <div className="flex items-center justify-center gap-3 mt-1.5">
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 text-neutral-500 transition-all cursor-pointer active:scale-95"
                title={soundEnabled ? "Sound Enabled (Click to Mute)" : "Sound Muted (Click to Enable)"}
              >
                {soundEnabled ? (
                  <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-neutral-400 stroke-[2.5]" />
                )}
              </button>

              <span
                className="w-6 h-6 rounded-full bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs animate-pulse"
                title={`${pendingCount} Pending Orders`}
              >
                {pendingCount}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? "bg-primary-500 text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? "bg-white text-primary-600"
                          : "bg-emerald-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
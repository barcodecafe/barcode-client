import { useState } from "react";
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
} from "lucide-react";

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Orders & Live Chat", path: "/admin/orders", icon: ShoppingBag },
    { name: "Food Menu", path: "/admin/menu", icon: UtensilsCrossed },
    { name: "Riders Fleet", path: "/admin/riders", icon: Users },
    { name: "Branches", path: "/admin/branches", icon: GitBranch },
    { name: "Delivery Regions", path: "/admin/regions", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col md:flex-row text-neutral-800 dark:text-neutral-100 font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-display font-extrabold text-lg text-primary-500">
          Barcode Admin
        </span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between shrink-0 z-40`}
      >
        <div className="space-y-6">
          <div className="hidden md:block">
            <h2 className="font-display font-black text-xl tracking-tight text-primary-500">
              Barcode Admin
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">
              Management Portal
            </p>
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? "bg-primary-500 text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-red-500 hover:bg-red-500/10 transition-colors"
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
import { useState, useEffect, useRef } from "react";
import { NavLink, Link, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Grid3x3,
  Building2,
  Phone,
  Mail,
  Globe,
  ArrowUpRight,
  ShoppingBag,
  Search as SearchIcon,
  Menu,
  X,
  User,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Bike,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { BrandProvider } from "../context/BrandContext";
import { getBrandBySlug } from "../services/brandsService";
import { ScrollToTop } from "../components/ScrollToTop";
import { BrandSearchBar } from "../components/BrandSearchBar";
import { CartDrawer } from "../components/CartDrawer";

const ROLE_LABELS = { admin: "Administrator", rider: "Delivery Rider", user: "Customer" };

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar = ({ name, size = "sm" }) => {
  const dim = size === "lg" ? "w-9 h-9 text-xs" : "w-6 h-6 text-[10px]";
  return (
    <span
      className={`grid place-items-center shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold font-display select-none ${dim}`}
    >
      {getInitials(name)}
    </span>
  );
};

export const BrandLayout = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { cartItemCount, openCart } = useCart();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isRider = user?.role === "rider";

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else if (user?.role === 'rider') {
      navigate('/rider', { replace: true });
    }
  }, [isAdmin, user, navigate]);

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getBrandBySlug(slug)
      .then((b) => (b ? setBrand(b) : setNotFound(true)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Handle outside clicks & scroll for mobile drawer and user menu
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    const handleOutsideClick = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        const toggleBtn = e.target.closest('[aria-label="Toggle brand menu"]');
        if (!toggleBtn) setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isUserDropdownOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsUserDropdownOpen(false);
    };
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [isUserDropdownOpen]);

  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    setIsOpen(false);
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-950 px-4 text-center">
        <Building2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
        <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white">Brand not found</h1>
        <Link to="/brands" className="text-primary-500 font-semibold text-sm hover:underline">
          ← Back to all brands
        </Link>
      </div>
    );
  }

  const logo = theme === "dark" ? brand.logoDark || brand.logoLight : brand.logoLight || brand.logoDark;
  const base = `/brands/${brand.slug}`;

  // 🎯 Desktop & Mobile Navigation Links (Home, Branches, Menu)
  const navLinks = [
    { name: "Home", path: base, end: true },
    { name: "Branches", path: `${base}/branches`, end: false },
    { name: "Menu", path: `${base}/menu`, end: false },
  ];

  const accountLinks = [];
  if (isAdmin) accountLinks.push({ to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard });
  if (isRider) accountLinks.push({ to: "/rider", label: "Rider Portal", icon: Bike });

  const roleLabel = ROLE_LABELS[user?.role] || user?.role;
  const iconBtn =
    "relative p-1.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:border-primary-500/40 dark:hover:text-primary-500 hover:bg-white dark:hover:bg-neutral-900 transition-all duration-200";

  return (
    <BrandProvider brand={brand}>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100">
        {/* Brand-themed Top Bar */}
        <div className="bg-primary-500 text-white text-[11px] font-medium">
          <div className="site-container py-1.5 flex items-center justify-between gap-3">
            <span className="truncate font-semibold">Part of the Barcode Restaurant Group</span>
            <Link to="/brands" className="inline-flex items-center gap-1 shrink-0 hover:underline font-semibold">
              <Grid3x3 className="w-3 h-3" /> All Brands
            </Link>
          </div>
        </div>

        {/* Brand Sticky Navbar */}
        <header className="sticky top-0 z-50 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-all duration-300">
          <div className="site-container h-14 flex items-center justify-between gap-2 xl:gap-4">
            {/* Brand Logo / Brand Title */}
            <Link to={base} className="flex items-center gap-2.5 shrink-0 min-w-0 group">
              {logo ? (
                <img
                  src={logo}
                  alt={brand.name}
                  className="h-8 w-auto max-w-[150px] object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="font-display text-lg font-extrabold tracking-tight text-neutral-800 dark:text-white truncate">
                  {brand.name}
                </span>
              )}
            </Link>

            {/* Desktop Navigation Links (Center) */}
            <nav className="hidden md:flex items-center gap-3 lg:gap-5 shrink-0">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) =>
                    `text-xs lg:text-sm font-medium transition-colors duration-200 relative py-1 whitespace-nowrap ${
                      isActive
                        ? "text-primary-600 dark:text-primary-500 font-semibold"
                        : "text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-500"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.name}
                      {isActive && (
                        <motion.div
                          layoutId="activeBrandNav"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Brand Search Bar (Desktop - Scoped strictly to this Brand) */}
            <div className="hidden lg:block w-44 xl:w-56 shrink">
              <BrandSearchBar brand={brand} variant="desktop" />
            </div>

            {/* Right Controls (Desktop) */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              {/* Theme Toggle Button */}
              <button onClick={toggleTheme} className={iconBtn} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {/* Cart Drawer Open Button with Live Badge */}
              <button onClick={openCart} className={iconBtn} aria-label="Open order cart">
                <ShoppingBag className="w-3.5 h-3.5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-primary-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-neutral-950">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* Group Site Quick Link */}
              <Link
                to="/"
                className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
                title="Go to Barcode Restaurant Group main site"
              >
                Barcode Group <ArrowUpRight className="w-3 h-3 text-neutral-400" />
              </Link>

              <span className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-0.5" aria-hidden="true" />

              {/* User Account / Auth Dropdown */}
              <div className="relative" ref={userMenuRef}>
                {isAuthenticated ? (
                  <div className="relative group">
                    <button
                      onClick={() => setIsUserDropdownOpen((v) => !v)}
                      className="flex items-center gap-1 p-1 rounded-full border border-neutral-200/70 dark:border-neutral-800/70 bg-white/50 dark:bg-neutral-900/50 hover:border-primary-500/40 hover:bg-white dark:hover:bg-neutral-900 transition-all duration-200"
                      aria-label="Open account menu"
                      aria-haspopup="menu"
                      aria-expanded={isUserDropdownOpen}
                    >
                      <Avatar name={user.name} />
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-neutral-400 mr-0.5 transition-transform duration-200 ${
                          isUserDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[11px] font-semibold rounded-md whitespace-nowrap shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                      {user.name}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 dark:bg-neutral-100 rotate-45" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsUserDropdownOpen((v) => !v)}
                    className={iconBtn}
                    aria-label="Open sign in menu"
                    aria-haspopup="menu"
                    aria-expanded={isUserDropdownOpen}
                  >
                    <User className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/10 overflow-hidden z-50"
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-100 dark:border-neutral-800">
                            <Avatar name={user.name} size="lg" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-800 dark:text-white truncate">{user.name}</p>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500">
                                {roleLabel}
                              </span>
                            </div>
                          </div>

                          <div className="p-1 border-b border-neutral-100 dark:border-neutral-800">
                            <Link
                              to="/profile"
                              role="menuitem"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-primary-500 dark:hover:text-primary-500 transition-colors"
                            >
                              <User className="w-3.5 h-3.5 shrink-0" />
                              My Profile & Orders
                            </Link>

                            {accountLinks.map((item) => (
                              <Link
                                key={item.to}
                                to={item.to}
                                role="menuitem"
                                onClick={() => setIsUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-primary-500 dark:hover:text-primary-500 transition-colors"
                              >
                                <item.icon className="w-3.5 h-3.5 shrink-0" />
                                {item.label}
                              </Link>
                            ))}
                          </div>

                          <div className="p-1">
                            <button
                              onClick={handleLogout}
                              role="menuitem"
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <LogOut className="w-3.5 h-3.5 shrink-0" />
                              Log Out
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-3.5 py-3 bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs font-bold text-neutral-800 dark:text-white">Welcome to {brand.name}</p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Login to manage your orders</p>
                          </div>

                          <div className="p-1 flex flex-col gap-0.5">
                            <Link
                              to="/login"
                              role="menuitem"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-primary-500 dark:hover:text-primary-500 transition-colors"
                            >
                              <LogIn className="w-3.5 h-3.5 text-neutral-500" />
                              Log In
                            </Link>
                            <Link
                              to="/signup"
                              role="menuitem"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-primary-500 dark:hover:text-primary-500 transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-neutral-500" />
                              Sign Up
                            </Link>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Navigation Controls */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={() => setIsMobileSearchOpen((v) => !v)}
                className={iconBtn}
                aria-label="Toggle brand search"
              >
                {isMobileSearchOpen ? <X className="w-4 h-4" /> : <SearchIcon className="w-4 h-4" />}
              </button>

              <button onClick={openCart} className={iconBtn} aria-label="Open order cart">
                <ShoppingBag className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-primary-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-neutral-950">
                    {cartItemCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className={iconBtn}
                aria-label="Toggle brand menu"
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Expansion */}
          <AnimatePresence>
            {isMobileSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden border-t border-neutral-200/60 dark:border-neutral-800/60"
              >
                <div className="p-3">
                  <BrandSearchBar brand={brand} variant="mobile" onClose={() => setIsMobileSearchOpen(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Navigation Tabs */}
          <div className="md:hidden border-t border-neutral-100 dark:border-neutral-800 flex">
            {navLinks.map((l) => (
              <NavLink
                key={l.path}
                to={l.path}
                end={l.end}
                className={({ isActive }) =>
                  `flex-1 text-center py-2.5 text-xs font-semibold ${
                    isActive ? "text-primary-500 border-b-2 border-primary-500" : "text-neutral-500"
                  }`
                }
              >
                {l.name}
              </NavLink>
            ))}
          </div>
        </header>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 top-14 z-40 bg-neutral-950/40 backdrop-blur-sm md:hidden"
              />

              <motion.div
                ref={mobileMenuRef}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed right-0 top-14 z-40 w-72 max-w-[85vw] max-h-[calc(100dvh-3.5rem)] bg-white dark:bg-neutral-900 border-l border-b border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-4 shadow-2xl md:hidden overflow-y-auto rounded-bl-2xl"
              >
                {isAuthenticated && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800">
                    <Avatar name={user.name} size="lg" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-800 dark:text-white truncate">{user.name}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      end={link.end}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `text-base font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-primary-500/10 text-primary-600 dark:text-primary-500"
                            : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-500 dark:hover:text-primary-500"
                        }`
                      }
                    >
                      {link.name}
                    </NavLink>
                  ))}

                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-semibold py-2 px-4 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-primary-500 flex items-center justify-between"
                  >
                    <span>Barcode Restaurant Group</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/brands"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-semibold py-2 px-4 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-primary-500 flex items-center justify-between"
                  >
                    <span>All Brands</span>
                    <Grid3x3 className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Theme</span>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-2.5 py-2 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold hover:border-primary-500/40 hover:text-primary-500 transition-all text-xs"
                      >
                        <User className="w-4 h-4 shrink-0" />
                        My Profile & Orders
                      </Link>

                      {accountLinks.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsOpen(false)}
                          className="w-full flex items-center gap-2.5 py-2 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold hover:border-primary-500/40 hover:text-primary-500 transition-all text-xs"
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          {item.label}
                        </Link>
                      ))}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-500/20 active:scale-95 transition-all duration-200 text-xs"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold hover:border-primary-500/40 hover:text-primary-500 active:scale-95 transition-all duration-200 text-xs"
                      >
                        <LogIn className="w-4 h-4" />
                        Log In
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/20 active:scale-95 transition-all duration-200 text-xs"
                      >
                        <UserPlus className="w-4 h-4" />
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1" key={location.pathname}>
          <Outlet />
        </main>

        {/* Global Cart Drawer inside Brand Microsite */}
        <CartDrawer />

        {/* Brand-themed Footer */}
        <footer className="border-t border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 mt-8">
          <div className="site-container py-10">
            <div className="flex flex-col sm:flex-row justify-between gap-8">
              <div className="max-w-sm">
                {logo ? (
                  <img src={logo} alt={brand.name} className="h-9 w-auto object-contain mb-3" />
                ) : (
                  <h3 className="font-display text-lg font-extrabold text-neutral-800 dark:text-white mb-2">
                    {brand.name}
                  </h3>
                )}
                {brand.tagline && <p className="text-sm text-neutral-500 dark:text-neutral-400">{brand.tagline}</p>}
                <div className="flex items-center gap-4 mt-4 text-xs font-semibold">
                  {brand.facebook && (
                    <a
                      href={brand.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-400 hover:text-primary-500"
                    >
                      Facebook
                    </a>
                  )}
                  {brand.instagram && (
                    <a
                      href={brand.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-400 hover:text-primary-500"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                {brand.contactPhone && (
                  <a href={`tel:${brand.contactPhone}`} className="flex items-center gap-2 hover:text-primary-500">
                    <Phone className="w-3.5 h-3.5" /> {brand.contactPhone}
                  </a>
                )}
                {brand.contactEmail && (
                  <a href={`mailto:${brand.contactEmail}`} className="flex items-center gap-2 hover:text-primary-500">
                    <Mail className="w-3.5 h-3.5" /> {brand.contactEmail}
                  </a>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary-500"
                  >
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
              <span>© {brand.name}. Part of Barcode Restaurant Group.</span>
              <Link to="/brands" className="hover:text-primary-500 font-semibold">
                Explore all brands →
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </BrandProvider>
  );
};

export default BrandLayout;

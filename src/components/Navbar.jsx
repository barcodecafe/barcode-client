import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useFulfillment } from '../context/FulfillmentContext';
import { Sun, Moon, Menu, X, ShoppingBag, Truck, Search as SearchIcon, User, LogIn, UserPlus, LogOut, LayoutDashboard, Bike, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrand } from '../context/BrandContext';
import { SearchBar } from './SearchBar';
import { BrandSearchBar } from './BrandSearchBar';

import resB from '../assets/Barcode_restaurant_group-B.png';
import resW from '../assets/Barcode_restaurant_groupW.png';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  superadmin: 'Super Admin',
  admin: 'Administrator',
  manager: 'Restaurant Manager',
  restaurant_manager: 'Restaurant Manager',
  rider: 'Delivery Rider',
  user: 'Customer',
};

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar = ({ name, size = 'sm' }) => {
  const dim = size === 'lg' ? 'w-9 h-9 text-xs' : 'w-6 h-6 text-[10px]';
  return (
    <span
      className={`grid place-items-center shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold font-display select-none ${dim}`}
    >
      {getInitials(name)}
    </span>
  );
};

export const Navbar = () => {
  const location = useLocation();
  const isAdminOrRiderRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/rider');
  const { theme, toggleTheme } = useTheme();
  const { cartItemCount, openCart } = useCart();
  const { settings } = useSettings();
  const { isPickup, selectedBranch, openFulfillmentModal } = useFulfillment();
  const brand = useBrand();

  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isRider = user?.role === 'rider';

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const baseNavLinks = brand
    ? [
        { name: 'Home', path: `/brands/${brand.slug}`, end: true },
        { name: 'Branches', path: `/brands/${brand.slug}/branches`, end: false },
        { name: 'Menu', path: `/brands/${brand.slug}/menu`, end: false },
      ]
    : [
        { name: 'Home', path: '/', end: true },
        { name: 'Our Brands', path: '/brands', end: false },
        { name: 'Our Branches', path: '/branches', end: false },
        { name: 'Menu', path: '/menu', end: false },
        { name: 'About', path: '/about', end: false },
      ];

  const ordersPath = brand
    ? `/brands/${brand.slug}/profile?tab=orders`
    : '/profile?tab=orders';

  const profilePath = brand
    ? `/brands/${brand.slug}/profile`
    : '/profile';

  const navLinks = isAuthenticated
    ? [...baseNavLinks, { name: 'My Orders', path: ordersPath }]
    : baseNavLinks;

  const accountLinks = [];
  if (user?.role === 'user') {
    accountLinks.push({ to: profilePath, label: 'My Profile & Orders', icon: User });
  }
  if (isAdmin) accountLinks.push({ to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard });
  if (isRider) accountLinks.push({ to: '/rider', label: 'Rider Portal', icon: Bike });

  const roleLabel = ROLE_LABELS[user?.role] || user?.role;

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    const handleOutsideTouchOrClick = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        const toggleBtn = e.target.closest('[aria-label="Toggle menu"]');
        if (!toggleBtn) setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleOutsideTouchOrClick);
    document.addEventListener('touchstart', handleOutsideTouchOrClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleOutsideTouchOrClick);
      document.removeEventListener('touchstart', handleOutsideTouchOrClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isUserDropdownOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsUserDropdownOpen(false); };
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [isUserDropdownOpen]);

  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    setIsOpen(false);
    logout();
  };

  const brandLogo = brand
    ? (theme === 'dark' ? (brand.logoDark || brand.logoLight) : (brand.logoLight || brand.logoDark))
    : null;
  const siteLogo = theme === 'dark' ? (settings.logoDark || resW) : (settings.logoLight || resB);
  const logoSrc = brand ? brandLogo : siteLogo;
  const logoLink = brand ? `/brands/${brand.slug}` : '/';

  const iconBtn =
    'relative p-1.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:border-primary-500/40 dark:hover:text-primary-500 hover:bg-white dark:hover:bg-neutral-900 transition-all duration-200';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200/60 dark:border-neutral-800/60 glass bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-all duration-300 h-14">
      {/* 🎯 Global site-container class applied */}
      <div className="site-container h-full">
        <div className="flex items-center justify-between h-full gap-2 lg:gap-2.5 xl:gap-4 w-full min-w-0">

          {/* Logo */}
          <Link to={logoLink} className="flex items-center shrink-0 group" aria-label={brand ? brand.name : "Barcode Restaurant — home"}>
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={brand ? brand.name : "Barcode Restaurant"}
                className="h-7 lg:h-7.5 xl:h-8 2xl:h-9 3xl:h-10 w-auto max-w-[125px] lg:max-w-[140px] xl:max-w-[160px] 2xl:max-w-[190px] object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <span className="font-display text-base lg:text-lg 2xl:text-xl font-extrabold tracking-tight text-neutral-800 dark:text-white truncate">
                {brand?.name}
              </span>
            )}
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5 xl:gap-4 2xl:gap-7 3xl:gap-9 shrink-0">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) => {
                  const isOrdersTabActive = link.path.includes('tab=orders') && window.location.search.includes('tab=orders');
                  const active = isActive || isOrdersTabActive;

                  return `text-xs lg:text-xs xl:text-sm 2xl:text-base font-medium transition-colors duration-200 relative py-1 whitespace-nowrap ${
                    active
                      ? 'text-primary-600 dark:text-primary-500 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-500'
                  }`;
                }}
              >
                {({ isActive }) => {
                  const isOrdersTabActive = link.path.includes('tab=orders') && window.location.search.includes('tab=orders');
                  const active = isActive || isOrdersTabActive;

                  return (
                    <>
                      {link.name}
                      {active && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  );
                }}
              </NavLink>
            ))}
          </div>

          {/* Right Group: Search + Controls */}
          <div className="flex items-center gap-1 lg:gap-1.5 xl:gap-2.5 2xl:gap-3 shrink-0 min-w-0">
            {/* Desktop Search */}
            <div className="hidden lg:block w-28 xl:w-40 2xl:w-56 3xl:w-72 4xl:w-80 min-w-0 flex-shrink transition-all duration-200">
              {brand ? (
                <BrandSearchBar brand={brand} variant="desktop" />
              ) : (
                <SearchBar variant="desktop" />
              )}
            </div>

            {/* Right Controls */}
            <div className="hidden md:flex items-center gap-1 lg:gap-1.5 xl:gap-2 shrink-0">
              {/* 🎯 Fulfillment Mode Pill Selector (Customer Pages Only) */}
              {!isAdminOrRiderRoute && (
                <button
                  onClick={openFulfillmentModal}
                  className="flex items-center gap-1.5 px-2 xl:px-2.5 py-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70 hover:border-primary-500/50 text-neutral-800 dark:text-neutral-100 transition-all cursor-pointer text-xs font-bold shrink-0"
                  title={isPickup ? `Pickup: ${selectedBranch?.name || 'Select Outlet'}` : 'Home Delivery (Click to change)'}
                >
                  {isPickup ? (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <span className="whitespace-nowrap">
                        Self-Pickup
                      </span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <span className="whitespace-nowrap">
                        Delivery
                      </span>
                    </>
                  )}
                  <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
                </button>
              )}

              <button onClick={toggleTheme} className={iconBtn} aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              <button onClick={openCart} className={iconBtn} aria-label="Open order cart">
                <ShoppingBag className="w-3.5 h-3.5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-primary-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-neutral-950">
                    {cartItemCount}
                  </span>
                )}
              </button>

              <span className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-0.5" aria-hidden="true" />

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
                          isUserDropdownOpen ? 'rotate-180' : ''
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
                      className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/10 overflow-hidden"
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

                          {accountLinks.length > 0 && (
                            <div className="p-1 border-b border-neutral-100 dark:border-neutral-800">
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
                          )}

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
                            <p className="text-xs font-bold text-neutral-800 dark:text-white">Welcome to Barcode</p>
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
          </div>

          {/* Mobile Buttons */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => setIsMobileSearchOpen((v) => !v)}
              className={iconBtn}
              aria-label="Toggle search"
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
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-3">
                <SearchBar variant="mobile" onClose={() => setIsMobileSearchOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
              transition={{ type: 'tween', duration: 0.2 }}
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
                    end={link.path === '/'}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `text-base font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-500/10 text-primary-600 dark:text-primary-500'
                          : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-500 dark:hover:text-primary-500'
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>

              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                {isAuthenticated ? (
                  <>
                    {accountLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-2.5 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold hover:border-primary-500/40 hover:text-primary-500 transition-all"
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-500/20 active:scale-95 transition-all duration-200"
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
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold hover:border-primary-500/40 hover:text-primary-500 active:scale-95 transition-all duration-200"
                    >
                      <LogIn className="w-4 h-4" />
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/20 active:scale-95 transition-all duration-200"
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
    </nav>
  );
};

export default Navbar;
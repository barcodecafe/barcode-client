import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Sun, Moon, Menu, X, ShoppingBag, Search as SearchIcon, User, LogIn, UserPlus, LogOut, LayoutDashboard, Bike, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from './SearchBar';

import resB from '../assets/Barcode_restaurant_group-B.png';
import resW from '../assets/Barcode_restaurant_groupW.png';

// Human-friendly labels for the account role badge (display only — the
// underlying user.role stays 'user' | 'rider' | 'admin').
const ROLE_LABELS = { admin: 'Administrator', rider: 'Delivery Rider', user: 'Customer' };

// Derive up-to-two initials from a display name for the avatar chip.
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Clean initial-based avatar — no external network call, no shadow-card look.
const Avatar = ({ name, size = 'sm' }) => {
  const dim = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-8 h-8 text-xs';
  return (
    <span
      className={`grid place-items-center shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold font-display select-none ${dim}`}
    >
      {getInitials(name)}
    </span>
  );
};

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { cartItemCount, openCart } = useCart();
  const { settings } = useSettings();

  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isRider = user?.role === 'rider';

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Our Branches', path: '/branches' },
    { name: 'Menu', path: '/menu' },
    { name: 'About', path: '/about' },
  ];

  // Account destinations shown inside the dropdown / mobile drawer. Role-specific
  // dashboards come first, then the shared profile & orders link.
  const accountLinks = [];
  if (isAdmin) accountLinks.push({ to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard });
  if (isRider) accountLinks.push({ to: '/rider', label: 'Rider Portal', icon: Bike });
  accountLinks.push({ to: '/profile', label: 'My Profile & Orders', icon: User });

  const roleLabel = ROLE_LABELS[user?.role] || user?.role;

  // Close the account dropdown on outside-click or Escape.
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

  // Shared class recipe for the small square icon controls (theme / cart).
  const iconBtn =
    'relative p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:border-primary-500/40 dark:hover:text-primary-500 hover:bg-white dark:hover:bg-neutral-900 transition-all duration-200';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200/60 dark:border-neutral-800/60 glass bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-all duration-300 h-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4">

          {/* Logo — clean, no card / no shadow */}
          <Link to="/" className="flex items-center shrink-0 group" aria-label="Barcode Restaurant — home">
            <img
              src={theme === 'dark' ? (settings.logoDark || resW) : (settings.logoLight || resB)}
              alt="Barcode Restaurant"
              className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-7 shrink-0">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 relative py-1 ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-500 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:block flex-1 max-w-xs">
            <SearchBar variant="desktop" />
          </div>

          {/* Right Controls (desktop) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className={iconBtn} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart Trigger */}
            <button onClick={openCart} className={iconBtn} aria-label="Open order cart">
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-950">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" aria-hidden="true" />

            {/* Auth area */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full border border-neutral-200/70 dark:border-neutral-800/70 bg-white/50 dark:bg-neutral-900/50 hover:border-primary-500/40 hover:bg-white dark:hover:bg-neutral-900 transition-all duration-200"
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={isUserDropdownOpen}
                >
                  <Avatar name={user.name} />
                  <span className="hidden xl:block max-w-[7rem] truncate text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/10 overflow-hidden"
                    >
                      {/* Identity header */}
                      <div className="flex items-center gap-3 px-4 py-4 bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-100 dark:border-neutral-800">
                        <Avatar name={user.name} size="lg" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-neutral-800 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                          <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500">
                            {roleLabel}
                          </span>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="p-1.5">
                        {accountLinks.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            role="menuitem"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-primary-500 dark:hover:text-primary-500 transition-colors"
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      {/* Log out */}
                      <div className="p-1.5 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/20 active:scale-95 transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Buttons */}
          <div className="flex items-center gap-2 md:hidden">
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
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-950">
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
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-14 z-40 bg-neutral-950/40 backdrop-blur-sm md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed right-0 top-14 z-40 w-72 max-w-[85vw] max-h-[calc(100dvh-3.5rem)] bg-white dark:bg-neutral-900 border-l border-b border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-4 shadow-2xl md:hidden overflow-y-auto rounded-bl-2xl"
            >
              {/* Account header (authenticated) */}
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

              {/* Nav links */}
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

              {/* Auth controls */}
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

import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Sun, Moon, Menu, X, ShoppingBag, Search as SearchIcon, User, LogIn, UserPlus, LogOut, LayoutDashboard, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from './SearchBar';

import resB from '../assets/Barcode_restaurant_group-B.png';
import resW from '../assets/Barcode_restaurant_groupW.png';

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { cartItemCount, openCart } = useCart();
  const { settings } = useSettings();
  
  // Destructure isAuthenticated, isRegistered, isAdmin, user, and logout from the useAuth hook.
  const { isAuthenticated, isRegistered, isAdmin, user, logout } = useAuth();
  const isRider = user?.role === 'rider';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Our Branches', path: '/branches' },
    { name: 'Menu', path: '/menu' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-neutral-200/50 dark:border-neutral-800/50 glass bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-all duration-300 h-14"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          
          {/* Logo (Navbar ) */}
          <Link to="/" className="flex items-center h-full group shrink-0 py-2">
            <div className="h-full flex items-center rounded-xl px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300 group-hover:scale-105">
              <img
                src={theme === "dark" ? (settings.logoDark || resW) : (settings.logoLight || resB)}
                alt="Barcode Cafe"
                className="h-8 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-all duration-300 relative py-2 ${
                    isActive
                      ? 'text-primary-600 font-semibold'
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
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:block flex-grow max-w-xs">
            <SearchBar variant="desktop" />
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-500 hover:scale-105 transition-all duration-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Global Cart Trigger */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-500 hover:scale-105 transition-all duration-300"
              aria-label="Open Order Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-900 animate-bounce">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Auth Controls - Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:text-primary-500 hover:scale-105 transition-all duration-300"
                aria-label="User Account Menu"
              >
                {isAuthenticated ? (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ff5400&color=fff&bold=true&rounded=true&size=64`}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-primary-500/20"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {isUserDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsUserDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-60 bg-white dark:bg-neutral-900 border border-neutral-250/70 dark:border-neutral-800 rounded-2xl shadow-xl z-20 py-2.5 overflow-hidden font-sans"
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-850 pb-3 mb-2">
                            <span className="block font-bold text-xs text-neutral-800 dark:text-white truncate">
                              {user.name}
                            </span>
                            <span className="block text-[10px] text-neutral-450 dark:text-neutral-500 truncate mt-0.5">
                              {user.email}
                            </span>
                            <span className="inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-500 mt-2">
                              {user.role}
                            </span>
                          </div>

                          <Link
                            to="/profile"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-primary-500 transition-colors"
                          >
                            <User className="w-3.5 h-3.5" />
                            My Profile & Orders
                          </Link>

                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-primary-500 transition-colors"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              Admin Dashboard
                            </Link>
                          )}

                          {isRider && (
                            <Link
                              to="/rider"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-primary-500 transition-colors"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              Rider Portal
                            </Link>
                          )}

                          <div className="border-t border-neutral-100 dark:border-neutral-850 mt-2 pt-2 px-3">
                            <button
                              onClick={() => {
                                setIsUserDropdownOpen(false);
                                logout();
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-md shadow-red-500/10 transition-all"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Log Out
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-850 pb-2 mb-2">
                            <span className="block font-bold text-xs text-neutral-800 dark:text-white">
                              Welcome to Barcode
                            </span>
                            <span className="block text-[10px] text-neutral-450 mt-0.5">
                              Login to manage your orders
                            </span>
                          </div>

                          <Link
                            to="/login"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-855 hover:text-primary-500 transition-colors"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            Log In
                          </Link>

                          <Link
                            to="/signup"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-855 hover:text-primary-500 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Sign Up
                          </Link>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileSearchOpen((v) => !v)}
              className="p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300"
              aria-label="Toggle Search"
            >
              {isMobileSearchOpen ? <X className="w-4 h-4" /> : <SearchIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={openCart}
              className="relative p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300"
              aria-label="Open Order Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-900 animate-bounce">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300 focus:outline-none"
              aria-label="Toggle Menu"
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

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-neutral-950/40 backdrop-blur-sm md:hidden"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ x: 40, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed right-0 top-14 z-40 w-56 max-h-[75dvh] bg-white dark:bg-neutral-900 border-l border-b border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-6 shadow-2xl md:hidden overflow-y-auto rounded-bl-2xl"
              style={{ backgroundColor: theme === 'dark' ? undefined : '#ffffff' }}
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `text-base font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-500/10 text-primary-500'
                          : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-500 dark:hover:text-primary-500'
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                {/* Mobile Auth Controls */}
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary-500/40 text-primary-500 font-semibold text-center hover:bg-primary-500/5 transition-all"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    {isRider && (
                      <Link
                        to="/rider"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary-500/40 text-primary-500 font-semibold text-center hover:bg-primary-500/5 transition-all"
                      >
                        <Bike className="w-4 h-4" />
                        Rider Portal
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-center transition-all"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-center shadow-md transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </>
                ) : isRegistered ? (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-center active:scale-95 transition-all duration-300"
                  >
                    <LogIn className="w-4 h-4" />
                    Log In
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-center shadow-lg shadow-primary-500/10 active:scale-95 transition-all duration-300"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
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
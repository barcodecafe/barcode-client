import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Heart,
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  ChevronRight,
  ChevronDown,
  Package,
  Wallet,
  Coins,
  Calendar,
  Info,
  Save,
  RotateCcw,
  Truck,
  Receipt,
  Star,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { getAllOrders, getActiveOrdersForUser } from '../services/ordersService';
import { getAllFoods } from '../services/foodsService';

// ---------------------------------------------------------------------------
// Profile.jsx — Customer Dashboard
//
// A professional, self-contained account area rendered entirely on /profile
// via internal section state (no extra routes). Sections:
//   Overview · My Orders · Payments · Favorites · Settings
//
// Data sources (real services only — nothing fabricated):
//   • orders    → getAllOrders()  (server scopes to the logged-in user; falls
//                 back to getActiveOrdersForUser on failure)
//   • favorites → useFavorites() context + getAllFoods() to resolve dishes
//   • profile   → useAuth().user
// Anything without a backend yet (reward points, profile editing) renders a
// clean placeholder / "coming soon" state instead of faking success.
// ---------------------------------------------------------------------------

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'orders', label: 'My Orders', icon: ShoppingBag },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'favorites', label: 'Favorites', icon: Heart },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const ACTIVE_STATUSES = ['Placed', 'Accepted', 'Preparing', 'Out for Delivery'];

const taka = (v) => `৳${Number(v || 0).toFixed(2)}`;

const shortId = (id) => `#${String(id || '').replace(/^order_/, '').slice(-6).toUpperCase()}`;

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatMonth = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const isActive = (status) => ACTIVE_STATUSES.includes(status);

const getStatusColor = (status) => {
  switch (status) {
    case 'Placed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'Accepted': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    case 'Preparing': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Out for Delivery': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'Delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
  }
};

const paymentMethodLabel = (method) => {
  switch (method) {
    case 'sslcommerz': return 'SSLCommerz (Online)';
    case 'cod': return 'Cash on Delivery';
    default: return method ? String(method).toUpperCase() : 'Cash on Delivery';
  }
};

// Display-only derivation from order state — no invented data.
const derivePaymentStatus = (order) => {
  if (order.paymentStatus) return order.paymentStatus;
  if (order.status === 'Rejected') return 'Cancelled';
  if (order.status === 'Delivered') return 'Paid';
  return 'Pending';
};

const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'Paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'Pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Cancelled':
    case 'Failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
  }
};

// ── Small reusable pieces ───────────────────────────────────────────────────

const StatTile = ({ icon: Icon, label, value, hint, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-5 flex items-start justify-between gap-3"
  >
    <div className="min-w-0">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">{label}</p>
      <p className="font-display text-2xl font-extrabold text-neutral-800 dark:text-neutral-100 mt-1 truncate">
        {value}
      </p>
      {hint && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1.5 truncate">{hint}</p>}
    </div>
    <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </div>
  </motion.div>
);

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
      <Icon className="w-4.5 h-4.5" />
    </div>
    <div>
      <h2 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white leading-tight">{title}</h2>
      {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, message, cta }) => (
  <div className="text-center py-14 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
    <Icon className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
    <p className="text-neutral-600 dark:text-neutral-300 text-sm font-semibold">{title}</p>
    {message && <p className="text-neutral-400 text-xs mt-1">{message}</p>}
    {cta}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div
    className={`bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-xs ${className}`}
  >
    {children}
  </div>
);

// ── Order card (used in Overview + My Orders) ───────────────────────────────

const OrderCard = ({ order, expanded, onToggle }) => {
  const active = isActive(order.status);
  return (
    <div className="rounded-2xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-950/20 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-neutral-800 dark:text-white">{shortId(order.id)}</span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wide ${getStatusColor(order.status)}`}>
                {order.status || 'Placed'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-400 mt-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(order.createdAt)}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span>{(order.items?.length || 0)} item{(order.items?.length || 0) === 1 ? '' : 's'}</span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="font-semibold text-neutral-600 dark:text-neutral-300">{taka(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggle}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-primary-500/40 hover:text-primary-500 font-bold text-xs active:scale-95 transition-all"
          >
            Details
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {active && (
            <Link
              to={`/order-tracking/${order.id}`}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/10 active:scale-95 transition-all"
            >
              <Truck className="w-3.5 h-3.5" />
              Track
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-neutral-100 dark:border-neutral-850">
              <div className="mt-3 rounded-xl border border-neutral-100 dark:border-neutral-850 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-neutral-50/60 dark:bg-neutral-950/40 text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
                      <th className="px-3 py-2">Dish</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item, i) => (
                      <tr key={item.id ?? i} className="border-t border-neutral-100 dark:border-neutral-850">
                        <td className="px-3 py-2.5 font-semibold text-neutral-700 dark:text-neutral-200">
                          {item.name}
                          {item.selectedSize && (
                            <span className="ml-1.5 text-[10px] font-normal text-neutral-400">({item.selectedSize})</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center text-neutral-500 dark:text-neutral-400">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right text-neutral-500 dark:text-neutral-400">{taka(item.price)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-neutral-700 dark:text-neutral-200">
                          {taka((item.price || 0) * (item.quantity || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-neutral-400" />
                    {paymentMethodLabel(order.paymentMethod)}
                  </p>
                  {order.transactionId && (
                    <p className="font-mono text-[10px] text-neutral-400">Txn: {order.transactionId}</p>
                  )}
                </div>
                <div className="w-full sm:w-52 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Subtotal</span>
                    <span>{taka(order.subtotal ?? order.total)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-500 font-semibold">
                      <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                      <span>-{taka(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-neutral-800 dark:text-white pt-1.5 border-t border-neutral-100 dark:border-neutral-850">
                    <span>Total</span>
                    <span className="text-primary-500">{taka(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

export const Profile = () => {
  const { user, logout, isAuthLoaded, updateProfile } = useAuth();
  const { favoriteIds, toggleFavorite, isFavoritesLoaded } = useFavorites();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Settings form — persisted via PATCH /api/users/me
  const [form, setForm] = useState({ name: '', phone: '', pickArea: '', address: '' });
  const [settingsNotice, setSettingsNotice] = useState(null); // { ok, text } | null
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    // Wait for auth to hydrate before redirecting — avoids a flash redirect to
    // /login on direct navigation / refresh before getCurrentUser() resolves.
    if (isAuthLoaded && !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        pickArea: user.pickArea || '',
        address: user.address || '',
      });
    }
  }, [user, isAuthLoaded, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      // Full order history: the server scopes /orders to the logged-in user.
      // Fall back to the active-orders endpoint (same scoping) if it fails.
      getAllOrders()
        .catch(() => getActiveOrdersForUser(user.id))
        .catch(() => []),
      getAllFoods().catch(() => []),
    ]).then(([ordersData, foodsData]) => {
      if (cancelled) return;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setFoods(Array.isArray(foodsData) ? foodsData : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [orders]
  );

  const stats = useMemo(() => {
    const totalSpent = orders
      .filter((o) => o.status !== 'Rejected')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return {
      totalOrders: orders.length,
      totalSpent,
      activeOrders: orders.filter((o) => isActive(o.status)).length,
    };
  }, [orders]);

  const favoriteFoods = useMemo(
    () => favoriteIds.map((id) => foods.find((f) => f.id === id)).filter(Boolean),
    [favoriteIds, foods]
  );

  if (!user) return null;

  const firstName = (user.name || 'there').trim().split(' ')[0];

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const toggleOrder = (id) => setExpandedOrderId((cur) => (cur === id ? null : id));

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setSettingsNotice(null);
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        pickArea: form.pickArea.trim(),
        address: form.address.trim(),
      });
      setSettingsNotice({ ok: true, text: 'Profile updated successfully.' });
    } catch (err) {
      setSettingsNotice({ ok: false, text: err.message || 'Failed to update profile. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      pickArea: user.pickArea || '',
      address: user.address || '',
    });
    setSettingsNotice(null);
  };

  const spinner = (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Section renderers ─────────────────────────────────────────────────────

  const renderOverview = () => {
    const active = sortedOrders.filter((o) => isActive(o.status));
    const recent = sortedOrders.slice(0, 3);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} hint={`${stats.activeOrders} active`} delay={0} />
          <StatTile icon={Wallet} label="Total Spent" value={taka(stats.totalSpent)} hint="Excludes cancelled" delay={0.05} />
          <StatTile icon={Heart} label="Favorites" value={favoriteIds.length} hint="Saved dishes" delay={0.1} />
          <StatTile icon={Coins} label="Reward Points" value={user?.points ?? 0} hint="1 pt = ৳1 · redeem at checkout" delay={0.15} />
        </div>

        {active.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4.5 h-4.5 text-primary-500" />
              <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">Active Deliveries</h3>
            </div>
            <div className="space-y-3">
              {active.map((order) => (
                <Link
                  key={order.id}
                  to={`/order-tracking/${order.id}`}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/40 dark:bg-neutral-950/20 hover:border-primary-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-800 dark:text-white">{shortId(order.id)}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <span className="block text-[11px] text-neutral-400 mt-0.5">
                        {(order.items?.length || 0)} items • {taka(order.total)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 shrink-0" />
                </Link>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-primary-500" />
              <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">Recent Orders</h3>
            </div>
            {orders.length > 0 && (
              <button
                onClick={() => setActiveSection('orders')}
                className="flex items-center gap-1 text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {loading ? (
            spinner
          ) : recent.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              message="Your recent orders will show up here."
              cta={
                <Link to="/menu" className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-primary-500 text-white font-bold text-xs shadow-md shadow-primary-500/15">
                  Browse Menu
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recent.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedOrderId === order.id}
                  onToggle={() => toggleOrder(order.id)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderOrders = () => (
    <Card className="p-5 sm:p-6">
      <SectionHeading icon={ShoppingBag} title="My Orders" subtitle="Your complete order history and live tracking." />
      {loading ? (
        spinner
      ) : sortedOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          message="Browse our menu and place your first order today!"
          cta={
            <Link to="/menu" className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-primary-500 text-white font-bold text-xs shadow-md shadow-primary-500/15">
              Browse Menu
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {sortedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedOrderId === order.id}
              onToggle={() => toggleOrder(order.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );

  const renderPayments = () => {
    const paid = orders
      .filter((o) => derivePaymentStatus(o) === 'Paid')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const pending = orders
      .filter((o) => derivePaymentStatus(o) === 'Pending')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile icon={Wallet} label="Total Paid" value={taka(paid)} hint="Completed payments" delay={0} />
          <StatTile icon={CreditCard} label="Pending" value={taka(pending)} hint="Awaiting settlement" delay={0.05} />
          <StatTile icon={Receipt} label="Transactions" value={orders.length} hint="All time" delay={0.1} />
        </div>

        <Card className="p-5 sm:p-6">
          <SectionHeading icon={CreditCard} title="Payment History" subtitle="Transactions derived from your orders." />
          {loading ? (
            spinner
          ) : sortedOrders.length === 0 ? (
            <EmptyState icon={Receipt} title="No transactions yet" message="Payments appear here once you place an order." />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs text-left min-w-[560px]">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
                    <th className="px-3 py-3">Order</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => {
                    const payStatus = derivePaymentStatus(order);
                    return (
                      <tr key={order.id} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                        <td className="px-3 py-3.5 font-bold text-neutral-800 dark:text-white">{shortId(order.id)}</td>
                        <td className="px-3 py-3.5 text-neutral-500 dark:text-neutral-400">{formatDate(order.createdAt)}</td>
                        <td className="px-3 py-3.5 text-neutral-600 dark:text-neutral-300">{paymentMethodLabel(order.paymentMethod)}</td>
                        <td className="px-3 py-3.5 text-right font-bold text-primary-500">{taka(order.total)}</td>
                        <td className="px-3 py-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wide ${getPaymentStatusColor(payStatus)}`}>
                            {payStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderFavorites = () => (
    <Card className="p-5 sm:p-6">
      <SectionHeading icon={Heart} title="Favorites" subtitle="Dishes you saved for later." />
      {loading || !isFavoritesLoaded ? (
        spinner
      ) : favoriteFoods.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          message="Tap the heart on any dish to save it here."
          cta={
            <Link to="/menu" className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-primary-500 text-white font-bold text-xs shadow-md shadow-primary-500/15">
              Explore Menu
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favoriteFoods.map((food) => {
            const hasDiscount = food.discountPct > 0;
            const discounted = hasDiscount ? food.price * (1 - food.discountPct / 100) : food.price;
            return (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="group relative flex gap-3 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-950/20 hover:border-neutral-200 dark:hover:border-neutral-800 transition-all"
              >
                <Link to={`/menu/${food.id}`} className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                  <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </Link>
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{food.category}</span>
                    <Link to={`/menu/${food.id}`} className="block">
                      <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors line-clamp-1">
                        {food.name}
                      </h3>
                    </Link>
                    {food.rating !== undefined && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-primary-500 mt-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        {food.rating}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="font-display font-extrabold text-sm text-primary-500">{taka(discounted)}</span>
                    <button
                      onClick={() => toggleFavorite(food.id)}
                      className="p-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-90 transition-all"
                      aria-label={`Remove ${food.name} from favorites`}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const renderSettings = () => {
    const inputClass =
      'w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm';
    const labelClass = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5';

    return (
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <SectionHeading icon={Settings} title="Profile & Settings" subtitle="Manage your personal details." />

          {settingsNotice && (
            <div
              className={`mb-5 flex items-start gap-2 p-3 rounded-xl border text-sm ${
                settingsNotice.ok
                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{settingsNotice.text}</span>
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pf-name" className={labelClass}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="pf-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pf-phone" className={labelClass}>Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="pf-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 01700000000"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="pf-email" className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="pf-email"
                  type="email"
                  value={user.email || ''}
                  readOnly
                  disabled
                  className={`${inputClass} pl-10 opacity-70 cursor-not-allowed`}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">Your email is used to sign in and can&apos;t be changed here.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pf-area" className={labelClass}>Pick Area</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="pf-area"
                    type="text"
                    value={form.pickArea}
                    onChange={(e) => setForm((f) => ({ ...f, pickArea: e.target.value }))}
                    placeholder="e.g. Dhaka"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="pf-address" className={labelClass}>Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="pf-address"
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="House, road, area"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-semibold text-sm active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading icon={Info} title="Account" subtitle="Your account details." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/40 dark:bg-neutral-950/20">
              <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Account Type</span>
              <span className="block text-sm font-semibold text-neutral-800 dark:text-neutral-100 capitalize mt-1">{user.role || 'user'}</span>
            </div>
            <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/40 dark:bg-neutral-950/20">
              <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Member Since</span>
              <span className="block text-sm font-semibold text-neutral-800 dark:text-neutral-100 mt-1">{formatMonth(user.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 mt-5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 font-bold text-sm active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </Card>
      </div>
    );
  };

  const sectionContent = {
    overview: renderOverview,
    orders: renderOrders,
    payments: renderPayments,
    favorites: renderFavorites,
    settings: renderSettings,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-xs p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-display font-black text-2xl border border-primary-500/25 shadow-sm shrink-0">
          {(user.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-800 dark:text-white truncate">
            Welcome back, {firstName}!
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </span>
            <span className="text-[10px] capitalize px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-500 dark:text-neutral-400">
              {user.role || 'user'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-500/30 font-semibold text-xs active:scale-95 transition-all shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar / tab nav */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-2">
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible scrollbar-none">
              {SECTIONS.map((s) => {
                const active = activeSection === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 lg:w-full ${
                      active
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <s.icon className="w-4 h-4 shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Section content — keyed motion.div re-animates on switch. (No
            AnimatePresence mode="wait" so a throttled tab can't get stuck
            waiting on an exit animation that never completes.) */}
        <div className="min-w-0">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {sectionContent[activeSection]()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

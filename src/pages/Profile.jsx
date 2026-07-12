import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Mail, ShoppingBag, Clock, ChevronRight, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getActiveOrdersForUser } from '../services/ordersService';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    getActiveOrdersForUser(user.id).then((userOrders) => {
      setOrders(userOrders);
      setLoading(false);
    });
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Canonical status vocabulary (matches the backend enum — audit #2/#3/#9).
  const getStatusColor = (status) => {
    switch (status) {
      case 'Placed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Accepted': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'Preparing': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Out for Delivery': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
    }
  };

  const getStatusLabel = (status) => status || 'Placed';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Details Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center font-display font-black text-2xl mb-4 border border-primary-500/25 shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white leading-tight">{user.name}</h2>
            <span className="text-xs text-neutral-400 capitalize mt-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-semibold">{user.role}</span>

            <div className="w-full border-t border-neutral-100 dark:border-neutral-850 pt-5 mt-5 space-y-4 text-left">
              <div className="flex gap-3">
                <Mail className="w-4.5 h-4.5 text-neutral-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Email Address</span>
                  <span className="block text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate">{user.email}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="w-4.5 h-4.5 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Phone Number</span>
                  <span className="block text-xs text-neutral-700 dark:text-neutral-300 font-medium">{user.phone || 'Not set'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-4.5 h-4.5 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Pick Area & Address</span>
                  <span className="block text-xs text-neutral-700 dark:text-neutral-300 font-medium leading-normal">
                    {user.address ? `${user.address}, ${user.pickArea || 'Dhaka'}` : 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-6 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 font-bold text-xs shadow-sm active:scale-95 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Order History Main (2 cols) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-primary-500" />
              <h3 className="font-display font-extrabold text-base text-neutral-800 dark:text-white">Active Orders & Tracking</h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <ShoppingBag className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 dark:text-neutral-400 text-sm font-semibold">No active orders</p>
                <p className="text-neutral-400 text-xs mt-1">Browse our menu and place your order today!</p>
                <Link to="/menu" className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-primary-500 text-white font-bold text-xs shadow-md shadow-primary-500/15">
                  Browse Menu
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-950/20 hover:border-neutral-200/80 dark:hover:border-neutral-800 transition-all gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold shrink-0">
                        #{ord.id.split('_')[1]?.slice(-3) || ord.id.slice(-3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-neutral-800 dark:text-white">Order {ord.id.toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getStatusColor(ord.status)}`}>
                            {getStatusLabel(ord.status)}
                          </span>
                        </div>
                        <span className="block text-[10px] text-neutral-400 mt-1">
                          {ord.items.length} items • ৳{ord.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/order-tracking/${ord.id}`}
                      className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/10 transition-all"
                    >
                      Track Order
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;

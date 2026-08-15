import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Crown,
  Sparkles,
  Check,
  Copy,
  Gift,
  ShoppingBag,
  MapPin,
  Calendar,
  Percent,
  QrCode,
  ArrowRight,
  UtensilsCrossed,
  AlertCircle,
  Clock,
  Award
} from 'lucide-react';
import { getPublicMembership } from '../services/authService';

const taka = (n) => `৳${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TIER_THEMES = {
  Elite: {
    gradient: 'from-purple-600 via-pink-600 to-indigo-700',
    cardBorder: 'border-purple-500/40',
    glow: 'rgba(168, 85, 247, 0.25)',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    icon: '👑',
    discount: '15% VIP Discount',
    perks: ['15% Flat Discount on all dine-in & delivery', 'Complimentary Chef Special on Birthday', 'Priority Kitchen Queue & Fast Delivery', 'Dedicated VIP Customer Support']
  },
  Platinum: {
    gradient: 'from-cyan-600 via-blue-600 to-indigo-700',
    cardBorder: 'border-cyan-500/40',
    glow: 'rgba(6, 182, 212, 0.25)',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    icon: '💎',
    discount: '12% Platinum Discount',
    perks: ['12% Flat Discount on all orders', 'Double loyalty points on weekends', 'Priority delivery status', 'Seasonal exclusive menu access']
  },
  Diamond: {
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    cardBorder: 'border-blue-500/40',
    glow: 'rgba(59, 130, 246, 0.25)',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    icon: '🔷',
    discount: '10% Diamond Discount',
    perks: ['10% Flat Discount on orders', 'Exclusive member coupons', 'Birthday discount voucher', 'Free delivery on selected days']
  },
  Gold: {
    gradient: 'from-amber-500 via-amber-600 to-yellow-600',
    cardBorder: 'border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.25)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    icon: '🥇',
    discount: '7% Gold Discount',
    perks: ['7% Flat Discount on all meals', 'Reward points on every order', 'Early access to seasonal specials']
  },
  Classic: {
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    cardBorder: 'border-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.25)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    icon: '⭐',
    discount: '5% Member Discount',
    perks: ['5% Discount on qualifying orders', 'Earn reward points on orders', 'Official membership verification']
  }
};

export const PublicMembership = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Membership identifier is missing.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getPublicMembership(id)
      .then((res) => {
        if (!isMounted) return;
        const memberData = res?.data || res;
        if (memberData && (memberData.name || memberData.membershipId)) {
          setData(memberData);
        } else {
          setError(res?.message || 'Membership profile not found.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Membership lookup error:', err);
        setError(err?.message || 'Unable to verify membership. Please check the membership ID and try again.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const copyMembershipId = () => {
    if (!data?.membershipId) return;
    navigator.clipboard?.writeText(data.membershipId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tierKey = data?.tier || 'Classic';
  const tierConfig = TIER_THEMES[tierKey] || TIER_THEMES.Classic;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-10 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none opacity-25"
        style={{ background: tierConfig.glow }}
      />

      <div className="max-w-3xl mx-auto w-full relative z-10 space-y-8">
        
        {/* Top Branding & Verification Indicator */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-amber-400 flex items-center justify-center font-display font-black text-white text-lg shadow-lg group-hover:scale-105 transition-transform">
              B
            </span>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              Barcode <span className="text-primary-400">Restaurant Group</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Official Verified Member
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Virtual Membership Pass
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Live membership authenticity verification and customer privilege status.
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="w-full max-w-md mx-auto h-56 rounded-2xl bg-neutral-900/80 animate-pulse border border-neutral-800" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 rounded-xl bg-neutral-900/60 animate-pulse border border-neutral-800" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-2xl bg-neutral-900 border border-red-500/30 text-center space-y-4 max-w-md mx-auto shadow-2xl"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Membership Not Found</h3>
              <p className="text-xs text-neutral-400 mt-1">{error}</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs transition-all shadow-md"
            >
              <UtensilsCrossed className="w-4 h-4" /> Back to Home
            </Link>
          </motion.div>
        )}

        {/* Verified Membership Content */}
        {!loading && !error && data && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* 👑 DIGITAL CARD VISUAL */}
            <div className="flex justify-center">
              <div className="relative w-[340px] sm:w-[390px] h-[200px] sm:h-[230px] rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 select-none bg-neutral-900 group shrink-0">
                {/* Static Card Front Artwork */}
                <img
                  src="/card_1_front.png"
                  alt="Membership Card"
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />

                {/* Ambient glow highlight */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-5 pointer-events-none" />

                {/* Card Content Overlay */}
                <div className="relative z-10 w-full h-full p-4 sm:p-5 flex flex-col justify-between">
                  {/* Top Right: QR Code */}
                  <div className="flex items-start justify-end pt-8 pr-4">
                    <div className="p-1 bg-white rounded-lg shadow-lg">
                      {data.membershipQr ? (
                        <img
                          src={data.membershipQr}
                          alt={`QR ${data.membershipId}`}
                          className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                        />
                      ) : (
                        <QrCode className="w-10 h-10 text-neutral-900" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Right: Name & ID */}
                  <div className="flex flex-col items-end pr-4 pb-4 leading-tight">
                    <span className="block font-bold text-sm sm:text-base tracking-wide text-white uppercase truncate max-w-[220px]">
                      {data.name}
                    </span>
                    <span className="block font-mono font-bold text-xs text-neutral-300 tracking-wider mt-0.5">
                      {data.membershipId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 💎 LIVE TIER STATUS BANNER */}
            <div className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-r ${tierConfig.gradient} text-white shadow-xl relative overflow-hidden`}>
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {data.icon || tierConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-white/80">
                        Current Status
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                        Verified
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-1.5">
                      {data.tier} Tier Member
                    </h2>
                    <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {data.discountPct ? `${data.discountPct}% Discount Privilege` : 'Loyalty Benefits Activated'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={copyMembershipId}
                  className="px-3.5 py-2 rounded-xl bg-black/30 hover:bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm self-stretch sm:self-auto justify-center"
                  title="Copy Membership ID"
                >
                  <span>{data.membershipId}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
                </button>
              </div>
            </div>

            {/* 📊 MEMBER STATS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Points */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <Gift className="w-4 h-4" />
                </div>
                <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Reward Points</span>
                <span className="font-extrabold text-lg sm:text-xl text-amber-400">{data.points || 0} pts</span>
              </div>

              {/* Total Orders */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Orders</span>
                <span className="font-extrabold text-lg sm:text-xl text-white">{data.orderCount || 0}</span>
              </div>

              {/* Total Spent */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-4 h-4" />
                </div>
                <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Total Spent</span>
                <span className="font-extrabold text-base sm:text-lg text-emerald-400 truncate block">
                  {taka(data.totalSpent)}
                </span>
              </div>

              {/* Member Since */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Member Since</span>
                <span className="font-bold text-xs sm:text-sm text-neutral-200 block truncate mt-0.5">
                  {data.memberSince ? new Date(data.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Verified'}
                </span>
              </div>
            </div>

            {/* 🎁 EXCLUSIVE TIER PERKS */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary-400" />
                  <span>{data.tier} Tier Privileges & Benefits</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierConfig.badgeBg}`}>
                  {tierConfig.discount}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {tierConfig.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-xs text-neutral-300 leading-snug">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                to="/menu"
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all text-center"
              >
                <span>Browse Menu & Order</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold text-sm border border-neutral-800 transition-all text-center"
              >
                Home
              </Link>
            </div>

          </motion.div>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-neutral-500 pt-6 border-t border-neutral-900">
          <p>© {new Date().getFullYear()} Barcode Restaurant Group. Virtual membership verification powered by Barcode Cloud POS.</p>
        </div>

      </div>
    </div>
  );
};

export default PublicMembership;

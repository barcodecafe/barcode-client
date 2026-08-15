import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Award,
  Download,
  Share2,
  Search,
  RotateCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { getPublicMembership } from '../services/authService';
import QRCodePackage from 'qrcode';
import html2canvas from 'html2canvas-pro';

const taka = (n) => `৳${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TIER_THEMES = {
  Elite: {
    gradient: 'from-purple-600 via-pink-600 to-indigo-700',
    cardBorder: 'border-purple-500/40',
    glow: 'rgba(168, 85, 247, 0.35)',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    accentText: 'text-purple-400',
    icon: '👑',
    discount: '15% VIP Discount',
    perks: [
      '15% Flat VIP Discount on all dine-in & delivery',
      'Complimentary Chef Special on Birthday & Anniversary',
      'Top Priority Kitchen Queue & Fast Delivery Express',
      'Dedicated VIP Concierge & Table Reservations'
    ]
  },
  Platinum: {
    gradient: 'from-cyan-600 via-blue-600 to-indigo-700',
    cardBorder: 'border-cyan-500/40',
    glow: 'rgba(6, 182, 212, 0.35)',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    accentText: 'text-cyan-400',
    icon: '💎',
    discount: '12% Platinum Discount',
    perks: [
      '12% Flat Platinum Discount on all orders',
      'Double loyalty reward points on weekend dining',
      'Priority delivery dispatch & kitchen status',
      'Exclusive seasonal tasting menu previews'
    ]
  },
  Diamond: {
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    cardBorder: 'border-blue-500/40',
    glow: 'rgba(59, 130, 246, 0.35)',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    accentText: 'text-blue-400',
    icon: '🔷',
    discount: '10% Diamond Discount',
    perks: [
      '10% Flat Diamond Discount on orders',
      'Exclusive member special vouchers every month',
      'Special birthday dining reward discount',
      'Free delivery privileges on select orders'
    ]
  },
  Gold: {
    gradient: 'from-amber-500 via-amber-600 to-yellow-600',
    cardBorder: 'border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.35)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    accentText: 'text-amber-400',
    icon: '🥇',
    discount: '7% Gold Discount',
    perks: [
      '7% Flat Gold Discount on all meals',
      'Earn reward loyalty points on every order',
      'Early access to seasonal offers and festival menus',
      'Special member dining perks at all branches'
    ]
  },
  Classic: {
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    cardBorder: 'border-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.35)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    accentText: 'text-emerald-400',
    icon: '⭐',
    discount: '5% Member Discount',
    perks: [
      '5% Welcome Member Discount on qualifying orders',
      'Earn reward points with every dine-in & takeaway',
      'Official verified membership credentials across all branches',
      'Exclusive subscriber promotions and rewards'
    ]
  }
};

export const PublicMembership = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardQrDataUrl, setCardQrDataUrl] = useState('');

  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);

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
          
          // Generate sharp QR code for the member
          const verifyUrl = `${window.location.origin}/membership/${encodeURIComponent(memberData.membershipId)}`;
          QRCodePackage.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 1, width: 320 })
            .then((url) => {
              if (isMounted) setCardQrDataUrl(url);
            })
            .catch(() => {
              if (isMounted) setCardQrDataUrl(memberData.membershipQr || '');
            });
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/membership/${encodeURIComponent(searchQuery.trim())}`);
  };

  // 1-Click Download BOTH Front & Back cards on a SINGLE combined image
  const downloadBothCards = async () => {
    if (!frontCardRef.current || !backCardRef.current || !data || downloading) return;
    setDownloading(true);
    try {
      const [canvasFront, canvasBack] = await Promise.all([
        html2canvas(frontCardRef.current, { scale: 3, useCORS: true, backgroundColor: null }),
        html2canvas(backCardRef.current, { scale: 3, useCORS: true, backgroundColor: null }),
      ]);

      const cardW = canvasFront.width;
      const cardH = canvasFront.height;
      const gap = 40;
      const padding = 30;

      // Single composite canvas with both Front & Back side-by-side
      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = cardW * 2 + gap + padding * 2;
      combinedCanvas.height = cardH + padding * 2;

      const ctx = combinedCanvas.getContext('2d');
      if (ctx) {
        // Draw Front Side
        ctx.drawImage(canvasFront, padding, padding, cardW, cardH);
        // Draw Back Side
        ctx.drawImage(canvasBack, padding + cardW + gap, padding, cardW, cardH);
      }

      const image = combinedCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Membership_Card_${data.membershipId || 'BRG'}.png`;
      link.click();
    } catch (err) {
      console.error('Card download failed:', err);
      alert('Could not download card. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const tierKey = data?.tier || 'Classic';
  const tierConfig = TIER_THEMES[tierKey] || TIER_THEMES.Classic;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-8 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Background ambient lighting */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none opacity-25"
        style={{ background: tierConfig.glow }}
      />
      <div 
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-15"
        style={{ background: 'rgba(234, 88, 12, 0.3)' }}
      />

      <div className="max-w-3xl mx-auto w-full relative z-10 space-y-8">
        
        {/* Top Header & Branding */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-1 group">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-amber-400 flex items-center justify-center font-display font-black text-white text-xl shadow-lg group-hover:scale-105 transition-transform">
              B
            </span>
            <span className="font-display font-black text-2xl tracking-tight text-white">
              Barcode <span className="text-primary-400">Restaurant Group</span>
            </span>
          </Link>

          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck className="w-4 h-4" /> Official Verified Member
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Digital Membership Pass
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Live authenticity verification, spending tier status, and member privileges.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="w-full h-56 rounded-2xl bg-neutral-900/80 animate-pulse border border-neutral-800 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 rounded-2xl bg-neutral-900/60 animate-pulse border border-neutral-800" />
              ))}
            </div>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-neutral-900/90 border border-red-500/30 text-center space-y-6 max-w-md mx-auto shadow-2xl backdrop-blur-md"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-xl text-white">Membership Not Found</h3>
              <p className="text-xs text-neutral-400">{error}</p>
            </div>

            {/* Quick Search Another ID */}
            <form onSubmit={handleSearchSubmit} className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Search by Membership ID or Phone
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. BRG-17XXXXXXXX or Phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find</span>
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-center gap-3">
              <Link
                to="/"
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" /> Home
              </Link>
              <Link
                to="/menu"
                className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                Browse Menu <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Verified Membership Content */}
        {!loading && !error && data && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            {/* 👑 DIGITAL MEMBERSHIP CARDS SHOWCASE (Mobile: Front top, Back bottom; Desktop: Side-by-side) */}
            <div className="flex flex-col items-center gap-6">
              
              {/* CARDS DISPLAY CONTAINER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center items-center w-full p-2">
                
                {/* FRONT CARD */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Front Side</p>
                  <div
                    ref={frontCardRef}
                    className="relative w-[340px] sm:w-[384px] h-[198px] sm:h-[224px] rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 select-none bg-neutral-900 shrink-0"
                  >
                    <img
                      src="/card_1_front.png"
                      alt="Membership Card Front"
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />

                    {/* Card Content Overlay */}
                    <div className="relative z-10 w-full h-full p-4 sm:p-5 flex flex-col justify-between">
                      {/* Top Right: QR Code (Positioned 8px lower as requested) */}
                      <div className="flex items-start justify-end pt-[49px] pr-4">
                        <div className="p-1 bg-white rounded-lg shadow-lg">
                          {cardQrDataUrl || data.membershipQr ? (
                            <img
                              src={cardQrDataUrl || data.membershipQr}
                              alt={`QR ${data.membershipId}`}
                              className="w-13 h-13 sm:w-14 sm:h-14 object-contain"
                            />
                          ) : (
                            <QrCode className="w-13 h-13 text-neutral-900" />
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

                {/* BACK CARD */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Back Side</p>
                  <div
                    ref={backCardRef}
                    className="relative w-[340px] sm:w-[384px] h-[198px] sm:h-[224px] rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 select-none bg-neutral-900 shrink-0"
                  >
                    <img
                      src="/card_2_front.png"
                      alt="Membership Card Back"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

              </div>

              {/* 🎯 SINGLE 1-CLICK DOWNLOAD BOTH SIDES BUTTON */}
              <div className="flex items-center justify-center pt-1 w-full">
                <button
                  type="button"
                  onClick={downloadBothCards}
                  disabled={downloading}
                  className="px-6 py-3.5 bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-500 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Preparing Cards...' : 'Download Membership Card (Front & Back)'}</span>
                </button>
              </div>

            </div>

            {/* 💎 LIVE TIER STATUS & DISCOUNT BANNER */}
            <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-r ${tierConfig.gradient} text-white shadow-2xl relative overflow-hidden`}>
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {data.icon || tierConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-white/85">
                        Current Loyalty Status
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-sm shadow-xs">
                        Active Verified
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 mt-0.5">
                      {data.tier} Tier Member
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 mt-1 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>{tierConfig.discount} Privilege Activated</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                  <button
                    onClick={copyMembershipId}
                    className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm w-full sm:w-auto"
                    title="Click to copy Membership ID"
                  >
                    <span>{data.membershipId}</span>
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 opacity-75" />}
                  </button>
                  <span className="text-[10px] text-white/70 text-center sm:text-right">
                    Official Barcode Group ID
                  </span>
                </div>
              </div>
            </div>

            {/* 📊 MEMBER METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Reward Points */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center shadow-lg hover:border-neutral-750 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2.5">
                  <Gift className="w-4 h-4" />
                </div>
                <span className="block text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider">Reward Points</span>
                <span className="font-black text-xl sm:text-2xl text-amber-400">{data.points || 0} pts</span>
              </div>

              {/* Total Orders */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center shadow-lg hover:border-neutral-750 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="block text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider">Total Orders</span>
                <span className="font-black text-xl sm:text-2xl text-white">{data.orderCount || 0}</span>
              </div>

              {/* Total Spent */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center shadow-lg hover:border-neutral-750 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                  <Award className="w-4 h-4" />
                </div>
                <span className="block text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider">Lifetime Spend</span>
                <span className="font-black text-lg sm:text-xl text-emerald-400 truncate block">
                  {taka(data.totalSpent)}
                </span>
              </div>

              {/* Member Since */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center shadow-lg hover:border-neutral-750 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-2.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="block text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider">Member Since</span>
                <span className="font-bold text-xs sm:text-sm text-neutral-200 block truncate mt-1">
                  {data.memberSince ? new Date(data.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Active Member'}
                </span>
              </div>
            </div>

            {/* 🎁 EXCLUSIVE TIER PERKS LIST */}
            <div className="p-6 sm:p-7 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary-400" />
                  <span>{data.tier} Tier Privileges & Benefits</span>
                </h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${tierConfig.badgeBg} self-start sm:self-auto`}>
                  {tierConfig.discount}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {tierConfig.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-850 hover:border-neutral-750 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <span className="text-xs sm:text-sm text-neutral-300 font-medium leading-snug">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                to="/menu"
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 transition-all text-center cursor-pointer"
              >
                <span>Browse Menu & Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold text-sm border border-neutral-800 transition-all text-center cursor-pointer"
              >
                Back to Home
              </Link>
            </div>

          </motion.div>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-neutral-500 pt-8 border-t border-neutral-900 space-y-1">
          <p>© {new Date().getFullYear()} Barcode Restaurant Group. All rights reserved.</p>
          <p>Official digital membership authenticity verified via Barcode POS Cloud Network.</p>
        </div>

      </div>
    </div>
  );
};

export default PublicMembership;

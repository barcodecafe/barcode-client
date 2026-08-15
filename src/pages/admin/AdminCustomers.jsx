import { useState, useEffect, useRef, useMemo } from 'react';
import { getAllUsers, posLookupCustomer } from '../../services/authService';
import { getTopCustomers } from '../../services/analyticsService';
import { CreditCard, Download, X, QrCode, Crown, Search, Sparkles, Check, Copy, UserCheck } from 'lucide-react';
import { ErrorBanner } from '../../components/ErrorBanner';
import html2canvas from 'html2canvas-pro';
import QRCode from 'qrcode';

const taka = (n) => `৳${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const MEDAL = ['🥇', '🥈', '🥉'];

/**
 * Strips non-digits, country code (+88 / 88), and leading 0 from a phone number
 * e.g. "01712345678" -> "1712345678"
 */
const cleanPhoneForMembership = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('880')) digits = digits.slice(3);
  else if (digits.startsWith('88')) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '');
  return digits;
};

/**
 * Formats Membership ID as BRG- + mobile number without leading zero.
 * e.g. 01712345678 -> BRG-1712345678
 */
export const membershipIdOf = (c) => {
  if (c?.membershipId && c.membershipId.startsWith('BRG-')) {
    return c.membershipId;
  }
  const clean = cleanPhoneForMembership(c?.phone);
  if (clean && clean.length >= 6) {
    return `BRG-${clean}`;
  }
  return `BRG-${String(c?.id || c?._id || '').slice(-8).toUpperCase() || '0000'}`;
};

/**
 * Spending Tier Breakpoints:
 * - 100k+  (>= ৳100,000) -> Elite (👑)
 * - 80k+   (>= ৳80,000)  -> Platinum (💎)
 * - 60k+   (>= ৳60,000)  -> Diamond (🔷)
 * - 20k+   (>= ৳20,000)  -> Gold (🥇)
 * - 10k+   (>= ৳10,000)  -> Classic (⭐)
 * - < 10k  (< ৳10,000)   -> Classic (🏷️)
 */
export const getCustomerTier = (totalSpent = 0) => {
  const spent = Number(totalSpent) || 0;
  if (spent >= 100000) {
    return {
      tier: 'Elite',
      badge: 'Elite',
      color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      badgeGradient: 'from-purple-600 via-pink-600 to-indigo-600',
      icon: '👑',
      minSpend: 100000,
      nextTier: null,
      nextMinSpend: null,
    };
  }
  if (spent >= 80000) {
    return {
      tier: 'Platinum',
      badge: 'Platinum',
      color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      badgeGradient: 'from-cyan-500 via-blue-600 to-indigo-600',
      icon: '💎',
      minSpend: 80000,
      nextTier: 'Elite',
      nextMinSpend: 100000,
    };
  }
  if (spent >= 60000) {
    return {
      tier: 'Diamond',
      badge: 'Diamond',
      color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      badgeGradient: 'from-blue-600 to-indigo-600',
      icon: '🔷',
      minSpend: 60000,
      nextTier: 'Platinum',
      nextMinSpend: 80000,
    };
  }
  if (spent >= 20000) {
    return {
      tier: 'Gold',
      badge: 'Gold',
      color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      badgeGradient: 'from-amber-500 to-yellow-600',
      icon: '🥇',
      minSpend: 20000,
      nextTier: 'Diamond',
      nextMinSpend: 60000,
    };
  }
  if (spent >= 10000) {
    return {
      tier: 'Classic',
      badge: 'Classic',
      color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      badgeGradient: 'from-emerald-500 to-teal-600',
      icon: '⭐',
      minSpend: 10000,
      nextTier: 'Gold',
      nextMinSpend: 20000,
    };
  }
  return {
    tier: 'Classic',
    badge: 'Classic',
    color: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
    badgeGradient: 'from-neutral-600 to-neutral-700',
    icon: '🏷️',
    minSpend: 0,
    nextTier: 'Gold',
    nextMinSpend: 20000,
  };
};

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [spendByUser, setSpendByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [activeCardUser, setActiveCardUser] = useState(null);
  const [cardQrUrl, setCardQrUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Generate dynamic live verification QR code for card preview
  useEffect(() => {
    if (activeCardUser) {
      const memId = membershipIdOf(activeCardUser);
      const verifyUrl = `${window.location.origin}/membership/${encodeURIComponent(memId)}`;
      QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 1, width: 260 })
        .then((url) => setCardQrUrl(url))
        .catch(() => setCardQrUrl(activeCardUser.membershipQr || ''));
    } else {
      setCardQrUrl('');
    }
  }, [activeCardUser]);

  // 🎯 POS Barcode / QR Scanner & Search Query
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [scannedCustomer, setScannedCustomer] = useState(null);
  const [isSearchingPos, setIsSearchingPos] = useState(false);
  
  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);

  useEffect(() => {
    Promise.allSettled([getAllUsers(), getTopCustomers()])
      .then(([usersRes, spendingRes]) => {
        if (usersRes.status === 'fulfilled') {
          const users = Array.isArray(usersRes.value) ? usersRes.value : [];
          setCustomers(users.filter((u) => u.role === 'user'));
        } else {
          console.error('Failed to load customers:', usersRes.reason);
          setLoadError(usersRes.reason);
        }

        if (spendingRes.status === 'fulfilled') {
          const map = {};
          (Array.isArray(spendingRes.value) ? spendingRes.value : []).forEach((s) => {
            map[s.userId] = s;
          });
          setSpendByUser(map);
        } else {
          console.error('Failed to load customer spending:', spendingRes.reason);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const spendOf = (c) => spendByUser[c.id || c._id] || { totalSpent: 0, orderCount: 0 };

  const rankedCustomers = useMemo(
    () => [...customers].sort((a, b) => (spendByUser[b.id || b._id]?.totalSpent || 0) - (spendByUser[a.id || a._id]?.totalSpent || 0)),
    [customers, spendByUser]
  );
  
  const topThree = useMemo(
    () => rankedCustomers.filter((c) => (spendByUser[c.id || c._id]?.totalSpent || 0) > 0).slice(0, 3),
    [rankedCustomers, spendByUser]
  );

  // 🎯 POS Search / Scan Filter
  const filteredCustomers = useMemo(() => {
    if (!posSearchQuery.trim()) return rankedCustomers;
    let q = posSearchQuery.trim().toLowerCase();
    const urlMatch = q.match(/\/membership\/([^/?#]+)/i);
    if (urlMatch && urlMatch[1]) {
      q = decodeURIComponent(urlMatch[1]).trim().toLowerCase();
    }
    const cleanQ = cleanPhoneForMembership(q);

    return rankedCustomers.filter((c) => {
      const mid = membershipIdOf(c).toLowerCase();
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const cleanP = cleanPhoneForMembership(c.phone);

      return (
        mid.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        (cleanQ && cleanP && cleanP.includes(cleanQ))
      );
    });
  }, [rankedCustomers, posSearchQuery]);

  // Quick POS Scanner Lookup handler
  const handlePosLookup = async (e) => {
    e?.preventDefault();
    if (!posSearchQuery.trim()) return;

    let q = posSearchQuery.trim();
    const urlMatch = q.match(/\/membership\/([^/?#]+)/i);
    if (urlMatch && urlMatch[1]) {
      q = decodeURIComponent(urlMatch[1]).trim();
    }

    setIsSearchingPos(true);
    try {
      const res = await posLookupCustomer(q);
      if (res && res.user) {
        setScannedCustomer(res);
      } else {
        setScannedCustomer(null);
      }
    } catch {
      // If server lookup returns 404, check local state
      const localMatch = rankedCustomers.find((c) => {
        const mid = membershipIdOf(c).toLowerCase();
        const lowQ = q.toLowerCase();
        return mid === lowQ || (c.phone && c.phone.includes(lowQ));
      });
      if (localMatch) {
        const s = spendOf(localMatch);
        setScannedCustomer({
          user: localMatch,
          totalSpent: s.totalSpent,
          orderCount: s.orderCount,
          tier: getCustomerTier(s.totalSpent).tier,
          badge: getCustomerTier(s.totalSpent).badge,
        });
      } else {
        setScannedCustomer(null);
      }
    } finally {
      setIsSearchingPos(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadSingleCard = async (targetRef, cardType) => {
    if (!targetRef.current || !activeCardUser || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Membership_Card_${cardType}_${membershipIdOf(activeCardUser)}.png`;
      link.click();
    } catch (err) {
      console.error('Card download failed:', err);
      alert(`Could not generate ${cardType} card image. Please try again.`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Customers Registry
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Registered customer accounts with their spending tiers, loyalty badges, and POS scan information.
          </p>
        </div>

        {/* 🎯 POS / Barcode Scanner Quick Search */}
        <form onSubmit={handlePosLookup} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Scan Barcode / QR / Phone / ID..."
            value={posSearchQuery}
            onChange={(e) => {
              setPosSearchQuery(e.target.value);
              if (scannedCustomer) setScannedCustomer(null);
            }}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 shadow-xs"
          />
          {posSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setPosSearchQuery('');
                setScannedCustomer(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      <ErrorBanner title="Could not load customers" error={loadError} />

      {/* 🎯 POS Live Scanned Customer Detail Banner */}
      {scannedCustomer && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 text-white border border-primary-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-2xl shrink-0">
              {getCustomerTier(scannedCustomer.totalSpent).icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">
                  {scannedCustomer.user?.name}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${getCustomerTier(scannedCustomer.totalSpent).color}`}>
                  {getCustomerTier(scannedCustomer.totalSpent).icon} {getCustomerTier(scannedCustomer.totalSpent).badge}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300 mt-1 font-mono">
                <span className="text-primary-400 font-bold">
                  {membershipIdOf(scannedCustomer.user)}
                </span>
                <span>•</span>
                <span>{scannedCustomer.user?.phone || 'No phone'}</span>
                <span>•</span>
                <span>{scannedCustomer.user?.email || 'No email'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs shrink-0">
            <div className="bg-neutral-800/80 px-3.5 py-2 rounded-xl border border-neutral-700 text-center">
              <span className="block text-[10px] text-neutral-400 uppercase font-bold">Total Spent</span>
              <span className="font-black text-sm text-emerald-400">{taka(scannedCustomer.totalSpent)}</span>
            </div>
            <div className="bg-neutral-800/80 px-3.5 py-2 rounded-xl border border-neutral-700 text-center">
              <span className="block text-[10px] text-neutral-400 uppercase font-bold">Total Orders</span>
              <span className="font-black text-sm text-white">{scannedCustomer.orderCount || 0}</span>
            </div>
            <div className="bg-neutral-800/80 px-3.5 py-2 rounded-xl border border-neutral-700 text-center">
              <span className="block text-[10px] text-neutral-400 uppercase font-bold">Points</span>
              <span className="font-black text-sm text-amber-400">{scannedCustomer.user?.points || 0} pts</span>
            </div>
            <button
              onClick={() => setActiveCardUser(scannedCustomer.user)}
              className="px-3.5 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-md cursor-pointer text-xs flex items-center gap-1.5 transition-all"
            >
              <CreditCard className="w-4 h-4" /> View Card
            </button>
          </div>
        </div>
      )}

      {/* Top Customers Cards */}
      {topThree.length > 0 && !posSearchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-3 gap-4 lg:gap-6">
          {topThree.map((c, i) => {
            const s = spendOf(c);
            const tier = getCustomerTier(s.totalSpent);
            return (
              <div
                key={c.id || c._id}
                className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs"
              >
                <span className="text-2xl sm:text-3xl leading-none shrink-0" aria-hidden>{MEDAL[i]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary-500 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> #{i + 1}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${tier.color}`}>
                      {tier.icon} {tier.badge}
                    </span>
                  </div>
                  <p className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 truncate mt-0.5">{c.name}</p>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="font-extrabold text-neutral-700 dark:text-neutral-200">{taka(s.totalSpent)}</span>
                    {' · '}{s.orderCount} order{s.orderCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Customers Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 sm:p-6 shadow-xs w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-955/40">
                <th className="px-4 py-3">Membership ID</th>
                <th className="px-4 py-3">Tier Badge</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3 text-right">Total Spent</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Pick Area</th>
                <th className="px-4 py-3">Signup Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-neutral-400 text-sm">
                    No customers found matching "{posSearchQuery}".
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => {
                  const s = spendOf(c);
                  const tier = getCustomerTier(s.totalSpent);
                  const isTop = idx < 3 && s.totalSpent > 0 && !posSearchQuery;
                  const mId = membershipIdOf(c);

                  return (
                    <tr key={c.id || c._id} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-955/20 transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono">
                        <button
                          onClick={() => copyToClipboard(mId)}
                          className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 group cursor-pointer"
                          title="Click to copy Membership ID"
                        >
                          <span>{mId}</span>
                          {copiedId === mId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${tier.color}`}>
                          <span>{tier.icon}</span>
                          <span>{tier.badge}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-neutral-800 dark:text-neutral-100">
                        <span className="inline-flex items-center gap-1.5">
                          {isTop && <span aria-hidden title={`Top customer #${idx + 1}`}>{MEDAL[idx]}</span>}
                          {c.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-neutral-800 dark:text-neutral-100">
                        {s.totalSpent > 0 ? taka(s.totalSpent) : <span className="text-neutral-400 font-normal">৳0.00</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-neutral-600 dark:text-neutral-300">
                        {s.orderCount || 0}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-600 dark:text-neutral-355">
                        {c.email}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-neutral-800 dark:text-neutral-200">
                        {c.phone || <span className="text-neutral-450 font-light italic">Not Set</span>}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-primary-500">
                        {c.pickArea || <span className="text-neutral-450 font-light italic">Not Set</span>}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-450 dark:text-neutral-500 font-light">
                        {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setActiveCardUser(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 active:scale-95 transition-all text-white font-bold text-[10px] uppercase rounded-lg shadow-sm cursor-pointer"
                          title="Generate & View Membership Card"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Card
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MEMBERSHIP CARD MODAL */}
      {activeCardUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl max-w-4xl w-full border border-neutral-200 dark:border-neutral-800 space-y-6 my-auto">
            
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-neutral-800 dark:text-white text-base uppercase tracking-wide">
                  Membership Card Preview
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCustomerTier(spendOf(activeCardUser).totalSpent).color}`}>
                  {getCustomerTier(spendOf(activeCardUser).totalSpent).icon} {getCustomerTier(spendOf(activeCardUser).totalSpent).badge}
                </span>
              </div>
              <button 
                onClick={() => setActiveCardUser(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CARDS DISPLAY CONTAINER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center items-center p-2">
              
              {/* FRONT CARD DESIGN */}
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Front Side</p>
                <div
                  ref={frontCardRef}
                  className="relative w-[340px] sm:w-[384px] h-[198px] sm:h-[224px] rounded-xl overflow-hidden shadow-xl border border-neutral-800 select-none bg-neutral-900 shrink-0"
                >
                  {/* Static Card Front Background */}
                  <img
                    src="/card_1_front.png" 
                    alt="Card Front BG"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />

                  {/* Dynamic overlay values */}
                  <div className="relative z-10 w-full h-full p-4 flex flex-col justify-between">
                    
                    {/* Top Right: QR Code */}
                    <div className="flex items-start justify-end pt-7 pr-4">
                      {/* QR Code */}
                      <div className="p-1 bg-white rounded-lg shadow-lg">
                        {cardQrUrl || activeCardUser.membershipQr ? (
                          <img
                            src={cardQrUrl || activeCardUser.membershipQr}
                            alt={`QR ${membershipIdOf(activeCardUser)}`}
                            className="w-13 h-13 sm:w-14 sm:h-14 object-contain"
                          />
                        ) : (
                          <QrCode className="w-13 h-13 stroke-[1.5] text-neutral-800" />
                        )}
                      </div>
                    </div>

                    {/* Name & Membership ID Stacked Together on Bottom Right */}
                    <div className="flex flex-col items-end pr-4 pb-4 leading-tight">
                      <span className="block font-bold text-xs sm:text-sm tracking-wide text-white uppercase truncate max-w-[200px]">
                        {activeCardUser.name}
                      </span>
                      <span className="block font-mono font-bold text-xs text-neutral-200 tracking-wider mt-0.5">
                        {membershipIdOf(activeCardUser)}
                      </span>
                    </div>

                  </div>
                </div>
                
                <button
                  onClick={() => downloadSingleCard(frontCardRef, 'Front')}
                  disabled={downloading}
                  className="mt-1 text-xs font-semibold text-primary-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Front
                </button>
              </div>

              {/* BACK CARD DESIGN */}
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Back Side</p>
                <div
                  ref={backCardRef}
                  className="relative w-[340px] sm:w-[384px] h-[198px] sm:h-[224px] rounded-xl overflow-hidden shadow-xl border border-neutral-800 select-none bg-neutral-900 shrink-0"
                >
                  <img
                    src="/card_2_front.png" 
                    alt="Card Back BG"
                    className="w-full h-full object-cover"
                  />
                </div>

                <button
                  onClick={() => downloadSingleCard(backCardRef, 'Back')}
                  disabled={downloading}
                  className="mt-1 text-xs font-semibold text-primary-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Back
                </button>
              </div>

            </div>

            {/* 🔗 DIRECT VERIFICATION LINK & TEST BAR */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-750 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                <QrCode className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="text-neutral-500 dark:text-neutral-400 shrink-0 font-medium">Scan / Verification Link:</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate select-all">
                  {window.location.origin}/membership/{membershipIdOf(activeCardUser)}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${window.location.origin}/membership/${membershipIdOf(activeCardUser)}`)}
                  className="px-2.5 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-200 font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedId === `${window.location.origin}/membership/${membershipIdOf(activeCardUser)}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy URL
                    </>
                  )}
                </button>
                <a
                  href={`/membership/${encodeURIComponent(membershipIdOf(activeCardUser))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>Test Page</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setActiveCardUser(null)}
                className="flex-1 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 rounded-xl transition-all cursor-pointer text-center"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
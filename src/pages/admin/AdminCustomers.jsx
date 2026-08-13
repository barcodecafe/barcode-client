import { useState, useEffect, useRef, useMemo } from 'react';
import { getAllUsers } from '../../services/authService';
import { getTopCustomers } from '../../services/analyticsService';
import { CreditCard, Download, X, QrCode, Crown } from 'lucide-react';
import { ErrorBanner } from '../../components/ErrorBanner';
import html2canvas from 'html2canvas-pro';

const taka = (n) => `৳${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const MEDAL = ['🥇', '🥈', '🥉'];

const membershipIdOf = (c) =>
  c?.membershipId || `BRG-${String(c?.id || "").slice(-6).toUpperCase() || "000"}`;

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [spendByUser, setSpendByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [activeCardUser, setActiveCardUser] = useState(null);
  const [downloading, setDownloading] = useState(false);
  
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

  const spendOf = (c) => spendByUser[c.id] || { totalSpent: 0, orderCount: 0 };

  const rankedCustomers = useMemo(
    () => [...customers].sort((a, b) => (spendByUser[b.id]?.totalSpent || 0) - (spendByUser[a.id]?.totalSpent || 0)),
    [customers, spendByUser]
  );
  
  const topThree = useMemo(
    () => rankedCustomers.filter((c) => (spendByUser[c.id]?.totalSpent || 0) > 0).slice(0, 3),
    [rankedCustomers, spendByUser]
  );

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
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
          Customers Registry
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Registered customer accounts with their lifetime purchase record, ranked by total spend.
        </p>
      </div>

      <ErrorBanner title="Could not load customers" error={loadError} />

      {/* Top Customers Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-3 gap-4 lg:gap-6">
          {topThree.map((c, i) => {
            const s = spendOf(c);
            return (
              <div
                key={c.id}
                className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs"
              >
                <span className="text-2xl sm:text-3xl leading-none shrink-0" aria-hidden>{MEDAL[i]}</span>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary-500 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> Top Customer #{i + 1}
                  </p>
                  <p className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 truncate">{c.name}</p>
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
              {rankedCustomers.map((c, idx) => {
                const s = spendOf(c);
                const isTop = idx < 3 && s.totalSpent > 0;
                return (
                <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-955/20 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {membershipIdOf(c)}
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MEMBERSHIP CARD MODAL */}
      {activeCardUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl max-w-4xl w-full border border-neutral-200 dark:border-neutral-800 space-y-6 my-auto">
            
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-display font-bold text-neutral-800 dark:text-white text-base uppercase tracking-wide">
                Membership Card Preview
              </h3>
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
                    
                    {/* QR Code Positioned in top-right area under BARCODE logo */}
                    <div className="flex justify-end pt-11 pr-5">
                      <div className="p-0.5 bg-white rounded shadow-md">
                        {activeCardUser.membershipQr ? (
                          <img
                            src={activeCardUser.membershipQr}
                            alt={`QR ${membershipIdOf(activeCardUser)}`}
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <QrCode className="w-10 h-10 stroke-[1.5] text-neutral-800" />
                        )}
                      </div>
                    </div>

                    {/* Name & Membership ID Stacked Together on Bottom Right */}
                    <div className="flex flex-col items-end pr-5 pb-5 leading-tight">
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
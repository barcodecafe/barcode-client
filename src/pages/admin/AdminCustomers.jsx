import { useState, useEffect, useRef } from 'react';
import { getAllUsers } from '../../services/authService';
import { CreditCard, Download, X, QrCode } from 'lucide-react';
import html2canvas from 'html2canvas'; 

// The membership id + QR are generated and stored on the server (stable, unique).
// Prefer the backend value; fall back to a derived id only if it's somehow missing.
const membershipIdOf = (c) =>
  c?.membershipId || `BRG-${String(c?.id || "").slice(-6).toUpperCase() || "000"}`;

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
 // State and reference for the Card Maker modal and download functionality
  const [activeCardUser, setActiveCardUser] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    getAllUsers().then((data) => {
      setCustomers(data.filter((u) => u.role === 'user'));
      setLoading(false);
    });
  }, []);

  // Function to download the card as a PNG image
  const handleDownloadCard = () => {
    if (!cardRef.current || !activeCardUser) return;

   // Convert the card section into an image using html2canvas
    html2canvas(cardRef.current, {
      scale: 3, // Use a higher scale for high-quality (HD) image output
      useCORS: true,
      backgroundColor: null // Keep the background transparent
    }).then((canvas) => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Membership_Card_${membershipIdOf(activeCardUser)}.png`;
      link.click();
    });
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
          Registered customer accounts profile directory including contact info, region, and addresses.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-950/40">
                <th className="px-4 py-3">Customer ID</th>
                <th className="px-4 py-3">Membership ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Pick Area</th>
                <th className="px-4 py-3">Detailed Address</th>
                <th className="px-4 py-3">Signup Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                  <td className="px-4 py-3.5 text-neutral-400 font-mono text-[11px]">
                    {c.id.slice(0, 12)}...
                  </td>
                  <td className="px-4 py-3.5 font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {membershipIdOf(c)}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-neutral-800 dark:text-neutral-100">
                    {c.name}
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
                  <td className="px-4 py-3.5 text-neutral-605 dark:text-neutral-300 font-light truncate max-w-xs">
                    {c.address || <span className="text-neutral-450 font-light italic">Not Set</span>}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-450 dark:text-neutral-500 font-light">
                    {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setActiveCardUser(c)} // Click here to open the modal
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary-500 hover:bg-primary-600 active:scale-95 transition-all text-white font-bold text-[10px] uppercase rounded-lg shadow-sm cursor-pointer"
                      title="Generate & View Membership Card"
                    >
                      <CreditCard className="w-3 h-3" /> Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MEMBERSHIP CARD GENERATOR MODAL ================= */}
      {activeCardUser && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-neutral-200 dark:border-neutral-800 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-display font-bold text-neutral-800 dark:text-white text-sm uppercase tracking-wide">
                Membership Card Preview
              </h3>
              <button 
                onClick={() => setActiveCardUser(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Card Area (This section will be downloaded) */}
            <div className="flex justify-center p-2">
              <div 
                ref={cardRef} 
                className="w-96 h-56 rounded-2xl p-5 bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-950 text-white relative shadow-xl overflow-hidden border border-neutral-800 flex flex-col justify-between font-sans select-none"
                style={{ width: '384px', height: '224px' }} // Standard Credit Card Size Ratio
              >
                {/* Decorative background glow */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Card Top Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block font-display font-black text-xs tracking-wider text-primary-400 uppercase">
                      BARCODE CAFE
                    </span>
                    <span className="block text-[8px] text-neutral-400 font-light tracking-widest uppercase">
                      Premium Loyalty Club
                    </span>
                  </div>
                  <div className="px-2 py-0.5 rounded border border-primary-500/30 bg-primary-500/10 text-primary-400 font-bold text-[7px] uppercase tracking-wider">
                    VIP MEMBER
                  </div>
                </div>

                {/* Card Center: Chip & real scannable QR */}
                <div className="flex justify-between items-center my-2">
                  {/* Smart Card Chip Simulation */}
                  <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-200 opacity-80 border border-amber-500/30 shadow-inner" />

                  {/* Real membership QR (encodes the membership id) — scan at POS */}
                  <div className="p-1 bg-white rounded-md">
                    {activeCardUser.membershipQr ? (
                      <img
                        src={activeCardUser.membershipQr}
                        alt={`Membership QR ${membershipIdOf(activeCardUser)}`}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <QrCode className="w-7 h-7 stroke-[1.5] text-neutral-500" />
                    )}
                  </div>
                </div>

                {/* Card Bottom: User Details */}
                <div className="flex justify-between items-end border-t border-neutral-800/60 pt-2">
                  <div className="space-y-0.5">
                    <span className="block text-[8px] text-neutral-500 uppercase font-semibold tracking-wider">
                      Card Holder
                    </span>
                    <span className="block font-bold text-xs tracking-wide text-neutral-100 uppercase truncate max-w-[200px]">
                      {activeCardUser.name}
                    </span>
                    <span className="block text-[8px] text-neutral-450 font-light">
                      Joined: {new Date(activeCardUser.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <span className="block text-[8px] text-neutral-500 uppercase font-semibold tracking-wider">
                      Membership ID
                    </span>
                    <span className="block font-mono font-bold text-sm text-primary-400 tracking-wider">
                      {membershipIdOf(activeCardUser)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setActiveCardUser(null)}
                className="flex-1 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadCard}
                className="flex-1 py-2 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 active:scale-95 rounded-xl shadow-md shadow-primary-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Card
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bike,
  Search,
  Check,
  X,
  FileText,
  User,
  Phone,
  CreditCard,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import {
  getRiderApplications,
  approveRiderApplication,
  rejectRiderApplication,
  getApplicationDocUrl,
} from '../../services/ridersService';

// ---------------------------------------------------------------------------
// AdminRiders.jsx — /admin/rider-applications
//
// LIVE BACKEND. Lists rider applications from GET /api/rider-applications and
// approves/rejects via the API (which flips the applicant's approval status).
// Photos & license PDFs are fetched through the admin-authenticated stream
// endpoints as object URLs (never public).
// ---------------------------------------------------------------------------

// Lazy-loads a rider's photo through the auth-gated document stream.
const RiderPhoto = ({ appId, alt }) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let active = true;
    let objUrl;
    getApplicationDocUrl(appId, 'photo')
      .then((u) => {
        if (active) {
          objUrl = u;
          setUrl(u);
        } else {
          URL.revokeObjectURL(u);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [appId]);

  return url ? (
    <img src={url} alt={alt} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <User className="w-6 h-6 text-neutral-400" />
    </div>
  );
};

export const AdminRiders = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchApps = () => {
    setLoading(true);
    getRiderApplications()
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleApprove = async (app) => {
    if (!window.confirm(`Approve ${app.name} as a rider?`)) return;
    setBusyId(app.id);
    try {
      await approveRiderApplication(app.id);
      fetchApps();
    } catch (e) {
      alert('Error approving: ' + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (app) => {
    if (!window.confirm(`Reject ${app.name}'s application?`)) return;
    setBusyId(app.id);
    try {
      await rejectRiderApplication(app.id);
      fetchApps();
    } catch (e) {
      alert('Error rejecting: ' + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const viewLicense = async (app) => {
    try {
      const url = await getApplicationDocUrl(app.id, 'license');
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      alert('Failed to load license: ' + e.message);
    }
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesTab = app.status === activeTab;
    const matchesSearch =
      !q ||
      app.name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      (app.phone || '').includes(q) ||
      (app.nid || '').includes(q);
    return matchesTab && matchesSearch;
  });

  const countFor = (status) => applications.filter((a) => a.status === status).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Bike className="w-8 h-8 text-primary-500" />
          Rider Applications
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Review new rider sign-ups — check their details and documents, then approve or reject.
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl self-start">
          {['pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab} ({countFor(tab)})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-12 text-center text-neutral-400 dark:text-neutral-500">
          <AlertCircle className="w-10 h-10 mx-auto stroke-1 mb-3 text-neutral-300" />
          <p className="font-bold text-sm">No {activeTab} applications.</p>
          <p className="text-xs font-light mt-1">New rider sign-ups will appear here for review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredApps.map((app) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              key={app.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 overflow-hidden shrink-0">
                    <RiderPhoto appId={app.id} alt={app.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white truncate">{app.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{app.email}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase h-fit ${
                      app.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-500'
                        : app.status === 'approved'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-semibold truncate">{app.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-mono truncate">{app.nid || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-medium truncate">
                      {app.expYears} yrs{app.experience ? ` (${app.experience})` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => viewLicense(app)}
                    className="flex items-center gap-2 text-primary-500 font-semibold hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">View License PDF</span>
                  </button>
                </div>
              </div>

              {app.status === 'pending' && (
                <div className="flex items-center gap-3 pt-5 mt-5 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => handleReject(app)}
                    disabled={busyId === app.id}
                    className="flex-grow flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold transition-all active:scale-98 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(app)}
                    disabled={busyId === app.id}
                    className="flex-grow flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-md shadow-primary-500/10 transition-all active:scale-98 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRiders;

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bike, 
  Search, 
  Clock, 
  Check, 
  X, 
  FileText, 
  User, 
  Phone, 
  CreditCard,
  Briefcase,
  AlertCircle,
  Eye
} from 'lucide-react';

const APPS_KEY = 'barcode_rider_applications';
const USERS_KEY = 'barcode_users';
const RIDERS_KEY = 'barcode_riders';

export const AdminRiders = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal preview states
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const fetchApplications = () => {
    setLoading(true);
    try {
      const rawApps = localStorage.getItem(APPS_KEY);
      const apps = rawApps ? JSON.parse(rawApps) : [];
      
      // Sort by newest first
      apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setApplications(apps);
    } catch (e) {
      console.error('Failed to load rider applications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = (app) => {
    if (!window.confirm(`Are you sure you want to APPROVE ${app.name} as a rider?`)) return;

    try {
      // 1. Update application status
      const rawApps = localStorage.getItem(APPS_KEY);
      const apps = rawApps ? JSON.parse(rawApps) : [];
      const updatedApps = apps.map(a => a.id === app.id ? { ...a, status: 'approved' } : a);
      localStorage.setItem(APPS_KEY, JSON.stringify(updatedApps));

      // 2. Update user's role to 'rider' in barcode_users
      const rawUsers = localStorage.getItem(USERS_KEY);
      const users = rawUsers ? JSON.parse(rawUsers) : [];
      const updatedUsers = users.map(u => {
        if (u.id === app.userId || u.email === app.email) {
          return { ...u, role: 'rider', phone: app.phone };
        }
        return u;
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

      // 3. Add to barcode_riders list
      const rawRiders = localStorage.getItem(RIDERS_KEY);
      const riders = rawRiders ? JSON.parse(rawRiders) : [];
      
      // Check if already in riders list
      if (!riders.some(r => r.id === app.userId)) {
        const newRider = {
          id: app.userId,
          name: app.name,
          phone: app.phone,
          vehicle: 'Motorbike', // default vehicle
          status: 'Available'
        };
        riders.push(newRider);
        localStorage.setItem(RIDERS_KEY, JSON.stringify(riders));
      }

      // Reload
      fetchApplications();
    } catch (e) {
      alert('Error approving application: ' + e.message);
    }
  };

  const handleReject = (app) => {
    if (!window.confirm(`Are you sure you want to REJECT ${app.name}'s application?`)) return;

    try {
      // Update application status to rejected
      const rawApps = localStorage.getItem(APPS_KEY);
      const apps = rawApps ? JSON.parse(rawApps) : [];
      const updatedApps = apps.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a);
      localStorage.setItem(APPS_KEY, JSON.stringify(updatedApps));

      // Reload
      fetchApplications();
    } catch (e) {
      alert('Error rejecting application: ' + e.message);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesTab = app.status === activeTab;
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery) ||
      app.nid.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Bike className="w-8 h-8 text-primary-500" />
          Rider Applications Manager
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Review credentials, photos, and driving license PDFs to recruit new riders into the logistics fleet.
        </p>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Navigation Tabs */}
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
              {tab} ({applications.filter(a => a.status === tab).length})
            </button>
          ))}
        </div>

        {/* Search Bar */}
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
          <p className="font-bold text-sm">No applications found.</p>
          <p className="text-xs font-light mt-1">There are no {activeTab} applications matching your filters.</p>
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
                {/* Header Profile row */}
                <div className="flex items-start gap-4">
                  <div 
                    onClick={() => setSelectedPhoto(app.photo)}
                    className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 overflow-hidden shrink-0 cursor-pointer group relative"
                  >
                    <img src={app.photo} alt={app.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white truncate">{app.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{app.email}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-semibold">{app.phone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-mono">{app.nid}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-medium">{app.expYears} Years ({app.experience})</span>
                  </div>

                  <div 
                    onClick={() => setSelectedPdf({ name: app.licenseName, pdf: app.licensePdf })}
                    className="flex items-center gap-2 text-primary-500 font-semibold cursor-pointer hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[150px]" title={app.licenseName}>{app.licenseName}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              {app.status === 'pending' && (
                <div className="flex items-center gap-3 pt-5 mt-5 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => handleReject(app)}
                    className="flex-grow flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold transition-all active:scale-98"
                  >
                    <X className="w-4 h-4" />
                    Reject Application
                  </button>

                  <button
                    onClick={() => handleApprove(app)}
                    className="flex-grow flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-md shadow-primary-500/10 transition-all active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    Approve & Appoint
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Profile Photo Viewer Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-neutral-950/70 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-lg max-h-[85vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-3 z-10 overflow-hidden shadow-2xl"
            >
              <img src={selectedPhoto} alt="Rider profile enlarged" className="max-h-[75vh] max-w-full rounded-2xl object-contain" />
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-5 right-5 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Driving License PDF Stub Modal */}
      <AnimatePresence>
        {selectedPdf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPdf(null)}
              className="absolute inset-0 bg-neutral-950/70 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 z-10 shadow-2xl overflow-hidden text-center"
            >
              <div className="w-14 h-14 bg-primary-500/10 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">
                Driving License Document
              </h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-1 font-mono">{selectedPdf.name}</p>

              {/* Rendering dynamic iframe or mock preview of license PDF */}
              <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-4 my-6 text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
                <p className="font-bold text-neutral-700 dark:text-neutral-350">Document Authentication Panel</p>
                <p className="font-light text-[10px]">Base64 stream is encrypted. In production, this targets `api/rider/documents/download` returning a direct PDF reader.</p>
                <div className="pt-2">
                  <a 
                    href={selectedPdf.pdf} 
                    download={selectedPdf.name}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Download PDF File
                  </a>
                </div>
              </div>

              <button 
                onClick={() => setSelectedPdf(null)}
                className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs transition-colors"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRiders;

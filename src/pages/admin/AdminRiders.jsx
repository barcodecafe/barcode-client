import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Save,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import {
  getRiderApplications,
  approveRiderApplication,
  rejectRiderApplication,
  updateRiderApplication,
  deleteRiderApplication,
  getApplicationDocUrl,
} from '../../services/ridersService';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';

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
    <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
      <User className="w-5 h-5" />
    </div>
  );
};

export const AdminRiders = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_riders_view_mode') || 'grid';
    }
    return 'grid';
  });
  const [busyId, setBusyId] = useState(null);

  // Edit Modal State
  const [editingApp, setEditingApp] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    nid: '',
    experience: '',
    expYears: 0,
    status: 'pending',
  });
  const [savingEdit, setSavingEdit] = useState(false);

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

  const setAndStoreViewMode = (mode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_riders_view_mode', mode);
    }
  };

  // Status Change Handler (Approve, Reject, or Re-open)
  const handleStatusChange = async (app, targetStatus) => {
    const actionName =
      targetStatus === 'approved'
        ? 'Approve & Promote to Rider'
        : targetStatus === 'rejected'
          ? 'Reject Application'
          : 'Move to Pending';

    const result = await Swal.fire({
      title: `${actionName}?`,
      text: `Are you sure you want to change ${app.name}'s status to ${targetStatus}?`,
      icon: targetStatus === 'approved' ? 'question' : targetStatus === 'rejected' ? 'warning' : 'info',
      showCancelButton: true,
      confirmButtonColor: targetStatus === 'approved' ? '#e02424' : targetStatus === 'rejected' ? '#ef4444' : '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${targetStatus.toUpperCase()}`,
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#171717' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
    });

    if (!result.isConfirmed) return;

    setBusyId(app.id);
    try {
      if (targetStatus === 'approved') {
        await approveRiderApplication(app.id);
      } else if (targetStatus === 'rejected') {
        await rejectRiderApplication(app.id);
      } else {
        await updateRiderApplication(app.id, { status: 'pending' });
      }
      toast.success(`Application updated to ${targetStatus}!`);
      fetchApps();
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: e.message || 'Operation failed',
        icon: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  // Delete Application Record
  const handleDelete = async (app) => {
    const result = await Swal.fire({
      title: 'Delete Application?',
      text: `Are you sure you want to permanently delete ${app.name}'s application record? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#171717' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
    });

    if (!result.isConfirmed) return;

    setBusyId(app.id);
    try {
      await deleteRiderApplication(app.id);
      toast.success(`Application for ${app.name} deleted successfully!`);
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
    } catch (e) {
      Swal.fire({
        title: 'Delete Failed',
        text: e.message || 'Failed to delete application',
        icon: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (app) => {
    setEditingApp(app);
    setEditForm({
      name: app.name || '',
      email: app.email || '',
      phone: app.phone || '',
      nid: app.nid || '',
      experience: app.experience || '',
      expYears: app.expYears || 0,
      status: app.status || 'pending',
    });
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingApp) return;

    setSavingEdit(true);
    try {
      await updateRiderApplication(editingApp.id, editForm);
      toast.success('Rider application updated successfully!');
      setEditingApp(null);
      fetchApps();
    } catch (err) {
      Swal.fire({
        title: 'Update Failed',
        text: err.message || 'Could not update application',
        icon: 'error',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Document Viewer
  const viewLicense = async (app) => {
    try {
      const url = await getApplicationDocUrl(app.id, 'license');
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      toast.error('Failed to load license: ' + e.message);
    }
  };

  // Filter applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesTab = activeTab === 'all' || app.status === activeTab;
      const matchesSearch =
        !q ||
        app.name?.toLowerCase().includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        (app.phone || '').includes(q) ||
        (app.nid || '').includes(q);
      return matchesTab && matchesSearch;
    });
  }, [applications, activeTab, searchQuery]);

  const countFor = (status) => applications.filter((a) => a.status === status).length;

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header with Title and View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Bike className="w-8 h-8 text-primary-500" />
            Rider Applications
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage applicant profiles, review documents, change approval statuses, and perform CRUD actions.
          </p>
        </div>

        {/* View Mode Switcher Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 self-start sm:self-auto">
          <button
            onClick={() => setAndStoreViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grid View</span>
          </button>
          <button
            onClick={() => setAndStoreViewMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            title="Row / Table View"
          >
            <List className="w-4 h-4" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Tabs + Search Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: `All (${applications.length})` },
            { id: 'pending', label: `Pending (${countFor('pending')})` },
            { id: 'approved', label: `Approved (${countFor('approved')})` },
            { id: 'rejected', label: `Rejected (${countFor('rejected')})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, NID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
          />
        </div>
      </div>

      {/* Main Content Area: Loading / Empty / Grid / Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[35vh]">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-12 text-center text-neutral-400 dark:text-neutral-500">
          <AlertCircle className="w-10 h-10 mx-auto stroke-1 mb-3 text-neutral-300" />
          <p className="font-bold text-sm">No applications found matching "{searchQuery || activeTab}".</p>
          <p className="text-xs font-light mt-1">Try changing filters or search terms.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* 📋 ROW-BASED TABLE VIEW */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-3 sm:p-4 lg:p-4.5 shadow-xs w-full overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left table-fixed border-collapse">
              <colgroup>
                <col className="w-[6%] sm:w-[5%]" />
                <col className="w-[14%] sm:w-[13%]" />
                <col className="w-[18%] sm:w-[16%]" />
                <col className="w-[12%] sm:w-[11%]" />
                <col className="w-[12%] sm:w-[11%]" />
                <col className="w-[11%] sm:w-[11%]" />
                <col className="w-[9%] sm:w-[9%]" />
                <col className="w-[8%] sm:w-[8%]" />
                <col className="w-[10%] sm:w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-955/40 text-[9.5px] sm:text-[10px] xl:text-[11px]">
                  <th className="px-2 py-2.5 text-center">Photo</th>
                  <th className="px-2 py-2.5 whitespace-nowrap truncate">Applicant Name</th>
                  <th className="px-2 py-2.5 whitespace-nowrap truncate">Email & Phone</th>
                  <th className="px-2 py-2.5 whitespace-nowrap truncate">NID Number</th>
                  <th className="px-2 py-2.5 whitespace-nowrap truncate">Experience</th>
                  <th className="px-2 py-2.5 whitespace-nowrap truncate">License PDF</th>
                  <th className="px-2 py-2.5 whitespace-nowrap truncate">Status</th>
                  <th className="px-2 py-2.5 whitespace-nowrap truncate">Applied</th>
                  <th className="px-2 py-2.5 text-right whitespace-nowrap truncate">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] xl:text-xs">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-955/20 transition-colors"
                  >
                    {/* Photo */}
                    <td className="px-2 py-2.5 text-center">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden mx-auto border border-neutral-200 dark:border-neutral-700">
                        <RiderPhoto appId={app.id} alt={app.name} />
                      </div>
                    </td>

                    {/* Applicant Name */}
                    <td className="px-2 py-2.5 font-bold text-neutral-800 dark:text-neutral-100 overflow-hidden">
                      <span className="truncate block" title={app.name}>
                        {app.name}
                      </span>
                    </td>

                    {/* Email & Phone */}
                    <td className="px-2 py-2.5 overflow-hidden">
                      <div className="min-w-0">
                        <span className="truncate block text-neutral-600 dark:text-neutral-355 text-[10px] xl:text-xs" title={app.email}>
                          {app.email}
                        </span>
                        <span className="truncate block font-medium text-neutral-800 dark:text-neutral-200 text-[10px] xl:text-xs" title={app.phone}>
                          {app.phone || '—'}
                        </span>
                      </div>
                    </td>

                    {/* NID */}
                    <td className="px-2 py-2.5 font-mono text-[10px] xl:text-xs text-neutral-700 dark:text-neutral-300 overflow-hidden">
                      <span className="truncate block" title={app.nid}>
                        {app.nid || '—'}
                      </span>
                    </td>

                    {/* Experience */}
                    <td className="px-2 py-2.5 text-neutral-700 dark:text-neutral-300 overflow-hidden">
                      <span className="truncate block" title={`${app.expYears} yrs (${app.experience})`}>
                        {app.expYears} yrs {app.experience ? `• ${app.experience}` : ''}
                      </span>
                    </td>

                    {/* License */}
                    <td className="px-2 py-2.5 overflow-hidden">
                      <button
                        onClick={() => viewLicense(app)}
                        className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer text-[10px] xl:text-xs"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">View PDF</span>
                      </button>
                    </td>

                    {/* Status Badge */}
                    <td className="px-2 py-2.5 overflow-hidden">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] xl:text-[10px] font-extrabold uppercase ${
                          app.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : app.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {app.status === 'approved' ? (
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                        ) : app.status === 'rejected' ? (
                          <ShieldAlert className="w-3 h-3 shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 shrink-0" />
                        )}
                        <span className="truncate">{app.status}</span>
                      </span>
                    </td>

                    {/* Applied Date */}
                    <td className="px-2 py-2.5 text-neutral-450 dark:text-neutral-500 font-light text-[9.5px] xl:text-[11px] overflow-hidden truncate">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-2.5 text-right overflow-hidden">
                      <div className="flex items-center justify-end gap-1 flex-wrap sm:flex-nowrap">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusChange(app, 'approved')}
                              disabled={busyId === app.id}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[9px] xl:text-[10px] rounded shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Approve Applicant"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(app, 'rejected')}
                              disabled={busyId === app.id}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[9px] xl:text-[10px] rounded shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Reject Applicant"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        ) : app.status === 'approved' ? (
                          <button
                            onClick={() => handleStatusChange(app, 'rejected')}
                            disabled={busyId === app.id}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[9px] xl:text-[10px] rounded border border-rose-500/20 cursor-pointer disabled:opacity-50"
                            title="Demote / Reject"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(app, 'approved')}
                            disabled={busyId === app.id}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] xl:text-[10px] rounded border border-emerald-500/20 cursor-pointer disabled:opacity-50"
                            title="Re-approve"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(app)}
                          className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDelete(app)}
                          disabled={busyId === app.id}
                          className="p-1 rounded bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 cursor-pointer disabled:opacity-50"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ⊞ GRID-BASED CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              key={app.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Card Top: Photo, Name, Email, Status */}
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-800 overflow-hidden shrink-0">
                    <RiderPhoto appId={app.id} alt={app.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white truncate">
                        {app.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                          app.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : app.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{app.email}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                {/* Card Details Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-semibold truncate text-[11px]">{app.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CreditCard className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-mono truncate text-[11px]">{app.nid || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Briefcase className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="font-medium truncate text-[11px]" title={`${app.expYears} yrs (${app.experience})`}>
                      {app.expYears} yrs {app.experience ? `(${app.experience})` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => viewLicense(app)}
                    className="flex items-center gap-1.5 text-primary-500 font-semibold hover:underline cursor-pointer text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">View License PDF</span>
                  </button>
                </div>
              </div>

              {/* Card Footer Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {app.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleStatusChange(app, 'rejected')}
                        disabled={busyId === app.id}
                        className="flex-1 py-1.5 px-2 rounded-xl border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold transition-all active:scale-98 disabled:opacity-50 cursor-pointer text-center truncate"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(app, 'approved')}
                        disabled={busyId === app.id}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-sm transition-all active:scale-98 disabled:opacity-50 cursor-pointer text-center truncate"
                      >
                        Approve
                      </button>
                    </>
                  ) : app.status === 'approved' ? (
                    <button
                      onClick={() => handleStatusChange(app, 'rejected')}
                      disabled={busyId === app.id}
                      className="flex-1 py-1.5 px-2 rounded-xl border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold transition-all active:scale-98 disabled:opacity-50 cursor-pointer text-center truncate"
                    >
                      Reject / Demote
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(app, 'approved')}
                      disabled={busyId === app.id}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-98 disabled:opacity-50 cursor-pointer text-center truncate"
                    >
                      Approve & Promote
                    </button>
                  )}
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(app)}
                    className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                    title="Edit Application"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(app)}
                    disabled={busyId === app.id}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 cursor-pointer disabled:opacity-50"
                    title="Delete Application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ✏️ EDIT APPLICATION MODAL */}
      <AnimatePresence>
        {editingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-neutral-200 dark:border-neutral-800 space-y-5 my-auto"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary-500" />
                  <h3 className="font-display font-bold text-neutral-800 dark:text-white text-base">
                    Edit Rider Application
                  </h3>
                </div>
                <button
                  onClick={() => setEditingApp(null)}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      NID Number
                    </label>
                    <input
                      type="text"
                      value={editForm.nid}
                      onChange={(e) => setEditForm({ ...editForm, nid: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.expYears}
                      onChange={(e) => setEditForm({ ...editForm, expYears: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Experience Details / Notes
                  </label>
                  <input
                    type="text"
                    value={editForm.experience}
                    onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                    placeholder="e.g. 2 years at Foodpanda, reliable rider"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Application Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold"
                  >
                    <option value="pending">⏳ Pending Review</option>
                    <option value="approved">✅ Approved (Promote to Rider)</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setEditingApp(null)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRiders;
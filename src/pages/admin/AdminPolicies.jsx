import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Check,
  Eye,
  Lock,
  Mail,
  ShoppingBag,
  Truck,
  RefreshCw,
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  Phone,
  Tag,
  Sparkles,
  Clock,
  Building2,
  Users,
  Scale,
  HelpCircle,
  Heart,
} from 'lucide-react';
import {
  getPolicy,
  updatePolicyHeader,
  addPolicySection,
  updatePolicySection,
  deletePolicySection,
} from '../../services/policyService';

export const AVAILABLE_ICONS = [
  { name: 'file-text', label: 'File Text', icon: FileText },
  { name: 'eye', label: 'Eye (Privacy)', icon: Eye },
  { name: 'lock', label: 'Lock (Security)', icon: Lock },
  { name: 'shield', label: 'Shield', icon: Shield },
  { name: 'shield-check', label: 'Shield Check', icon: ShieldCheck },
  { name: 'mail', label: 'Mail / Contact', icon: Mail },
  { name: 'shopping-bag', label: 'Shopping Bag', icon: ShoppingBag },
  { name: 'truck', label: 'Delivery Truck', icon: Truck },
  { name: 'refresh-cw', label: 'Refresh / Refund', icon: RefreshCw },
  { name: 'globe', label: 'Globe / Web', icon: Globe },
  { name: 'scale', label: 'Legal Scale', icon: Scale },
  { name: 'check-circle', label: 'Check Circle', icon: CheckCircle },
  { name: 'alert-circle', label: 'Alert Circle', icon: AlertCircle },
  { name: 'info', label: 'Info', icon: Info },
  { name: 'phone', label: 'Phone', icon: Phone },
  { name: 'tag', label: 'Price Tag', icon: Tag },
  { name: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { name: 'clock', label: 'Clock', icon: Clock },
  { name: 'building', label: 'Building', icon: Building2 },
  { name: 'users', label: 'Users', icon: Users },
  { name: 'heart', label: 'Heart', icon: Heart },
  { name: 'help-circle', label: 'Help', icon: HelpCircle },
];

export const getPolicyIcon = (iconName) => {
  const found = AVAILABLE_ICONS.find(
    (i) => i.name.toLowerCase() === String(iconName || '').toLowerCase()
  );
  return found ? found.icon : FileText;
};

export const AdminPolicies = () => {
  const [activeType, setActiveType] = useState('privacy-policy');
  const [policyData, setPolicyData] = useState({ title: '', lastUpdated: '', sections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Header form states
  const [titleInput, setTitleInput] = useState('');
  const [lastUpdatedInput, setLastUpdatedInput] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    icon: 'file-text',
    title: '',
    content: '',
    order: 1,
  });
  const [isSavingSection, setIsSavingSection] = useState(false);

  const fetchPolicy = (type) => {
    setIsLoading(true);
    getPolicy(type)
      .then((data) => {
        if (data) {
          setPolicyData(data);
          setTitleInput(data.title || '');
          setLastUpdatedInput(data.lastUpdated || '');
        }
      })
      .catch((err) => {
        console.error('Failed to load policy:', err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPolicy(activeType);
  }, [activeType]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveHeader = async (e) => {
    e.preventDefault();
    setIsSavingHeader(true);
    try {
      await updatePolicyHeader(activeType, {
        title: titleInput.trim(),
        lastUpdated: lastUpdatedInput.trim(),
      });
      showSuccess(`${activeType === 'privacy-policy' ? 'Privacy Policy' : 'Terms of Service'} header updated!`);
      fetchPolicy(activeType);
    } catch (err) {
      alert(err.message || 'Failed to update policy header.');
    } finally {
      setIsSavingHeader(false);
    }
  };

  const openAddModal = () => {
    setSelectedSection(null);
    const nextOrder =
      policyData.sections && policyData.sections.length > 0
        ? Math.max(...policyData.sections.map((s) => s.order || 0)) + 1
        : 1;

    setSectionForm({
      icon: activeType === 'privacy-policy' ? 'eye' : 'shopping-bag',
      title: '',
      content: '',
      order: nextOrder,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (section) => {
    setSelectedSection(section);
    setSectionForm({
      icon: section.icon || 'file-text',
      title: section.title || '',
      content: section.content || '',
      order: section.order !== undefined ? section.order : 1,
    });
    setIsModalOpen(true);
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    if (!sectionForm.title.trim() || !sectionForm.content.trim()) {
      alert('Please fill out both section title and content.');
      return;
    }

    setIsSavingSection(true);
    try {
      if (selectedSection) {
        const sectionId = selectedSection._id || selectedSection.id;
        await updatePolicySection(activeType, sectionId, sectionForm);
        showSuccess('Section updated successfully!');
      } else {
        await addPolicySection(activeType, sectionForm);
        showSuccess('Section added successfully!');
      }
      setIsModalOpen(false);
      setSelectedSection(null);
      fetchPolicy(activeType);
    } catch (err) {
      alert(err.message || 'Failed to save section.');
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleDeleteSection = async (section) => {
    const sectionId = section._id || section.id;
    if (!window.confirm(`Are you sure you want to delete "${section.title}"?`)) return;

    try {
      await deletePolicySection(activeType, sectionId);
      showSuccess('Section deleted.');
      fetchPolicy(activeType);
    } catch (err) {
      alert(err.message || 'Failed to delete section.');
    }
  };

  const SelectedFormIcon = getPolicyIcon(sectionForm.icon);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary-500" />
            Legal & Policy Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage Privacy Policy and Terms of Service contents with full CRUD control.
          </p>
        </div>

        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg"
            >
              <Check className="w-4 h-4" />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-px">
        {[
          { key: 'privacy-policy', label: 'Privacy Policy', icon: Eye },
          { key: 'terms-of-service', label: 'Terms of Service', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveType(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeType === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-500 bg-primary-500/5 rounded-t-xl'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Metadata Editor */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-neutral-800 dark:text-white font-display">
                Page Header Details
              </h2>
              <span className="text-xs text-neutral-400">
                Route: <code className="text-primary-500 font-mono">/{activeType}</code>
              </span>
            </div>

            <form onSubmit={handleSaveHeader} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                  Page Title
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  required
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                  Last Updated Date Text
                </label>
                <input
                  type="text"
                  value={lastUpdatedInput}
                  onChange={(e) => setLastUpdatedInput(e.target.value)}
                  placeholder="e.g. August 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSavingHeader}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isSavingHeader ? 'Saving...' : 'Save Header'}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Sections List */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-800 dark:text-white font-display">
                  Policy Sections ({policyData.sections ? policyData.sections.length : 0})
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Each section represents an article card with an icon, title, and descriptive text.
                </p>
              </div>

              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>

            {policyData.sections && policyData.sections.length > 0 ? (
              <div className="space-y-3">
                {policyData.sections.map((section, idx) => {
                  const IconComp = getPolicyIcon(section.icon);
                  return (
                    <div
                      key={section._id || section.id || idx}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-primary-500/40 transition-all"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500 shrink-0 mt-0.5">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                              Order: {section.order ?? idx + 1}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              icon: {section.icon || 'file-text'}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                            {section.title}
                          </h4>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line font-light">
                            {section.content}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => openEditModal(section)}
                          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                          title="Edit Section"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No sections found.</p>
                <p className="text-xs mt-1">Click "Add Section" to create your first article.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setSelectedSection(null);
              }}
              className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                    <SelectedFormIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-neutral-800 dark:text-white">
                    {selectedSection ? 'Edit Policy Section' : 'Add New Policy Section'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedSection(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSectionSubmit} className="space-y-4">
                {/* Icon Selector Grid */}
                <div>
                  <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                    {AVAILABLE_ICONS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = sectionForm.icon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSectionForm((prev) => ({ ...prev, icon: item.name }))}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-primary-500/40 hover:text-primary-500'
                          }`}
                          title={item.label}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate max-w-full">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-9">
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={sectionForm.title}
                      onChange={(e) => setSectionForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. 1. Information We Collect"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                      Order / Sort
                    </label>
                    <input
                      type="number"
                      value={sectionForm.order}
                      onChange={(e) => setSectionForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Section Content Description
                  </label>
                  <textarea
                    rows={5}
                    value={sectionForm.content}
                    onChange={(e) => setSectionForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Write detailed policy or terms clauses here..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y leading-relaxed font-light"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedSection(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSection}
                    className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingSection ? 'Saving...' : selectedSection ? 'Update Section' : 'Create Section'}
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

export default AdminPolicies;

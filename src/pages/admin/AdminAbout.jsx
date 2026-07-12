import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Eye,
  Calendar,
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Check,
  Award,
  Upload
} from 'lucide-react';
import {
  getAboutData,
  updateAboutCore,
  addTimelineItem,
  updateTimelineItem,
  deleteTimelineItem,
  addLeadershipMember,
  updateLeadershipMember,
  deleteLeadershipMember,
} from '../../services/aboutService';

// ---------------------------------------------------------------------------
// AdminAbout.jsx — /admin/about
//
// Full CRUD panel for managing business information (timeline, mission,
// vision, leadership team) shown on the public About page.
// ---------------------------------------------------------------------------
export const AdminAbout = () => {
  const [aboutData, setAboutData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Core Form State
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [stats, setStats] = useState({ founded: '', branchesCount: '', standard: '' });

  // Modals
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Timeline Form State
  const [timelineForm, setTimelineForm] = useState({ year: '', title: '', desc: '' });
  // Leadership Form State
  const [leaderForm, setLeaderForm] = useState({ name: '', role: '', image: '', bio: '' });

  const fileInputRef = useRef(null);

  const fetchAboutData = () => {
    setIsLoading(true);
    getAboutData().then((data) => {
      setAboutData(data);
      setMission(data.mission);
      setVision(data.vision);
      setStats(data.stats);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateAboutCore({ mission, vision, stats });
      showSuccess('Company profile saved successfully!');
    } catch (err) {
      alert('Failed to save profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Timeline Handlers
  const openAddTimeline = () => {
    setEditingIndex(null);
    setTimelineForm({ year: new Date().getFullYear().toString(), title: '', desc: '' });
    setIsTimelineModalOpen(true);
  };

  const openEditTimeline = (item, index) => {
    setEditingIndex(index);
    setTimelineForm({ ...item });
    setIsTimelineModalOpen(true);
  };

  const handleTimelineSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIndex !== null) {
        await updateTimelineItem(editingIndex, timelineForm);
      } else {
        await addTimelineItem(timelineForm);
      }
      setIsTimelineModalOpen(false);
      fetchAboutData();
      showSuccess('Timeline milestone saved!');
    } catch (err) {
      alert('Failed to save timeline milestone.');
    }
  };

  const handleDeleteTimeline = async (index) => {
    if (window.confirm('Are you sure you want to delete this timeline milestone?')) {
      try {
        await deleteTimelineItem(index);
        fetchAboutData();
        showSuccess('Timeline milestone deleted.');
      } catch (err) {
        alert('Failed to delete timeline milestone.');
      }
    }
  };

  // Leadership Handlers
  const openAddLeader = () => {
    setEditingIndex(null);
    setLeaderForm({
      name: '',
      role: '',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80',
      bio: '',
    });
    setIsLeaderModalOpen(true);
  };

  const openEditLeader = (member, index) => {
    setEditingIndex(index);
    setLeaderForm({ ...member });
    setIsLeaderModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate File Type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, JPG, or PNG).');
      return;
    }

    // Convert file to Base64 (or append to FormData if your backend prefers raw files)
    const reader = new FileReader();
    reader.onloadend = () => {
      setLeaderForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleLeaderSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIndex !== null) {
        await updateLeadershipMember(editingIndex, leaderForm);
      } else {
        await addLeadershipMember(leaderForm);
      }
      setIsLeaderModalOpen(false);
      fetchAboutData();
      showSuccess('Team member saved!');
    } catch (err) {
      alert('Failed to save team member.');
    }
  };

  const handleDeleteLeader = async (index) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      try {
        await deleteLeadershipMember(index);
        fetchAboutData();
        showSuccess('Team member deleted.');
      } catch (err) {
        alert('Failed to delete team member.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            About Info Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Control the founding story, mission, vision, statistics, and team members.
          </p>
        </div>

        {/* Success Alert toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-xl shadow-lg"
            >
              <Check className="w-4 h-4" />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tabs Menu */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'timeline'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('leadership')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'leadership'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          Leadership Team
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {/* Tab 1: Company Profile (Mission, Vision, Stats) */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 shadow-sm"
          >
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                    <Target className="w-4 h-4 text-primary-500" />
                    Mission Statement
                  </label>
                  <textarea
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                    rows="4"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                    <Eye className="w-4 h-4 text-primary-500" />
                    Vision Statement
                  </label>
                  <textarea
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    rows="4"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                  Quick Business Statistics
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Year Founded
                    </label>
                    <input
                      type="text"
                      value={stats.founded}
                      onChange={(e) => setStats((prev) => ({ ...prev, founded: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Branches Count
                    </label>
                    <input
                      type="text"
                      value={stats.branchesCount}
                      onChange={(e) => setStats((prev) => ({ ...prev, branchesCount: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Standard Scale
                    </label>
                    <input
                      type="text"
                      value={stats.standard}
                      onChange={(e) => setStats((prev) => ({ ...prev, standard: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Profile details'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Tab 2: Timeline Milestones */}
        {activeTab === 'timeline' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-end">
              <button
                onClick={openAddTimeline}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </button>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left bg-neutral-50/50 dark:bg-neutral-900/50">
                      <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400 w-24">Year</th>
                      <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400 w-64">Milestone Title</th>
                      <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400">Description</th>
                      <th className="px-5 py-3 font-semibold text-neutral-500 dark:text-neutral-400 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aboutData.timeline.map((item, index) => (
                      <tr
                        key={item.year + index}
                        className="border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-display font-bold text-primary-500">
                          {item.year}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-neutral-800 dark:text-neutral-100">
                          {item.title}
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400 font-light max-w-md truncate">
                          {item.desc}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditTimeline(item, index)}
                              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-primary-500 transition-all"
                              title="Edit Milestone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTimeline(index)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                              title="Delete Milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Leadership Team */}
        {activeTab === 'leadership' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-end">
              <button
                onClick={openAddLeader}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {aboutData.leadership.map((member, index) => (
                <div
                  key={member.name + index}
                  className="group bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditLeader(member, index)}
                          className="p-1.5 rounded-lg bg-white/90 text-neutral-700 hover:text-primary-500 hover:bg-white shadow-sm transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLeader(index)}
                          className="p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-600 shadow-sm transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">
                        {member.name}
                      </h4>
                      <span className="text-xs text-primary-500 font-bold uppercase tracking-wider block mt-0.5 mb-2">
                        {member.role}
                      </span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light leading-relaxed line-clamp-3">
                        {member.bio}
                      </p>
                    </div>
                  </div>
                  
                  {/* Mobile Actions */}
                  <div className="flex gap-2 p-4 pt-0 border-t border-neutral-50 dark:border-neutral-800/50 mt-2 md:hidden">
                    <button
                      onClick={() => openEditLeader(member, index)}
                      className="flex items-center gap-1.5 flex-1 justify-center py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-600 dark:text-neutral-300"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLeader(index)}
                      className="flex items-center gap-1.5 flex-1 justify-center py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Timeline Modal */}
      <AnimatePresence>
        {isTimelineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTimelineModalOpen(false)}
              className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
                <h3 className="text-lg font-bold font-display text-neutral-800 dark:text-white">
                  {editingIndex !== null ? 'Edit Milestone' : 'Add Milestone'}
                </h3>
                <button onClick={() => setIsTimelineModalOpen(false)}>
                  <X className="w-5 h-5 text-neutral-400 hover:text-neutral-600" />
                </button>
              </div>

              <form onSubmit={handleTimelineSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Year
                  </label>
                  <input
                    type="text"
                    value={timelineForm.year}
                    onChange={(e) => setTimelineForm((prev) => ({ ...prev, year: e.target.value }))}
                    placeholder="e.g. 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Milestone Title
                  </label>
                  <input
                    type="text"
                    value={timelineForm.title}
                    onChange={(e) => setTimelineForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Six Branches, One Standard"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={timelineForm.desc}
                    onChange={(e) => setTimelineForm((prev) => ({ ...prev, desc: e.target.value }))}
                    placeholder="Provide details about this milestone..."
                    rows="3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsTimelineModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all"
                  >
                    Save Milestone
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leadership Modal */}
      <AnimatePresence>
        {isLeaderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLeaderModalOpen(false)}
              className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
                <h3 className="text-lg font-bold font-display text-neutral-800 dark:text-white">
                  {editingIndex !== null ? 'Edit Team Member' : 'Add Team Member'}
                </h3>
                <button onClick={() => setIsLeaderModalOpen(false)}>
                  <X className="w-5 h-5 text-neutral-400 hover:text-neutral-600" />
                </button>
              </div>

              <form onSubmit={handleLeaderSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={leaderForm.name}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={leaderForm.role}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Chief Executive Officer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Photo Image
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg, image/jpg, image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <div className="flex items-center gap-4 mt-1">
                    {leaderForm.image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                        <img src={leaderForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-500 text-neutral-600 dark:text-neutral-300 font-medium text-xs transition-all w-full justify-center bg-neutral-50/50 dark:bg-neutral-900/50"
                    >
                      <Upload className="w-4 h-4 text-neutral-400" />
                      Select JPEG, JPG, or PNG
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Short Bio
                  </label>
                  <textarea
                    value={leaderForm.bio}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Describe their experience and contributions..."
                    rows="3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsLeaderModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all"
                  >
                    Save Member
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

export default AdminAbout;
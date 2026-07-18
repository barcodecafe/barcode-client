import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Eye,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Check,
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

export const AdminAbout = () => {
  /* 
    CHANGES 1: Initial state-e empty object/array define kora hoyeche, 
    jate component load hobar shomoy data map short-circuit ba blank error na dey.
  */
  const [aboutData, setAboutData] = useState({ timeline: [], leadership: [], stats: {} });
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Core Form State
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [stats, setStats] = useState({ founded: '', branchesCount: '', standard: '' });

  // Modals & Tracking
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  
  /* 
    CHANGES 2: (CRITICAL FIX) 
    Apnar ager code-e shudhu 'editingIndex' chilo, jeta problem korchilo. 
    Ekhon amra 'selectedItem' state niyechi. Eta index er bodole direct database object 
    hold korbe, jate dynamic unique ID track kora jay.
  */
  const [selectedItem, setSelectedItem] = useState(null); 

  // Timeline Form State
  const [timelineForm, setTimelineForm] = useState({ year: '', title: '', desc: '' });
  // Leadership Form State
  const [leaderForm, setLeaderForm] = useState({ name: '', role: '', image: '', bio: '' });

  const fileInputRef = useRef(null);

  const fetchAboutData = () => {
    setIsLoading(true);
    getAboutData()
      .then((data) => {
        if (data) {
          setAboutData(data);
          setMission(data.mission || '');
          setVision(data.vision || '');
          setStats(data.stats || { founded: '', branchesCount: '', standard: '' });
        }
      })
      .catch((err) => alert('Failed to fetch data from backend.'))
      .finally(() => setIsLoading(false));
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

  // ==========================================
  // Timeline Handlers
  // ==========================================
  const openAddTimeline = () => {
    setSelectedItem(null); // Add korar shomoy selected tracking null kore dewa hoyeche
    setTimelineForm({ year: new Date().getFullYear().toString(), title: '', desc: '' });
    setIsTimelineModalOpen(true);
  };

  const openEditTimeline = (item, index) => {
    /* 
      CHANGES 3: Edit mode open korar shomoy item er property layout text check korbe.
      Jodi backend data table-e specific '_id' ba 'id' key thake, sheta target korbe, 
      na thakle safer side fallback hisebe 'targetIndex' store korbe.
    */
    setSelectedItem({ ...item, targetIndex: index });
    setTimelineForm({ year: item.year || '', title: item.title || '', desc: item.desc || '' });
    setIsTimelineModalOpen(true);
  };

  const handleTimelineSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        /* 
          CHANGES 4: (UPDATE FIX) 
          Direct database _id ba id check korche. Backend validation standard 
          onujayi absolute query parameter pathiye row targeted route trigger korbe.
        */
        const targetId = selectedItem._id || selectedItem.id || selectedItem.targetIndex;
        await updateTimelineItem(targetId, timelineForm);
      } else {
        await addTimelineItem(timelineForm);
      }
      
      /* CHANGES 5: Action submit shesh hole Modal close, state reset logic cleanup kora hoyeche */
      setIsTimelineModalOpen(false);
      setSelectedItem(null);
      fetchAboutData();
      showSuccess('Timeline milestone saved!');
    } catch (err) {
      alert('Failed to save timeline milestone.');
    }
  };

  const handleDeleteTimeline = async (item, index) => {
    if (window.confirm('Are you sure you want to delete this timeline milestone?')) {
      try {
        /* 
          CHANGES 6: (DELETE FIX) 
          Ager code-e shudhu array index pass hoto, jeta dynamic state render breakdown korto.
          Ekhon proper DB dynamic unique target identifier search kore service-e execution dibe.
        */
        const targetId = item._id || item.id || index;
        await deleteTimelineItem(targetId);
        fetchAboutData();
        showSuccess('Timeline milestone deleted.');
      } catch (err) {
        alert('Failed to delete timeline milestone.');
      }
    }
  };

  // ==========================================
  // Leadership Handlers
  // ==========================================
  const openAddLeader = () => {
    setSelectedItem(null);
    setLeaderForm({
      name: '',
      role: '',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80',
      bio: '',
    });
    setIsLeaderModalOpen(true);
  };

  const openEditLeader = (member, index) => {
    /* CHANGES 7: Leadership component tracking system updated matching data identifiers */
    setSelectedItem({ ...member, targetIndex: index });
    setLeaderForm({ 
      name: member.name || '', 
      role: member.role || '', 
      image: member.image || '', 
      bio: member.bio || '' 
    });
    setIsLeaderModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, JPG, or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLeaderForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleLeaderSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        /* CHANGES 8: Team member update target query selector implementation */
        const targetId = selectedItem._id || selectedItem.id || selectedItem.targetIndex;
        await updateLeadershipMember(targetId, leaderForm);
      } else {
        await addLeadershipMember(leaderForm);
      }
      setIsLeaderModalOpen(false);
      setSelectedItem(null);
      fetchAboutData();
      showSuccess('Team member saved!');
    } catch (err) {
      alert('Failed to save team member.');
    }
  };

  const handleDeleteLeader = async (member, index) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      try {
        /* CHANGES 9: Leadership dynamic index/ID absolute targeting for safe database operations */
        const targetId = member._id || member.id || index;
        await deleteLeadershipMember(targetId);
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
        {['profile', 'timeline', 'leadership'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all capitalize ${
              activeTab === tab
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab === 'profile' ? 'Company Profile' : tab === 'leadership' ? 'Leadership Team' : tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
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

              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                  Quick Business Statistics
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['founded', 'branchesCount', 'standard'].map((field) => (
                    <div key={field}>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1.5 capitalize">
                        {field === 'branchesCount' ? 'Branches Count' : field === 'standard' ? 'Standard Scale' : field}
                      </label>
                      <input
                        type="text"
                        value={stats[field] || ''}
                        onChange={(e) => setStats((prev) => ({ ...prev, [field]: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

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
                    {aboutData.timeline && aboutData.timeline.map((item, index) => (
                      /* 
                        CHANGES 10: JSX Table render key calculation algorithm 
                        index map change kore explicit runtime dynamic key-e transform kora hoyeche.
                      */
                      <tr
                        key={item._id || item.id || index}
                        className="border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-display font-bold text-primary-500">{item.year}</td>
                        <td className="px-5 py-3.5 font-semibold text-neutral-800 dark:text-neutral-100">{item.title}</td>
                        <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400 font-light max-w-md truncate">{item.desc}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditTimeline(item, index)}
                              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-primary-500 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTimeline(item, index)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
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
              {aboutData.leadership && aboutData.leadership.map((member, index) => (
                <div
                  key={member._id || member.id || index}
                  className="group bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditLeader(member, index)}
                          className="p-1.5 rounded-lg bg-white/90 text-neutral-700 hover:text-primary-500 hover:bg-white shadow-sm transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLeader(member, index)}
                          className="p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-600 shadow-sm transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">{member.name}</h4>
                      <span className="text-xs text-primary-500 font-bold uppercase tracking-wider block mt-0.5 mb-2">{member.role}</span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light leading-relaxed line-clamp-3">{member.bio}</p>
                    </div>
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
              /* CHANGES 11: Outside modal space click/cancel korle state mapping default empty resetting handle korbe */
              onClick={() => { setIsTimelineModalOpen(false); setSelectedItem(null); }}
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
                  {selectedItem ? 'Edit Milestone' : 'Add Milestone'}
                </h3>
                <button onClick={() => { setIsTimelineModalOpen(false); setSelectedItem(null); }}>
                  <X className="w-5 h-5 text-neutral-400 hover:text-neutral-600" />
                </button>
              </div>

              <form onSubmit={handleTimelineSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Year</label>
                  <input
                    type="text"
                    value={timelineForm.year}
                    onChange={(e) => setTimelineForm((prev) => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Milestone Title</label>
                  <input
                    type="text"
                    value={timelineForm.title}
                    onChange={(e) => setTimelineForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    value={timelineForm.desc}
                    onChange={(e) => setTimelineForm((prev) => ({ ...prev, desc: e.target.value }))}
                    rows="3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsTimelineModalOpen(false); setSelectedItem(null); }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary-500 text-white font-semibold text-sm shadow-md transition-all">
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
              onClick={() => { setIsLeaderModalOpen(false); setSelectedItem(null); }}
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
                  {selectedItem ? 'Edit Team Member' : 'Add Team Member'}
                </h3>
                <button onClick={() => { setIsLeaderModalOpen(false); setSelectedItem(null); }}>
                  <X className="w-5 h-5 text-neutral-400 hover:text-neutral-600" />
                </button>
              </div>

              <form onSubmit={handleLeaderSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={leaderForm.name}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Role / Title</label>
                  <input
                    type="text"
                    value={leaderForm.role}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Photo Image</label>
                  <input type="file" ref={fileInputRef} accept="image/jpeg, image/jpg, image/png" onChange={handleImageUpload} className="hidden" />
                  <div className="flex items-center gap-4 mt-1">
                    {leaderForm.image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border flex-shrink-0">
                        <img src={leaderForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-neutral-600 dark:text-neutral-300 font-medium text-xs transition-all w-full justify-center bg-neutral-50/50"
                    >
                      Upload Image File
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Short Bio</label>
                  <textarea
                    value={leaderForm.bio}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, bio: e.target.value }))}
                    rows="3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsLeaderModalOpen(false); setSelectedItem(null); }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary-500 text-white font-semibold text-sm shadow-md transition-all">
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
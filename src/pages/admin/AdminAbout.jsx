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
  Upload,
  Sparkles,
  BookOpen,
  Users,
  Image as ImageIcon,
  ShieldCheck,
  Heart,
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
  const [aboutData, setAboutData] = useState({ timeline: [], leadership: [], stats: {} });
  const [activeTab, setActiveTab] = useState('hero');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Hero Section Form State
  const [heroForm, setHeroForm] = useState({
    heroBadge: '',
    heroTitle: '',
    heroHighlightText: '',
    heroDescription: '',
    heroImageMain: '',
    heroImageSecondary1: '',
    heroImageSecondary2: '',
    heroNetworkBadgeTitle: '',
    heroNetworkBadgeSubtitle: '',
    heroStat1Value: '',
    heroStat1Label: '',
    heroStat2Value: '',
    heroStat2Label: '',
    heroStat3Value: '',
    heroStat3Label: '',
  });

  // 2. Story Section Form State
  const [storyForm, setStoryForm] = useState({
    storyBadge: '',
    storyTitle: '',
    storyDescription: '',
    storyImage: '',
    storyImageCaption: '',
  });

  // 3. Mission, Vision & Core Values Form State
  const [missionForm, setMissionForm] = useState({
    missionTitle: '',
    mission: '',
    visionTitle: '',
    vision: '',
    valuesTitle: 'Core Values',
    coreValues: [
      { title: 'Guest First', desc: 'Heartfelt service & uncompromised customer delight' },
      { title: 'Integrity', desc: 'Transparency, honesty, accountability & high ethics' },
      { title: 'Excellence', desc: 'Uncompromising food safety, hygiene & culinary quality' },
      { title: 'Respect', desc: 'Deep care, dignity & value for guests, team & community' },
      { title: 'Teamwork', desc: 'Collaborative passion, synergy & unified teamwork' },
      { title: 'Innovation', desc: 'Embracing modern food trends & culinary creativity' },
      { title: 'Accountability', desc: 'Taking full ownership and responsibility in service' },
      { title: 'Sustainability', desc: 'Responsible sourcing, waste care & eco-conscious growth' },
    ],
    stats: {
      founded: '',
      foundedLabel: 'Founded',
      branchesCount: '',
      branchesCountLabel: 'Branches',
      standard: '',
      standardLabel: 'Standard',
    },
  });

  // 4. Leadership Section Header State
  const [leadershipHeaderForm, setLeadershipHeaderForm] = useState({
    leadershipBadge: '',
    leadershipTitle: '',
    leadershipSubtitle: '',
  });

  // Modals & Tracking
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Sub-items Form State
  const [timelineForm, setTimelineForm] = useState({ year: '', title: '', desc: '' });
  const [leaderForm, setLeaderForm] = useState({ name: '', role: '', image: '', bio: '' });

  const leaderFileRef = useRef(null);

  const fetchAboutData = () => {
    setIsLoading(true);
    getAboutData()
      .then((data) => {
        if (data) {
          setAboutData(data);

          setHeroForm({
            heroBadge: data.heroBadge || 'About Barcode Group',
            heroTitle: data.heroTitle || 'Good Food, \nRun Like a Promise',
            heroHighlightText: data.heroHighlightText || 'Promise',
            heroDescription:
              data.heroDescription ||
              'From a single kitchen to six thriving branches, Barcode has stayed true to one core philosophy: every dish should meet the exact same culinary standard. Every single time. Everywhere.',
            heroImageMain: data.heroImageMain || '',
            heroImageSecondary1: data.heroImageSecondary1 || '',
            heroImageSecondary2: data.heroImageSecondary2 || '',
            heroNetworkBadgeTitle: data.heroNetworkBadgeTitle || 'Group Network',
            heroNetworkBadgeSubtitle: data.heroNetworkBadgeSubtitle || 'Barcode Hospitality',
            heroStat1Value: data.heroStat1Value || '6',
            heroStat1Label: data.heroStat1Label || 'Active Branches',
            heroStat2Value: data.heroStat2Value || '100%',
            heroStat2Label: data.heroStat2Label || 'Consistency',
            heroStat3Value: data.heroStat3Value || '1',
            heroStat3Label: data.heroStat3Label || 'Uncompromising Taste',
          });

          setStoryForm({
            storyBadge: data.storyBadge || 'Our Story',
            storyTitle: data.storyTitle || 'How We Got Here',
            storyDescription:
              data.storyDescription ||
              'Barcode started as one restaurant with a clear point of view: dining out should feel considered, not complicated. That same standard now travels across every branch we open.',
            storyImage: data.storyImage || '',
            storyImageCaption: data.storyImageCaption || 'Inside a Barcode restaurant branch',
          });

          setMissionForm({
            missionTitle: data.missionTitle || 'Our Mission',
            mission:
              data.mission ||
              'At Barcode Restaurant Group, we are committed to:\n• Delivering unforgettable dining experiences through outstanding food, exceptional service, and a welcoming atmosphere.\n• Ensuring uncompromising standards of food safety, hygiene, quality, and consistency across every outlet.\n• Driving innovation by embracing modern food trends, technology, and operational excellence.\n• Conducting business with integrity, transparency, accountability, and respect for all.',
            visionTitle: data.visionTitle || 'Our Vision',
            vision:
              data.vision ||
              "To redefine hospitality by creating exceptional dining destinations where food excellence, heartfelt service and innovation inspire enduring memories while becoming Bangladesh's most trusted and admired restaurant group.",
            valuesTitle: data.valuesTitle || 'Core Values',
            coreValues: Array.isArray(data.coreValues) && data.coreValues.length > 0
              ? data.coreValues
              : [
                  { title: 'Guest First', desc: 'Heartfelt service & uncompromised customer delight' },
                  { title: 'Integrity', desc: 'Transparency, honesty, accountability & high ethics' },
                  { title: 'Excellence', desc: 'Uncompromising food safety, hygiene & culinary quality' },
                  { title: 'Respect', desc: 'Deep care, dignity & value for guests, team & community' },
                  { title: 'Teamwork', desc: 'Collaborative passion, synergy & unified teamwork' },
                  { title: 'Innovation', desc: 'Embracing modern food trends & culinary creativity' },
                  { title: 'Accountability', desc: 'Taking full ownership and responsibility in service' },
                  { title: 'Sustainability', desc: 'Responsible sourcing, waste care & eco-conscious growth' },
                ],
            stats: {
              founded: data.stats?.founded || '2022',
              foundedLabel: data.stats?.foundedLabel || 'Founded',
              branchesCount: data.stats?.branchesCount || '6',
              branchesCountLabel: data.stats?.branchesCountLabel || 'Branches',
              standard: data.stats?.standard || '100%',
              standardLabel: data.stats?.standardLabel || 'Standard',
            },
          });

          setLeadershipHeaderForm({
            leadershipBadge: data.leadershipBadge || 'Leadership',
            leadershipTitle: data.leadershipTitle || 'Owner & Executive Team',
            leadershipSubtitle:
              data.leadershipSubtitle ||
              'The people responsible for keeping every branch on the same standard.',
          });
        }
      })
      .catch((err) => console.error('Failed to fetch data from backend:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Helper for single image file reading
  const handleGenericImageUpload = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Save Handlers
  const handleSaveHero = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateAboutCore(heroForm);
      showSuccess('Hero & Banner information saved successfully!');
      fetchAboutData();
    } catch (err) {
      alert('Failed to save hero details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStory = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateAboutCore(storyForm);
      showSuccess('Story & Narrative details saved successfully!');
      fetchAboutData();
    } catch (err) {
      alert('Failed to save story details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMission = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateAboutCore(missionForm);
      showSuccess('Mission, Vision, Core Values and Statistics saved successfully!');
      fetchAboutData();
    } catch (err) {
      alert('Failed to save mission, vision & core values details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCoreValue = () => {
    setMissionForm((prev) => ({
      ...prev,
      coreValues: [
        ...(prev.coreValues || []),
        { title: '', desc: '' },
      ],
    }));
  };

  const handleUpdateCoreValue = (index, field, value) => {
    setMissionForm((prev) => {
      const updated = [...(prev.coreValues || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, coreValues: updated };
    });
  };

  const handleRemoveCoreValue = (index) => {
    setMissionForm((prev) => ({
      ...prev,
      coreValues: (prev.coreValues || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveLeadershipHeader = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateAboutCore(leadershipHeaderForm);
      showSuccess('Leadership header settings saved!');
      fetchAboutData();
    } catch (err) {
      alert('Failed to save leadership header.');
    } finally {
      setIsSaving(false);
    }
  };

  // Timeline Handlers
  const openAddTimeline = () => {
    setSelectedItem(null);
    setTimelineForm({ year: new Date().getFullYear().toString(), title: '', desc: '' });
    setIsTimelineModalOpen(true);
  };

  const openEditTimeline = (item, index) => {
    setSelectedItem({ ...item, targetIndex: index });
    setTimelineForm({ year: item.year || '', title: item.title || '', desc: item.desc || '' });
    setIsTimelineModalOpen(true);
  };

  const handleTimelineSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        const targetId = selectedItem._id || selectedItem.id || selectedItem.targetIndex;
        await updateTimelineItem(targetId, timelineForm);
      } else {
        await addTimelineItem(timelineForm);
      }
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
        const targetId = item._id || item.id || index;
        await deleteTimelineItem(targetId);
        fetchAboutData();
        showSuccess('Timeline milestone deleted.');
      } catch (err) {
        alert('Failed to delete timeline milestone.');
      }
    }
  };

  // Leadership Handlers
  const openAddLeader = () => {
    setSelectedItem(null);
    setLeaderForm({
      name: '',
      role: '',
      image: '',
      bio: '',
    });
    setIsLeaderModalOpen(true);
  };

  const openEditLeader = (member, index) => {
    setSelectedItem({ ...member, targetIndex: index });
    setLeaderForm({
      name: member.name || '',
      role: member.role || '',
      image: member.image || '',
      bio: member.bio || '',
    });
    setIsLeaderModalOpen(true);
  };

  const handleLeaderSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
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

  const tabs = [
    { id: 'hero', label: 'Hero & Intro Banner', icon: Sparkles },
    { id: 'story', label: 'Our Story & Timeline', icon: BookOpen },
    { id: 'mission', label: 'Mission, Vision & Stats', icon: Target },
    { id: 'leadership', label: 'Leadership & Team', icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            About Page Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Fully dynamic content control for Hero Banner, Story, Timeline, Mission & Leadership.
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
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-px overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================
          TAB 1: HERO & INTRO BANNER
      =================================================================== */}
      {activeTab === 'hero' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <form onSubmit={handleSaveHero} className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">
                  Hero Header & Brand Introduction
                </h3>
                <p className="text-xs text-neutral-400">
                  Control the main headline, intro text, trust metrics and gallery photos.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Hero Changes'}
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Top Pill Badge
                </label>
                <input
                  type="text"
                  value={heroForm.heroBadge}
                  onChange={(e) => setHeroForm({ ...heroForm, heroBadge: e.target.value })}
                  placeholder="e.g. About Barcode Group"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Highlighted Word / Accent
                </label>
                <input
                  type="text"
                  value={heroForm.heroHighlightText}
                  onChange={(e) => setHeroForm({ ...heroForm, heroHighlightText: e.target.value })}
                  placeholder="e.g. Promise"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold text-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Main Headline (Title)
                </label>
                <input
                  type="text"
                  value={heroForm.heroTitle}
                  onChange={(e) => setHeroForm({ ...heroForm, heroTitle: e.target.value })}
                  placeholder="e.g. Good Food, Run Like a Promise"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Intro Story Description
                </label>
                <textarea
                  rows="3"
                  value={heroForm.heroDescription}
                  onChange={(e) => setHeroForm({ ...heroForm, heroDescription: e.target.value })}
                  placeholder="Write a welcoming summary of the brand..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 leading-relaxed"
                  required
                />
              </div>
            </div>

            {/* Quick Trust Metric Signals */}
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Hero Trust Metrics Strip
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400">Metric 1</span>
                  <input
                    type="text"
                    placeholder="Value (e.g. 6)"
                    value={heroForm.heroStat1Value}
                    onChange={(e) => setHeroForm({ ...heroForm, heroStat1Value: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Active Branches)"
                    value={heroForm.heroStat1Label}
                    onChange={(e) => setHeroForm({ ...heroForm, heroStat1Label: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400">Metric 2</span>
                  <input
                    type="text"
                    placeholder="Value (e.g. 100%)"
                    value={heroForm.heroStat2Value}
                    onChange={(e) => setHeroForm({ ...heroForm, heroStat2Value: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Consistency)"
                    value={heroForm.heroStat2Label}
                    onChange={(e) => setHeroForm({ ...heroForm, heroStat2Label: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400">Metric 3</span>
                  <input
                    type="text"
                    placeholder="Value (e.g. 1)"
                    value={heroForm.heroStat3Value}
                    onChange={(e) => setHeroForm({ ...heroForm, heroStat3Value: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Uncompromising Taste)"
                    value={heroForm.heroStat3Label}
                    onChange={(e) => setHeroForm({ ...heroForm, heroStat3Label: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  />
                </div>
              </div>
            </div>

            {/* Floating Network Badge */}
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Floating Group Badge
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Badge Title (e.g. Group Network)"
                  value={heroForm.heroNetworkBadgeTitle}
                  onChange={(e) => setHeroForm({ ...heroForm, heroNetworkBadgeTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs"
                />
                <input
                  type="text"
                  placeholder="Badge Subtitle (e.g. Barcode Hospitality)"
                  value={heroForm.heroNetworkBadgeSubtitle}
                  onChange={(e) => setHeroForm({ ...heroForm, heroNetworkBadgeSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-semibold"
                />
              </div>
            </div>

            {/* 3 Hero Gallery Image Uploaders */}
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Hero Gallery Photography
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Upload 3 high-quality pictures for the interactive culinary grid on the About page.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Main Large Image */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      1. Main Signature Dish (Large)
                    </span>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 relative group">
                      {heroForm.heroImageMain ? (
                        <img
                          src={heroForm.heroImageMain}
                          alt="Main Hero"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                          <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[10px]">No image selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs text-center cursor-pointer transition-colors">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleGenericImageUpload(e.target.files?.[0], (url) =>
                            setHeroForm((prev) => ({ ...prev, heroImageMain: url }))
                          )
                        }
                      />
                    </label>
                    {heroForm.heroImageMain && (
                      <button
                        type="button"
                        onClick={() => setHeroForm((prev) => ({ ...prev, heroImageMain: '' }))}
                        className="p-2 text-neutral-400 hover:text-red-500 border border-neutral-200 dark:border-neutral-800 rounded-lg cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Secondary Image 1 */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      2. Restaurant Ambiance Photo
                    </span>
                    <div className="aspect-square rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 relative group">
                      {heroForm.heroImageSecondary1 ? (
                        <img
                          src={heroForm.heroImageSecondary1}
                          alt="Secondary 1"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                          <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[10px]">No image selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs text-center cursor-pointer transition-colors">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleGenericImageUpload(e.target.files?.[0], (url) =>
                            setHeroForm((prev) => ({ ...prev, heroImageSecondary1: url }))
                          )
                        }
                      />
                    </label>
                    {heroForm.heroImageSecondary1 && (
                      <button
                        type="button"
                        onClick={() => setHeroForm((prev) => ({ ...prev, heroImageSecondary1: '' }))}
                        className="p-2 text-neutral-400 hover:text-red-500 border border-neutral-200 dark:border-neutral-800 rounded-lg cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Secondary Image 2 */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      3. Chef Plating / Kitchen Photo
                    </span>
                    <div className="aspect-square rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 relative group">
                      {heroForm.heroImageSecondary2 ? (
                        <img
                          src={heroForm.heroImageSecondary2}
                          alt="Secondary 2"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                          <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[10px]">No image selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs text-center cursor-pointer transition-colors">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleGenericImageUpload(e.target.files?.[0], (url) =>
                            setHeroForm((prev) => ({ ...prev, heroImageSecondary2: url }))
                          )
                        }
                      />
                    </label>
                    {heroForm.heroImageSecondary2 && (
                      <button
                        type="button"
                        onClick={() => setHeroForm((prev) => ({ ...prev, heroImageSecondary2: '' }))}
                        className="p-2 text-neutral-400 hover:text-red-500 border border-neutral-200 dark:border-neutral-800 rounded-lg cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* ===================================================================
          TAB 2: OUR STORY & TIMELINE
      =================================================================== */}
      {activeTab === 'story' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Story Narrative & Featured Image */}
          <form onSubmit={handleSaveStory} className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">
                  Our Story & Narrative
                </h3>
                <p className="text-xs text-neutral-400">
                  Update the narrative title, story paragraph, and primary story photography.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Story Narrative'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Text Fields */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Section Badge
                  </label>
                  <input
                    type="text"
                    value={storyForm.storyBadge}
                    onChange={(e) => setStoryForm({ ...storyForm, storyBadge: e.target.value })}
                    placeholder="e.g. Our Story"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Story Title
                  </label>
                  <input
                    type="text"
                    value={storyForm.storyTitle}
                    onChange={(e) => setStoryForm({ ...storyForm, storyTitle: e.target.value })}
                    placeholder="e.g. How We Got Here"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Story Full Description
                  </label>
                  <textarea
                    rows="5"
                    value={storyForm.storyDescription}
                    onChange={(e) => setStoryForm({ ...storyForm, storyDescription: e.target.value })}
                    placeholder="Tell your brand's founding background..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Photo Caption Text
                  </label>
                  <input
                    type="text"
                    value={storyForm.storyImageCaption}
                    onChange={(e) => setStoryForm({ ...storyForm, storyImageCaption: e.target.value })}
                    placeholder="e.g. Inside a Barcode restaurant branch"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs"
                  />
                </div>
              </div>

              {/* Story Photo */}
              <div className="lg:col-span-5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                  Story Featured Branch Photography
                </span>
                <div className="aspect-[4/5] rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 relative">
                  {storyForm.storyImage ? (
                    <img
                      src={storyForm.storyImage}
                      alt="Story Featured"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                      <ImageIcon className="w-10 h-10 mb-1 opacity-50" />
                      <span className="text-xs">No story photo selected</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs text-center cursor-pointer transition-colors shadow-xs">
                    Upload Story Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleGenericImageUpload(e.target.files?.[0], (url) =>
                          setStoryForm((prev) => ({ ...prev, storyImage: url }))
                        )
                      }
                    />
                  </label>
                  {storyForm.storyImage && (
                    <button
                      type="button"
                      onClick={() => setStoryForm((prev) => ({ ...prev, storyImage: '' }))}
                      className="p-2 text-neutral-400 hover:text-red-500 border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Timeline Milestones Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">
                  Journey Timeline Milestones
                </h3>
                <p className="text-xs text-neutral-400">
                  Chronological milestones displayed on the About page.
                </p>
              </div>
              <button
                onClick={openAddTimeline}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
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
                    {aboutData.timeline && aboutData.timeline.length > 0 ? (
                      aboutData.timeline.map((item, index) => (
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
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-primary-500 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTimeline(item, index)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-5 py-8 text-center text-neutral-400 text-xs">
                          No milestones added yet. Click "+ Add Milestone" to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===================================================================
          TAB 3: MISSION, VISION & STATS
      =================================================================== */}
      {activeTab === 'mission' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <form onSubmit={handleSaveMission} className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">
                  Mission, Vision &amp; Organization Statistics
                </h3>
                <p className="text-xs text-neutral-400">
                  Update the company mission statement, long-term vision, and official stats.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Statements & Stats'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mission */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500">
                    <Target className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={missionForm.missionTitle}
                    onChange={(e) => setMissionForm({ ...missionForm, missionTitle: e.target.value })}
                    placeholder="Mission Title (e.g. Our Mission)"
                    className="font-display font-bold text-sm bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-1 focus:outline-none focus:border-primary-500 w-full"
                  />
                </div>
                <textarea
                  value={missionForm.mission}
                  onChange={(e) => setMissionForm({ ...missionForm, mission: e.target.value })}
                  rows="4"
                  placeholder="Enter the core company mission statement..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 leading-relaxed"
                  required
                />
              </div>

              {/* Vision */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500">
                    <Eye className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={missionForm.visionTitle}
                    onChange={(e) => setMissionForm({ ...missionForm, visionTitle: e.target.value })}
                    placeholder="Vision Title (e.g. Our Vision)"
                    className="font-display font-bold text-sm bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-1 focus:outline-none focus:border-primary-500 w-full"
                  />
                </div>
                <textarea
                  value={missionForm.vision}
                  onChange={(e) => setMissionForm({ ...missionForm, vision: e.target.value })}
                  rows="4"
                  placeholder="Enter the long-term vision statement..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 leading-relaxed"
                  required
                />
              </div>
            </div>

            {/* Core Values Section */}
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={missionForm.valuesTitle || 'Core Values'}
                      onChange={(e) => setMissionForm({ ...missionForm, valuesTitle: e.target.value })}
                      placeholder="Core Values Title"
                      className="font-display font-bold text-sm bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-0.5 focus:outline-none focus:border-primary-500"
                    />
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Key company pillars &amp; standards displayed on the About page.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCoreValue}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500 text-primary-600 hover:text-white dark:text-primary-400 dark:hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Core Value
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(missionForm.coreValues || []).map((val, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 relative group space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={val.title || ''}
                          onChange={(e) => handleUpdateCoreValue(idx, 'title', e.target.value)}
                          placeholder={`Value #${idx + 1} Title (e.g. Guest First)`}
                          className="w-full font-bold text-xs sm:text-sm bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-1 focus:outline-none focus:border-primary-500 text-neutral-800 dark:text-neutral-100"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoreValue(idx)}
                        className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                        title="Delete value"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={val.desc || ''}
                      onChange={(e) => handleUpdateCoreValue(idx, 'desc', e.target.value)}
                      placeholder="Short description / guiding principle..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 leading-snug"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
              <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Official Business Statistics Bar
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                {/* Founded */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    Founded Year &amp; Label
                  </label>
                  <input
                    type="text"
                    value={missionForm.stats?.founded || ''}
                    onChange={(e) =>
                      setMissionForm({
                        ...missionForm,
                        stats: { ...missionForm.stats, founded: e.target.value },
                      })
                    }
                    placeholder="Value (e.g. 2022)"
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm font-bold"
                    required
                  />
                  <input
                    type="text"
                    value={missionForm.stats?.foundedLabel || 'Founded'}
                    onChange={(e) =>
                      setMissionForm({
                        ...missionForm,
                        stats: { ...missionForm.stats, foundedLabel: e.target.value },
                      })
                    }
                    placeholder="Label (e.g. Founded)"
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-xs"
                  />
                </div>

                {/* Branches Count */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    Branches Count &amp; Label
                  </label>
                  <input
                    type="text"
                    value={missionForm.stats?.branchesCount || ''}
                    onChange={(e) =>
                      setMissionForm({
                        ...missionForm,
                        stats: { ...missionForm.stats, branchesCount: e.target.value },
                      })
                    }
                    placeholder="Value (e.g. 6)"
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm font-bold"
                    required
                  />
                  <input
                    type="text"
                    value={missionForm.stats?.branchesCountLabel || 'Branches'}
                    onChange={(e) =>
                      setMissionForm({
                        ...missionForm,
                        stats: { ...missionForm.stats, branchesCountLabel: e.target.value },
                      })
                    }
                    placeholder="Label (e.g. Branches)"
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-xs"
                  />
                </div>

                {/* Standard */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    Standard &amp; Label
                  </label>
                  <input
                    type="text"
                    value={missionForm.stats?.standard || ''}
                    onChange={(e) =>
                      setMissionForm({
                        ...missionForm,
                        stats: { ...missionForm.stats, standard: e.target.value },
                      })
                    }
                    placeholder="Value (e.g. 100%)"
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm font-bold"
                    required
                  />
                  <input
                    type="text"
                    value={missionForm.stats?.standardLabel || 'Standard'}
                    onChange={(e) =>
                      setMissionForm({
                        ...missionForm,
                        stats: { ...missionForm.stats, standardLabel: e.target.value },
                      })
                    }
                    placeholder="Label (e.g. Standard)"
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-xs"
                  />
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* ===================================================================
          TAB 4: LEADERSHIP & TEAM
      =================================================================== */}
      {activeTab === 'leadership' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Section Header Settings */}
          <form onSubmit={handleSaveLeadershipHeader} className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white">
                Leadership Section Heading
              </h3>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Heading'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                value={leadershipHeaderForm.leadershipBadge}
                onChange={(e) => setLeadershipHeaderForm({ ...leadershipHeaderForm, leadershipBadge: e.target.value })}
                placeholder="Badge (e.g. Leadership)"
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-semibold"
              />
              <input
                type="text"
                value={leadershipHeaderForm.leadershipTitle}
                onChange={(e) => setLeadershipHeaderForm({ ...leadershipHeaderForm, leadershipTitle: e.target.value })}
                placeholder="Title (e.g. Owner & Executive Team)"
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-bold"
              />
              <input
                type="text"
                value={leadershipHeaderForm.leadershipSubtitle}
                onChange={(e) => setLeadershipHeaderForm({ ...leadershipHeaderForm, leadershipSubtitle: e.target.value })}
                placeholder="Subtitle"
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs"
              />
            </div>
          </form>

          {/* Members Grid & Add Button */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">
                  Executive &amp; Team Members
                </h3>
                <p className="text-xs text-neutral-400">
                  Add, edit, upload photos, and manage team members.
                </p>
              </div>
              <button
                onClick={openAddLeader}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {aboutData.leadership && aboutData.leadership.length > 0 ? (
                aboutData.leadership.map((member, index) => (
                  <div
                    key={member._id || member.id || index}
                    className="group bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <Users className="w-12 h-12 opacity-30" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditLeader(member, index)}
                            className="p-1.5 rounded-lg bg-white/90 text-neutral-700 hover:text-primary-500 hover:bg-white shadow-sm transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLeader(member, index)}
                            className="p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-600 shadow-sm transition-all cursor-pointer"
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
                ))
              ) : (
                <div className="col-span-full p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs">
                  No leadership members added yet. Click "+ Add Member" to add one.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ===================================================================
          TIMELINE MODAL
      =================================================================== */}
      <AnimatePresence>
        {isTimelineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                    placeholder="e.g. 2022"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Milestone Title</label>
                  <input
                    type="text"
                    value={timelineForm.title}
                    onChange={(e) => setTimelineForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. One Kitchen, One Idea"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    value={timelineForm.desc}
                    onChange={(e) => setTimelineForm((prev) => ({ ...prev, desc: e.target.value }))}
                    rows="3"
                    placeholder="Short summary of this achievement..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsTimelineModalOpen(false); setSelectedItem(null); }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary-500 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
                    Save Milestone
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================
          LEADERSHIP MODAL
      =================================================================== */}
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
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Role / Title</label>
                  <input
                    type="text"
                    value={leaderForm.role}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Founder &amp; CEO"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Photo Image</label>
                  <input
                    type="file"
                    ref={leaderFileRef}
                    accept="image/*"
                    onChange={(e) =>
                      handleGenericImageUpload(e.target.files?.[0], (url) =>
                        setLeaderForm((prev) => ({ ...prev, image: url }))
                      )
                    }
                    className="hidden"
                  />
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex-shrink-0 flex items-center justify-center">
                      {leaderForm.image ? (
                        <img src={leaderForm.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-neutral-400 opacity-40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => leaderFileRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary-500 text-neutral-600 dark:text-neutral-300 font-medium text-xs transition-all w-full bg-neutral-50/50 dark:bg-neutral-950 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {leaderForm.image ? 'Change Photo' : 'Upload Member Photo'}
                      </button>
                      {leaderForm.image && (
                        <button
                          type="button"
                          onClick={() => setLeaderForm((prev) => ({ ...prev, image: '' }))}
                          className="text-[11px] text-red-500 hover:underline block text-center w-full"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Short Bio</label>
                  <textarea
                    value={leaderForm.bio}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, bio: e.target.value }))}
                    rows="3"
                    placeholder="Short biographical background..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsLeaderModalOpen(false); setSelectedItem(null); }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary-500 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
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
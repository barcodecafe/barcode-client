import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquarePlus,
  Star,
  Search,
  Building2,
  Phone,
  Mail,
  Calendar,
  Trash2,
  CheckCircle2,
  TrendingUp,
  HeartHandshake,
  Zap,
  HelpCircle,
  ThumbsUp,
  RefreshCw,
  X,
  Share2,
  Users,
} from 'lucide-react';
import { getAllFeedbacks, deleteFeedback } from '../../services/feedbackService';
import { getAllBranches } from '../../services/branchesService';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getHeardFromLabel = (key) => {
  const map = {
    friends_family: 'Friends & Family',
    social_media: 'Social Media',
    advertisement: 'Online Ads',
    billboard: 'Billboard / Signage',
    walk_in: 'Walk-in / Passed by',
    other: 'Others',
  };
  return map[key] || key || 'Direct';
};

const getVisitAgainBadge = (val) => {
  switch (String(val || '').toLowerCase()) {
    case 'definitely':
      return {
        label: 'Definitely Return',
        cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      };
    case 'maybe':
      return {
        label: 'Maybe Return',
        cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      };
    case 'no':
      return {
        label: 'Unlikely to Return',
        cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      };
    default:
      return {
        label: val || 'Neutral',
        cls: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
      };
  }
};

export const AdminReviews = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedRetention, setSelectedRetention] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFeedbacks = () => {
    setIsLoading(true);
    getAllFeedbacks()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setFeedbacks(list);
      })
      .catch((err) => console.error('Failed to fetch feedbacks:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchFeedbacks();
    getAllBranches()
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = async (fb) => {
    const id = fb._id || fb.id;
    if (!window.confirm(`Are you sure you want to delete feedback from "${fb.userName}"?`)) return;

    try {
      await deleteFeedback(id);
      showSuccess('Feedback deleted successfully.');
      setFeedbacks((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete feedback.');
    }
  };

  // Analytics Metrics
  const metrics = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) {
      return {
        total: 0,
        avgFood: '0.0',
        avgSpeed: '0.0',
        avgStaff: '0.0',
        retentionRate: '0%',
      };
    }

    const sumFood = feedbacks.reduce((acc, f) => acc + Number(f.foodQuality || 0), 0);
    const sumSpeed = feedbacks.reduce((acc, f) => acc + Number(f.serviceSpeed || 0), 0);
    const sumStaff = feedbacks.reduce((acc, f) => acc + Number(f.staffBehavior || 0), 0);

    const definitelyCount = feedbacks.filter((f) => String(f.visitAgain).toLowerCase() === 'definitely').length;

    return {
      total,
      avgFood: (sumFood / total).toFixed(1),
      avgSpeed: (sumSpeed / total).toFixed(1),
      avgStaff: (sumStaff / total).toFixed(1),
      retentionRate: `${Math.round((definitelyCount / total) * 100)}%`,
    };
  }, [feedbacks]);

  // Filtered Feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = String(f.userName || '').toLowerCase().includes(query);
        const matchPhone = String(f.phone || '').toLowerCase().includes(query);
        const matchLiked = String(f.likedMost || '').toLowerCase().includes(query);
        const matchImp = String(f.improvements || '').toLowerCase().includes(query);
        const matchComments = String(f.comments || '').toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchLiked && !matchImp && !matchComments) {
          return false;
        }
      }

      // Branch filter
      if (selectedBranch !== 'all') {
        const branchKey = String(f.branchId || '');
        if (branchKey !== selectedBranch && String(f.branchName || '') !== selectedBranch) {
          return false;
        }
      }

      // Rating filter
      if (selectedRating !== 'all') {
        const minRating = Number(selectedRating);
        const avgScore = (Number(f.foodQuality || 0) + Number(f.serviceSpeed || 0) + Number(f.staffBehavior || 0)) / 3;
        if (selectedRating === 'low' && avgScore > 2.5) return false;
        if (selectedRating === '5' && avgScore < 4.5) return false;
        if (selectedRating === '4' && (avgScore < 3.5 || avgScore >= 4.5)) return false;
        if (selectedRating === '3' && (avgScore < 2.5 || avgScore >= 3.5)) return false;
      }

      // Retention filter
      if (selectedRetention !== 'all') {
        if (String(f.visitAgain || '').toLowerCase() !== selectedRetention) {
          return false;
        }
      }

      // Channel filter
      if (selectedChannel !== 'all') {
        if (String(f.heardFrom || '').toLowerCase() !== selectedChannel) {
          return false;
        }
      }

      return true;
    });
  }, [feedbacks, searchTerm, selectedBranch, selectedRating, selectedRetention, selectedChannel]);

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
            <MessageSquarePlus className="w-7 h-7 text-primary-500" />
            Customer Reviews & Experience Feedback
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time customer satisfaction metrics, food quality ratings, and qualitative feedback across branches.
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
              <CheckCircle2 className="w-4 h-4" />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Reviews */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Reviews
            </span>
            <p className="font-display text-2xl font-black text-neutral-900 dark:text-white mt-1">
              {metrics.total}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Food Quality */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Food Quality
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.avgFood}
              </p>
              <span className="text-xs text-neutral-400 font-semibold">/ 5.0</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Star className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Service Speed */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Service Speed
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="font-display text-2xl font-black text-amber-600 dark:text-amber-400">
                {metrics.avgSpeed}
              </p>
              <span className="text-xs text-neutral-400 font-semibold">/ 5.0</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Staff Hospitality */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Staff Behavior
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="font-display text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {metrics.avgStaff}
              </p>
              <span className="text-xs text-neutral-400 font-semibold">/ 5.0</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        {/* Retention Rate */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Retention Rate
            </span>
            <p className="font-display text-2xl font-black text-primary-600 dark:text-primary-400 mt-1">
              {metrics.retentionRate}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-500">
            <ThumbsUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone, comment..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="low">⚠️ Low Ratings (1-2 Stars)</option>
          </select>

          {/* Retention Filter */}
          <select
            value={selectedRetention}
            onChange={(e) => setSelectedRetention(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="all">All Retention Answers</option>
            <option value="definitely">Definitely Returning</option>
            <option value="maybe">Maybe Returning</option>
            <option value="no">Unlikely to Return</option>
          </select>

          {/* Marketing Channel Filter */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="all">All Marketing Sources</option>
            <option value="friends_family">Friends & Family</option>
            <option value="social_media">Social Media (FB/Insta)</option>
            <option value="advertisement">Online Advertisements</option>
            <option value="billboard">Billboard / Signage</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Others</option>
          </select>
        </div>

        {(searchTerm || selectedBranch !== 'all' || selectedRating !== 'all' || selectedRetention !== 'all' || selectedChannel !== 'all') && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBranch('all');
                setSelectedRating('all');
                setSelectedRetention('all');
                setSelectedChannel('all');
              }}
              className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Review Cards List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-neutral-400 space-y-2">
          <MessageSquarePlus className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm font-semibold">No feedback records found matching your filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedBranch('all');
              setSelectedRating('all');
              setSelectedRetention('all');
              setSelectedChannel('all');
            }}
            className="text-xs text-primary-500 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span>Showing {filteredFeedbacks.length} feedback record{filteredFeedbacks.length === 1 ? '' : 's'}</span>
            <button
              onClick={fetchFeedbacks}
              className="flex items-center gap-1 font-bold text-primary-500 hover:text-primary-600 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredFeedbacks.map((fb, idx) => {
              const retentionBadge = getVisitAgainBadge(fb.visitAgain);
              return (
                <motion.div
                  key={fb._id || fb.id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-primary-500/40 transition-all"
                >
                  {/* Top Row: Customer Info, Branch, Date & Delete */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-display font-black text-lg shrink-0">
                        {String(fb.userName || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                          {fb.userName}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                          <a
                            href={`tel:${fb.phone}`}
                            className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {fb.phone}
                          </a>
                          {fb.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {fb.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-primary-500" />
                        {fb.branchName || 'General / Delivery'}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {formatDate(fb.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDelete(fb)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer ml-1"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Ratings Pills & Marketing Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Performance Rating Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-current text-emerald-500" />
                        <span>Food Quality: <strong>{fb.foodQuality} / 5</strong></span>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Service Speed: <strong>{fb.serviceSpeed} / 5</strong></span>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Staff Behavior: <strong>{fb.staffBehavior} / 5</strong></span>
                      </div>
                    </div>

                    {/* Marketing & Retention Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                        Channel: {getHeardFromLabel(fb.heardFrom)}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${retentionBadge.cls}`}>
                        {retentionBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Qualitative Feedback Sections */}
                  {(fb.likedMost || fb.improvements || fb.comments) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      {fb.likedMost && (
                        <div className="p-3.5 rounded-2xl bg-neutral-50/60 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                            Liked Most (পছন্দের দিক)
                          </span>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-light">
                            {fb.likedMost}
                          </p>
                        </div>
                      )}

                      {fb.improvements && (
                        <div className="p-3.5 rounded-2xl bg-neutral-50/60 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                            Suggested Improvements (উন্নতির পরামর্শ)
                          </span>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-light">
                            {fb.improvements}
                          </p>
                        </div>
                      )}

                      {fb.comments && (
                        <div className="p-3.5 rounded-2xl bg-neutral-50/60 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400 block">
                            Additional Comments (মন্তব্য)
                          </span>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-light">
                            {fb.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;

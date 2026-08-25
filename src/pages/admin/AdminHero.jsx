import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Link2, Calendar, Percent, DollarSign, Sparkles } from 'lucide-react';
import { getAllSlides, createSlide, updateSlide, deleteSlide } from '../../services/heroSlidesService';
import { getAllFoods, updateFood } from '../../services/foodsService';

const formatForDateTimeInput = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

export const AdminHero = () => {
  const [slides, setSlides] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'promo',
    title: '',
    subtitle: '',
    image: '',
    cta: 'Order Now',
    featuredFoodId: '',
    offerText: '',
    discountType: 'percent',
    discountPct: '',
    discountAmount: '',
    offerType: 'none',
    discountStartDate: '',
    discountEndDate: '',
  });
  const [formError, setFormError] = useState('');

  const fetchSlides = () => {
    setLoading(true);
    Promise.allSettled([getAllSlides(), getAllFoods()])
      .then(([slidesRes, foodsRes]) => {
        if (slidesRes.status === 'fulfilled') {
          setSlides(Array.isArray(slidesRes.value) ? slidesRes.value : []);
        } else {
          console.error('Failed to load hero slides:', slidesRes.reason);
        }
        if (foodsRes.status === 'fulfilled') {
          setFoods(Array.isArray(foodsRes.value) ? foodsRes.value : []);
        } else {
          console.error('Failed to load foods:', foodsRes.reason);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const openAddModal = () => {
    setEditingSlide(null);
    setFormData({
      type: 'promo',
      title: '',
      subtitle: '',
      image: '', 
      cta: 'Order Now',
      featuredFoodId: '',
      offerText: '',
      discountType: 'percent',
      discountPct: '',
      discountAmount: '',
      offerType: 'none',
      discountStartDate: '',
      discountEndDate: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (slide) => {
    setEditingSlide(slide);
    const linkedFood = foods.find((f) => String(f.id || f._id) === String(slide.featuredFoodId));
    setFormData({
      type: slide.type,
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image,
      cta: slide.cta || 'Order Now',
      featuredFoodId: slide.featuredFoodId || '',
      offerText: slide.offerText || '',
      discountType: linkedFood?.discountType || 'percent',
      discountPct: linkedFood?.discountPct ? String(linkedFood.discountPct) : '',
      discountAmount: linkedFood?.discountAmount ? String(linkedFood.discountAmount) : '',
      offerType: linkedFood?.offerType || 'none',
      discountStartDate: formatForDateTimeInput(linkedFood?.discountStartDate),
      discountEndDate: formatForDateTimeInput(linkedFood?.discountEndDate),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFoodSelect = (foodId) => {
    if (!foodId) {
      setFormData((prev) => ({
        ...prev,
        featuredFoodId: '',
        discountPct: '',
        discountAmount: '',
        offerType: 'none',
        discountStartDate: '',
        discountEndDate: '',
      }));
      return;
    }

    const selected = foods.find((f) => String(f.id || f._id) === String(foodId));
    if (selected) {
      const dType = selected.discountType || 'percent';
      const dPct = selected.discountPct ? String(selected.discountPct) : '';
      const dAmt = selected.discountAmount ? String(selected.discountAmount) : '';
      const oType = selected.offerType || 'none';
      const sDate = formatForDateTimeInput(selected.discountStartDate);
      const eDate = formatForDateTimeInput(selected.discountEndDate);

      let computedOffer = '';
      if (oType === 'bogo_1g1') computedOffer = 'BUY 1 GET 1 FREE';
      else if (oType === 'bogo_1g2') computedOffer = 'BUY 1 GET 2 FREE';
      else if (oType === 'combo') computedOffer = 'COMBO DEAL';
      else if (dType === 'flat' && Number(dAmt) > 0) computedOffer = `FLAT ৳${dAmt} OFF`;
      else if (dType === 'percent' && Number(dPct) > 0) computedOffer = `${dPct}% OFF`;

      setFormData((prev) => ({
        ...prev,
        featuredFoodId: foodId,
        title: prev.title.trim() && prev.title !== 'Untitled' ? prev.title : selected.name,
        subtitle: prev.subtitle.trim() ? prev.subtitle : (selected.description || `Special delicious ${selected.name} available now for ৳${selected.price}`),
        image: prev.image ? prev.image : (selected.image || ''),
        discountType: dType,
        discountPct: dPct,
        discountAmount: dAmt,
        offerType: oType,
        discountStartDate: sDate,
        discountEndDate: eDate,
        offerText: prev.offerText ? prev.offerText : computedOffer,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'featuredFoodId') {
      handleFoodSelect(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError("File size should be less than 2MB");
        return;
      }

      setFormError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result, 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const broadcastHeroUpdate = () => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('barcode_realtime');
        bc.postMessage({ type: 'HERO_SLIDES_UPDATED' });
        bc.close();
      }
    } catch (e) {
      // Ignore broadcast errors
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const linkedFood = foods.find((f) => String(f.id || f._id) === String(formData.featuredFoodId));
    const finalImage = formData.image || (formData.type === 'promo' && linkedFood ? linkedFood.image : '');

    if (!formData.title.trim()) {
      setFormError('Please enter a Slide Title.');
      return;
    }

    if (!finalImage) {
      setFormError('Please upload a slide image or select a food dish with an image.');
      return;
    }

    try {
      // 1. Prepare Hero Slide Payload
      let finalOfferText = formData.offerText?.trim() || '';
      if (!finalOfferText && formData.type === 'promo') {
        if (formData.offerType === 'bogo_1g1') finalOfferText = 'BUY 1 GET 1 FREE';
        else if (formData.offerType === 'bogo_1g2') finalOfferText = 'BUY 1 GET 2 FREE';
        else if (formData.offerType === 'combo') finalOfferText = 'COMBO DEAL';
        else if (formData.discountType === 'flat' && Number(formData.discountAmount) > 0) finalOfferText = `FLAT ৳${formData.discountAmount} OFF`;
        else if (formData.discountType === 'percent' && Number(formData.discountPct) > 0) finalOfferText = `${formData.discountPct}% OFF`;
      }

      const payload = {
        type: formData.type,
        title: formData.title,
        subtitle: formData.subtitle,
        image: finalImage,
        featuredFoodId: formData.type === 'promo' && formData.featuredFoodId ? formData.featuredFoodId : null,
        cta: formData.type === 'promo' ? formData.cta || 'Order Now' : null,
        offerText: formData.type === 'promo' ? finalOfferText || null : null
      };

      if (editingSlide) {
        await updateSlide(editingSlide.id || editingSlide._id, payload);
        toast.success('Hero slide updated successfully!');
      } else {
        await createSlide(payload);
        toast.success('Hero slide created successfully!');
      }

      // 2. ⚡ Synchronize Linked Food Dish (Discount, Timer & Offer Type on Menu)
      if (formData.type === 'promo' && formData.featuredFoodId) {
        try {
          const foodUpdatePayload = {
            discountType: formData.discountType,
            discountPct: formData.discountType === 'percent' ? Number(formData.discountPct) || 0 : 0,
            discountAmount: formData.discountType === 'flat' ? Number(formData.discountAmount) || 0 : 0,
            offerType: formData.offerType || 'none',
            discountStartDate: formData.discountStartDate ? new Date(formData.discountStartDate).toISOString() : null,
            discountEndDate: formData.discountEndDate ? new Date(formData.discountEndDate).toISOString() : null,
          };
          await updateFood(formData.featuredFoodId, foodUpdatePayload);
        } catch (foodErr) {
          console.warn('Could not sync food discount:', foodErr);
        }
      }

      broadcastHeroUpdate();
      setIsModalOpen(false);
      fetchSlides();
    } catch (err) {
      setFormError(err.message || 'Something went wrong.');
    }
  };

  const handleDeleteClick = async (target) => {
    const slideId = typeof target === 'object' ? (target.id || target._id) : target;
    if (!slideId) return;

    if (window.confirm('Are you sure you want to delete this hero slide?')) {
      const previousSlides = [...slides];
      // ⚡ 0ms Optimistic Removal: Instantly remove card from screen
      setSlides((prev) => prev.filter((s) => String(s.id || s._id) !== String(slideId)));

      try {
        await deleteSlide(slideId);
        broadcastHeroUpdate();
        toast.success('Hero slide deleted successfully!');
      } catch (err) {
        console.error('Failed to delete slide:', err);
        toast.error(err?.message || 'Failed to delete slide');
        // Rollback state if delete failed
        setSlides(previousSlides);
      }
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
    <div className="space-y-6 w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Hero Carousel Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage the homepage carousel slides. Toggle between food advertisements and general restaurant photos.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </button>
      </div>

      {/* 🎯 Ultra-wide Grid for Slides: 2xl, 3xl, 4xl-এ ৪টি ও ৫টি কার্ড গ্রিড প্রসারিত হবে */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
        {slides.map((slide) => {
          const linkedDish = foods.find((f) => f.id === slide.featuredFoodId);
          return (
            <div
              key={slide.id || slide._id}
              className="group bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image container */}
                <div className="relative aspect-[16/9] overflow-hidden bg-neutral-950">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Slide Type Badge */}
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border ${
                    slide.type === 'promo' 
                      ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' 
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                    {slide.type === 'promo' ? 'Food Ad Slide' : 'Atmosphere Photo'}
                  </span>

                  <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                    <h4 className="font-semibold text-sm truncate">{slide.title}</h4>
                    <p className="text-[10px] text-neutral-300 truncate font-light mt-0.5">{slide.subtitle}</p>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4 space-y-3.5">
                  {slide.type === 'promo' && (
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-955 border border-neutral-100 dark:border-neutral-850 p-2.5 rounded-xl w-full">
                      <Link2 className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold">Featured Dish Link:</span>
                        <span className="block font-medium truncate text-neutral-700 dark:text-neutral-300 mt-0.5">
                          {linkedDish ? `${linkedDish.name} (৳${linkedDish.price})` : 'No dish linked'}
                        </span>
                        {slide.offerText && (
                          <span className="block text-[10px] font-bold text-red-500 mt-1">
                            Offer: {slide.offerText}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {slide.type === 'ambient' && (
                    <p className="text-[10px] text-neutral-450 dark:text-neutral-500 italic p-1">
                      * Ambient atmosphere slide. Will not display an Order button on home page.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-955/20">
                <button
                  onClick={() => openEditModal(slide)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Slide
                </button>

                <button
                  onClick={() => handleDeleteClick(slide)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-950/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-lg 2xl:max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-10 p-6 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-150 dark:border-neutral-800 shrink-0">
                <h3 className="text-lg font-bold font-display text-neutral-800 dark:text-white">
                  {editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 text-xs shrink-0">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto py-4 flex-1 pr-1">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Slide Type
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-neutral-100 dark:bg-neutral-955 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: 'promo' }))}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        formData.type === 'promo'
                          ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-white'
                      }`}
                    >
                      Food Advertisement (Promo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: 'ambient' }))}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        formData.type === 'ambient'
                          ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-white'
                      }`}
                    >
                      Interior/Atmosphere (Ambient)
                    </button>
                  </div>
                </div>

                {/* 🎯 Promo Configuration: Fully Professional 4-Section Layout */}
                {formData.type === 'promo' && (
                  <div className="p-4 bg-primary-500/5 dark:bg-primary-500/10 border border-primary-500/20 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-primary-500/15">
                      <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Food Advertisement & Dish Menu Sync
                      </span>
                      {formData.featuredFoodId ? (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          ✓ Linked to Main Menu Dish
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400">
                          (Select a dish to sync menu pricing & timers)
                        </span>
                      )}
                    </div>

                    <div className="space-y-3.5">
                      {/* Section 1: Select Food Dish */}
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                          1. Select Food Dish to Link & Auto-fill
                        </label>
                        <select
                          name="featuredFoodId"
                          value={formData.featuredFoodId}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-primary-500/30 dark:border-primary-500/40 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
                        >
                          <option value="">-- Choose a Food Dish from Menu --</option>
                          {foods.map((food) => {
                            const fId = food.id || food._id;
                            return (
                              <option key={fId} value={fId}>
                                {food.name} (৳{food.price}) — {food.category || 'General'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Section 2: Special Promotion Offer */}
                      <div>
                        <label className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          🎁 2. Special Promotion Offer (Optional)
                        </label>
                        <select
                          name="offerType"
                          value={formData.offerType}
                          onChange={(e) => {
                            const val = e.target.value;
                            let oText = formData.offerText;
                            if (val === 'bogo_1g1') oText = 'BUY 1 GET 1 FREE';
                            else if (val === 'bogo_1g2') oText = 'BUY 1 GET 2 FREE';
                            else if (val === 'combo') oText = 'COMBO DEAL';
                            else if (val === 'none' && (formData.offerText === 'BUY 1 GET 1 FREE' || formData.offerText === 'BUY 1 GET 2 FREE' || formData.offerText === 'COMBO DEAL')) oText = '';
                            setFormData((prev) => ({
                              ...prev,
                              offerType: val,
                              offerText: oText,
                            }));
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                        >
                          <option value="none">No Offer (Standard)</option>
                          <option value="bogo_1g1">Buy 1 Get 1 Free (BOGO)</option>
                          <option value="bogo_1g2">Buy 1 Get 2 Free (BOGO)</option>
                          <option value="combo">Special Combo Deal</option>
                        </select>
                      </div>

                      {/* Section 3: Direct Discount Value */}
                      <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2.5">
                        <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          ⭐ 3. Direct Discount Value (Percentage % or Flat ৳)
                        </label>

                        <div className="flex items-center gap-2">
                          <select
                            name="discountType"
                            value={formData.discountType}
                            onChange={(e) => {
                              const newType = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                discountType: newType,
                                discountPct: newType === 'percent' ? prev.discountPct : '',
                                discountAmount: newType === 'flat' ? prev.discountAmount : '',
                              }));
                            }}
                            className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-bold focus:outline-none cursor-pointer shrink-0"
                          >
                            <option value="percent">% Percentage Off</option>
                            <option value="flat">৳ Flat Taka Off</option>
                          </select>

                          {formData.discountType === 'flat' ? (
                            <input
                              type="number"
                              min="0"
                              value={formData.discountAmount}
                              onChange={(e) => {
                                const amt = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  discountAmount: amt,
                                  discountPct: '',
                                  offerText: Number(amt) > 0 ? `FLAT ৳${amt} OFF` : prev.offerText,
                                }));
                              }}
                              placeholder="৳ off (Enter 0 to clear)"
                              className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.discountPct}
                              onChange={(e) => {
                                const pct = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  discountPct: pct,
                                  discountAmount: '',
                                  offerText: Number(pct) > 0 ? `${pct}% OFF` : prev.offerText,
                                }));
                              }}
                              placeholder="% off (Enter 0 to clear)"
                              className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          )}
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-1.5 pt-1">
                          <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                            1-Click Preset Discounts:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {['10% OFF', '15% OFF', '20% OFF', '25% OFF', '30% OFF', '50% OFF'].map((chip) => {
                              const pct = parseInt(chip);
                              return (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      discountType: 'percent',
                                      discountPct: String(pct),
                                      discountAmount: '',
                                      offerText: chip,
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                    formData.discountType === 'percent' && String(formData.discountPct) === String(pct)
                                      ? 'bg-red-500 text-white border-red-500 shadow-xs'
                                      : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-red-400'
                                  }`}
                                >
                                  🔥 {chip}
                                </button>
                              );
                            })}

                            {['FLAT ৳50 OFF', 'FLAT ৳100 OFF', 'FLAT ৳150 OFF', 'FLAT ৳200 OFF', 'FLAT ৳300 OFF', 'FLAT ৳500 OFF'].map((chip) => {
                              const amt = parseInt(chip.replace(/\D/g, ''));
                              return (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      discountType: 'flat',
                                      discountAmount: String(amt),
                                      discountPct: '',
                                      offerText: chip,
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                    formData.discountType === 'flat' && String(formData.discountAmount) === String(amt)
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400'
                                  }`}
                                >
                                  💵 {chip}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Duration Timer */}
                      <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 space-y-2">
                        <label className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" /> 4. Promotion & Discount Duration Timer
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-semibold text-neutral-500 block mb-1">
                              Start Date & Time (Optional)
                            </span>
                            <input
                              type="datetime-local"
                              name="discountStartDate"
                              value={formData.discountStartDate}
                              onChange={handleInputChange}
                              className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-800 dark:text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-neutral-500 block mb-1">
                              End Date & Time (Expiration)
                            </span>
                            <input
                              type="datetime-local"
                              name="discountEndDate"
                              value={formData.discountEndDate}
                              onChange={handleInputChange}
                              className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-800 dark:text-white focus:outline-none"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 italic pt-0.5">
                          * When End Date expires, the discount badge & reduction will automatically deactivate on both the hero slide and main menu.
                        </p>
                      </div>

                      {/* CTA & Offer text override */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                            Button CTA Text
                          </label>
                          <input
                            type="text"
                            name="cta"
                            value={formData.cta}
                            onChange={handleInputChange}
                            placeholder="e.g. Order Now, Grab Offer"
                            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                            Banner Badge Custom Text
                          </label>
                          <input
                            type="text"
                            name="offerText"
                            value={formData.offerText}
                            onChange={handleInputChange}
                            placeholder="e.g. 20% OFF, BUY 1 GET 1"
                            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Slide Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Savor the Art of Modern Dining"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Slide Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Where culinary creativity meets sophisticated atmosphere."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Background Image
                    </label>
                    {formData.image && formData.featuredFoodId && (
                      <span className="text-[10px] text-neutral-400">
                        {formData.image.startsWith('data:') ? '🖼️ Custom Uploaded Banner' : '📌 Using Linked Dish Photo'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {formData.image && (
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-900 text-white transition-all backdrop-blur-xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <label className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-primary-500 dark:hover:border-primary-500 rounded-2xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-955/50 transition-all p-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1 text-neutral-500 dark:text-neutral-400">
                        <ImageIcon className="w-5 h-5 text-neutral-400 mb-0.5" />
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          {formData.image ? 'Upload Extra Custom Banner (Override)' : 'Upload Custom Slide Banner (Optional)'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Supports JPG, PNG, WebP (Max 2MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-150 dark:border-neutral-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {editingSlide ? 'Save Changes' : 'Create Slide'}
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

export default AdminHero;
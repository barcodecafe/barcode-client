import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'; // CHANGE: Added useSearchParams for URL-based category filtering
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Navigation,
  Clock,
  ArrowLeft,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getFoodsByBranch, getActivePrice, getDiscountedPrice } from '../services/foodsService';
import { getBranchById } from '../services/branchesService';
import LeafletMap from '../components/LeafletMap';

// ---------------------------------------------------------------------------
// HeroImageCarousel — handles banner photo transitions, drag & autoplay
// ---------------------------------------------------------------------------
const HeroImageCarousel = ({ images, alt, autoplayInterval = 5000 }) => {
  const slides = images && images.length > 0 ? images : [];
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const timeoutRef = useRef(null);
  const hasMultiple = slides.length > 1;

  const goTo = useCallback(
    (newIndex, dir) => {
      if (slides.length === 0) return;
      const wrapped = (newIndex + slides.length) % slides.length;
      setDirection(dir);
      setIndex(wrapped);
    },
    [slides.length]
  );

  const goNext = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    if (!hasMultiple) return;
    timeoutRef.current = setTimeout(() => {
      goTo(index + 1, 1);
    }, autoplayInterval);
    return () => clearTimeout(timeoutRef.current);
  }, [index, hasMultiple, autoplayInterval, goTo]);

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const stop = (e) => e.stopPropagation();

  if (slides.length === 0) return null;

  return (
    <>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.img
          key={index}
          src={slides[index]}
          alt={alt}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'tween', duration: 0.5, ease: 'easeInOut' }, opacity: { duration: 0.3 } }}
          drag={hasMultiple ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(e, info) => {
            if (info.offset.x < -60) goNext();
            else if (info.offset.x > 60) goPrev();
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => { stop(e); goPrev(); }}
            aria-label="Previous image"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all duration-200 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { stop(e); goNext(); }}
            aria-label="Next image"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all duration-200 active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { stop(e); goTo(i, i > index ? 1 : -1); }}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// InfoCard — small grid element helper for quick info pieces
// ---------------------------------------------------------------------------
const InfoCard = ({ icon, label, value, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay }}
    className="flex gap-4 items-start p-5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
  >
    <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="text-neutral-800 dark:text-neutral-100 font-semibold mt-0.5 leading-snug">{value}</p>
    </div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const BranchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams(); // CHANGE: Added searchParams hook for reading/writing category query parameter

  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branchMenu, setBranchMenu] = useState([]);
  
  // CHANGE: activeCategory now reads from URL search parameters instead of local state
  const activeCategory = searchParams.get('category') || 'All';
  
  // CHANGE: Added helper function to update URL search parameters on category change
  const handleCategoryChange = (catName) => {
    setSearchParams({ category: catName });
  };
  
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getBranchById(id).then((data) => {
      setBranch(data);
      if (data) {
        localStorage.setItem('selectedBranchId', String(data.id));
        getFoodsByBranch(data.id, 24).then((menuData) => {
          setBranchMenu(menuData);
          // CHANGE: Removed setActiveCategory('All') because URL parameter manages this state now
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [id]);

// 1. Get the admin's custom sort order list from localStorage
  const sortedCategoriesList = useMemo(() => {
    const savedOrder = localStorage.getItem("custom_category_order");
    if (savedOrder) {
      try {
        return JSON.parse(savedOrder).map(c => c?.trim()).filter(Boolean);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, []);

// 2. Arrange the category tabs according to the admin's drag-and-drop sequence
  const categories = useMemo(() => {
    if (!branchMenu || branchMenu.length === 0) return ['All'];
    const uniqueCats = Array.from(new Set(branchMenu.map((item) => item.category?.trim()).filter(Boolean)));
    
    const finalSortedCategories = uniqueCats.sort((a, b) => {
      const indexA = sortedCategoriesList.findIndex(c => c.toLowerCase() === a.toLowerCase());
      const indexB = sortedCategoriesList.findIndex(c => c.toLowerCase() === b.toLowerCase());
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ['All', ...finalSortedCategories];
  }, [branchMenu, sortedCategoriesList]);

// 3. Arrange the food items according to the admin's preferred category order
  const filteredMenu = useMemo(() => {
    const matched = activeCategory === 'All'
      ? branchMenu
      : branchMenu.filter((food) => food.category?.trim().toLowerCase() === activeCategory.trim().toLowerCase());

    return [...matched].sort((a, b) => {
      const indexA = sortedCategoriesList.findIndex(c => c.toLowerCase() === a.category?.trim().toLowerCase());
      const indexB = sortedCategoriesList.findIndex(c => c.toLowerCase() === b.category?.trim().toLowerCase());
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.id - b.id;
    });
  }, [branchMenu, activeCategory, sortedCategoriesList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">Venue Not Found</h2>
        <p className="text-neutral-500 mb-6">The branch you are looking for doesn't exist or has moved.</p>
        <button
          onClick={() => navigate('/branches')}
          className="text-primary-500 font-semibold inline-flex items-center gap-2 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all branches
        </button>
      </div>
    );
  }

  const activeDetails = {
    manager: branch.manager || "Branch Manager",
    capacity: branch.capacity || 150,
    features: branch.features || ["Premium Seating", "AC Venue", "Wi-Fi Access", "Parking Available"]
  };

  // Map / contact helpers
  const hasCoords =
    typeof branch.lat === 'number' &&
    typeof branch.lng === 'number' &&
    !(branch.lat === 0 && branch.lng === 0);
  const telHref = `tel:${branch.contact ? branch.contact.replace(/[^\d+]/g, '') : ''}`;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.location || branch.name)}`;

  const getRegion = (location) => {
    if (!location) return 'Chattogram';
    const lowerLoc = location.toLowerCase();
    if (lowerLoc.includes("cox") || lowerLoc.includes("bazar")) return "Cox's Bazar";
    if (lowerLoc.includes("dhaka") || lowerLoc.includes("banani") || lowerLoc.includes("gulshan")) return "Dhaka";
    return 'Chattogram';
  };

  const slides = branch.images && branch.images.length > 0 ? branch.images : [branch.image];

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
  };

  const gridVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };

  const handleCategoryScroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = direction === 'left' ? -container.offsetWidth / 2 : container.offsetWidth / 2;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      {/* ================================================================ */}
      {/* 1. IMMERSIVE HERO HEADER                                         */}
      {/* ================================================================ */}
      <section className="relative w-full h-[55vh] sm:h-[70vh] bg-black overflow-hidden">
        <HeroImageCarousel images={slides} alt={branch.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-5 left-4 sm:top-8 sm:left-8 z-30">
          <button
            onClick={() => navigate('/branches')}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-semibold shadow-lg transition-all duration-300 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Branches
          </button>
        </div>

        <div className="absolute bottom-8 left-4 right-4 sm:left-8 sm:right-8 z-20 text-white flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="px-2.5 py-1 rounded-md bg-primary-500 text-xs font-bold uppercase tracking-wider shadow-md">
              {getRegion(branch.location)}
            </span>
            <h1 className="font-display text-3xl sm:text-6xl font-extrabold mt-3 tracking-tight drop-shadow-lg">
              {branch.name}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold w-fit shadow-xs"
          >
            <Star className="w-4 h-4 fill-primary-500 stroke-primary-500" />
            <span>{branch.rating} Rating</span>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. BRANCH-SPECIFIC MENU GRID & INLINE CATEGORY FILTER             */}
      {/* ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="relative flex items-center w-full max-w-full group">
            {categories.length > 8 && (
              <button
                type="button"
                onClick={() => handleCategoryScroll('left')}
                className="absolute left-0 z-10 p-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 backdrop-blur-xs transition-all duration-200 active:scale-90"
                aria-label="Scroll categories left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div
              ref={scrollContainerRef}
              className={`flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none snap-x w-full transition-all ${
                categories.length > 8 ? 'px-8' : ''
              }`}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)} // CHANGE: Updated to handleCategoryChange to update URL
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap snap-center ${
                    activeCategory?.trim().toLowerCase() === cat?.trim().toLowerCase() // CHANGE: Case-insensitive styling comparison
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/20 dark:border-neutral-800/30 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {categories.length > 8 && (
              <button
                type="button"
                onClick={() => handleCategoryScroll('right')}
                className="absolute right-0 z-10 p-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 backdrop-blur-xs transition-all duration-200 active:scale-90"
                aria-label="Scroll categories right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {branchMenu.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <UtensilsCrossed className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              Full menu for this branch is coming soon.
            </p>
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
              No menu items available under "{activeCategory}" at this moment.
            </p>
          </div>
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="visible" // CHANGE: Changed whileInView to animate to prevent items from disappearing on subsequent category clicks
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
          >
            {filteredMenu.map((food) => {
              const basePrice = getActivePrice(food, branch.id);
              const purchasePrice = getDiscountedPrice(food, branch.id);
              const hasDiscount = food.discountPct > 0;
              return (
                <motion.div
                  key={food.id}
                  variants={cardVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-neutral-950/20 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {hasDiscount && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-primary-500 text-white font-bold text-[10px] uppercase shadow-lg shadow-red-500/35 z-10 pointer-events-none">
                        {food.discountPct}% OFF
                      </div>
                    )}
                    <Link to={`/menu/${food.id}?branchId=${branch.id}`} className="block w-full h-full">
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    </Link>
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                        {/* CHANGE: Converted span category badge to button with onClick handler to filter category on badge click */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCategoryChange(food.category);
                          }}
                          className="uppercase tracking-wider hover:text-primary-500 transition-colors cursor-pointer text-left"
                        >
                          {food.category}
                        </button>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 text-primary-500 font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{food.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Link to={`/menu/${food.id}?branchId=${branch.id}`} className="block">
                        <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors line-clamp-1">
                          {food.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light line-clamp-2">
                        {food.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 mt-1 font-display">
                      <div className="flex flex-wrap items-baseline gap-1">
                        {hasDiscount ? (
                          <>
                            <span className="font-extrabold text-red-500 text-base">
                              ৳{purchasePrice.toFixed(2)}
                            </span>
                            <span className="text-xs text-neutral-455 dark:text-neutral-500 line-through">
                              ৳{basePrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-extrabold text-primary-500 text-base">
                            ৳{basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(food, branch.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:scale-[1.02] active:scale-95 shadow-md transition-all font-sans bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/10 hover:shadow-primary-500/25"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Order Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ================================================================ */}
      {/* 3. BRANCH INFORMATION — CARD GRID                                */}
      {/* ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-10 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard icon={<Clock className="w-5 h-5" />} label="Opening Hours" value={branch.hours} delay={0} />
          <InfoCard icon={<MapPin className="w-5 h-5" />} label="Full Address" value={branch.location} delay={0.05} />
          <InfoCard icon={<Phone className="w-5 h-5" />} label="Contact Number" value={branch.contact} delay={0.1} />
          <InfoCard icon={<Users className="w-5 h-5" />} label="Seating Capacity" value={`${activeDetails.capacity} Guests`} delay={0.15} />
        </div>
      </section>

      {/* ================================================================ */}
      {/* 4. AMBIENCE / FEATURES + MAP ACTIONS                             */}
      {/* ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 mb-6 sm:px-6 lg:px-8 py-0 pt-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900"
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                Ambience & Amenities
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {activeDetails.features.map((feature, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold border border-neutral-200/10"
                >
                  {feature}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3.5 pt-5 border-t border-neutral-100 dark:border-neutral-800/60">
              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 shadow-xs text-neutral-400 border border-neutral-200/40 dark:border-neutral-800/40">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">General Manager</p>
                <p className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm mt-0.5">{activeDetails.manager}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-4"
          >
            {/* Real interactive map (OpenStreetMap via Leaflet — no API key) */}
            {hasCoords ? (
              <LeafletMap
                lat={branch.lat}
                lng={branch.lng}
                zoom={16}
                className="h-56 sm:min-h-[220px] w-full border border-neutral-200 dark:border-neutral-800 shadow-inner"
              />
            ) : (
              <div className="relative h-56 sm:min-h-[220px] rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-dashed border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col items-center justify-center gap-2 shadow-inner text-center px-4">
                <MapPin className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 max-w-[85%]">
                  Precise map pin coming soon — use “Get Directions” to find us.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <a
                href={telHref}
                className="flex-1 py-3 rounded-xl border border-primary-500 text-primary-500 font-bold text-center text-sm flex items-center justify-center gap-2 hover:bg-primary-500/5 active:scale-95 transition-all duration-300"
              >
                <Phone className="w-4 h-4" />
                Call Branch
              </a>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-95 transition-all duration-300"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BranchDetail;
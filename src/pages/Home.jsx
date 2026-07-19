import { useState, useEffect, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Star,
  ArrowRight,
  Heart,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import {
  getFeaturedBranches,
  getAllBranches,
} from "../services/branchesService";
import {
  getAllFoods,
  hasFoodDiscount,
  foodDiscountLabel,
  applyFoodDiscount,
} from "../services/foodsService";
import { getAllSlides } from "../services/heroSlidesService";
import { getAllBrands } from "../services/brandsService";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const PREVIEW_COUNT = 6; 

// ---------------------------------------------------------------------------
// সংশোধিত BrandImage কম্পোনেন্ট (নির্দিষ্ট ৩টি cover এবং বাকিগুলো contain হবে)
// ---------------------------------------------------------------------------
const BrandImage = ({ src, alt, brandSlug, className = "" }) => {
  const isColoredBackground = ["omerta", "bir-chattala", "barcode-sweets"].includes(brandSlug);

  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
        isColoredBackground 
          ? "object-cover" // নির্দিষ্ট ৩টি লোগো ফুল উইডথ নিয়ে কভার করবে
          : "object-contain p-2" // বাকি সাধারণ লোগোগুলো কনটেইন ও প্যাডিং পাবে
      } ${className}`}
    />
  );
};

export const Home = () => {
  // ---------------------------------------------------------------------
  // States & Hooks
  // ---------------------------------------------------------------------
  const [brands, setBrands] = useState([]);
  const [previewBranches, setPreviewBranches] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [showAllBranches, setShowAllBranches] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [allFoods, setAllFoods] = useState([]);

  const [showAllPopular, setShowAllPopular] = useState(false);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const [activeSort, setActiveSort] = useState("popular");

  useEffect(() => {
    getAllBrands()
      .then(setBrands)
      .catch(() => setBrands([]));
    getFeaturedBranches(PREVIEW_COUNT).then(setPreviewBranches);
    getAllBranches().then(setAllBranches);
    getAllSlides().then(setHeroSlides);
    getAllFoods().then(setAllFoods);
  }, []);

  const sortTabs = [
    { id: "popular", label: "Popular" },
    { id: "price-low", label: "Price: Low to High" },
    { id: "price-high", label: "Price: High to Low" },
    { id: "rating", label: "Highest Rated" },
  ];

  const getEffectivePrice = (food) => applyFoodDiscount(food.price || 0, food);

  // Bestsellers Logic
  const totalPopularFoods = useMemo(() => {
    if (!allFoods || allFoods.length === 0) return [];
    let filteredList = allFoods.filter((food) => food.popular === true);

    if (activeSort === "price-low") {
      filteredList.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (activeSort === "price-high") {
      filteredList.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (activeSort === "rating") {
      filteredList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return filteredList;
  }, [allFoods, activeSort]);

  const previewPopularFoods = useMemo(() => totalPopularFoods.slice(0, PREVIEW_COUNT), [totalPopularFoods]);
  const remainingPopularFoods = useMemo(() => totalPopularFoods.slice(PREVIEW_COUNT), [totalPopularFoods]);

  // Featured Menu Logic
  const totalFeaturedMenu = useMemo(() => {
    return allFoods.filter((food) => food.isAdminFeatured === true);
  }, [allFoods]);

  const previewFeaturedMenu = useMemo(() => totalFeaturedMenu.slice(0, PREVIEW_COUNT), [totalFeaturedMenu]);
  const remainingFeaturedMenu = useMemo(() => totalFeaturedMenu.slice(PREVIEW_COUNT), [totalFeaturedMenu]);

  // Branches Logic
  const remainingBranches = useMemo(() => allBranches.slice(PREVIEW_COUNT), [allBranches]);

  // Brands Logic
  const previewBrands = useMemo(() => brands.slice(0, PREVIEW_COUNT), [brands]);
  const remainingBrands = useMemo(() => brands.slice(PREVIEW_COUNT), [brands]);

  const foodsById = useMemo(() => allFoods.reduce((map, food) => { map[food.id] = food; return map; }, {}), [allFoods]);

  const { addToCart, openCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  return (
    <div className="w-full">
      {/* GLOBAL MAINTENANCE NOTICE LINE */}
      <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-primary-600 text-white text-center py-2 px-4 text-xs font-semibold uppercase tracking-wider select-none">
        ⚠️ Notice: Our displayed products are not for sale (uploaded strictly for experimental purposes).
      </div>

      {/* 1. HERO BANNER CAROUSEL */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] bg-black overflow-hidden">
        {heroSlides.length > 0 && (
          <Swiper
            modules={[Autoplay, Navigation, Pagination, EffectFade]}
            effect={"fade"}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={true}
            loop={true}
            className="w-full h-full 
              [&_.swiper-button-next]:!bg-transparent [&_.swiper-button-prev]:!bg-transparent 
              [&_.swiper-button-next]:after:text-primary-500 [&_.swiper-button-prev]:after:text-primary-500 
              [&_.swiper-button-next]:after:!text-lg [&_.swiper-button-prev]:after:!text-lg"
          >
            {heroSlides.map((slide, index) => {
              const featuredFood = foodsById[slide.featuredFoodId];
              const showOrderButton = slide.type === "promo" && Boolean(featuredFood);

              return (
                <SwiperSlide key={slide.id ?? index} className="relative w-full h-full">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 ease-out transform scale-105"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 pb-6 sm:pb-8 gap-3">
                    <div className="max-w-3xl text-white flex flex-col items-center select-none pointer-events-none">
                      {slide.type === "promo" && (slide.offerText || (featuredFood && hasFoodDiscount(featuredFood))) && (
                        <span className="inline-block px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-wider mb-2.5 shadow-lg">
                          🔥 {slide.offerText || foodDiscountLabel(featuredFood)}
                        </span>
                      )}
                      <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                        {slide.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-250 mt-1 max-w-xl mx-auto drop-shadow-md">
                        {slide.subtitle}
                      </p>
                    </div>
                    {showOrderButton && (
                      <div className="z-10">
                        <button
                          onClick={() => { addToCart(featuredFood); openCart(); }}
                          className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold flex items-center gap-2 group shadow-xl transition-all duration-300 pointer-events-auto"
                        >
                          {slide.cta || "Order Now"}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </section>

      {/* 2. OUR BRANCHES SECTION */}
      <section className="max-w-7xl mx-auto px-2 pt-4 pb-0 sm:px-4 sm:pt-5 sm:pb-0 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5">
          <div className="flex-1 flex justify-start">
            <Link to="/branches" className="inline-block px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-primary-500 text-primary-500 font-semibold text-xs sm:text-sm whitespace-nowrap">
              Find Near Me
            </Link>
          </div>
          <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 text-center shrink-0 px-2">
            Our Branches
          </h2>
          <div className="flex-1 flex justify-end">
            {remainingBranches.length > 0 && (
              <button
                onClick={() => setShowAllBranches((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllBranches ? "Show Fewer" : "View All"}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllBranches ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </div>

        <div className="sm:hidden -mx-2">
          {previewBranches.length > 0 && (
            <Swiper slidesPerView={1.15} spaceBetween={16} className="!px-2 !pb-8">
              {previewBranches.map((branch) => (
                <SwiperSlide key={branch.id}>
                  <BranchCard branch={branch} variants={fadeInUp} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="hidden sm:grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6"
        >
          {previewBranches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} variants={fadeInUp} />
          ))}
        </motion.div>

        <AnimatePresence>
          {showAllBranches && remainingBranches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6"
              >
                {remainingBranches.map((branch) => (
                  <BranchCard key={branch.id} branch={branch} variants={fadeInUp} />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3. POPULAR FOODS SECTION (OUR BESTSELLERS) */}
      <section className="max-w-7xl mx-auto px-2 pt-8 pb-0 sm:px-4 sm:pt-10 sm:pb-0 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
            Our Bestsellers
          </h2>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1 md:justify-center">
            {sortTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSort(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeSort === tab.id ? "bg-primary-500 text-white shadow-md" : "bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="shrink-0 flex justify-end">
            {totalPopularFoods.length > PREVIEW_COUNT && (
              <button
                onClick={() => setShowAllPopular((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllPopular ? "Show Fewer" : "View All"}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllPopular ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </div>

        <motion.div
          key={activeSort}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
        >
          {previewPopularFoods.map((food) => (
            <FoodCard key={food.id} food={food} favorited={isFavorite(food.id)} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} variants={fadeInUp} />
          ))}
        </motion.div>

        <AnimatePresence>
          {showAllPopular && remainingPopularFoods.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6">
                {remainingPopularFoods.map((food) => (
                  <FoodCard key={food.id} food={food} favorited={isFavorite(food.id)} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} variants={fadeInUp} />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 4. FEATURED MENU SECTION */}
      <section className="max-w-7xl mx-auto px-2 pt-8 pb-8 sm:px-4 sm:pt-10 sm:pb-12 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
            Featured Menu
          </h2>
          <div className="flex justify-end">
            {remainingFeaturedMenu.length > 0 && (
              <button
                onClick={() => setShowAllFeatured((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllFeatured ? "Show Fewer" : "View All"}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllFeatured ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
        >
          {previewFeaturedMenu.map((food) => (
            <FoodCard key={food.id} food={food} favorited={isFavorite(food.id)} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} variants={fadeInUp} />
          ))}
        </motion.div>

        <AnimatePresence>
          {showAllFeatured && remainingFeaturedMenu.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6">
                {remainingFeaturedMenu.map((food) => (
                  <FoodCard key={food.id} food={food} favorited={isFavorite(food.id)} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} variants={fadeInUp} />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 5. OUR BRANDS SECTION */}
      {brands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-10 pb-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-neutral-800 dark:text-neutral-100">
              Our Family of Brands
            </h2>
            {remainingBrands.length > 0 && (
              <button
                onClick={() => setShowAllBrands((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllBrands ? "Show Fewer" : "View All"}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllBrands ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* ৬টি প্রিভিউ ব্র্যান্ড গ্রিড */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
          >
            {previewBrands.map((brand) => (
              <motion.div key={brand.id} variants={fadeInUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                <Link
                  to={`/brands/${brand.slug}`}
                  className="group flex flex-col rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-lg hover:border-primary-500/30 transition-all duration-350 overflow-hidden"
                >
                  <div className="w-full h-28 bg-white dark:bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-neutral-800/40 relative">
                    {brand.logo ? (
                      <BrandImage src={brand.logo} alt={brand.name} brandSlug={brand.slug} />
                    ) : (
                      <span className="font-display font-black text-primary-500 text-xl leading-none select-none">
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="py-2.5 px-3 text-center">
                    <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-tight group-hover:text-primary-500 transition-colors truncate max-w-full">
                      {brand.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* বাকি ব্র্যান্ডগুলো নিচে টগল হবে */}
          <AnimatePresence>
            {showAllBrands && remainingBrands.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6">
                  {remainingBrands.map((brand) => (
                    <motion.div key={brand.id} variants={fadeInUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                      <Link
                        to={`/brands/${brand.slug}`}
                        className="group flex flex-col rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-lg hover:border-primary-500/30 transition-all duration-350 overflow-hidden"
                      >
                        <div className="w-full h-28 bg-white dark:bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-neutral-800/40 relative">
                          {brand.logo ? (
                            <BrandImage src={brand.logo} alt={brand.name} brandSlug={brand.slug} />
                          ) : (
                            <span className="font-display font-black text-primary-500 text-xl leading-none select-none">
                              {brand.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="py-2.5 px-3 text-center">
                          <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-tight group-hover:text-primary-500 transition-colors truncate max-w-full">
                            {brand.name}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FoodCard Component
// ---------------------------------------------------------------------------
const FoodCard = memo(({ food, favorited, onToggleFavorite, onAddToCart, variants }) => {
  const hasDiscount = hasFoodDiscount(food);
  const discountedPrice = applyFoodDiscount(food.price || 0, food);

  return (
    <motion.div variants={variants} whileHover={{ y: -6 }} className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {hasDiscount && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-primary-500 text-white font-bold text-[10px] uppercase z-10">
            {foodDiscountLabel(food)}
          </div>
        )}
        <Link to={`/menu/${food.id}`} className="block w-full h-full">
          <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        </Link>
        <button onClick={() => onToggleFavorite(food.id)} className={`absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-neutral-900/80 z-10 ${favorited ? "text-red-500" : "text-neutral-450"}`}>
          <Heart className={`w-4 h-4 ${favorited ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className="p-4 grow flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-1 text-xs text-primary-500 font-medium mb-1">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{food.rating || 0}</span>
          </div>
          <Link to={`/menu/${food.id}`} className="block">
            <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors line-clamp-1">
              {food.name}
            </h3>
          </Link>
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex flex-wrap items-baseline gap-1">
            {hasDiscount ? (
              <>
                <span className="font-display font-extrabold text-red-500 text-base">৳{discountedPrice.toFixed(2)}</span>
                <span className="text-xs text-neutral-450 line-through">৳{(food.price || 0).toFixed(2)}</span>
              </>
            ) : (
              <span className="font-display font-extrabold text-primary-500 text-base">৳{(food.price || 0).toFixed(2)}</span>
            )}
          </div>
          <button onClick={() => onAddToCart(food)} className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary-500 text-neutral-700 dark:text-white transition-all duration-300">
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
FoodCard.displayName = "FoodCard";

// ---------------------------------------------------------------------------
// BranchCard Component
// ---------------------------------------------------------------------------
const BranchCard = memo(({ branch, variants }) => {
  return (
    <motion.div variants={variants} whileHover={{ y: -6 }} className="group flex flex-col justify-between rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Link to={`/branches/${branch.id}`}>
          <img src={branch.image} alt={branch.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </Link>
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-primary-500 text-[10px] font-bold text-white">
          ★ {branch.rating}
        </div>
      </div>
      <div className="p-4 grow flex flex-col justify-between gap-4">
        <div>
          <Link to={`/branches/${branch.id}`}>
            <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors mb-2 line-clamp-1">
              {branch.name}
            </h3>
          </Link>
          <div className="flex gap-2 items-start text-xs text-neutral-500">
            <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{branch.location}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Phone className="w-3.5 h-3.5 text-primary-500" />
            <span>Call</span>
          </div>
          <Link to={`/branches/${branch.id}`} className="text-primary-500 flex items-center gap-0.5 group">
            Details
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
});
BranchCard.displayName = "BranchCard";

export default Home;

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import FoodCard from "../components/FoodCard";
import {
  getFeaturedBranches,
  getAllBranches,
} from "../services/branchesService";
import { getPopularFoods, getAllFoods } from "../services/foodsService";
import { getAllSlides } from "../services/heroSlidesService";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const BRANCH_PREVIEW_COUNT = 6;

export const Home = () => {
  // ---------------------------------------------------------------------
  // States & Hooks
  // ---------------------------------------------------------------------
  const [previewBranches, setPreviewBranches] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [showAllBranches, setShowAllBranches] = useState(false);
  const [popularFoods, setPopularFoods] = useState([]);
  const [featuredMenu, setFeaturedMenu] = useState([]); // New state for Featured Menu
  const [heroSlides, setHeroSlides] = useState([]);
  const [allFoods, setAllFoods] = useState([]);

  const [activeSort, setActiveSort] = useState("popular");

  useEffect(() => {
    getFeaturedBranches(BRANCH_PREVIEW_COUNT).then(setPreviewBranches);
    getAllBranches().then(setAllBranches);
    getPopularFoods(8).then(setPopularFoods);
    // Fetching 6 items for the Featured Menu section
    getPopularFoods(6).then(setFeaturedMenu);
    getAllSlides().then(setHeroSlides);
    getAllFoods().then(setAllFoods);
  }, []);

  const sortTabs = [
    { id: "popular", label: "Popular" },
    { id: "price-low", label: "Price: Low to High" },
    { id: "price-high", label: "Price: High to Low" },
    { id: "rating", label: "Highest Rated" },
  ];

  const sortedPopularFoods = useMemo(() => {
    return [...popularFoods].sort((a, b) => {
      if (activeSort === "price-low") return a.price - b.price;
      if (activeSort === "price-high") return b.price - a.price;
      if (activeSort === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [popularFoods, activeSort]);

  const remainingBranches = useMemo(
    () => allBranches.slice(BRANCH_PREVIEW_COUNT),
    [allBranches],
  );

  const foodsById = useMemo(
    () =>
      allFoods.reduce((map, food) => {
        map[food.id] = food;
        return map;
      }, {}),
    [allFoods],
  );

  const { addToCart, openCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };
  return (
    <div className="w-full">
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
              [&_.swiper-button-next]:after:!text-lg [&_.swiper-button-prev]:after:!text-lg 
              [&_.swiper-button-prev]:!left-2 sm:[&_.swiper-button-prev]:!left-4 lg:[&_.swiper-button-prev]:!left-8
              [&_.swiper-button-next]:!right-2 sm:[&_.swiper-button-next]:!right-4 lg:[&_.swiper-button-next]:!right-8"
          >
            {heroSlides.map((slide, index) => {
              const featuredFood = foodsById[slide.featuredFoodId];
              const showOrderButton =
                slide.type === "promo" && Boolean(featuredFood);

              return (
                <SwiperSlide
                  key={slide.id ?? index}
                  className="relative w-full h-full"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 ease-out transform scale-105"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 pb-6 sm:pb-8 gap-3">
                    <div className="max-w-3xl text-white flex flex-col items-center select-none pointer-events-none">
                      {slide.type === "promo" &&
                        (slide.offerText ||
                          (featuredFood && featuredFood.discountPct > 0)) && (
                          <span className="inline-block px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-wider mb-2.5 shadow-lg shadow-red-500/35">
                            🔥{" "}
                            {slide.offerText ||
                              `${featuredFood.discountPct}% OFF`}
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
                          onClick={() => {
                            addToCart(featuredFood);
                            openCart();
                          }}
                          className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold flex items-center gap-2 group shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.03] active:scale-95 transition-all duration-300 pointer-events-auto"
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
            <Link
              to="/branches"
              className="inline-block px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-primary-500 text-primary-500 font-semibold hover:bg-primary-500/5 hover:scale-[1.03] active:scale-95 transition-all duration-300 text-xs sm:text-sm whitespace-nowrap"
            >
              Find Near Me
            </Link>
          </div>

          <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 text-center shrink-0 px-2">
            Our Branches
          </h2>

          <div className="flex-1 flex justify-end">
            {remainingBranches.length > 0 ? (
              <button
                onClick={() => setShowAllBranches((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllBranches ? "Show Fewer" : "View All"}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllBranches ? "rotate-180" : ""}`}
                />
              </button>
            ) : (
              <div className="w-1" />
            )}
          </div>
        </div>

        <div className="sm:hidden -mx-2">
          <Swiper
            modules={[Pagination]}
            slidesPerView={1.15}
            spaceBetween={16}
            pagination={{ clickable: true }}
            className="!px-2 !pb-8"
          >
            {previewBranches.map((branch) => (
              <SwiperSlide key={branch.id}>
                <BranchCard branch={branch} variants={fadeInUp} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <motion.div
          variants={staggerContainer}
          initial={false}
          animate="visible"
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
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <motion.div
                variants={staggerContainer}
                initial={false}
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6"
              >
                {remainingBranches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    variants={fadeInUp}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3. POPULAR FOODS SECTION (Our Bestsellers) */}
      <section className="max-w-7xl mx-auto px-2 pt-4 pb-0 sm:px-4 sm:pt-5 sm:pb-0 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
          <div className="shrink-0">
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
              Our Bestsellers
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1 sm:justify-center">
            {sortTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSort(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeSort === tab.id
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                    : "bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-primary-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="shrink-0 flex sm:justify-end">
            <Link
              to="/menu"
              className="flex items-center gap-1.5 text-primary-500 hover:text-primary-600 font-semibold group transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              View Full Menu
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        <motion.div
          key={activeSort}
          variants={staggerContainer}
          initial={false}
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {sortedPopularFoods.map((food) => {
            const favorited = isFavorite(food.id);
            return (
              <FoodCard
                key={food.id}
                food={food}
                favorited={favorited}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
                variants={fadeInUp}
              />
            );
          })}
        </motion.div>
      </section>

      {/* 4. FEATURED MENU SECTION (New Section) */}
      <section className="max-w-7xl mx-auto px-2 pt-4 pb-8 sm:px-4 sm:pt-5 sm:pb-12 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
            Featured Menu
          </h2>

          <Link
            to="/menu"
            className="flex items-center gap-1.5 text-primary-500 hover:text-primary-600 font-semibold group transition-colors text-xs sm:text-sm whitespace-nowrap"
          >
            Explore All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <motion.div
          variants={staggerContainer}
          initial={false}
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {featuredMenu.map((food) => {
            const favorited = isFavorite(food.id);
            return (
              <FoodCard
                key={food.id}
                food={food}
                favorited={favorited}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
                variants={fadeInUp}
              />
            );
          })}
        </motion.div>
      </section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BranchCard Component
// ---------------------------------------------------------------------------
const BranchCard = ({ branch, variants }) => (
  <motion.div
    variants={variants}
    whileHover={{ y: -6, transition: { duration: 0.2 } }}
    className="group flex flex-col justify-between rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-neutral-950/20 transition-all duration-300"
  >
    <Link
      to={`/branches/${branch.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={branch.image}
          alt={branch.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-primary-500 text-[10px] font-bold text-white uppercase tracking-wider">
          ★ {branch.rating}
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors mb-2 line-clamp-1">
            {branch.name}
          </h3>
          <div className="flex gap-2 items-start text-xs text-neutral-500 dark:text-neutral-400">
            <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{branch.location}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <Phone className="w-3.5 h-3.5 text-primary-500" />
            <span>Call</span>
          </div>
          <span className="text-primary-500 hover:text-primary-600 flex items-center gap-0.5 group">
            Details
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  </motion.div>
);

export default Home;

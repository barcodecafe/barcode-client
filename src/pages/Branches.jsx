import { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Phone, ArrowRight, ChevronDown } from 'lucide-react';
import { getAllBranches } from '../services/branchesService';
import { getAllRegions } from '../services/regionsService';
import { getAllFoods, applyFoodDiscount } from '../services/foodsService';

import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

// 💡 Global FoodCard Import
import FoodCard from '../components/FoodCard';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

const PREVIEW_COUNT = 5;

export const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('All');

  // Bestsellers & Featured Toggles & Sorting
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [activeSort, setActiveSort] = useState('popular');

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    Promise.all([getAllBranches(), getAllRegions(), getAllFoods()]).then(
      ([branchData, regionData, foodsData]) => {
        setBranches(branchData || []);
        setRegions(Array.isArray(regionData) ? regionData : []);
        setAllFoods(foodsData || []);
        setIsLoading(false);
      }
    );
  }, []);

  // Filters branches by search text + selected region (by regionId)
  const filteredBranches = useMemo(
    () =>
      branches.filter((branch) => {
        const matchesSearch =
          branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.location.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRegion = activeRegion === 'All' || branch.regionId === activeRegion;

        return matchesSearch && matchesRegion;
      }),
    [branches, searchQuery, activeRegion]
  );

  const regionTabs = [{ id: 'All', name: 'All' }, ...regions];

  const sortTabs = [
    { id: 'popular', label: 'Popular' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'rating', label: 'Highest Rated' },
  ];

  const getEffectivePrice = (food) => applyFoodDiscount(food.price || 0, food);

  // ---------------------------------------------------------------------
  // Bestsellers (Popular Foods) Logic
  // ---------------------------------------------------------------------
  const totalPopularFoods = useMemo(() => {
    if (!allFoods || allFoods.length === 0) return [];
    let filteredList = allFoods.filter((food) => food.popular === true);

    if (activeSort === 'price-low') {
      filteredList.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (activeSort === 'price-high') {
      filteredList.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (activeSort === 'rating') {
      filteredList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return filteredList;
  }, [allFoods, activeSort]);

  const previewPopularFoods = useMemo(
    () => totalPopularFoods.slice(0, PREVIEW_COUNT),
    [totalPopularFoods]
  );
  const remainingPopularFoods = useMemo(
    () => totalPopularFoods.slice(PREVIEW_COUNT),
    [totalPopularFoods]
  );

  // ---------------------------------------------------------------------
  // Featured Menu Logic
  // ---------------------------------------------------------------------
  const totalFeaturedMenu = useMemo(() => {
    return allFoods.filter((food) => food.isAdminFeatured === true);
  }, [allFoods]);

  const previewFeaturedMenu = useMemo(
    () => totalFeaturedMenu.slice(0, PREVIEW_COUNT),
    [totalFeaturedMenu]
  );
  const remainingFeaturedMenu = useMemo(
    () => totalFeaturedMenu.slice(PREVIEW_COUNT),
    [totalFeaturedMenu]
  );

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-2 py-8 sm:px-6 lg:px-8">
      {/* Filters and Search Bar Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2 sm:px-0">
        {/* Regions Horizontal Navigation Toggle */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {regionTabs.map((region) => (
            <button
              key={region.id}
              onClick={() => setActiveRegion(region.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                activeRegion === region.id
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-primary-500'
              }`}
            >
              {region.name}
            </button>
          ))}
        </div>

        {/* Input Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Main Content Showcase Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2 px-2 sm:px-0">
          Available Venues ({filteredBranches.length})
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden animate-pulse"
              >
                <div className="h-48 w-full bg-neutral-100 dark:bg-neutral-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl mx-2 sm:mx-0">
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              No branches match your search or filter.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Swiper Carousel */}
            <div className="sm:hidden -mx-2">
              <Swiper
                modules={[Pagination]}
                slidesPerView={1.15}
                spaceBetween={16}
                pagination={{ clickable: true }}
                className="!px-2 !pb-8"
              >
                {filteredBranches.map((branch) => (
                  <SwiperSlide key={branch.id}>
                    <BranchCard branch={branch} variants={fadeInUp} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Desktop View: Grid */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredBranches.map((branch) => (
                <BranchCard key={branch.id} branch={branch} variants={fadeInUp} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* OUR BESTSELLERS SECTION */}
      {/* ----------------------------------------------------------------- */}
      <section className="pt-12 sm:pt-16 pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60 px-2 sm:px-0">
          <div className="shrink-0">
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
              Our Bestsellers
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1 md:justify-center">
            {sortTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSort(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeSort === tab.id
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-primary-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="shrink-0 flex justify-end">
            {totalPopularFoods.length > PREVIEW_COUNT ? (
              <button
                onClick={() => setShowAllPopular((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllPopular ? 'Show Fewer' : 'View All'}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    showAllPopular ? 'rotate-180' : ''
                  }`}
                />
              </button>
            ) : (
              <div className="w-1" />
            )}
          </div>
        </div>

        {/* Mobile View: Swiper Slider */}
        <div className="sm:hidden -mx-2">
          {previewPopularFoods.length > 0 && (
            <Swiper
              key={activeSort}
              modules={[Pagination]}
              slidesPerView={1.15}
              spaceBetween={16}
              pagination={{ clickable: true }}
              className="!px-2 !pb-8"
            >
              {previewPopularFoods.map((food) => {
                const favorited = isFavorite(food.id);
                return (
                  <SwiperSlide key={food.id}>
                    <FoodCard
                      food={food}
                      favorited={favorited}
                      onToggleFavorite={toggleFavorite}
                      onAddToCart={addToCart}
                      variants={fadeInUp}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
        </div>

        {/* Desktop View: Grid */}
        {previewPopularFoods.length > 0 && (
          <motion.div
            key={activeSort}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {previewPopularFoods.map((food) => {
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
        )}

        {/* View All Expansion Grid */}
        <AnimatePresence>
          {showAllPopular && remainingPopularFoods.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 mt-4 sm:mt-6"
              >
                {remainingPopularFoods.map((food) => {
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
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FEATURED MENU SECTION */}
      {/* ----------------------------------------------------------------- */}
      <section className="pt-10 sm:pt-12 pb-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60 px-2 sm:px-0">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
            Featured Menu
          </h2>

          <div className="flex justify-end">
            {remainingFeaturedMenu.length > 0 ? (
              <button
                onClick={() => setShowAllFeatured((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllFeatured ? 'Show Fewer' : 'View All'}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    showAllFeatured ? 'rotate-180' : ''
                  }`}
                />
              </button>
            ) : (
              <div className="w-1" />
            )}
          </div>
        </div>

        {previewFeaturedMenu.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-none mx-2 sm:mx-0">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              No featured items available right now.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Swiper Slider */}
            <div className="sm:hidden -mx-2">
              <Swiper
                modules={[Pagination]}
                slidesPerView={1.15}
                spaceBetween={16}
                pagination={{ clickable: true }}
                className="!px-2 !pb-8"
              >
                {previewFeaturedMenu.map((food) => {
                  const favorited = isFavorite(food.id);
                  return (
                    <SwiperSlide key={food.id}>
                      <FoodCard
                        food={food}
                        favorited={favorited}
                        onToggleFavorite={toggleFavorite}
                        onAddToCart={addToCart}
                        variants={fadeInUp}
                      />
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Desktop View: Grid */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {previewFeaturedMenu.map((food) => {
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

            {/* View All Expansion Grid */}
            <AnimatePresence>
              {showAllFeatured && remainingFeaturedMenu.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 mt-4 sm:mt-6"
                  >
                    {remainingFeaturedMenu.map((food) => {
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
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </section>
    </div>
  );
};

// Reusable Branch Card Component with Details link & localStorage selection
const BranchCard = memo(({ branch, variants }) => {
  const handleDetailsClick = () => {
    localStorage.setItem('selectedBranchId', String(branch.id));
  };

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group flex flex-col justify-between h-full rounded-none border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-neutral-950/20 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Link to={`/branches/${branch.id}`}>
          <img
            src={branch.image}
            alt={branch.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-none bg-primary-500 text-[10px] font-bold text-white uppercase tracking-wider">
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
          <Link
            to={`/branches/${branch.id}`}
            onClick={handleDetailsClick}
            className="text-primary-500 hover:text-primary-650 flex items-center gap-0.5 group"
          >
            Details
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
});
BranchCard.displayName = 'BranchCard';

export default Branches;
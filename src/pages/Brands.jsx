import { useState, useEffect, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Store,
  ChevronDown,
} from "lucide-react";

import { getAllBrands } from "../services/brandsService";
import { getAllBranches } from "../services/branchesService";
import {
  getAllFoods,
  applyFoodDiscount,
} from "../services/foodsService";

import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

// 💡 Global FoodCard Import
import FoodCard from "../components/FoodCard";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

const PREVIEW_COUNT = 5;

export const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toggles & Sorting States
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [activeSort, setActiveSort] = useState("popular");

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    Promise.all([getAllBrands(), getAllBranches(), getAllFoods()])
      .then(([b, br, f]) => {
        setBrands(b || []);
        setBranches(br || []);
        setAllFoods(f || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const branchCountByBrand = useMemo(() => {
    const m = {};
    branches.forEach((br) => {
      if (br.brandId != null) m[br.brandId] = (m[br.brandId] || 0) + 1;
    });
    return m;
  }, [branches]);

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

  const previewPopularFoods = useMemo(
    () => totalPopularFoods.slice(0, PREVIEW_COUNT),
    [totalPopularFoods]
  );
  const remainingPopularFoods = useMemo(
    () => totalPopularFoods.slice(PREVIEW_COUNT),
    [totalPopularFoods]
  );

  // Featured Menu Logic
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
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
      {/* BRAND HEADER & GRID */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
          Our Brands
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 sm:mt-3">
          One group, many flavours. Explore each brand in the Barcode Restaurant family and find your favourite.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-none bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <Store className="w-10 h-10 mx-auto stroke-1 mb-3" />
          <p className="text-sm">No brands have been added yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Brands Swiper Slider */}
          <div className="sm:hidden -mx-2">
            <Swiper
              modules={[Pagination]}
              slidesPerView={1.15}
              spaceBetween={16}
              pagination={{ clickable: true }}
              className="!px-2 !pb-8"
            >
              {brands.map((brand) => (
                <SwiperSlide key={brand.id}>
                  <BrandMainCard brand={brand} branchCount={branchCountByBrand[brand.id] || 0} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop View: Brands Grid */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {brands.map((brand) => (
              <motion.div
                key={brand.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <BrandMainCard brand={brand} branchCount={branchCountByBrand[brand.id] || 0} />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* OUR BESTSELLERS SECTION */}
      {/* ----------------------------------------------------------------- */}
      <section className="pt-12 sm:pt-16 pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
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
                className={`px-3.5 py-2 rounded-none text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeSort === tab.id
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                    : "bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-primary-500"
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
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllPopular ? "Show Fewer" : "View All"}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllPopular ? "rotate-180" : ""}`}
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
              animate={{ opacity: 1, height: "auto" }}
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
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
            Featured Menu
          </h2>

          <div className="flex justify-end">
            {remainingFeaturedMenu.length > 0 ? (
              <button
                onClick={() => setShowAllFeatured((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                {showAllFeatured ? "Show Fewer" : "View All"}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllFeatured ? "rotate-180" : ""}`}
                />
              </button>
            ) : (
              <div className="w-1" />
            )}
          </div>
        </div>

        {previewFeaturedMenu.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-none">
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
                  animate={{ opacity: 1, height: "auto" }}
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

// 💡 Top Brands Item Card Component
const BrandMainCard = memo(({ brand, branchCount }) => {
  return (
    <Link
      to={`/brands/${brand.slug}`}
      className="group flex flex-col h-full rounded-none border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* 🛠️ brand.logoLight-কে প্রথম অগ্রাধিকার (priority) দেয়া হয়েছে যেন এডমিনের লোগো কার্ডে শো করে */}
      <div className="relative h-36 bg-neutral-100 dark:bg-neutral-950 p-3 sm:p-4 flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-neutral-800/40">
        {brand.logoLight || brand.cover ? (
          <img
            src={brand.logoLight || brand.cover}
            alt={brand.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Building2 className="w-10 h-10 text-neutral-300 dark:text-neutral-700" />
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h2 className="font-display text-lg font-extrabold text-neutral-800 dark:text-white">
          {brand.name}
        </h2>
        {brand.tagline && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
            {brand.tagline}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-4">
          <span className="text-[11px] font-semibold text-neutral-400">
            {branchCount} branch{branchCount === 1 ? "" : "es"}
          </span>
          <span className="flex items-center gap-1 text-primary-500 font-semibold text-xs group-hover:gap-1.5 transition-all">
            Explore <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
});
BrandMainCard.displayName = "BrandMainCard";

export default Brands;


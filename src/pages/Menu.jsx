import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

import { getFoodsByBranch, getPopularFoods, applyFoodDiscount } from "../services/foodsService";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import FoodCard from "../components/FoodCard";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export const Menu = () => {
  const [foods, setFoods] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "All";

  const activeFilter = searchParams.get("filter");
  const popularOnly = activeFilter === "popular";

  const handleCategoryChange = (catName) => {
    const next = { category: catName };
    if (activeFilter) next.filter = activeFilter;
    setSearchParams(next);
  };

  const [sortBy, setSortBy] = useState("featured");

  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (popularOnly) getPopularFoods(100).then(setFoods);
    else getFoodsByBranch(null, 100).then(setFoods);
  }, [popularOnly]);

  // localStorage থেকে এডমিনের কাস্টম ক্যাটগরি অর্ডার আনা
  const sortedCategoriesList = useMemo(() => {
    const savedOrder = localStorage.getItem("custom_category_order");
    if (savedOrder) {
      try {
        return JSON.parse(savedOrder).map((c) => c?.trim()).filter(Boolean);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [foods]);

  const categories = useMemo(() => {
    if (!foods || foods.length === 0) return ["All"];

    const rawCats = foods.map((item) => item.category?.trim()).filter(Boolean);
    const uniqueCatsSet = new Set(rawCats);
    const currentUniqueCategories = Array.from(uniqueCatsSet);

    const finalSortedCategories = currentUniqueCategories.sort((a, b) => {
      const indexA = sortedCategoriesList.findIndex(
        (c) => c.toLowerCase() === a.toLowerCase()
      );
      const indexB = sortedCategoriesList.findIndex(
        (c) => c.toLowerCase() === b.toLowerCase()
      );

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ["All", ...finalSortedCategories];
  }, [foods, sortedCategoriesList]);

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [foods, categories]);

  const scroll = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 💡 AdminDishes ডাটা স্কিমা অনুযায়ী নিখুঁত প্রাইস হিসাবের ফাংশন
  const getEffectivePrice = (food) => {
    if (!food) return 0;

    let basePrice = Number(food.price) || 0;

    // ১. এডমিন স্কিমা অনুযায়ী food.variations চেক করা হচ্ছে
    const variationsList = Array.isArray(food.variations)
      ? food.variations
      : Array.isArray(food.variants)
      ? food.variants
      : [];

    if (variationsList.length > 0) {
      const validVarPrices = variationsList
        .map((v) => Number(v.price))
        .filter((p) => !isNaN(p) && p > 0);

      if (validVarPrices.length > 0) {
        const minVarPrice = Math.min(...validVarPrices);
        // যদি মেইন প্রাইস ০ হয় অথবা ভ্যারিয়েন্টের সর্বনিম্ন দাম মেইন প্রাইস থেকে কম হয়
        if (basePrice === 0 || minVarPrice < basePrice) {
          basePrice = minVarPrice;
        }
      }
    }

    // ২. ডিসকাউন্ট প্রয়োগ (Service function অথবা Direct Calculation)
    if (typeof applyFoodDiscount === "function") {
      const discounted = applyFoodDiscount(basePrice, food);
      if (!isNaN(discounted) && discounted >= 0) return Number(discounted);
    }

    // ৩. সেফটি ব্যাকআপ (AdminDishes discountType অনুসারে)
    let finalPrice = basePrice;
    if (food.discountType === "flat" && Number(food.discountAmount) > 0) {
      finalPrice = Math.max(0, basePrice - Number(food.discountAmount));
    } else if (food.discountType === "percent" && Number(food.discountPct) > 0) {
      finalPrice = Math.max(
        0,
        basePrice - (basePrice * Number(food.discountPct)) / 100
      );
    }

    return finalPrice;
  };

  // 💡 ফিল্টারিং এবং সর্টিং
  const filteredFoods = useMemo(() => {
    const matched = foods.filter(
      (food) =>
        activeCategory.trim().toLowerCase() === "all" ||
        food.category?.trim().toLowerCase() === activeCategory.trim().toLowerCase()
    );

    return [...matched].sort((a, b) => {
      const priceA = getEffectivePrice(a);
      const priceB = getEffectivePrice(b);
      const ratingA = Number(a?.rating) || 0;
      const ratingB = Number(b?.rating) || 0;

      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "rating") return ratingB - ratingA;

      // Default / Featured Order
      const catA = a.category?.trim().toLowerCase() || "";
      const catB = b.category?.trim().toLowerCase() || "";
      const indexA = sortedCategoriesList.findIndex((c) => c.toLowerCase() === catA);
      const indexB = sortedCategoriesList.findIndex((c) => c.toLowerCase() === catB);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }, [foods, activeCategory, sortBy, sortedCategoriesList]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-neutral-100 dark:border-neutral-800/40 w-full overflow-hidden">
        <div className="text-center md:text-left min-w-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight truncate">
            {popularOnly ? "Popular Items" : "Our Menu Categories"}
          </h2>
          <div className="h-1 w-16 bg-primary-500 mx-auto md:mx-0 mt-2 rounded-full" />
          {popularOnly && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2.5">
              Our team's picks and what customers order most.{" "}
              <Link to="/menu" className="text-primary-500 font-semibold hover:underline">
                View the full menu
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Catalog Filters Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8 pb-4 border-b border-neutral-200/50 dark:border-neutral-800/60">
        <div className="relative flex items-center max-w-full lg:max-w-[70%] xl:max-w-[75%] flex-grow group">
          {categories.length > 8 && showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 z-10 p-1.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 shadow-md hover:text-primary-500 transition-all backdrop-blur-sm"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div
            ref={tabsRef}
            onScroll={checkScroll}
            className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none w-full scroll-smooth px-1"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shrink-0 ${
                  activeCategory.trim().toLowerCase() === cat.trim().toLowerCase()
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                    : "bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-primary-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {categories.length > 8 && showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 z-10 p-1.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 shadow-md hover:text-primary-500 transition-all backdrop-blur-sm"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-end">
          <div className="relative flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl px-2.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer pr-1 font-semibold focus:ring-0 text-neutral-700 dark:text-neutral-200"
            >
              <option value="featured" className="dark:bg-neutral-900">Featured</option>
              <option value="price-low" className="dark:bg-neutral-900">Price: Low to High</option>
              <option value="price-high" className="dark:bg-neutral-900">Price: High to Low</option>
              <option value="rating" className="dark:bg-neutral-900">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Foods Section */}
      {filteredFoods.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">
            No dishes matches your filters.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View: Swiper Slider */}
          <div className="sm:hidden -mx-4">
            <Swiper
              key={`${activeCategory}-${sortBy}`}
              modules={[Pagination]}
              slidesPerView={1.15}
              spaceBetween={16}
              pagination={{ clickable: true }}
              className="!px-4 !pb-8"
            >
              {filteredFoods.map((food) => (
                <SwiperSlide key={food.id}>
                  <FoodCard
                    food={food}
                    favorited={isFavorite(food.id)}
                    onToggleFavorite={toggleFavorite}
                    onAddToCart={addToCart}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop & Tablet View: Grid */}
          <motion.div
            key={`${activeCategory}-${sortBy}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {filteredFoods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                favorited={isFavorite(food.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
                variants={itemVariants}
              />
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Menu;
import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  ShoppingBag,
  SlidersHorizontal,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getFoodsByBranch } from "../services/foodsService";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

export const Menu = () => {
  const [foods, setFoods] = useState([]);
  
  // FIX 1: নির্দিষ্ট কোন ব্রাঞ্চ আইডি (যেমন ০ বা অন্য কিছু) না নিয়ে স্পষ্ট করে null রাখা হলো 
  // যাতে গ্লোবাল কোনো ব্রাঞ্চ আইডি একে প্রভাবিত করতে না পারে এবং অল-ব্রাঞ্চ মেনু আসে।
  const selectedBranchId = null; 
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  // Arrow visibility states
  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    // FIX 2: প্রথম প্যারামিটার explicitely null পাঠানো নিশ্চিত করা হলো যেন ব্যাকএন্ড সব ব্রাঞ্চের কম্বাইন্ড ডেটা পাঠায়
    getFoodsByBranch(null, 100).then(setFoods);
  }, []);

  // 1. Load Admin Sort Order from LocalStorage & Map categories exactly like admin
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
  }, [foods]);

  // 2. Dynamic sorted unique categories generation for the Horizontal Tab Bar
  const categories = useMemo(() => {
    if (!foods || foods.length === 0) return ["All"];
    
    const rawCats = foods.map((item) => item.category?.trim()).filter(Boolean);
    const uniqueCatsSet = new Set(rawCats);
    const currentUniqueCategories = Array.from(uniqueCatsSet);

    const finalSortedCategories = currentUniqueCategories.sort((a, b) => {
      const indexA = sortedCategoriesList.findIndex(c => c.toLowerCase() === a.toLowerCase());
      const indexB = sortedCategoriesList.findIndex(c => c.toLowerCase() === b.toLowerCase());
      
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

  // 3. Filter & Apply Admin Sorting to the main foods rendering grid
  const filteredFoods = useMemo(() => {
    const matched = foods.filter(
      (food) => activeCategory === "All" || food.category?.trim().toLowerCase() === activeCategory.trim().toLowerCase(),
    );

    return matched.sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;

      const indexA = sortedCategoriesList.findIndex(c => c.toLowerCase() === a.category?.trim().toLowerCase());
      const indexB = sortedCategoriesList.findIndex(c => c.toLowerCase() === b.category?.trim().toLowerCase());
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.id - b.id;
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
            Our Menu Categories
          </h2>
          <div className="h-1 w-16 bg-primary-500 mx-auto md:mx-0 mt-2 rounded-full" />
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
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shrink-0 ${
                  activeCategory === cat
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

      {/* Main Foods Grid */}
      {filteredFoods.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">
            No dishes matches your filters.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
        >
          {filteredFoods.map((food) => {
            const favorited = isFavorite(food.id);
            const hasDiscount = food.discountPct > 0;
            const discountedPrice = hasDiscount
              ? food.price * (1 - food.discountPct / 100)
              : food.price;

            // FIX 3: যেহেতু এটি All Branches Menu, নির্দিষ্ট কোনো ব্রাঞ্চের ফিল্টারড স্টক দেখানোর পরিবর্তে 
            // হেড অফিসের এভেলেবল মোট সেন্ট্রাল স্টক (food.baseStock) কে ব্যবহার করা হলো।
            const stock = food.baseStock !== undefined ? food.baseStock : 0;
            const isOutOfStock = stock <= 0;

            return (
              <motion.div
                key={food.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-neutral-950/20 transition-all duration-300"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-primary-500 text-white font-bold text-[10px] uppercase shadow-lg shadow-red-500/35 z-10 pointer-events-none">
                      {food.discountPct}% OFF
                    </div>
                  )}
                  <Link to={`/menu/${food.id}`} className="block w-full h-full">
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </Link>

                  <button
                    onClick={() => toggleFavorite(food.id)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-neutral-900/80 transition-colors z-10 ${
                      favorited ? "text-red-500" : "text-neutral-400 hover:text-red-500"
                    }`}
                    aria-label={favorited ? `Remove ${food.name} from favorites` : `Add ${food.name} to favorites`}
                    aria-pressed={favorited}
                  >
                    <Heart className={`w-4 h-4 ${favorited ? "fill-current" : ""}`} />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4 flex-grow flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                      <span className="uppercase tracking-wider">{food.category}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide ${isOutOfStock ? "bg-red-500/10 text-red-500 border border-red-500/10" : "bg-green-500/10 text-green-500 border border-green-500/10"}`}
                        >
                          {isOutOfStock ? "Sold Out" : `Qty: ${stock}`}
                        </span>
                        <div className="flex items-center gap-0.5 text-primary-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{food.rating}</span>
                        </div>
                      </div>
                    </div>

                    <Link to={`/menu/${food.id}`} className="block">
                      <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors line-clamp-1">
                        {food.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light line-clamp-2">
                      {food.description}
                    </p>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 mt-1 font-display">
                    <div className="flex flex-wrap items-baseline gap-1">
                      {hasDiscount ? (
                        <>
                          <span className="font-extrabold text-red-500 text-base">
                            ৳{discountedPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-neutral-450 dark:text-neutral-500 line-through">
                            ৳{food.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-extrabold text-primary-500 text-base">
                          ৳{food.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => !isOutOfStock && addToCart(food, null)}
                      disabled={isOutOfStock}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:scale-[1.02] active:scale-95 shadow-md transition-all font-sans ${
                        isOutOfStock
                          ? "bg-neutral-150 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed shadow-none active:scale-100 hover:scale-100"
                          : "bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/10 hover:shadow-primary-500/25"
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {isOutOfStock ? "Sold Out" : "Order Now"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Menu;
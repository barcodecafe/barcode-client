import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom"; // CHANGE: Added Link and useSearchParams from react-router-dom
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getFoodsByBranch } from "../services/foodsService";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import FoodCard from "../components/FoodCard";

export const Menu = () => {
  const [foods, setFoods] = useState([]);

  // CHANGE: Added searchParams hook for reading/writing category query parameter
  const [searchParams, setSearchParams] = useSearchParams();
  
  // CHANGE: activeCategory now reads from URL search parameters instead of local state
  const activeCategory = searchParams.get("category") || "All";

  // CHANGE: Added helper function to update URL search parameters on category change
  const handleCategoryChange = (catName) => {
    setSearchParams({ category: catName });
  };

  const [sortBy, setSortBy] = useState("featured");

  // Arrow visibility states
  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
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
      (food) => activeCategory.trim().toLowerCase() === "all" || food.category?.trim().toLowerCase() === activeCategory.trim().toLowerCase(),
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
                onClick={() => handleCategoryChange(cat)} // CHANGE: Updated to handleCategoryChange to update URL
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shrink-0 ${
                  activeCategory.trim().toLowerCase() === cat.trim().toLowerCase() // CHANGE: Case-insensitive styling comparison
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
      )}
    </div>
  );
};

export default Menu;
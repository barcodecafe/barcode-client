import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";

// Swiper imports (matching Home.jsx pattern)
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

import { useBrand } from "../context/BrandContext";
import { getBrandMenu } from "../services/brandsService";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import FoodCard from "../components/FoodCard";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// The brand's menu: dishes served at any of the brand's branches, grouped by
// category, reusing the same FoodCard as the group menu.
export const BrandMenu = () => {
  const brand = useBrand();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (!brand?.slug) return;
    getBrandMenu(brand.slug)
      .then((res) => setFoods(res?.foods || []))
      .catch(() => setFoods([]))
      .finally(() => setLoading(false));
  }, [brand?.slug]);

  const categories = useMemo(() => {
    const set = new Set(foods.map((f) => f.category?.trim()).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [foods]);

  const shown = useMemo(
    () => (activeCategory === "All" ? foods : foods.filter((f) => f.category?.trim() === activeCategory)),
    [foods, activeCategory],
  );

  if (!brand) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-primary-500" /> {brand.name} Menu
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Dishes available across {brand.name} branches.</p>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-primary-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => <div key={n} className="h-72 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
          <UtensilsCrossed className="w-8 h-8 mx-auto stroke-1 mb-2" />
          <p className="text-sm">No dishes available for {brand.name} yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Swiper Slider (Same as Home.jsx) */}
          <div className="sm:hidden -mx-4">
            <Swiper
              key={activeCategory}
              modules={[Pagination]}
              slidesPerView={1.15}
              spaceBetween={16}
              pagination={{ clickable: true }}
              className="!px-4 !pb-8"
            >
              {shown.map((food) => (
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
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {shown.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                favorited={isFavorite(food.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              />
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default BrandMenu;
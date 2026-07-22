import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { hasFoodDiscount, applyFoodDiscount, foodDiscountLabel } from "../services/foodsService";

// ---------------------------------------------------------------------------
// FoodCard — সম্পূর্ণ ১০০% স্কয়ার (rounded-none) শেপ
// ---------------------------------------------------------------------------
const FoodCard = ({ food, favorited, onToggleFavorite, onAddToCart, variants }) => {
  const hasVariants = Array.isArray(food.variations) && food.variations.length > 0;
  const basePrice = hasVariants
    ? Math.min(...food.variations.map((v) => Number(v.price) || 0))
    : food.price;
  const hasDiscount = hasFoodDiscount(food);
  const discountedPrice = applyFoodDiscount(basePrice, food);

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative flex h-full flex-col overflow-hidden rounded-none border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-sm transition-all duration-300 hover:border-primary-500/40 hover:shadow-md"
    >
      {/* ── Image ─────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Link to={`/menu/${food.id}`} className="block h-full w-full">
          <img
            src={food.image}
            alt={food.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Discount Badge: Sharp Corner */}
        {hasDiscount && (
          <span className="pointer-events-none absolute left-0 top-0 z-10 rounded-none bg-primary-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {foodDiscountLabel(food)}
          </span>
        )}

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(food.id)}
          aria-label={
            favorited
              ? `Remove ${food.name} from favorites`
              : `Add ${food.name} to favorites`
          }
          aria-pressed={favorited}
          className={`absolute right-2 top-2 z-20 rounded-none bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-colors dark:bg-neutral-900/80 ${
            favorited ? "text-red-500" : "text-neutral-400 hover:text-red-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* ── Info ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {food.category}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-amber-500">
            <Star className="h-3 w-3 fill-current" />
            {food.rating}
          </span>
        </div>

        <Link to={`/menu/${food.id}`} className="block">
          <h3 className="line-clamp-1 text-sm font-semibold text-neutral-800 transition-colors group-hover:text-primary-500 dark:text-neutral-100 sm:text-base">
            {food.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {food.description}
        </p>

        {/* ── Footer: price + order ───────────────────────────── */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col font-display">
            <span className="text-base sm:text-lg font-extrabold leading-tight text-primary-500">
              ৳{discountedPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] font-semibold leading-none text-neutral-400 line-through dark:text-neutral-500">
                ৳{basePrice.toFixed(2)}
              </span>
            )}
          </div>

          {hasVariants ? (
            <Link
              to={`/menu/${food.id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-none bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Choose
            </Link>
          ) : (
            <button
              onClick={() => onAddToCart(food)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-none bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Order
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FoodCard;
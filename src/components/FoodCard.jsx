import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
  Gift,
  Tag,
  Truck,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  hasFoodDiscount,
  applyFoodDiscount,
  foodDiscountLabel,
  getFoodOfferLabel,
} from "../services/foodsService";

// ---------------------------------------------------------------------------
// FoodCard — সম্পূর্ণ ১০০% স্কয়ার (rounded-none) শেপ + BOGO Offer Badge + Dynamic Promo Code Support + Branch Price Adjustment Support
// ---------------------------------------------------------------------------
const FoodCard = ({
  food,
  branchId,
  favorited,
  onToggleFavorite,
  onAddToCart,
  variants,
}) => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  // 🎯 Branch-based Price Adjustment Logic
  let rawBasePrice = Number(food?.price) || 0;
  let adjustVal = 0;
  if (
    branchId &&
    food?.branchPrices &&
    food.branchPrices[String(branchId)] !== undefined
  ) {
    adjustVal = Number(food.branchPrices[String(branchId)]) || 0;
  }

  const hasVariations =
    Array.isArray(food?.variations) && food.variations.length > 0;
  const hasAddons = Array.isArray(food?.addons) && food.addons.length > 0;
  const hasCustomizations = hasVariations || hasAddons;

  // 🎯 Calculate base price safely — never allow Infinity or NaN
  let basePrice = Math.max(0, rawBasePrice + adjustVal);
  if (hasVariations) {
    const validVarPrices = food.variations
      .map((v) => Number(v.price))
      .filter((p) => !isNaN(p) && p > 0)
      .map((p) => Math.max(0, p + adjustVal));

    if (validVarPrices.length > 0) {
      basePrice = Math.min(...validVarPrices);
    }
  }

  if (!Number.isFinite(basePrice) || isNaN(basePrice)) {
    basePrice = Math.max(0, rawBasePrice + adjustVal) || 0;
  }

  // 🎯 BOGO / Special Offer Check
  const offerLabel = getFoodOfferLabel(food);

  const hasDiscount = !offerLabel && hasFoodDiscount(food);
  const discountedPrice = hasDiscount
    ? applyFoodDiscount(basePrice, food)
    : basePrice;

  const foodId = food?.id !== undefined && food?.id !== null ? food.id : food?._id;
  const foodDetailLink = `/menu/${foodId}${branchId ? `?branchId=${branchId}` : ""}`;

  const handleCardClick = (e) => {
    // If the click is on a button or an interactive link, let it handle its own event
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    navigate(foodDetailLink);
  };

  // 🎯 International Restaurant Standard Sold Out Check
  const isSoldOut = food?.isAvailable === false;

  return (
    <motion.div
      variants={variants}
      whileHover={isSoldOut ? {} : { y: -3, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
      className={`group relative flex h-full flex-col overflow-hidden rounded-none border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-sm transition-all duration-300 hover:border-primary-500/40 hover:shadow-md cursor-pointer ${
        isSoldOut ? "opacity-90" : ""
      }`}
    >
      {/* ── Image ─────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Link to={foodDetailLink} className="block h-full w-full">
          <img
            src={food.image}
            alt={food.name}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 ${
              isSoldOut ? "grayscale opacity-75" : "group-hover:scale-105"
            }`}
          />
        </Link>

        {/* 🎯 Badge: International Restaurant Sold Out Badge */}
        {isSoldOut ? (
          <span className="pointer-events-none absolute left-0 top-0 z-10 flex items-center gap-1 rounded-none bg-rose-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
            🔴 Sold Out
          </span>
        ) : offerLabel ? (
          <span className="pointer-events-none absolute left-0 top-0 z-10 flex items-center gap-1 rounded-none bg-primary-600 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            <Gift className="h-3 w-3" /> {offerLabel}
          </span>
        ) : hasDiscount ? (
          <span className="pointer-events-none absolute left-0 top-0 z-10 rounded-none bg-primary-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {foodDiscountLabel(food)}
          </span>
        ) : null}

        {/* 🚚 Free Delivery Dish Badge */}
        {settings?.freeDeliveryEnabled &&
          (settings?.freeDeliveryScope === "all" ||
            settings?.freeDeliveryScope === "min_amount" ||
            (settings?.freeDeliveryScope === "categories" &&
              (settings?.freeDeliveryCategories || [])
                .map((c) => String(c).trim().toLowerCase())
                .includes(String(food.category || "").trim().toLowerCase())) ||
            (settings?.freeDeliveryScope === "dishes" &&
              (settings?.freeDeliveryDishIds || [])
                .map(Number)
                .includes(Number(foodId)))) && (
            <span className="pointer-events-none absolute left-0 bottom-0 z-10 flex items-center gap-1 rounded-none bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
              <Truck className="h-2.5 w-2.5" /> Free Delivery
            </span>
          )}

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(food.id || food._id)}
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
            <span>{food.rating || 4.5}</span>
            {food.reviewCount > 0 && (
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">
                ({food.reviewCount})
              </span>
            )}
          </span>
        </div>

        <Link to={foodDetailLink} className="block">
          <h3 className="line-clamp-1 text-sm font-semibold text-neutral-800 transition-colors group-hover:text-primary-500 dark:text-neutral-100 sm:text-base">
            {food.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {food.description}
        </p>

        {food.promoCode && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-none bg-primary-50 dark:bg-primary-950/30 px-2 py-1 border border-primary-200/60 dark:border-primary-900/40 text-[10px] text-primary-700 dark:text-primary-300 font-medium">
            <Tag className="h-3 w-3 shrink-0 text-primary-500" />
            <span>
              Use{" "}
              <strong className="font-mono font-bold">{food.promoCode}</strong>{" "}
              on payment!
            </span>
          </div>
        )}

        {/* ── Footer: price + order ───────────────────────────── */}
        <div className="mt-auto flex items-center justify-between gap-1 pt-3">
          {/* Price Section */}
          <div className="flex flex-col font-display min-w-0 flex-1">
            {hasVariations ? (
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">From</span>
                <span className="text-xs sm:text-sm md:text-base font-extrabold leading-tight text-primary-500 truncate">
                  ৳{discountedPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm md:text-base font-extrabold leading-tight text-primary-500 truncate">
                ৳{discountedPrice.toFixed(2)}
              </span>
            )}
            {hasDiscount && (
              <span className="text-[10px] font-semibold leading-none text-neutral-400 line-through dark:text-neutral-500 truncate">
                ৳{basePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Button Section */}
          {isSoldOut ? (
            <button
              disabled
              className="inline-flex shrink-0 items-center gap-1 rounded-none bg-neutral-200 dark:bg-neutral-800 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-300/50 dark:border-neutral-700/50"
            >
              Sold Out
            </button>
          ) : hasCustomizations ? (
            <Link
              to={foodDetailLink}
              className="inline-flex shrink-0 items-center gap-1 rounded-none bg-primary-500 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Choose
            </Link>
          ) : (
            <button
              onClick={() => {
                // 🎯 মূল ফুড অবজেক্ট পাঠানো হচ্ছে, ডাবল ডিসকাউন্ট রোধের জন্য কার্ট নিজে বেস প্রাইস থেকে হিসাব করবে
                onAddToCart(food, branchId);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-none bg-primary-500 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95"
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
import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  Star,
  ShoppingBag,
  Heart,
  ArrowLeft,
  Minus,
  Plus,
  Check,
  Zap,
} from "lucide-react";

// Swiper imports (matching Home.jsx pattern)
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

import {
  getFoodById,
  getPopularFoods,
  getActivePrice,
  applyFoodDiscount,
  hasFoodDiscount,
  foodDiscountLabel,
} from "../services/foodsService";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

// 💡 Shared Global FoodCard Component
import FoodCard from "../components/FoodCard";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export const DishDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, addToCart, updateCartQuantity, openCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [food, setFood] = useState(null);
  const [featuredMenu, setFeaturedMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Variations Tracking State
  const [selectedVariation, setSelectedVariation] = useState(null);

  const branchIdParam = searchParams.get("branchId");
  const branchId = branchIdParam ? Number(branchIdParam) : null;

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);
    Promise.all([getFoodById(id), getPopularFoods(6)])
      .then(([foodData, popularData]) => {
        setFood(foodData);
        setFeaturedMenu(popularData || []);

        // Auto select first variation if exists
        if (foodData && foodData.variations && foodData.variations.length > 0) {
          setSelectedVariation(foodData.variations[0]);
        } else {
          setSelectedVariation(null);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading dish detail:", err);
        setLoading(false);
      });
  }, [id]);

  // Check if this item is in cart
  const cartItem = food
    ? cart.find(
        (item) =>
          item.id === food.id &&
          ((!selectedVariation && !item.selectedVariation) ||
            (item.selectedVariation &&
              selectedVariation &&
              item.selectedVariation.name === selectedVariation.name)),
      )
    : null;

  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
      setIsAdded(true);
    } else {
      setQuantity(1);
      setIsAdded(false);
    }
  }, [cartItem, selectedVariation]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">
          Dish not found.
        </p>
        <button
          onClick={() => navigate("/menu")}
          className="px-5 py-2 rounded-none bg-primary-500 text-white font-bold text-sm shadow"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  const hasDiscount = hasFoodDiscount(food);
  const activePrice = getActivePrice(
    food,
    branchId,
    selectedVariation ? selectedVariation.name : null,
  );
  const discountedPrice = applyFoodDiscount(activePrice, food);

  const displayImage = selectedVariation?.image || food.image || "";

  const handleQuantityChange = (newQty) => {
    if (newQty < 1 || newQty > 99) return;
    setQuantity(newQty);
    if (isAdded && cartItem) {
      updateCartQuantity(food.id, newQty, selectedVariation);
    }
  };

  const handleAddToCartClick = () => {
    addToCart(food, branchId, selectedVariation, quantity);
    setIsAdded(true);
    openCart();
  };

  const recommendedFoods = featuredMenu
    .filter((f) => f.id !== food.id)
    .slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-primary-500 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Container (rounded-none) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-none p-6 sm:p-8 shadow-sm">
        {/* Left Section: Image Display (rounded-none) */}
        <div className="relative aspect-square rounded-none overflow-hidden bg-neutral-50 dark:bg-neutral-800">
          {hasDiscount && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-none bg-primary-500 text-white font-black text-xs uppercase shadow-lg shadow-red-500/35 z-10">
              {foodDiscountLabel(food)}
            </div>
          )}

          <img
            src={displayImage}
            alt={food.name}
            className="w-full h-full object-cover transition-all duration-300"
          />

          <button
            onClick={() => toggleFavorite(food.id)}
            className={`absolute top-4 right-4 p-2.5 rounded-none bg-white/90 dark:bg-neutral-900/90 shadow-md transition-all ${
              isFavorite(food.id)
                ? "text-red-500 scale-110"
                : "text-neutral-400 hover:text-red-500"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite(food.id) ? "fill-current" : ""}`}
            />
          </button>
        </div>

        {/* Right Section: Content Details */}
        <div className="flex flex-col justify-between py-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                {food.category}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-none">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{food.rating}</span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              {food.name}
            </h1>

            {/* Price Tags */}
            <div className="flex items-baseline gap-2 font-display">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-black text-red-500">
                    ৳{discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-base text-neutral-400 line-through">
                    ৳{activePrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-black text-primary-500">
                  ৳{activePrice.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              {food.description ||
                "No description available for this delicious item."}
            </p>

            {/* Variations (rounded-none) */}
            {food.variations && food.variations.length > 0 && (
              <div className="pt-2 space-y-2">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Choose {food.variantLabel || "Size"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {food.variations.map((v) => {
                    const isSelected =
                      selectedVariation && selectedVariation.name === v.name;
                    const vFull = getActivePrice(food, branchId, v.name);
                    const vPrice = applyFoodDiscount(vFull, food);
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVariation(v)}
                        className={`px-4 py-2.5 rounded-none border text-xs font-bold flex items-center gap-2 transition-all ${
                          isSelected
                            ? "bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20"
                            : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300"
                        }`}
                      >
                        {v.name} (৳{vPrice.toFixed(0)})
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/60 flex flex-row items-center gap-2 sm:gap-4">
            {/* Quantity Controls */}
            <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-none p-1 w-28 sm:w-36 h-12 shrink-0">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="w-8 sm:w-10 h-10 rounded-none flex items-center justify-center text-neutral-500 hover:bg-white dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 w-6 sm:w-8 text-center select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 99}
                className="w-8 sm:w-10 h-10 rounded-none flex items-center justify-center text-neutral-500 hover:bg-white dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCartClick}
              className={`flex-1 h-12 rounded-none font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 hover:scale-[1.01] active:scale-95 shadow-xl transition-all ${
                isAdded
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span className="truncate">Update Qty ({quantity})</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span className="truncate">Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Items Section */}
      {recommendedFoods.length > 0 && (
        <section className="mt-16 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/50 pb-3">
            <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> You
              Might Also Like
            </h2>
            
            {/* 💡 ৫ টার বেশি কার্ড থাকলে কেবল View All বাটন দেখাবে */}
            {recommendedFoods.length > 5 && (
              <Link
                to="/menu"
                className="text-xs font-bold text-primary-500 hover:underline"
              >
                View All
              </Link>
            )}
          </div>

          {/* Mobile View: Swiper Slider */}
          <div className="sm:hidden -mx-4">
            <Swiper
              modules={[Pagination]}
              slidesPerView={1.15}
              spaceBetween={16}
              pagination={{ clickable: true }}
              className="!px-4 !pb-8"
            >
              {recommendedFoods.map((recFood) => {
                const favorited = isFavorite(recFood.id);
                return (
                  <SwiperSlide key={recFood.id}>
                    <FoodCard
                      food={recFood}
                      branchId={branchId}
                      favorited={favorited}
                      onToggleFavorite={toggleFavorite}
                      onAddToCart={addToCart}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* Desktop & Tablet View: Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recommendedFoods.map((recFood) => {
              const favorited = isFavorite(recFood.id);
              return (
                <FoodCard
                  key={recFood.id}
                  food={recFood}
                  branchId={branchId}
                  favorited={favorited}
                  onToggleFavorite={toggleFavorite}
                  onAddToCart={addToCart}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default DishDetail;

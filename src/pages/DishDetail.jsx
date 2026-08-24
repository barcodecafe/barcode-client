import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Gift,
  Tag,
  MessageSquare,
  Trash2,
  User as UserIcon,
  Sparkles,
} from "lucide-react";

// Swiper imports (matching Home.jsx pattern)
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

import {
  getFoodById,
  getAllFoods,
  getPopularFoods,
  getActivePrice,
  applyFoodDiscount,
  hasFoodDiscount,
  foodDiscountLabel,
} from "../services/foodsService";
import {
  getFoodReviews,
  submitReview,
  deleteReview,
} from "../services/reviewsService";
import { socket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useBranch } from "../context/BranchContext";
import usePreviewCount from "../hooks/usePreviewCount";

// 💡 Shared Global FoodCard Component
import FoodCard from "../components/FoodCard";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export const DishDetail = () => {
  const previewCount = usePreviewCount();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, addToCart, updateCartQuantity, openCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { selectedBranchId } = useBranch();

  const [food, setFood] = useState(null);
  const foodRef = useRef(food);
  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  const [featuredMenu, setFeaturedMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Variations Tracking State
  const [selectedVariation, setSelectedVariation] = useState(null);

  // 🎯 Addons Tracking State
  const [selectedAddons, setSelectedAddons] = useState([]);

  const toggleAddon = (addon) => {
    if (!addon) return;
    const name = typeof addon === "string" ? addon : (addon.name || addon.title || "");
    if (!name || !String(name).trim()) return;
    const targetKey = String(name).trim().toLowerCase();

    setSelectedAddons((prev) => {
      const exists = (prev || []).some(
        (a) => (a?.name || "").trim().toLowerCase() === targetKey,
      );
      if (exists) {
        return (prev || []).filter(
          (a) => (a?.name || "").trim().toLowerCase() !== targetKey,
        );
      } else {
        const itemToAdd =
          typeof addon === "object"
            ? {
                name: String(name).trim(),
                price: Number(addon.price) || 0,
                group: addon.group || "",
                image: addon.image || "",
              }
            : { name: String(name).trim(), price: 0, group: "", image: "" };
        return [...(prev || []), itemToAdd];
      }
    });
  };

  // 🎯 ব্রাঞ্চ আইডি ডিটেক্ট করার জন্য সঠিক প্রায়োরিটি অর্ডার
  const branchIdParam = searchParams.get("branchId");
  const storedBranch =
    localStorage.getItem("selectedBranchId") ||
    localStorage.getItem("branchId");

  const branchId = branchIdParam 
    ? Number(branchIdParam) 
    : selectedBranchId 
    ? Number(selectedBranchId)
    : storedBranch 
    ? Number(storedBranch) 
    : null;
  
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    totalReviews: 0,
    averageRating: 4.5,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ error: "", success: "" });
  const [userHoverRating, setUserHoverRating] = useState(0);

  const loadReviews = () => {
    getFoodReviews(id)
      .then((data) => {
        if (data) setReviewsData(data);
      })
      .catch((err) => console.error("Error loading food reviews:", err));
  };

  const loadDishData = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        let foodData = null;
        try {
          foodData = await getFoodById(id);
        } catch (e) {
          console.warn("Direct getFoodById failed, trying catalog fallback:", e);
        }

        if (!foodData) {
          try {
            const all = await getAllFoods();
            const foodsList = Array.isArray(all) ? all : Array.isArray(all?.foods) ? all.foods : [];
            foodData = foodsList.find(
              (f) =>
                String(f.id) === String(id) ||
                String(f._id) === String(id) ||
                (f.name && f.name.toLowerCase().trim() === String(id).toLowerCase().trim())
            ) || null;
          } catch (e) {
            console.warn("Catalog fallback search failed:", e);
          }
        }

        if (foodData && foodData.isActive === false) {
          foodData = null;
        }

        setFood(foodData);
      } catch (err) {
        console.error("Error loading dish detail:", err);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    loadDishData(true);

    // Non-blocking secondary loads
    getPopularFoods(12)
      .then((popularData) => {
        setFeaturedMenu(Array.isArray(popularData) ? popularData : popularData?.foods || []);
      })
      .catch(() => {
        setFeaturedMenu([]);
      });

    getFoodReviews(id)
      .then((reviewsRes) => {
        if (reviewsRes) setReviewsData(reviewsRes);
      })
      .catch(() => {});

    // ⚡ Real-Time WebSocket Listener for instant zero-refresh updates
    const handleFoodUpdate = (payload) => {
      if (payload && payload.food) {
        const updated = payload.food;
        const currentDishIdentifier = String(id).toLowerCase().trim();
        const currentDishSlug = currentDishIdentifier.replace(/\s+/g, "-");

        const loadedFood = foodRef.current;
        const loadedId = loadedFood ? String(loadedFood.id || loadedFood._id).toLowerCase().trim() : "";
        const loadedName = loadedFood?.name ? String(loadedFood.name).toLowerCase().trim() : "";
        const loadedSlug = loadedName.replace(/\s+/g, "-");

        const updatedId = String(updated.id || "").toLowerCase().trim();
        const updatedMongoId = String(updated._id || "").toLowerCase().trim();
        const updatedName = updated.name ? String(updated.name).toLowerCase().trim() : "";
        const updatedSlug = updatedName.replace(/\s+/g, "-");

        const matchesThisDish =
          updatedId === currentDishIdentifier ||
          updatedMongoId === currentDishIdentifier ||
          updatedName === currentDishIdentifier ||
          updatedSlug === currentDishSlug ||
          (loadedId && (updatedId === loadedId || updatedMongoId === loadedId)) ||
          (loadedName && (updatedName === loadedName || updatedSlug === loadedSlug));

        if (matchesThisDish) {
          if (updated.isActive === false) {
            setFood(null);
          } else {
            setFood((prev) => (prev ? { ...prev, ...updated } : { ...updated }));
          }
          return;
        }
      }
      loadDishData(false);
    };

    socket.on("foods_updated", handleFoodUpdate);
    socket.on("categories_updated", handleFoodUpdate);

    return () => {
      socket.off("foods_updated", handleFoodUpdate);
      socket.off("categories_updated", handleFoodUpdate);
    };
  }, [id, loadDishData]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReviewMsg({ error: "Please log in to submit a review.", success: "" });
      return;
    }
    setSubmittingReview(true);
    setReviewMsg({ error: "", success: "" });
    try {
      await submitReview({
        foodId: Number(food.id || food._id),
        rating: ratingInput,
        comment: commentInput.trim(),
      });
      setCommentInput("");
      setReviewMsg({ error: "", success: "Thank you! Your review has been submitted." });
      loadReviews();
      // Reload food to update average rating in header
      getFoodById(id).then((f) => {
        if (f) setFood(f);
      });
    } catch (err) {
      setReviewMsg({ error: err.message || "Failed to submit review", success: "" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(reviewId);
      loadReviews();
      getFoodById(id).then((f) => {
        if (f) setFood(f);
      });
    } catch (err) {
      alert(err.message || "Failed to delete review");
    }
  };

  // Check if this item is in cart
  const cartItem = food
    ? cart.find(
        (item) =>
          String(item.id || item._id) === String(food.id || food._id) &&
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

  const groupedFoodAddons = useMemo(() => {
    if (!Array.isArray(food?.addons) || food.addons.length === 0) return [];

    const groupMap = new Map();
    food.addons.forEach((rawAddon) => {
      if (!rawAddon) return;
      const name =
        typeof rawAddon === "string"
          ? rawAddon
          : rawAddon.name || rawAddon.title || "";
      if (!name || !String(name).trim()) return;

      const cleanName = String(name).trim();
      const price =
        typeof rawAddon === "object" &&
        rawAddon.price !== undefined &&
        rawAddon.price !== null
          ? Number(rawAddon.price) || 0
          : 0;
      const group =
        typeof rawAddon === "object" && rawAddon.group
          ? String(rawAddon.group).trim()
          : "";

      const normalizedAddon = {
        name: cleanName,
        price,
        group,
        image: typeof rawAddon === "object" ? rawAddon.image || "" : "",
      };

      const gName = group || "";
      if (!groupMap.has(gName)) {
        groupMap.set(gName, []);
      }
      groupMap.get(gName).push(normalizedAddon);
    });

    return Array.from(groupMap.entries()).map(([groupName, items]) => ({
      groupName: groupName || null,
      items,
    }));
  }, [food?.addons]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="site-container min-h-[70vh] flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">
          Dish not found.
        </p>
        <button
          onClick={() => navigate("/menu")}
          className="px-5 py-2 rounded-none bg-primary-500 text-white font-bold text-sm shadow cursor-pointer"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  // 🎯 BOGO Offer Text Helper
  const getOfferLabel = (offerType) => {
    if (offerType === "bogo_1g1") return "BUY 1 GET 1 FREE";
    if (offerType === "bogo_1g2") return "BUY 1 GET 2 FREE";
    if (offerType === "combo") return "SPECIAL COMBO";
    return null;
  };

  const offerLabel = getOfferLabel(food?.offerType);
  const hasDiscount = hasFoodDiscount(food) && (!food?.offerType || food.offerType === "none");

  const activePrice = Number(
    getActivePrice(
      food,
      branchId,
      selectedVariation ? selectedVariation.name : null,
    ),
  ) || 0;
  const rawDiscountedPrice = typeof applyFoodDiscount === "function"
    ? applyFoodDiscount(activePrice, food)
    : activePrice;
  const discountedPrice = Number(rawDiscountedPrice) || 0;

  // 🎯 Add-ons Price Calculation
  const addonsPriceTotal = (selectedAddons || []).reduce(
    (sum, a) => sum + (Number(a?.price) || 0),
    0,
  );
  const totalActivePrice = activePrice + addonsPriceTotal;
  const totalDiscountedPrice = discountedPrice + addonsPriceTotal;

  const displayImage = selectedVariation?.image || food.image || "";

  const handleQuantityChange = (newQty) => {
    if (newQty < 1 || newQty > 99) return;
    setQuantity(newQty);
    if (isAdded && cartItem) {
      updateCartQuantity(food.id || food._id, newQty, selectedVariation);
    }
  };

  const handleAddToCartClick = () => {
    addToCart(food, branchId, selectedVariation, quantity, selectedAddons);
    setIsAdded(true);
    openCart();
  };

  const recommendedFoods = (featuredMenu || []).filter(
    (f) => f && f.isActive !== false && String(f?.id || f?._id) !== String(food?.id || food?._id)
  );

  const isSoldOut = food ? (food.isAvailable === false || food.isAvailable === "false") : false;

  return (
    /* 🎯 Global site-container class applied */
    <div className="site-container py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-primary-500 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-none p-6 sm:p-8 shadow-sm">
        {/* Left Section: Image Display */}
        <div className="relative aspect-square rounded-none overflow-hidden bg-neutral-50 dark:bg-neutral-800">
          
          {/* 🎯 Sold Out / BOGO Offer / Discount Badge */}
          {isSoldOut ? (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-none bg-rose-600 text-white font-black text-xs uppercase shadow-lg z-10 flex items-center gap-1.5">
              🔴 Sold Out Today
            </div>
          ) : offerLabel ? (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-none bg-primary-600 text-white font-black text-xs uppercase shadow-lg shadow-purple-600/35 z-10 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              <span>{offerLabel}</span>
            </div>
          ) : (
            /* Standard Discount Badge (Red) */
            hasDiscount && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-none bg-primary-500 text-white font-black text-xs uppercase shadow-lg shadow-red-500/35 z-10">
                {foodDiscountLabel(food)}
              </div>
            )
          )}

          <img
            src={displayImage}
            alt={food?.name || "Dish"}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isSoldOut ? "grayscale opacity-75" : ""
            }`}
          />

          <button
            onClick={() => toggleFavorite(food?.id || food?._id)}
            className={`absolute top-4 right-4 p-2.5 rounded-none bg-white/90 dark:bg-neutral-900/90 shadow-md transition-all cursor-pointer ${
              isFavorite(food?.id || food?._id)
                ? "text-red-500 scale-110"
                : "text-neutral-400 hover:text-red-500"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite(food?.id || food?._id) ? "fill-current" : ""}`}
            />
          </button>
        </div>

        {/* Right Section: Content Details */}
        <div className="flex flex-col justify-between py-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {food?.category || "Menu"}
                </span>

                {/* 🎯 Extra Badge under Title for Offer */}
                {offerLabel && (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-none bg-primary-100 dark:bg-purple-950/60 text-primary-700 dark:text-primary-300 uppercase tracking-wider border border-primary-200 dark:border-primary-800/60 flex items-center gap-1">
                    <Gift className="w-3 h-3" /> {offerLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-none">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{reviewsData?.averageRating ? Number(reviewsData.averageRating).toFixed(1) : (food?.rating || 4.5)}</span>
                  {reviewsData?.totalReviews > 0 && (
                    <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      ({reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              {food?.name}
            </h1>

            {/* Price Tags */}
            <div className="flex items-baseline gap-2 font-display">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-black text-red-500">
                    ৳{totalDiscountedPrice.toFixed(2)}
                  </span>
                  <span className="text-base text-neutral-400 line-through">
                    ৳{totalActivePrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-black text-primary-500">
                  ৳{totalActivePrice.toFixed(2)}
                </span>
              )}
              {addonsPriceTotal > 0 && (
                <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-none">
                  (Includes +৳{addonsPriceTotal} add-ons)
                </span>
              )}
            </div>

            {/* 🎯 Dynamic Promotional Coupon Code Information Box */}
            {food.promoCode && (
              <div className="flex items-center gap-2 rounded-none bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <Tag className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Use coupon <strong className="font-mono font-black">{food.promoCode}</strong> during payment to get special discounts!
                </span>
              </div>
            )}

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              {food.description ||
                "No description available for this delicious item."}
            </p>

            {/* Variations */}
            {Array.isArray(food?.variations) && food.variations.length > 0 && (
              <div className="pt-2 space-y-2">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Choose {food?.variantLabel || "Size"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {food.variations.filter(Boolean).map((v, vIdx) => {
                    const isSelected =
                      selectedVariation && selectedVariation.name === v.name;
                    const vFull = getActivePrice(food, branchId, v.name);
                    const vPrice = applyFoodDiscount(vFull, food);
                    return (
                      <button
                        key={v.name || vIdx}
                        type="button"
                        onClick={() => setSelectedVariation((prev) => (prev?.name === v.name ? null : v))}
                        className={`px-3.5 py-2 rounded-none border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20"
                            : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300"
                        }`}
                      >
                        {v.image && (
                          <img
                            src={v.image}
                            alt={v.name}
                            className="w-5 h-5 rounded-xs object-cover shrink-0"
                          />
                        )}
                        <span>{v.name} (৳{Number(vPrice || 0).toFixed(0)})</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🎯 Add-ons & Extras Section */}
            {Array.isArray(groupedFoodAddons) && groupedFoodAddons.length > 0 && (
              <div className="pt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Add-ons & Extras (Optional)
                  </h3>
                  {selectedAddons.length > 0 && (
                    <span className="text-xs font-bold text-primary-500">
                      +{selectedAddons.length} selected (+৳{addonsPriceTotal})
                    </span>
                  )}
                </div>

                {groupedFoodAddons.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-2">
                    {group.groupName && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                          {group.groupName}
                        </span>
                        <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(group.items || []).filter(Boolean).map((addon, aIdx) => {
                        const isChecked = (selectedAddons || []).some(
                          (a) =>
                            (a?.name || "").trim().toLowerCase() ===
                            (addon?.name || "").trim().toLowerCase(),
                        );
                        return (
                          <button
                            key={addon.name || aIdx}
                            type="button"
                            onClick={() => toggleAddon(addon)}
                            className={`p-3 rounded-none border text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${
                              isChecked
                                ? "bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-900 dark:text-primary-200 shadow-xs"
                                : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div
                                className={`w-4 h-4 rounded-none border flex items-center justify-center transition-colors shrink-0 ${
                                  isChecked
                                    ? "bg-primary-500 border-primary-500 text-white"
                                    : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                }`}
                              >
                                {isChecked && (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )}
                              </div>
                              <span className="truncate">{addon.name}</span>
                            </div>
                            <span className="font-mono font-extrabold text-primary-600 dark:text-primary-400 shrink-0 ml-2">
                              +৳{Number(addon.price || 0).toFixed(0)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 🎯 Real-time Item Price & Subtotal Breakdown Box */}
            <div className="mt-4 p-3.5 bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2 rounded-none">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span>Base Dish ({selectedVariation ? selectedVariation.name : 'Standard'}):</span>
                <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                  ৳{discountedPrice.toFixed(2)}
                </span>
              </div>

              {selectedAddons.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Selected Add-ons ({selectedAddons.length}):</span>
                    <span className="font-mono font-bold">+৳{addonsPriceTotal.toFixed(2)}</span>
                  </div>
                  <div className="pl-2 space-y-0.5">
                    {selectedAddons.map((addon, aIdx) => (
                      <div key={aIdx} className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>• {addon.name}</span>
                        <span className="font-mono">+৳{Number(addon.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-baseline justify-between text-xs font-bold text-neutral-900 dark:text-white">
                <div className="flex items-baseline gap-1.5">
                  <span>Subtotal</span>
                  <span className="text-[11px] font-normal text-neutral-400">({quantity} × ৳{totalDiscountedPrice.toFixed(2)})</span>
                </div>
                <span className="text-base font-black font-display text-primary-500">
                  ৳{(totalDiscountedPrice * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800/60 flex flex-row items-center gap-2 sm:gap-4">
            {/* Quantity Controls */}
            <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-none p-1 w-28 sm:w-36 h-12 shrink-0">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="w-8 sm:w-10 h-10 rounded-none flex items-center justify-center text-neutral-500 hover:bg-white dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
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
                className="w-8 sm:w-10 h-10 rounded-none flex items-center justify-center text-neutral-500 hover:bg-white dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            {isSoldOut ? (
              <button
                type="button"
                disabled
                className="flex-1 h-12 rounded-none font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-300/50 dark:border-neutral-700/50"
              >
                Sold Out Today
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToCartClick}
                className={`flex-1 h-12 rounded-none font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 hover:scale-[1.01] active:scale-95 shadow-xl transition-all cursor-pointer ${
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
            )}
          </div>
        </div>
      </div>

      {/* ── Customer Reviews & Ratings Section ── */}
      <section className="mt-12 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/50 pb-3">
          <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" /> Customer Reviews & Ratings
          </h2>
          <span className="text-xs font-bold text-neutral-400">
            {reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? "Review" : "Reviews"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Rating Summary Card */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-none shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Rating Overview</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-neutral-900 dark:text-white font-display">
                {reviewsData.averageRating ? Number(reviewsData.averageRating).toFixed(1) : "4.5"}
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(reviewsData.averageRating || 4.5)
                          ? "fill-current"
                          : "text-neutral-200 dark:text-neutral-700 stroke-1"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400">
                  {reviewsData.totalReviews > 0
                    ? `Based on ${reviewsData.totalReviews} customer ratings`
                    : "Base rating (0 customer reviews yet)"}
                </p>
              </div>
            </div>

            {/* Star Distribution Progress Bars */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewsData.ratingCounts?.[star] || 0;
                const pct = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="w-6 font-bold flex items-center gap-0.5 shrink-0">
                      {star} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    </span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[11px] text-neutral-400 shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write a Review Box / Form */}
          <div className="lg:col-span-2 p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-none shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" /> Write Your Review
            </h3>

            {reviewMsg.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs">
                {reviewMsg.error}
              </div>
            )}
            {reviewMsg.success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs">
                {reviewMsg.success}
              </div>
            )}

            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">
                    Your Rating:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        onMouseEnter={() => setUserHoverRating(star)}
                        onMouseLeave={() => setUserHoverRating(0)}
                        className="p-1 text-amber-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        title={`${star} Star`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (userHoverRating || ratingInput)
                              ? "fill-current text-amber-500"
                              : "text-neutral-300 dark:text-neutral-700"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300 ml-2">
                      {ratingInput} Star{ratingInput > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5">
                    Your Feedback (Optional):
                  </label>
                  <textarea
                    rows={3}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Tell other foodies about taste, portion, freshness, or packaging..."
                    className="w-full p-3 rounded-none border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                    maxLength={1000}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-400">
                    Posting as: <strong>{user?.name || user?.email || "Valued Customer"}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 rounded-none bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-none bg-neutral-50 dark:bg-neutral-950 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Please sign in with your account to rate this food and share your review.
                </p>
                <Link
                  to={`/login?redirect=/menu/${id}`}
                  className="px-4 py-2 bg-primary-500 text-white font-bold text-xs rounded-none hover:bg-primary-600 transition-colors shrink-0"
                >
                  Log In to Review
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3 pt-2">
          {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
            reviewsData.reviews.map((rev) => {
              const isOwner = user && (String(rev.userId) === String(user._id || user.id));
              return (
                <div
                  key={rev.id || rev._id}
                  className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-none shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-none bg-primary-50 dark:bg-primary-950/60 border border-primary-200/60 dark:border-primary-800/60 flex items-center justify-center text-primary-600 dark:text-primary-400 font-extrabold text-xs uppercase shrink-0">
                        {rev.userName ? rev.userName.charAt(0) : <UserIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                          {rev.userName || "Customer"}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= rev.rating
                                    ? "fill-current"
                                    : "text-neutral-200 dark:text-neutral-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Recently"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(isOwner || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleReviewDelete(rev.id || rev._id)}
                        className="p-1.5 rounded-none text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 pl-10 leading-relaxed font-light">
                      {rev.comment}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-none text-neutral-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No customer reviews yet. Be the first to try and review this delicious item!
            </div>
          )}
        </div>
      </section>

      {/* Recommended Items Section */}
      {recommendedFoods.length > 0 && (
        <section className="mt-16 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/50 pb-3">
            <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> You
              Might Also Like
            </h2>
            
            {recommendedFoods.length > previewCount && (
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
              {recommendedFoods.slice(0, previewCount).map((recFood, rIdx) => {
                if (!recFood) return null;
                const recId = recFood.id || recFood._id || rIdx;
                const favorited = isFavorite(recId);
                return (
                  <SwiperSlide key={recId}>
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
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-6">
            {recommendedFoods.slice(0, previewCount).map((recFood, rIdx) => {
              if (!recFood) return null;
              const recId = recFood.id || recFood._id || rIdx;
              const favorited = isFavorite(recId);
              return (
                <FoodCard
                  key={recId}
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
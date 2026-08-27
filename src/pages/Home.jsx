import { useState, useEffect, useMemo, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Truck,
  ShoppingBag,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useFulfillment } from "../context/FulfillmentContext";
import { getAllBranches } from "../services/branchesService";
import {
  getAllFoods,
  hasFoodDiscount,
  foodDiscountLabel,
  applyFoodDiscount,
  parseOfferTextToDiscount,
} from "../services/foodsService";
import { getAllSlides } from "../services/heroSlidesService";
import { getAllBrands } from "../services/brandsService";
import { socket } from "../services/socket";

// 💡 Global FoodCard Import
import FoodCard from "../components/FoodCard";
import usePreviewCount from "../hooks/usePreviewCount";
import { useVisiblePolling } from "../hooks/useVisiblePolling";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

export const Home = () => {
  const navigate = useNavigate();
  const previewCount = usePreviewCount();
  const { isPickup, selectedBranch, openFulfillmentModal, ensureFulfillmentSelected } = useFulfillment();
  const [brands, setBrands] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [showAllBranches, setShowAllBranches] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAllPopular, setShowAllPopular] = useState(false);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const [activeSort, setActiveSort] = useState("popular");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadAllData = () => {
      Promise.all([
        getAllBrands().catch(() => []),
        getAllBranches().catch(() => []),
        getAllSlides().catch(() => []),
        getAllFoods().catch(() => []),
      ]).then(([brandsData, branchesData, slidesData, foodsData]) => {
        if (!isMounted) return;

        const sortedBrands = Array.isArray(brandsData)
          ? [...brandsData].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
          : [];
        setBrands(sortedBrands);

        const sortedBranches = Array.isArray(branchesData) ? branchesData : [];
        setAllBranches(sortedBranches);

        setHeroSlides(Array.isArray(slidesData) ? slidesData : []);
        setAllFoods(Array.isArray(foodsData) ? foodsData : []);
        setIsLoading(false);
      });
    };

    loadAllData();

    // ⚡ Real-Time WebSocket Listeners for zero-refresh dynamic live sync
    const handleBrandsUpdated = () => {
      getAllBrands().then((brandsData) => {
        if (!isMounted) return;
        const sortedBrands = Array.isArray(brandsData)
          ? [...brandsData].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
          : [];
        setBrands(sortedBrands);
      }).catch(() => {});
    };

    const handleBranchesUpdated = () => {
      getAllBranches().then((branchesData) => {
        if (!isMounted) return;
        const sortedBranches = Array.isArray(branchesData) ? branchesData : [];
        setAllBranches(sortedBranches);
      }).catch(() => {});
    };

    const handleFoodsUpdated = () => {
      getAllFoods().then((foodsData) => {
        if (!isMounted) return;
        setAllFoods(Array.isArray(foodsData) ? foodsData : []);
      }).catch(() => {});
    };

    const handleSlidesUpdated = () => {
      getAllSlides().then((slidesData) => {
        if (!isMounted) return;
        setHeroSlides(Array.isArray(slidesData) ? slidesData : []);
      }).catch(() => {});
    };

    socket.on("brands_updated", handleBrandsUpdated);
    socket.on("branches_updated", handleBranchesUpdated);
    socket.on("foods_updated", handleFoodsUpdated);
    socket.on("categories_updated", handleFoodsUpdated);
    socket.on("slides_updated", handleSlidesUpdated);
    socket.on("hero_slides_updated", handleSlidesUpdated);

    // ⚡ 0.1ms Instant Cross-Tab Broadcast Channel
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('barcode_realtime');
        bc.onmessage = (event) => {
          if (event.data?.type === 'HERO_SLIDES_UPDATED') {
            handleSlidesUpdated();
          }
        };
      }
    } catch {}

    // ⚡ Instant Refetch when user switches or clicks into the tab
    const handleFocus = () => {
      handleSlidesUpdated();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      socket.off("brands_updated", handleBrandsUpdated);
      socket.off("branches_updated", handleBranchesUpdated);
      socket.off("foods_updated", handleFoodsUpdated);
      socket.off("categories_updated", handleFoodsUpdated);
      socket.off("slides_updated", handleSlidesUpdated);
      socket.off("hero_slides_updated", handleSlidesUpdated);
      if (bc) bc.close();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // ⚡ Bulletproof Background Sync: Refresh hero slides every 60s when tab is visible (WebSockets already push updates instantly)
  useVisiblePolling(
    () => {
      getAllSlides()
        .then((slidesData) => {
          setHeroSlides(Array.isArray(slidesData) ? slidesData : []);
        })
        .catch(() => {});
    },
    { intervalMs: 60000, enabled: true }
  );

  const sortTabs = [
    { id: "popular", label: "Popular" },
    { id: "price-low", label: "Price: Low to High" },
    { id: "price-high", label: "Price: High to Low" },
    { id: "rating", label: "Highest Rated" },
  ];

  const getEffectivePrice = (food) => {
    if (!food) return 0;

    let basePrice = Number(food.price) || 0;

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
        if (basePrice === 0 || minVarPrice < basePrice) {
          basePrice = minVarPrice;
        }
      }
    }

    return applyFoodDiscount(basePrice, food);
  };

  const previewBranches = useMemo(
    () => allBranches.slice(0, previewCount),
    [allBranches, previewCount],
  );
  const remainingBranches = useMemo(
    () => allBranches.slice(previewCount),
    [allBranches, previewCount],
  );

  const previewBrands = useMemo(
    () => brands.slice(0, previewCount),
    [brands, previewCount],
  );
  const remainingBrands = useMemo(
    () => brands.slice(previewCount),
    [brands, previewCount],
  );

  const totalPopularFoods = useMemo(() => {
    if (!allFoods || allFoods.length === 0) return [];
    
    let filteredList = allFoods.filter(
      (food) => food.popular === true && food.isActive !== false
    );

    return [...filteredList].sort((a, b) => {
      const priceA = getEffectivePrice(a);
      const priceB = getEffectivePrice(b);

      if (activeSort === "price-low") return priceA - priceB;
      if (activeSort === "price-high") return priceB - priceA;
      if (activeSort === "rating") return (Number(b.rating) || 0) - (Number(a.rating) || 0);

      return (a.order ?? 999) - (b.order ?? 999);
    });
  }, [allFoods, activeSort]);

  const previewPopularFoods = useMemo(
    () => totalPopularFoods.slice(0, previewCount),
    [totalPopularFoods, previewCount],
  );
  const remainingPopularFoods = useMemo(
    () => totalPopularFoods.slice(previewCount),
    [totalPopularFoods, previewCount],
  );

  const totalFeaturedMenu = useMemo(() => {
    return allFoods
      .filter((food) => food.isAdminFeatured === true && food.isActive !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [allFoods]);

  const previewFeaturedMenu = useMemo(
    () => totalFeaturedMenu.slice(0, previewCount),
    [totalFeaturedMenu, previewCount],
  );
  const remainingFeaturedMenu = useMemo(
    () => totalFeaturedMenu.slice(previewCount),
    [totalFeaturedMenu, previewCount],
  );

  const foodsById = useMemo(
    () =>
      allFoods.reduce((map, food) => {
        if (!food) return map;
        if (food.id !== undefined && food.id !== null) {
          map[food.id] = food;
          map[String(food.id)] = food;
        }
        if (food._id !== undefined && food._id !== null) {
          map[food._id] = food;
          map[String(food._id)] = food;
        }
        return map;
      }, {}),
    [allFoods],
  );

  const { addToCart, openCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 },
    },
  };

  const activeHeroSlides = useMemo(() => {
    if (!heroSlides || heroSlides.length === 0) return [];
    const now = new Date();
    return heroSlides.filter((slide) => {
      // 1. Ambient slides (Atmosphere) are permanent
      if (slide.type === 'ambient') return true;

      // 2. If the slide itself has an endDate that has passed, auto-hide it from public view
      if (slide.endDate && new Date(slide.endDate) < now) return false;
      if (slide.startDate && new Date(slide.startDate) > now) return false;

      // 3. If the slide is linked to a food dish with a discount timer that expired, auto-hide it
      const slideFoodKey = slide.featuredFoodId !== undefined && slide.featuredFoodId !== null ? slide.featuredFoodId : null;
      const featuredFood = slideFoodKey ? (foodsById[slideFoodKey] || foodsById[String(slideFoodKey)]) : null;
      if (featuredFood?.discountEndDate && new Date(featuredFood.discountEndDate) < now) {
        return false;
      }

      return true;
    });
  }, [heroSlides, foodsById]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      {/* 1. HERO CAROUSEL SECTION */}
      {/* 🎯 Sticky Mobile App Navigation Bar ও Desktop Header-এর উচ্চতার সমান স্পেসিং */}
      <section className="relative w-full h-[62vh] sm:h-[70vh] md:h-[80vh] min-h-[440px] max-h-[750px] overflow-hidden bg-neutral-900 shadow-2xl">
        {activeHeroSlides.length > 0 ? (
          <Swiper
            modules={[Autoplay, Pagination, Navigation, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            speed={1200}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: false,
            }}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !w-2.5 !h-2.5 !bg-white/50 !opacity-100 transition-all duration-300",
              bulletActiveClass: "!w-8 !rounded-full !bg-primary-500 !shadow-lg !shadow-primary-500/50",
            }}
            navigation={true}
            loop={activeHeroSlides.length > 1}
            observer={true}
            observeParents={true}
            className="w-full h-full 
              [&_.swiper-button-next]:!bg-transparent [&_.swiper-button-prev]:!bg-transparent 
              [&_.swiper-button-next]:after:text-primary-500 [&_.swiper-button-prev]:after:text-primary-500 
              [&_.swiper-button-next]:after:!text-lg [&_.swiper-button-prev]:after:!text-lg 
              [&_.swiper-button-prev]:!left-2 sm:[&_.swiper-button-prev]:!left-4 lg:[&_.swiper-button-prev]:!left-8
              [&_.swiper-button-next]:!right-2 sm:[&_.swiper-button-next]:!right-4 lg:[&_.swiper-button-next]:!right-8"
          >
            {activeHeroSlides.map((slide, index) => {
              const slideFoodKey = slide.featuredFoodId !== undefined && slide.featuredFoodId !== null ? slide.featuredFoodId : null;
              const featuredFood = slideFoodKey ? (foodsById[slideFoodKey] || foodsById[String(slideFoodKey)]) : null;
              const showOrderButton = slide.type === "promo" || Boolean(slide.cta);

              const hasActiveDiscount = featuredFood && hasFoodDiscount(featuredFood);

              return (
                <SwiperSlide
                  key={slide.id ?? index}
                  className="relative w-full h-full"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 ease-out transform scale-105"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 pb-6 sm:pb-8 gap-3">
                    <div className="max-w-3xl text-white flex flex-col items-center select-none pointer-events-none">
                      {/* 🔥 Badges & Price Tag Bar */}
                      <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
                        {slide.type === "promo" && (slide.offerText || hasActiveDiscount) && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-lg shadow-red-500/40">
                            🔥 {slide.offerText || foodDiscountLabel(featuredFood)}
                          </span>
                        )}

                        {slide.type === "promo" && featuredFood && (
                          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-xl">
                            {hasActiveDiscount ? (
                              <>
                                <span className="text-xs text-neutral-300 line-through font-semibold">
                                  ৳{Number(featuredFood.price || 0).toFixed(0)}
                                </span>
                                <span className="text-sm sm:text-base font-black text-amber-400">
                                  ৳{getEffectivePrice(featuredFood).toFixed(0)}
                                </span>
                                {Number(featuredFood.price || 0) > getEffectivePrice(featuredFood) && (
                                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    Save ৳{(Number(featuredFood.price || 0) - getEffectivePrice(featuredFood)).toFixed(0)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-sm sm:text-base font-black text-amber-400">
                                ৳{Number(featuredFood.price || 0).toFixed(0)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                        {slide.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-250 mt-1 max-w-xl mx-auto drop-shadow-md">
                        {slide.subtitle}
                      </p>
                    </div>

                    {showOrderButton && (
                      <div className="z-10">
                        <button
                          onClick={() => {
                            if (typeof ensureFulfillmentSelected === 'function' && !ensureFulfillmentSelected()) {
                              return;
                            }
                            if (featuredFood) {
                              let foodToOrder = { ...featuredFood };
                              if (slide.offerText && !hasFoodDiscount(featuredFood)) {
                                const parsed = parseOfferTextToDiscount(slide.offerText);
                                if (parsed) {
                                  foodToOrder = {
                                    ...foodToOrder,
                                    discountType: parsed.discountType,
                                    discountPct: parsed.discountPct || 0,
                                    discountAmount: parsed.discountAmount || 0,
                                  };
                                }
                              }
                              addToCart(foodToOrder);
                              openCart();
                            } else {
                              navigate("/menu");
                            }
                          }}
                          className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold flex items-center gap-2 group shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.03] active:scale-95 transition-all duration-300 pointer-events-auto cursor-pointer"
                        >
                          {slide.cta || "Order Now"}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        ) : (
          <div className="w-full h-full bg-neutral-900 animate-pulse" />
        )}
      </section>

      {/* 🎯 Upfront Fulfillment Selector Bar */}
      <section className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white py-3.5 px-4 shadow-xl relative z-20 border-y border-primary-400/30">
        <div className="site-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-white text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 text-white flex items-center justify-center shrink-0 shadow-sm backdrop-blur-xs">
              {isPickup ? <ShoppingBag className="w-5 h-5 text-white" /> : <Truck className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 text-white px-2 py-0.5 rounded shadow-xs border border-white/20">
                  Order Fulfillment Mode
                </span>
                <span className="text-xs font-extrabold text-white">
                  {isPickup ? `🛍️ Self-Pickup (${selectedBranch?.name || "Select Branch Outlet"})` : "🚚 Home Delivery"}
                </span>
              </div>
              <p className="text-[11px] text-white/90 font-medium mt-0.5">
                {isPickup
                  ? `Pick up your food directly from ${selectedBranch?.name || "our branch counter"} with ৳0 delivery charge.`
                  : "Order online and get your food delivered hot & fresh to your doorstep."}
              </p>
            </div>
          </div>

          <button
            onClick={openFulfillmentModal}
            className="px-4 py-2.5 rounded-xl bg-white text-primary-600 hover:bg-neutral-100 font-extrabold text-xs transition-all active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-black/10"
          >
            <span>{isPickup ? "Change Branch Outlet" : "Switch to Self-Pickup"}</span>
            <ChevronRight className="w-4 h-4 text-primary-600" />
          </button>
        </div>
      </section>

      {/* 2. OUR BRANCHES SECTION */}
      {/* 🎯 Clean site-container applied */}
      <section className="site-container pt-4 pb-0 sm:pt-5 sm:pb-0">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5">
          <div className="flex-1 flex justify-start">
            <Link
              to="/branches"
              className="inline-block px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-primary-500 text-primary-500 font-semibold hover:bg-primary-500/5 hover:scale-[1.03] active:scale-95 transition-all duration-300 text-xs sm:text-sm whitespace-nowrap"
            >
              Find Near Me
            </Link>
          </div>

          <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 text-center shrink-0 px-2">
            Our Branches
          </h2>

          <div className="flex-1 flex justify-end">
            {remainingBranches.length > 0 ? (
              <button
                onClick={() => setShowAllBranches((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap cursor-pointer"
              >
                {showAllBranches ? "Show Fewer" : "View All"}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllBranches ? "rotate-180" : ""}`}
                />
              </button>
            ) : (
              <div className="w-1" />
            )}
          </div>
        </div>

        {/* Mobile View: Carousel */}
        <div className="sm:hidden -mx-4">
          {previewBranches.length > 0 && (
            <Swiper
              modules={[Pagination]}
              slidesPerView={1.15}
              spaceBetween={16}
              pagination={{ clickable: true }}
              className="!px-4 !pb-8"
            >
              {previewBranches.map((branch) => (
                <SwiperSlide key={branch.id}>
                  <BranchCard branch={branch} variants={fadeInUp} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Desktop View: Grid */}
        {previewBranches.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="hidden sm:grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-6"
          >
            {previewBranches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} variants={fadeInUp} />
            ))}
          </motion.div>
        )}

        {/* View All Expansion Grid */}
        <AnimatePresence>
          {showAllBranches && remainingBranches.length > 0 && (
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
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-3 sm:gap-6 mt-4 sm:mt-6"
              >
                {remainingBranches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    variants={fadeInUp}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3. POPULAR FOODS SECTION (OUR BESTSELLERS) */}
      {/* 🎯 Clean site-container applied */}
      <section className="site-container pt-8 pb-0 sm:pt-10 sm:pb-0">
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
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
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
            {totalPopularFoods.length > previewCount ? (
              <button
                onClick={() => setShowAllPopular((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap cursor-pointer"
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
        <div className="sm:hidden -mx-4">
          {previewPopularFoods.length > 0 && (
            <Swiper
              key={activeSort}
              modules={[Pagination]}
              slidesPerView={1.15}
              spaceBetween={16}
              pagination={{ clickable: true }}
              className="!px-4 !pb-8"
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
            className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-6"
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
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-3 sm:gap-6 mt-4 sm:mt-6"
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

      {/* 4. FEATURED MENU SECTION */}
      {/* 🎯 Clean site-container applied */}
      <section className="site-container pt-8 pb-8 sm:pt-10 sm:pb-12">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
            Featured Menu
          </h2>

          <div className="flex justify-end">
            {remainingFeaturedMenu.length > 0 ? (
              <button
                onClick={() => setShowAllFeatured((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap cursor-pointer"
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
            <div className="sm:hidden -mx-4">
              <Swiper
                modules={[Pagination]}
                slidesPerView={1.15}
                spaceBetween={16}
                pagination={{ clickable: true }}
                className="!px-4 !pb-8"
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
              className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-6"
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
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-3 sm:gap-6 mt-4 sm:mt-6"
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

      {/* 5. OUR BRANDS SECTION */}
      {/* 🎯 Clean site-container applied */}
      {brands.length > 0 && (
        <section className="site-container pt-8 pb-8 sm:pt-10 sm:pb-12">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/60">
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
              Our Family of Brands
            </h2>
            <div className="flex justify-end">
              {brands.length > previewCount ? (
                <button
                  onClick={() => setShowAllBrands((v) => !v)}
                  className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 font-semibold hover:border-primary-500 hover:text-primary-500 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs sm:text-sm shadow-sm whitespace-nowrap cursor-pointer"
                >
                  {showAllBrands ? "Show Fewer" : "View All"}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllBrands ? "rotate-180" : ""}`}
                  />
                </button>
              ) : (
                <div className="w-1" />
              )}
            </div>
          </div>

          {/* Mobile View: Swiper Slider */}
          <div className="sm:hidden -mx-4">
            {previewBrands.length > 0 && (
              <Swiper
                modules={[Pagination]}
                slidesPerView={1.15}
                spaceBetween={16}
                pagination={{ clickable: true }}
                className="!px-4 !pb-8"
              >
                {previewBrands.map((brand) => (
                  <SwiperSlide key={brand.id}>
                    <BrandCard brand={brand} variants={fadeInUp} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* Desktop View: Grid */}
          {previewBrands.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-6"
            >
              {previewBrands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} variants={fadeInUp} />
              ))}
            </motion.div>
          )}

          {/* View All Expansion Grid */}
          <AnimatePresence>
            {showAllBrands && remainingBrands.length > 0 && (
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
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-6 4xl:grid-cols-6 gap-3 sm:gap-6 mt-4 sm:mt-6"
                >
                  {remainingBrands.map((brand) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      variants={fadeInUp}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
};

const BrandCard = memo(({ brand, variants }) => {
  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link
        to={`/brands/${brand.slug}`}
        className="group flex flex-col rounded-none border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-lg hover:border-primary-500/30 transition-all duration-350 overflow-hidden"
      >
        <div className="w-full h-28 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center border-b border-neutral-100 dark:border-neutral-800/40 p-3 sm:p-4 overflow-hidden">
          {brand.logoLight ? (
            <img
              src={brand.logoLight}
              alt={brand.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <span className="font-display font-black text-primary-500 text-xl leading-none select-none">
              {brand.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="py-2.5 px-3 text-center">
          <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-tight group-hover:text-primary-500 transition-colors truncate max-w-full">
            {brand.name}
          </span>
        </div>
      </Link>
    </motion.div>
  );
});
BrandCard.displayName = "BrandCard";

const BranchCard = memo(({ branch, variants }) => {
  const handleDetailsClick = () => {
    localStorage.setItem("selectedBranchId", String(branch.id));
  };

  const branchPhone = branch.phone || branch.contactNumber || branch.contact || branch.phoneNo;

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group flex flex-col justify-between rounded-none border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-neutral-950/20 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <Link to={`/branches/${branch.id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={branch.image}
            alt={branch.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-none bg-primary-500 text-[10px] font-bold text-white uppercase tracking-wider z-10">
          ★ {branch.rating}
        </div>
      </div>

      <div className="p-4 grow flex flex-col justify-between gap-4">
        <div>
          <Link to={`/branches/${branch.id}`}>
            <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors mb-2 min-h-[2.5rem] flex items-center">
              {branch.name}
            </h3>
          </Link>
          <div className="flex gap-2 items-start text-xs text-neutral-500 dark:text-neutral-400">
            <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{branch.location}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium">
          <a
            href={branchPhone ? `tel:${branchPhone}` : "#"}
            className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-primary-500 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-primary-500" />
            <span>Call</span>
          </a>
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
BranchCard.displayName = "BranchCard";

export default Home;
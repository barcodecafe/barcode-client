import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Sparkles,
  Search,
  Check,
  Percent,
  DollarSign,
  UtensilsCrossed,
  MapPin,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { getAllFoods } from "../../services/foodsService";
import { getAllRegions } from "../../services/regionsService";
import toast from "react-hot-toast";

export const AdminFreeDelivery = () => {
  const { settings, isSettingsLoaded, updateSettings, resetSettings } =
    useSettings();

  // 🚚 Free Delivery Campaign States
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(
    Boolean(settings.freeDeliveryEnabled)
  );
  const [freeDeliveryScope, setFreeDeliveryScope] = useState(
    settings.freeDeliveryScope || "all"
  );
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState(
    settings.freeDeliveryMinOrder !== undefined
      ? settings.freeDeliveryMinOrder
      : 0
  );
  const [freeDeliveryDishIds, setFreeDeliveryDishIds] = useState(
    settings.freeDeliveryDishIds || []
  );
  const [freeDeliveryAreas, setFreeDeliveryAreas] = useState(
    settings.freeDeliveryAreas || []
  );
  const [freeDeliveryBannerText, setFreeDeliveryBannerText] = useState(
    settings.freeDeliveryBannerText ||
      "🎉 Special Offer: Free Delivery on all orders today!"
  );
  const [freeDeliveryShowBanner, setFreeDeliveryShowBanner] = useState(
    settings.freeDeliveryShowBanner !== undefined
      ? Boolean(settings.freeDeliveryShowBanner)
      : true
  );

  // External data states for picker
  const [availableFoods, setAvailableFoods] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);
  const [dishSearch, setDishSearch] = useState("");
  const [areaSearch, setAreaSearch] = useState("");

  // UI States
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch foods and regions for scope selector
  useEffect(() => {
    const loadPickerData = async () => {
      try {
        const [foodsData, regionsData] = await Promise.all([
          getAllFoods().catch(() => []),
          getAllRegions().catch(() => []),
        ]);

        const foodsList = Array.isArray(foodsData)
          ? foodsData
          : foodsData?.data || [];
        setAvailableFoods(foodsList);

        const regionsList = Array.isArray(regionsData)
          ? regionsData
          : regionsData?.data || [];

        // Extract unique delivery zones/areas from all regions
        const areasSet = new Set();
        regionsList.forEach((r) => {
          if (r.name) areasSet.add(r.name);
          if (Array.isArray(r.deliveryZones)) {
            r.deliveryZones.forEach((z) => {
              if (z.name) areasSet.add(z.name);
            });
          }
        });

        // Add standard area fallbacks if empty
        if (areasSet.size === 0) {
          [
            "Dhaka",
            "Chattogram",
            "Cox's Bazar",
            "Gulshan",
            "Banani",
            "Dhanmondi",
            "Uttara",
            "Mirpur",
            "GEC",
            "Agrabad",
          ].forEach((a) => areasSet.add(a));
        }
        setAvailableAreas(Array.from(areasSet));
      } catch (err) {
        console.error("Error loading picker data:", err);
      }
    };
    loadPickerData();
  }, []);

  useEffect(() => {
    if (!isSettingsLoaded) return;
    setFreeDeliveryEnabled(Boolean(settings.freeDeliveryEnabled));
    setFreeDeliveryScope(settings.freeDeliveryScope || "all");
    setFreeDeliveryMinOrder(
      settings.freeDeliveryMinOrder !== undefined
        ? settings.freeDeliveryMinOrder
        : 0
    );
    setFreeDeliveryDishIds(
      Array.isArray(settings.freeDeliveryDishIds)
        ? settings.freeDeliveryDishIds.map(Number)
        : []
    );
    setFreeDeliveryAreas(
      Array.isArray(settings.freeDeliveryAreas)
        ? settings.freeDeliveryAreas
        : []
    );
    setFreeDeliveryBannerText(
      settings.freeDeliveryBannerText ||
        "🎉 Special Offer: Free Delivery on all orders today!"
    );
    setFreeDeliveryShowBanner(
      settings.freeDeliveryShowBanner !== undefined
        ? Boolean(settings.freeDeliveryShowBanner)
        : true
    );
  }, [isSettingsLoaded, settings]);

  // Dish selector toggles
  const handleToggleDish = (dishId) => {
    const numId = Number(dishId);
    setFreeDeliveryDishIds((prev) =>
      prev.includes(numId)
        ? prev.filter((id) => id !== numId)
        : [...prev, numId]
    );
  };

  const handleSelectAllDishes = () => {
    const allIds = availableFoods.map((f) => Number(f.id || f._id));
    setFreeDeliveryDishIds(allIds);
  };

  const handleClearAllDishes = () => {
    setFreeDeliveryDishIds([]);
  };

  // Area selector toggles
  const handleToggleArea = (areaName) => {
    setFreeDeliveryAreas((prev) =>
      prev.includes(areaName)
        ? prev.filter((a) => a !== areaName)
        : [...prev, areaName]
    );
  };

  const handleSelectAllAreas = () => {
    setFreeDeliveryAreas([...availableAreas]);
  };

  const handleClearAllAreas = () => {
    setFreeDeliveryAreas([]);
  };

  // Filtered dishes and areas
  const filteredFoods = useMemo(() => {
    if (!dishSearch.trim()) return availableFoods;
    const q = dishSearch.toLowerCase();
    return availableFoods.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
    );
  }, [availableFoods, dishSearch]);

  const filteredAreas = useMemo(() => {
    if (!areaSearch.trim()) return availableAreas;
    const q = areaSearch.toLowerCase();
    return availableAreas.filter((a) => a.toLowerCase().includes(q));
  }, [availableAreas, areaSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setSaving(true);

    try {
      const payload = {
        freeDeliveryEnabled: Boolean(freeDeliveryEnabled),
        freeDeliveryScope,
        freeDeliveryMinOrder: Number(freeDeliveryMinOrder) || 0,
        freeDeliveryDishIds: (freeDeliveryDishIds || []).map(Number),
        freeDeliveryAreas: (freeDeliveryAreas || []).map(String),
        freeDeliveryBannerText: freeDeliveryBannerText.trim(),
        freeDeliveryShowBanner: Boolean(freeDeliveryShowBanner),
      };

      await updateSettings(payload);
      setSuccess(true);
      toast.success("Free Delivery campaign settings saved successfully!");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const msg =
        err?.message || "Failed to update free delivery campaign settings.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disable and reset Free Delivery campaign settings to defaults?"
      )
    ) {
      return;
    }

    setSuccess(false);
    setError("");

    try {
      const payload = {
        freeDeliveryEnabled: false,
        freeDeliveryScope: "all",
        freeDeliveryMinOrder: 0,
        freeDeliveryDishIds: [],
        freeDeliveryAreas: [],
        freeDeliveryBannerText:
          "🎉 Special Offer: Free Delivery on all orders today!",
        freeDeliveryShowBanner: true,
      };

      await updateSettings(payload);
      setFreeDeliveryEnabled(false);
      setFreeDeliveryScope("all");
      setFreeDeliveryMinOrder(0);
      setFreeDeliveryDishIds([]);
      setFreeDeliveryAreas([]);
      setFreeDeliveryBannerText(
        "🎉 Special Offer: Free Delivery on all orders today!"
      );
      setFreeDeliveryShowBanner(true);

      setSuccess(true);
      toast.success("Free Delivery campaign reset to default inactive state.");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const msg = err?.message || "Failed to reset settings.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/70 dark:border-neutral-800/70">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Truck className="w-5 h-5 stroke-[2.5]" />
            </div>
            Free Delivery Campaign & Service
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Configure promotional free delivery campaigns, minimum order thresholds, dish exemptions, and announcement banners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>
            Free delivery campaign settings updated successfully! Changes reflect immediately across checkout and customer cart.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Main Campaign Status Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="font-display font-extrabold text-base text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Campaign Master Switch
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Toggle the switch to turn free delivery on or off globally on the website.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                  freeDeliveryEnabled
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-semibold"
                }`}
              >
                {freeDeliveryEnabled ? "🟢 Active on Site" : "⚪ Inactive"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeDeliveryEnabled}
                  onChange={(e) => setFreeDeliveryEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6.5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
              </label>
            </div>
          </div>

          {/* 2. Scope Criteria Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              Select Free Delivery Eligibility Rule:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option 1: All Orders */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  freeDeliveryScope === "all"
                    ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="freeDeliveryScope"
                      value="all"
                      checked={freeDeliveryScope === "all"}
                      onChange={() => setFreeDeliveryScope("all")}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">
                      All Orders
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    100% Free delivery on every order with no restrictions.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Universal Free Delivery
                </div>
              </label>

              {/* Option 2: Min Order Amount */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  freeDeliveryScope === "min_amount"
                    ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="freeDeliveryScope"
                      value="min_amount"
                      checked={freeDeliveryScope === "min_amount"}
                      onChange={() => setFreeDeliveryScope("min_amount")}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                      Min. Order
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    Free delivery when order subtotal exceeds a set amount.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Threshold Based
                </div>
              </label>

              {/* Option 3: Specific Dishes */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  freeDeliveryScope === "dishes"
                    ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="freeDeliveryScope"
                      value="dishes"
                      checked={freeDeliveryScope === "dishes"}
                      onChange={() => setFreeDeliveryScope("dishes")}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                      Selected Dishes
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    Free delivery when the cart contains promotional dishes.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Dish Specific ({freeDeliveryDishIds.length} chosen)
                </div>
              </label>

              {/* Option 4: Specific Areas */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  freeDeliveryScope === "areas"
                    ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="freeDeliveryScope"
                      value="areas"
                      checked={freeDeliveryScope === "areas"}
                      onChange={() => setFreeDeliveryScope("areas")}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      Selected Areas
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    Free delivery targeting selected locations and delivery zones.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Zone Specific ({freeDeliveryAreas.length} chosen)
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Scope Details */}
          {/* A. Min Order Amount Input */}
          {freeDeliveryScope === "min_amount" && (
            <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2 animate-in fade-in duration-200">
              <label className="block text-xs font-extrabold text-neutral-900 dark:text-neutral-200">
                Minimum Order Subtotal (৳) for Free Delivery:
              </label>
              <div className="flex items-center gap-3 max-w-xs">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-neutral-500 text-xs">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={freeDeliveryMinOrder}
                    onChange={(e) =>
                      setFreeDeliveryMinOrder(Number(e.target.value) || 0)
                    }
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-xs text-neutral-500 font-medium">
                  e.g. ৳500 or ৳1000
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Customers whose food order subtotal reaches ৳{freeDeliveryMinOrder || 0} will automatically get ৳0 delivery fee at checkout.
              </p>
            </div>
          )}

          {/* B. Dishes Multi-Selector */}
          {freeDeliveryScope === "dishes" && (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/80 dark:border-neutral-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Select Eligible Dishes ({freeDeliveryDishIds.length} Selected)
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    If customer adds any of these dishes, the order qualifies for free delivery.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllDishes}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllDishes}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter dishes by name or category..."
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-hidden"
                />
              </div>

              {/* Dishes pills grid */}
              <div className="max-h-48 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {filteredFoods.map((dish) => {
                  const numId = Number(dish.id || dish._id);
                  const isSelected = freeDeliveryDishIds.includes(numId);
                  return (
                    <button
                      key={numId}
                      type="button"
                      onClick={() => handleToggleDish(numId)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400"
                      }`}
                    >
                      <span>{dish.name}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* C. Areas Multi-Selector */}
          {freeDeliveryScope === "areas" && (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/80 dark:border-neutral-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Select Eligible Areas / Delivery Zones ({freeDeliveryAreas.length} Selected)
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    Customers choosing delivery to these areas will receive free delivery.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllAreas}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllAreas}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search area input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter areas by name..."
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-hidden"
                />
              </div>

              {/* Areas pills grid */}
              <div className="max-h-48 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {filteredAreas.map((area) => {
                  const isSelected = freeDeliveryAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => handleToggleArea(area)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400"
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{area}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Announcement Banner & Live Preview Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="font-display font-extrabold text-base text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Website Top Announcement Banner
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Displays an eye-catching announcement banner at the very top of the website navbar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                Show Banner:
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeDeliveryShowBanner}
                  onChange={(e) => setFreeDeliveryShowBanner(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Banner Promotional Text:
            </label>
            <input
              type="text"
              placeholder="e.g. 🎉 Special Offer: Free Delivery on all orders today!"
              value={freeDeliveryBannerText}
              onChange={(e) => setFreeDeliveryBannerText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/70 text-xs font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Live Preview Box */}
          {freeDeliveryShowBanner && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Live Top Banner Preview:
              </span>
              <div className="bg-linear-to-r from-amber-600 via-primary-500 to-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2 truncate">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {freeDeliveryScope === "min_amount"
                      ? `Orders ৳${freeDeliveryMinOrder}+`
                      : freeDeliveryScope === "dishes"
                      ? "Selected Dishes"
                      : freeDeliveryScope === "areas"
                      ? "Selected Areas"
                      : "All Orders"}
                  </span>
                  <span className="truncate font-bold">
                    {freeDeliveryBannerText || "Free Delivery Active!"}
                  </span>
                </div>
                <span className="text-[11px] font-black underline shrink-0 hidden sm:inline">
                  Order Now →
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Floating / Sticky Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-primary-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Campaign..." : "Save & Apply Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminFreeDelivery;

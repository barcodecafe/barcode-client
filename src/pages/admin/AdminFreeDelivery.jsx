import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Sparkles,
  Search,
  Check,
  DollarSign,
  UtensilsCrossed,
  MapPin,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  ArrowRight,
  Info,
  CheckSquare,
  Square,
  Tag,
  Filter,
  Eye,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { getAllFoods } from "../../services/foodsService";
import { getAllCategories } from "../../services/categoriesService";
import { getAllRegions } from "../../services/regionsService";
import { getAllBranches } from "../../services/branchesService";
import FreeDeliveryBanner from "../../components/FreeDeliveryBanner";
import toast from "react-hot-toast";

export const AdminFreeDelivery = () => {
  const { settings, isSettingsLoaded, updateSettings, resetSettings } =
    useSettings();

  // 🚚 Free Delivery Campaign Core States
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(
    Boolean(settings.freeDeliveryEnabled)
  );
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState(
    settings.freeDeliveryMinOrder !== undefined
      ? settings.freeDeliveryMinOrder
      : 0
  );
  const [freeDeliveryScope, setFreeDeliveryScope] = useState(
    settings.freeDeliveryScope || "all"
  );
  const [freeDeliveryCategories, setFreeDeliveryCategories] = useState(
    Array.isArray(settings.freeDeliveryCategories)
      ? settings.freeDeliveryCategories
      : []
  );
  const [freeDeliveryDishIds, setFreeDeliveryDishIds] = useState(
    Array.isArray(settings.freeDeliveryDishIds)
      ? settings.freeDeliveryDishIds.map(Number)
      : []
  );
  const [freeDeliveryAreas, setFreeDeliveryAreas] = useState(
    Array.isArray(settings.freeDeliveryAreas)
      ? settings.freeDeliveryAreas
      : []
  );
  const [freeDeliveryBannerText, setFreeDeliveryBannerText] = useState(
    settings.freeDeliveryBannerText ||
      "🎉 Special Offer: Free Delivery Campaign is Active!"
  );
  const [freeDeliveryShowBanner, setFreeDeliveryShowBanner] = useState(
    settings.freeDeliveryShowBanner !== undefined
      ? Boolean(settings.freeDeliveryShowBanner)
      : true
  );

  // Campaign Target Mode: 'items' (Menu / Dish Based) vs 'zones' (Zone / Area Based)
  const [campaignMode, setCampaignMode] = useState(
    settings.freeDeliveryScope === "areas" ? "zones" : "items"
  );

  // Sub-selection states
  // For items: 'all' | 'categories' | 'dishes'
  // For zones: 'all_zones' | 'specific_zones'
  const [itemSubScope, setItemSubScope] = useState(
    settings.freeDeliveryScope === "categories"
      ? "categories"
      : settings.freeDeliveryScope === "dishes"
        ? "dishes"
        : "all"
  );
  const [zoneSubScope, setZoneSubScope] = useState(
    settings.freeDeliveryScope === "areas" &&
      Array.isArray(settings.freeDeliveryAreas) &&
      settings.freeDeliveryAreas.length > 0
      ? "specific_zones"
      : "all_zones"
  );

  // External data states for pickers
  const [availableFoods, setAvailableFoods] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);

  // Filter & Search states
  const [categorySearch, setCategorySearch] = useState("");
  const [dishSearch, setDishSearch] = useState("");
  const [dishCategoryFilter, setDishCategoryFilter] = useState("All");
  const [areaSearch, setAreaSearch] = useState("");

  // UI States
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch foods, categories, and regions/branches for selectors
  useEffect(() => {
    const loadPickerData = async () => {
      try {
        const [foodsData, catsData, regionsData, branchesData] =
          await Promise.all([
            getAllFoods().catch(() => []),
            getAllCategories().catch(() => []),
            getAllRegions().catch(() => []),
            getAllBranches().catch(() => []),
          ]);

        const foodsList = Array.isArray(foodsData)
          ? foodsData
          : foodsData?.data || [];
        setAvailableFoods(foodsList);

        // Extract Categories
        const catMap = new Map();
        if (Array.isArray(catsData)) {
          catsData.forEach((c) => {
            const name = typeof c === "string" ? c : c?.name;
            if (name && name.trim())
              catMap.set(name.trim().toLowerCase(), name.trim());
          });
        }
        foodsList.forEach((f) => {
          if (f.category && f.category.trim()) {
            catMap.set(f.category.trim().toLowerCase(), f.category.trim());
          }
        });
        setAvailableCategories(Array.from(catMap.values()));

        // Extract unique delivery zones/areas from all regions and branches
        const areasSet = new Set();
        const regionsList = Array.isArray(regionsData) ? regionsData : [];
        regionsList.forEach((r) => {
          if (r.name) areasSet.add(r.name);
          if (Array.isArray(r.deliveryZones)) {
            r.deliveryZones.forEach((z) => {
              if (z.name) areasSet.add(z.name);
            });
          }
        });

        const branchesList = Array.isArray(branchesData) ? branchesData : [];
        branchesList.forEach((b) => {
          if (Array.isArray(b.deliveryZones)) {
            b.deliveryZones.forEach((z) => {
              if (z.name) areasSet.add(z.name);
            });
          }
        });

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
            "GEC Circle",
            "Agrabad",
            "Lalkhan Bazar",
          ].forEach((a) => areasSet.add(a));
        }
        setAvailableAreas(Array.from(areasSet));
      } catch (err) {
        console.error("Error loading picker data:", err);
      }
    };
    loadPickerData();
  }, []);

  // Hydrate from Settings
  useEffect(() => {
    if (!isSettingsLoaded) return;
    const isEnabled = Boolean(settings.freeDeliveryEnabled);
    setFreeDeliveryEnabled(isEnabled);
    setFreeDeliveryMinOrder(
      settings.freeDeliveryMinOrder !== undefined
        ? settings.freeDeliveryMinOrder
        : 0
    );

    const scope = settings.freeDeliveryScope || "all";
    setFreeDeliveryScope(scope);

    if (scope === "areas") {
      setCampaignMode("zones");
      setZoneSubScope(
        Array.isArray(settings.freeDeliveryAreas) &&
          settings.freeDeliveryAreas.length > 0
          ? "specific_zones"
          : "all_zones"
      );
    } else {
      setCampaignMode("items");
      setItemSubScope(
        scope === "categories"
          ? "categories"
          : scope === "dishes"
            ? "dishes"
            : "all"
      );
    }

    setFreeDeliveryCategories(
      Array.isArray(settings.freeDeliveryCategories)
        ? settings.freeDeliveryCategories
        : []
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
        "🎉 Special Offer: Free Delivery Campaign is Active!"
    );
    setFreeDeliveryShowBanner(
      settings.freeDeliveryShowBanner !== undefined
        ? Boolean(settings.freeDeliveryShowBanner)
        : true
    );
  }, [isSettingsLoaded, settings]);

  // Dishes Count per Category
  const categoryDishCount = useMemo(() => {
    const counts = {};
    availableFoods.forEach((f) => {
      if (f.category?.trim()) {
        const lower = f.category.trim().toLowerCase();
        counts[lower] = (counts[lower] || 0) + 1;
      }
    });
    return counts;
  }, [availableFoods]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return availableCategories;
    const q = categorySearch.toLowerCase();
    return availableCategories.filter((c) => c.toLowerCase().includes(q));
  }, [availableCategories, categorySearch]);

  // Filtered dishes
  const filteredFoods = useMemo(() => {
    return availableFoods.filter((f) => {
      const matchesSearch =
        !dishSearch.trim() ||
        f.name?.toLowerCase().includes(dishSearch.toLowerCase()) ||
        f.category?.toLowerCase().includes(dishSearch.toLowerCase());

      const matchesCat =
        dishCategoryFilter === "All" ||
        String(f.category || "").toLowerCase() ===
          dishCategoryFilter.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [availableFoods, dishSearch, dishCategoryFilter]);

  // Filtered areas
  const filteredAreas = useMemo(() => {
    if (!areaSearch.trim()) return availableAreas;
    const q = areaSearch.toLowerCase();
    return availableAreas.filter((a) => a.toLowerCase().includes(q));
  }, [availableAreas, areaSearch]);

  // Category Toggles
  const handleToggleCategory = (catName) => {
    setFreeDeliveryCategories((prev) =>
      prev.includes(catName)
        ? prev.filter((c) => c !== catName)
        : [...prev, catName]
    );
  };

  const handleSelectAllCategories = () => {
    setFreeDeliveryCategories([...availableCategories]);
  };

  const handleClearAllCategories = () => {
    setFreeDeliveryCategories([]);
  };

  // Dish Toggles
  const handleToggleDish = (dishId) => {
    const numId = Number(dishId);
    setFreeDeliveryDishIds((prev) =>
      prev.includes(numId)
        ? prev.filter((id) => id !== numId)
        : [...prev, numId]
    );
  };

  const handleSelectAllVisibleDishes = () => {
    const visibleIds = filteredFoods.map((f) => Number(f.id || f._id));
    setFreeDeliveryDishIds((prev) =>
      Array.from(new Set([...prev, ...visibleIds]))
    );
  };

  const handleClearAllDishes = () => {
    setFreeDeliveryDishIds([]);
  };

  const handleSelectCategoryDishes = (catName) => {
    const catDishes = availableFoods
      .filter(
        (f) =>
          String(f.category || "").toLowerCase() === catName.toLowerCase()
      )
      .map((f) => Number(f.id || f._id));
    setFreeDeliveryDishIds((prev) =>
      Array.from(new Set([...prev, ...catDishes]))
    );
  };

  // Area Toggles
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

  // -------------------------------------------------------------------------
  // STRICT SEQUENTIAL PROGRESSIVE VISIBILITY CHECKS
  // -------------------------------------------------------------------------
  // 1. Minimum Purchase Amount appears ONLY when Campaign Switch is ON
  const isMinOrderVisible = Boolean(freeDeliveryEnabled);

  // 2. Select Campaign Target appears ONLY when Minimum Purchase Amount is filled
  const isTargetScopeVisible = Boolean(
    isMinOrderVisible &&
      freeDeliveryMinOrder !== "" &&
      freeDeliveryMinOrder !== null &&
      freeDeliveryMinOrder !== undefined &&
      !isNaN(Number(freeDeliveryMinOrder))
  );

  // 3. Target Scope Workflow Completion Check:
  // ONLY becomes true when the user actually finishes selecting their options in Campaign Target:
  // - Menu Items: 'all' OR 'categories' (with >= 1 category selected) OR 'dishes' (with >= 1 dish selected)
  // - Zones: 'all_zones' OR 'specific_zones' (with >= 1 zone selected)
  const isTargetWorkflowCompleted = useMemo(() => {
    if (!isTargetScopeVisible || !campaignMode) return false;

    if (campaignMode === "items") {
      if (!itemSubScope) return false;
      if (itemSubScope === "all") return true;
      if (itemSubScope === "categories") return freeDeliveryCategories.length > 0;
      if (itemSubScope === "dishes") return freeDeliveryDishIds.length > 0;
      return false;
    }

    if (campaignMode === "zones") {
      if (!zoneSubScope) return false;
      if (zoneSubScope === "all_zones") return true;
      if (zoneSubScope === "specific_zones") return freeDeliveryAreas.length > 0;
      return false;
    }

    return false;
  }, [
    isTargetScopeVisible,
    campaignMode,
    itemSubScope,
    zoneSubScope,
    freeDeliveryCategories,
    freeDeliveryDishIds,
    freeDeliveryAreas,
  ]);

  // 4. Header Ticker & Announcement Banner appears ONLY AFTER Target Scope Workflow is fully completed
  const isBannerVisible = isTargetWorkflowCompleted;

  // Compute final effective scope for saving
  const computedScope = useMemo(() => {
    if (campaignMode === "zones") {
      return zoneSubScope === "specific_zones" ? "areas" : "all";
    }
    return itemSubScope; // 'all' | 'categories' | 'dishes'
  }, [campaignMode, zoneSubScope, itemSubScope]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setSaving(true);

    try {
      const payload = {
        freeDeliveryEnabled: Boolean(freeDeliveryEnabled),
        freeDeliveryScope: computedScope,
        freeDeliveryMinOrder: Number(freeDeliveryMinOrder) || 0,
        freeDeliveryCategories:
          computedScope === "categories" ? freeDeliveryCategories : [],
        freeDeliveryDishIds:
          computedScope === "dishes"
            ? (freeDeliveryDishIds || []).map(Number)
            : [],
        freeDeliveryAreas:
          computedScope === "areas"
            ? (freeDeliveryAreas || []).map(String)
            : [],
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
        freeDeliveryCategories: [],
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
      setFreeDeliveryCategories([]);
      setFreeDeliveryDishIds([]);
      setFreeDeliveryAreas([]);
      setFreeDeliveryBannerText(
        "🎉 Special Offer: Free Delivery on all orders today!"
      );
      setFreeDeliveryShowBanner(true);
      setCampaignMode("items");
      setItemSubScope("all");
      setZoneSubScope("all_zones");

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
            Configure promotional free delivery campaigns, minimum order thresholds, targeting criteria, and announcement banners.
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

      {/* Status Alerts */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>
            Settings saved! Customers will now receive free delivery according to
            your configured campaign rules.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center gap-3 text-red-800 dark:text-red-200 text-xs sm:text-sm font-semibold animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* =================================================================== */}
        {/* 1. CAMPAIGN MASTER SWITCH CARD                                      */}
        {/* =================================================================== */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-3xl p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-display">
                Enable Free Delivery Campaign
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Turn on the master switch to activate and configure free delivery campaign rules.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={freeDeliveryEnabled}
                onChange={(e) => setFreeDeliveryEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-neutral-700 peer-checked:bg-amber-500 shadow-inner"></div>
              <span className="ml-3 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {freeDeliveryEnabled ? "Campaign Active" : "Campaign Disabled"}
              </span>
            </label>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. MINIMUM PURCHASE AMOUNT CARD (Conditional on Switch ON)          */}
        {/* =================================================================== */}
        <AnimatePresence>
          {isMinOrderVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 15 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="space-y-0.5">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-display flex items-center gap-1.5">
                      <DollarSign className="w-5 h-5 text-amber-500" />
                      Minimum Purchase Amount (৳)
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Set the required minimum order subtotal that customers must reach to qualify for free delivery.
                    </p>
                  </div>

                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/60 px-2.5 py-1 rounded-lg">
                    {freeDeliveryMinOrder !== "" && Number(freeDeliveryMinOrder) > 0
                      ? `Threshold: ৳${freeDeliveryMinOrder}+`
                      : "No Minimum (৳0)"}
                  </span>
                </div>

                <div className="flex items-center pt-1">
                  <div className="relative w-full max-w-sm">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={freeDeliveryMinOrder}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFreeDeliveryMinOrder(
                          val === "" ? "" : Math.max(0, parseFloat(val) || 0)
                        );
                      }}
                      placeholder="0 (Enter 0 for no minimum amount)"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span>
                    {freeDeliveryMinOrder !== "" && Number(freeDeliveryMinOrder) > 0
                      ? `Customers must order at least ৳${freeDeliveryMinOrder} to unlock free delivery on the selected target criteria below.`
                      : "Enter 0 if any order amount qualifies for free delivery on the selected criteria below."}
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* 3. CAMPAIGN TARGET CARD (Conditional on Min Order filled)           */}
        {/* =================================================================== */}
        <AnimatePresence>
          {isTargetScopeVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 15 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-display">
                    Select Campaign Target
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Choose whether this free delivery promotion applies to Menu/Item-based orders or Delivery Zone-based orders.
                  </p>
                </div>

                {/* Top Level Mode Tabs: Items vs Zones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setCampaignMode("items")}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      campaignMode === "items"
                        ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                        : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        campaignMode === "items"
                          ? "bg-amber-500 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                        Menu & Item Based Campaign
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Target all menu items, specific categories, or individual dishes.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCampaignMode("zones")}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      campaignMode === "zones"
                        ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                        : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        campaignMode === "zones"
                          ? "bg-amber-500 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                        Delivery Zone / Area Based Campaign
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Target all delivery zones or specific regional areas.
                      </p>
                    </div>
                  </button>
                </div>

                {/* ============================================================= */}
                {/* MENU / ITEM BASED SUB-OPTIONS                                 */}
                {/* ============================================================= */}
                {campaignMode === "items" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5 pt-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                        Choose Item Target:
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Option A.1: All Menu Items */}
                      <button
                        type="button"
                        onClick={() => setItemSubScope("all")}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          itemSubScope === "all"
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-amber-900 dark:text-amber-100 shadow-xs"
                            : "bg-neutral-50/50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 hover:bg-white text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs sm:text-sm">
                            All Menu Items
                          </span>
                          {itemSubScope === "all" && (
                            <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Free delivery on all categories & dishes.
                        </p>
                      </button>

                      {/* Option A.2: By Category */}
                      <button
                        type="button"
                        onClick={() => setItemSubScope("categories")}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          itemSubScope === "categories"
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-amber-900 dark:text-amber-100 shadow-xs"
                            : "bg-neutral-50/50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 hover:bg-white text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs sm:text-sm">
                            By Category
                          </span>
                          {itemSubScope === "categories" && (
                            <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Select all categories or individual categories.
                        </p>
                      </button>

                      {/* Option A.3: Specific Dishes */}
                      <button
                        type="button"
                        onClick={() => setItemSubScope("dishes")}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          itemSubScope === "dishes"
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-amber-900 dark:text-amber-100 shadow-xs"
                            : "bg-neutral-50/50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 hover:bg-white text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs sm:text-sm">
                            Specific Dishes
                          </span>
                          {itemSubScope === "dishes" && (
                            <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Pick individual dishes or filter by category.
                        </p>
                      </button>
                    </div>

                    {/* Sub-panel: Category Selector */}
                    <AnimatePresence>
                      {itemSubScope === "categories" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                                  <Tag className="w-4 h-4 text-amber-500" />
                                  Select Categories ({freeDeliveryCategories.length} selected)
                                </h4>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                  Orders containing items from these categories qualify for free delivery.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleSelectAllCategories}
                                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 cursor-pointer"
                                >
                                  Select All Categories
                                </button>
                                <button
                                  type="button"
                                  onClick={handleClearAllCategories}
                                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 hover:text-red-500 cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                              <input
                                type="text"
                                placeholder="Search categories..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                              />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto pr-1">
                              {filteredCategories.map((cat) => {
                                const isSelected =
                                  freeDeliveryCategories.includes(cat);
                                const count =
                                  categoryDishCount[cat.toLowerCase()] || 0;

                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleToggleCategory(cat)}
                                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-amber-500 text-white border-amber-500 shadow-xs font-bold"
                                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 font-medium"
                                    }`}
                                  >
                                    <span className="text-xs truncate">{cat}</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                                        isSelected
                                          ? "bg-white/20 text-white"
                                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                                      }`}
                                    >
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {freeDeliveryCategories.length === 0 && (
                              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                                <Info className="w-4 h-4 shrink-0" />
                                Please select at least one category above to proceed to Header Ticker & Banner settings.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Sub-panel: Specific Dishes Selector */}
                    <AnimatePresence>
                      {itemSubScope === "dishes" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                                  <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                                  Select Dishes ({freeDeliveryDishIds.length} selected)
                                </h4>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                  Filter by category or search individual dishes to attach free delivery.
                                </p>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={handleSelectAllVisibleDishes}
                                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 cursor-pointer"
                                >
                                  Select All Visible
                                </button>
                                {dishCategoryFilter !== "All" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectCategoryDishes(dishCategoryFilter)
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 cursor-pointer"
                                  >
                                    + All in "{dishCategoryFilter}"
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={handleClearAllDishes}
                                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 hover:text-red-500 cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            {/* Filter & Search Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                <input
                                  type="text"
                                  placeholder="Search dish by name..."
                                  value={dishSearch}
                                  onChange={(e) => setDishSearch(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                />
                              </div>

                              <div className="relative min-w-[180px]">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                                <select
                                  value={dishCategoryFilter}
                                  onChange={(e) =>
                                    setDishCategoryFilter(e.target.value)
                                  }
                                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-100 font-medium focus:outline-none cursor-pointer appearance-none"
                                >
                                  <option value="All">
                                    All Categories ({availableFoods.length})
                                  </option>
                                  {availableCategories.map((c) => (
                                    <option key={c} value={c}>
                                      {c} ({categoryDishCount[c.toLowerCase()] || 0})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Dish Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto pr-1">
                              {filteredFoods.map((f) => {
                                const numId = Number(f.id || f._id);
                                const isSelected =
                                  freeDeliveryDishIds.includes(numId);

                                return (
                                  <div
                                    key={numId}
                                    onClick={() => handleToggleDish(numId)}
                                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer select-none ${
                                      isSelected
                                        ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50"
                                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                                    }`}
                                  >
                                    <div className="relative w-11 h-11 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
                                      {f.image ? (
                                        <img
                                          src={f.image}
                                          alt={f.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                          <UtensilsCrossed className="w-4 h-4" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold truncate block max-w-fit">
                                        {f.category}
                                      </span>
                                      <h5 className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                                        {f.name}
                                      </h5>
                                      <span className="text-[11px] font-black text-primary-500">
                                        ৳{f.price}
                                      </span>
                                    </div>

                                    <div className="shrink-0">
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-amber-500" />
                                      ) : (
                                        <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-700" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {freeDeliveryDishIds.length === 0 && (
                              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                                <Info className="w-4 h-4 shrink-0" />
                                Please select at least one dish above to proceed to Header Ticker & Banner settings.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ============================================================= */}
                {/* ZONE / AREA BASED SUB-OPTIONS                                 */}
                {/* ============================================================= */}
                {campaignMode === "zones" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5 pt-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                        Choose Zone Target:
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option B.1: All Delivery Zones */}
                      <button
                        type="button"
                        onClick={() => setZoneSubScope("all_zones")}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          zoneSubScope === "all_zones"
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-amber-900 dark:text-amber-100 shadow-xs"
                            : "bg-neutral-50/50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 hover:bg-white text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs sm:text-sm">
                            All Delivery Zones
                          </span>
                          {zoneSubScope === "all_zones" && (
                            <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Free delivery across all branch delivery zones.
                        </p>
                      </button>

                      {/* Option B.2: Specific Delivery Zones */}
                      <button
                        type="button"
                        onClick={() => setZoneSubScope("specific_zones")}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          zoneSubScope === "specific_zones"
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 text-amber-900 dark:text-amber-100 shadow-xs"
                            : "bg-neutral-50/50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 hover:bg-white text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs sm:text-sm">
                            Specific Delivery Zones
                          </span>
                          {zoneSubScope === "specific_zones" && (
                            <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Select specific regional delivery areas eligible for free delivery.
                        </p>
                      </button>
                    </div>

                    {/* Sub-panel: Specific Zones Selector */}
                    <AnimatePresence>
                      {zoneSubScope === "specific_zones" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-amber-500" />
                                  Select Delivery Zones ({freeDeliveryAreas.length} selected)
                                </h4>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                  Customers ordering to these specific areas get free delivery.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleSelectAllAreas}
                                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 cursor-pointer"
                                >
                                  Select All Zones
                                </button>
                                <button
                                  type="button"
                                  onClick={handleClearAllAreas}
                                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 hover:text-red-500 cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                              <input
                                type="text"
                                placeholder="Search delivery zones/areas..."
                                value={areaSearch}
                                onChange={(e) => setAreaSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                              />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto pr-1">
                              {filteredAreas.map((area) => {
                                const isSelected =
                                  freeDeliveryAreas.includes(area);

                                return (
                                  <button
                                    key={area}
                                    type="button"
                                    onClick={() => handleToggleArea(area)}
                                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-amber-500 text-white border-amber-500 shadow-xs font-bold"
                                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 font-medium"
                                    }`}
                                  >
                                    <span className="text-xs truncate">{area}</span>
                                    {isSelected ? (
                                      <Check className="w-3.5 h-3.5 shrink-0" />
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>

                            {freeDeliveryAreas.length === 0 && (
                              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                                <Info className="w-4 h-4 shrink-0" />
                                Please select at least one delivery zone above to proceed to Header Ticker & Banner settings.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* 4. HEADER TICKER & BANNER (Conditional on Target Workflow Done)     */}
        {/* =================================================================== */}
        <AnimatePresence>
          {isBannerVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 15 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-display">
                      Header Ticker & Announcement Banner
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Choose whether the promotional banner is visible or hidden, and customize the marquee announcement ticker text.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={freeDeliveryShowBanner}
                      onChange={(e) => setFreeDeliveryShowBanner(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-700 peer-checked:bg-amber-500 shadow-inner"></div>
                    <span className="ml-2.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {freeDeliveryShowBanner ? "Banner Visible" : "Banner Hidden"}
                    </span>
                  </label>
                </div>

                <AnimatePresence>
                  {freeDeliveryShowBanner && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3 pt-2 overflow-hidden"
                    >
                      <div>
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                          Ticker Announcement Text
                        </label>
                        <input
                          type="text"
                          value={freeDeliveryBannerText}
                          onChange={(e) => setFreeDeliveryBannerText(e.target.value)}
                          placeholder="e.g. 🎉 Special Offer: Free Delivery on orders ৳500+ today!"
                          className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>

                      {/* Live Banner Preview */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          Live Website Ticker Preview:
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xs">
                          <FreeDeliveryBanner
                            isPreview
                            previewEnabled={freeDeliveryEnabled}
                            previewText={freeDeliveryBannerText}
                            previewScope={computedScope}
                            previewMinOrder={Number(freeDeliveryMinOrder) || 0}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* 5. ACTION BAR & SAVE BUTTON (Conditional on Finished Workflow)       */}
        {/* =================================================================== */}
        <AnimatePresence>
          {(isBannerVisible || !freeDeliveryEnabled) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200/70 dark:border-neutral-800/70"
            >
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {freeDeliveryEnabled ? (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Configured:{" "}
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {freeDeliveryMinOrder !== "" && Number(freeDeliveryMinOrder) > 0
                        ? `৳${freeDeliveryMinOrder}+ Min Order`
                        : "No Min"}
                    </span>{" "}
                    • Target:{" "}
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                      {computedScope === "all"
                        ? "All Menu Items"
                        : computedScope === "categories"
                          ? `${freeDeliveryCategories.length} Categories`
                          : computedScope === "dishes"
                            ? `${freeDeliveryDishIds.length} Dishes`
                            : `${freeDeliveryAreas.length} Delivery Zones`}
                    </span>
                    {" "}• Banner:{" "}
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {freeDeliveryShowBanner ? "Visible" : "Hidden"}
                    </span>
                  </span>
                ) : (
                  <span>Campaign is currently inactive</span>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black text-sm shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-60 transition-all cursor-pointer w-full sm:w-auto justify-center"
              >
                <Save className="w-4 h-4" />
                {saving
                  ? "Saving Campaign Settings..."
                  : "Save Free Delivery Settings"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default AdminFreeDelivery;

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Upload,
  Save,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Share2,
  Globe,
  Link as LinkIcon,
  Image,
  AlertCircle,
  CreditCard,
  Truck,
  Sparkles,
  Search,
  Check,
  Percent,
  DollarSign,
  UtensilsCrossed,
  Info,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { getAllFoods } from "../../services/foodsService";
import { getAllRegions } from "../../services/regionsService";

export const AdminSettings = () => {
  const { settings, isSettingsLoaded, updateSettings, resetSettings } =
    useSettings();

  // Branding & Footer Form states
  const [footerDescription, setFooterDescription] = useState(
    settings.footerDescription,
  );
  const [footerAddress, setFooterAddress] = useState(settings.footerAddress);
  const [footerPhone, setFooterPhone] = useState(settings.footerPhone);
  const [footerEmail, setFooterEmail] = useState(settings.footerEmail);

  const [footerFacebook, setFooterFacebook] = useState(
    settings.footerFacebook || "",
  );
  const [footerInstagram, setFooterInstagram] = useState(
    settings.footerInstagram || "",
  );
  const [footerTwitter, setFooterTwitter] = useState(
    settings.footerTwitter || "",
  );

  const [logoLight, setLogoLight] = useState(settings.logoLight || "");
  const [logoDark, setLogoDark] = useState(settings.logoDark || "");
  const [paymentBanner, setPaymentBanner] = useState(
    settings.paymentBanner || "",
  );

  // 🚚 Free Delivery Campaign States
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(
    Boolean(settings.freeDeliveryEnabled),
  );
  const [freeDeliveryScope, setFreeDeliveryScope] = useState(
    settings.freeDeliveryScope || "all",
  );
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState(
    settings.freeDeliveryMinOrder !== undefined
      ? settings.freeDeliveryMinOrder
      : 0,
  );
  const [freeDeliveryDishIds, setFreeDeliveryDishIds] = useState(
    settings.freeDeliveryDishIds || [],
  );
  const [freeDeliveryAreas, setFreeDeliveryAreas] = useState(
    settings.freeDeliveryAreas || [],
  );
  const [freeDeliveryBannerText, setFreeDeliveryBannerText] = useState(
    settings.freeDeliveryBannerText ||
      "🎉 Special Offer: Free Delivery on all orders today!",
  );
  const [freeDeliveryShowBanner, setFreeDeliveryShowBanner] = useState(
    settings.freeDeliveryShowBanner !== undefined
      ? Boolean(settings.freeDeliveryShowBanner)
      : true,
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
          ["Dhaka", "Chattogram", "Cox's Bazar", "Gulshan", "Dhanmondi", "GEC"].forEach((a) =>
            areasSet.add(a),
          );
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
    setFooterDescription(settings.footerDescription || "");
    setFooterAddress(settings.footerAddress || "");
    setFooterPhone(settings.footerPhone || "");
    setFooterEmail(settings.footerEmail || "");
    setFooterFacebook(settings.footerFacebook || "");
    setFooterInstagram(settings.footerInstagram || "");
    setFooterTwitter(settings.footerTwitter || "");
    setLogoLight(settings.logoLight || "");
    setLogoDark(settings.logoDark || "");
    setPaymentBanner(settings.paymentBanner || "");

    // Free delivery sync
    setFreeDeliveryEnabled(Boolean(settings.freeDeliveryEnabled));
    setFreeDeliveryScope(settings.freeDeliveryScope || "all");
    setFreeDeliveryMinOrder(
      settings.freeDeliveryMinOrder !== undefined
        ? settings.freeDeliveryMinOrder
        : 0,
    );
    setFreeDeliveryDishIds(
      Array.isArray(settings.freeDeliveryDishIds)
        ? settings.freeDeliveryDishIds.map(Number)
        : [],
    );
    setFreeDeliveryAreas(
      Array.isArray(settings.freeDeliveryAreas)
        ? settings.freeDeliveryAreas
        : [],
    );
    setFreeDeliveryBannerText(
      settings.freeDeliveryBannerText ||
        "🎉 Special Offer: Free Delivery on all orders today!",
    );
    setFreeDeliveryShowBanner(
      settings.freeDeliveryShowBanner !== undefined
        ? Boolean(settings.freeDeliveryShowBanner)
        : true,
    );
  }, [isSettingsLoaded, settings]);

  const handleLogoLightUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for the Light Theme logo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoLight(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDarkUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for the Dark Theme logo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoDark(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for the Payment Methods banner.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentBanner(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Dish selector toggles
  const handleToggleDish = (dishId) => {
    const numId = Number(dishId);
    setFreeDeliveryDishIds((prev) =>
      prev.includes(numId)
        ? prev.filter((id) => id !== numId)
        : [...prev, numId],
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
        : [...prev, areaName],
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
        f.category?.toLowerCase().includes(q),
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
        logoLight,
        logoDark,
        paymentBanner,
        footerDescription: footerDescription.trim(),
        footerAddress: footerAddress.trim(),
        footerPhone: footerPhone.trim(),
        footerEmail: footerEmail.trim(),
        footerFacebook: footerFacebook.trim(),
        footerInstagram: footerInstagram.trim(),
        footerTwitter: footerTwitter.trim(),

        // 🚚 Free Delivery Campaign
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
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err?.message ||
          "Failed to update website settings. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to restore default settings? This will revert logos, free delivery campaign, and footer text.",
      )
    ) {
      return;
    }

    setSuccess(false);
    setError("");

    try {
      const defaults = await resetSettings();

      setFooterDescription(defaults.footerDescription);
      setFooterAddress(defaults.footerAddress);
      setFooterPhone(defaults.footerPhone);
      setFooterEmail(defaults.footerEmail);
      setFooterFacebook(defaults.footerFacebook || "");
      setFooterInstagram(defaults.footerInstagram || "");
      setFooterTwitter(defaults.footerTwitter || "");
      setLogoLight(defaults.logoLight || "");
      setLogoDark(defaults.logoDark || "");
      setPaymentBanner(defaults.paymentBanner || "");

      setFreeDeliveryEnabled(Boolean(defaults.freeDeliveryEnabled));
      setFreeDeliveryScope(defaults.freeDeliveryScope || "all");
      setFreeDeliveryMinOrder(defaults.freeDeliveryMinOrder || 0);
      setFreeDeliveryDishIds(defaults.freeDeliveryDishIds || []);
      setFreeDeliveryAreas(defaults.freeDeliveryAreas || []);
      setFreeDeliveryBannerText(
        defaults.freeDeliveryBannerText ||
          "🎉 Special Offer: Free Delivery on all orders today!",
      );
      setFreeDeliveryShowBanner(
        defaults.freeDeliveryShowBanner !== undefined
          ? Boolean(defaults.freeDeliveryShowBanner)
          : true,
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err?.message || "Failed to reset settings. Please try again.",
      );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary-500" />
            Website Site Settings
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage Free Delivery Campaigns, brand logos, footer contact info, and
            social networks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-250 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all self-start cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>
            Website settings successfully saved and applied! Changes reflect
            instantly.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 🚚 1. FREE DELIVERY CAMPAIGN MANAGEMENT SECTION */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="font-display font-extrabold text-base text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                Free Delivery Campaign & Service
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Enable free delivery occasionally for all orders, minimum order amounts, specific dishes, or specific delivery areas.
              </p>
            </div>

            {/* Main Campaign Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  freeDeliveryEnabled
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                }`}
              >
                {freeDeliveryEnabled ? "Campaign Active" : "Campaign Inactive"}
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

          {/* Campaign Configuration Body (Rendered when enabled or expanded) */}
          <div
            className={`space-y-5 transition-opacity duration-300 ${
              freeDeliveryEnabled
                ? "opacity-100"
                : "opacity-60 pointer-events-none"
            }`}
          >
            {/* Scope Selection Cards */}
            <div>
              <label className="block text-xs font-extrabold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2.5">
                🎯 Select Campaign Targeting Scope (প্রযোজ্য ক্ষেত্র)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. All Orders */}
                <button
                  type="button"
                  onClick={() => setFreeDeliveryScope("all")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    freeDeliveryScope === "all"
                      ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30"
                      : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Globe className="w-5 h-5 text-amber-500" />
                    {freeDeliveryScope === "all" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      All Orders
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      Free delivery on all customer orders across the entire site.
                    </p>
                  </div>
                </button>

                {/* 2. Minimum Order Amount */}
                <button
                  type="button"
                  onClick={() => setFreeDeliveryScope("min_amount")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    freeDeliveryScope === "min_amount"
                      ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30"
                      : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Percent className="w-5 h-5 text-amber-500" />
                    {freeDeliveryScope === "min_amount" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Min Order Amount
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      Free delivery on orders reaching a minimum subtotal (e.g. ৳500+).
                    </p>
                  </div>
                </button>

                {/* 3. Specific Dishes */}
                <button
                  type="button"
                  onClick={() => setFreeDeliveryScope("dishes")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    freeDeliveryScope === "dishes"
                      ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30"
                      : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <UtensilsCrossed className="w-5 h-5 text-amber-500" />
                    {freeDeliveryScope === "dishes" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Specific Dishes
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      Free delivery if the order contains any selected dishes.
                    </p>
                  </div>
                </button>

                {/* 4. Specific Delivery Areas */}
                <button
                  type="button"
                  onClick={() => setFreeDeliveryScope("areas")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    freeDeliveryScope === "areas"
                      ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30"
                      : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    {freeDeliveryScope === "areas" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Specific Areas
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      Free delivery for selected regions/delivery zones only.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Contextual Target Controls */}
            {/* Scope: Minimum Amount */}
            {freeDeliveryScope === "min_amount" && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Minimum Order Subtotal for Free Delivery (৳) *
                </label>
                <div className="flex items-center gap-2 max-w-sm">
                  <span className="text-sm font-extrabold text-neutral-500">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="e.g. 500"
                    value={freeDeliveryMinOrder}
                    onChange={(e) => setFreeDeliveryMinOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-bold text-sm focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Customers who order ৳{freeDeliveryMinOrder || 0} or more will automatically get ৳0 delivery fee at checkout.
                </p>
              </div>
            )}

            {/* Scope: Specific Dishes Selector */}
            {freeDeliveryScope === "dishes" && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-white">
                      Selected Dishes for Free Delivery ({freeDeliveryDishIds.length})
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Dishes selected below will display a "🚚 Free Delivery" badge and give free delivery on orders.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllDishes}
                      className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllDishes}
                      className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Dish Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search dishes to include..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none"
                  />
                </div>

                {/* Dishes Grid */}
                <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredFoods.map((food) => {
                    const id = Number(food.id || food._id);
                    const isSelected = freeDeliveryDishIds.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleToggleDish(id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100 font-bold"
                            : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {food.image && (
                          <img
                            src={food.image}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate font-semibold">
                            {food.name}
                          </p>
                          <span className="text-[10px] text-neutral-400 block">
                            {food.category} • ৳{food.price}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "border-neutral-300 dark:border-neutral-700"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scope: Specific Delivery Areas */}
            {freeDeliveryScope === "areas" && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-white">
                      Selected Delivery Areas / Zones ({freeDeliveryAreas.length})
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Customers ordering to any of these areas will receive free delivery.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllAreas}
                      className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllAreas}
                      className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Area Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search delivery areas..."
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none"
                  />
                </div>

                {/* Areas Badges / Chips */}
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
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

            {/* Announcement Banner Customization & Live Preview */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  📢 Website Top Announcement Banner
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500">
                    Show on site:
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={freeDeliveryShowBanner}
                      onChange={(e) =>
                        setFreeDeliveryShowBanner(e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="e.g. 🎉 Special Offer: Free Delivery on all orders today!"
                  value={freeDeliveryBannerText}
                  onChange={(e) => setFreeDeliveryBannerText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none font-bold"
                />
              </div>

              {/* Live Preview Box */}
              {freeDeliveryShowBanner && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Live Banner Preview:
                  </span>
                  <div className="bg-linear-to-r from-amber-600 via-primary-500 to-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
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
          </div>
        </div>

        {/* 2. Logos customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Image className="w-4 h-4 text-primary-500" />
            Website Branding Logos
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload custom image logos for the navbar. The dark logo renders in
            light mode, and the light logo renders in dark mode.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Light Logo (used in light mode) */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Light Mode Logo (Dark Logo png)
              </label>

              <div className="flex items-center gap-4">
                <div className="h-16 w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-xl flex items-center justify-center p-2 shrink-0">
                  {logoLight ? (
                    <img
                      src={logoLight}
                      alt="Light logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      Default Logo
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Light Mode Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoLightUpload}
                      className="hidden"
                    />
                  </label>
                  {logoLight && (
                    <button
                      type="button"
                      onClick={() => setLogoLight("")}
                      className="block text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      Remove custom logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dark Logo (used in dark mode) */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Dark Mode Logo (White Logo png)
              </label>

              <div className="flex items-center gap-4">
                <div className="h-16 w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-900 rounded-xl flex items-center justify-center p-2 shrink-0">
                  {logoDark ? (
                    <img
                      src={logoDark}
                      alt="Dark logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      Default Logo
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Dark Mode Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoDarkUpload}
                      className="hidden"
                    />
                  </label>
                  {logoDark && (
                    <button
                      type="button"
                      onClick={() => setLogoDark("")}
                      className="block text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      Remove custom logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Payment Methods Banner Customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary-500" />
            Payment Gateway & SSL Banner
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload a custom payment security/gateway banner displayed in the
            footer or checkout trust areas.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-20 w-full sm:w-64 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-xl flex items-center justify-center p-2 shrink-0 overflow-hidden">
                {paymentBanner ? (
                  <img
                    src={paymentBanner}
                    alt="Payment banner preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-neutral-400">
                    Default SSL / Dynamic Banner
                  </span>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Payment Banner Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentBannerUpload}
                    className="hidden"
                  />
                </label>
                {paymentBanner && (
                  <button
                    type="button"
                    onClick={() => setPaymentBanner("")}
                    className="block text-[11px] text-red-500 hover:underline cursor-pointer"
                  >
                    Remove custom payment banner
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Footer & Contact Customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-500" />
            Footer Brand & Contact Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Brand Summary Description
              </label>
              <textarea
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />{" "}
                  Head Office Address
                </label>
                <textarea
                  value={footerAddress}
                  onChange={(e) => setFooterAddress(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-primary-500 shrink-0" />{" "}
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={footerPhone}
                  onChange={(e) => setFooterPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary-500 shrink-0" />{" "}
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Social connections customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-primary-500" />
            Social Media Connections
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />{" "}
                Facebook Page Link
              </label>
              <input
                type="url"
                value={footerFacebook}
                onChange={(e) => setFooterFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-pink-500 shrink-0" />{" "}
                Instagram Handle
              </label>
              <input
                type="url"
                value={footerInstagram}
                onChange={(e) => setFooterInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />{" "}
                Twitter/X Profile
              </label>
              <input
                type="url"
                value={footerTwitter}
                onChange={(e) => setFooterTwitter(e.target.value)}
                placeholder="https://twitter.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/10 active:scale-95 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Site Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
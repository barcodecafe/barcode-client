import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion"; 
import {
  Search,
  Star,
  Flame,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  MapPin,
  Filter,
  Layers,
  Settings,
  GripVertical,
  RefreshCw,
  ImageIcon,
  Calendar,
  Gift,
  AlertCircle,
  Tag,
} from "lucide-react";
import {
  getAllFoods,
  createFood,
  updateFood,
  deleteFood,
  updateFoodOrder,
  updateCategoryOrder,
} from "../../services/foodsService";
import { getAllBranches } from "../../services/branchesService";
import { getAllCoupons } from "../../services/couponsService"; // 🎯 কুপন সার্ভিস ইম্পোর্ট করা হলো
import { useVisiblePolling } from "../../hooks/useVisiblePolling";

export const AdminDishes = () => {
  const [foods, setFoods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [coupons, setCoupons] = useState([]); // 🎯 কুপন স্টেট
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All"); 
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [sortedCategories, setSortedCategories] = useState([]);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomVariantLabel, setIsCustomVariantLabel] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    rating: 4.5,
    image: "",
    description: "",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: 1,
    discountType: "percent",
    discountPct: 0,
    discountAmount: 0,
    offerType: "none",
    promoCode: "", // 🎯 কুপন কোড ফিল্ড
    discountStartDate: "",
    discountEndDate: "",
    branchIds: [],
    branchPrices: {},
    variantLabel: "Size",
    variations: [],
  });

  const standardVariantLabels = ["Size", "Weight", "Portion", "Piece"];

  const processCategories = (loadedFoods) => {
    const categoryMap = new Map();

    loadedFoods.forEach((f) => {
      if (f.category?.trim()) {
        const catName = f.category.trim();
        const lowerName = catName.toLowerCase();
        const orderVal = typeof f.categoryOrder === "number" ? f.categoryOrder : 999;

        if (!categoryMap.has(lowerName)) {
          categoryMap.set(lowerName, { name: catName, order: orderVal });
        } else {
          if (orderVal < categoryMap.get(lowerName).order) {
            categoryMap.set(lowerName, { name: catName, order: orderVal });
          }
        }
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => a.order - b.order)
      .map((item) => item.name);
  };

  useEffect(() => {
    Promise.all([getAllFoods(), getAllBranches(), getAllCoupons()])
      .then(([foodsData, branchesData, couponsData]) => {
        const loadedFoods = foodsData || [];
        setFoods(loadedFoods);
        setBranches(branchesData || []);
        setCoupons(couponsData || []); // 🎯 কুপন ডাটা সেট করা হলো
        setIsLoading(false);

        const orderedCats = processCategories(loadedFoods);
        setSortedCategories(orderedCats);
      })
      .catch((err) => {
        console.error("Error loading admin foods data:", err);
        setIsLoading(false);
      });
  }, []);

  const syncFromServer = useCallback(
    () =>
      Promise.all([getAllFoods(), getAllBranches(), getAllCoupons()])
        .then(([foodsData, branchesData, couponsData]) => {
          const loadedFoods = foodsData || [];
          setFoods(loadedFoods);
          setBranches(branchesData || []);
          setCoupons(couponsData || []);
          
          const orderedCats = processCategories(loadedFoods);
          setSortedCategories(orderedCats);
        })
        .catch((err) => console.error("Background sync failed:", err)),
    [],
  );

  useVisiblePolling(syncFromServer, { intervalMs: 60000, enabled: !isModalOpen });

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    syncFromServer().finally(() => setIsRefreshing(false));
  };

  const handleCategoryReorder = async (newOrder) => {
    const orderMap = new Map();
    newOrder.forEach((cat) => {
      if (cat) orderMap.set(cat.trim().toLowerCase(), cat.trim());
    });
    const finalUniqueOrder = Array.from(orderMap.values());
    
    setSortedCategories(finalUniqueOrder);

    const orderLookup = new Map(finalUniqueOrder.map((cat, idx) => [cat.toLowerCase(), idx + 1]));
    setFoods((prevFoods) =>
      prevFoods.map((f) => ({
        ...f,
        categoryOrder: orderLookup.get(f.category?.trim().toLowerCase()) ?? 999,
      }))
    );

    try {
      if (typeof updateCategoryOrder === "function") {
        await updateCategoryOrder(finalUniqueOrder);
      }
    } catch (err) {
      console.error("Error updating category order on server:", err);
    }
  };

  const handleFoodReorder = async (reorderedFoods) => {
    setFoods(reorderedFoods);
    const orderedIds = reorderedFoods.map((f) => String(f.id || f._id));

    try {
      if (typeof updateFoodOrder === "function") {
        await updateFoodOrder(orderedIds);
      }
    } catch (err) {
      console.error("Error updating food order on server:", err);
    }
  };

  const formatForDateTimeInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const tzoffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  const openCreateModal = () => {
    setEditingFood(null);
    setIsCustomCategory(false);
    setIsCustomVariantLabel(false);
    setImagePreview(null);
    setFormData({
      name: "",
      category: sortedCategories[0] || "",
      price: 0,
      rating: 4.5,
      image: "",
      description: "",
      popular: false,
      isAdminFeatured: false,
      featuredOrder: 1,
      discountType: "percent",
      discountPct: 0,
      discountAmount: 0,
      offerType: "none",
      promoCode: "",
      discountStartDate: "",
      discountEndDate: "",
      branchIds: [],
      branchPrices: {},
      variantLabel: "Size",
      variations: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (food) => {
    setEditingFood(food);
    const isCustomCat = food.category && !sortedCategories.map(sc => sc.toLowerCase()).includes(food.category.trim().toLowerCase());
    setIsCustomCategory(isCustomCat);

    const isCustomVarLabel = food.variantLabel && !standardVariantLabels.map(sv => sv.toLowerCase()).includes(food.variantLabel.trim().toLowerCase());
    setIsCustomVariantLabel(isCustomVarLabel);

    setImagePreview(food.image || null);

    const formattedBranches = (food.branchIds || []).map(String).filter(Boolean);

    const formattedBranchPrices = {};
    if (food.branchPrices) {
      Object.entries(food.branchPrices).forEach(([key, val]) => {
        formattedBranchPrices[String(key)] = val;
      });
    }

    setFormData({
      name: food.name || "",
      category: food.category || "",
      price: food.price || 0,
      rating: food.rating || 4.5,
      image: food.image || "",
      description: food.description || "",
      popular: !!food.popular,
      isAdminFeatured: !!food.isAdminFeatured,
      featuredOrder: food.featuredOrder || 1,
      discountType: food.discountType === 'flat' ? 'flat' : 'percent',
      discountPct: food.discountPct || 0,
      discountAmount: food.discountAmount || 0,
      offerType: food.offerType || "none",
      promoCode: food.promoCode || "",
      discountStartDate: formatForDateTimeInput(food.discountStartDate),
      discountEndDate: formatForDateTimeInput(food.discountEndDate),
      branchIds: formattedBranches,
      branchPrices: formattedBranchPrices,
      variantLabel: food.variantLabel || "Size",
      variations: (food.variations || []).map(v => ({
        name: v.name || "",
        price: v.price || 0,
        image: v.image || ""
      })),
    });
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBranchToggle = (branchId) => {
    const targetId = String(branchId);
    setFormData((prev) => {
      const isSelected = prev.branchIds.includes(targetId);
      let updatedBranchIds;
      let updatedPrices = { ...prev.branchPrices };

      if (isSelected) {
        updatedBranchIds = prev.branchIds.filter((id) => String(id) !== targetId);
        delete updatedPrices[targetId];
      } else {
        updatedBranchIds = [...prev.branchIds, targetId];
        if (updatedPrices[targetId] === undefined) updatedPrices[targetId] = 0;
      }

      return {
        ...prev,
        branchIds: updatedBranchIds,
        branchPrices: updatedPrices,
      };
    });
  };

  const handleBranchPriceChange = (branchId, value) => {
    const targetId = String(branchId);
    setFormData((prev) => ({
      ...prev,
      branchPrices: { ...prev.branchPrices, [targetId]: parseFloat(value) || 0 },
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this dish?")) {
      try {
        await deleteFood(id);
        setFoods(foods.filter((f) => (f.id || f._id) !== id));
      } catch (err) {
        alert("Failed to delete dish.");
      }
    }
  };

  const handleAddVariation = () => {
    setFormData((prev) => ({
      ...prev,
      variations: [...prev.variations, { name: "", price: prev.price, image: "" }],
    }));
  };

  const handleVariationChange = (index, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.variations];
      updated[index][field] = field === "price" ? parseFloat(val) || 0 : val;
      return { ...prev, variations: updated };
    });
  };

  const handleVariationImageChange = (index, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleVariationChange(index, "image", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveVariation = (index) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }));
  };

  const handleOfferTypeChange = (selectedOffer) => {
    setFormData((prev) => ({
      ...prev,
      offerType: selectedOffer,
      discountPct: selectedOffer !== "none" ? 0 : prev.discountPct,
      discountAmount: selectedOffer !== "none" ? 0 : prev.discountAmount,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const categoryName = formData.category?.trim();
      const existingCategoryIndex = sortedCategories.findIndex(
        (c) => c.toLowerCase() === categoryName.toLowerCase()
      );

      const categoryOrder = existingCategoryIndex !== -1 ? existingCategoryIndex + 1 : 999;

      const cleanedFormData = {
        ...formData,
        category: categoryName,
        categoryOrder,
        variantLabel: formData.variantLabel?.trim(),
        branchIds: formData.branchIds.map(Number),
        discountPct: formData.offerType !== "none" ? 0 : Number(formData.discountPct) || 0,
        discountAmount: formData.offerType !== "none" ? 0 : Number(formData.discountAmount) || 0,
        discountStartDate: formData.discountStartDate ? new Date(formData.discountStartDate).toISOString() : null,
        discountEndDate: formData.discountEndDate ? new Date(formData.discountEndDate).toISOString() : null,
      };

      let newFoodsList;
      if (editingFood) {
        const updated = await updateFood(editingFood.id || editingFood._id, cleanedFormData);
        newFoodsList = foods.map((f) => ((f.id || f._id) === (editingFood.id || editingFood._id) ? updated : f));
        setFoods(newFoodsList);
      } else {
        const created = await createFood(cleanedFormData);
        newFoodsList = [created, ...foods];
        setFoods(newFoodsList);
      }

      const updatedCats = processCategories(newFoodsList);
      setSortedCategories(updatedCats);

      setIsModalOpen(false);
    } catch (err) {
      alert("Error saving dish details.");
    }
  };

  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [String(b._id || b.id || ""), b.name])),
    [branches],
  );

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchesSearch = f.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || f.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [foods, search, selectedCategory]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            Manage Menu Items
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Total {foods.length} dishes registered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh the list now"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-200 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Dish
          </button>
        </div>
      </div>

      {/* Filters & Settings */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-2xl flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none"
            />
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial flex items-center gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none z-10" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none font-medium cursor-pointer appearance-none"
              >
                <option value="All">All Categories</option>
                {sortedCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {selectedCategory !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 z-10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isSortOpen 
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-400" 
                  : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50"
              }`}
              title="Drag & Drop or Edit Categories"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Reordering Panel */}
      <AnimatePresence>
        {isSortOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md space-y-2"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                💡 Drag, Rename or Delete Categories:
              </p>
              <button onClick={() => setIsSortOpen(false)} className="text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer">Close</button>
            </div>
            
            <Reorder.Group 
              axis="y" 
              values={sortedCategories} 
              onReorder={handleCategoryReorder}
              className="flex flex-col gap-1.5"
            >
              {sortedCategories.map((cat) => (
                <Reorder.Item 
                  key={cat} 
                  value={cat}
                  className="flex items-center justify-between px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-grab active:cursor-grabbing select-none hover:border-neutral-200"
                >
                  <span className="flex items-center gap-2 truncate">
                    <GripVertical className="w-4 h-4 text-neutral-400 shrink-0" />
                    {cat}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const newCatName = prompt(`Rename category "${cat}" to:`, cat);
                        if (newCatName && newCatName.trim() && newCatName.trim() !== cat) {
                          const trimmed = newCatName.trim();
                          const updatedFoods = foods.map(f => f.category === cat ? { ...f, category: trimmed } : f);
                          setFoods(updatedFoods);
                          
                          const foodsToUpdate = foods.filter(f => f.category === cat);
                          await Promise.all(foodsToUpdate.map(f => updateFood(f.id || f._id, { category: trimmed })));
                          setSortedCategories(prev => prev.map(c => c === cat ? trimmed : c));
                        }
                      }}
                      className="p-1 text-neutral-400 hover:text-blue-500 rounded cursor-pointer"
                      title="Rename Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete category "${cat}" and all associated dishes?`)) {
                          const foodsToDelete = foods.filter(f => f.category === cat);
                          await Promise.all(foodsToDelete.map(f => deleteFood(f.id || f._id)));
                          setFoods(prev => prev.filter(f => f.category !== cat));
                          setSortedCategories(prev => prev.filter(c => c !== cat));
                        }
                      }}
                      className="p-1 text-neutral-400 hover:text-red-500 rounded cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Foods List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {filteredFoods.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-950/20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
              <p className="text-sm text-neutral-400 italic">No food items match your filter criteria.</p>
            </div>
          ) : (
            <Reorder.Group 
              axis="y" 
              values={filteredFoods} 
              onReorder={handleFoodReorder}
              className="flex flex-col gap-3"
            >
              {filteredFoods.map((food) => (
                <Reorder.Item
                  key={food.id || food._id}
                  value={food}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow gap-4 cursor-grab active:cursor-grabbing select-none touch-none"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto pointer-events-none">
                    {food.image ? (
                      <img src={food.image} alt={food.name} className="w-14 h-14 rounded-xl object-cover bg-neutral-50 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {food.category}
                        </span>
                        {food.promoCode && (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200">
                            🏷️ {food.promoCode}
                          </span>
                        )}
                        {food.offerType && food.offerType !== "none" && (
                          <span className="text-[10px] px-2 py-0.5 font-extrabold rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            {food.offerType === "bogo_1g1" ? "BUY 1 GET 1" : food.offerType === "bogo_1g2" ? "BUY 1 GET 2" : "COMBO DEAL"}
                          </span>
                        )}
                        {food.popular && <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        {food.isAdminFeatured && <Star className="w-3.5 h-3.5 text-primary-500 fill-primary-500" />}
                      </div>
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm truncate">{food.name}</h3>
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5 max-w-xl hidden md:block">{food.description || "No description provided."}</p>

                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        {(food.branchIds || []).length === 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 font-bold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            All branches
                          </span>
                        ) : (
                          <>
                            {food.branchIds.slice(0, 3).map((bid) => (
                              <span key={bid} className="text-[10px] px-1.5 py-0.5 font-semibold rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500">
                                {branchNameById.get(String(bid)) || `Branch #${bid}`}
                              </span>
                            ))}
                            {food.branchIds.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 font-semibold rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                                +{food.branchIds.length - 3} more
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-50 dark:border-neutral-800/50">
                    <div className="text-left sm:text-right min-w-[75px] pointer-events-none">
                      <p className="text-sm font-black text-primary-500">৳{food.price}</p>
                      {food.rating && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 mt-0.5 rounded">★ {food.rating}</span>}
                    </div>

                    <div className="flex items-center gap-1 pointer-events-auto">
                      <button onClick={() => openEditModal(food)} className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(food.id || food._id)} className="p-2 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                <h2 className="text-lg font-black text-neutral-900 dark:text-white">
                  {editingFood ? "Edit Menu Dish" : "Create New Dish"}
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Main Dish Image *</label>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  {imagePreview ? (
                    <div className="relative group w-full h-36 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" onClick={() => fileInputRef.current.click()} className="px-3 py-1.5 bg-white text-neutral-900 rounded-xl font-bold text-xs shadow cursor-pointer">Change</button>
                        <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: "" }); }} className="px-3 py-1.5 bg-red-500 text-white rounded-xl font-bold text-xs shadow cursor-pointer">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current.click()} className="w-full h-36 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950/40 transition-colors">
                      <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500"><Upload className="w-5 h-5" /></div>
                      <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Click to upload dish image</p>
                      <p className="text-[10px] text-neutral-400">Supports JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Dish Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                  </div>

                  <div className={isCustomCategory ? "col-span-2 space-y-2" : "col-span-1"}>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Category *</label>
                    <select value={isCustomCategory ? "Custom" : formData.category} onChange={(e) => { if (e.target.value === "Custom") { setIsCustomCategory(true); setFormData({ ...formData, category: "" }); } else { setIsCustomCategory(false); setFormData({ ...formData, category: e.target.value }); } }} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none cursor-pointer">
                      {sortedCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Custom">Other (Type custom...)</option>
                    </select>
                    {isCustomCategory && (
                      <div className="flex gap-2 items-center mt-2">
                        <input type="text" required placeholder="Enter custom category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                        <button type="button" onClick={() => { setIsCustomCategory(false); setFormData({ ...formData, category: sortedCategories[0] || "" }); }} className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-1 cursor-pointer">Reset</button>
                      </div>
                    )}
                  </div>

                  <div className={isCustomCategory ? "col-span-2" : "col-span-1"}>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Base Price (৳) *</label>
                    <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                  </div>
                </div>

                {/* 🎯 Admin Coupons Select Section */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" /> Assign Promo Coupon Code
                  </label>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Admin Coupons লিস্ট থেকে একটি কুপন কোড সিলেক্ট করুন যা এই ডিশের সাথে প্রমোশন হিসেবে দেখাবে।
                  </p>
                  <select
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-bold focus:outline-none cursor-pointer uppercase"
                  >
                    <option value="">No Coupon Assigned</option>
                    {coupons.map((cp) => (
                      <option key={cp.id || cp._id} value={cp.code}>
                        {cp.code} ({cp.discountPct ? `${cp.discountPct}%` : `৳${cp.discountAmount}`} OFF)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Special Promotion / Offer Type Section */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                  <label className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Gift className="w-3.5 h-3.5" /> Special Promotion / Offer Type
                  </label>
                  <select
                    value={formData.offerType}
                    onChange={(e) => handleOfferTypeChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="none">No Offer (Standard)</option>
                    <option value="bogo_1g1">Buy 1 Get 1 Free (BUY 1 GET 1)</option>
                    <option value="bogo_1g2">Buy 1 Get 2 Free (BUY 1 GET 2)</option>
                    <option value="combo">Special Combo Deal</option>
                  </select>
                </div>

                {/* Rating & Discount Section */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Rating *</label>
                    <input type="number" step="0.1" min="1.0" max="5.0" required value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Discount Value</label>
                    <div className="flex gap-2">
                      <select 
                        disabled={formData.offerType !== "none"} 
                        value={formData.discountType} 
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} 
                        className="px-2 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="percent">%</option>
                        <option value="flat">৳</option>
                      </select>
                      {formData.discountType === 'flat' ? (
                        <input 
                          type="number" 
                          min="0" 
                          step="1" 
                          disabled={formData.offerType !== "none"} 
                          value={formData.offerType !== "none" ? 0 : formData.discountAmount} 
                          onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })} 
                          placeholder="৳ off" 
                          className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none disabled:opacity-50" 
                        />
                      ) : (
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          disabled={formData.offerType !== "none"} 
                          value={formData.offerType !== "none" ? 0 : formData.discountPct} 
                          onChange={(e) => setFormData({ ...formData, discountPct: parseInt(e.target.value) || 0 })} 
                          placeholder="% off" 
                          className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none disabled:opacity-50" 
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Timer Section */}
                <div className="p-3.5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 space-y-2">
                  <label className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" /> Promotion / Discount Duration Timer
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 block mb-1">Start Date & Time</span>
                      <input
                        type="datetime-local"
                        value={formData.discountStartDate}
                        onChange={(e) => setFormData({ ...formData, discountStartDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 block mb-1">End Date & Time</span>
                      <input
                        type="datetime-local"
                        value={formData.discountEndDate}
                        onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Variants Section */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800/60 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Size / Weight / Custom Variants</label>
                    <button type="button" onClick={handleAddVariation} className="text-xs px-2.5 py-1 bg-primary-500 text-white font-bold rounded-lg cursor-pointer">+ Add Variant</button>
                  </div>
                  <div className="space-y-2.5 pt-1">
                    {formData.variations.map((v, index) => (
                      <div key={index} className="flex flex-col gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-sm">
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            placeholder="Variant name" 
                            value={v.name} 
                            onChange={(e) => handleVariationChange(index, "name", e.target.value)} 
                            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none" 
                            required 
                          />
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            placeholder="Price" 
                            value={v.price} 
                            onChange={(e) => handleVariationChange(index, "price", e.target.value)} 
                            className="w-28 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none" 
                            required 
                          />
                          <button type="button" onClick={() => handleRemoveVariation(index)} className="p-1.5 text-red-500">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description & Toggles */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none resize-none" />
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="checkbox" checked={formData.popular} onChange={(e) => setFormData({ ...formData, popular: e.target.checked })} className="rounded text-primary-500 cursor-pointer" /> Mark as Popular
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="checkbox" checked={formData.isAdminFeatured} onChange={(e) => setFormData({ ...formData, isAdminFeatured: e.target.checked })} className="rounded text-primary-500 cursor-pointer" /> Featured Dish
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border text-neutral-600 text-sm font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold cursor-pointer">
                    {editingFood ? "Save Changes" : "Create Dish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDishes;
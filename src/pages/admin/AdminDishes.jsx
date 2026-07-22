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
} from "lucide-react";
import {
  getAllFoods,
  createFood,
  updateFood,
  deleteFood,
} from "../../services/foodsService";
import { getAllBranches } from "../../services/branchesService";
import { useVisiblePolling } from "../../hooks/useVisiblePolling";

export const AdminDishes = () => {
  const [foods, setFoods] = useState([]);
  const [branches, setBranches] = useState([]);
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
    category: "Mains",
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
    branchIds: [],
    branchPrices: {},
    variantLabel: "Size",
    variations: [],
  });

  const standardCategories = ["Mains", "Starters", "Desserts", "Beverages"];
  const standardVariantLabels = ["Size", "Weight", "Portion", "Piece"];

  useEffect(() => {
    Promise.all([getAllFoods(), getAllBranches()])
        .then(([foodsData, branchesData]) => {
          setFoods(foodsData || []);
          setBranches(branchesData || []);
          setIsLoading(false);

          const cats = (foodsData || []).map((f) => f.category?.trim()).filter(Boolean);
          
          const uniqueMap = new Map();
          cats.forEach(cat => {
            const lowerCaseCat = cat.toLowerCase();
            let finalCatName = cat;
            if (lowerCaseCat === "deserts") finalCatName = "Desserts";
            
            const finalKey = finalCatName.toLowerCase();
            if (!uniqueMap.has(finalKey)) {
              uniqueMap.set(finalKey, finalCatName);
            }
          });

          const uniqueCustom = Array.from(uniqueMap.values()).filter(
            (c) => !standardCategories.map(sc => sc.toLowerCase()).includes(c.toLowerCase())
          );
          
          const currentTotalCategories = [...standardCategories, ...uniqueCustom];

          const savedOrder = localStorage.getItem("custom_category_order");
          if (savedOrder) {
            const parsedOrder = JSON.parse(savedOrder).map(c => c?.trim()).filter(Boolean);
            
            const cleanedSavedMap = new Map();
            parsedOrder.forEach(cat => {
              cleanedSavedMap.set(cat.toLowerCase(), cat);
            });
            const uniqueSavedOrder = Array.from(cleanedSavedMap.values());

            const combined = [
              ...uniqueSavedOrder.filter(so => currentTotalCategories.map(cc => cc.toLowerCase()).includes(so.toLowerCase())),
              ...currentTotalCategories.filter(cc => !uniqueSavedOrder.map(so => so.toLowerCase()).includes(cc.toLowerCase()))
            ];
            
            setSortedCategories(combined);
          } else {
            setSortedCategories(currentTotalCategories);
          }
        })
        .catch((err) => {
          console.error("Error loading admin foods data:", err);
          setIsLoading(false);
        });
  }, []);

  const syncFromServer = useCallback(
    () =>
      Promise.all([getAllFoods(), getAllBranches()])
        .then(([foodsData, branchesData]) => {
          setFoods(foodsData || []);
          setBranches(branchesData || []);
        })
        .catch((err) => console.error("Background sync failed:", err)),
    [],
  );

  useVisiblePolling(syncFromServer, { intervalMs: 60000, enabled: !isModalOpen });

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    syncFromServer().finally(() => setIsRefreshing(false));
  };

  const handleReorder = (newOrder) => {
    const orderMap = new Map();
    newOrder.forEach(cat => {
      if (cat) orderMap.set(cat.trim().toLowerCase(), cat.trim());
    });
    const finalUniqueOrder = Array.from(orderMap.values());

    setSortedCategories(finalUniqueOrder);
    localStorage.setItem("custom_category_order", JSON.stringify(finalUniqueOrder));
  };

  const openCreateModal = () => {
    setEditingFood(null);
    setIsCustomCategory(false);
    setIsCustomVariantLabel(false);
    setImagePreview(null);
    setFormData({
      name: "",
      category: sortedCategories[0] || "Mains",
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
      branchIds: [],
      branchPrices: {},
      variantLabel: "Size",
      variations: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (food) => {
    setEditingFood(food);
    const isCustomCat = food.category && !standardCategories.map(sc => sc.toLowerCase()).includes(food.category.trim().toLowerCase());
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
      category: food.category || "Mains",
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
      branchIds: formattedBranches,
      branchPrices: formattedBranchPrices,
      variantLabel: food.variantLabel || "Size",
      variations: (food.variations || []).map(v => ({
        name: v.name || "",
        price: v.price || 0,
        image: v.image || "" // Load variant specific image
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
        setFoods(foods.filter((f) => f.id !== id));
      } catch (err) {
        alert("Failed to delete dish.");
      }
    }
  };

  // Add variation handler with optional image field
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

  // Variant base image upload
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const cleanedFormData = {
        ...formData,
        category: formData.category?.trim(),
        variantLabel: formData.variantLabel?.trim(),
        branchIds: formData.branchIds.map(Number),
      };

      if (editingFood) {
        const updated = await updateFood(editingFood.id, cleanedFormData);
        setFoods(foods.map((f) => (f.id === editingFood.id ? updated : f)));
      } else {
        const created = await createFood(cleanedFormData);
        setFoods([created, ...foods]);
        
        const createdCatTrimmed = created.category?.trim();
        if (createdCatTrimmed && !sortedCategories.map(c => c.toLowerCase()).includes(createdCatTrimmed.toLowerCase())) {
          const newCats = [...sortedCategories, createdCatTrimmed];
          setSortedCategories(newCats);
          localStorage.setItem("custom_category_order", JSON.stringify(newCats));
        }
      }
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
    const matched = foods.filter((f) => {
      const matchesSearch = f.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || f.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      return matchesSearch && matchesCategory;
    });

    return matched.sort((a, b) => {
      const indexA = sortedCategories.findIndex(c => c.toLowerCase() === a.category?.trim().toLowerCase());
      const indexB = sortedCategories.findIndex(c => c.toLowerCase() === b.category?.trim().toLowerCase());
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      return 0;
    });
  }, [foods, search, selectedCategory, sortedCategories]);

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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-200 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Dish
          </button>
        </div>
      </div>

      {/* Filters */}
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

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none z-10" />
            <input
              type="text"
              list="category-options"
              placeholder="Filter by category..."
              value={selectedCategory === "All" ? "" : selectedCategory}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCategory(val === "" ? "All" : val);
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none font-medium"
            />
            {selectedCategory !== "All" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <datalist id="category-options">
              <option value="All">All Categories</option>
              {sortedCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSortOpen(!isSortOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
            isSortOpen 
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-400" 
              : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50"
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Drag & Drop Categories
        </button>
      </div>

      {/* Category Reordering Panel */}
      <AnimatePresence>
        {isSortOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl space-y-2"
          >
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              💡 Click and drag any category to move it up or down.
            </p>
            
            <Reorder.Group 
              axis="y" 
              values={sortedCategories} 
              onReorder={handleReorder}
              className="flex flex-col gap-1.5"
            >
              {sortedCategories.map((cat) => (
                <Reorder.Item 
                  key={cat} 
                  value={cat}
                  className="flex items-center justify-between px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-grab active:cursor-grabbing select-none hover:border-neutral-200"
                >
                  <span className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-neutral-400" />
                    {cat}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">Tug to move</span>
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
            <div className="flex flex-col gap-3">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl shadow-sm hover:shadow-md transition-all gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
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
                    <div className="text-left sm:text-right min-w-[75px]">
                      <p className="text-sm font-black text-primary-500">৳{food.price}</p>
                      {food.rating && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 mt-0.5 rounded">★ {food.rating}</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(food)} className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(food.id)} className="p-2 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
                {/* Image upload */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Main Dish Image *</label>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  {imagePreview ? (
                    <div className="relative group w-full h-36 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" onClick={() => fileInputRef.current.click()} className="px-3 py-1.5 bg-white text-neutral-900 rounded-xl font-bold text-xs shadow">Change</button>
                        <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: "" }); }} className="px-3 py-1.5 bg-red-500 text-white rounded-xl font-bold text-xs shadow">Remove</button>
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

                {/* Info Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Dish Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                  </div>

                  <div className={isCustomCategory ? "col-span-2 space-y-2" : "col-span-1"}>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Category *</label>
                    <select value={isCustomCategory ? "Custom" : formData.category} onChange={(e) => { if (e.target.value === "Custom") { setIsCustomCategory(true); setFormData({ ...formData, category: "" }); } else { setIsCustomCategory(false); setFormData({ ...formData, category: e.target.value }); } }} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none">
                      {sortedCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Custom">Other (Type custom...)</option>
                    </select>
                    {isCustomCategory && (
                      <div className="flex gap-2 items-center mt-2">
                        <input type="text" required placeholder="Enter custom category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                        <button type="button" onClick={() => { setIsCustomCategory(false); setFormData({ ...formData, category: sortedCategories[0] || "Mains" }); }} className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-1">Reset</button>
                      </div>
                    )}
                  </div>

                  <div className={isCustomCategory ? "col-span-2" : "col-span-1"}>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Base Price (৳) *</label>
                    <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                  </div>
                </div>

                {/* Rating & Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Rating *</label>
                    <input type="number" step="0.1" min="1.0" max="5.0" required value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Discount</label>
                    <div className="flex gap-2">
                      <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} className="px-2 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none cursor-pointer" title="Discount type">
                        <option value="percent">%</option>
                        <option value="flat">৳</option>
                      </select>
                      {formData.discountType === 'flat' ? (
                        <input type="number" min="0" step="1" value={formData.discountAmount} onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })} placeholder="৳ off" className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                      ) : (
                        <input type="number" min="0" max="100" value={formData.discountPct} onChange={(e) => setFormData({ ...formData, discountPct: parseInt(e.target.value) || 0 })} placeholder="% off" className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants Component (Supports Custom Variant Types + Per-Variant Images) */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800/60 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Size / Weight / Custom Variants</label>
                    <button type="button" onClick={handleAddVariation} className="text-xs px-2.5 py-1 bg-primary-500 text-white font-bold rounded-lg">+ Add Variant</button>
                  </div>

                  {/* Custom Variant Type Selector */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-neutral-400 shrink-0">Variant type</span>
                      <select 
                        value={isCustomVariantLabel ? "Custom" : formData.variantLabel} 
                        onChange={(e) => {
                          if (e.target.value === "Custom") {
                            setIsCustomVariantLabel(true);
                            setFormData({ ...formData, variantLabel: "" });
                          } else {
                            setIsCustomVariantLabel(false);
                            setFormData({ ...formData, variantLabel: e.target.value });
                          }
                        }} 
                        className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="Size">Size (Small / Large / 2XL)</option>
                        <option value="Weight">Weight (250g / 500g / 1kg)</option>
                        <option value="Portion">Portion (Half / Full)</option>
                        <option value="Piece">Piece (6 pcs / 12 pcs)</option>
                        <option value="Custom">Custom Label (Type manually...)</option>
                      </select>
                    </div>

                    {isCustomVariantLabel && (
                      <div className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="e.g. Flavor, Package, Color" 
                          value={formData.variantLabel} 
                          onChange={(e) => setFormData({ ...formData, variantLabel: e.target.value })} 
                          className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none" 
                          required 
                        />
                        <button 
                          type="button" 
                          onClick={() => { setIsCustomVariantLabel(false); setFormData({ ...formData, variantLabel: "Size" }); }} 
                          className="text-[11px] text-neutral-400 hover:text-neutral-600 px-2 py-1"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>

                  {formData.variations.length === 0 && (
                    <p className="text-xs text-neutral-400 italic">No variants — the dish sells at its single base price.</p>
                  )}

                  {/* Variation Items List */}
                  <div className="space-y-2.5 pt-1">
                    {formData.variations.map((v, index) => (
                      <div key={index} className="flex flex-col gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-sm">
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            placeholder={`${formData.variantLabel || "Variant"} name`} 
                            value={v.name} 
                            onChange={(e) => handleVariationChange(index, "name", e.target.value)} 
                            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none font-medium" 
                            required 
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">৳</span>
                            <input 
                              type="number" 
                              step="0.01" 
                              min="0" 
                              placeholder="Price" 
                              value={v.price} 
                              onChange={(e) => handleVariationChange(index, "price", e.target.value)} 
                              className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none font-bold" 
                              required 
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveVariation(index)} 
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove variant"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Variant Specific Image Upload Option */}
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/60 text-[11px]">
                          <span className="text-neutral-500 font-medium flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-neutral-400" /> Variant Image:
                          </span>

                          {v.image ? (
                            <div className="flex items-center gap-2">
                              <img src={v.image} alt="Variant preview" className="w-7 h-7 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700" />
                              <button 
                                type="button" 
                                onClick={() => handleVariationChange(index, "image", "")} 
                                className="text-red-500 hover:underline font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input 
                                type="file" 
                                id={`variant-image-${index}`} 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleVariationImageChange(index, e.target.files[0])} 
                              />
                              <label 
                                htmlFor={`variant-image-${index}`} 
                                className="cursor-pointer px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold transition-colors"
                              >
                                + Add Variant Image
                              </label>
                              <span className="text-neutral-400 italic text-[10px]">(খালি রাখলে Main Image দেখাবে)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BULLETPROOF BRANCH AVAILABILITY RENDER */}
                {branches.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-neutral-950/20 border border-amber-100 dark:border-neutral-800/60 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Branch Availability & Price Adjustment
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-500">
                        {formData.branchIds.length} of {branches.length} selected
                      </span>
                    </div>
                    {formData.branchIds.length === 0 && (
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                        কোনো branch টিক না দিলে dish টা <strong>সব branch-এ</strong> দেখাবে। নির্দিষ্ট branch-এ সীমাবদ্ধ রাখতে সেগুলোতে টিক দিন।
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {branches.map((branch) => {
                        const currentBranchId = String(branch._id || branch.id || "");
                        const isChecked = formData.branchIds.map(id => String(id)).includes(currentBranchId);
                        const branchPriceVal = formData.branchPrices[currentBranchId] !== undefined 
                          ? formData.branchPrices[currentBranchId] 
                          : "";

                        return (
                          <div 
                            key={currentBranchId} 
                            className={`flex flex-col p-3 rounded-xl border transition-all ${
                              isChecked 
                                ? "bg-white dark:bg-neutral-900 border-amber-300 dark:border-amber-500 shadow-sm opacity-100" 
                                : "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer flex-1 select-none">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => handleBranchToggle(currentBranchId)} 
                                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer" 
                                />
                                <span className={isChecked ? "text-amber-900 dark:text-amber-400" : "text-neutral-500"}>
                                  {branch.name}
                                </span>
                              </label>

                              {isChecked && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-neutral-400">Price Adj:</span>
                                  <input 
                                    type="number" 
                                    placeholder="৳0" 
                                    value={branchPriceVal} 
                                    onChange={(e) => handleBranchPriceChange(currentBranchId, e.target.value)} 
                                    className="w-16 px-2 py-1 rounded-lg border text-[11px] font-bold focus:outline-none focus:border-amber-400 dark:bg-neutral-800 dark:border-neutral-700" 
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none resize-none" />
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="checkbox" checked={formData.popular} onChange={(e) => setFormData({ ...formData, popular: e.target.checked })} className="rounded text-primary-500" /> Mark as Popular
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="checkbox" checked={formData.isAdminFeatured} onChange={(e) => setFormData({ ...formData, isAdminFeatured: e.target.checked })} className="rounded text-primary-500" /> Featured Dish
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border text-neutral-600 text-sm font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold">
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
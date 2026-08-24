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
  Check,
  CheckSquare,
  Square,
  Sparkles,
  FolderPlus,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  getAllFoods,
  createFood,
  updateFood,
  deleteFood,
  updateFoodOrder,
  updateCategoryOrder,
} from "../../services/foodsService";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../../services/categoriesService";
import { getAllBranches } from "../../services/branchesService";
import { getAllCoupons } from "../../services/couponsService";
import {
  getAllAddonGroups,
  createAddonGroup,
  updateAddonGroup,
  deleteAddonGroup,
  seedDefaultAddons,
} from "../../services/addonsService";
import { socket } from "../../services/socket";
import { useVisiblePolling } from "../../hooks/useVisiblePolling";

export const AdminDishes = () => {
  const [foods, setFoods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reorderCooldown, setReorderCooldown] = useState(false); // [SORTING-FIX] reorder-এর পরে কিছুক্ষণ polling বন্ধ রাখা
  const [orderSyncStatus, setOrderSyncStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'
  const latestOrderedFoodIdsRef = useRef([]);
  const latestOrderedCategoryOrderRef = useRef([]);
  const isSelfReorderingRef = useRef(false);
  const orderSyncStatusRef = useRef("idle");

  const setSyncStatus = (status) => {
    orderSyncStatusRef.current = status;
    setOrderSyncStatus(status);
  };

  const [sortedCategories, setSortedCategories] = useState([]);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // 🎯 Centralized Categories Management States
  const [centralCategories, setCentralCategories] = useState([]);
  const [isCentralCategoriesModalOpen, setIsCentralCategoriesModalOpen] = useState(false);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null for create, object for edit
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // 🎯 Centralized Add-ons Group Management States
  const [addonGroups, setAddonGroups] = useState([]);
  const [isCentralAddonsModalOpen, setIsCentralAddonsModalOpen] = useState(false);
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null); // null for create, object for edit
  const [groupFormData, setGroupFormData] = useState({
    title: "",
    items: [{ name: "", price: "" }],
  });
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const [isAddonPickerModalOpen, setIsAddonPickerModalOpen] = useState(false);
  const [selectedPickerItemNames, setSelectedPickerItemNames] = useState(new Set());
  const [pickerSearch, setPickerSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [isCustomVariantLabel, setIsCustomVariantLabel] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    rating: 4.5,
    image: "",
    description: "",
    isAvailable: true,
    isActive: true,
    popular: false,
    isAdminFeatured: false,
    featuredOrder: 1,
    discountType: "percent",
    discountPct: "",
    discountAmount: "",
    offerType: "none",
    promoCode: "",
    discountStartDate: "",
    discountEndDate: "",
    branchIds: [],
    branchPrices: {},
    variantLabel: "Size",
    variations: [],
    addons: [],
  });

  const standardVariantLabels = ["Size", "Weight", "Portion", "Piece"];

  // 🎯 Category Dishes Count for smart badges & safe deletions
  const categoryDishesCount = useMemo(() => {
    const counts = {};
    (foods || []).forEach((f) => {
      if (f.category?.trim()) {
        const lower = f.category.trim().toLowerCase();
        counts[lower] = (counts[lower] || 0) + 1;
      }
    });
    return counts;
  }, [foods]);

  const processCategories = (loadedFoods, loadedCentralCats = []) => {
    const categoryMap = new Map();

    // 1. If Central Categories exist in database, they are the authoritative Source of Truth
    if (Array.isArray(loadedCentralCats) && loadedCentralCats.length > 0) {
      loadedCentralCats.forEach((c, idx) => {
        if (c?.name?.trim()) {
          const catName = c.name.trim();
          const lowerName = catName.toLowerCase();
          const orderVal = typeof c.order === "number" ? c.order : idx + 1;
          categoryMap.set(lowerName, {
            name: catName,
            order: orderVal,
            id: c._id || c.id,
            description: c.description || "",
          });
        }
      });
    } else {
      // 2. Fallback only if Central Categories collection is completely empty
      (loadedFoods || []).forEach((f) => {
        if (f.category?.trim()) {
          const catName = f.category.trim();
          const lowerName = catName.toLowerCase();
          const orderVal =
            typeof f.categoryOrder === "number" ? f.categoryOrder : 999;

          if (!categoryMap.has(lowerName)) {
            categoryMap.set(lowerName, { name: catName, order: orderVal });
          } else {
            const existing = categoryMap.get(lowerName);
            if (typeof existing.order !== "number" || existing.order === 999) {
              existing.order = orderVal;
            }
          }
        }
      });
    }

    return Array.from(categoryMap.values())
      .sort((a, b) => a.order - b.order)
      .map((item) => item.name);
  };

  const cleanExpiredOffers = (foodList) => {
    const now = new Date();
    return foodList.map((food) => {
      if (food.discountEndDate) {
        const endDate = new Date(food.discountEndDate);
        if (endDate < now) {
          return {
            ...food,
            offerType: "none",
            promoCode: "",
            discountPct: 0,
            discountAmount: 0,
            discountStartDate: null,
            discountEndDate: null,
          };
        }
      }
      return food;
    });
  };

  const fetchCentralCategories = useCallback(async () => {
    try {
      const data = await getAllCategories();
      const list = Array.isArray(data) ? data : [];
      setCentralCategories(list);
      setSortedCategories((prevCats) => {
        return processCategories(foods, list);
      });
      return list;
    } catch (err) {
      console.error("Error loading central categories:", err);
      return [];
    }
  }, [foods]);

  const fetchCentralAddons = useCallback(async () => {
    try {
      const data = await getAllAddonGroups();
      setAddonGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading central addons:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      getAllFoods(),
      getAllBranches(),
      getAllCoupons(),
      getAllAddonGroups(),
      getAllCategories(),
    ])
      .then(([foodsData, branchesData, couponsData, addonGroupsData, categoriesData]) => {
        const loadedFoods = cleanExpiredOffers(foodsData || []);
        const loadedCats = Array.isArray(categoriesData) ? categoriesData : [];
        setFoods(loadedFoods);
        setBranches(branchesData || []);
        setCoupons(couponsData || []);
        setAddonGroups(Array.isArray(addonGroupsData) ? addonGroupsData : []);
        setCentralCategories(loadedCats);
        setIsLoading(false);

        const orderedCats = processCategories(loadedFoods, loadedCats);
        setSortedCategories(orderedCats);
      })
      .catch((err) => {
        console.error("Error loading admin foods data:", err);
        setIsLoading(false);
      });
  }, []);

  const syncFromServer = useCallback(
    () =>
      Promise.all([
        getAllFoods(),
        getAllBranches(),
        getAllCoupons(),
        getAllAddonGroups(),
        getAllCategories(),
      ])
        .then(([foodsData, branchesData, couponsData, addonGroupsData, categoriesData]) => {
          const loadedFoods = cleanExpiredOffers(foodsData || []);
          const loadedCats = Array.isArray(categoriesData) ? categoriesData : [];
          setFoods(loadedFoods);
          setBranches(branchesData || []);
          setCoupons(couponsData || []);
          setAddonGroups(Array.isArray(addonGroupsData) ? addonGroupsData : []);
          setCentralCategories(loadedCats);

          const orderedCats = processCategories(loadedFoods, loadedCats);
          setSortedCategories(orderedCats);
        })
        .catch((err) => console.error("Background sync failed:", err)),
    [],
  );

  // [SORTING-FIX] reorder-এর পরে ৫ সেকেন্ড polling বন্ধ থাকবে যেন server overwrite না করে
  useVisiblePolling(syncFromServer, {
    intervalMs: 60000,
    enabled:
      !isModalOpen &&
      !isCentralAddonsModalOpen &&
      !isCentralCategoriesModalOpen &&
      !isCategoryEditorOpen &&
      !isAddonPickerModalOpen &&
      !reorderCooldown,
  });

  // ⚡ Real-Time WebSocket Listeners for Dishes & Categories
  useEffect(() => {
    const handleDishesSync = () => {
      // If we ourselves just reordered or are saving, NEVER refetch from server to prevent self-shuffling!
      if (isSelfReorderingRef.current || orderSyncStatusRef.current !== "idle" || reorderCooldown) {
        return;
      }
      syncFromServer();
    };

    socket.on("foods_updated", handleDishesSync);
    socket.on("categories_updated", handleDishesSync);

    const handleBeforeUnload = () => {
      if (latestOrderedFoodIdsRef.current.length > 0) {
        updateFoodOrder(latestOrderedFoodIdsRef.current).catch(() => {});
      }
      if (latestOrderedCategoryOrderRef.current.length > 0) {
        reorderCategories(latestOrderedCategoryOrderRef.current).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off("foods_updated", handleDishesSync);
      socket.off("categories_updated", handleDishesSync);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [reorderCooldown, syncFromServer]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    syncFromServer().finally(() => setIsRefreshing(false));
  };

  const foodReorderTimeoutRef = useRef(null);
  const categoryReorderTimeoutRef = useRef(null);

  // [SORTING-FIX] Category reorder-এ rollback + cooldown + Fast Debounce + Live Status + Order Guard
  const handleCategoryReorder = async (newOrder) => {
    isSelfReorderingRef.current = true;
    const orderMap = new Map();
    newOrder.forEach((cat) => {
      if (cat) orderMap.set(cat.trim().toLowerCase(), cat.trim());
    });
    const finalUniqueOrder = Array.from(orderMap.values());

    const currentCats = sortedCategories.join(",");
    const newCats = finalUniqueOrder.join(",");
    if (currentCats === newCats) {
      return; // No order change, do not trigger false saves
    }

    const previousCategories = sortedCategories;
    const previousFoods = foods;

    setSortedCategories(finalUniqueOrder);
    latestOrderedCategoryOrderRef.current = finalUniqueOrder;

    const orderLookup = new Map(
      finalUniqueOrder.map((cat, idx) => [cat.toLowerCase(), idx + 1]),
    );
    setFoods((prevFoods) =>
      prevFoods.map((f) => ({
        ...f,
        categoryOrder: orderLookup.get(f.category?.trim().toLowerCase()) ?? 999,
      })),
    );

    setReorderCooldown(true);
    setTimeout(() => setReorderCooldown(false), 5000);

    if (categoryReorderTimeoutRef.current) clearTimeout(categoryReorderTimeoutRef.current);
    categoryReorderTimeoutRef.current = setTimeout(async () => {
      setSyncStatus("saving");
      try {
        await reorderCategories(finalUniqueOrder);
        setSyncStatus("saved");
        latestOrderedCategoryOrderRef.current = [];
        setTimeout(() => {
          setSyncStatus("idle");
          isSelfReorderingRef.current = false;
        }, 2500);
      } catch (err) {
        console.error("Error updating category order on server:", err);
        try {
          if (typeof updateCategoryOrder === "function") {
            await updateCategoryOrder(finalUniqueOrder);
            setSyncStatus("saved");
            latestOrderedCategoryOrderRef.current = [];
            setTimeout(() => {
              setSyncStatus("idle");
              isSelfReorderingRef.current = false;
            }, 2500);
          }
        } catch (fallbackErr) {
          console.error("Fallback category order update failed:", fallbackErr);
          setSyncStatus("error");
          setSortedCategories(previousCategories);
          setFoods(previousFoods);
          isSelfReorderingRef.current = false;
        }
      }
    }, 250);
  };

  // [SORTING-FIX] Food reorder-এ rollback + cooldown + Fast Debounce + Live Status + Order Guard
  const handleFoodReorder = async (reorderedFoods) => {
    isSelfReorderingRef.current = true;
    const reorderedIds = new Set(reorderedFoods.map((f) => f.id || f._id));
    const untouched = foods.filter((f) => !reorderedIds.has(f.id || f._id));
    const merged = [...reorderedFoods, ...untouched];

    const currentIds = foods.map((f) => f.id || f._id).join(",");
    const newIds = merged.map((f) => f.id || f._id).join(",");
    if (currentIds === newIds) {
      return; // No order change, do not trigger false saves
    }

    const previousFoods = foods;
    setFoods(merged);

    const orderedIds = merged.map((b) => {
      const rawId = b.id !== undefined && b.id !== null ? b.id : b._id;
      const numId = Number(rawId);
      return Number.isFinite(numId) ? numId : rawId;
    });
    latestOrderedFoodIdsRef.current = orderedIds;

    setReorderCooldown(true);
    setTimeout(() => setReorderCooldown(false), 5000);

    if (foodReorderTimeoutRef.current) clearTimeout(foodReorderTimeoutRef.current);
    foodReorderTimeoutRef.current = setTimeout(async () => {
      setSyncStatus("saving");
      try {
        if (typeof updateFoodOrder === "function") {
          await updateFoodOrder(orderedIds);
        }
        setSyncStatus("saved");
        latestOrderedFoodIdsRef.current = [];
        setTimeout(() => {
          setSyncStatus("idle");
          isSelfReorderingRef.current = false;
        }, 2500);
      } catch (err) {
        console.error("Error updating food order on server:", err);
        setSyncStatus("error");
        setFoods(previousFoods);
        isSelfReorderingRef.current = false;
      }
    }, 250);
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
    setIsCustomVariantLabel(false);
    setImagePreview(null);
    setFormData({
      name: "",
      category: sortedCategories[0] || "",
      price: "",
      rating: 4.5,
      image: "",
      description: "",
      isAvailable: true,
      isActive: true,
      popular: false,
      isAdminFeatured: false,
      featuredOrder: 1,
      discountType: "percent",
      discountPct: "",
      discountAmount: "",
      offerType: "none",
      promoCode: "",
      discountStartDate: "",
      discountEndDate: "",
      branchIds: [],
      branchPrices: {},
      variantLabel: "Size",
      variations: [],
      addons: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (food) => {
    setEditingFood(food);
    const isCustomVarLabel =
      food.variantLabel &&
      !standardVariantLabels
        .map((sv) => sv.toLowerCase())
        .includes(food.variantLabel.trim().toLowerCase());
    setIsCustomVariantLabel(isCustomVarLabel);

    setImagePreview(food.image || null);

    const formattedBranches = (food.branchIds || [])
      .map(String)
      .filter(Boolean);

    const formattedBranchPrices = {};
    if (food.branchPrices) {
      Object.entries(food.branchPrices).forEach(([key, val]) => {
        formattedBranchPrices[String(key)] = val;
      });
    }

    setFormData({
      name: food.name || "",
      category: food.category || "",
      price: food.price !== undefined && food.price !== null ? food.price : "",
      rating: food.rating || 4.5,
      image: food.image || "",
      description: food.description || "",
      isAvailable: food.isAvailable !== false,
      isActive: food.isActive !== false,
      popular: !!food.popular,
      isAdminFeatured: !!food.isAdminFeatured,
      featuredOrder: food.featuredOrder || 1,
      discountType: food.discountType === "flat" ? "flat" : "percent",
      discountPct: food.discountPct || "",
      discountAmount: food.discountAmount || "",
      offerType: food.offerType || "none",
      promoCode: food.promoCode || "",
      discountStartDate: formatForDateTimeInput(food.discountStartDate),
      discountEndDate: formatForDateTimeInput(food.discountEndDate),
      branchIds: formattedBranches,
      branchPrices: formattedBranchPrices,
      variantLabel: food.variantLabel || "Size",
      variations: (food.variations || []).map((v) => ({
        name: v.name || "",
        price: v.price !== undefined && v.price !== null ? v.price : "",
        image: v.image || "",
      })),
      addons: (food.addons || []).map((a) => ({
        name: a.name || "",
        price: a.price !== undefined && a.price !== null ? a.price : "",
        group: a.group || "",
        image: a.image || "",
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
        updatedBranchIds = prev.branchIds.filter(
          (id) => String(id) !== targetId,
        );
        delete updatedPrices[targetId];
      } else {
        updatedBranchIds = [...prev.branchIds, targetId];
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
      branchPrices: {
        ...prev.branchPrices,
        [targetId]: value,
      },
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

  // 🎯 Quick 1-Tap Kitchen Stock Toggle (In Stock ↔ Sold Out)
  const handleToggleStock = async (foodItem) => {
    const targetId = foodItem.id || foodItem._id;
    const isCurrentlyAvailable = foodItem.isAvailable !== false;
    const nextVal = !isCurrentlyAvailable;
    try {
      setFoods((prev) =>
        prev.map((f) =>
          String(f.id || f._id) === String(targetId)
            ? { ...f, isAvailable: nextVal }
            : f
        )
      );
      const res = await updateFood(targetId, { isAvailable: nextVal });
      if (res && res.data) {
        const updatedDoc = res.data;
        setFoods((prev) =>
          prev.map((f) =>
            String(f.id || f._id) === String(targetId)
              ? { ...f, ...updatedDoc }
              : f
          )
        );
      }
    } catch (err) {
      alert("Failed to update stock status: " + (err.message || err));
      fetchData();
    }
  };

  // 🎯 Quick 1-Tap Active Menu Toggle (Active ↔ Inactive/Hidden)
  const handleToggleActive = async (foodItem) => {
    const targetId = foodItem.id || foodItem._id;
    const isCurrentlyActive = foodItem.isActive !== false;
    const nextVal = !isCurrentlyActive;
    try {
      setFoods((prev) =>
        prev.map((f) =>
          String(f.id || f._id) === String(targetId)
            ? { ...f, isActive: nextVal }
            : f
        )
      );
      const res = await updateFood(targetId, { isActive: nextVal });
      if (res && res.data) {
        const updatedDoc = res.data;
        setFoods((prev) =>
          prev.map((f) =>
            String(f.id || f._id) === String(targetId)
              ? { ...f, ...updatedDoc }
              : f
          )
        );
      }
    } catch (err) {
      alert("Failed to update active status: " + (err.message || err));
      fetchData();
    }
  };

  const handleAddVariation = () => {
    setFormData((prev) => ({
      ...prev,
      variations: [
        ...prev.variations,
        { name: "", price: "", image: "" },
      ],
    }));
  };

  const handleVariationChange = (index, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.variations];
      updated[index][field] =
        field === "price"
          ? val === ""
            ? ""
            : isNaN(Number(val))
            ? 0
            : Number(val)
          : val;
      return { ...prev, variations: updated };
    });
  };

  const handleRemoveVariation = (index) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }));
  };

  // 🎯 Centralized Addon Dynamic Groups & Library Handlers
  const validAddonGroups = useMemo(() => {
    if (!Array.isArray(addonGroups)) return [];
    return addonGroups.filter(
      (g) => g && typeof g === "object" && typeof g.title === "string" && g.title.trim(),
    );
  }, [addonGroups]);

  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormData({
      title: "",
      items: [{ name: "", price: "" }],
    });
    setIsGroupEditorOpen(true);
  };

  const handleOpenEditGroup = (group) => {
    if (!group) return;
    setEditingGroup(group);
    setGroupFormData({
      title: group.title || "",
      items:
        Array.isArray(group.items) && group.items.length > 0
          ? group.items.map((i) => ({
              name: i?.name || "",
              price: i?.price !== undefined && i?.price !== null ? i.price : "",
            }))
          : [{ name: "", price: "" }],
    });
    setIsGroupEditorOpen(true);
  };

  const handleAddGroupItemRow = () => {
    setGroupFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", price: "" }],
    }));
  };

  const handleUpdateGroupItemRow = (index, field, val) => {
    setGroupFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        [field]:
          field === "price"
            ? val === ""
              ? ""
              : isNaN(Number(val))
              ? 0
              : Number(val)
            : val,
      };
      return { ...prev, items: updated };
    });
  };

  const handleRemoveGroupItemRow = (index) => {
    setGroupFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSaveGroup = async (e) => {
    if (e) e.preventDefault();
    const title = groupFormData?.title?.trim() || "";
    if (!title) {
      alert("Please enter a group name (e.g. Extra Cheese, Premium Add-ons)");
      return;
    }

    const validItems = (groupFormData?.items || [])
      .filter((i) => i && i.name && i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        price: Number(i.price) || 0,
      }));

    if (validItems.length === 0) {
      alert("Please add at least one item (with name and price) to this group.");
      return;
    }

    setIsSavingGroup(true);
    try {
      if (editingGroup && (editingGroup._id || editingGroup.id)) {
        const id = editingGroup._id || editingGroup.id;
        await updateAddonGroup(id, { title, items: validItems });
      } else {
        await createAddonGroup({ title, items: validItems });
      }
      await fetchCentralAddons();
      setIsGroupEditorOpen(false);
    } catch (err) {
      alert("Failed to save group: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!groupId) return;
    if (!window.confirm("Are you sure you want to delete this entire add-on group?")) return;
    try {
      await deleteAddonGroup(groupId);
      await fetchCentralAddons();
    } catch (err) {
      alert("Failed to delete group: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm("Do you want to load sample Barcode Burger Add-ons (Extra Cheese, Premium Add-ons)?")) return;
    try {
      const seeded = await seedDefaultAddons();
      setAddonGroups(Array.isArray(seeded) ? seeded : []);
    } catch (err) {
      alert("Failed to seed defaults: " + (err.response?.data?.message || err.message));
    }
  };

  // 🎯 Centralized Category Modal Handlers
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "" });
    setIsCategoryEditorOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    const catName = typeof cat === "string" ? cat : cat?.name || "";
    const catObj =
      typeof cat === "object" && cat !== null && (cat._id || cat.id)
        ? cat
        : centralCategories.find(
            (c) => c.name?.toLowerCase() === catName.toLowerCase(),
          ) || { name: catName };

    setEditingCategory(catObj);
    setCategoryFormData({
      name: catObj.name || catName,
    });
    setIsCategoryEditorOpen(true);
  };

  const handleSaveCategory = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = categoryFormData?.name?.trim();
    if (!name) {
      alert("Please enter a category name (e.g. Burgers, Sides, Beverages)");
      return;
    }

    setIsSavingCategory(true);
    try {
      if (editingCategory && (editingCategory._id || editingCategory.id)) {
        const id = editingCategory._id || editingCategory.id;
        await updateCategory(id, { name });
      } else {
        await createCategory({ name });
      }

      // If Dish Form is currently open, automatically select this new category for the dish
      if (isModalOpen) {
        setFormData((prev) => ({ ...prev, category: name }));
      }

      await syncFromServer();
      setIsCategoryEditorOpen(false);
    } catch (err) {
      alert(
        "Failed to save category: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const catName = typeof cat === "string" ? cat : cat?.name;
    const catId = typeof cat === "object" && cat ? cat._id || cat.id : null;
    if (!catName) return;

    const lowerName = catName.toLowerCase();
    const dishCount = categoryDishesCount[lowerName] || 0;

    let confirmMsg = `Are you sure you want to delete category "${catName}"?`;
    if (dishCount > 0) {
      confirmMsg += `\n\n⚠️ Warning: There are ${dishCount} dish(es) currently assigned to this category. Deleting this category will delete all associated dishes from the menu!`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      const targetId =
        catId ||
        centralCategories.find(
          (c) => c.name?.toLowerCase() === lowerName,
        )?._id;

      if (targetId) {
        await deleteCategory(targetId, dishCount > 0);
      } else {
        const foodsToDelete = foods.filter(
          (f) => f.category?.trim().toLowerCase() === lowerName,
        );
        await Promise.all(foodsToDelete.map((f) => deleteFood(f.id || f._id)));
      }

      // If current selected category was deleted, reset filter to All
      if (selectedCategory.toLowerCase() === lowerName) {
        setSelectedCategory("All");
      }

      await syncFromServer();
    } catch (err) {
      alert(
        "Failed to delete category: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  // 🎯 1-Click Add-on Picker Handlers (for Dish Form)
  const openAddonPicker = () => {
    const currentKeys = new Set(
      (formData.addons || [])
        .map((a) => a?.name?.trim().toLowerCase())
        .filter(Boolean),
    );
    setSelectedPickerItemNames(currentKeys);
    setPickerSearch("");
    setIsAddonPickerModalOpen(true);
  };

  const togglePickerItem = (itemName) => {
    if (!itemName) return;
    const key = itemName.trim().toLowerCase();
    setSelectedPickerItemNames((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const togglePickerGroupAll = (group, isAllSelected) => {
    if (!group) return;
    setSelectedPickerItemNames((prev) => {
      const next = new Set(prev);
      (group.items || []).forEach((item) => {
        if (!item?.name) return;
        const key = item.name.trim().toLowerCase();
        if (isAllSelected) {
          next.delete(key);
        } else {
          next.add(key);
        }
      });
      return next;
    });
  };

  const handleApplyPickerAddons = () => {
    const chosenList = [];
    validAddonGroups.forEach((group) => {
      (group?.items || []).forEach((item) => {
        if (!item?.name) return;
        const key = item.name.trim().toLowerCase();
        if (selectedPickerItemNames.has(key)) {
          chosenList.push({
            name: item.name.trim(),
            price: Number(item.price) || 0,
            group: group?.title || "",
          });
        }
      });
    });

    setFormData((prev) => {
      const existingMap = new Map(
        (prev.addons || []).map((a) => [a?.name?.trim().toLowerCase(), a]),
      );

      const mergedAddons = chosenList.map((chosen) => {
        const key = chosen.name.trim().toLowerCase();
        if (existingMap.has(key)) {
          const existing = existingMap.get(key);
          return {
            ...chosen,
            price:
              existing.price !== undefined && existing.price !== ""
                ? existing.price
                : chosen.price,
            group: chosen.group || existing.group || "",
          };
        }
        return chosen;
      });

      // Also preserve any custom manual add-ons not in library
      const allLibraryKeys = new Set(
        validAddonGroups.flatMap((g) =>
          (g?.items || []).map((i) => i?.name?.trim().toLowerCase()).filter(Boolean),
        ),
      );
      (prev.addons || []).forEach((existing) => {
        const key = existing?.name?.trim().toLowerCase();
        if (key && !allLibraryKeys.has(key)) {
          mergedAddons.push(existing);
        }
      });

      return {
        ...prev,
        addons: mergedAddons,
      };
    });

    setIsAddonPickerModalOpen(false);
  };

  const handleAddAddon = () => {
    setFormData((prev) => ({
      ...prev,
      addons: [
        ...(prev.addons || []),
        { name: "", price: "", group: "", image: "" },
      ],
    }));
  };

  const handleAddonChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.addons || [])];
      updated[index] = {
        ...updated[index],
        [field]:
          field === "price"
            ? value === ""
              ? ""
              : isNaN(Number(value))
              ? 0
              : Number(value)
            : value,
      };
      return { ...prev, addons: updated };
    });
  };

  const handleRemoveAddon = (index) => {
    setFormData((prev) => ({
      ...prev,
      addons: (prev.addons || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const categoryName = formData.category?.trim();
      const existingCategoryIndex = sortedCategories.findIndex(
        (c) => c.toLowerCase() === categoryName.toLowerCase(),
      );

      const categoryOrder =
        existingCategoryIndex !== -1 ? existingCategoryIndex + 1 : 999;

      const parsedBranchPrices = {};
      Object.entries(formData.branchPrices).forEach(([key, val]) => {
        const parsedVal = parseFloat(val);
        if (!isNaN(parsedVal)) {
          parsedBranchPrices[key] = parsedVal;
        }
      });

      const cleanedAddons = (formData.addons || [])
        .filter((a) => a.name && a.name.trim())
        .map((a) => ({
          name: a.name.trim(),
          price: Number(a.price) || 0,
          group: a.group ? a.group.trim() : "",
          image: a.image || "",
        }));

      const cleanedFormData = {
        ...formData,
        price: Number(formData.price) || 0,
        category: categoryName,
        categoryOrder,
        variantLabel: formData.variantLabel?.trim(),
        branchIds: formData.branchIds.map(Number),
        branchPrices: parsedBranchPrices,
        addons: cleanedAddons,
        variations: (formData.variations || []).map((v) => ({
          name: v.name.trim(),
          price: Number(v.price) || 0,
          image: v.image || "",
        })),
        discountPct:
          formData.offerType !== "none" || formData.promoCode
            ? 0
            : Number(formData.discountPct) || 0,
        discountAmount:
          formData.offerType !== "none" || formData.promoCode
            ? 0
            : Number(formData.discountAmount) || 0,
        discountStartDate: formData.discountStartDate
          ? new Date(formData.discountStartDate).toISOString()
          : null,
        discountEndDate: formData.discountEndDate
          ? new Date(formData.discountEndDate).toISOString()
          : null,
      };

      let newFoodsList;
      if (editingFood) {
        const updated = await updateFood(
          editingFood.id || editingFood._id,
          cleanedFormData,
        );
        newFoodsList = foods.map((f) =>
          (f.id || f._id) === (editingFood.id || editingFood._id) ? (updated || cleanedFormData) : f,
        );
        setFoods(newFoodsList);
      } else {
        const created = await createFood(cleanedFormData);
        newFoodsList = [created || cleanedFormData, ...foods];
        setFoods(newFoodsList);
      }

      const updatedCats = processCategories(newFoodsList);
      setSortedCategories(updatedCats);

      setIsModalOpen(false);
      await syncFromServer();
    } catch (err) {
      alert("Error saving dish details: " + (err?.response?.data?.message || err?.message || ""));
    }
  };

  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [String(b._id || b.id || ""), b.name])),
    [branches],
  );

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchesSearch = f.name
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        f.category?.trim().toLowerCase() ===
          selectedCategory.trim().toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [foods, search, selectedCategory]);

  const isCouponActive = formData.promoCode !== "";
  const isOfferActive = formData.offerType !== "none";
  const isDiscountActive =
    formData.discountPct > 0 || formData.discountAmount > 0;

  return (
    <div className="w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
              Manage Menu Items
            </h1>
            {orderSyncStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse border border-amber-500/20">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving order...
              </span>
            )}
            {orderSyncStatus === "saved" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold border border-green-500/20">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Order saved
              </span>
            )}
            {orderSyncStatus === "error" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/20">
                Failed to save order
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Total {foods.length} dishes registered
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              fetchCentralCategories();
              setIsCentralCategoriesModalOpen(true);
            }}
            title="Manage Centralized Category Library & Display Order"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Tag className="w-4 h-4 text-primary-500" />
            <span className="hidden sm:inline">Central</span> Categories ({sortedCategories.length})
          </button>
          <button
            onClick={() => {
              fetchCentralAddons();
              setIsCentralAddonsModalOpen(true);
            }}
            title="Manage Centralized Add-ons Library & Groups"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-primary-500" />
            <span className="hidden sm:inline">Central</span> Add-ons ({validAddonGroups.length})
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh the list now"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-200 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
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
                💡 Categories ({sortedCategories.length}):
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreateCategory}
                  className="text-primary-500 hover:text-primary-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> + New
                </button>
                <button
                  onClick={() => setIsSortOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
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
                    <span className="truncate">{cat}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-500 shrink-0">
                      {categoryDishesCount[cat.toLowerCase()] || 0}
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1 text-neutral-400 hover:text-blue-500 rounded cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
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
            <div
              key={n}
              className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-2xl"
            />
          ))}
        </div>
      ) : (
        <>
          {filteredFoods.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-950/20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
              <p className="text-sm text-neutral-400 italic">
                No food items match your filter criteria.
              </p>
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
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-neutral-50 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {food.category}
                        </span>
                        {/* 🎯 International Restaurant Standard Status Badges */}
                        <span
                          className={`text-[10px] px-2 py-0.5 font-extrabold rounded-md border ${
                            food.isAvailable !== false
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60"
                          }`}
                        >
                          {food.isAvailable !== false ? "🟢 In Stock" : "🔴 Sold Out"}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 font-extrabold rounded-md border ${
                            food.isActive !== false
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60"
                          }`}
                        >
                          {food.isActive !== false ? "👁️ Active" : "🚫 Inactive"}
                        </span>
                        {food.promoCode && (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200">
                            🏷️ {food.promoCode}
                          </span>
                        )}
                        {food.offerType && food.offerType !== "none" && (
                          <span className="text-[10px] px-2 py-0.5 font-extrabold rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            {food.offerType === "bogo_1g1"
                              ? "BUY 1 GET 1"
                              : food.offerType === "bogo_1g2"
                                ? "BUY 1 GET 2"
                                : "COMBO DEAL"}
                          </span>
                        )}
                        {food.variations && food.variations.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                            {food.variations.length} {food.variantLabel || "Variants"}
                          </span>
                        )}
                        {food.addons && food.addons.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                            +{food.addons.length} Add-ons
                          </span>
                        )}
                        {food.popular && (
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        )}
                        {food.isAdminFeatured && (
                          <Star className="w-3.5 h-3.5 text-primary-500 fill-primary-500" />
                        )}
                      </div>
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base truncate">
                        {food.name}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5 max-w-xl 2xl:max-w-2xl hidden md:block">
                        {food.description || "No description provided."}
                      </p>

                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        {(food.branchIds || []).length === 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 font-bold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            All branches
                          </span>
                        ) : (
                          <>
                            {food.branchIds.slice(0, 3).map((bid) => (
                              <span
                                key={bid}
                                className="text-[10px] px-1.5 py-0.5 font-semibold rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500"
                              >
                                {branchNameById.get(String(bid)) ||
                                  `Branch #${bid}`}
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
                      <p className="text-sm sm:text-base font-black text-primary-500">
                        ৳{food.price}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 mt-0.5 rounded">
                        ★ {food.rating || 4.5}
                        {food.reviewCount > 0 ? (
                          <span className="text-neutral-400 font-normal">({food.reviewCount})</span>
                        ) : (
                          <span className="text-[9px] text-neutral-400 font-normal">(Base)</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      {/* 🎯 Stock Quick 1-Tap Toggle */}
                      <button
                        onClick={() => handleToggleStock(food)}
                        title={food.isAvailable !== false ? "Click to mark as Sold Out Today" : "Click to mark as In Stock"}
                        className={`px-2 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border ${
                          food.isAvailable !== false
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100"
                        }`}
                      >
                        {food.isAvailable !== false ? "In Stock" : "Sold Out"}
                      </button>

                      {/* 🎯 Active Quick 1-Tap Toggle */}
                      <button
                        onClick={() => handleToggleActive(food)}
                        title={food.isActive !== false ? "Click to set as Inactive (Hide from Menu)" : "Click to set as Active (Show on Menu)"}
                        className={`px-2 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border ${
                          food.isActive !== false
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                        }`}
                      >
                        {food.isActive !== false ? "Active" : "Inactive"}
                      </button>

                      <button
                        onClick={() => openEditModal(food)}
                        className="p-2 sm:p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(food.id || food._id)}
                        className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              className="relative w-full max-w-xl 2xl:max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                <h2 className="text-lg font-black text-neutral-900 dark:text-white">
                  {editingFood ? "Edit Menu Dish" : "Create New Dish"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto pr-1 py-4 space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                    Main Dish Image *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative group w-full h-36 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="px-3 py-1.5 bg-white text-neutral-900 rounded-xl font-bold text-xs shadow cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData({ ...formData, image: "" });
                          }}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-xl font-bold text-xs shadow cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="w-full h-36 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950/40 transition-colors"
                    >
                      <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                        Click to upload dish image
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Supports JPG, PNG, WEBP
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenCreateCategory}
                        className="text-[11px] font-bold text-primary-500 hover:text-primary-600 hover:underline cursor-pointer flex items-center gap-1"
                        title="Create new category in central library"
                      >
                        <Plus className="w-3 h-3" /> + New Category
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none cursor-pointer flex-1"
                        required
                      >
                        <option value="" disabled>Select Category...</option>
                        {sortedCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleOpenCreateCategory}
                        title="Quick Create New Category"
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
                      >
                        <FolderPlus className="w-4 h-4 text-primary-500" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                      Base Price (৳) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 290"
                      value={formData.price !== undefined && formData.price !== null ? formData.price : ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price:
                            e.target.value === ""
                              ? ""
                              : isNaN(Number(e.target.value))
                              ? 0
                              : Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold text-primary-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-neutral-950/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                      Promotion Rules: Only ONE promotion type can be active at
                      a time.
                    </span>
                  </div>

                  {/* Promo Coupon Section */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${isOfferActive || isDiscountActive ? "opacity-50 grayscale border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 pointer-events-none" : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"}`}
                  >
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                      <Tag className="w-3.5 h-3.5" /> 1. Assign Promo Coupon
                    </label>
                    <select
                      value={formData.promoCode}
                      onChange={(e) =>
                        setFormData({ ...formData, promoCode: e.target.value })
                      }
                      disabled={isOfferActive || isDiscountActive}
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-bold focus:outline-none cursor-pointer uppercase disabled:cursor-not-allowed"
                    >
                      <option value="">No Coupon Assigned</option>
                      {coupons.map((cp) => (
                        <option key={cp.id || cp._id} value={cp.code}>
                          {cp.code} (
                          {cp.discountPct
                            ? `${cp.discountPct}%`
                            : `৳${cp.discountAmount}`}{" "}
                          OFF)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Offer Type Section */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${isCouponActive || isDiscountActive ? "opacity-50 grayscale border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 pointer-events-none" : "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60"}`}
                  >
                    <label className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                      <Gift className="w-3.5 h-3.5" /> 2. Special Promotion
                      Offer
                    </label>
                    <select
                      value={formData.offerType}
                      onChange={(e) =>
                        setFormData({ ...formData, offerType: e.target.value })
                      }
                      disabled={isCouponActive || isDiscountActive}
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                    >
                      <option value="none">No Offer (Standard)</option>
                      <option value="bogo_1g1">
                        Buy 1 Get 1 Free (BUY 1 GET 1)
                      </option>
                      <option value="bogo_1g2">
                        Buy 1 Get 2 Free (BUY 1 GET 2)
                      </option>
                      <option value="combo">Special Combo Deal</option>
                    </select>
                  </div>

                  {/* Manual Discount Section */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${isCouponActive || isOfferActive ? "opacity-50 grayscale border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 pointer-events-none" : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60"}`}
                  >
                    <label className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                      <Star className="w-3.5 h-3.5" /> 3. Direct Discount Value
                    </label>
                    <div className="flex gap-2">
                      <select
                        disabled={isCouponActive || isOfferActive}
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountType: e.target.value,
                            discountAmount: 0,
                            discountPct: 0,
                          })
                        }
                        className="px-2 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                      >
                        <option value="percent">%</option>
                        <option value="flat">৳</option>
                      </select>
                      {formData.discountType === "flat" ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          disabled={isCouponActive || isOfferActive}
                          value={formData.discountAmount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountAmount: parseFloat(e.target.value) || 0,
                              discountPct: 0,
                            })
                          }
                          placeholder="৳ off (Enter 0 to clear)"
                          className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isCouponActive || isOfferActive}
                          value={formData.discountPct || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountPct: parseInt(e.target.value) || 0,
                              discountAmount: 0,
                            })
                          }
                          placeholder="% off (Enter 0 to clear)"
                          className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Shared Universal Timer Section */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${!isCouponActive && !isOfferActive && !isDiscountActive ? "opacity-50 grayscale border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900" : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60"}`}
                  >
                    <label className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                      <Calendar className="w-3.5 h-3.5" /> Promotion / Offer /
                      Discount Duration Timer
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-500 block mb-1">
                          Start Date & Time
                        </span>
                        <input
                          type="datetime-local"
                          value={formData.discountStartDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountStartDate: e.target.value,
                            })
                          }
                          disabled={
                            !isCouponActive &&
                            !isOfferActive &&
                            !isDiscountActive
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-neutral-500 block mb-1">
                          End Date & Time
                        </span>
                        <input
                          type="datetime-local"
                          value={formData.discountEndDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountEndDate: e.target.value,
                            })
                          }
                          disabled={
                            !isCouponActive &&
                            !isOfferActive &&
                            !isDiscountActive
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                      Rating *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      required
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rating: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Branch Availability Section */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800/60 space-y-3">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Available Branches
                    <span className="normal-case text-amber-600 dark:text-amber-400 ml-2 font-semibold">
                      (If no branch is selected, all branches will be displayed by default)
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {branches.map((b) => {
                      const bId = String(b._id || b.id);
                      const isSelected = formData.branchIds.includes(bId);

                      const adjustValue = formData.branchPrices[bId] ?? "";
                      const finalPrice =
                        (Number(formData.price) || 0) +
                        (Number(adjustValue) || 0);

                      return (
                        <div
                          key={bId}
                          className="flex flex-col gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        >
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleBranchToggle(bId)}
                              className="rounded text-primary-500 cursor-pointer"
                            />
                            <span className="truncate">{b.name}</span>
                          </label>

                          {isSelected && (
                            <div className="flex flex-col gap-1 mt-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-neutral-400 shrink-0">
                                  Adj ৳:
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="e.g. 20 or -10"
                                  value={adjustValue}
                                  onChange={(e) =>
                                    handleBranchPriceChange(bId, e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-[11px] focus:outline-none"
                                />
                              </div>

                              {adjustValue !== "" &&
                                Number(adjustValue) !== 0 && (
                                  <div className="text-[10px] font-extrabold text-primary-500 text-right pr-1">
                                    Final: ৳{Math.max(0, finalPrice).toFixed(2)}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Variants Section */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800/60 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                        Dish Variations & Pricing Options
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        Define options based on Size, Weight, Portion, or custom criteria.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs flex items-center gap-1"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {/* 🎯 Variant Basis / Type Selector */}
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                        Variant Basis / Label:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {standardVariantLabels.map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => {
                              setIsCustomVariantLabel(false);
                              setFormData((prev) => ({ ...prev, variantLabel: lbl }));
                            }}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              !isCustomVariantLabel && (formData.variantLabel || "Size") === lbl
                                ? "bg-primary-500 text-white border-primary-500 shadow-xs"
                                : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomVariantLabel(true);
                            if (standardVariantLabels.includes(formData.variantLabel)) {
                              setFormData((prev) => ({ ...prev, variantLabel: "" }));
                            }
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            isCustomVariantLabel
                              ? "bg-primary-500 text-white border-primary-500 shadow-xs"
                              : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                          }`}
                        >
                          + Custom
                        </button>
                      </div>
                    </div>

                    {isCustomVariantLabel && (
                      <div className="pt-1">
                        <input
                          type="text"
                          placeholder="Enter custom label (e.g. Flavor, Crust, Package Size)"
                          value={formData.variantLabel}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              variantLabel: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
                          required={formData.variations.length > 0}
                        />
                      </div>
                    )}
                  </div>

                  {/* Variants List */}
                  {formData.variations.length === 0 ? (
                    <div className="p-3 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        No {formData.variantLabel || "Size"} variants added. Dish will sell at standard base price (৳{formData.price || 0}).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-1">
                      {formData.variations.map((v, index) => {
                        const getPlaceholder = (label) => {
                          const clean = String(label || "").trim().toLowerCase();
                          if (clean === "weight") return "e.g. 250g / 500g / 1kg";
                          if (clean === "portion") return "e.g. 1:1 / 1:2 / Full Portion";
                          if (clean === "piece") return "e.g. 4 Pcs / 6 Pcs / 12 Pcs";
                          if (clean === "flavor") return "e.g. Vanilla / Chocolate / Strawberry";
                          if (clean === "crust") return "e.g. Thin Crust / Cheese Burst";
                          return "e.g. Regular / Medium / Large";
                        };

                        return (
                          <div
                            key={index}
                            className="flex flex-col gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-sm"
                          >
                            <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                              {/* Variant Image Preview / Upload Button */}
                              <div className="shrink-0">
                                {v.image ? (
                                  <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-primary-500/40 bg-neutral-100 dark:bg-neutral-800 shadow-xs">
                                    <img
                                      src={v.image}
                                      alt={v.name || "Variant"}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                      <label
                                        className="p-1 text-white hover:text-primary-400 cursor-pointer"
                                        title="Change image"
                                      >
                                        <Upload className="w-3 h-3" />
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                handleVariationChange(index, "image", reader.result);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => handleVariationChange(index, "image", "")}
                                        className="p-1 text-white hover:text-red-400 cursor-pointer"
                                        title="Remove image"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <label
                                    className="h-10 px-2.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 hover:text-primary-500 hover:border-primary-500/50 flex items-center gap-1.5 text-[11px] font-medium cursor-pointer transition-colors"
                                    title="Upload variant-specific image (optional)"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">+ Image</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            handleVariationChange(index, "image", reader.result);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>

                              <input
                                type="text"
                                placeholder={getPlaceholder(formData.variantLabel)}
                                value={v.name}
                                onChange={(e) =>
                                  handleVariationChange(
                                    index,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                required
                              />
                              <div className="relative w-24 sm:w-28">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                                  ৳
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Price"
                                  value={v.price}
                                  onChange={(e) =>
                                    handleVariationChange(
                                      index,
                                      "price",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full pl-6 pr-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold"
                                  required
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariation(index)}
                                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete variant"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 🎯 Add-ons & Extras Section */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800/60 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                        Add-ons & Extras (Customizations)
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        Attach extra cheese, premium toppings, or sides to this dish.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openAddonPicker}
                        className="text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
                        title="Pick from centralized library in 1 click"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> ⚡ Pick Central Add-ons
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAddon}
                        className="text-xs px-3 py-1.5 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl cursor-pointer transition-all active:scale-95 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Custom
                      </button>
                    </div>
                  </div>

                  {formData.addons && formData.addons.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {formData.addons.map((a, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-xs items-start sm:items-center"
                        >
                          {a.group && (
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold text-[10px] uppercase tracking-wider shrink-0">
                              {a.group}
                            </span>
                          )}
                          <input
                            type="text"
                            placeholder="Add-on name (e.g. Mozzarella Cheese)"
                            value={a.name}
                            onChange={(e) =>
                              handleAddonChange(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            className="flex-1 w-full sm:w-auto px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none font-medium"
                            required
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-32 shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">
                                ৳
                              </span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                placeholder="e.g. 50"
                                value={
                                  a.price !== undefined && a.price !== null
                                    ? a.price
                                    : ""
                                }
                                onChange={(e) =>
                                  handleAddonChange(
                                    index,
                                    "price",
                                    e.target.value,
                                  )
                                }
                                className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold text-primary-500"
                                required
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAddon(index)}
                              className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Remove Add-on"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-5 px-3 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/40 dark:bg-neutral-900/40">
                      No add-ons attached yet. Click <span className="font-bold text-primary-500 cursor-pointer" onClick={openAddonPicker}>"⚡ Pick Central Add-ons"</span> to attach cheese & premium toppings in 1 click!
                    </div>
                  )}
                </div>

                {/* Description & Toggles */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none resize-none"
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) =>
                        setFormData({ ...formData, isAvailable: e.target.checked })
                      }
                      className="rounded text-emerald-500 cursor-pointer"
                    />{" "}
                    🟢 In Stock (Available Today)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded text-blue-500 cursor-pointer"
                    />{" "}
                    👁️ Active (Published on Menu)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.popular}
                      onChange={(e) =>
                        setFormData({ ...formData, popular: e.target.checked })
                      }
                      className="rounded text-primary-500 cursor-pointer"
                    />{" "}
                    Mark as Popular
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAdminFeatured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isAdminFeatured: e.target.checked,
                        })
                      }
                      className="rounded text-primary-500 cursor-pointer"
                    />{" "}
                    Featured Dish
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-sm font-semibold cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold cursor-pointer hover:bg-primary-600 shadow-md shadow-primary-500/20"
                  >
                    {editingFood ? "Save Changes" : "Create Dish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎯 1-Click Central Addon Picker Modal */}
      <AnimatePresence>
        {isAddonPickerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                <div>
                  <h2 className="text-lg font-black text-neutral-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                    Pick Add-ons from Library
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Select groups or individual add-ons to attach to this dish in 1 click.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddonPickerModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search add-on item name..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Body: Grouped Addons */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {validAddonGroups.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Layers className="w-10 h-10 text-neutral-400 mx-auto opacity-50" />
                    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                      No add-on groups found in library.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddonPickerModalOpen(false);
                          handleOpenCreateGroup();
                        }}
                        className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs cursor-pointer"
                      >
                        + Create First Group
                      </button>
                      <button
                        type="button"
                        onClick={handleSeedDefaults}
                        className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs cursor-pointer"
                      >
                        Load Burger Defaults
                      </button>
                    </div>
                  </div>
                ) : (
                  validAddonGroups.map((group) => {
                    const filteredItems = (group?.items || []).filter((item) =>
                      !pickerSearch ||
                      item?.name?.toLowerCase().includes(pickerSearch.toLowerCase()),
                    );

                    if (filteredItems.length === 0) return null;

                    const allGroupKeys = (group?.items || [])
                      .map((i) => i?.name?.trim().toLowerCase())
                      .filter(Boolean);
                    const selectedCountInGroup = allGroupKeys.filter((k) =>
                      selectedPickerItemNames.has(k),
                    ).length;
                    const isAllGroupSelected =
                      selectedCountInGroup === allGroupKeys.length &&
                      allGroupKeys.length > 0;

                    return (
                      <div
                        key={group?._id || group?.id || group?.title}
                        className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs uppercase tracking-wider text-neutral-800 dark:text-white">
                              {group?.title || "Add-on Group"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-bold">
                              {selectedCountInGroup}/{group?.items?.length || 0}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              togglePickerGroupAll(group, isAllGroupSelected)
                            }
                            className="text-[11px] font-bold text-primary-500 hover:text-primary-600 hover:underline cursor-pointer"
                          >
                            {isAllGroupSelected ? "Deselect Group" : "Select Group (All)"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filteredItems.map((item, idx) => {
                            const isChecked = selectedPickerItemNames.has(
                              item?.name?.trim().toLowerCase(),
                            );
                            return (
                              <button
                                key={item?._id || item?.id || item?.name || idx}
                                type="button"
                                onClick={() => togglePickerItem(item?.name)}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer text-left ${
                                  isChecked
                                    ? "bg-primary-50 dark:bg-primary-955/30 border-primary-500 text-neutral-900 dark:text-white shadow-xs"
                                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-primary-500 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
                                  )}
                                  <span className="truncate">{item?.name}</span>
                                </div>
                                <span className="font-bold text-primary-500 shrink-0 ml-2">
                                  ৳{item?.price}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                <span className="text-xs font-bold text-neutral-500">
                  {selectedPickerItemNames.size} add-ons selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddonPickerModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPickerAddons}
                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Apply to Dish ({selectedPickerItemNames.size})
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎯 Central Addon Groups Library Modal */}
      <AnimatePresence>
        {isCentralAddonsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                <div>
                  <h2 className="text-lg font-black text-neutral-800 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary-500" />
                    Central Add-on Groups Library
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Create groups (e.g. Extra Cheese, Premium Add-ons) with multiple items and attach them to any dish.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenCreateGroup}
                    className="px-3.5 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Create New Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCentralAddonsModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body: Groups Cards */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {validAddonGroups.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Layers className="w-12 h-12 text-neutral-400 mx-auto opacity-50" />
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                      No Add-on Groups Created Yet
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      Click "+ Create New Group" to create your first add-on group and add as many item names and prices as you want.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleOpenCreateGroup}
                        className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold cursor-pointer"
                      >
                        + Create New Group
                      </button>
                      <button
                        type="button"
                        onClick={handleSeedDefaults}
                        className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                      >
                        Load Burger Menu Sample
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                        Saved Groups ({validAddonGroups.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleSeedDefaults}
                        className="text-[11px] font-bold text-neutral-500 hover:text-primary-500 hover:underline cursor-pointer"
                      >
                        Restore Barcode Burger Defaults
                      </button>
                    </div>

                    {validAddonGroups.map((group) => (
                      <div
                        key={group?._id || group?.id || group?.title}
                        className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                              {group?.title || "Add-on Group"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[11px] font-bold">
                              {group?.items?.length || 0} items
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditGroup(group)}
                              className="px-2.5 py-1 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit Group
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(group?._id || group?.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded-lg transition-colors cursor-pointer"
                              title="Delete group"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Items in this group */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {(group?.items || []).map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-950/40 flex items-center justify-between gap-2"
                            >
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                {item?.name}
                              </span>
                              <span className="text-xs font-bold text-primary-500 shrink-0">
                                ৳{item?.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                <button
                  type="button"
                  onClick={() => setIsCentralAddonsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎯 Create / Edit Add-on Group Modal */}
      <AnimatePresence>
        {isGroupEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                <div>
                  <h2 className="text-lg font-black text-neutral-800 dark:text-white">
                    {editingGroup && editingGroup.title
                      ? `Edit Group: ${editingGroup.title}`
                      : "Create New Add-on Group"}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Define the group name and add all item names and prices under it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGroupEditorOpen(false)}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveGroup} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                  {/* Group Name */}
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Extra Cheese, Premium Add-ons, Sauces"
                      value={groupFormData?.title || ""}
                      onChange={(e) =>
                        setGroupFormData({ ...groupFormData, title: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-none font-bold"
                      required
                    />
                  </div>

                  {/* Items list */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                        Items in this Group ({groupFormData.items.length})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddGroupItemRow}
                        className="text-xs px-2.5 py-1 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Add Item
                      </button>
                    </div>

                    <div className="space-y-2">
                      {groupFormData.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 items-center p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                        >
                          <input
                            type="text"
                            placeholder={`Item #${idx + 1} Name (e.g. Mozzarella)`}
                            value={item.name}
                            onChange={(e) =>
                              handleUpdateGroupItemRow(idx, "name", e.target.value)
                            }
                            className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs focus:outline-none font-medium"
                            required
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">
                              ৳
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Price"
                              value={
                                item.price !== undefined && item.price !== null
                                  ? item.price
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateGroupItemRow(idx, "price", e.target.value)
                              }
                              className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold text-primary-500"
                              required
                            />
                          </div>
                          {groupFormData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGroupItemRow(idx)}
                              className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer with Save Button */}
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2 shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                  <button
                    type="button"
                    onClick={() => setIsGroupEditorOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingGroup}
                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {isSavingGroup ? "Saving Group..." : "💾 Save Group"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎯 Central Categories Library & Ordering Modal */}
      <AnimatePresence>
        {isCentralCategoriesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                <div>
                  <h2 className="text-lg font-black text-neutral-800 dark:text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary-500" />
                    Central Categories Library
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Create, rename, reorder, or delete food categories centrally across the menu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenCreateCategory}
                    className="px-3.5 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Create Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCentralCategoriesModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search filter for categories */}
              {sortedCategories.length > 5 && (
                <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Filter categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Body: Reorderable List */}
              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {sortedCategories.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Tag className="w-12 h-12 text-neutral-400 mx-auto opacity-50" />
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                      No Categories Found
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      Click "+ Create Category" to add your first menu category (e.g. Burgers, Pizza, Beverages).
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateCategory}
                      className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold cursor-pointer"
                    >
                      + Create Category
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                        Drag handle (⋮⋮) to reorder display position
                      </span>
                      <span className="text-[11px] font-bold text-neutral-500">
                        {sortedCategories.length} Categories Total
                      </span>
                    </div>

                    <Reorder.Group
                      axis="y"
                      values={sortedCategories}
                      onReorder={handleCategoryReorder}
                      className="space-y-2"
                    >
                      {sortedCategories
                        .filter((cat) =>
                          !categorySearch ||
                          cat.toLowerCase().includes(categorySearch.toLowerCase()),
                        )
                        .map((cat) => {
                          const count = categoryDishesCount[cat.toLowerCase()] || 0;
                          return (
                            <Reorder.Item
                              key={cat}
                              value={cat}
                              className="flex items-center justify-between p-3.5 bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 cursor-grab active:cursor-grabbing transition-all select-none"
                            >
                              <div className="flex items-center gap-3 truncate">
                                <GripVertical className="w-4 h-4 text-neutral-400 shrink-0" />
                                <div className="truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-neutral-900 dark:text-white truncate">
                                      {cat}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[11px] font-bold shrink-0">
                                      {count} {count === 1 ? "dish" : "dishes"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="px-2.5 py-1 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded-lg transition-colors cursor-pointer"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </Reorder.Item>
                          );
                        })}
                    </Reorder.Group>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                <button
                  type="button"
                  onClick={handleOpenCreateCategory}
                  className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> + Add Another Category
                </button>
                <button
                  type="button"
                  onClick={() => setIsCentralCategoriesModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎯 Create / Edit Category Modal */}
      <AnimatePresence>
        {isCategoryEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                <div>
                  <h2 className="text-lg font-black text-neutral-800 dark:text-white">
                    {editingCategory && editingCategory.name
                      ? `Edit Category: ${editingCategory.name}`
                      : "Create New Category"}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Define the category name to organize dishes across the restaurant menu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryEditorOpen(false)}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveCategory} className="flex flex-col flex-1">
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Burgers, Sides, Beverages, Desserts"
                      value={categoryFormData?.name || ""}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          name: e.target.value,
                        })
                      }
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Footer with Save Button */}
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2 shrink-0 bg-neutral-50/50 dark:bg-neutral-950/40">
                  <button
                    type="button"
                    onClick={() => setIsCategoryEditorOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCategory}
                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {isSavingCategory ? "Saving Category..." : "💾 Save Category"}
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
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Store,
  Upload,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  RefreshCw,
} from "lucide-react";
import {
  getAllBrandsAdmin,
  createBrand,
  updateBrand,
  deleteBrand,
  updateBrandOrder,
} from "../../services/brandsService";
import { getAllBranches } from "../../services/branchesService";
import { socket } from "../../services/socket";

const BLANK = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  logoLight: "",
  cover: "",
  website: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  order: 0,
  isActive: true,
};

export const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'hidden'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [orderSyncStatus, setOrderSyncStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const reorderTimeoutRef = useRef(null);
  const latestOrderedIdsRef = useRef([]);
  const isSelfReorderingRef = useRef(false);
  const orderSyncStatusRef = useRef("idle");

  const setSyncStatus = (status) => {
    orderSyncStatusRef.current = status;
    setOrderSyncStatus(status);
  };

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [brandData, branchData] = await Promise.all([
        getAllBrandsAdmin().catch(() => []),
        getAllBranches().catch(() => []),
      ]);

      const sorted = Array.isArray(brandData)
        ? [...brandData].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        : [];
      setBrands(sorted);
      setBranches(Array.isArray(branchData) ? branchData : []);
    } catch (e) {
      console.error("Failed to load brands:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);

    // ⚡ Socket listener for real-time brand updates
    const handleBrandsSync = () => {
      if (isSelfReorderingRef.current || orderSyncStatusRef.current !== "idle") return;
      loadData(false);
    };

    socket.on("brands_updated", handleBrandsSync);

    const handleBeforeUnload = () => {
      if (latestOrderedIdsRef.current.length > 0) {
        updateBrandOrder(latestOrderedIdsRef.current).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off("brands_updated", handleBrandsSync);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [loadData]);

  // Count branches under each brand
  const branchCountByBrand = useMemo(() => {
    const map = {};
    (branches || []).forEach((b) => {
      if (b.brandId !== undefined && b.brandId !== null) {
        const idStr = String(b.brandId);
        map[idStr] = (map[idStr] || 0) + 1;
      }
    });
    return map;
  }, [branches]);

  // Filtered brands based on search & status
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.slug && b.slug.toLowerCase().includes(q)) ||
        (b.tagline && b.tagline.toLowerCase().includes(q)) ||
        (b.contactEmail && b.contactEmail.toLowerCase().includes(q)) ||
        (b.contactPhone && b.contactPhone.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && b.isActive !== false) ||
        (statusFilter === "hidden" && b.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData(false);
  };

  // 🎯 Instant Drag & Drop Handler (Optimistic UI + Debounced Server Sync)
  const handleBrandReorder = (reorderedBrands) => {
    isSelfReorderingRef.current = true;
    setBrands(reorderedBrands);

    const orderedIds = reorderedBrands.map((b) => {
      const rawId = b.id !== undefined && b.id !== null ? b.id : b._id;
      const numId = Number(rawId);
      return Number.isFinite(numId) ? numId : rawId;
    });
    latestOrderedIdsRef.current = orderedIds;

    if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(async () => {
      setSyncStatus("saving");
      try {
        await updateBrandOrder(orderedIds);
        setSyncStatus("saved");
        latestOrderedIdsRef.current = [];
        setTimeout(() => {
          setSyncStatus("idle");
          isSelfReorderingRef.current = false;
        }, 2500);
      } catch (err) {
        console.error("Failed to sync brand order on server:", err);
        setSyncStatus("error");
        isSelfReorderingRef.current = false;
      }
    }, 300);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK);
    setIsModalOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      name: b.name || "",
      slug: b.slug || "",
      tagline: b.tagline || "",
      description: b.description || "",
      logoLight: b.logoLight || "",
      cover: b.cover || "",
      website: b.website || "",
      contactPhone: b.contactPhone || "",
      contactEmail: b.contactEmail || "",
      contactAddress: b.contactAddress || "",
      order: b.order || 0,
      isActive: b.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const readImage = (file, key) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((p) => ({ ...p, [key]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateBrand(editing.id, form);
        setBrands((prev) =>
          prev.map((b) => (b.id === editing.id ? updated : b))
        );
      } else {
        const created = await createBrand(form);
        setBrands((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to save brand: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Delete the brand "${name || ""}"? Its branches will be unassigned (not deleted).`
      )
    )
      return;
    try {
      await deleteBrand(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete brand: " + err.message);
    }
  };

  const field =
    "w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-neutral-800 dark:text-neutral-100 placeholder-neutral-400";

  return (
    <div className="w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white font-display">
              Brands Management
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
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Total {brands.length} brand{brands.length !== 1 ? "s" : ""} registered. Drag cards up/down to reorder display sequence.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh brands list"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-200 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Brand
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-2xl flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by brand name, slug, tagline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative min-w-[170px] flex-1 sm:flex-initial">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none z-10" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-medium cursor-pointer appearance-none text-neutral-800 dark:text-neutral-100"
            >
              <option value="all">All Statuses ({brands.length})</option>
              <option value="active">Visible ({brands.filter((b) => b.isActive !== false).length})</option>
              <option value="hidden">Hidden ({brands.filter((b) => b.isActive === false).length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Brands List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60"
            />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-950/20">
          <Store className="w-12 h-12 mx-auto stroke-1 text-neutral-400 mb-3" />
          <h3 className="font-bold text-neutral-700 dark:text-neutral-300 text-base">No Brands Registered Yet</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Click the "Add Brand" button to create your first restaurant brand.
          </p>
        </div>
      ) : search.trim() || statusFilter !== "all" ? (
        /* Filtered Static List */
        <div className="flex flex-col gap-3">
          {filteredBrands.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-950/20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
              <p className="text-sm text-neutral-400 italic">
                No brands match your filter criteria.
              </p>
            </div>
          ) : (
            filteredBrands.map((b) => {
              const bCount = branchCountByBrand[String(b.id || b._id)] || 0;
              return (
                <div
                  key={b.id || b._id}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl shadow-xs hover:shadow-md transition-shadow gap-4 select-none"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
                    {/* Brand Image / Logo */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-center shrink-0 overflow-hidden">
                      {b.cover ? (
                        <img
                          src={b.cover}
                          alt={b.name}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      ) : b.logoLight ? (
                        <img
                          src={b.logoLight}
                          alt={b.name}
                          className="max-h-12 max-w-[80%] object-contain pointer-events-none"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                      )}
                    </div>

                    {/* Brand Main Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {b.isActive !== false ? (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}

                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {bCount} Branch{bCount !== 1 ? "es" : ""}
                        </span>

                        <span className="text-[10px] px-2 py-0.5 font-mono text-neutral-400 bg-neutral-50 dark:bg-neutral-950/50 rounded-md border border-neutral-100 dark:border-neutral-800">
                          /brands/{b.slug}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-neutral-900 dark:text-white text-base sm:text-lg truncate">
                        {b.name}
                      </h3>

                      {b.tagline && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5 max-w-xl 2xl:max-w-3xl">
                          {b.tagline}
                        </p>
                      )}

                      <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 flex-wrap text-xs text-neutral-400">
                        {b.contactPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-primary-500" />
                            <span>{b.contactPhone}</span>
                          </span>
                        )}
                        {b.contactEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-primary-500" />
                            <span>{b.contactEmail}</span>
                          </span>
                        )}
                        {b.website && (
                          <a
                            href={b.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary-500 hover:underline"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Website</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800/50">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(b)}
                        className="p-2 sm:p-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit Brand"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Reorderable List (Drag & Drop) */
        <Reorder.Group
          axis="y"
          values={brands}
          onReorder={handleBrandReorder}
          className="flex flex-col gap-3"
        >
          {brands.map((b) => {
            const bCount = branchCountByBrand[String(b.id || b._id)] || 0;
            return (
              <Reorder.Item
                key={b.id || b._id}
                value={b}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl shadow-xs hover:shadow-md transition-shadow gap-4 cursor-grab active:cursor-grabbing select-none touch-none"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto pointer-events-none">
                  {/* Grip & Brand Image */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-center shrink-0 overflow-hidden">
                    {b.cover ? (
                      <img
                        src={b.cover}
                        alt={b.name}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : b.logoLight ? (
                      <img
                        src={b.logoLight}
                        alt={b.name}
                        className="max-h-12 max-w-[80%] object-contain pointer-events-none"
                      />
                    ) : (
                      <Store className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                    )}

                    <div className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/50 backdrop-blur-xs text-white">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Brand Main Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {b.isActive !== false ? (
                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      )}

                      <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {bCount} Branch{bCount !== 1 ? "es" : ""}
                      </span>

                      <span className="text-[10px] px-2 py-0.5 font-mono text-neutral-400 bg-neutral-50 dark:bg-neutral-950/50 rounded-md border border-neutral-100 dark:border-neutral-800">
                        /brands/{b.slug}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-neutral-900 dark:text-white text-base sm:text-lg truncate">
                      {b.name}
                    </h3>

                    {b.tagline && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5 max-w-xl 2xl:max-w-3xl">
                        {b.tagline}
                      </p>
                    )}

                    <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 flex-wrap text-xs text-neutral-400">
                      {b.contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-primary-500" />
                          <span>{b.contactPhone}</span>
                        </span>
                      )}
                      {b.contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-primary-500" />
                          <span>{b.contactEmail}</span>
                        </span>
                      )}
                      {b.contactAddress && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                          <span className="truncate">{b.contactAddress}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800/50 pointer-events-auto">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-2 sm:p-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Edit Brand"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}

      {/* Brand Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl 2xl:max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                <div>
                  <h2 className="text-lg font-black text-neutral-900 dark:text-white font-display">
                    {editing ? "Edit Brand Details" : "Create New Brand"}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure brand profile, images, contact info, and public visibility.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                      Brand Name *
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={field}
                      placeholder="e.g. Barcode Cafe"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                        Slug (URL Key)
                      </label>
                      <input
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        className={field}
                        placeholder="e.g. barcode-cafe"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                        Tagline
                      </label>
                      <input
                        value={form.tagline}
                        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                        className={field}
                        placeholder="Coffee, food & good vibes"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className={`${field} resize-none`}
                      placeholder="Short bio or description of the brand..."
                    />
                  </div>

                  {/* Image Uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                        Brand Logo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={logoInputRef}
                        onChange={(e) => readImage(e.target.files[0], "logoLight")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-950/40 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {form.logoLight ? "Change Logo" : "Upload Logo"}
                      </button>
                      {form.logoLight && (
                        <div className="mt-2 relative p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center h-16">
                          <img
                            src={form.logoLight}
                            alt="logo preview"
                            className="max-h-full max-w-[80%] object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, logoLight: "" }))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                        Cover Banner Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={coverInputRef}
                        onChange={(e) => readImage(e.target.files[0], "cover")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-950/40 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {form.cover ? "Change Cover" : "Upload Cover"}
                      </button>
                      {form.cover && (
                        <div className="mt-2 relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 h-16">
                          <img
                            src={form.cover}
                            alt="cover preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, cover: "" }))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                      Website URL
                    </label>
                    <input
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className={field}
                      placeholder="https://www.barcodecafe.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        value={form.contactPhone}
                        onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                        className={field}
                        placeholder="+880 1888-000000"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                        Contact Email
                      </label>
                      <input
                        value={form.contactEmail}
                        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                        className={field}
                        placeholder="hello@barcodecafe.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                      Contact Address / Headquarters
                    </label>
                    <input
                      value={form.contactAddress}
                      onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
                      className={field}
                      placeholder="Chattogram, Bangladesh"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center pt-2">
                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={form.order}
                        onChange={(e) =>
                          setForm({ ...form, order: parseInt(e.target.value) || 0 })
                        }
                        className={field}
                      />
                    </div>
                    <div className="pt-4">
                      <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) =>
                            setForm({ ...form, isActive: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                        />
                        {form.isActive ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Eye className="w-4 h-4" /> Visible Publicly
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-neutral-400">
                            <EyeOff className="w-4 h-4" /> Hidden from Public
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-md shadow-primary-500/20 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {saving ? "Saving…" : editing ? "Save Changes" : "Create Brand"}
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

export default AdminBrands;
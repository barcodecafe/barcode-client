import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Search,
  Star,
  MapPin,
  Phone,
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  GripVertical,
  CheckCircle2,
  Loader2,
  Filter,
  Building2,
  Users,
  DollarSign,
  RefreshCw,
  Layers,
  Truck,
  User,
  Image as ImageIcon,
} from "lucide-react";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  updateBranchOrder,
} from "../../services/branchesService";
import { getRevenueByBranch } from "../../services/analyticsService";
import { getAllRegions } from "../../services/regionsService";
import { getAllBrandsAdmin } from "../../services/brandsService";
import { socket } from "../../services/socket";
import LeafletMap from "../../components/LeafletMap";
import { toast } from "react-hot-toast";

const parseLatLngFromUrl = (url) => {
  if (!url) return null;
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:q|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  ];
  for (const rx of patterns) {
    const m = url.match(rx);
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
};

export const AdminBranches = () => {
  const [branches, setBranches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [brands, setBrands] = useState([]);
  const [revenueMap, setRevenueMap] = useState({});
  const [search, setSearch] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderSyncStatus, setOrderSyncStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'

  const reorderTimeoutRef = useRef(null);
  const latestOrderedIdsRef = useRef([]);
  const isSelfReorderingRef = useRef(false);
  const orderSyncStatusRef = useRef("idle");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contact: "",
    hours: "11:00 AM - 11:00 PM",
    rating: 4.5,
    image: "",
    manager: "Branch Manager",
    capacity: 150,
    features: "Premium Seating, AC Venue, Wi-Fi Access, Parking Available",
    brandId: null,
    regionId: null,
    lat: null,
    lng: null,
    deliveryZones: [],
    defaultDeliveryCharge: 100,
  });
  const [formError, setFormError] = useState("");
  const [mapLinkInput, setMapLinkInput] = useState("");

  const setSyncStatus = (status) => {
    orderSyncStatusRef.current = status;
    setOrderSyncStatus(status);
  };

  const fetchBranchesData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const [branchData, revenueData, regionData, brandData] = await Promise.all([
        getAllBranches().catch(() => []),
        getRevenueByBranch().catch(() => []),
        getAllRegions().catch(() => []),
        getAllBrandsAdmin().catch(() => []),
      ]);

      const sortedBranches = Array.isArray(branchData)
        ? [...branchData].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        : [];
      setBranches(sortedBranches);
      setRegions(Array.isArray(regionData) ? regionData : []);
      setBrands(Array.isArray(brandData) ? brandData : []);

      if (Array.isArray(revenueData)) {
        const revMap = revenueData.reduce((map, r) => {
          map[r.branchId] = r;
          return map;
        }, {});
        setRevenueMap(revMap);
      }
    } catch (err) {
      console.error("Failed to load admin branches data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBranchesData(true);

    // ⚡ Real-Time WebSocket Listener for branches
    const handleBranchesSync = () => {
      if (isSelfReorderingRef.current || orderSyncStatusRef.current !== "idle") return;
      fetchBranchesData(false);
    };

    socket.on("branches_updated", handleBranchesSync);

    const handleBeforeUnload = () => {
      if (latestOrderedIdsRef.current.length > 0) {
        updateBranchOrder(latestOrderedIdsRef.current).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off("branches_updated", handleBranchesSync);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [fetchBranchesData]);

  // Brand and Region Name Lookup Maps
  const brandNameMap = useMemo(() => {
    const map = new Map();
    brands.forEach((b) => map.set(String(b.id || b._id), b.name));
    return map;
  }, [brands]);

  const regionNameMap = useMemo(() => {
    const map = new Map();
    regions.forEach((r) => map.set(String(r.id || r._id), r.name));
    return map;
  }, [regions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((b) => {
      const matchesSearch =
        !q ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.location && b.location.toLowerCase().includes(q)) ||
        (b.contact && b.contact.toLowerCase().includes(q)) ||
        (b.manager && b.manager.toLowerCase().includes(q));

      const matchesBrand =
        selectedBrandFilter === "all" ||
        String(b.brandId) === String(selectedBrandFilter);

      const matchesRegion =
        selectedRegionFilter === "all" ||
        String(b.regionId) === String(selectedRegionFilter);

      return matchesSearch && matchesBrand && matchesRegion;
    });
  }, [branches, search, selectedBrandFilter, selectedRegionFilter]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchBranchesData(false);
  };

  // 🎯 Instant Drag & Drop Handler (Optimistic UI + Debounced Server Sync)
  const handleBranchReorder = (newBranches) => {
    isSelfReorderingRef.current = true;
    setBranches(newBranches);

    const orderedIds = newBranches.map((b) => {
      const rawId = b.id !== undefined && b.id !== null ? b.id : b._id;
      const numId = Number(rawId);
      return Number.isFinite(numId) ? numId : rawId;
    });
    latestOrderedIdsRef.current = orderedIds;

    if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(async () => {
      setSyncStatus("saving");
      try {
        await updateBranchOrder(orderedIds);
        setSyncStatus("saved");
        latestOrderedIdsRef.current = [];
        setTimeout(() => {
          setSyncStatus("idle");
          isSelfReorderingRef.current = false;
        }, 2500);
      } catch (err) {
        console.error("Background sync error for branch order:", err);
        setSyncStatus("error");
        isSelfReorderingRef.current = false;
      }
    }, 300);
  };

  const openAddModal = () => {
    setEditingBranch(null);
    const defaultRegion = regions.length > 0 ? regions[0] : null;
    const defaultRegId = defaultRegion ? Number(defaultRegion.id) : null;
    const defaultZones =
      defaultRegion && Array.isArray(defaultRegion.deliveryZones)
        ? defaultRegion.deliveryZones.map((z) => ({
            name: z.name,
            charge:
              typeof z.charge === "number"
                ? z.charge
                : defaultRegion.defaultDeliveryCharge || 100,
          }))
        : [];

    setFormData({
      name: "",
      location: "",
      contact: "",
      hours: "11:00 AM - 11:00 PM",
      rating: 4.5,
      image:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
      manager: "Branch Manager",
      capacity: 150,
      features: "Premium Seating, AC Venue, Wi-Fi Access, Parking Available",
      brandId: null,
      regionId: defaultRegId,
      lat: null,
      lng: null,
      deliveryZones: defaultZones,
      defaultDeliveryCharge:
        defaultRegion &&
        typeof defaultRegion.defaultDeliveryCharge === "number"
          ? defaultRegion.defaultDeliveryCharge
          : 100,
    });
    setMapLinkInput("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    const regId = typeof branch.regionId === "number" ? branch.regionId : null;
    const targetRegion = regions.find((r) => Number(r.id) === Number(regId));

    let zones =
      Array.isArray(branch.deliveryZones) && branch.deliveryZones.length > 0
        ? branch.deliveryZones.map((z) => ({ ...z }))
        : [];

    let defCharge =
      typeof branch.defaultDeliveryCharge === "number"
        ? branch.defaultDeliveryCharge
        : 100;

    // 🎯 If the branch has NO delivery zones saved yet, but has an assigned region, auto-populate all areas from that region!
    if (
      zones.length === 0 &&
      targetRegion &&
      Array.isArray(targetRegion.deliveryZones) &&
      targetRegion.deliveryZones.length > 0
    ) {
      zones = targetRegion.deliveryZones.map((z) => ({
        name: z.name,
        charge:
          typeof z.charge === "number"
            ? z.charge
            : targetRegion.defaultDeliveryCharge || 100,
      }));
      if (typeof targetRegion.defaultDeliveryCharge === "number") {
        defCharge = targetRegion.defaultDeliveryCharge;
      }
    }

    setFormData({
      name: branch.name,
      location: branch.location,
      contact: branch.contact,
      hours: branch.hours,
      rating: branch.rating,
      image: branch.image,
      manager: branch.manager || "Branch Manager",
      capacity: branch.capacity || 150,
      features: Array.isArray(branch.features)
        ? branch.features.join(", ")
        : branch.features || "",
      brandId: typeof branch.brandId === "number" ? branch.brandId : null,
      regionId: regId,
      lat: typeof branch.lat === "number" ? branch.lat : null,
      lng: typeof branch.lng === "number" ? branch.lng : null,
      deliveryZones: zones,
      defaultDeliveryCharge: defCharge,
    });
    setMapLinkInput("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleAddZone = () => {
    setFormData((prev) => ({
      ...prev,
      deliveryZones: [
        ...prev.deliveryZones,
        { name: "", charge: prev.defaultDeliveryCharge },
      ],
    }));
  };

  const handleZoneChange = (index, fieldName, val) => {
    setFormData((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.map((z, i) =>
        i === index
          ? {
              ...z,
              [fieldName]:
                fieldName === "charge" ? parseFloat(val) || 0 : val,
            }
          : z
      ),
    }));
  };

  const handleRemoveZone = (index) => {
    setFormData((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.filter((_, i) => i !== index),
    }));
  };

  const populateZonesFromRegion = (regId, showNotification = true) => {
    const targetReg = regions.find((r) => Number(r.id) === Number(regId));
    if (!targetReg || !Array.isArray(targetReg.deliveryZones) || targetReg.deliveryZones.length === 0) {
      if (showNotification) toast.error("Selected region has no delivery areas configured yet.");
      return;
    }
    const populated = targetReg.deliveryZones.map((z) => ({
      name: z.name,
      charge: typeof z.charge === "number" ? z.charge : (targetReg.defaultDeliveryCharge || 100),
    }));
    setFormData((prev) => ({
      ...prev,
      regionId: Number(regId),
      deliveryZones: populated,
      defaultDeliveryCharge: typeof targetReg.defaultDeliveryCharge === "number" ? targetReg.defaultDeliveryCharge : prev.defaultDeliveryCharge,
    }));
    if (showNotification) toast.success(`Loaded ${populated.length} delivery areas from ${targetReg.name}!`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "rating"
          ? parseFloat(value) || 0
          : name === "capacity"
            ? parseInt(value, 10) || 0
            : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError("File size should be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickLocation = (lat, lng) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
  };

  const applyMapLink = () => {
    const parsed = parseLatLngFromUrl(mapLinkInput.trim());
    if (parsed) {
      setFormData((prev) => ({ ...prev, lat: parsed.lat, lng: parsed.lng }));
      setMapLinkInput("");
      setFormError("");
    } else {
      setFormError(
        "Couldn't read coordinates from that link. Paste a Google Maps link, or click the map."
      );
    }
  };

  const clearLocation = () => {
    setFormData((prev) => ({ ...prev, lat: null, lng: null }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.name.trim() ||
      !formData.location.trim() ||
      !formData.contact.trim()
    ) {
      setFormError("Please fill in Name, Location, and Contact details.");
      return;
    }

    try {
      const payload = {
        ...formData,
        features: formData.features
          ? formData.features
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean)
          : [],
        lat:
          typeof formData.lat === "number" && Number.isFinite(formData.lat)
            ? formData.lat
            : null,
        lng:
          typeof formData.lng === "number" && Number.isFinite(formData.lng)
            ? formData.lng
            : null,
        brandId: typeof formData.brandId === "number" ? formData.brandId : null,
        regionId:
          typeof formData.regionId === "number" ? formData.regionId : null,
      };

      if (editingBranch) {
        await updateBranch(editingBranch.id, payload);
      } else {
        await createBranch(payload);
      }
      setIsModalOpen(false);
      fetchBranchesData();
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    }
  };

  const handleDeleteClick = async (id, name) => {
    if (
      window.confirm(`Are you sure you want to delete the branch "${name}"?`)
    ) {
      try {
        await deleteBranch(id);
        fetchBranchesData();
      } catch (err) {
        alert(err.message || "Failed to delete branch.");
      }
    }
  };

  const field =
    "w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm";

  return (
    <div className="w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white font-display">
              Branches Management
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
            Total {branches.length} branch{branches.length !== 1 ? "es" : ""} registered across all regions. Drag cards up/down to reorder display sequence.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh branches list"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-200 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 max-w-3xl">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search branches by name, location, phone..."
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

          {/* Brand Filter */}
          <div className="relative min-w-[170px] flex-1 sm:flex-initial">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none z-10" />
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-medium cursor-pointer appearance-none text-neutral-800 dark:text-neutral-100"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id || b._id} value={String(b.id || b._id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div className="relative min-w-[170px] flex-1 sm:flex-initial">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none z-10" />
            <select
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-medium cursor-pointer appearance-none text-neutral-800 dark:text-neutral-100"
            >
              <option value="all">All Regions ({regions.length})</option>
              {regions.map((r) => (
                <option key={r.id || r._id} value={String(r.id || r._id)}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Branches List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60"
            />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-950/20">
          <Building2 className="w-12 h-12 mx-auto stroke-1 text-neutral-400 mb-3" />
          <h3 className="font-bold text-neutral-700 dark:text-neutral-300 text-base">No Branches Registered</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Click the "Add Branch" button above to add your first restaurant branch location.
          </p>
        </div>
      ) : search.trim() || selectedBrandFilter !== "all" || selectedRegionFilter !== "all" ? (
        /* Filtered Static List */
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-950/20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
              <p className="text-sm text-neutral-400 italic">
                No branches match your filter criteria.
              </p>
            </div>
          ) : (
            filtered.map((branch) => {
              const rev = revenueMap[branch.id];
              const brandName = brandNameMap.get(String(branch.brandId));
              const regionName = regionNameMap.get(String(branch.regionId));
              const branchRegion = regions.find((r) => Number(r.id) === Number(branch.regionId));
              const zoneCount = branchRegion?.deliveryZones?.length || (Array.isArray(branch.deliveryZones) ? branch.deliveryZones.length : 0);

              return (
                <div
                  key={String(branch.id || branch._id)}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl shadow-xs hover:shadow-md transition-shadow gap-4 select-none"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
                    {/* Thumbnail Image */}
                    <div className="relative w-20 h-20 sm:w-28 sm:h-20 lg:w-36 lg:h-24 rounded-2xl bg-neutral-100 dark:bg-neutral-950 overflow-hidden shrink-0 border border-neutral-200/60 dark:border-neutral-800/60">
                      {branch.image ? (
                        <img
                          src={branch.image}
                          alt={branch.name}
                          className="w-full h-full object-cover pointer-events-none"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-amber-400 text-[10px] font-bold bg-neutral-900/80 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        <Star className="w-3 h-3 fill-current" />
                        {branch.rating || 4.5}
                      </div>
                    </div>

                    {/* Branch Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {brandName && (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {brandName}
                          </span>
                        )}

                        {regionName && (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {regionName}
                          </span>
                        )}

                        {branch.capacity && (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {branch.capacity} Seats
                          </span>
                        )}

                        {zoneCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1">
                            <Truck className="w-3 h-3" /> {zoneCount} Delivery Areas
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-neutral-900 dark:text-white text-base sm:text-lg truncate">
                        {branch.name}
                      </h3>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 truncate max-w-xl 2xl:max-w-3xl">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-500" />
                        <span className="truncate">{branch.location}</span>
                      </p>

                      <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 flex-wrap text-xs text-neutral-400">
                        {branch.contact && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-primary-500" />
                            <span>{branch.contact}</span>
                          </span>
                        )}
                        {branch.hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary-500" />
                            <span>{branch.hours}</span>
                          </span>
                        )}
                        {branch.manager && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-neutral-400" />
                            <span>{branch.manager}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Revenue & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800/50">
                    <div className="text-left sm:text-right min-w-[90px]">
                      <span className="block text-[10px] uppercase font-bold text-neutral-400">Revenue</span>
                      <span className="text-sm sm:text-base font-black text-primary-500">
                        ৳{(rev?.revenue || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(branch)}
                        className="p-2 sm:p-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit Branch"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(branch.id, branch.name)}
                        className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Branch"
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
          values={branches}
          onReorder={handleBranchReorder}
          className="flex flex-col gap-3"
        >
          {branches.map((branch) => {
            const rev = revenueMap[branch.id];
            const brandName = brandNameMap.get(String(branch.brandId));
            const regionName = regionNameMap.get(String(branch.regionId));
            const branchRegion = regions.find((r) => Number(r.id) === Number(branch.regionId));
            const zoneCount = branchRegion?.deliveryZones?.length || (Array.isArray(branch.deliveryZones) ? branch.deliveryZones.length : 0);

            return (
              <Reorder.Item
                key={String(branch.id || branch._id)}
                value={branch}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl shadow-xs hover:shadow-md transition-shadow gap-4 cursor-grab active:cursor-grabbing select-none touch-none"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto pointer-events-none">
                  {/* Grip & Image */}
                  <div className="relative w-20 h-20 sm:w-28 sm:h-20 lg:w-36 lg:h-24 rounded-2xl bg-neutral-100 dark:bg-neutral-950 overflow-hidden shrink-0 border border-neutral-200/60 dark:border-neutral-800/60">
                    {branch.image ? (
                      <img
                        src={branch.image}
                        alt={branch.name}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/50 backdrop-blur-xs text-white">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-amber-400 text-[10px] font-bold bg-neutral-900/80 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                      <Star className="w-3 h-3 fill-current" />
                      {branch.rating || 4.5}
                    </div>
                  </div>

                  {/* Branch Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {brandName && (
                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {brandName}
                        </span>
                      )}

                      {regionName && (
                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {regionName}
                        </span>
                      )}

                      {branch.capacity && (
                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {branch.capacity} Seats
                        </span>
                      )}

                      {zoneCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> {zoneCount} Delivery Areas
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-neutral-900 dark:text-white text-base sm:text-lg truncate">
                      {branch.name}
                    </h3>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 truncate max-w-xl 2xl:max-w-3xl">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-500" />
                      <span className="truncate">{branch.location}</span>
                    </p>

                    <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 flex-wrap text-xs text-neutral-400">
                      {branch.contact && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-primary-500" />
                          <span>{branch.contact}</span>
                        </span>
                      )}
                      {branch.hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary-500" />
                          <span>{branch.hours}</span>
                        </span>
                      )}
                      {branch.manager && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-neutral-400" />
                          <span>{branch.manager}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Revenue & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800/50 pointer-events-auto">
                  <div className="text-left sm:text-right min-w-[90px]">
                    <span className="block text-[10px] uppercase font-bold text-neutral-400">Revenue</span>
                    <span className="text-sm sm:text-base font-black text-primary-500">
                      ৳{(rev?.revenue || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(branch)}
                      className="p-2 sm:p-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Edit Branch"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(branch.id, branch.name)}
                      className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete Branch"
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

      {/* Modal Section */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl 2xl:max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                <div>
                  <h3 className="text-lg font-black font-display text-neutral-900 dark:text-white">
                    {editingBranch ? "Edit Branch Details" : "Add New Branch"}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure branch address, map pin, contact details, region & delivery zones.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs shrink-0">
                  {formError}
                </div>
              )}

              <form
                onSubmit={handleFormSubmit}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Barcode Cafe - Lalkhan Bazar"
                      className={field}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Address / Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Mezzan Haile Ayun Lalkhan Bazar, Chattogram"
                      className={field}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Map Location (Click map to pin coordinate)
                    </label>
                    <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                      <LeafletMap
                        lat={formData.lat}
                        lng={formData.lng}
                        picker
                        onPick={handlePickLocation}
                        zoom={15}
                        className="h-48 w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={mapLinkInput}
                        onChange={(e) => setMapLinkInput(e.target.value)}
                        placeholder="…or paste Google Maps share link here"
                        className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-xs"
                      />
                      <button
                        type="button"
                        onClick={applyMapLink}
                        className="px-3 py-2 rounded-xl bg-neutral-800 dark:bg-neutral-700 text-white text-xs font-bold shrink-0 hover:bg-neutral-900 transition-colors cursor-pointer"
                      >
                        Extract Link
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                        {typeof formData.lat === "number" && typeof formData.lng === "number"
                          ? `📍 Pinned: ${formData.lat.toFixed(5)}, ${formData.lng.toFixed(5)}`
                          : "No location coordinates pinned"}
                      </span>
                      {typeof formData.lat === "number" && (
                        <button
                          type="button"
                          onClick={clearLocation}
                          className="text-red-500 font-semibold hover:underline cursor-pointer"
                        >
                          Clear pin
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Contact Phone *
                      </label>
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="e.g. +880 1888-000000"
                        className={field}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Opening Hours
                      </label>
                      <input
                        type="text"
                        name="hours"
                        value={formData.hours}
                        onChange={handleInputChange}
                        placeholder="e.g. 11:00 AM - 11:00 PM"
                        className={field}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Customer Rating (Live Verified)
                      </label>
                      <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
                        <Star className="w-4 h-4 text-primary-500 fill-primary-500 shrink-0" />
                        <span>{formData.rating && formData.rating > 0 ? `${formData.rating} / 5.0 (Live Customer Score)` : "New Branch (0 Reviews)"}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Upload Image
                      </label>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {formData.image && (
                        <div className="mt-2 relative w-20 h-14 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, image: "" }))
                            }
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-lg hover:bg-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Manager Name
                      </label>
                      <input
                        type="text"
                        name="manager"
                        value={formData.manager}
                        onChange={handleInputChange}
                        placeholder="e.g. Branch Manager"
                        className={field}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Seating Capacity
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        placeholder="e.g. 150"
                        className={field}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Assigned Brand
                      </label>
                      <select
                        value={formData.brandId ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            brandId: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                        className={field}
                      >
                        <option value="">— No brand —</option>
                        {brands.map((b) => (
                          <option key={b.id || b._id} value={b.id || b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Assigned Region
                      </label>
                      <select
                        value={formData.regionId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newRegId = val ? Number(val) : null;
                          const targetReg = regions.find((r) => Number(r.id) === newRegId);

                          setFormData((prev) => {
                            let nextZones = prev.deliveryZones;
                            let nextDefaultCharge = prev.defaultDeliveryCharge;

                            // If this branch has no delivery zones yet, auto-populate from the selected region's delivery areas!
                            if (targetReg && Array.isArray(targetReg.deliveryZones) && targetReg.deliveryZones.length > 0) {
                              if (prev.deliveryZones.length === 0) {
                                nextZones = targetReg.deliveryZones.map((z) => ({
                                  name: z.name,
                                  charge: typeof z.charge === "number" ? z.charge : (targetReg.defaultDeliveryCharge || 100),
                                }));
                                if (typeof targetReg.defaultDeliveryCharge === "number") {
                                  nextDefaultCharge = targetReg.defaultDeliveryCharge;
                                }
                              }
                            }

                            return {
                              ...prev,
                              regionId: newRegId,
                              deliveryZones: nextZones,
                              defaultDeliveryCharge: nextDefaultCharge,
                            };
                          });
                        }}
                        className={field}
                      >
                        <option value="">— No region —</option>
                        {regions.map((r) => (
                          <option key={r.id || r._id} value={r.id || r._id}>
                            {r.name} ({Array.isArray(r.deliveryZones) ? r.deliveryZones.length : 0} Areas)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Features (Comma-separated)
                    </label>
                    <input
                      type="text"
                      name="features"
                      value={formData.features}
                      onChange={handleInputChange}
                      placeholder="e.g. Premium Seating, AC Venue, Wi-Fi Access, Parking Available"
                      className={field}
                    />
                  </div>

                  {/* 🚚 Centralized Region Delivery Coverage Card */}
                  {(() => {
                    const activeRegion = regions.find((r) => Number(r.id) === Number(formData.regionId));
                    if (!activeRegion) {
                      return (
                        <div className="mt-4 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400">
                          Select an <span className="font-bold text-neutral-700 dark:text-neutral-300">Assigned Region</span> above to automatically link delivery coverage areas.
                        </div>
                      );
                    }

                    const zones = Array.isArray(activeRegion.deliveryZones) ? activeRegion.deliveryZones : [];

                    return (
                      <div className="mt-4 p-4 rounded-2xl bg-amber-50/40 dark:bg-neutral-950/40 border border-amber-200/60 dark:border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                                Delivery Coverage ({zones.length} Areas)
                              </h4>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                Auto-inherited from <span className="font-bold text-amber-700 dark:text-amber-400">{activeRegion.name} Region</span>
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800">
                            Default Fee: ৳{activeRegion.defaultDeliveryCharge ?? 100}
                          </span>
                        </div>

                        {zones.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Covered Delivery Areas:
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {zones.map((z, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-2xs"
                                >
                                  <span>{z.name}</span>
                                  <span className="font-bold text-amber-600 dark:text-amber-400">
                                    ৳{z.charge}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-400 italic py-1">
                            No delivery areas configured for {activeRegion.name} yet. You can add areas on the Regions management page.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {editingBranch ? "Save Changes" : "Create Branch"}
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

export default AdminBranches;
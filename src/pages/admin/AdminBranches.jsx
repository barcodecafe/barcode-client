import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../services/branchesService";
import { getRevenueByBranch } from "../../services/analyticsService";
import { getAllRegions } from "../../services/regionsService";
import { getAllBrandsAdmin } from "../../services/brandsService";
import LeafletMap from "../../components/LeafletMap";

// Pull lat/lng out of a pasted Google Maps link (supports @lat,lng / q=lat,lng
// / query=lat,lng / !3dLAT!4dLNG). Returns null if none found.
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

// ---------------------------------------------------------------------------
// AdminBranches.jsx — /admin/branches
//
// Full CRUD panel for managing branches. Includes adding new branches,
// editing details, and deleting branches. Data persists via branchesService.
// ---------------------------------------------------------------------------
export const AdminBranches = () => {
  const [branches, setBranches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [brands, setBrands] = useState([]);
  const [revenueMap, setRevenueMap] = useState({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contact: "",
    hours: "",
    rating: 4.5,
    image: "",
    manager: "",
    capacity: 150,
    features: "",
    brandId: null,
    regionId: null,
    lat: null,
    lng: null,
    deliveryZones: [],
    defaultDeliveryCharge: 100,
  });
  const [formError, setFormError] = useState("");
  const [mapLinkInput, setMapLinkInput] = useState("");

  const fetchBranchesData = () => {
    setIsLoading(true);
    getAllBrandsAdmin().then((b) => setBrands(Array.isArray(b) ? b : [])).catch(() => {});
    Promise.all([getAllBranches(), getRevenueByBranch(), getAllRegions()]).then(
      ([branchData, revenueData, regionData]) => {
        setBranches(branchData);
        setRegions(Array.isArray(regionData) ? regionData : []);
        setRevenueMap(
          revenueData.reduce((map, r) => {
            map[r.branchId] = r;
            return map;
          }, {}),
        );
        setIsLoading(false);
      },
    );
  };

  useEffect(() => {
    fetchBranchesData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q),
    );
  }, [branches, search]);

  const openAddModal = () => {
    setEditingBranch(null);
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
      regionId: null,
      lat: null,
      lng: null,
      deliveryZones: [],
      defaultDeliveryCharge: 100,
    });
    setMapLinkInput("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
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
      regionId: typeof branch.regionId === "number" ? branch.regionId : null,
      lat: typeof branch.lat === "number" ? branch.lat : null,
      lng: typeof branch.lng === "number" ? branch.lng : null,
      deliveryZones: Array.isArray(branch.deliveryZones) ? branch.deliveryZones.map((z) => ({ ...z })) : [],
      defaultDeliveryCharge: typeof branch.defaultDeliveryCharge === "number" ? branch.defaultDeliveryCharge : 100,
    });
    setMapLinkInput("");
    setFormError("");
    setIsModalOpen(true);
  };

  // ── Delivery zone editor (per-branch: area name + charge) ──
  const handleAddZone = () => {
    setFormData((prev) => ({
      ...prev,
      deliveryZones: [...prev.deliveryZones, { name: "", charge: prev.defaultDeliveryCharge }],
    }));
  };
  const handleZoneChange = (index, field, val) => {
    setFormData((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.map((z, i) =>
        i === index ? { ...z, [field]: field === "charge" ? parseFloat(val) || 0 : val } : z
      ),
    }));
  };
  const handleRemoveZone = (index) => {
    setFormData((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.filter((_, i) => i !== index),
    }));
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
      //  Max 2MB
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

  // Map location helpers
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
      setFormError("Couldn't read coordinates from that link. Paste a Google Maps link, or click the map.");
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
        lat: typeof formData.lat === "number" && Number.isFinite(formData.lat) ? formData.lat : null,
        lng: typeof formData.lng === "number" && Number.isFinite(formData.lng) ? formData.lng : null,
        brandId: typeof formData.brandId === "number" ? formData.brandId : null,
        regionId: typeof formData.regionId === "number" ? formData.regionId : null,
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

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Branches Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {branches.length} locations across Chattogram, Cox's Bazar, and
            Dhaka.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search branches..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all duration-200 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((branch) => {
            const rev = revenueMap[branch.id];
            return (
              <motion.div
                key={branch.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
                className="group relative bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-28">
                    <img
                      src={branch.image}
                      alt={branch.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />

                    {/* Actions Overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEditModal(branch)}
                        className="p-1.5 rounded-lg bg-white/95 text-neutral-700 hover:text-primary-500 hover:bg-white shadow-sm transition-all"
                        title="Edit Branch"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClick(branch.id, branch.name)
                        }
                        className="p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-600 shadow-sm transition-all"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
                      <h3 className="text-white font-display font-bold text-sm leading-tight truncate">
                        {branch.name}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold shrink-0 bg-neutral-900/50 px-1.5 py-0.5 rounded-md">
                        <Star className="w-3 h-3 fill-current" />
                        {branch.rating}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary-500" />
                      {branch.location}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-primary-500" />
                      {branch.contact}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-primary-500" />
                      {branch.hours}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  {rev && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        Revenue (Mock)
                      </span>
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                        ${rev.revenue.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 md:hidden">
                    <button
                      onClick={() => openEditModal(branch)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(branch.id, branch.name)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-xs text-red-500"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400 text-sm">
          No branches match your search.
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
            />

            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-10 p-6 overflow-hidden"
            >
              {/* Header - Fixed */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                <h3 className="text-lg font-bold font-display text-neutral-800 dark:text-white">
                  {editingBranch ? "Edit Branch Details" : "Add New Branch"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm shrink-0">
                  {formError}
                </div>
              )}

              {/* Form Container - flex flex-col overflow-hidden */}
              <form
                onSubmit={handleFormSubmit}
                className="flex-1 flex flex-col overflow-hidden"
              >
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 pb-2 scrollbar-thin">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Barcode Cafe - Lalkhan Bazar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                      Address / Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Mezzan Haile Ayun Lalkhan Bazar, Chattogram"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      required
                    />
                  </div>

                  {/* Map Location Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                      Map Location — click the map to drop a pin
                    </label>
                    <LeafletMap
                      lat={formData.lat}
                      lng={formData.lng}
                      picker
                      onPick={handlePickLocation}
                      zoom={15}
                      className="h-52 w-full border border-neutral-200 dark:border-neutral-800"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={mapLinkInput}
                        onChange={(e) => setMapLinkInput(e.target.value)}
                        placeholder="…or paste a Google Maps link"
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-xs"
                      />
                      <button
                        type="button"
                        onClick={applyMapLink}
                        className="px-3 py-2 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white text-xs font-semibold shrink-0 hover:bg-neutral-900 transition-colors"
                      >
                        Use link
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                        {typeof formData.lat === "number" && typeof formData.lng === "number"
                          ? `📍 ${formData.lat.toFixed(5)}, ${formData.lng.toFixed(5)}`
                          : "No location pinned yet"}
                      </span>
                      {typeof formData.lat === "number" && (
                        <button
                          type="button"
                          onClick={clearLocation}
                          className="text-red-500 font-semibold hover:underline"
                        >
                          Clear pin
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="e.g. +880 1888-000000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Opening Hours
                      </label>
                      <input
                        type="text"
                        name="hours"
                        value={formData.hours}
                        onChange={handleInputChange}
                        placeholder="e.g. 11:00 AM - 11:00 PM"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Rating
                      </label>
                      <input
                        type="number"
                        name="rating"
                        min="1"
                        max="5"
                        step="0.1"
                        value={formData.rating}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Upload Image (JPG, JPEG, PNG)
                      </label>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />

                      {formData.image && (
                        <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
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
                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Manager Name
                      </label>
                      <input
                        type="text"
                        name="manager"
                        value={formData.manager}
                        onChange={handleInputChange}
                        placeholder="e.g. Sofia Vergara"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Seating Capacity
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        placeholder="e.g. 150"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Brand
                      </label>
                      <select
                        value={formData.brandId ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            brandId: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm cursor-pointer"
                      >
                        <option value="">— No brand —</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Region
                      </label>
                      <select
                        value={formData.regionId ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            regionId: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm cursor-pointer"
                      >
                        <option value="">— No region —</option>
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                        Features (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="features"
                        value={formData.features}
                        onChange={handleInputChange}
                        placeholder="e.g. Waterfront View, Outdoor Terrace"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Delivery Zones (per-branch: area name → charge) */}
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50/40 dark:bg-neutral-950/30 border border-amber-100 dark:border-neutral-800/60 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1">🚚 Delivery Zones</label>
                      <button type="button" onClick={handleAddZone} className="text-xs px-2.5 py-1 bg-primary-500 text-white font-bold rounded-lg">+ Add Zone</button>
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">এই ব্রাঞ্চ থেকে কোন অঞ্চলে কত টাকা ডেলিভারি — customer checkout-এ নিজের অঞ্চল বাছবে।</p>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 shrink-0">Default charge (অন্য অঞ্চল)</span>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">৳</span>
                        <input type="number" min="0" step="1" value={formData.defaultDeliveryCharge} onChange={(e) => setFormData((p) => ({ ...p, defaultDeliveryCharge: parseFloat(e.target.value) || 0 }))} className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
                      </div>
                    </div>

                    {formData.deliveryZones.length === 0 && (
                      <p className="text-xs text-neutral-400 italic">কোনো zone নেই — সব ডেলিভারিতে উপরের default charge নেওয়া হবে।</p>
                    )}
                    {formData.deliveryZones.map((z, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input type="text" placeholder="Area name (e.g. Agrabad)" value={z.name} onChange={(e) => handleZoneChange(index, "name", e.target.value)} className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" required />
                        <div className="relative w-28 shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">৳</span>
                          <input type="number" min="0" step="1" placeholder="Charge" value={z.charge} onChange={(e) => handleZoneChange(index, "charge", e.target.value)} className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" required />
                        </div>
                        <button type="button" onClick={() => handleRemoveZone(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">✕</button>
                      </div>
                    ))}
                  </div>
                </div>

               
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all"
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

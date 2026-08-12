import { useState, useEffect, useRef } from "react";
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
  Phone,
  Mail,
  MapPin,
  Globe,
} from "lucide-react";
import {
  getAllBrandsAdmin,
  createBrand,
  updateBrand,
  deleteBrand,
  updateBrandOrder, // 🎯 রি-অর্ডার এপিআই সার্ভিস
} from "../../services/brandsService";

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
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const reorderTimeoutRef = useRef(null); // [SORTING-FIX] Debounce ref to prevent multiple rapid requests

  const load = () => {
    getAllBrandsAdmin()
      .then((data) => setBrands(data || []))
      .catch((e) => console.error("Failed to load brands:", e))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // 🎯 ইনস্ট্যান্ট ড্র্যাগ অ্যান্ড ড্রপ হ্যান্ডলার (Optimistic UI + Rollback + Debounce)
  // [SORTING-FIX] API fail হলে আগের order-এ rollback করা হবে এবং দ্রুত ড্র্যাগিং এ রেইস কন্ডিশন ঠেকাতে debounce করা হবে
  const handleBrandReorder = (reorderedBrands) => {
    const previousBrands = brands; // [SORTING-FIX] rollback এর জন্য আগের state save
    setBrands(reorderedBrands);
    const orderedIds = reorderedBrands.map((b) => String(b.id || b._id));

    // [SORTING-FIX] Debounce API call (300ms) to ensure only final settled order is sent to DB
    if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(() => {
      if (typeof updateBrandOrder === "function") {
        updateBrandOrder(orderedIds).catch((err) => {
          console.error("Failed to sync brand order on server:", err);
          setBrands(previousBrands); // [SORTING-FIX] ❌ API fail → আগের order restore
        });
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

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this brand? Its branches will be unassigned (not deleted)."
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

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";

  return (
    <div className="w-full space-y-6">
      {/* ── Responsive Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
        <div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Brands Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage restaurant group brands — drag and drop cards to change public display order.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary-500/20 transition-all cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Add New Brand
        </button>
      </div>

      {/* ── Brand List / Skeletons ── */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-32 sm:h-28 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse border border-neutral-200/40 dark:border-neutral-800/40"
            />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-950/30 text-neutral-400">
          <Store className="w-12 h-12 mx-auto stroke-1 mb-3 text-neutral-300 dark:text-neutral-700" />
          <h3 className="text-sm sm:text-base font-bold text-neutral-700 dark:text-neutral-300">
            No brands found
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Get started by adding your first brand. You will be able to organize branches and menus under it.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-primary-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-primary-600 transition-colors"
          >
            Create Brand
          </button>
        </div>
      ) : (
        /* 🎯 Responsive Reorder Group */
        <Reorder.Group
          axis="y"
          values={brands}
          onReorder={handleBrandReorder}
          className="flex flex-col gap-3.5"
        >
          {brands.map((b) => (
            <Reorder.Item
              key={b.id || b._id}
              value={b}
              className="group relative rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-stretch justify-between cursor-grab active:cursor-grabbing select-none"
            >
              {/* Card Main Container */}
              <div className="flex flex-col sm:flex-row items-stretch flex-1 min-w-0">
                {/* Brand Image / Cover & Drag Badge */}
                <div className="relative w-full sm:w-44 md:w-48 h-32 sm:h-auto shrink-0 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-neutral-100 dark:border-neutral-800/60">
                  {b.cover ? (
                    <img
                      src={b.cover}
                      alt={b.name}
                      className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : b.logoLight ? (
                    <img
                      src={b.logoLight}
                      alt={b.name}
                      className="max-h-14 max-w-[75%] object-contain pointer-events-none p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-neutral-300 dark:text-neutral-700">
                      <Store className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">No Image</span>
                    </div>
                  )}

                  {/* Drag Handle Tag */}
                  <div
                    className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white shadow-xs cursor-grab active:cursor-grabbing flex items-center gap-1"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold pr-0.5">#{b.order || 1}</span>
                  </div>

                  {/* Visibility Status Badge */}
                  {b.isActive === false ? (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-neutral-900/85 backdrop-blur-xs text-neutral-300 text-[10px] font-bold uppercase flex items-center gap-1 shadow-xs border border-neutral-700/50">
                      <EyeOff className="w-3 h-3 text-red-400" /> Hidden
                    </span>
                  ) : (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-bold uppercase flex items-center gap-1 shadow-xs border border-emerald-800/40">
                      <Eye className="w-3 h-3 text-emerald-400" /> Live
                    </span>
                  )}
                </div>

                {/* Brand Details */}
                <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white truncate">
                      {b.name}
                    </h3>
                    <span className="text-[11px] font-mono text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md border border-primary-200/60 dark:border-primary-900/40 truncate">
                      /brands/{b.slug}
                    </span>
                  </div>

                  {b.tagline && (
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 line-clamp-1">
                      {b.tagline}
                    </p>
                  )}

                  {b.description && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {b.description}
                    </p>
                  )}

                  {/* Contact Info Pills (Responsive metadata) */}
                  <div className="flex items-center gap-3 pt-1 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400">
                    {b.contactPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span className="truncate max-w-[120px]">{b.contactPhone}</span>
                      </span>
                    )}
                    {b.contactEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3 text-neutral-400" />
                        <span className="truncate max-w-[140px]">{b.contactEmail}</span>
                      </span>
                    )}
                    {b.website && (
                      <a
                        href={b.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="p-3.5 sm:p-4 flex items-center justify-end sm:flex-col sm:justify-center border-t sm:border-t-0 sm:border-l border-neutral-100 dark:border-neutral-800/80 gap-2 shrink-0 bg-neutral-50/40 dark:bg-neutral-950/20">
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-primary-500 hover:text-white text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  title="Edit Brand"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  title="Delete Brand"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Delete</span>
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* ── Responsive Create / Edit Modal (Bottom Sheet on Mobile, Centered on Desktop) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 shrink-0">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white">
                    {editing ? `Edit: ${editing.name}` : "Create New Brand"}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Fill in brand branding and contact details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Brand Name *
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Barcode Café"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Slug (URL identifier)
                    </label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className={inputClass}
                      placeholder="auto-generated if blank"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Tagline
                  </label>
                  <input
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Coffee, food & good vibes"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`${inputClass} resize-none`}
                    placeholder="Short description of the brand experience..."
                  />
                </div>

                {/* Images Upload Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 space-y-2">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
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
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary-500" />
                      {form.logoLight ? "Change Logo" : "Upload Logo"}
                    </button>
                    {form.logoLight && (
                      <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                        <img
                          src={form.logoLight}
                          alt="logo preview"
                          className="h-12 max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 space-y-2">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
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
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary-500" />
                      {form.cover ? "Change Cover" : "Upload Cover"}
                    </button>
                    {form.cover && (
                      <div className="h-16 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
                        <img
                          src={form.cover}
                          alt="cover preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact & Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Website URL
                    </label>
                    <input
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Contact Phone
                    </label>
                    <input
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      className={inputClass}
                      placeholder="+8801..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      className={inputClass}
                      placeholder="hello@brand.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Contact Address
                    </label>
                    <input
                      value={form.contactAddress}
                      onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. GEC Circle, Chattogram"
                    />
                  </div>
                </div>

                {/* Visibility Toggle & Order */}
                <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Display Sequence Number
                    </label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) =>
                        setForm({ ...form, order: parseInt(e.target.value) || 0 })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1 sm:pt-4">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) =>
                          setForm({ ...form, isActive: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-primary-500 accent-primary-500 cursor-pointer"
                      />
                      {form.isActive ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Eye className="w-4 h-4" /> Visible on Website
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-neutral-400 font-semibold">
                          <EyeOff className="w-4 h-4" /> Hidden from Public
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                {form.website && (
                  <div className="pt-1">
                    <a
                      href={form.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary-500 hover:underline font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Test visit website
                    </a>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {saving
                      ? "Saving..."
                      : editing
                      ? "Save Brand Changes"
                      : "Create Brand"}
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
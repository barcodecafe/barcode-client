import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Store, Upload, ExternalLink, Eye, EyeOff } from "lucide-react";
import {
  getAllBrandsAdmin,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../../services/brandsService";

const BLANK = {
  name: "", slug: "", tagline: "", description: "",
  logoLight: "", cover: "", website: "",
  contactPhone: "", contactEmail: "", contactAddress: "",
  order: 0, isActive: true,
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

  const load = () => {
    getAllBrandsAdmin()
      .then((data) => setBrands(data || []))
      .catch((e) => console.error("Failed to load brands:", e))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(BLANK); setIsModalOpen(true); };
  const openEdit = (b) => {
    setEditing(b);
    setForm({
      name: b.name || "", slug: b.slug || "", tagline: b.tagline || "", description: b.description || "",
      logoLight: b.logoLight || "", cover: b.cover || "", website: b.website || "",
      contactPhone: b.contactPhone || "", contactEmail: b.contactEmail || "", contactAddress: b.contactAddress || "",
      order: b.order || 0, isActive: b.isActive !== false,
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
        setBrands((prev) => prev.map((b) => (b.id === editing.id ? updated : b)));
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
    if (!window.confirm("Delete this brand? Its branches will be unassigned (not deleted).")) return;
    try {
      await deleteBrand(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete brand: " + err.message);
    }
  };

  const field = "w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
            Brands
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            The group's brands — each gets its own /brands/{"{slug}"} page. Assign branches to a brand from the Branches manager.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <div key={n} className="h-40 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />)}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-neutral-400">
          <Store className="w-10 h-10 mx-auto stroke-1 mb-3" />
          <p className="text-sm">No brands yet. Add your first brand to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b) => (
            <div key={b.id} className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
              <div className="h-24 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center relative">
                {b.cover ? (
                  <img src={b.cover} alt={b.name} className="w-full h-full object-cover" />
                ) : b.logoLight ? (
                  <img src={b.logoLight} alt={b.name} className="max-h-14 max-w-[60%] object-contain" />
                ) : (
                  <Store className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                )}
                {b.isActive === false && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-neutral-900/70 text-white text-[9px] font-bold uppercase flex items-center gap-1">
                    <EyeOff className="w-2.5 h-2.5" /> Hidden
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-neutral-800 dark:text-white truncate">{b.name}</h3>
                    <p className="text-[11px] text-neutral-400 font-mono truncate">/brands/{b.slug}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {b.tagline && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2">{b.tagline}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[88vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-lg font-black text-neutral-900 dark:text-white">{editing ? "Edit Brand" : "Add Brand"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-neutral-500 block mb-1">Brand Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} placeholder="Barcode Café" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 block mb-1">Slug (URL) — leave blank to auto-generate</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={field} placeholder="barcode-cafe" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 block mb-1">Tagline</label>
                  <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={field} placeholder="Coffee, food & good vibes" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 block mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${field} resize-none`} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 block mb-1">Logo</label>
                    <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => readImage(e.target.files[0], "logoLight")} className="hidden" />
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-950/40">
                      <Upload className="w-3.5 h-3.5" /> {form.logoLight ? "Change" : "Upload"}
                    </button>
                    {form.logoLight && <img src={form.logoLight} alt="logo" className="mt-2 h-10 object-contain mx-auto" />}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 block mb-1">Cover Image</label>
                    <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => readImage(e.target.files[0], "cover")} className="hidden" />
                    <button type="button" onClick={() => coverInputRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-950/40">
                      <Upload className="w-3.5 h-3.5" /> {form.cover ? "Change" : "Upload"}
                    </button>
                    {form.cover && <img src={form.cover} alt="cover" className="mt-2 h-10 w-full object-cover rounded" />}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-500 block mb-1">Website</label>
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={field} placeholder="https://www.mybarcodecafe.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 block mb-1">Contact Phone</label>
                    <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={field} placeholder="+8801..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 block mb-1">Contact Email</label>
                    <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={field} placeholder="hello@brand.com" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 block mb-1">Contact Address</label>
                  <input value={form.contactAddress} onChange={(e) => setForm({ ...form, contactAddress: e.target.value })} className={field} />
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 block mb-1">Display Order</label>
                    <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className={field} />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer mt-5">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded text-primary-500" />
                    {form.isActive ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-neutral-400" />}
                    Visible publicly
                  </label>
                </div>

                {form.website && (
                  <a href={form.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary-500 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Test website link
                  </a>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border text-neutral-600 dark:text-neutral-300 text-sm font-semibold">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
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

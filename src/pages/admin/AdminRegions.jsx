import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Plus, Edit2, Trash2, X, Building2 } from 'lucide-react';
import { getAllRegions, createRegion, updateRegion, deleteRegion } from '../../services/regionsService';
import { getAllBranches } from '../../services/branchesService';

// ---------------------------------------------------------------------------
// AdminRegions.jsx — /admin/regions
//
// Manage the top-level Regions that group branches (e.g. Dhaka, Chattogram).
// ---------------------------------------------------------------------------
export const AdminRegions = () => {
  const [regions, setRegions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([getAllRegions(), getAllBranches()])
      .then(([r, b]) => {
        setRegions(Array.isArray(r) ? r : []);
        setBranches(Array.isArray(b) ? b : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const branchCount = useMemo(() => {
    const map = {};
    branches.forEach((b) => {
      if (b.regionId != null) map[b.regionId] = (map[b.regionId] || 0) + 1;
    });
    return map;
  }, [branches]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (region) => {
    setEditing(region);
    setForm({ name: region.name, description: region.description || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError('Region name is required.');
    try {
      if (editing) await updateRegion(editing.id, { name: form.name.trim(), description: form.description.trim() });
      else await createRegion({ name: form.name.trim(), description: form.description.trim() });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Something went wrong.');
    }
  };

  const handleDelete = async (region) => {
    const n = branchCount[region.id] || 0;
    const msg = n
      ? `Delete "${region.name}"? Its ${n} branch(es) will become unassigned (you can reassign them later).`
      : `Delete region "${region.name}"?`;
    if (!window.confirm(msg)) return;
    try {
      await deleteRegion(region.id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete region.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Map className="w-8 h-8 text-primary-500" />
            Regions
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Top-level areas that group your branches. Assign a branch to a region from the branch editor.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Region
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : regions.length === 0 ? (
        <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
          <Map className="w-10 h-10 mx-auto stroke-1 mb-3 text-neutral-300" />
          <p className="font-bold text-sm">No regions yet.</p>
          <p className="text-xs mt-1">Add your first region (e.g. Dhaka, Chattogram).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map((region) => (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                    <Map className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(region)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(region)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-display font-bold text-base text-neutral-800 dark:text-white mt-3">{region.name}</h3>
                {region.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{region.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Building2 className="w-3.5 h-3.5 text-primary-500" />
                {branchCount[region.id] || 0} branch{(branchCount[region.id] || 0) === 1 ? '' : 'es'}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-10 p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-lg font-bold font-display text-neutral-800 dark:text-white">
                  {editing ? 'Edit Region' : 'Add Region'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Region Name
                  </label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Dhaka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Description (optional)
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Capital division"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
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
                    {editing ? 'Save Changes' : 'Create Region'}
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

export default AdminRegions;

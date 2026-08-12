import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, ArrowRight, Building2, Search, X } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import { getBrandBranches } from '../services/brandsService';

export const BrandBranches = () => {
  const brand = useBrand();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!brand?.slug) return;

    let isMounted = true;
    setLoading(true);

    getBrandBranches(brand.slug)
      .then((res) => {
        if (isMounted) {
          const loadedBranches = Array.isArray(res?.branches) ? res.branches : [];
          // 🎯 Admin order sorting
          const sortedBranches = [...loadedBranches].sort(
            (a, b) => (a.order ?? 999) - (b.order ?? 999)
          );
          setBranches(sortedBranches);
        }
      })
      .catch(() => {
        if (isMounted) setBranches([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [brand?.slug]);

  // Filter branches by search query
  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches;
    const q = searchQuery.toLowerCase();
    return branches.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
    );
  }, [branches, searchQuery]);

  if (!brand) return null;

  return (
    <div className="min-h-[70vh] pb-16">
      {/* Brand Header Banner */}
      <section className="bg-neutral-100/80 dark:bg-neutral-900/60 border-b border-neutral-200/70 dark:border-neutral-800/80 py-8 sm:py-12">
        <div className="site-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary-500 mb-2">
                {brand.name} Outlets
              </span>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Our Branches ({branches.length})
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl">
                Explore all {brand.name} branches. Visit your nearest outlet to dine-in, takeaway, or order online.
              </p>
            </div>

            {/* Branch Filter Input */}
            <div className="w-full md:w-72 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${brand.name} branches...`}
                className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 border border-neutral-200/80 dark:border-neutral-700/80 focus:border-primary-500/50 focus:outline-none shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Branches List */}
      <section className="site-container py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse border border-neutral-200/50 dark:border-neutral-800/50"
              />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 bg-white/40 dark:bg-neutral-900/40">
            <Building2 className="w-12 h-12 mx-auto stroke-1 text-neutral-300 dark:text-neutral-700 mb-3" />
            <h3 className="font-bold text-base text-neutral-700 dark:text-neutral-300">
              No branches found
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              There are currently no branches registered for {brand.name}.
            </p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 bg-white/40 dark:bg-neutral-900/40">
            <Search className="w-10 h-10 mx-auto stroke-1 text-neutral-300 dark:text-neutral-700 mb-3" />
            <h3 className="font-bold text-base text-neutral-700 dark:text-neutral-300">
              No branches match "{searchQuery}"
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Try searching with a different branch name or location.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-1.5 text-xs font-semibold text-primary-500 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredBranches.map((branch) => (
              <motion.div
                key={branch.id || branch._id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              >
                <Link
                  to={`/branches/${branch.id || branch._id}`}
                  className="group flex flex-col h-full rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary-500/40 transition-all duration-300"
                >
                  {/* Branch Cover Image */}
                  <div className="relative h-44 bg-neutral-100 dark:bg-neutral-950 overflow-hidden border-b border-neutral-100 dark:border-neutral-800/50">
                    {branch.image ? (
                      <img
                        src={branch.image}
                        alt={branch.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-850">
                        <Building2 className="w-10 h-10 text-neutral-400" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wide">
                      {brand.name}
                    </span>
                  </div>

                  {/* Branch Details */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-base text-neutral-850 dark:text-white group-hover:text-primary-500 transition-colors">
                      {branch.name}
                    </h3>

                    {branch.location && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 flex items-start gap-1.5 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-500 mt-0.5" />
                        <span>{branch.location}</span>
                      </p>
                    )}

                    {branch.phone && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>{branch.phone}</span>
                      </p>
                    )}

                    {/* Bottom Action */}
                    <div className="mt-auto pt-5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:underline inline-flex items-center gap-1">
                        View Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        Dine-in & Delivery
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default BrandBranches;

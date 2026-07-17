import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Store } from "lucide-react";
import { getAllBrands } from "../services/brandsService";
import { getAllBranches } from "../services/branchesService";

// Public "Our Brands" page — the group level above branches. Lists every brand
// the Barcode Restaurant Group runs; each card opens that brand's microsite.
export const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllBrands(), getAllBranches()])
      .then(([b, br]) => {
        setBrands(b || []);
        setBranches(br || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const branchCountByBrand = useMemo(() => {
    const m = {};
    branches.forEach((br) => {
      if (br.brandId != null) m[br.brandId] = (m[br.brandId] || 0) + 1;
    });
    return m;
  }, [branches]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
          Our Brands
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">
          One group, many flavours. Explore each brand in the Barcode Restaurant family and find your favourite.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <Store className="w-10 h-10 mx-auto stroke-1 mb-3" />
          <p className="text-sm">No brands have been added yet.</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {brands.map((brand) => (
            <motion.div
              key={brand.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <Link
                to={`/brands/${brand.slug}`}
                className="group flex flex-col h-full rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-36 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center overflow-hidden">
                  {brand.cover ? (
                    <img src={brand.cover} alt={brand.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : brand.logoLight ? (
                    <img src={brand.logoLight} alt={brand.name} className="max-h-20 max-w-[70%] object-contain" />
                  ) : (
                    <Building2 className="w-10 h-10 text-neutral-300 dark:text-neutral-700" />
                  )}
                </div>
                <div className="flex flex-col flex-1 p-5">
                  <h2 className="font-display text-lg font-extrabold text-neutral-800 dark:text-white">
                    {brand.name}
                  </h2>
                  {brand.tagline && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{brand.tagline}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <span className="text-[11px] font-semibold text-neutral-400">
                      {branchCountByBrand[brand.id] || 0} branch{(branchCountByBrand[brand.id] || 0) === 1 ? "" : "es"}
                    </span>
                    <span className="flex items-center gap-1 text-primary-500 font-semibold text-xs group-hover:gap-1.5 transition-all">
                      Explore <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Brands;

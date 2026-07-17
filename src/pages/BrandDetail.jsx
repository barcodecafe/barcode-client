import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Globe, ArrowLeft, ArrowRight, Building2, UtensilsCrossed } from "lucide-react";
import { getBrandBySlug } from "../services/brandsService";
import { getAllBranches } from "../services/branchesService";

// Brand microsite entry (/brands/:slug): the brand's own header + info, and the
// branches that belong to it. From here a customer drills into a branch's menu.
export const BrandDetail = () => {
  const { slug } = useParams();
  const [brand, setBrand] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([getBrandBySlug(slug), getAllBranches()])
      .then(([b, br]) => {
        if (!b) { setNotFound(true); return; }
        setBrand(b);
        setBranches((br || []).filter((x) => x.brandId === b.id));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Building2 className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
        <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white">Brand not found</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">This brand may have been moved or removed.</p>
        <Link to="/brands" className="inline-flex items-center gap-1.5 mt-6 text-primary-500 font-semibold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to all brands
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/brands" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary-500 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> All brands
      </Link>

      {/* Brand header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-sm mb-8"
      >
        <div className="h-40 sm:h-52 bg-neutral-100 dark:bg-neutral-950 relative">
          {brand.cover ? (
            <img src={brand.cover} alt={brand.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
            </div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4 flex-wrap">
            {brand.logoLight && (
              <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-2 shrink-0 -mt-14 shadow-md">
                <img src={brand.logoLight} alt={brand.name} className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
                {brand.name}
              </h1>
              {brand.tagline && <p className="text-sm text-primary-500 font-semibold mt-1">{brand.tagline}</p>}
              {brand.description && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 max-w-2xl leading-relaxed">{brand.description}</p>
              )}
            </div>
          </div>

          {/* Contact row */}
          <div className="flex flex-wrap gap-4 mt-5 text-xs text-neutral-500 dark:text-neutral-400">
            {brand.contactPhone && (
              <a href={`tel:${brand.contactPhone}`} className="inline-flex items-center gap-1.5 hover:text-primary-500">
                <Phone className="w-3.5 h-3.5" /> {brand.contactPhone}
              </a>
            )}
            {brand.contactEmail && (
              <a href={`mailto:${brand.contactEmail}`} className="inline-flex items-center gap-1.5 hover:text-primary-500">
                <Mail className="w-3.5 h-3.5" /> {brand.contactEmail}
              </a>
            )}
            {brand.website && (
              <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary-500">
                <Globe className="w-3.5 h-3.5" /> Visit website
              </a>
            )}
            {brand.contactAddress && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {brand.contactAddress}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Brand branches */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-extrabold text-neutral-800 dark:text-white">
          {brand.name} Branches
        </h2>
        <Link to="/menu" className="inline-flex items-center gap-1.5 text-primary-500 font-semibold text-xs hover:underline">
          <UtensilsCrossed className="w-3.5 h-3.5" /> View menu
        </Link>
      </div>

      {branches.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500">
          <MapPin className="w-8 h-8 mx-auto stroke-1 mb-2" />
          <p className="text-sm">No branches listed for this brand yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((br) => (
            <Link
              key={br.id}
              to={`/branches/${br.id}`}
              className="group rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <div className="h-32 bg-neutral-100 dark:bg-neutral-950">
                {br.image && <img src={br.image} alt={br.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm text-neutral-800 dark:text-white truncate">{br.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{br.location}</span>
                </p>
                <span className="flex items-center gap-1 text-primary-500 font-semibold text-xs mt-3 group-hover:gap-1.5 transition-all">
                  View branch <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandDetail;

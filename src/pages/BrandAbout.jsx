import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  Award,
  ArrowRight,
} from "lucide-react";
import { useBrand } from "../context/BrandContext";
import { getAllBranches } from "../services/branchesService";

export const BrandAbout = () => {
  const brand = useBrand();
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    if (!brand) return;
    getAllBranches()
      .then((all) => {
        const brandId = brand.id ?? brand._id;
        const filtered = (all || []).filter(
          (b) => String(b.brandId) === String(brandId) || String(b.brand?._id) === String(brandId)
        );
        setBranches(filtered);
      })
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, [brand]);

  if (!brand) return null;

  const phone = brand.contactPhone || brand.phone;
  const email = brand.contactEmail || brand.email;
  const address = brand.contactAddress || brand.address || brand.location;
  const logo = brand.logoLight || brand.logoDark || brand.cover;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
      {/* 1. HERO BANNER */}
      <section className="relative min-h-[300px] sm:min-h-[380px] flex items-center bg-neutral-900 text-white overflow-hidden border-b border-neutral-800">
        {brand.cover ? (
          <img
            src={brand.cover}
            alt={brand.name}
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

        <div className="site-container relative z-10 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 rounded-none bg-primary-500 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                Brand Story
              </span>
              <span className="px-3 py-1 rounded-none bg-white/10 backdrop-blur-md text-white text-xs font-semibold">
                Barcode Restaurant Group
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              {logo && (
                <img
                  src={logo}
                  alt={brand.name}
                  className="h-12 sm:h-16 w-auto object-contain p-1.5 bg-white/90 rounded-none shadow-md shrink-0"
                />
              )}
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
                About {brand.name}
              </h1>
            </div>

            {brand.tagline && (
              <p className="text-base sm:text-xl font-medium text-neutral-300 italic leading-relaxed">
                "{brand.tagline}"
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* 2. BRAND OVERVIEW & VALUES */}
      <section className="site-container py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Story & Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Culinary Ethos
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white leading-tight">
              Crafting Memorable Dining Experiences for {brand.name}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {brand.description ||
                `${brand.name} is a proud member of the Barcode Restaurant Group. We are committed to serving exceptional dishes prepared with high-quality ingredients, maintaining uncompromising hygiene, and offering a warm, inviting atmosphere for all food enthusiasts.`}
            </p>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-none border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-primary-500 mb-2" />
                <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">
                  Uncompromising Quality
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Freshly sourced ingredients and rigorous kitchen hygiene at every outlet.
                </p>
              </div>

              <div className="p-4 rounded-none border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-xs">
                <Award className="w-6 h-6 text-primary-500 mb-2" />
                <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">
                  Consistent Taste
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Standardized recipes crafted to deliver the exact same delicious taste daily.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Contact & Info Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 p-6 sm:p-8 rounded-none border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-sm space-y-6"
          >
            <h3 className="font-display text-lg font-bold text-neutral-800 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800/60 pb-3">
              Brand Contact & Details
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              {address && (
                <div className="flex gap-3 items-start">
                  <MapPin className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-400 text-[10px] uppercase">Headquarters / Location</p>
                    <p className="text-neutral-800 dark:text-neutral-200 mt-0.5">{address}</p>
                  </div>
                </div>
              )}

              {phone && (
                <div className="flex gap-3 items-center">
                  <Phone className="w-4 h-4 text-primary-500 shrink-0" />
                  <div>
                    <p className="font-bold text-neutral-400 text-[10px] uppercase">Helpline Phone</p>
                    <a href={`tel:${phone}`} className="text-neutral-800 dark:text-neutral-200 font-semibold hover:text-primary-500 transition-colors">
                      {phone}
                    </a>
                  </div>
                </div>
              )}

              {email && (
                <div className="flex gap-3 items-center">
                  <Mail className="w-4 h-4 text-primary-500 shrink-0" />
                  <div>
                    <p className="font-bold text-neutral-400 text-[10px] uppercase">Official Email</p>
                    <a href={`mailto:${email}`} className="text-neutral-800 dark:text-neutral-200 font-semibold hover:text-primary-500 transition-colors break-all">
                      {email}
                    </a>
                  </div>
                </div>
              )}

              {brand.website && (
                <div className="flex gap-3 items-center">
                  <Globe className="w-4 h-4 text-primary-500 shrink-0" />
                  <div>
                    <p className="font-bold text-neutral-400 text-[10px] uppercase">Website</p>
                    <a
                      href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 font-semibold hover:underline break-all"
                    >
                      {brand.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Part of Barcode Group</span>
              <Link to="/brands" className="text-primary-500 font-bold hover:underline">
                Explore All Brands →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. ACTIVE BRANCHES PREVIEW */}
      <section className="site-container pb-16">
        <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" /> {brand.name} Outlets
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Find our physical locations serving freshly prepared dishes.
            </p>
          </div>
          <Link
            to={`/brands/${brand.slug}/branches`}
            className="text-xs sm:text-sm font-bold text-primary-500 hover:underline flex items-center gap-1 shrink-0"
          >
            View All Branches <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingBranches ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 rounded-none bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-10 rounded-none border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
            <Building2 className="w-8 h-8 mx-auto stroke-1 mb-2 text-neutral-300 dark:text-neutral-700" />
            <p className="text-sm">No branch locations listed for {brand.name} yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((b) => (
              <Link
                key={b.id || b._id}
                to={`/brands/${brand.slug}/branches/${b.id || b._id}`}
                className="group flex flex-col justify-between p-5 rounded-none border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-lg hover:border-primary-500/40 transition-all duration-300"
              >
                <div>
                  <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors">
                    {b.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                    {b.address || b.location}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/40 text-xs">
                  <span className="font-semibold text-primary-500 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    View Branch Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BrandAbout;

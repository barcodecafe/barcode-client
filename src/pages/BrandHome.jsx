import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, UtensilsCrossed, Building2 } from "lucide-react";

// Swiper imports (matching Home.jsx pattern)
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

import { useBrand } from "../context/BrandContext";
import { getBrandBranches } from "../services/brandsService";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export const BrandHome = () => {
  const brand = useBrand();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brand?.slug) return;
    getBrandBranches(brand.slug)
      .then((res) => setBranches(res?.branches || []))
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, [brand?.slug]);

  if (!brand) return null;

  return (
    <div>
      {/* Hero Banner Image */}
      <section className="relative">
        <div className="h-56 sm:h-80 bg-neutral-200 dark:bg-neutral-950 overflow-hidden">
          {brand.cover ? (
            <img src={brand.cover} alt={brand.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-neutral-200 dark:to-neutral-900">
              <Building2 className="w-14 h-14 text-neutral-400 dark:text-neutral-700" />
            </div>
          )}
        </div>

        {/* Brand Details - Clean Ash Color Background Section */}
        <div className="bg-neutral-100 dark:bg-neutral-900/80 border-b border-neutral-200/70 dark:border-neutral-800 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {brand.name}
            </h1>
            {brand.tagline && (
              <p className="text-sm sm:text-base text-primary-500 font-semibold mt-1.5">
                {brand.tagline}
              </p>
            )}
            {brand.description && (
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-3 max-w-3xl leading-relaxed">
                {brand.description}
              </p>
            )}
            <Link
              to={`/brands/${brand.slug}/menu`}
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-none bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
            >
              <UtensilsCrossed className="w-4 h-4" /> View {brand.name} Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-neutral-800 dark:text-white">
            Our Branches
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 rounded-none bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12 rounded-none border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
            <MapPin className="w-8 h-8 mx-auto stroke-1 mb-2" />
            <p className="text-sm">No branches listed for {brand.name} yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Swiper Slider (Square Cards) */}
            <div className="sm:hidden -mx-4">
              <Swiper
                modules={[Pagination]}
                slidesPerView={1.15}
                spaceBetween={16}
                pagination={{ clickable: true }}
                className="!px-4 !pb-8"
              >
                {branches.map((br) => (
                  <SwiperSlide key={br.id}>
                    <Link
                      to={`/branches/${br.id}`}
                      className="group flex flex-col h-full rounded-none border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all"
                    >
                      <div className="h-36 bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
                        {br.image && (
                          <img
                            src={br.image}
                            alt={br.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-sm text-neutral-800 dark:text-white">{br.name}</h3>
                        <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{br.location}</span>
                        </p>
                        <span className="flex items-center gap-1 text-primary-500 font-semibold text-xs mt-auto pt-4 group-hover:gap-1.5 transition-all">
                          View branch <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Desktop & Tablet View: Grid (Square Cards) */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {branches.map((br) => (
                <motion.div key={br.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                  <Link
                    to={`/branches/${br.id}`}
                    className="group flex flex-col h-full rounded-none border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="h-36 bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
                      {br.image && (
                        <img
                          src={br.image}
                          alt={br.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-sm text-neutral-800 dark:text-white">{br.name}</h3>
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{br.location}</span>
                      </p>
                      <span className="flex items-center gap-1 text-primary-500 font-semibold text-xs mt-auto pt-4 group-hover:gap-1.5 transition-all">
                        View branch <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </section>
    </div>
  );
};

export default BrandHome;
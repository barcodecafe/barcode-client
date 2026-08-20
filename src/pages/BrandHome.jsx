import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, UtensilsCrossed, Building2, Phone, Star } from "lucide-react";

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

    let isMounted = true;
    setLoading(true);

    getBrandBranches(brand.slug)
      .then((res) => {
        if (isMounted) {
          const loadedBranches = Array.isArray(res?.branches) ? res.branches : [];
          // 🎯 এডমিনের সেট করা ড্র্যাগ অ্যান্ড ড্রপ অর্ডার (custom 'order' field) মেইনটেইন করা হলো
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

  if (!brand) return null;

  return (
    <div>
      {/* Hero Banner Image */}
      <section className="relative">
        <div className="h-56 sm:h-80 bg-neutral-200 dark:bg-neutral-950 overflow-hidden">
          {brand.cover ? (
            <img 
              src={brand.cover} 
              alt={brand.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-neutral-200 dark:to-neutral-900">
              <Building2 className="w-14 h-14 text-neutral-400 dark:text-neutral-700" />
            </div>
          )}
        </div>

        {/* Brand Details */}
        <div className="bg-neutral-100 dark:bg-neutral-900/80 border-b border-neutral-200/70 dark:border-neutral-800 py-8 sm:py-10">
          {/* 🎯 Global site-container class applied */}
          <div className="site-container">
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
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-none bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4" /> View {brand.name} Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      {/* 🎯 Global site-container class applied */}
      <section className="site-container py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-neutral-800 dark:text-white">
            Our Branches ({branches.length})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse border border-neutral-200/50 dark:border-neutral-800/50" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 bg-white/40 dark:bg-neutral-900/40">
            <MapPin className="w-8 h-8 mx-auto stroke-1 mb-2 text-neutral-300 dark:text-neutral-700" />
            <p className="text-sm font-medium">No branches listed for {brand.name} yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Swiper Slider */}
            <div className="sm:hidden -mx-4">
              <Swiper
                modules={[Pagination]}
                slidesPerView={1.15}
                spaceBetween={16}
                pagination={{ clickable: true }}
                className="!px-4 !pb-8"
              >
                {branches.map((br) => {
                  const branchPhone = br.phone || br.contactNumber || br.contact || br.phoneNo;
                  const detailUrl = `/brands/${brand.slug}/branches/${br.id || br._id}`;
                  return (
                    <SwiperSlide key={br.id || br._id}>
                      <div className="group flex flex-col justify-between h-full rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-neutral-950/20 hover:border-primary-500/40 transition-all duration-300">
                        <div className="relative h-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                          <Link to={detailUrl}>
                            {br.image ? (
                              <img
                                src={br.image}
                                alt={br.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
                                <Building2 className="w-8 h-8 text-neutral-400" />
                              </div>
                            )}
                          </Link>
                          {br.rating && (
                            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary-500 text-[10px] font-bold text-white uppercase tracking-wider z-10 shadow-xs">
                              ★ {br.rating}
                            </div>
                          )}
                        </div>

                        <div className="p-4 grow flex flex-col justify-between gap-3 sm:gap-4">
                          <div>
                            <Link to={detailUrl}>
                              <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors mb-1.5 leading-snug break-words">
                                {br.name}
                              </h3>
                            </Link>
                            {br.location && (
                              <div className="flex gap-1.5 items-start text-xs text-neutral-500 dark:text-neutral-400">
                                <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{br.location}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold mt-auto">
                            <a
                              href={branchPhone ? `tel:${branchPhone}` : '#'}
                              className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-primary-500 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-primary-500" />
                              <span>Call</span>
                            </a>
                            <Link
                              to={detailUrl}
                              className="text-primary-500 hover:text-primary-600 flex items-center gap-0.5 group/btn font-semibold"
                            >
                              Details
                              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Desktop & Tablet View: Grid */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {branches.map((br) => {
                const branchPhone = br.phone || br.contactNumber || br.contact || br.phoneNo;
                const detailUrl = `/brands/${brand.slug}/branches/${br.id || br._id}`;
                return (
                  <motion.div key={br.id || br._id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                    <div className="group flex flex-col justify-between h-full rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-neutral-950/20 hover:border-primary-500/40 transition-all duration-300">
                      <div className="relative h-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        <Link to={detailUrl}>
                          {br.image ? (
                            <img
                              src={br.image}
                              alt={br.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
                              <Building2 className="w-8 h-8 text-neutral-400" />
                            </div>
                          )}
                        </Link>
                        {br.rating && (
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary-500 text-[10px] font-bold text-white uppercase tracking-wider z-10 shadow-xs">
                            ★ {br.rating}
                          </div>
                        )}
                      </div>

                      <div className="p-4 grow flex flex-col justify-between gap-3 sm:gap-4">
                        <div>
                          <Link to={detailUrl}>
                            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors mb-1.5 leading-snug break-words">
                              {br.name}
                            </h3>
                          </Link>
                          {br.location && (
                            <div className="flex gap-1.5 items-start text-xs text-neutral-500 dark:text-neutral-400">
                              <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{br.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold mt-auto">
                          <a
                            href={branchPhone ? `tel:${branchPhone}` : '#'}
                            className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-primary-500 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-primary-500" />
                            <span>Call</span>
                          </a>
                          <Link
                            to={detailUrl}
                            className="text-primary-500 hover:text-primary-600 flex items-center gap-0.5 group/btn font-semibold"
                          >
                            Details
                            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </section>
    </div>
  );
};

export default BrandHome;
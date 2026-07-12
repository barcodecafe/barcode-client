import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Eye,
  MapPin,
  Calendar,
  UtensilsCrossed,
  Building2,
  Quote,
} from 'lucide-react';
import { getAboutData } from '../services/aboutService';

export const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAboutData().then((data) => {
      setAboutData(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { timeline, leadership, mission, vision, stats } = aboutData;

  return (
    <div className="w-full">
      {/* ===================================================================
          1. PAGE HEADER (LIGHT & PREMIUM CULINARY THEME)
      =================================================================== */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900/40 dark:to-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden border-b border-neutral-200 dark:border-neutral-800/60 transition-colors duration-300">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Brand Story & Scale */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100/50 dark:bg-primary-950/30 border border-primary-200/50 dark:border-primary-800/40 backdrop-blur-sm"
              >
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                <span className="text-primary-700 dark:text-primary-400 font-semibold uppercase tracking-widest text-[10px] sm:text-xs">
                  About Barcode Group
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.15]"
              >
                Good Food, <br />
                Run Like a <span className="text-primary-500 relative inline-block">
                  Promise
                  <span className="absolute bottom-1.5 left-0 w-full h-[6px] bg-primary-200/60 dark:bg-primary-500/20 -z-10 rounded-full" />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg font-light leading-relaxed max-w-xl tracking-wide"
              >
                From a single kitchen to six thriving branches, Barcode has stayed true to
                one core philosophy: every dish should meet the exact same culinary standard.
                Every single time. Everywhere.
              </motion.p>

              {/* Dynamic trust signals built directly into the layout */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-4 flex flex-wrap items-center gap-y-4 gap-x-6 text-neutral-500 dark:text-neutral-400 text-sm font-medium border-t border-neutral-200/60 dark:border-neutral-800/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-primary-500 font-extrabold font-display text-xl sm:text-2xl">6</span>
                  <span className="tracking-wide">Active Branches</span>
                </div>
                <div className="hidden sm:block w-px h-5 bg-neutral-300 dark:bg-neutral-800 self-center" />
                <div className="flex items-center gap-2">
                  <span className="text-primary-500 font-extrabold font-display text-xl sm:text-2xl">100%</span>
                  <span className="tracking-wide">Consistency</span>
                </div>
                <div className="hidden sm:block w-px h-5 bg-neutral-300 dark:bg-neutral-800 self-center" />
                <div className="flex items-center gap-2">
                  <span className="text-primary-500 font-extrabold font-display text-xl sm:text-2xl">1</span>
                  <span className="tracking-wide">Uncompromising Taste</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Premium Food-Centric Dynamic Grid */}
            <div className="lg:col-span-6 relative mt-6 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative grid grid-cols-12 gap-4 items-center max-w-[520px] mx-auto lg:mr-0"
              >
                <div className="col-span-7 row-span-12 relative z-10 group overflow-hidden rounded-3xl shadow-xl shadow-neutral-900/5 dark:shadow-black/40 border-4 border-white dark:border-neutral-900">
                  <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"
                    alt="Signature Premium Dish"
                    className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
                <div className="col-span-5 space-y-4 self-center">
                  <div className="overflow-hidden rounded-2xl shadow-lg border-2 border-white dark:border-neutral-900 group">
                    <img
                      src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80"
                      alt="Restaurant Live Ambiance"
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="overflow-hidden rounded-2xl shadow-lg border-2 border-white dark:border-neutral-900 group">
                    <img
                      src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=400&q=80"
                      alt="Master chef plating professional dish"
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Floating Group Network Badge */}
                <div className="glass absolute -bottom-4 left-4 lg:-left-6 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider leading-none mb-1">Group Network</p>
                    <p className="text-xs sm:text-sm font-extrabold text-neutral-800 dark:text-white leading-none">Barcode Hospitality</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. OUR STORY — narrative + image, told as a timeline
      =================================================================== */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-28"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-xl bg-neutral-200 dark:bg-neutral-800">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
                alt="Inside a Barcode restaurant branch"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 text-center">
              Placeholder image — swap for real branch photography
            </p>
          </motion.div>

          <div>
            <span className="text-primary-500 font-semibold uppercase tracking-wider text-sm">
              Our Story
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 mb-5">
              How We Got Here
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 font-light leading-relaxed mb-10">
              Barcode started as one restaurant with a clear point of view:
              dining out should feel considered, not complicated. That same
              standard now travels across every branch we open.
            </p>

            <div className="space-y-8">
              {timeline.map((item, idx) => (
                <motion.div
                  key={item.year + idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="flex gap-5"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-11 h-11 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-500 font-display font-bold text-xs">
                      {item.year}
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-800 mt-2" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-display font-bold text-neutral-800 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm font-light leading-relaxed mt-1">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. MISSION & VISION
      =================================================================== */}
      <section className="bg-neutral-100 dark:bg-neutral-900/40 py-16 sm:py-24 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-primary-500 font-semibold uppercase tracking-wider text-sm">
              What Drives Us
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Mission &amp; Vision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center mb-5">
                <Target className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="font-display font-bold text-xl text-neutral-800 dark:text-white mb-3">
                Our Mission
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                {mission}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center mb-5">
                <Eye className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="font-display font-bold text-xl text-neutral-800 dark:text-white mb-3">
                Our Vision
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                {vision}
              </p>
            </motion.div>
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-3 gap-4 mt-8 p-6 sm:p-8 rounded-2xl bg-neutral-900 text-center">
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary-400">{stats.founded}</div>
              <div className="text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">
                Founded
              </div>
            </div>
            <div className="border-x border-neutral-700">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary-400">{stats.branchesCount}</div>
              <div className="text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">
                Branches
              </div>
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary-400">{stats.standard}</div>
              <div className="text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">
                Standard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. OWNER & EXECUTIVE TEAM
      =================================================================== */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-primary-500 font-semibold uppercase tracking-wider text-sm">
            Leadership
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
            Owner &amp; Executive Team
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 font-light mt-3">
            The people responsible for keeping every branch on the same standard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {leadership.map((person, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="group rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <img
                  src={person.image}
                  alt={person.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-neutral-800 dark:text-white">
                  {person.name}
                </h3>
                <span className="text-primary-500 text-xs font-semibold uppercase tracking-wider block mt-0.5 mb-2">
                  {person.role}
                </span>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm font-light leading-relaxed">
                  {person.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
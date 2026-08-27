import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Eye,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { getAboutData } from '../services/aboutService';

export const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAboutData()
      .then((data) => setAboutData(data))
      .catch((err) => console.error('Failed to load about page:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Fallbacks with robust defaults
  const heroBadge = aboutData?.heroBadge || 'About Barcode Group';
  const heroTitle = aboutData?.heroTitle || 'Good Food, \nRun Like a Promise';
  const heroHighlightText = aboutData?.heroHighlightText || 'Promise';
  const heroDescription =
    aboutData?.heroDescription ||
    'From a single kitchen to six thriving branches, Barcode has stayed true to one core philosophy: every dish should meet the exact same culinary standard. Every single time. Everywhere.';
  const heroImageMain =
    aboutData?.heroImageMain ||
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
  const heroImageSecondary1 =
    aboutData?.heroImageSecondary1 ||
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80';
  const heroImageSecondary2 =
    aboutData?.heroImageSecondary2 ||
    'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=400&q=80';
  const heroNetworkBadgeTitle = aboutData?.heroNetworkBadgeTitle || 'Group Network';
  const heroNetworkBadgeSubtitle = aboutData?.heroNetworkBadgeSubtitle || 'Barcode Hospitality';

  const heroStat1Value = aboutData?.heroStat1Value || '6';
  const heroStat1Label = aboutData?.heroStat1Label || 'Active Branches';
  const heroStat2Value = aboutData?.heroStat2Value || '100%';
  const heroStat2Label = aboutData?.heroStat2Label || 'Consistency';
  const heroStat3Value = aboutData?.heroStat3Value || '1';
  const heroStat3Label = aboutData?.heroStat3Label || 'Uncompromising Taste';

  const storyBadge = aboutData?.storyBadge || 'Our Story';
  const storyTitle = aboutData?.storyTitle || 'How We Got Here';
  const storyDescription =
    aboutData?.storyDescription ||
    'Barcode started as one restaurant with a clear point of view: dining out should feel considered, not complicated. That same standard now travels across every branch we open.';
  const storyImage =
    aboutData?.storyImage ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';
  const storyImageCaption = aboutData?.storyImageCaption || '';
  const timeline = Array.isArray(aboutData?.timeline) ? aboutData.timeline : [];

  const missionTitle = aboutData?.missionTitle || 'Our Mission';
  const mission =
    aboutData?.mission ||
    'To serve thoughtfully sourced, carefully prepared food in a space that feels welcoming rather than formal — and to hold that standard at every branch, every day, for every guest.';
  const visionTitle = aboutData?.visionTitle || 'Our Vision';
  const vision =
    aboutData?.vision ||
    "To grow into a name people trust before they've even sat down — known branch after branch for the same quality, the same care, and a dining experience worth returning to.";

  const stats = {
    founded: aboutData?.stats?.founded || '2022',
    foundedLabel: aboutData?.stats?.foundedLabel || 'Founded',
    branchesCount: aboutData?.stats?.branchesCount || '6',
    branchesCountLabel: aboutData?.stats?.branchesCountLabel || 'Branches',
    standard: aboutData?.stats?.standard || '100%',
    standardLabel: aboutData?.stats?.standardLabel || 'Standard',
  };

  const leadershipBadge = aboutData?.leadershipBadge || 'Leadership';
  const leadershipTitle = aboutData?.leadershipTitle || 'Owner & Executive Team';
  const leadershipSubtitle =
    aboutData?.leadershipSubtitle ||
    'The people responsible for keeping every branch on the same standard.';
  const leadership = Array.isArray(aboutData?.leadership) ? aboutData.leadership : [];

  const renderTitle = (title, highlight) => {
    if (!highlight || !title.toLowerCase().includes(highlight.toLowerCase())) {
      return <span className="whitespace-pre-line">{title}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = title.split(regex);
    return (
      <span className="whitespace-pre-line">
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-primary-500 relative inline-block">
              {part}
              <span className="absolute bottom-1.5 left-0 w-full h-[6px] bg-primary-200/60 dark:bg-primary-500/20 -z-10 rounded-full" />
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="w-full">
      {/* ===================================================================
          1. PAGE HEADER (LIGHT & PREMIUM CULINARY THEME)
      =================================================================== */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900/40 dark:to-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden border-b border-neutral-200 dark:border-neutral-800/60 transition-colors duration-300">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        <div className="relative site-container z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Brand Story & Scale */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {heroBadge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100/50 dark:bg-primary-950/30 border border-primary-200/50 dark:border-primary-800/40 backdrop-blur-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-primary-700 dark:text-primary-400 font-semibold uppercase tracking-widest text-[10px] sm:text-xs">
                    {heroBadge}
                  </span>
                </motion.div>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.15]"
              >
                {renderTitle(heroTitle, heroHighlightText)}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg font-light leading-relaxed max-w-xl tracking-wide"
              >
                {heroDescription}
              </motion.p>

              {/* Dynamic trust signals built directly into the layout */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-4 flex flex-wrap items-center gap-y-4 gap-x-6 text-neutral-500 dark:text-neutral-400 text-sm font-medium border-t border-neutral-200/60 dark:border-neutral-800/60"
              >
                {heroStat1Value && (
                  <div className="flex items-center gap-2">
                    <span className="text-primary-500 font-extrabold font-display text-xl sm:text-2xl">{heroStat1Value}</span>
                    <span className="tracking-wide">{heroStat1Label}</span>
                  </div>
                )}
                {heroStat2Value && (
                  <>
                    <div className="hidden sm:block w-px h-5 bg-neutral-300 dark:bg-neutral-800 self-center" />
                    <div className="flex items-center gap-2">
                      <span className="text-primary-500 font-extrabold font-display text-xl sm:text-2xl">{heroStat2Value}</span>
                      <span className="tracking-wide">{heroStat2Label}</span>
                    </div>
                  </>
                )}
                {heroStat3Value && (
                  <>
                    <div className="hidden sm:block w-px h-5 bg-neutral-300 dark:bg-neutral-800 self-center" />
                    <div className="flex items-center gap-2">
                      <span className="text-primary-500 font-extrabold font-display text-xl sm:text-2xl">{heroStat3Value}</span>
                      <span className="tracking-wide">{heroStat3Label}</span>
                    </div>
                  </>
                )}
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
                    src={heroImageMain}
                    alt="Signature Premium Dish"
                    className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
                <div className="col-span-5 space-y-4 self-center">
                  <div className="overflow-hidden rounded-2xl shadow-lg border-2 border-white dark:border-neutral-900 group">
                    <img
                      src={heroImageSecondary1}
                      alt="Restaurant Live Ambiance"
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="overflow-hidden rounded-2xl shadow-lg border-2 border-white dark:border-neutral-900 group">
                    <img
                      src={heroImageSecondary2}
                      alt="Master chef plating professional dish"
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Floating Group Network Badge */}
                {(heroNetworkBadgeTitle || heroNetworkBadgeSubtitle) && (
                  <div className="glass absolute -bottom-4 left-4 lg:-left-6 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                      </svg>
                    </div>
                    <div>
                      {heroNetworkBadgeTitle && (
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider leading-none mb-1">
                          {heroNetworkBadgeTitle}
                        </p>
                      )}
                      {heroNetworkBadgeSubtitle && (
                        <p className="text-xs sm:text-sm font-extrabold text-neutral-800 dark:text-white leading-none">
                          {heroNetworkBadgeSubtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. OUR STORY — narrative + image, told as a timeline
      =================================================================== */}
      <section className="site-container py-16 sm:py-24">
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
                src={storyImage}
                alt="Inside a Barcode restaurant branch"
                className="w-full h-full object-cover"
              />
            </div>
            {storyImageCaption && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 text-center">
                {storyImageCaption}
              </p>
            )}
          </motion.div>

          <div>
            <span className="text-primary-500 font-semibold uppercase tracking-wider text-sm">
              {storyBadge}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 mb-5">
              {storyTitle}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 font-light leading-relaxed mb-10">
              {storyDescription}
            </p>

            <div className="space-y-8">
              {timeline.map((item, idx) => (
                <motion.div
                  key={item._id || item.id || item.year + idx}
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
          3. VISION, MISSION & CORE VALUES (3 Equal Pillars)
      =================================================================== */}
      <section className="bg-neutral-100 dark:bg-neutral-900/40 py-16 sm:py-24 transition-colors duration-300">
        <div className="site-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-primary-500 font-semibold uppercase tracking-wider text-sm">
              What Drives Us
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Vision, Mission &amp; Core Values
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* 1. Our Vision */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-7 sm:p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-5 text-primary-500">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-800 dark:text-white mb-3">
                  {visionTitle}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 font-light leading-relaxed text-sm sm:text-base">
                  {vision}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center gap-2 text-xs font-semibold text-primary-500">
                <Sparkles className="w-4 h-4" />
                <span>Our Long-term Inspiration</span>
              </div>
            </motion.div>

            {/* 2. Our Mission */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-7 sm:p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-5 text-primary-500">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-800 dark:text-white mb-3">
                  {missionTitle}
                </h3>
                
                {/* Clean formatted mission text */}
                <div className="space-y-2.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
                  {(() => {
                    const raw = mission || '';
                    const clean = raw.replace(/[🔲➤•]/g, '\n');
                    const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
                    if (lines.length > 1) {
                      const hasIntro = lines[0].toLowerCase().includes('committed to');
                      const intro = hasIntro ? lines[0] : null;
                      const items = hasIntro ? lines.slice(1) : lines;
                      return (
                        <div className="space-y-2.5">
                          {intro && <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{intro}</p>}
                          <ul className="space-y-2">
                            {items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return <p>{mission}</p>;
                  })()}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center gap-2 text-xs font-semibold text-primary-500">
                <CheckCircle2 className="w-4 h-4" />
                <span>Our Daily Commitment</span>
              </div>
            </motion.div>

            {/* 3. Core Values */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-7 sm:p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-5 text-primary-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-neutral-800 dark:text-white mb-4">
                  {aboutData?.valuesTitle || 'Core Values'}
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { title: 'Guest First', desc: 'Prioritizing customer delight & heartfelt hospitality' },
                    { title: 'Integrity', desc: 'Operating with transparency, ethics & accountability' },
                    { title: 'Excellence', desc: 'Uncompromising food safety, hygiene & culinary quality' },
                    { title: 'Respect', desc: 'Deep care and dignity for our guests, team & community' },
                  ].map((val, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex items-start gap-2.5 transition-all hover:border-primary-500/30"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100">
                          {val.title}
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-light mt-0.5 leading-snug">
                          {val.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center gap-2 text-xs font-semibold text-primary-500">
                <Heart className="w-4 h-4" />
                <span>Our Guiding Principles</span>
              </div>
            </motion.div>
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-3 gap-4 mt-8 p-6 sm:p-8 rounded-2xl bg-neutral-900 text-center">
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary-400">{stats.founded}</div>
              <div className="text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">
                {stats.foundedLabel || 'Founded'}
              </div>
            </div>
            <div className="border-x border-neutral-700">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary-400">{stats.branchesCount}</div>
              <div className="text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">
                {stats.branchesCountLabel || 'Branches'}
              </div>
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary-400">{stats.standard}</div>
              <div className="text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">
                {stats.standardLabel || 'Standard'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. OWNER & EXECUTIVE TEAM
      =================================================================== */}
      <section className="site-container py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-primary-500 font-semibold uppercase tracking-wider text-sm">
            {leadershipBadge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
            {leadershipTitle}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 font-light mt-3">
            {leadershipSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
          {leadership.map((person, idx) => (
            <motion.div
              key={person._id || person.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="group rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {person.image ? (
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <UtensilsCrossed className="w-12 h-12 opacity-30" />
                  </div>
                )}
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
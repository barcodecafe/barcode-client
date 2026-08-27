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
  Users,
  Lightbulb,
  Scale,
  Leaf,
  Compass,
  Award,
  Quote,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { getAboutData } from '../services/aboutService';

export const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);

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

  const defaultFullStory =
    `Hello Barcodians,\n\n` +
    `Thank you so much for visiting Barcode. We are grateful to have you beside us in all of our good and bad times since the starting of our journey. Let's confabulate over our journey today.\n\n` +
    `On a fine afternoon of 2013, I was trying to find a place to have a light chit-chat time with friends over freshly brewed coffee. But unfortunately, at that time, there were no such places in Chittagong where someone could sit, relax, and enjoy reasonable food. Since then, I was planning to do something about that. Basically, from that fervour, we started Barcode Cafe on 9th July 2013 at Chittagong Nasirabad area, only one day prior to the holy month of Ramadan.\n\n` +
    `Few days after starting Barcode Cafe, we noticed that despite having a wide range of savory foods to offer, most health-conscious people avoid street foods because of unhygienic environments. At that time, the idea of Fusion Cafe sparked inside my head—a cafe built with the proper composition of oriental and occidental street food culture, where deshi Chatpati and Fuchka are served alongside Italian Pizza-Pasta, American Burgers, and Arabian Shawarma in an open, healthy, comfortable ambiance. Keeping that in mind, we started Burgwich Town Fusion Cafe in 2015.\n\n` +
    `After that, we started our restaurant venture "Mezzan Haile Aaiun", inspired by our age-old Chittagonian tradition. Mezban is one of the most significant traditional confabs of Chittagong, and its main attraction is specially cooked "Mezbani Khabar". Noticing that visitors always wish to taste Mezbani food, we started Mezzan Haile Aaiun beside Chittagong Medical College in 2016, later expanding to five more outlets across Chittagong and Dhaka.\n\n` +
    `To celebrate authentic wedding hospitality and rural memories, we started Bir Chattala in 2016, serving Kacchi Biriyani, Shahi Jarda, regular Bangla Khabar, and year-round Iftari in a nostalgic rural household ambiance with Bela Biscuit and tea.\n\n` +
    `To spread the taste of seafood, we started Barcode Marina Capella by the bank of the river Karnafuli. In September 2020, we launched "Barcode Food Junction" at Muradpur bringing all ventures together with "Ek Cup Garam Cha" and "Barcode Premium Kabab". Today, we also offer Barcode Catering for indoor and outdoor celebrations across Bangladesh.\n\n` +
    `We have received your unconditional love and support in our long journey and want you beside us in our future ahead. And like always, Keep Coming Back.`;

  const storyDescription = aboutData?.storyDescription || defaultFullStory;
  const storyImage =
    aboutData?.storyImage ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';
  const storyImageCaption = aboutData?.storyImageCaption || 'Inside Barcode Cafe & Restaurant Group';

  const missionTitle = aboutData?.missionTitle || 'Our Mission';
  const mission =
    aboutData?.mission ||
    'At Barcode Restaurant Group, we are committed to:\n• Delivering unforgettable dining experiences through outstanding food, exceptional service, and a welcoming atmosphere.\n• Ensuring uncompromising standards of food safety, hygiene, quality, and consistency across every outlet.\n• Driving innovation by embracing modern food trends, technology, and operational excellence.\n• Conducting business with integrity, transparency, accountability, and respect for all.';
  const visionTitle = aboutData?.visionTitle || 'Our Vision';
  const vision =
    aboutData?.vision ||
    "To redefine hospitality by creating exceptional dining destinations where food excellence, heartfelt service and innovation inspire enduring memories while becoming Bangladesh's most trusted and admired restaurant group.";

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
          2. OUR STORY — Compact Executive Reading Capsule (No Long Scroll)
      =================================================================== */}
      <section className="site-container py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Founder / Restaurant Visual Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex flex-col justify-center"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-neutral-200 dark:bg-neutral-800 border-4 border-white dark:border-neutral-900 group aspect-[4/4.2] max-h-[460px] mx-auto w-full">
              <img
                src={storyImage}
                alt="Barcode Founder & Restaurant Journey"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <span className="text-[10px] uppercase tracking-wider text-primary-400 font-bold block mb-1">
                  Founder &amp; Managing Director
                </span>
                <h4 className="text-white font-display font-bold text-lg sm:text-xl leading-snug">
                  Monjurul Hoque
                </h4>
                <p className="text-neutral-300 text-xs font-light mt-1 line-clamp-1">
                  {storyImageCaption || 'Barcode Restaurant Group'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Elegant Reading Capsule */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-primary-500 font-semibold uppercase tracking-wider text-xs">
                  {storyBadge}
                </span>
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                  Founder's Letter
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 text-neutral-900 dark:text-white">
                {storyTitle}
              </h2>
            </div>

            {/* Scrollable Story Capsule matching image height */}
            <div className="relative">
              <div
                className={`space-y-3.5 text-neutral-600 dark:text-neutral-300 font-light text-xs sm:text-sm leading-relaxed overflow-y-auto pr-3 transition-all duration-300 ${
                  isStoryExpanded ? 'max-h-none' : 'max-h-[260px] sm:max-h-[300px]'
                }`}
                style={{ scrollbarWidth: 'thin' }}
              >
                {(storyDescription || defaultFullStory)
                  .split('\n\n')
                  .map((paragraph, idx) => {
                    if (!paragraph.trim()) return null;
                    return (
                      <p
                        key={idx}
                        className={
                          idx === 0
                            ? 'text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed'
                            : 'leading-relaxed'
                        }
                      >
                        {paragraph.trim()}
                      </p>
                    );
                  })}
              </div>

              {/* Gradient Bottom Overlay when collapsed */}
              {!isStoryExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-neutral-900 via-white/70 dark:via-neutral-900/70 to-transparent pointer-events-none" />
              )}
            </div>

            {/* Bottom Controls & Sign-off */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsStoryExpanded((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer py-1.5 px-3 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200/60 dark:border-primary-800/60 shadow-sm"
              >
                {isStoryExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Collapse View</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Read Full Story</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-400">
                  Keep Coming Back ✨
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================
          3. VISION, MISSION & CORE VALUES (Executive Layout)
      =================================================================== */}
      <section className="bg-neutral-100 dark:bg-neutral-900/40 py-16 sm:py-24 transition-colors duration-300">
        <div className="site-container space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-primary-500 font-semibold uppercase tracking-wider text-xs sm:text-sm">
              What Drives Us
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 text-neutral-900 dark:text-white">
              Vision, Mission &amp; Core Values
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 font-light text-sm mt-2 max-w-lg mx-auto">
              The foundational pillars and daily commitments that guide every culinary creation across Barcode Restaurant Group.
            </p>
          </div>

          {/* Row 1: Vision & Mission (2 Prominent Hero Cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* 1. Our Vision */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300"
            >
              {/* Background Ambient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl -z-10 group-hover:bg-primary-500/10 transition-colors" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                    <Eye className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-3 py-1 rounded-full border border-primary-200/50 dark:border-primary-800/50">
                    Long-term Inspiration
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-2xl text-neutral-900 dark:text-white mb-4">
                  {visionTitle}
                </h3>

                <div className="relative pl-6 border-l-2 border-primary-500/40 my-4">
                  <Quote className="w-5 h-5 text-primary-500/30 absolute -top-2 left-0 -translate-x-1/2" />
                  <p className="text-neutral-700 dark:text-neutral-300 font-light leading-relaxed text-base sm:text-lg italic">
                    "{vision}"
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 text-primary-500 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Inspiring enduring dining memories
                </span>
                <span className="font-mono text-[11px]">Barcode Standard</span>
              </div>
            </motion.div>

            {/* 2. Our Mission */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300"
            >
              {/* Background Ambient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl -z-10 group-hover:bg-primary-500/10 transition-colors" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                    <Target className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-3 py-1 rounded-full border border-primary-200/50 dark:border-primary-800/50">
                    Daily Commitment
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-2xl text-neutral-900 dark:text-white mb-2">
                  {missionTitle}
                </h3>
                
                <p className="font-semibold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 mb-4">
                  At Barcode Restaurant Group, we are committed to:
                </p>

                {/* 4 Clean Actionable Bullet Cards */}
                <div className="space-y-2.5">
                  {[
                    'Delivering unforgettable dining experiences through outstanding food, exceptional service, and a welcoming atmosphere.',
                    'Ensuring uncompromising standards of food safety, hygiene, quality, and consistency across every outlet.',
                    'Driving innovation by embracing modern food trends, technology, and operational excellence.',
                    'Conducting business with integrity, transparency, accountability, and respect for all.',
                  ].map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-start gap-3 transition-colors hover:border-primary-500/30"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-light leading-relaxed">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 text-primary-500 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  Consistent across every outlet
                </span>
                <span className="font-mono text-[11px]">Excellence Always</span>
              </div>
            </motion.div>
          </div>

          {/* Row 2: Our 8 Core Values (4-Column Modern Card Grid) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 shadow-sm space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl sm:text-2xl text-neutral-900 dark:text-white">
                    {aboutData?.valuesTitle || 'Our 8 Core Values'}
                  </h3>
                  <p className="text-xs text-neutral-400 font-light">
                    The non-negotiable principles that drive our hospitality and group culture.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full self-start sm:self-auto">
                8 Core Pillars
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Guest First', desc: 'Heartfelt service & uncompromised customer delight', icon: Heart },
                { title: 'Integrity', desc: 'Transparency, honesty, accountability & high ethics', icon: ShieldCheck },
                { title: 'Excellence', desc: 'Uncompromising food safety, hygiene & culinary quality', icon: Award },
                { title: 'Respect', desc: 'Deep care, dignity & value for guests, team & community', icon: Compass },
                { title: 'Teamwork', desc: 'Collaborative passion, synergy & unified teamwork', icon: Users },
                { title: 'Innovation', desc: 'Embracing modern food trends & culinary creativity', icon: Lightbulb },
                { title: 'Accountability', desc: 'Taking full ownership and responsibility in service', icon: Scale },
                { title: 'Sustainability', desc: 'Responsible sourcing, waste care & eco-conscious growth', icon: Leaf },
              ].map((val, idx) => {
                const IconComponent = val.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/80 hover:border-primary-500/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-500/10 group-hover:bg-primary-500 text-primary-500 group-hover:text-white flex items-center justify-center transition-all duration-300">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-neutral-400">
                        0{idx + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 group-hover:text-primary-500 transition-colors">
                        {val.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-light mt-1 leading-snug">
                        {val.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-3 gap-4 p-6 sm:p-8 rounded-3xl bg-neutral-900 text-center shadow-lg">
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary-400">{stats.founded}</div>
              <div className="text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">
                {stats.foundedLabel || 'Founded'}
              </div>
            </div>
            <div className="border-x border-neutral-700/80">
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
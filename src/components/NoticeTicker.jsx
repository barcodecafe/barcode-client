import React, { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

/**
 * NoticeTicker — Continuous TV / News Headline Marquee Banner
 *
 * @param {Object} props
 * @param {string} [props.previewText] - Optional preview text for admin settings
 * @param {boolean} [props.previewEnabled] - Optional preview toggle for admin settings
 * @param {boolean} [props.isPreview] - If true, bypasses context and uses preview props
 */
export const NoticeTicker = memo(
  ({ previewText, previewEnabled, isPreview = false }) => {
    const { settings, isSettingsLoaded } = useSettings();
    const [isDismissed, setIsDismissed] = useState(false);

    const isEnabled = isPreview
      ? Boolean(previewEnabled)
      : isSettingsLoaded &&
        Boolean(settings?.maintenanceNoticeEnabled) &&
        !isDismissed;

    const rawText = isPreview
      ? previewText
      : settings?.maintenanceNoticeText;

    const noticeText = (rawText || "").trim();

    // If disabled or text is empty, don't render anything
    if (!isEnabled || !noticeText) {
      return null;
    }

    // Create an array with repeated notice items to guarantee a continuous, gapless marquee loop
    const repeatedItems = [noticeText, noticeText, noticeText, noticeText];

    return (
      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="group relative w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-xs border-b border-white/10 select-none overflow-hidden z-25"
          role="region"
          aria-label="Announcement Notice Ticker"
        >
          <div className="flex items-center w-full min-h-[36px] sm:min-h-[38px]">
            {/* Fixed Left Breaking/Notice Badge */}
            <div className="shrink-0 z-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 bg-black/40 backdrop-blur-xs border-r border-white/15 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-extrabold tracking-wide text-white">
                NOTICE
              </span>
            </div>

            {/* Scrolling Ticker Track */}
            <div className="relative flex-1 overflow-hidden flex items-center py-1.5 cursor-default">
              {/* Subtle edge fades for smooth entrance/exit */}
              <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-r from-black/30 to-transparent pointer-events-none z-1" />
              <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-l from-black/30 to-transparent pointer-events-none z-1" />

              {/* Marquee Container with pause on hover */}
              <div className="animate-ticker flex items-center shrink-0">
                {repeatedItems.map((text, idx) => (
                  <div
                    key={`notice-ticker-item-${idx}`}
                    className="flex items-center shrink-0 whitespace-nowrap px-6 sm:px-8 text-xs sm:text-[13px] font-semibold text-white/95 tracking-wide"
                  >
                    <span>{text}</span>
                    <span className="mx-6 sm:mx-8 inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Duplicate block to ensure perfectly seamless 100% infinite loop */}
              <div
                className="animate-ticker flex items-center shrink-0"
                aria-hidden="true"
              >
                {repeatedItems.map((text, idx) => (
                  <div
                    key={`notice-ticker-dup-${idx}`}
                    className="flex items-center shrink-0 whitespace-nowrap px-6 sm:px-8 text-xs sm:text-[13px] font-semibold text-white/95 tracking-wide"
                  >
                    <span>{text}</span>
                    <span className="mx-6 sm:mx-8 inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Dismiss button (only on live view, not in admin preview) */}
            {!isPreview && (
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="shrink-0 z-10 p-1.5 mr-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss Notice"
                aria-label="Dismiss Notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

NoticeTicker.displayName = "NoticeTicker";
export default NoticeTicker;

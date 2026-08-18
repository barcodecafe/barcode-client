import React, { memo } from "react";
import { Megaphone } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

/**
 * NoticeTicker — Continuous TV / News Headline Marquee Banner
 *
 * @param {Object} props
 * @param {string} [props.previewText] - Optional preview text for admin settings
 * @param {boolean} [props.previewEnabled] - Optional preview toggle for admin settings
 * @param {boolean} [props.isPreview] - If true, bypasses context and uses preview props
 */
export const NoticeTicker = memo(({ previewText, previewEnabled, isPreview = false }) => {
  const { settings, isSettingsLoaded } = useSettings();

  const isEnabled = isPreview
    ? Boolean(previewEnabled)
    : isSettingsLoaded && Boolean(settings?.maintenanceNoticeEnabled);

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
    <div
      className="group relative w-full bg-gradient-to-r from-primary-800 via-primary-600 to-primary-700 text-white shadow-xs border-b border-white/10 select-none overflow-hidden z-20"
      role="region"
      aria-label="Announcement Notice Ticker"
    >
      <div className="flex items-center w-full min-h-[36px] sm:min-h-[38px]">
        {/* Fixed Left Breaking/Notice Badge */}
        <div className="shrink-0 z-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 bg-black/35 backdrop-blur-xs border-r border-white/15 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <Megaphone className="w-3.5 h-3.5 text-red-200 shrink-0" />
          <span className="hidden sm:inline font-extrabold tracking-wide text-white">
            NOTICE
          </span>
          <span className="sm:hidden font-extrabold tracking-wide text-white">
            NOTICE
          </span>
        </div>

        {/* Scrolling Ticker Track */}
        <div className="relative flex-1 overflow-hidden flex items-center py-1.5 cursor-default">
          {/* Subtle edge fades for smooth entrance/exit */}
          <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-1" />
          <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-1" />

          {/* Marquee Container with pause on hover */}
          <div className="animate-ticker flex items-center shrink-0">
            {repeatedItems.map((text, idx) => (
              <div
                key={`ticker-item-${idx}`}
                className="flex items-center shrink-0 whitespace-nowrap px-6 sm:px-8 text-xs sm:text-[13px] font-semibold text-white/95 tracking-wide"
              >
                <span>{text}</span>
                <span className="mx-6 sm:mx-8 inline-block w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
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
                key={`ticker-dup-${idx}`}
                className="flex items-center shrink-0 whitespace-nowrap px-6 sm:px-8 text-xs sm:text-[13px] font-semibold text-white/95 tracking-wide"
              >
                <span>{text}</span>
                <span className="mx-6 sm:mx-8 inline-block w-1.5 h-1.5 rounded-full bg-amber-300/80 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

NoticeTicker.displayName = "NoticeTicker";
export default NoticeTicker;

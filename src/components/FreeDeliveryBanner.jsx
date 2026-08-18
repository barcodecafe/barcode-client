import React, { useState, memo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, X, ArrowRight } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

/**
 * FreeDeliveryBanner — Continuous TV / News Marquee Banner for Free Delivery Campaigns
 *
 * @param {Object} props
 * @param {string} [props.previewText]
 * @param {boolean} [props.previewEnabled]
 * @param {string} [props.previewScope]
 * @param {number} [props.previewMinOrder]
 * @param {boolean} [props.isPreview]
 */
export const FreeDeliveryBanner = memo(
  ({
    previewText,
    previewEnabled,
    previewScope,
    previewMinOrder,
    isPreview = false,
  }) => {
    const { settings, isSettingsLoaded } = useSettings();
    const [isDismissed, setIsDismissed] = useState(false);

    const isEnabled = isPreview
      ? Boolean(previewEnabled)
      : isSettingsLoaded &&
        Boolean(settings?.freeDeliveryEnabled) &&
        Boolean(settings?.freeDeliveryShowBanner) &&
        !isDismissed;

    const defaultText = "🎉 Special Offer: Free Delivery Campaign is Active!";
    const bannerText = (
      isPreview
        ? previewText || defaultText
        : settings?.freeDeliveryBannerText?.trim() || defaultText
    ).trim();

    const scope = isPreview ? previewScope : settings?.freeDeliveryScope;
    const minOrder = isPreview
      ? previewMinOrder
      : settings?.freeDeliveryMinOrder;

    let scopeBadge = "All Orders";
    if (scope === "min_amount" && minOrder > 0) {
      scopeBadge = `Orders ৳${minOrder}+`;
    } else if (scope === "dishes") {
      scopeBadge = "Selected Dishes";
    } else if (scope === "areas") {
      scopeBadge = "Selected Areas";
    }

    if (!isEnabled || !bannerText) {
      return null;
    }

    // Repeated items for seamless infinite marquee loop
    const repeatedItems = [bannerText, bannerText, bannerText, bannerText];

    return (
      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="group relative w-full bg-gradient-to-r from-primary-800 via-primary-600 to-primary-700 text-white shadow-xs border-b border-white/10 select-none overflow-hidden z-30"
          role="region"
          aria-label="Free Delivery Campaign Announcement"
        >
          <div className="flex items-center w-full min-h-[36px] sm:min-h-[38px]">
            {/* Fixed Left Free Delivery Badge */}
            <div className="shrink-0 z-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 bg-black/35 backdrop-blur-xs border-r border-white/15 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <Truck className="w-3.5 h-3.5 text-red-200 shrink-0" />
              <span className="font-extrabold tracking-wide text-white">
                FREE DELIVERY
              </span>
              <span className="hidden md:inline-flex px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-black tracking-normal">
                {scopeBadge}
              </span>
            </div>

            {/* Scrolling Ticker Track */}
            <div className="relative flex-1 overflow-hidden flex items-center py-1.5 cursor-default">
              {/* Subtle edge fades */}
              <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-1" />
              <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-1" />

              {/* Marquee Container with pause on hover */}
              <div className="animate-ticker flex items-center shrink-0">
                {repeatedItems.map((text, idx) => (
                  <div
                    key={`free-del-item-${idx}`}
                    className="flex items-center shrink-0 whitespace-nowrap px-6 sm:px-8 text-xs sm:text-[13px] font-semibold text-white/95 tracking-wide"
                  >
                    <span>{text}</span>
                    <span className="mx-6 sm:mx-8 inline-block w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Duplicate block for seamless 100% loop */}
              <div
                className="animate-ticker flex items-center shrink-0"
                aria-hidden="true"
              >
                {repeatedItems.map((text, idx) => (
                  <div
                    key={`free-del-dup-${idx}`}
                    className="flex items-center shrink-0 whitespace-nowrap px-6 sm:px-8 text-xs sm:text-[13px] font-semibold text-white/95 tracking-wide"
                  >
                    <span>{text}</span>
                    <span className="mx-6 sm:mx-8 inline-block w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Action & Dismiss Button */}
            {!isPreview && (
              <div className="shrink-0 z-10 flex items-center gap-2 pr-3 pl-2 py-1.5 bg-black/35 backdrop-blur-xs border-l border-white/15">
                <Link
                  to="/menu"
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-[11px] transition-all cursor-pointer"
                >
                  Order Now <ArrowRight className="w-3 h-3" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Dismiss banner"
                  aria-label="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

FreeDeliveryBanner.displayName = "FreeDeliveryBanner";
export default FreeDeliveryBanner;

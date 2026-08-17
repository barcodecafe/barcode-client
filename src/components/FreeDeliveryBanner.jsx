import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Sparkles, X, ArrowRight } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

export const FreeDeliveryBanner = () => {
  const { settings, isSettingsLoaded } = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isSettingsLoaded || !settings?.freeDeliveryEnabled || !settings?.freeDeliveryShowBanner || isDismissed) {
    return null;
  }

  const defaultText = "🎉 Special Offer: Free Delivery Campaign is Active!";
  const bannerText = settings.freeDeliveryBannerText?.trim() || defaultText;

  let scopeBadge = "";
  if (settings.freeDeliveryScope === "min_amount" && settings.freeDeliveryMinOrder > 0) {
    scopeBadge = `Orders ৳${settings.freeDeliveryMinOrder}+`;
  } else if (settings.freeDeliveryScope === "dishes") {
    scopeBadge = "Selected Dishes";
  } else if (settings.freeDeliveryScope === "areas") {
    scopeBadge = "Selected Areas";
  } else {
    scopeBadge = "All Orders";
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-linear-to-r from-amber-600 via-primary-500 to-amber-500 text-white text-xs font-semibold shadow-xs relative z-40 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 justify-center text-center">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-extrabold uppercase tracking-wider shrink-0">
              <Truck className="w-3 h-3 animate-bounce" />
              {scopeBadge}
            </span>
            <span className="truncate tracking-tight font-bold">
              {bannerText}
            </span>
            <Link
              to="/menu"
              className="hidden sm:inline-flex items-center gap-1 text-white font-extrabold underline hover:text-amber-100 transition-colors ml-1 cursor-pointer shrink-0 text-[11px]"
            >
              Order Now <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FreeDeliveryBanner;

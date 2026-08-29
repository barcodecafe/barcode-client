import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, FileText, Clock, HelpCircle, ArrowRight } from "lucide-react";
import { getPolicy } from "../services/policyService";
import { getPolicyIcon } from "./admin/AdminPolicies";
import { FormattedPolicyText } from "../components/FormattedPolicyText";

const DEFAULT_TERMS = {
  title: "Terms of Service",
  lastUpdated: "August 2026",
  sections: [
    {
      icon: "shopping-bag",
      title: "1. Order Acceptance & Pricing",
      content:
        "By placing an order on Barcode Restaurant Group, you agree to provide accurate delivery and contact information. Prices listed on the platform are subject to change without prior notice, and special promotion rules apply as advertised.",
    },
    {
      icon: "truck",
      title: "2. Delivery & Fulfillment",
      content:
        "Estimated delivery times are provided for reference only and may vary due to weather, traffic, or kitchen rush. Customers are expected to receive the order at the provided address when the rider arrives.",
    },
    {
      icon: "refresh-cw",
      title: "3. Cancellations & Refunds",
      content:
        "Orders can only be cancelled before they are accepted or prepared by the kitchen. If an order is cancelled after preparation has begun, full charges may apply. Refunds for paid online orders will be processed according to payment gateway timelines.",
    },
    {
      icon: "globe",
      title: "4. Service Availability",
      content:
        "Barcode Restaurant Group reserves the right to modify or discontinue any dish, offer, or service area at any time.",
    },
  ],
};

export const TermsOfService = () => {
  const [data, setData] = useState(DEFAULT_TERMS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    getPolicy("terms-of-service")
      .then((res) => {
        if (res && res.sections && res.sections.length > 0) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error("Failed to load terms of service from server:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/10 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900/30 dark:to-neutral-950 text-neutral-800 dark:text-neutral-200 pt-6 pb-16 transition-colors duration-300">
      <div className="site-container space-y-6 max-w-4xl mx-auto">
        {/* Top Legal Navigation Tabs */}
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex p-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 rounded-none shadow-xs">
            <Link
              to="/privacy-policy"
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 rounded-none transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy Policy</span>
            </Link>
            <Link
              to="/terms-of-service"
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider bg-primary-500 text-white rounded-none shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Terms of Service</span>
            </Link>
          </div>
        </div>

        {/* Page Heading Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-2.5 pb-2"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-none">
            <FileText className="w-3.5 h-3.5" />
            Official Terms &amp; Conditions
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display text-neutral-900 dark:text-white">
            {data.title || "Terms of Service"}
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-primary-500" />
            <span>Last updated: {data.lastUpdated || "August 2026"}</span>
          </div>
        </motion.div>

        {/* Content Container (Square/Rectangular Architectural Shape) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-6 sm:p-10 rounded-none border border-neutral-200/80 dark:border-neutral-800/80 shadow-md divide-y divide-neutral-100 dark:divide-neutral-800/80"
        >
          {isLoading && !data.sections ? (
            <div className="space-y-8 animate-pulse py-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="space-y-3">
                  <div className="h-6 w-56 bg-neutral-200 dark:bg-neutral-800 rounded-none" />
                  <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-none" />
                  <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded-none" />
                </div>
              ))}
            </div>
          ) : (
            data.sections &&
            data.sections.map((section, idx) => {
              const IconComp = getPolicyIcon(section.icon);
              return (
                <section
                  key={section._id || section.id || idx}
                  className="py-6 first:pt-0 last:pb-0 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                      {section.title}
                    </h2>
                  </div>
                  <div className="pl-11">
                    <FormattedPolicyText content={section.content} />
                  </div>
                </section>
              );
            })
          )}
        </motion.div>

        {/* Bottom Support Banner */}
        <div className="bg-neutral-900 text-white p-5 sm:p-6 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4 border border-neutral-800 shadow-md">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-none bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm sm:text-base">
                Have questions about our terms or service rules?
              </h4>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                Our support team is always here to assist with any legal or order inquiry.
              </p>
            </div>
          </div>
          <Link
            to="/privacy-policy"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-sm transition-all shrink-0"
          >
            <span>Privacy Policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
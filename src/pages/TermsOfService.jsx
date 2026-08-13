import { useState, useEffect } from "react";
import { getPolicy } from "../services/policyService";
import { getPolicyIcon } from "./admin/AdminPolicies";

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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 pt-5 pb-12 transition-colors duration-300">
      {/* 🎯 Exact full-width site-container aligning directly with Navbar */}
      <div className="site-container space-y-4">
        {/* Compact Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-white">
            {data.title || "Terms of Service"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Last updated: {data.lastUpdated || "August 2026"}
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-6 text-sm sm:text-base leading-relaxed">
          {isLoading && !data.sections ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="space-y-2">
                  <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                  <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            data.sections &&
            data.sections.map((section, idx) => {
              const IconComp = getPolicyIcon(section.icon);
              return (
                <section key={section._id || section.id || idx} className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5 font-display">
                    <IconComp className="w-5 h-5 text-primary-500 shrink-0" />
                    <span>{section.title}</span>
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
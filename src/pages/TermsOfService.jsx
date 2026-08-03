import { useEffect } from "react";
import { FileCheck, ShoppingBag, Truck, RefreshCw } from "lucide-react";

export const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 py-12 transition-colors duration-300">
      {/* 🎯 Global site-container class applied */}
      <div className="site-container max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="inline-flex items-center justify-center p-3 bg-primary-500/10 text-primary-500 rounded-2xl mb-2">
            <FileCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Terms of Service[cite: 12]
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Last updated: August 2026[cite: 12]
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-6 text-sm leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary-500" /> 1. Order Acceptance & Pricing[cite: 12]
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              By placing an order on Barcode Restaurant Group, you agree to provide accurate delivery and contact information. Prices listed on the platform are subject to change without prior notice, and special promotion rules apply as advertised[cite: 12].
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-500" /> 2. Delivery & Fulfillment[cite: 12]
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Estimated delivery times are provided for reference only and may vary due to weather, traffic, or kitchen rush. Customers are expected to receive the order at the provided address when the rider arrives[cite: 12].
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary-500" /> 3. Cancellations & Refunds[cite: 12]
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Orders can only be cancelled before they are accepted or prepared by the kitchen. If an order is cancelled after preparation has begun, full charges may apply. Refunds for paid online orders will be processed according to payment gateway timelines[cite: 12].
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              4. Service Availability[cite: 12]
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Barcode Restaurant Group reserves the right to modify or discontinue any dish, offer, or service area at any time[cite: 12].
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
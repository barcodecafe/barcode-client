import { useEffect } from "react";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 py-10 sm:py-14 transition-colors duration-300">
      {/* 🎯 Exact full-width site-container aligning directly with Navbar logo & profile */}
      <div className="site-container space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="inline-flex items-center justify-center p-3 bg-primary-500/10 text-primary-500 rounded-2xl mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Last updated: August 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-10 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-6 text-sm sm:text-base leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 font-display">
              <Eye className="w-5 h-5 text-primary-500 shrink-0" />
              <span>1. Information We Collect</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              When you place an order or create an account with Barcode Restaurant Group, we collect details such as your name, phone number, email address, and delivery location to ensure a seamless food ordering experience.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 font-display">
              <FileText className="w-5 h-5 text-primary-500 shrink-0" />
              <span>2. How We Use Your Data</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Your personal information is strictly used for order fulfillment, rider assignment, delivery status updates, and customer support. We do not sell or rent your personal data to any third-party marketing services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 font-display">
              <Lock className="w-5 h-5 text-primary-500 shrink-0" />
              <span>3. Payment Security</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              All digital transactions are processed securely through certified SSL payment gateways (bKash, Nagad, Cards, etc.). We do not store your credit card or PIN information on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-display">
              4. Contact Us About Your Privacy
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              If you have any questions or concerns about our privacy practices, please reach out to our team at{" "}
              <a
                href="mailto:info@barcoderestaurantgroup.com"
                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:underline font-semibold transition-colors"
              >
                info@barcoderestaurantgroup.com
              </a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
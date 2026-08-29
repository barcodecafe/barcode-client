import { useState, useEffect } from "react";
import { getPolicy } from "../services/policyService";
import { getPolicyIcon } from "./admin/AdminPolicies";
import { FormattedPolicyText } from "../components/FormattedPolicyText";

const DEFAULT_PRIVACY = {
  title: "Privacy Policy",
  lastUpdated: "August 2026",
  sections: [
    {
      icon: "eye",
      title: "1. Information We Collect",
      content:
        "When you place an order or create an account with Barcode Restaurant Group, we collect details such as your name, phone number, email address, and delivery location to ensure a seamless food ordering experience.",
    },
    {
      icon: "file-text",
      title: "2. How We Use Your Data",
      content:
        "Your personal information is strictly used for order fulfillment, rider assignment, delivery status updates, and customer support. We do not sell or rent your personal data to any third-party marketing services.",
    },
    {
      icon: "lock",
      title: "3. Payment Security",
      content:
        "All digital transactions are processed securely through certified SSL payment gateways (bKash, Nagad, Cards, etc.). We do not store your credit card or PIN information on our servers.",
    },
    {
      icon: "mail",
      title: "4. Contact Us About Your Privacy",
      content:
        "If you have any questions or concerns about our privacy practices, please reach out to our team at info@barcoderestaurantgroup.com.",
    },
  ],
};

export const PrivacyPolicy = () => {
  const [data, setData] = useState(DEFAULT_PRIVACY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    getPolicy("privacy-policy")
      .then((res) => {
        if (res && res.sections && res.sections.length > 0) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error("Failed to load privacy policy from server:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 pt-5 pb-12 transition-colors duration-300">
      {/* 🎯 Global site-container ব্যবহার করা হয়েছে যা index.css থেকে অটোমেটিক ২xl, ৩xl, ৪xl স্ক্রিনে স্কেল হবে */}
      <div className="site-container space-y-4">
        {/* Compact Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-white">
            {data.title || "Privacy Policy"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Last updated: {data.lastUpdated || "August 2026"}
          </p>
        </div>

        {/* Content Card (Square / Rectangle rounded-none) */}
        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-none border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-6 text-sm sm:text-base leading-relaxed">
          {isLoading && !data.sections ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="space-y-2">
                  <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-none" />
                  <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-none" />
                  <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-none" />
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
                  <FormattedPolicyText content={section.content} />
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Settings,
  Upload,
  Save,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Share2,
  Globe,
  Link as LinkIcon,
  Image,
  AlertCircle,
  CreditCard,
  Truck,
  ArrowRight,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import NoticeTicker from "../../components/NoticeTicker";
import sslBanner from "../../assets/ssldynamic.jpg";

export const AdminSettings = () => {
  const { settings, isSettingsLoaded, updateSettings, resetSettings } =
    useSettings();

  // Branding & Footer Form states
  const [footerDescription, setFooterDescription] = useState(
    settings.footerDescription || ""
  );
  const [footerAddress, setFooterAddress] = useState(
    settings.footerAddress || ""
  );
  const [footerPhone, setFooterPhone] = useState(settings.footerPhone || "");
  const [footerEmail, setFooterEmail] = useState(settings.footerEmail || "");

  const [footerFacebook, setFooterFacebook] = useState(
    settings.footerFacebook || ""
  );
  const [footerInstagram, setFooterInstagram] = useState(
    settings.footerInstagram || ""
  );
  const [footerTwitter, setFooterTwitter] = useState(
    settings.footerTwitter || ""
  );

  const [logoLight, setLogoLight] = useState(settings.logoLight || "");
  const [logoDark, setLogoDark] = useState(settings.logoDark || "");
  const [paymentBanner, setPaymentBanner] = useState(
    settings.paymentBanner || ""
  );
  const [paymentBannerFit, setPaymentBannerFit] = useState(
    settings.paymentBannerFit || "contain"
  );

  // 📢 Maintenance / Announcement Ticker states
  const [maintenanceNoticeEnabled, setMaintenanceNoticeEnabled] = useState(
    settings.maintenanceNoticeEnabled !== undefined
      ? Boolean(settings.maintenanceNoticeEnabled)
      : true
  );
  const [maintenanceNoticeText, setMaintenanceNoticeText] = useState(
    settings.maintenanceNoticeText || ""
  );

  // UI States
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSettingsLoaded) return;
    setFooterDescription(settings.footerDescription || "");
    setFooterAddress(settings.footerAddress || "");
    setFooterPhone(settings.footerPhone || "");
    setFooterEmail(settings.footerEmail || "");
    setFooterFacebook(settings.footerFacebook || "");
    setFooterInstagram(settings.footerInstagram || "");
    setFooterTwitter(settings.footerTwitter || "");
    setLogoLight(settings.logoLight || "");
    setLogoDark(settings.logoDark || "");
    setPaymentBanner(settings.paymentBanner || "");
    setPaymentBannerFit(settings.paymentBannerFit || "contain");
    setMaintenanceNoticeEnabled(
      settings.maintenanceNoticeEnabled !== undefined
        ? Boolean(settings.maintenanceNoticeEnabled)
        : true
    );
    setMaintenanceNoticeText(settings.maintenanceNoticeText || "");
  }, [isSettingsLoaded, settings]);

  const handleLogoLightUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for the Light Theme logo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoLight(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDarkUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for the Dark Theme logo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoDark(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for the Payment Methods banner.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentBanner(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setSaving(true);

    try {
      const payload = {
        logoLight,
        logoDark,
        paymentBanner,
        paymentBannerFit,
        footerDescription: footerDescription.trim(),
        footerAddress: footerAddress.trim(),
        footerPhone: footerPhone.trim(),
        footerEmail: footerEmail.trim(),
        footerFacebook: footerFacebook.trim(),
        footerInstagram: footerInstagram.trim(),
        footerTwitter: footerTwitter.trim(),
        maintenanceNoticeEnabled: Boolean(maintenanceNoticeEnabled),
        maintenanceNoticeText: maintenanceNoticeText.trim(),
      };

      await updateSettings(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err?.message || "Failed to update website settings. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to restore default branding and footer settings?"
      )
    ) {
      return;
    }

    setSuccess(false);
    setError("");

    try {
      const defaults = await resetSettings();

      setFooterDescription(defaults.footerDescription);
      setFooterAddress(defaults.footerAddress);
      setFooterPhone(defaults.footerPhone);
      setFooterEmail(defaults.footerEmail);
      setFooterFacebook(defaults.footerFacebook || "");
      setFooterInstagram(defaults.footerInstagram || "");
      setFooterTwitter(defaults.footerTwitter || "");
      setLogoLight(defaults.logoLight || "");
      setLogoDark(defaults.logoDark || "");
      setPaymentBanner(defaults.paymentBanner || "");
      setPaymentBannerFit(defaults.paymentBannerFit || "contain");
      setMaintenanceNoticeEnabled(
        defaults.maintenanceNoticeEnabled !== undefined
          ? Boolean(defaults.maintenanceNoticeEnabled)
          : true
      );
      setMaintenanceNoticeText(defaults.maintenanceNoticeText || "");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.message || "Failed to reset settings. Please try again.");
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary-500" />
            Website Site Settings
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage brand logos, SSL payment gateway banners, live announcement tickers, footer contact info, and social networks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-250 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all self-start cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {/* 🚀 Quick Banner to Dedicated Free Delivery Page */}
      <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-amber-500/10 via-primary-500/10 to-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white">
                Free Delivery Campaign & Service Management
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase">
                {settings.freeDeliveryEnabled ? "🟢 Active" : "⚪ Inactive"}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Free delivery promotions, minimum order thresholds, dish exemptions, and announcement banners now have their own dedicated page.
            </p>
          </div>
        </div>

        <Link
          to="/admin/free-delivery"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          Manage Free Delivery <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>
            Website settings successfully saved and applied! Changes reflect instantly.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 📢 Global Announcement & Maintenance Ticker (TV / News Marquee) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-amber-500" />
                  Live Announcement & Maintenance Ticker (TV / Breaking News Bar)
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    maintenanceNoticeEnabled
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                      : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border border-neutral-500/20"
                  }`}
                >
                  {maintenanceNoticeEnabled ? "🟢 Visible on Home" : "⚪ Hidden / OFF"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Continuous right-to-left scrolling headline bar on the homepage. Control visibility and customize the notice message anytime.
              </p>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer select-none self-start sm:self-auto shrink-0">
              <input
                type="checkbox"
                checked={maintenanceNoticeEnabled}
                onChange={(e) => setMaintenanceNoticeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-amber-500"></div>
              <span className="ml-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {maintenanceNoticeEnabled ? "Active (ON)" : "Disabled (OFF)"}
              </span>
            </label>
          </div>

          {/* Notice Textarea */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Notice / Announcement Message
            </label>
            <textarea
              rows={3}
              value={maintenanceNoticeText}
              onChange={(e) => setMaintenanceNoticeText(e.target.value)}
              placeholder="e.g. ⚠️ Notice: Our displayed products are not for sale (uploaded strictly for experimental purposes)..."
              disabled={!maintenanceNoticeEnabled}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-xs disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-900 transition-all"
            />
            <p className="text-[11px] text-neutral-400">
              💡 Tip: Keep it informative and concise. It will automatically loop smoothly without gaps across all screen sizes.
            </p>
          </div>

          {/* Live Preview Container */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Live Preview (What visitors will see)
              </span>
              {maintenanceNoticeEnabled && (
                <span className="text-[10px] text-neutral-400">Hover over preview to pause</span>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950">
              {maintenanceNoticeEnabled && maintenanceNoticeText.trim() ? (
                <NoticeTicker
                  isPreview={true}
                  previewEnabled={maintenanceNoticeEnabled}
                  previewText={maintenanceNoticeText}
                />
              ) : (
                <div className="py-4 text-center text-xs text-neutral-400 italic">
                  Notice bar is currently turned off or empty. No ticker will appear on the homepage.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1. Logos customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Image className="w-4 h-4 text-primary-500" />
            Website Branding Logos
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload custom image logos for the navbar. The dark logo renders in
            light mode, and the light logo renders in dark mode.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Light Logo (used in light mode) */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Light Mode Logo (Dark Logo png)
              </label>

              <div className="flex items-center gap-4">
                <div className="h-16 w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-xl flex items-center justify-center p-2 shrink-0">
                  {logoLight ? (
                    <img
                      src={logoLight}
                      alt="Light logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      Default Logo
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Light Mode Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoLightUpload}
                      className="hidden"
                    />
                  </label>
                  {logoLight && (
                    <button
                      type="button"
                      onClick={() => setLogoLight("")}
                      className="block text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      Remove custom logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dark Logo (used in dark mode) */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Dark Mode Logo (White Logo png)
              </label>

              <div className="flex items-center gap-4">
                <div className="h-16 w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-900 rounded-xl flex items-center justify-center p-2 shrink-0">
                  {logoDark ? (
                    <img
                      src={logoDark}
                      alt="Dark logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      Default Logo
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Dark Mode Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoDarkUpload}
                      className="hidden"
                    />
                  </label>
                  {logoDark && (
                    <button
                      type="button"
                      onClick={() => setLogoDark("")}
                      className="block text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      Remove custom logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Payment Methods Banner Customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary-500" />
            Payment Gateway & SSL Banner
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload a custom payment security/gateway banner displayed in the
            footer or checkout trust areas.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-20 w-full sm:w-64 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-xl flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-xs">
                <img
                  src={paymentBanner || sslBanner}
                  alt="Payment banner preview"
                  className={`w-full h-full ${
                    paymentBannerFit === "cover"
                      ? "object-cover"
                      : "object-contain"
                  }`}
                />
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Payment Banner Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentBannerUpload}
                    className="hidden"
                  />
                </label>
                {paymentBanner && (
                  <button
                    type="button"
                    onClick={() => setPaymentBanner("")}
                    className="block text-[11px] text-red-500 hover:underline cursor-pointer"
                  >
                    Remove custom payment banner
                  </button>
                )}
                {!paymentBanner && (
                  <p className="text-[11px] text-neutral-400">
                    Using default SSL / Gateway banner
                  </p>
                )}
              </div>
            </div>

            {/* Fit Mode (Contain vs Cover) Options */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/70">
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-2">
                Image Display Fit (ইমেজ ডিসপ্লে ফিট)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <button
                  type="button"
                  onClick={() => setPaymentBannerFit("contain")}
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentBannerFit !== "cover"
                      ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-neutral-900 dark:text-white ring-1 ring-primary-500/30"
                      : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      paymentBannerFit !== "cover"
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    {paymentBannerFit !== "cover" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Contain (পুরো ছবি দেখাবে)
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      ছবি কোনো দিক দিয়ে কাটবে না, পুরো ব্যানারটি ফ্রেমের ভেতর ফিট থাকবে। (Default)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentBannerFit("cover")}
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentBannerFit === "cover"
                      ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-neutral-900 dark:text-white ring-1 ring-primary-500/30"
                      : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      paymentBannerFit === "cover"
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    {paymentBannerFit === "cover" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Cover (বক্স পূরণ করবে)
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      পুরো বক্স পূর্ণ করে দেখাবে, কোনো খালি সাদা জায়গা থাকবে না।
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Footer & Contact Customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-500" />
            Footer Brand & Contact Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Brand Summary Description
              </label>
              <textarea
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-primary-500 text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />{" "}
                  Head Office Address
                </label>
                <textarea
                  value={footerAddress}
                  onChange={(e) => setFooterAddress(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-primary-500 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-primary-500 shrink-0" />{" "}
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={footerPhone}
                  onChange={(e) => setFooterPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-primary-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary-500 shrink-0" />{" "}
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-primary-500 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Social connections customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-primary-500" />
            Social Media Connections
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />{" "}
                Facebook Page Link
              </label>
              <input
                type="url"
                value={footerFacebook}
                onChange={(e) => setFooterFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-primary-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-pink-500 shrink-0" />{" "}
                Instagram Handle
              </label>
              <input
                type="url"
                value={footerInstagram}
                onChange={(e) => setFooterInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-primary-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />{" "}
                Twitter/X Profile
              </label>
              <input
                type="url"
                value={footerTwitter}
                onChange={(e) => setFooterTwitter(e.target.value)}
                placeholder="https://twitter.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-primary-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/10 active:scale-95 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Site Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
import { useState } from "react";
import { motion } from "framer-motion";
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
  CreditCard, // Added an icon for the payment method
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

export const AdminSettings = () => {
  const { settings, updateSettings, resetSettings } = useSettings();

  // Form states
  const [footerDescription, setFooterDescription] = useState(
    settings.footerDescription,
  );
  const [footerAddress, setFooterAddress] = useState(settings.footerAddress);
  const [footerPhone, setFooterPhone] = useState(settings.footerPhone);
  const [footerEmail, setFooterEmail] = useState(settings.footerEmail);

  const [footerFacebook, setFooterFacebook] = useState(
    settings.footerFacebook || "",
  );
  const [footerInstagram, setFooterInstagram] = useState(
    settings.footerInstagram || "",
  );
  const [footerTwitter, setFooterTwitter] = useState(
    settings.footerTwitter || "",
  );

  const [logoLight, setLogoLight] = useState(settings.logoLight || "");
  const [logoDark, setLogoDark] = useState(settings.logoDark || "");

  // New state for the payment banner
  const [paymentBanner, setPaymentBanner] = useState(
    settings.paymentBanner || "",
  );

  // UI States
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleLogoLightUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for the Light Theme logo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoLight(reader.result); // Base64 image
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
        setLogoDark(reader.result); // Base64 image
      };
      reader.readAsDataURL(file);
    }
  };

  // Payment banner upload handler
  const handlePaymentBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file for the Payment Methods banner.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentBanner(reader.result); // Base64 image
      };
      reader.readAsDataURL(file);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setSaving(true);

    try {
      const payload = {
        logoLight,
        logoDark,
        paymentBanner, //added to payload
        footerDescription: footerDescription.trim(),
        footerAddress: footerAddress.trim(),
        footerPhone: footerPhone.trim(),
        footerEmail: footerEmail.trim(),
        footerFacebook: footerFacebook.trim(),
        footerInstagram: footerInstagram.trim(),
        footerTwitter: footerTwitter.trim(),
      };

      // await the API — only show success when the server actually persisted it.
      await updateSettings(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err?.message ||
          "Failed to update website settings. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to restore default settings? This will revert logos and footer text.",
      )
    ) {
      return;
    }

    setSuccess(false);
    setError("");

    try {
      // resetSettings is async — await the resolved settings object before
      // syncing the form inputs (otherwise we'd assign fields off a Promise).
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

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err?.message || "Failed to reset settings. Please try again.",
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary-500" />
            Website Site Settings
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Customize branding logos, footer addresses, social networks, and
            other general configurations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-250 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all self-start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>
            Website settings successfully saved and applied! Changes reflect
            instantly.
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
        {/* Logos customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Image className="w-4 h-4 text-primary-500" />
            Website Branding Logos
          </h3>
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
                    <span className="text-[10px] text-neutral-400 italic">
                      Default Logo
                    </span>
                  )}
                </div>

                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer transition-colors text-xs font-bold">
                  <Upload className="w-4 h-4" />
                  Select File
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
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear Custom
                  </button>
                )}
              </div>
            </div>

            {/* Dark Logo (used in dark mode) */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Dark Mode Logo (Light Logo png)
              </label>

              <div className="flex items-center gap-4">
                <div className="h-16 w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-950 dark:bg-neutral-950 rounded-xl flex items-center justify-center p-2 shrink-0">
                  {logoDark ? (
                    <img
                      src={logoDark}
                      alt="Dark logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-neutral-500 italic">
                      Default Logo
                    </span>
                  )}
                </div>

                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer transition-colors text-xs font-bold">
                  <Upload className="w-4 h-4" />
                  Select File
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
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear Custom
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Newly added payment method banner upload section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary-500" />
            Footer Payment Methods Banner
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload the payment partner logo channels banner (e.g., SSLCOMMERZ
            banner) to display in the website footer.
          </p>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Payment Gateway Channels Banner Image
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-80 h-20 border border-neutral-200 dark:border-neutral-800 bg-white rounded-xl flex items-center justify-center p-2 shrink-0 shadow-sm">
                {paymentBanner ? (
                  <img
                    src={paymentBanner}
                    alt="Payment banner preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-neutral-400 italic">
                    Default/No Banner
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer transition-colors text-xs font-bold">
                  <Upload className="w-4 h-4" />
                  Select Image
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
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear Custom
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-500" />
            Footer Description & Contacts
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Footer Brand Description
              </label>
              <textarea
                rows="3"
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                placeholder="Experience the art of modern dining at Barcode..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-500" /> Head
                  Office Address
                </label>
                <input
                  type="text"
                  value={footerAddress}
                  onChange={(e) => setFooterAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-primary-500" /> Contact
                  Phone
                </label>
                <input
                  type="text"
                  value={footerPhone}
                  onChange={(e) => setFooterPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary-500" /> Customer
                  Support Email
                </label>
                <input
                  type="email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social connections customization */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-primary-500" />
            Social Media Connections
          </h3>

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
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/10 active:scale-95 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
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

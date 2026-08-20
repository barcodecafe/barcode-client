import { useState, useEffect } from "react";
import { Link, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BrandProvider } from "../context/BrandContext";
import { getBrandBySlug } from "../services/brandsService";
import { ScrollToTop } from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { NoticeTicker } from "../components/NoticeTicker";
import { FreeDeliveryBanner } from "../components/FreeDeliveryBanner";
import { Footer } from "../components/Footer";
import { CartDrawer } from "../components/CartDrawer";

export const BrandLayout = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else if (user?.role === 'rider') {
      navigate('/rider', { replace: true });
    }
  }, [isAdmin, user, navigate]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getBrandBySlug(slug)
      .then((b) => (b ? setBrand(b) : setNotFound(true)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-950 px-4 text-center">
        <Building2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
        <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white">Brand not found</h1>
        <Link to="/brands" className="text-primary-500 font-semibold text-sm hover:underline">
          ← Back to all brands
        </Link>
      </div>
    );
  }

  return (
    <BrandProvider brand={brand}>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
        {/* Sleek Brand-themed Top Utility Bar with Back to Main Site */}
        <div className="bg-neutral-100/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-300 text-[11px] font-medium border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors duration-300">
          <div className="site-container py-1.5 flex items-center justify-between gap-3">
            <span className="truncate flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 animate-pulse" />
              Part of <strong className="text-neutral-900 dark:text-white font-bold">{brand.name}</strong> • Barcode Restaurant Group
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 shrink-0 font-semibold text-neutral-700 dark:text-neutral-200 hover:text-primary-500 dark:hover:text-primary-500 transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Site
            </Link>
          </div>
        </div>

        {/* Unified Navbar (Dynamic Brand Logo & Brand Links) */}
        <Navbar />

        {/* Global Announcement Notice Ticker */}
        <NoticeTicker />

        {/* Global Free Delivery Banner */}
        <FreeDeliveryBanner />

        {/* Page Content */}
        <main className="flex-grow w-full" key={location.pathname}>
          <Outlet />
        </main>

        {/* Unified Footer (Dynamic Brand Logo & Brand Contact Fallbacks) */}
        <Footer />

        {/* Global Cart Drawer */}
        <CartDrawer />
      </div>
    </BrandProvider>
  );
};

export default BrandLayout;

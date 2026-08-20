import { useState, useEffect } from "react";
import { Link, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
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

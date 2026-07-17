import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useParams, useLocation } from "react-router-dom";
import { Sun, Moon, Grid3x3, Building2, Phone, Mail, Globe, ArrowUpRight } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { BrandProvider } from "../context/BrandContext";
import { getBrandBySlug } from "../services/brandsService";
import { ScrollToTop } from "../components/ScrollToTop";

// Themed shell for a single brand's microsite (/brands/:slug/*): the brand's own
// logo, name and info in the nav + footer, but the same structure as the group
// site. "All Brands" and the group link let the customer step back out.
export const BrandLayout = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
        <Link to="/brands" className="text-primary-500 font-semibold text-sm hover:underline">← Back to all brands</Link>
      </div>
    );
  }

  const logo = theme === "dark" ? brand.logoDark || brand.logoLight : brand.logoLight || brand.logoDark;
  const base = `/brands/${brand.slug}`;
  const navLinks = [
    { name: "Home", to: base, end: true },
    { name: "Menu", to: `${base}/menu`, end: false },
  ];

  return (
    <BrandProvider brand={brand}>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100">
        {/* Brand-themed top bar */}
        <div className="bg-primary-500 text-white text-[11px] font-medium">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3">
            <span className="truncate">Part of the Barcode Restaurant Group</span>
            <Link to="/brands" className="inline-flex items-center gap-1 shrink-0 hover:underline font-semibold">
              <Grid3x3 className="w-3 h-3" /> All Brands
            </Link>
          </div>
        </div>

        {/* Brand navbar */}
        <header className="sticky top-0 z-40 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <Link to={base} className="flex items-center gap-2.5 min-w-0">
              {logo ? (
                <img src={logo} alt={brand.name} className="h-9 w-auto max-w-[150px] object-contain" />
              ) : (
                <span className="font-display text-lg font-extrabold tracking-tight text-neutral-800 dark:text-white truncate">
                  {brand.name}
                </span>
              )}
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive ? "text-primary-500 bg-primary-500/10" : "text-neutral-600 dark:text-neutral-300 hover:text-primary-500"
                    }`
                  }
                >
                  {l.name}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/" className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500">
                Barcode Group <ArrowUpRight className="w-3 h-3" />
              </Link>
              <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-primary-500">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* mobile nav */}
          <div className="sm:hidden border-t border-neutral-100 dark:border-neutral-800 flex">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex-1 text-center py-2.5 text-xs font-semibold ${isActive ? "text-primary-500 border-b-2 border-primary-500" : "text-neutral-500"}`
                }
              >
                {l.name}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="flex-1" key={location.pathname}>
          <Outlet />
        </main>

        {/* Brand-themed footer */}
        <footer className="border-t border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row justify-between gap-8">
              <div className="max-w-sm">
                {logo ? (
                  <img src={logo} alt={brand.name} className="h-9 w-auto object-contain mb-3" />
                ) : (
                  <h3 className="font-display text-lg font-extrabold text-neutral-800 dark:text-white mb-2">{brand.name}</h3>
                )}
                {brand.tagline && <p className="text-sm text-neutral-500 dark:text-neutral-400">{brand.tagline}</p>}
                <div className="flex items-center gap-4 mt-4 text-xs font-semibold">
                  {brand.facebook && <a href={brand.facebook} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-primary-500">Facebook</a>}
                  {brand.instagram && <a href={brand.instagram} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-primary-500">Instagram</a>}
                </div>
              </div>
              <div className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                {brand.contactPhone && <a href={`tel:${brand.contactPhone}`} className="flex items-center gap-2 hover:text-primary-500"><Phone className="w-3.5 h-3.5" /> {brand.contactPhone}</a>}
                {brand.contactEmail && <a href={`mailto:${brand.contactEmail}`} className="flex items-center gap-2 hover:text-primary-500"><Mail className="w-3.5 h-3.5" /> {brand.contactEmail}</a>}
                {brand.website && <a href={brand.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary-500"><Globe className="w-3.5 h-3.5" /> Website</a>}
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
              <span>© {brand.name}. Part of Barcode Restaurant Group.</span>
              <Link to="/brands" className="hover:text-primary-500 font-semibold">Explore all brands →</Link>
            </div>
          </div>
        </footer>
      </div>
    </BrandProvider>
  );
};

export default BrandLayout;

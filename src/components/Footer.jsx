import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, Flame, Bike, Wallet, Clock, BadgeCheck, ArrowRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';
import barB from '../assets/Barcode_cafe_B.png'
import barW from '../assets/Barcode_cafe_W.png'
import resB from '../assets/Barcode_restaurant_group-B.png'
import resW from '../assets/Barcode_restaurant_groupW.png'

export const Footer = () => {
  const currentYear = new Date().getFullYear();
   const { theme, toggleTheme } = useTheme();
   const location = useLocation();
   const { settings } = useSettings();

  const socialLinks = [
    {
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
        </svg>
      ),
      href: settings.footerFacebook || 'https://facebook.com',
      label: 'Facebook'
    },
    {
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      href: settings.footerInstagram || 'https://instagram.com',
      label: 'Instagram'
    },
    {
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      href: settings.footerTwitter || 'https://twitter.com',
      label: 'Twitter'
    },
  ];

  return (
    <footer className="bg-neutral-900 text-neutral-400 border-t border-neutral-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10">
          {/* 1 — Brand */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <Link to="/" className="w-fit">
              <div className="h-12 w-fit flex items-center rounded-xl px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md transition-transform duration-300 hover:scale-[1.02]">
                <img
                  src={theme === "dark" ? (settings.logoDark || resW) : (settings.logoLight || resB)}
                  alt="Barcode Cafe"
                  className="h-9 w-auto"
                />
              </div>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              {settings.footerDescription}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-primary-500 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* 2 — Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-5">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  onClick={() => {
                    if (location.pathname === '/') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="text-sm inline-block hover:text-primary-500 hover:translate-x-0.5 transition-all duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link to="/branches" className="text-sm inline-block hover:text-primary-500 hover:translate-x-0.5 transition-all duration-200">
                  Our Branches
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-sm inline-block hover:text-primary-500 hover:translate-x-0.5 transition-all duration-200">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm inline-block hover:text-primary-500 hover:translate-x-0.5 transition-all duration-200">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* 3 — Become a Rider (middle, highlighted) */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-5">Become a Rider</h3>
            <div className="relative overflow-hidden rounded-2xl border border-primary-500/25 bg-gradient-to-br from-primary-500/12 to-transparent p-4">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary-500/15 blur-3xl rounded-full pointer-events-none" />
              <div className="relative flex flex-col gap-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-primary-500/25">
                    <Bike className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Deliver with Barcode and earn on your own flexible schedule.
                  </p>
                </div>
                <ul className="flex flex-col gap-1.5">
                  <li className="flex items-center gap-2 text-xs text-neutral-400">
                    <Wallet className="w-3.5 h-3.5 text-primary-500 shrink-0" /> Weekly payouts
                  </li>
                  <li className="flex items-center gap-2 text-xs text-neutral-400">
                    <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" /> Flexible hours
                  </li>
                  <li className="flex items-center gap-2 text-xs text-neutral-400">
                    <BadgeCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" /> Quick sign-up
                  </li>
                </ul>
                <Link
                  to="/rider-application"
                  className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all duration-300"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4 — Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-5">Contact Info</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3 items-start">
                <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{settings.footerAddress}</span>
              </li>
              <li className="flex gap-3 items-center">
                <Phone className="w-5 h-5 text-primary-500 shrink-0" />
                <a
                  href={`tel:${String(settings.footerPhone || '').replace(/[^\d+]/g, '')}`}
                  className="hover:text-primary-500 transition-colors"
                >
                  {settings.footerPhone}
                </a>
              </li>
              <li className="flex gap-3 items-center">
                <Mail className="w-5 h-5 text-primary-500 shrink-0" />
                <a
                  href={`mailto:${settings.footerEmail || ''}`}
                  className="hover:text-primary-500 transition-colors break-all"
                >
                  {settings.footerEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-neutral-800 mt-12 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>© {currentYear} Barcode Restaurant. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary-500 transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;

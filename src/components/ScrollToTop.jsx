import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ---------------------------------------------------------------------------
// ScrollToTop.jsx
//
// Renders nothing — its only job is to scroll the window to the top
// whenever the route's pathname changes. Mounted once near the top of the
// router tree (inside <Routes>'s parent, alongside <CartProvider> etc.) so
// it covers EVERY navigation in the app, not just Footer's Quick Links:
// Navbar links, Branches → BranchDetail, search result clicks, etc. all get
// the same "land at the top of the new page" behavior automatically.
// ---------------------------------------------------------------------------
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Collapses duplicate slashes in the URL path.
 *
 * React Router matches paths literally, so `/order-tracking//<id>` matches no
 * route and renders nothing — a completely blank page. That happened to a real
 * customer immediately after a successful payment: the money was taken, the
 * order was settled, and all they saw was white. A blank screen is the worst
 * possible failure here, because there is no way to tell it apart from the site
 * being broken.
 *
 * A stray slash can come from anywhere upstream — a trailing slash on a
 * configured base URL, a payment gateway echoing a URL back, a hand-edited link.
 * Rather than chase each source, normalise on arrival and let the route match.
 *
 * `replace` keeps the malformed URL out of history, so Back doesn't return to it.
 */
export const NormalizePath = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!pathname.includes("//")) return;
    const clean = pathname.replace(/\/{2,}/g, "/");
    navigate(`${clean}${search}${hash}`, { replace: true });
  }, [pathname, search, hash, navigate]);

  return null;
};

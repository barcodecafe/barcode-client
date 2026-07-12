import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// ---------------------------------------------------------------------------
// LeafletMap.jsx — a small OpenStreetMap wrapper (no API key, no billing).
//
// Two modes:
//   • view (default) — shows an interactive map with a marker at [lat,lng].
//   • picker (picker=true) — clicking the map calls onPick(lat, lng), so the
//     admin can drop a pin to set a branch's coordinates.
//
// Uses plain Leaflet (not react-leaflet) so it works on any React version and
// avoids peer-dependency issues.
// ---------------------------------------------------------------------------

// Bundlers (Vite) break Leaflet's default marker image paths — wire them up
// explicitly from the imported asset URLs.
const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Chattogram city center — a sensible default when a branch has no coords yet.
const DEFAULT_CENTER = [22.3569, 91.7832];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export default function LeafletMap({
  lat,
  lng,
  zoom = 15,
  interactive = true,
  picker = false,
  onPick,
  className = 'h-64 w-full',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick; // always call the latest handler (avoids stale closure)

  const hasCoords = isNum(Number(lat)) && isNum(Number(lng)) && !(Number(lat) === 0 && Number(lng) === 0);
  const center = hasCoords ? [Number(lat), Number(lng)] : DEFAULT_CENTER;

  // Init the map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: hasCoords ? zoom : 12,
      scrollWheelZoom: false, // never hijack page/modal scroll
      dragging: interactive,
      zoomControl: interactive,
      doubleClickZoom: interactive,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    if (hasCoords) {
      markerRef.current = L.marker(center, { icon: DefaultIcon }).addTo(map);
    }

    if (picker) {
      map.on('click', (e) => {
        const la = Number(e.latlng.lat.toFixed(6));
        const ln = Number(e.latlng.lng.toFixed(6));
        if (markerRef.current) markerRef.current.setLatLng([la, ln]);
        else markerRef.current = L.marker([la, ln], { icon: DefaultIcon }).addTo(map);
        onPickRef.current?.(la, ln);
      });
    }

    mapRef.current = map;

    // Leaflet needs a sized container; recalc after mount and on any resize
    // (important inside modals / animated panels that start at 0 height).
    const invalidate = () => map.invalidateSize();
    const t = setTimeout(invalidate, 250);
    const ro = new ResizeObserver(invalidate);
    ro.observe(containerRef.current);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker + view in sync when coords change from the outside.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasCoords) return;
    map.setView(center, map.getZoom() < 13 ? zoom : map.getZoom());
    if (markerRef.current) markerRef.current.setLatLng(center);
    else markerRef.current = L.marker(center, { icon: DefaultIcon }).addTo(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return <div ref={containerRef} className={`${className} rounded-2xl overflow-hidden z-0`} />;
}

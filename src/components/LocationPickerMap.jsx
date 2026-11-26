import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function LocationPickerMap({ latitude, longitude, onSelectLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = Number.isFinite(latitude) ? latitude : 12.9716;
    const initialLng = Number.isFinite(longitude) ? longitude : 77.5946;

    const map = L.map(containerRef.current).setView([initialLat, initialLng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.circleMarker([initialLat, initialLng], {
      radius: 10,
      color: '#0f172a',
      weight: 3,
      fillColor: '#f59e0b',
      fillOpacity: 0.95,
    }).addTo(map);

    map.on('click', (e) => {
      onSelectLocation(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6))
      );
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.panTo([latitude, longitude]);
  }, [latitude, longitude]);

  return (
    <div>
      <div ref={containerRef} className="mini-leaflet-box" />
      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Click anywhere on the map to adjust the exact road-damage pin.
      </p>
    </div>
  );
}

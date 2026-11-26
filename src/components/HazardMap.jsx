import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getDamageMeta } from '../constants/damageTypes';

function getPrimaryDamage(report) {
  const confirmed = (report.detections || []).filter(
    (d) => d.verification_status !== 'rejected'
  );
  return confirmed[0] || (report.detections || [])[0] || null;
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Modular Leaflet + OpenStreetMap component.
// Member 4 can swap or extend this with PostGIS cluster layers later.
export default function HazardMap({ reports = [], selectedReportId = null, onSelectReport }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const markerByIdRef = useRef({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([12.96, 77.61], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    markerByIdRef.current = {};

    const bounds = [];

    reports.forEach((report) => {
      if (!Number.isFinite(report.latitude) || !Number.isFinite(report.longitude)) return;

      const primary = getPrimaryDamage(report);
      const meta = getDamageMeta(primary?.class_code);
      const isSelected = report.id === selectedReportId;

      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius: isSelected ? 12 : 9,
        color: '#0f172a',
        weight: isSelected ? 3 : 2,
        fillColor: meta.color,
        fillOpacity: 0.92,
      });

      const tagsHtml = (report.detections || [])
        .filter((d) => d.verification_status !== 'rejected')
        .map((d) => {
          const dMeta = getDamageMeta(d.class_code);
          return `<span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;background:${dMeta.color};color:#fff;margin-right:4px;">${escapeHtml(
            d.class_code
          )} (${Math.round((d.confidence || 0) * 100)}%)</span>`;
        })
        .join('');

      const dupNotice = report.is_potential_duplicate
        ? `<div style="margin-top:6px;font-size:11px;color:#92400e;background:#fef3c7;padding:3px 6px;border-radius:4px;">Possible duplicate of ${escapeHtml(
            report.duplicate_of_id || 'nearby report'
          )}</div>`
        : '';

      marker.bindPopup(`
        <div style="min-width:210px;font-family:Inter,sans-serif;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${escapeHtml(
            report.id
          )} · ${escapeHtml(report.address_label || 'Road Location')}</div>
          <div style="margin-bottom:6px;">${tagsHtml || 'No confirmed classes'}</div>
          ${
            report.notes
              ? `<p style="margin:0 0 6px;font-size:12px;color:#475569;">${escapeHtml(
                  report.notes
                )}</p>`
              : ''
          }
          <div style="font-size:11px;color:#64748b;font-family:monospace;">
            ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}
          </div>
          ${dupNotice}
        </div>
      `);

      marker.on('click', () => {
        if (onSelectReport) onSelectReport(report.id);
      });

      marker.addTo(layerGroup);
      markerByIdRef.current[report.id] = marker;
      bounds.push([report.latitude, report.longitude]);
    });

    if (bounds.length > 0 && !selectedReportId) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    }
  }, [reports, selectedReportId, onSelectReport]);

  useEffect(() => {
    if (!selectedReportId || !mapRef.current) return;
    const marker = markerByIdRef.current[selectedReportId];
    if (marker) {
      mapRef.current.setView(marker.getLatLng(), 16, { animate: true });
      marker.openPopup();
    }
  }, [selectedReportId]);

  return <div ref={containerRef} className="leaflet-box" />;
}

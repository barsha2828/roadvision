import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Eye, MapPin, Trash2, X } from 'lucide-react';
import DetectionOverlay from './DetectionOverlay';
import { getDamageMeta } from '../constants/damageTypes';

export default function ReportDetailModal({ report, onClose, onDelete }) {
  const [showRejected, setShowRejected] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    if (!report) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [report, onClose]);

  if (!report) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Report details for ${report.id}`}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {report.id}
              </span>
              {report.is_potential_duplicate && (
                <span className="badge badge-dup">
                  <AlertTriangle size={12} /> Duplicate of {report.duplicate_of_id}
                </span>
              )}
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.25rem' }}>
              {report.address_label || 'Road Inspection Point'}
            </h2>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close report modal"
          >
            <X size={16} />
          </button>
        </div>

        <DetectionOverlay
          imageSrc={report.image_url}
          detections={report.detections || []}
          highlightedId={highlightedId}
          showRejected={showRejected}
          onHoverDetection={setHighlightedId}
        />

        <div className="overlay-controls" style={{ marginBottom: 16 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showRejected}
              onChange={(e) => setShowRejected(e.target.checked)}
            />
            <Eye size={15} />
            <span>Show rejected boxes</span>
          </label>
          <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
          </span>
        </div>

        {report.notes && (
          <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            {report.notes}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {(report.detections || []).map((det) => {
            const meta = getDamageMeta(det.class_code);
            const rejected = det.verification_status === 'rejected';
            return (
              <span
                key={det.id}
                className="class-code-badge"
                onMouseEnter={() => setHighlightedId(det.id)}
                onMouseLeave={() => setHighlightedId(null)}
                style={{
                  background: meta.bgTint,
                  color: meta.color,
                  cursor: 'pointer',
                  textDecoration: rejected ? 'line-through' : 'none',
                  opacity: rejected ? 0.55 : 1,
                }}
              >
                {det.class_code} · {det.class_name || meta.name} ({Math.round(det.confidence * 100)}%)
              </span>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <Clock size={14} />
            {new Date(report.created_at).toLocaleString()}
          </span>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {onDelete && (
              <button
                type="button"
                className="btn btn-danger-outline btn-sm"
                onClick={() => onDelete(report.id)}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            )}
            <Link to={`/map?report=${encodeURIComponent(report.id)}`} className="btn btn-primary btn-sm">
              <MapPin size={15} />
              <span>Locate on Map</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

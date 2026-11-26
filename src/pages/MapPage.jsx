import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, Eye, MapPin } from 'lucide-react';
import HazardMap from '../components/HazardMap';
import ReportDetailModal from '../components/ReportDetailModal';
import { DAMAGE_CLASS_LIST, getDamageMeta } from '../constants/damageTypes';
import { fetchReports } from '../services/api';

export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClass = searchParams.get('class') || 'ALL';
  const initialReport = searchParams.get('report') || null;

  const [reports, setReports] = useState([]);
  const [classFilter, setClassFilter] = useState(initialClass);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(initialReport);
  const [modalReport, setModalReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchReports({ classCode: classFilter, status: statusFilter })
      .then((data) => {
        if (active) setReports(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [classFilter, statusFilter]);

  function handleSelectClassChip(code) {
    setSelectedId(null);
    setClassFilter(code);
    const next = new URLSearchParams(searchParams);
    if (code === 'ALL') next.delete('class');
    else next.set('class', code);
    setSearchParams(next, { replace: true });
  }

  const selectedReport = reports.find((r) => r.id === selectedId) || null;

  return (
    <div>
      <div className="section-header" style={{ marginTop: 4 }}>
        <div>
          <h2>Interactive Hazard Map</h2>
          <p>Explore verified road-damage reports on OpenStreetMap via Leaflet.</p>
        </div>
        <Link to="/report" className="btn btn-primary btn-sm">
          <Camera size={16} />
          <span>Report New Damage</span>
        </Link>
      </div>

      <div className="toolbar card card-pad" style={{ padding: '14px 18px' }}>
        <div className="chip-row">
          <button
            type="button"
            className={`filter-chip ${classFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => handleSelectClassChip('ALL')}
          >
            All Classes
          </button>
          {DAMAGE_CLASS_LIST.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`filter-chip ${classFilter === c.code ? 'active' : ''}`}
              onClick={() => handleSelectClassChip(c.code)}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: c.color,
                  display: 'inline-block',
                }}
              />
              <span>
                {c.code} · {c.shortName}
              </span>
            </button>
          ))}
        </div>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => {
            setSelectedId(null);
            setStatusFilter(e.target.value);
          }}
          aria-label="Filter by verification status"
        >
          <option value="ALL">All Statuses</option>
          <option value="verified">Verified Only</option>
          <option value="partially_rejected">Partially Verified</option>
        </select>
      </div>

      <div className="map-layout">
        <div className="map-sidebar">
          {selectedReport && (
            <div className="card card-pad" style={{ padding: 14, borderColor: 'var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Selected: {selectedReport.id}
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setModalReport(selectedReport)}
                >
                  <Eye size={14} />
                  <span>Inspect Boxes</span>
                </button>
              </div>
              <img
                src={selectedReport.image_url}
                alt={selectedReport.address_label}
                style={{
                  width: '100%',
                  height: 115,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              />
            </div>
          )}

          {loading ? (
            <div className="card card-pad">Loading mapped reports...</div>
          ) : reports.length === 0 ? (
            <div className="card card-pad">No reports match the selected filters.</div>
          ) : (
            reports.map((report) => {
              const confirmed = (report.detections || []).filter(
                (d) => d.verification_status !== 'rejected'
              );
              return (
                <div
                  key={report.id}
                  className={`map-report-card ${selectedId === report.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(report.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedId(report.id);
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <strong className="mono" style={{ fontSize: '0.84rem' }}>
                      {report.id}
                    </strong>
                    {report.is_potential_duplicate && (
                      <span className="badge badge-dup">Duplicate</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                    {report.address_label || 'Road Location'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {confirmed.map((d) => {
                      const meta = getDamageMeta(d.class_code);
                      return (
                        <span
                          key={d.id}
                          className="class-code-badge"
                          style={{ background: meta.bgTint, color: meta.color, fontSize: '0.72rem' }}
                        >
                          {d.class_code} · {Math.round(d.confidence * 100)}%
                        </span>
                      );
                    })}
                  </div>
                  <div
                    className="mono"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <MapPin size={12} />
                    <span>
                      {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <HazardMap
          reports={reports}
          selectedReportId={selectedId}
          onSelectReport={(id) => setSelectedId(id)}
        />
      </div>

      <ReportDetailModal report={modalReport} onClose={() => setModalReport(null)} />
    </div>
  );
}

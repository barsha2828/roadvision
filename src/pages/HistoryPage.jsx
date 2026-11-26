import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Clock, Eye, MapPin, RotateCcw, Search } from 'lucide-react';
import ReportDetailModal from '../components/ReportDetailModal';
import { DAMAGE_CLASS_LIST, getDamageMeta } from '../constants/damageTypes';
import { deleteReport, fetchReports, isMockMode, resetMockReports } from '../services/api';

function StatusBadge({ status }) {
  if (status === 'verified') {
    return <span className="badge badge-verified">Verified</span>;
  }
  if (status === 'partially_rejected') {
    return <span className="badge badge-partial">Partially Verified</span>;
  }
  return <span className="badge badge-rejected">Rejected</span>;
}

function getPeakConfidence(report) {
  const scores = (report.detections || []).map((d) => d.confidence || 0);
  return scores.length ? Math.max(...scores) : 0;
}

export default function HistoryPage() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReports({ classCode: classFilter })
      .then((data) => setReports(data))
      .finally(() => setLoading(false));
  }, [classFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = !q
      ? reports
      : reports.filter(
          (r) =>
            r.id.toLowerCase().includes(q) ||
            (r.address_label || '').toLowerCase().includes(q) ||
            (r.notes || '').toLowerCase().includes(q)
        );

    return [...matched].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortBy === 'confidence') {
        return getPeakConfidence(b) - getPeakConfidence(a);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [reports, search, sortBy]);

  function handleResetSamples() {
    const reset = resetMockReports();
    setReports(reset);
    setClassFilter('ALL');
    setSearch('');
  }

  async function handleDelete(reportId) {
    const updated = await deleteReport(reportId);
    setReports(updated);
    setSelectedReport(null);
  }

  return (
    <div>
      <div className="section-header" style={{ marginTop: 4 }}>
        <div>
          <h2>Report History</h2>
          <p>Click any report card to inspect bounding boxes, GPS coordinates, and verification details.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isMockMode() && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetSamples}>
              <RotateCcw size={15} />
              <span>Reset Sample Data</span>
            </button>
          )}
          <Link to="/report" className="btn btn-primary btn-sm">
            <Camera size={16} />
            <span>New Report</span>
          </Link>
        </div>
      </div>

      <div className="toolbar card card-pad" style={{ padding: '14px 18px' }}>
        <div className="filter-group" style={{ flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 230, flex: '1 1 250px', maxWidth: 360 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 34 }}
              placeholder="Search by ID, location, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label="Filter report history by damage class"
          >
            <option value="ALL">All Damage Classes</option>
            {DAMAGE_CLASS_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort reports"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="confidence">Highest Confidence</option>
          </select>
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Showing {filtered.length} report{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div className="card card-pad">Loading report history...</div>
      ) : filtered.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)' }}>
            No reports found for this filter.
          </p>
          <Link to="/report" className="btn btn-primary btn-sm">
            Create First Report
          </Link>
        </div>
      ) : (
        <div className="reports-grid">
          {filtered.map((report) => (
            <article
              key={report.id}
              className="report-card"
              onClick={() => setSelectedReport(report)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedReport(report);
              }}
            >
              <div className="report-card-media">
                <img src={report.image_url} alt={report.address_label || report.id} />
                <span
                  className="badge"
                  style={{
                    position: 'absolute',
                    right: 10,
                    bottom: 10,
                    background: 'rgba(15, 23, 42, 0.82)',
                    color: '#f8fafc',
                  }}
                >
                  <Eye size={12} /> Inspect
                </span>
              </div>

              <div className="report-card-body">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span className="mono" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                    {report.id}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {report.is_potential_duplicate && (
                      <span className="badge badge-dup">Potential Duplicate</span>
                    )}
                    <StatusBadge status={report.status} />
                  </div>
                </div>

                <h3 style={{ margin: 0, fontSize: '1rem' }}>
                  {report.address_label || 'Pinned Road Location'}
                </h3>

                {report.notes && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {report.notes}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(report.detections || []).map((det) => {
                    const meta = getDamageMeta(det.class_code);
                    const rejected = det.verification_status === 'rejected';
                    return (
                      <span
                        key={det.id}
                        className="class-code-badge"
                        style={{
                          background: meta.bgTint,
                          color: meta.color,
                          textDecoration: rejected ? 'line-through' : 'none',
                          opacity: rejected ? 0.55 : 1,
                        }}
                      >
                        {det.class_code} · {Math.round((det.confidence || 0) * 100)}%
                      </span>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 10,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    className="mono"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <MapPin size={12} />
                    {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

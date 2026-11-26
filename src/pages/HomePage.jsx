import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, CheckCircle2, MapPin, Radar } from 'lucide-react';
import { DAMAGE_CLASS_LIST } from '../constants/damageTypes';
import { fetchReports } from '../services/api';

const WORKFLOW_STEPS = [
  {
    num: 1,
    title: 'Capture',
    desc: 'Upload or snap a road photo',
    module: 'Module 3 · Frontend',
    detail: 'Users upload a street photograph via drag-and-drop, file picker, or mobile camera.',
    ctaTo: '/report',
    ctaLabel: 'Upload Photo',
  },
  {
    num: 2,
    title: 'Detect',
    desc: 'FastAPI sends image to YOLOv8',
    module: 'Module 2 · Backend',
    detail: 'FastAPI receives the multipart image upload and passes it to the trained YOLOv8 model.',
    ctaTo: '/report',
    ctaLabel: 'Test Detection',
  },
  {
    num: 3,
    title: 'Classify',
    desc: 'Boxes & D00–D40 confidence scores',
    module: 'Module 1 · ML & CV',
    detail: 'YOLOv8 predicts bounding-box coordinates and confidence scores for D00, D10, D20, and D40.',
    ctaTo: '/report',
    ctaLabel: 'See Boxes',
  },
  {
    num: 4,
    title: 'Verify',
    desc: 'User confirms or rejects boxes',
    module: 'Module 3 · Frontend',
    detail: 'Human-in-the-loop review lets the user confirm true damages or reject false positives.',
    ctaTo: '/report',
    ctaLabel: 'Try Verification',
  },
  {
    num: 5,
    title: 'Geotag',
    desc: 'Attach GPS coordinates & time',
    module: 'Module 3 & 4 · GPS',
    detail: 'Browser Geolocation or interactive map pin-drop attaches exact latitude, longitude, and timestamp.',
    ctaTo: '/report',
    ctaLabel: 'Pin Location',
  },
  {
    num: 6,
    title: 'Store',
    desc: 'Save verified report & check dupes',
    module: 'Module 4 · PostGIS',
    detail: 'Reports are stored in PostgreSQL/PostGIS and checked against nearby hazards (~60m radius).',
    ctaTo: '/reports',
    ctaLabel: 'View History',
  },
  {
    num: 7,
    title: 'Visualize',
    desc: 'Plot hazard on Leaflet map',
    module: 'Module 4 · Mapping',
    detail: 'Verified damage markers appear on OpenStreetMap via Leaflet for citywide exploration.',
    ctaTo: '/map',
    ctaLabel: 'Open Map',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [activeStepNum, setActiveStepNum] = useState(1);

  useEffect(() => {
    fetchReports()
      .then((list) => setReports(list))
      .catch(() => setReports([]));
  }, []);

  const classCounts = useMemo(() => {
    const counts = { D00: 0, D10: 0, D20: 0, D40: 0 };
    reports.forEach((rep) => {
      (rep.detections || []).forEach((d) => {
        if (d.verification_status !== 'rejected' && counts[d.class_code] !== undefined) {
          counts[d.class_code] += 1;
        }
      });
    });
    return counts;
  }, [reports]);

  const activeStep = WORKFLOW_STEPS.find((s) => s.num === activeStepNum) || WORKFLOW_STEPS[0];

  return (
    <div>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="hero-badge">
              <Radar size={15} />
              <span>YOLOv8 + FastAPI + PostGIS + Leaflet</span>
            </div>
            <h1>Automated Road Damage Detection & Geo-Reporting</h1>
            <p>
              RoadVision turns street photographs into verified, GPS-tagged road
              maintenance reports. Upload an image, inspect bounding-box predictions,
              confirm detections, and visualize hazards on a live map.
            </p>
            <div className="hero-actions">
              <Link to="/report" className="btn btn-primary">
                <Camera size={18} />
                <span>Scan Road Damage</span>
                <ArrowRight size={17} />
              </Link>
              <Link to="/map" className="btn btn-secondary">
                <MapPin size={18} />
                <span>Open Hazard Map</span>
              </Link>
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-box">
              <div className="stat-label">Damage Categories</div>
              <div className="stat-value">4 Classes</div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4 }}>
                D00, D10, D20, D40
              </div>
            </div>
            <div className="hero-stat-box">
              <div className="stat-label">Submitted Reports</div>
              <div className="stat-value">{reports.length}</div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4 }}>
                Mapped & verifiable
              </div>
            </div>
            <div className="hero-stat-box">
              <div className="stat-label">Human-in-the-Loop</div>
              <div className="stat-value">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={18} color="#10b981" /> Confirm / Reject
                </span>
              </div>
            </div>
            <div className="hero-stat-box">
              <div className="stat-label">Mapping Engine</div>
              <div className="stat-value">Leaflet OSM</div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4 }}>
                Duplicate radius check
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-header">
          <div>
            <h2>Interactive Pipeline Explorer</h2>
            <p>Click any step below to inspect how data flows across the four modules</p>
          </div>
          <Link to="/report" className="btn btn-dark btn-sm">
            Try Workflow
          </Link>
        </div>

        <div className="workflow-grid">
          {WORKFLOW_STEPS.map((step) => (
            <button
              key={step.num}
              type="button"
              className={`workflow-step ${activeStepNum === step.num ? 'active' : ''}`}
              onClick={() => setActiveStepNum(step.num)}
              style={{ color: 'inherit' }}
            >
              <div className="workflow-num">{step.num}</div>
              <div className="workflow-title">{step.title}</div>
              <div className="workflow-desc">{step.desc}</div>
            </button>
          ))}
        </div>

        <div className="workflow-detail-banner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <strong>
                Step {activeStep.num}: {activeStep.title}
              </strong>
              <span className="class-code-badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {activeStep.module}
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {activeStep.detail}
            </div>
          </div>
          <Link to={activeStep.ctaTo} className="btn btn-primary btn-sm">
            <span>{activeStep.ctaLabel}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section>
        <div className="section-header">
          <div>
            <h2>Supported Road Damage Classes</h2>
            <p>Click any category to filter matching reports on the interactive Hazard Map</p>
          </div>
        </div>

        <div className="classes-grid">
          {DAMAGE_CLASS_LIST.map((item) => (
            <div
              key={item.code}
              className="class-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/map?class=${item.code}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(`/map?class=${item.code}`);
              }}
            >
              <div className="class-code-row">
                <span
                  className="class-code-badge"
                  style={{ background: item.bgTint, color: item.color }}
                >
                  {item.code}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {classCounts[item.code] || 0} mapped · {item.severityHint}
                </span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

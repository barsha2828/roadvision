import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  Compass,
  Eye,
  ImagePlus,
  Loader2,
  MapPin,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import DetectionOverlay from '../components/DetectionOverlay';
import LocationPickerMap from '../components/LocationPickerMap';
import { getDamageMeta } from '../constants/damageTypes';
import { SAMPLE_ROAD_IMAGES } from '../data/mockData';
import { checkDuplicateLocation, runDetection, submitReport } from '../services/api';

const STEPS = [
  { id: 1, label: 'Acquire Image' },
  { id: 2, label: 'Verify Detections' },
  { id: 3, label: 'Geotag & Submit' },
  { id: 4, label: 'Submitted' },
];

export default function ReportFlowPage() {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sampleId, setSampleId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState('');
  const [detectionResult, setDetectionResult] = useState(null);
  const [detections, setDetections] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);

  // Interactive Step 2 controls
  const [minConfidence, setMinConfidence] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [showRejectedBoxes, setShowRejectedBoxes] = useState(true);

  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [addressLabel, setAddressLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReport, setSubmittedReport] = useState(null);

  useEffect(() => {
    if (step !== 3) return;
    let active = true;
    checkDuplicateLocation(latitude, longitude)
      .then((match) => {
        if (active) setDuplicateMatch(match);
      })
      .catch(() => {
        if (active) setDuplicateMatch(null);
      });
    return () => {
      active = false;
    };
  }, [step, latitude, longitude]);

  const visibleDetections = useMemo(
    () => detections.filter((d) => (d.confidence || 0) * 100 >= minConfidence),
    [detections, minConfidence]
  );

  function handleFileChosen(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setDetectError('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(String(reader.result || ''));
      setSelectedFile(file);
      setSampleId(null);
      setDetectError('');
    };
    reader.readAsDataURL(file);
  }

  function handleSelectSample(sample) {
    setPreviewUrl(sample.dataUrl);
    setSelectedFile({ name: sample.fileName, type: 'image/svg+xml' });
    setSampleId(sample.id);
    setLatitude(sample.suggestedLocation.latitude);
    setLongitude(sample.suggestedLocation.longitude);
    setAddressLabel(sample.suggestedLocation.address);
    setDetectError('');
  }

  async function handleAnalyze() {
    if (!previewUrl) return;
    setIsDetecting(true);
    setDetectError('');

    try {
      const result = await runDetection(selectedFile, sampleId);
      setDetectionResult(result);
      setDetections(
        (result.detections || []).map((d) => ({
          ...d,
          verification_status: 'confirmed',
        }))
      );
      setMinConfidence(0);
      setStep(2);
    } catch (err) {
      setDetectError(err.message || 'Could not analyze image.');
    } finally {
      setIsDetecting(false);
    }
  }

  function setVerificationStatus(detId, status) {
    setDetections((prev) =>
      prev.map((d) => (d.id === detId ? { ...d, verification_status: status } : d))
    );
  }

  function toggleDetectionFromOverlay(det) {
    const nextStatus = det.verification_status === 'confirmed' ? 'rejected' : 'confirmed';
    setVerificationStatus(det.id, nextStatus);
    setHighlightedId(det.id);
  }

  function handleConfirmAllVisible() {
    setDetections((prev) =>
      prev.map((d) =>
        (d.confidence || 0) * 100 >= minConfidence
          ? { ...d, verification_status: 'confirmed' }
          : d
      )
    );
  }

  function handleCaptureGps() {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by this browser. Click the map to drop a pin.');
      return;
    }
    setIsLocating(true);
    setGpsStatus('Requesting GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setGpsStatus(
          `GPS locked (±${Math.round(pos.coords.accuracy)}m accuracy). You can fine-tune on the map.`
        );
        setIsLocating(false);
      },
      (err) => {
        setGpsStatus(
          `Location access unavailable (${err.message}). Click on the map or enter coordinates manually.`
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        detection_id: detectionResult?.detection_id,
        image_url: previewUrl,
        latitude: Number(latitude),
        longitude: Number(longitude),
        address_label: addressLabel.trim() || 'Road Inspection Point',
        notes: notes.trim(),
        timestamp: new Date().toISOString(),
        detections: visibleDetections,
      };
      const saved = await submitReport(payload);
      setSubmittedReport(saved);
      setStep(4);
    } catch (err) {
      setSubmitError(err.message || 'Failed to save report.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetAll() {
    setStep(1);
    setSelectedFile(null);
    setSampleId(null);
    setPreviewUrl('');
    setDetectionResult(null);
    setDetections([]);
    setHighlightedId(null);
    setMinConfidence(0);
    setAddressLabel('');
    setNotes('');
    setGpsStatus('');
    setDuplicateMatch(null);
    setSubmittedReport(null);
    setDetectError('');
    setSubmitError('');
  }

  const confirmedCount = visibleDetections.filter(
    (d) => d.verification_status === 'confirmed'
  ).length;
  const rejectedCount = visibleDetections.filter(
    (d) => d.verification_status === 'rejected'
  ).length;

  return (
    <div>
      <div className="section-header" style={{ marginTop: 4 }}>
        <div>
          <h2>Scan & Report Road Damage</h2>
          <p>Upload a road photograph, review YOLO bounding boxes, and attach GPS coordinates.</p>
        </div>
        {step > 1 && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={resetAll}>
            <RotateCcw size={15} />
            <span>Start Over</span>
          </button>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="stepper">
        {STEPS.map((s) => {
          const isDone = step > s.id;
          const isActive = step === s.id;
          return (
            <div
              key={s.id}
              className={`step-pill ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
            >
              <span className="step-circle">{isDone ? <Check size={14} /> : s.id}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: IMAGE ACQUISITION */}
      {step === 1 && (
        <div className="card card-pad">
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileChosen(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFileChosen(e.target.files?.[0])}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => handleFileChosen(e.target.files?.[0])}
            />

            <div className="dropzone-icon">
              <ImagePlus size={26} />
            </div>
            <h3 style={{ margin: '0 0 6px' }}>Drop a road photograph here, or browse</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Supports JPG, PNG, and WebP road surface images
            </p>

            <div
              style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={16} />
                <span>Choose File</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={16} />
                <span>Use Camera</span>
              </button>
            </div>
          </div>

          {detectError && (
            <div className="alert alert-danger" style={{ marginTop: 16 }}>
              <AlertTriangle size={18} />
              <span>{detectError}</span>
            </div>
          )}

          {previewUrl && (
            <div
              style={{
                marginTop: 22,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 20,
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <img
                  src={previewUrl}
                  alt="Selected road preview"
                  style={{
                    width: 150,
                    height: 95,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid var(--border-strong)',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedFile?.name || 'Road Image'}</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Ready to send to YOLOv8 damage detection model.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={isDetecting}
                onClick={handleAnalyze}
              >
                {isDetecting ? (
                  <>
                    <Loader2 size={18} />
                    <span>Running Detection...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Detect Road Damage</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="sample-strip">
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Quick Test — Try a Sample Road Image
            </div>
            <div className="sample-grid">
              {SAMPLE_ROAD_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={`sample-btn ${sampleId === sample.id ? 'selected' : ''}`}
                  onClick={() => handleSelectSample(sample)}
                >
                  <img src={sample.dataUrl} alt={sample.label} className="sample-thumb" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sample.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {sample.mockDetections.length} damage region(s)
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: DETECTION VISUALIZATION & USER VERIFICATION */}
      {step === 2 && (
        <div className="workspace-grid">
          <div className="card card-pad">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Detection Overlay</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Tip: Click any bounding box directly on the photo to toggle Confirm / Reject
                </span>
              </div>
              {detectionResult?.processing_time_ms && (
                <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Inference: {detectionResult.processing_time_ms}ms
                  {detectionResult.is_mock ? ' (mock)' : ''}
                </span>
              )}
            </div>

            <DetectionOverlay
              imageSrc={previewUrl}
              detections={visibleDetections}
              highlightedId={highlightedId}
              showLabels={showLabels}
              showRejected={showRejectedBoxes}
              onHoverDetection={setHighlightedId}
              onSelectDetection={toggleDetectionFromOverlay}
            />

            <div className="overlay-controls">
              <div className="range-control">
                <SlidersHorizontal size={15} />
                <label htmlFor="conf-slider" style={{ fontWeight: 600 }}>
                  Min Confidence: <span className="mono">{minConfidence}%</span>
                </label>
                <input
                  id="conf-slider"
                  type="range"
                  min="0"
                  max="95"
                  step="5"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                  />
                  <Tag size={14} />
                  <span>Labels</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showRejectedBoxes}
                    onChange={(e) => setShowRejectedBoxes(e.target.checked)}
                  />
                  <Eye size={14} />
                  <span>Rejected</span>
                </label>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <h3 style={{ margin: 0 }}>Verify Predictions</h3>
              {visibleDetections.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleConfirmAllVisible}
                >
                  <CheckCheck size={14} />
                  <span>Confirm All</span>
                </button>
              )}
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Confirm accurate bounding boxes or reject false positives before geotagging.
            </p>

            {visibleDetections.length === 0 ? (
              <div className="alert alert-info">
                <span>
                  No detections meet the {minConfidence}% confidence threshold. Lower the slider to
                  view all predictions.
                </span>
              </div>
            ) : (
              <div className="detection-list">
                {visibleDetections.map((det, idx) => {
                  const meta = getDamageMeta(det.class_code);
                  const confPct = Math.round((det.confidence || 0) * 100);
                  const isConfirmed = det.verification_status === 'confirmed';
                  const isRejected = det.verification_status === 'rejected';

                  return (
                    <div
                      key={det.id}
                      className={`detection-item ${
                        highlightedId === det.id ? 'highlighted' : ''
                      } ${isRejected ? 'rejected' : ''}`}
                      onMouseEnter={() => setHighlightedId(det.id)}
                      onMouseLeave={() => setHighlightedId(null)}
                    >
                      <div className="detection-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className="class-code-badge"
                            style={{ background: meta.bgTint, color: meta.color }}
                          >
                            {det.class_code}
                          </span>
                          <strong>
                            #{idx + 1} {det.class_name || meta.name}
                          </strong>
                        </div>
                        <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {confPct}% conf
                        </span>
                      </div>

                      <div className="verify-actions">
                        <button
                          type="button"
                          className={`verify-btn ${isConfirmed ? 'confirmed-active' : ''}`}
                          onClick={() => setVerificationStatus(det.id, 'confirmed')}
                        >
                          <Check size={15} />
                          <span>Confirm</span>
                        </button>
                        <button
                          type="button"
                          className={`verify-btn ${isRejected ? 'rejected-active' : ''}`}
                          onClick={() => setVerificationStatus(det.id, 'rejected')}
                        >
                          <X size={15} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <strong>{confirmedCount}</strong> confirmed · <strong>{rejectedCount}</strong> rejected
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={visibleDetections.length > 0 && confirmedCount === 0}
                  onClick={() => setStep(3)}
                >
                  <MapPin size={16} />
                  <span>Proceed to Geotag</span>
                </button>
              </div>
            </div>
            {visibleDetections.length > 0 && confirmedCount === 0 && (
              <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--danger)' }}>
                Confirm at least one detected damage box to submit a report.
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: GPS TAGGING & REPORT SUBMISSION */}
      {step === 3 && (
        <form className="workspace-grid" onSubmit={handleSubmit}>
          <div className="card card-pad">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <h3 style={{ margin: 0 }}>Pin Road Location</h3>
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={handleCaptureGps}
                disabled={isLocating}
              >
                {isLocating ? <Loader2 size={15} /> : <Compass size={15} />}
                <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
              </button>
            </div>

            {gpsStatus && (
              <div className="alert alert-info" style={{ marginBottom: 12 }}>
                <MapPin size={16} />
                <span>{gpsStatus}</span>
              </div>
            )}

            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              onSelectLocation={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />

            <div className="coord-row" style={{ marginTop: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="lat-input">
                  Latitude
                </label>
                <input
                  id="lat-input"
                  type="number"
                  step="any"
                  required
                  className="form-input mono"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="lng-input">
                  Longitude
                </label>
                <input
                  id="lng-input"
                  type="number"
                  step="any"
                  required
                  className="form-input mono"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <h3 style={{ margin: '0 0 14px' }}>Report Details</h3>

            {duplicateMatch && (
              <div className="alert alert-warning">
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Potential Duplicate Detected</strong>
                  <div>
                    Report <span className="mono">{duplicateMatch.report.id}</span> (
                    {duplicateMatch.report.address_label}) is ~{duplicateMatch.distanceMeters}m away.
                    You can still submit if this is a distinct hazard.
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="address-input">
                Road / Landmark Label
              </label>
              <input
                id="address-input"
                type="text"
                className="form-input"
                placeholder="e.g., MG Road near Metro Pillar 42"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes-input">
                Inspector Notes (Optional)
              </label>
              <textarea
                id="notes-input"
                rows={3}
                className="form-textarea"
                placeholder="Lane position, water pooling, traffic risk..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Verified Summary</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {visibleDetections
                  .filter((d) => d.verification_status === 'confirmed')
                  .map((d) => {
                    const meta = getDamageMeta(d.class_code);
                    return (
                      <span
                        key={d.id}
                        className="class-code-badge"
                        style={{ background: meta.bgTint, color: meta.color }}
                      >
                        {d.class_code} · {d.class_name} ({Math.round(d.confidence * 100)}%)
                      </span>
                    );
                  })}
              </div>
            </div>

            {submitError && (
              <div className="alert alert-danger">
                <AlertTriangle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                Back to Verification
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={17} /> : <Send size={17} />}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Road Report'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 4: CONFIRMATION */}
      {step === 4 && submittedReport && (
        <div className="card card-pad" style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'var(--success-soft)',
              color: 'var(--success)',
              display: 'inline-grid',
              placeItems: 'center',
              marginBottom: 12,
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ margin: '0 0 6px' }}>Report Saved Successfully</h2>
          <p style={{ margin: '0 0 18px', color: 'var(--text-secondary)' }}>
            Report <strong className="mono">{submittedReport.id}</strong> has been tagged at{' '}
            <span className="mono">
              {submittedReport.latitude.toFixed(5)}, {submittedReport.longitude.toFixed(5)}
            </span>{' '}
            and added to the hazard map.
          </p>

          {submittedReport.is_potential_duplicate && (
            <div className="alert alert-warning" style={{ textAlign: 'left' }}>
              <AlertTriangle size={18} />
              <span>
                Flagged as a potential duplicate of{' '}
                <strong className="mono">{submittedReport.duplicate_of_id}</strong> for database review.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to={`/map?report=${encodeURIComponent(submittedReport.id)}`}
              className="btn btn-primary"
            >
              <MapPin size={17} />
              <span>View on Hazard Map</span>
            </Link>
            <Link to="/reports" className="btn btn-secondary">
              <span>View Report History</span>
            </Link>
            <button type="button" className="btn btn-dark" onClick={resetAll}>
              <Camera size={17} />
              <span>Scan Another Road</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

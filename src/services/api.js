import { INITIAL_SAMPLE_REPORTS, SAMPLE_ROAD_IMAGES } from '../data/mockData';
import { getDamageMeta } from '../constants/damageTypes';

const STORAGE_KEY = 'roadvision_reports_v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Haversine distance in meters for basic duplicate-report detection
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readStoredReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_REPORTS));
      return [...INITIAL_SAMPLE_REPORTS];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_SAMPLE_REPORTS];
  }
}

function writeStoredReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // Ignore storage quota errors in mock mode
  }
}

function normalizeBbox(bbox, imageWidth, imageHeight) {
  if (!Array.isArray(bbox) || bbox.length !== 4) return [0.1, 0.1, 0.5, 0.5];
  const isPixelSpace = bbox.some((val) => val > 1);
  if (isPixelSpace && imageWidth && imageHeight) {
    return [
      bbox[0] / imageWidth,
      bbox[1] / imageHeight,
      bbox[2] / imageWidth,
      bbox[3] / imageHeight,
    ];
  }
  return bbox;
}

function buildMockDetectionsForUpload(fileName = '') {
  const lower = fileName.toLowerCase();
  const matchedSample = SAMPLE_ROAD_IMAGES.find((s) => lower.includes(s.id.replace('sample_', '')));
  if (matchedSample) {
    return matchedSample.mockDetections.map((d) => ({ ...d }));
  }

  // Deterministic realistic mock detections for any user-uploaded road photo
  const seed = fileName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const patterns = [
    [
      { id: 'box_1', class_code: 'D40', confidence: 0.91, bbox: [0.32, 0.48, 0.64, 0.78] },
      { id: 'box_2', class_code: 'D00', confidence: 0.82, bbox: [0.15, 0.25, 0.27, 0.82] },
    ],
    [
      { id: 'box_1', class_code: 'D20', confidence: 0.88, bbox: [0.22, 0.4, 0.72, 0.8] },
    ],
    [
      { id: 'box_1', class_code: 'D10', confidence: 0.86, bbox: [0.18, 0.46, 0.78, 0.58] },
      { id: 'box_2', class_code: 'D40', confidence: 0.79, bbox: [0.54, 0.62, 0.76, 0.84] },
    ],
  ];

  return patterns[seed % patterns.length].map((item) => ({
    ...item,
    class_name: getDamageMeta(item.class_code).name,
  }));
}

export async function runDetection(file, sampleId = null) {
  if (USE_MOCK_API) {
    await delay(900);
    const sample = sampleId
      ? SAMPLE_ROAD_IMAGES.find((s) => s.id === sampleId)
      : null;

    const detections = sample
      ? sample.mockDetections
      : buildMockDetectionsForUpload(file?.name || 'road.jpg');

    return {
      detection_id: `det_${Date.now().toString(36)}`,
      image_width: 800,
      image_height: 500,
      processing_time_ms: 138,
      detections,
      is_mock: true,
    };
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/api/detect`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Detection request failed (${response.status})`);
  }

  const data = await response.json();
  return {
    ...data,
    detections: (data.detections || []).map((det, idx) => ({
      ...det,
      id: det.id || `box_${idx + 1}`,
      class_name: det.class_name || getDamageMeta(det.class_code).name,
      bbox: normalizeBbox(det.bbox, data.image_width, data.image_height),
    })),
    is_mock: false,
  };
}

export function findNearbyReport(latitude, longitude, existingReports, radiusMeters = 60) {
  if (latitude == null || longitude == null) return null;
  for (const report of existingReports) {
    const dist = calculateDistanceMeters(latitude, longitude, report.latitude, report.longitude);
    if (dist <= radiusMeters) {
      return { report, distanceMeters: Math.round(dist) };
    }
  }
  return null;
}

export async function checkDuplicateLocation(latitude, longitude) {
  const reports = await fetchReports();
  return findNearbyReport(latitude, longitude, reports, 60);
}

export async function submitReport(payload) {
  if (USE_MOCK_API) {
    await delay(650);
    const existing = readStoredReports();
    const nearby = findNearbyReport(payload.latitude, payload.longitude, existing, 60);

    const confirmedCount = payload.detections.filter(
      (d) => d.verification_status === 'confirmed'
    ).length;
    const status =
      confirmedCount === payload.detections.length
        ? 'verified'
        : confirmedCount > 0
          ? 'partially_rejected'
          : 'rejected';

    const newReport = {
      id: `RV-${1001 + existing.length}`,
      image_url: payload.image_url,
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      address_label: payload.address_label || 'Pinned Road Location',
      notes: payload.notes || '',
      status,
      is_potential_duplicate: Boolean(nearby),
      duplicate_of_id: nearby ? nearby.report.id : null,
      created_at: payload.timestamp || new Date().toISOString(),
      detections: payload.detections,
    };

    const updated = [newReport, ...existing];
    writeStoredReports(updated);
    return newReport;
  }

  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Failed to submit report (${response.status})`);
  }

  return response.json();
}

export async function fetchReports(filters = {}) {
  let reports = [];

  if (USE_MOCK_API) {
    await delay(200);
    reports = readStoredReports();
  } else {
    const params = new URLSearchParams();
    if (filters.classCode && filters.classCode !== 'ALL') {
      params.append('class_code', filters.classCode);
    }
    if (filters.status && filters.status !== 'ALL') {
      params.append('status', filters.status);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/reports${query}`);
    if (!response.ok) {
      throw new Error(`Failed to load reports (${response.status})`);
    }
    const data = await response.json();
    reports = Array.isArray(data) ? data : data.reports || [];
  }

  return reports.filter((rep) => {
    if (filters.status && filters.status !== 'ALL' && rep.status !== filters.status) {
      return false;
    }
    if (filters.classCode && filters.classCode !== 'ALL') {
      const hasClass = (rep.detections || []).some(
        (d) => d.class_code === filters.classCode && d.verification_status !== 'rejected'
      );
      if (!hasClass) return false;
    }
    return true;
  });
}

export function resetMockReports() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_REPORTS));
  return [...INITIAL_SAMPLE_REPORTS];
}

export async function deleteReport(reportId) {
  if (USE_MOCK_API) {
    const existing = readStoredReports();
    const updated = existing.filter((r) => r.id !== reportId);
    writeStoredReports(updated);
    return updated;
  }

  const response = await fetch(`${API_BASE_URL}/api/reports/${encodeURIComponent(reportId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete report (${response.status})`);
  }
  return fetchReports();
}

export function isMockMode() {
  return USE_MOCK_API;
}

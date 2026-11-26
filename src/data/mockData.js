// Generates realistic SVG road-damage scenes as data URLs so the frontend
// can be tested end-to-end without external image assets.

function svgToDataUrl(svgString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

const POTHOLE_SCENE = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="140" fill="url(#sky)"/>
  <rect y="140" width="800" height="360" fill="url(#asphalt)"/>
  <polygon points="385,140 415,140 445,500 355,500" fill="#facc15" opacity="0.85"/>
  <rect x="350" y="210" width="100" height="14" fill="#1e293b"/>
  <rect x="350" y="340" width="100" height="16" fill="#1e293b"/>
  <!-- Pothole -->
  <ellipse cx="520" cy="340" rx="105" ry="58" fill="#0f172a" stroke="#64748b" stroke-width="6"/>
  <ellipse cx="515" cy="346" rx="76" ry="38" fill="#020617"/>
  <path d="M430,335 Q470,310 520,315 T610,342" fill="none" stroke="#94a3b8" stroke-width="3" opacity="0.5"/>
  <!-- Secondary transverse crack -->
  <path d="M120,255 L195,248 L255,260 L335,252" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
</svg>
`);

const ALLIGATOR_SCENE = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <rect width="800" height="120" fill="#cbd5e1"/>
  <rect y="120" width="800" height="380" fill="#334155"/>
  <line x1="0" y1="135" x2="800" y2="135" stroke="#e2e8f0" stroke-width="6"/>
  <!-- Alligator fatigue crack network -->
  <g stroke="#0f172a" stroke-width="4" fill="none" stroke-linecap="round">
    <path d="M210,240 L270,260 L330,235 L400,265 L455,245"/>
    <path d="M200,295 L265,310 L340,290 L410,320 L470,295"/>
    <path d="M220,350 L285,365 L350,345 L420,375 L480,355"/>
    <path d="M270,260 L265,310 L285,365"/>
    <path d="M330,235 L340,290 L350,345"/>
    <path d="M400,265 L410,320 L420,375"/>
    <path d="M235,250 L230,325 L250,360"/>
  </g>
</svg>
`);

const CRACKS_SCENE = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <rect width="800" height="110" fill="#bae6fd"/>
  <rect y="110" width="800" height="390" fill="#3f4a5a"/>
  <rect x="65" y="110" width="12" height="390" fill="#f8fafc" opacity="0.8"/>
  <!-- Longitudinal crack -->
  <path d="M250,150 L242,220 L256,300 L248,390 L260,465" fill="none" stroke="#090d16" stroke-width="6" stroke-linecap="round"/>
  <!-- Transverse crack -->
  <path d="M380,275 L465,268 L545,280 L650,272" fill="none" stroke="#090d16" stroke-width="5" stroke-linecap="round"/>
</svg>
`);

export const SAMPLE_ROAD_IMAGES = [
  {
    id: 'sample_pothole',
    label: 'Pothole + Transverse Crack',
    fileName: 'sample-pothole-road.svg',
    dataUrl: POTHOLE_SCENE,
    suggestedLocation: { latitude: 12.9716, longitude: 77.5946, address: 'MG Road Junction' },
    mockDetections: [
      {
        id: 'det_s1_1',
        class_code: 'D40',
        class_name: 'Pothole',
        confidence: 0.94,
        bbox: [0.51, 0.55, 0.79, 0.81],
      },
      {
        id: 'det_s1_2',
        class_code: 'D10',
        class_name: 'Transverse Crack',
        confidence: 0.83,
        bbox: [0.14, 0.47, 0.43, 0.55],
      },
    ],
  },
  {
    id: 'sample_alligator',
    label: 'Alligator Fatigue Cracking',
    fileName: 'sample-alligator-crack.svg',
    dataUrl: ALLIGATOR_SCENE,
    suggestedLocation: { latitude: 12.9352, longitude: 77.6245, address: 'Koramangala 80ft Road' },
    mockDetections: [
      {
        id: 'det_s2_1',
        class_code: 'D20',
        class_name: 'Alligator Crack',
        confidence: 0.91,
        bbox: [0.24, 0.45, 0.62, 0.78],
      },
    ],
  },
  {
    id: 'sample_cracks',
    label: 'Longitudinal & Transverse',
    fileName: 'sample-lane-cracks.svg',
    dataUrl: CRACKS_SCENE,
    suggestedLocation: { latitude: 12.9698, longitude: 77.7499, address: 'Whitefield Main Road' },
    mockDetections: [
      {
        id: 'det_s3_1',
        class_code: 'D00',
        class_name: 'Longitudinal Crack',
        confidence: 0.89,
        bbox: [0.28, 0.28, 0.35, 0.94],
      },
      {
        id: 'det_s3_2',
        class_code: 'D10',
        class_name: 'Transverse Crack',
        confidence: 0.85,
        bbox: [0.47, 0.51, 0.82, 0.59],
      },
    ],
  },
];

export const INITIAL_SAMPLE_REPORTS = [
  {
    id: 'RV-1001',
    image_url: POTHOLE_SCENE,
    latitude: 12.9716,
    longitude: 77.5946,
    address_label: 'MG Road & Brigade Rd Junction',
    notes: 'Large pothole in the left lane causing vehicles to swerve.',
    status: 'verified',
    is_potential_duplicate: false,
    duplicate_of_id: null,
    created_at: '2026-11-24T09:15:00.000Z',
    detections: [
      {
        id: 'box_1001_1',
        class_code: 'D40',
        class_name: 'Pothole',
        confidence: 0.94,
        bbox: [0.51, 0.55, 0.79, 0.81],
        verification_status: 'confirmed',
      },
      {
        id: 'box_1001_2',
        class_code: 'D10',
        class_name: 'Transverse Crack',
        confidence: 0.83,
        bbox: [0.14, 0.47, 0.43, 0.55],
        verification_status: 'confirmed',
      },
    ],
  },
  {
    id: 'RV-1002',
    image_url: ALLIGATOR_SCENE,
    latitude: 12.9352,
    longitude: 77.6245,
    address_label: 'Koramangala 4th Block, 80ft Rd',
    notes: 'Severe fatigue cracking across a 3-meter stretch near signal.',
    status: 'verified',
    is_potential_duplicate: false,
    duplicate_of_id: null,
    created_at: '2026-11-25T14:30:00.000Z',
    detections: [
      {
        id: 'box_1002_1',
        class_code: 'D20',
        class_name: 'Alligator Crack',
        confidence: 0.91,
        bbox: [0.24, 0.45, 0.62, 0.78],
        verification_status: 'confirmed',
      },
    ],
  },
  {
    id: 'RV-1003',
    image_url: CRACKS_SCENE,
    latitude: 12.9698,
    longitude: 77.6499,
    address_label: 'Indiranagar 100ft Road',
    notes: 'Longitudinal seam crack developing near lane divider.',
    status: 'verified',
    is_potential_duplicate: false,
    duplicate_of_id: null,
    created_at: '2026-11-25T17:45:00.000Z',
    detections: [
      {
        id: 'box_1003_1',
        class_code: 'D00',
        class_name: 'Longitudinal Crack',
        confidence: 0.88,
        bbox: [0.28, 0.28, 0.35, 0.94],
        verification_status: 'confirmed',
      },
    ],
  },
  {
    id: 'RV-1004',
    image_url: POTHOLE_SCENE,
    latitude: 12.9592,
    longitude: 77.6122,
    address_label: 'Richmond Circle Flyover Approach',
    notes: 'Water-filled pothole spotted after morning rain.',
    status: 'partially_rejected',
    is_potential_duplicate: false,
    duplicate_of_id: null,
    created_at: '2026-11-26T02:20:00.000Z',
    detections: [
      {
        id: 'box_1004_1',
        class_code: 'D40',
        class_name: 'Pothole',
        confidence: 0.87,
        bbox: [0.51, 0.55, 0.79, 0.81],
        verification_status: 'confirmed',
      },
      {
        id: 'box_1004_2',
        class_code: 'D10',
        class_name: 'Transverse Crack',
        confidence: 0.61,
        bbox: [0.14, 0.47, 0.43, 0.55],
        verification_status: 'rejected',
      },
    ],
  },
];

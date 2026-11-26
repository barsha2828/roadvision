# RoadVision Frontend (Member 3)

React + JavaScript frontend for **RoadVision – Computer-Vision-Based Road Damage Detection and Reporting System**.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Features Included

- **Landing Page (`/`)**: Project overview, 7-step workflow (`Capture → Detect → Classify → Verify → Geotag → Store → Visualize`), and the 4 damage categories (`D00`, `D10`, `D20`, `D40`).
- **Scan & Report Flow (`/report`)**:
  - Image drag-and-drop, file upload, mobile camera capture, and 3 built-in sample road images for instant testing.
  - Interactive bounding-box overlay (`src/components/DetectionOverlay.jsx`) with confidence scores and per-box **Confirm / Reject** verification.
  - GPS capture via `navigator.geolocation` + interactive Leaflet pin picker (`src/components/LocationPickerMap.jsx`) + duplicate-report proximity check (~60m radius).
- **Interactive Hazard Map (`/map`)**: OpenStreetMap + Leaflet map (`src/components/HazardMap.jsx`) with color-coded markers, popups, and damage-class/status filters.
- **Report History (`/reports`)**: Searchable and filterable grid of submitted reports stored in `localStorage` during mock mode.

## Connecting to FastAPI Backend (Member 2)

By default, `src/services/api.js` runs in **Sample ML Mode** (`VITE_USE_MOCK_API=true`).

When Member 2's FastAPI server is ready:

1. Copy `.env.example` to `.env`
2. Set `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=http://localhost:8000`
3. Share [API_CONTRACT.md](./API_CONTRACT.md) with Members 1, 2, and 4 so endpoint payloads match.

# RoadVision Frontend ↔ Backend API Contract

Share this contract with **Member 1 (ML)**, **Member 2 (FastAPI)**, and **Member 4 (Database & Map)** so all modules integrate cleanly.

When `VITE_USE_MOCK_API=false` in `.env`, the React frontend calls the FastAPI endpoints below.

---

## 1. Damage Class Codes

| Code | Label | Color |
|---|---|---|
| `D00` | Longitudinal Crack | `#f59e0b` (Amber) |
| `D10` | Transverse Crack | `#3b82f6` (Blue) |
| `D20` | Alligator Crack | `#a855f7` (Purple) |
| `D40` | Pothole | `#ef4444` (Red) |

---

## 2. `POST /api/detect`

Runs YOLOv8 inference on an uploaded road photograph.

- **Request**: `multipart/form-data` with field `image` (JPEG / PNG / WebP)
- **Response** (`200 OK`):

```json
{
  "detection_id": "det_9f8a21c",
  "image_width": 1280,
  "image_height": 720,
  "image_url": "/uploads/det_9f8a21c.jpg",
  "processing_time_ms": 142,
  "detections": [
    {
      "id": "box_1",
      "class_code": "D40",
      "class_name": "Pothole",
      "confidence": 0.92,
      "bbox": [0.34, 0.48, 0.62, 0.78]
    }
  ]
}
```

> **Note on `bbox`**: Normalized `[x1, y1, x2, y2]` (`0.0` to `1.0`) is recommended. The frontend also supports pixel `[x1, y1, x2, y2]` coordinates automatically whenever `image_width` and `image_height` are provided.

---

## 3. `POST /api/reports/check-duplicate` (Optional) or `POST /api/reports`

Submits user-verified detections along with GPS coordinates and timestamp.

- **Request** (`application/json`):

```json
{
  "detection_id": "det_9f8a21c",
  "image_url": "/uploads/det_9f8a21c.jpg",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address_label": "MG Road, Bengaluru",
  "notes": "Deep pothole near bus stop",
  "timestamp": "2026-11-26T04:15:00.000Z",
  "detections": [
    {
      "id": "box_1",
      "class_code": "D40",
      "class_name": "Pothole",
      "confidence": 0.92,
      "bbox": [0.34, 0.48, 0.62, 0.78],
      "verification_status": "confirmed"
    }
  ]
}
```

- **Response** (`201 Created`):

```json
{
  "id": "rep_104",
  "status": "verified",
  "is_potential_duplicate": false,
  "duplicate_of_id": null,
  "created_at": "2026-11-26T04:15:01.000Z"
}
```

---

## 4. `GET /api/reports`

Retrieves saved road-damage reports for the **Hazard Map** and **Report History** views.

- **Optional Query Params**: `?class_code=D40&status=verified`
- **Response** (`200 OK`):

```json
{
  "reports": [
    {
      "id": "rep_104",
      "image_url": "/uploads/det_9f8a21c.jpg",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address_label": "MG Road, Bengaluru",
      "notes": "Deep pothole near bus stop",
      "status": "verified",
      "is_potential_duplicate": false,
      "created_at": "2026-11-26T04:15:01.000Z",
      "detections": [
        {
          "id": "box_1",
          "class_code": "D40",
          "class_name": "Pothole",
          "confidence": 0.92,
          "bbox": [0.34, 0.48, 0.62, 0.78],
          "verification_status": "confirmed"
        }
      ]
    }
  ]
}
```

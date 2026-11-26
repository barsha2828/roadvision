import { getDamageMeta } from '../constants/damageTypes';

export default function DetectionOverlay({
  imageSrc,
  detections = [],
  highlightedId = null,
  showLabels = true,
  showRejected = true,
  onHoverDetection,
  onSelectDetection,
}) {
  const visibleDetections = showRejected
    ? detections
    : detections.filter((d) => d.verification_status !== 'rejected');

  return (
    <div className="overlay-stage">
      <img src={imageSrc} alt="Uploaded road surface for damage analysis" />
      <svg
        className="overlay-svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-label="Detected damage bounding boxes"
      >
        {visibleDetections.map((det) => {
          const [x1, y1, x2, y2] = det.bbox || [0, 0, 0, 0];
          const left = Math.max(0, x1 * 1000);
          const top = Math.max(0, y1 * 1000);
          const width = Math.max(10, (x2 - x1) * 1000);
          const height = Math.max(10, (y2 - y1) * 1000);
          const meta = getDamageMeta(det.class_code);
          const isRejected = det.verification_status === 'rejected';
          const isHighlighted = highlightedId === det.id;

          const labelY = top > 44 ? top - 34 : top + 6;
          const confidencePct = Math.round((det.confidence || 0) * 100);
          const labelText = `${det.class_code} · ${confidencePct}%`;
          const labelWidth = Math.max(135, labelText.length * 13);

          return (
            <g
              key={det.id}
              className="overlay-box-group"
              opacity={isRejected ? 0.35 : 1}
              onMouseEnter={() => onHoverDetection && onHoverDetection(det.id)}
              onMouseLeave={() => onHoverDetection && onHoverDetection(null)}
              onClick={() => onSelectDetection && onSelectDetection(det)}
            >
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
                fill={isRejected ? 'transparent' : meta.bgTint}
                stroke={meta.color}
                strokeWidth={isHighlighted ? 9 : 5}
                strokeDasharray={isRejected ? '14 8' : undefined}
                rx="8"
              />
              {showLabels && (
                <>
                  <rect
                    x={left}
                    y={labelY}
                    width={labelWidth}
                    height="30"
                    rx="6"
                    fill={meta.color}
                  />
                  <text
                    x={left + 10}
                    y={labelY + 21}
                    fill="#ffffff"
                    fontSize="18"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {labelText}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

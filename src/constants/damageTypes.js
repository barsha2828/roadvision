export const DAMAGE_CLASSES = {
  D00: {
    code: 'D00',
    name: 'Longitudinal Crack',
    shortName: 'Longitudinal',
    color: '#f59e0b',
    bgTint: 'rgba(245, 158, 11, 0.14)',
    description: 'Cracks running parallel to the pavement centerline or traffic direction.',
    severityHint: 'Moderate',
  },
  D10: {
    code: 'D10',
    name: 'Transverse Crack',
    shortName: 'Transverse',
    color: '#3b82f6',
    bgTint: 'rgba(59, 130, 246, 0.14)',
    description: 'Cracks extending roughly perpendicular across the road lane.',
    severityHint: 'Moderate',
  },
  D20: {
    code: 'D20',
    name: 'Alligator Crack',
    shortName: 'Alligator',
    color: '#a855f7',
    bgTint: 'rgba(168, 85, 247, 0.14)',
    description: 'Interconnected fatigue cracks resembling alligator skin patterns.',
    severityHint: 'High',
  },
  D40: {
    code: 'D40',
    name: 'Pothole',
    shortName: 'Pothole',
    color: '#ef4444',
    bgTint: 'rgba(239, 68, 68, 0.16)',
    description: 'Bowl-shaped depressions in the pavement surface posing immediate hazard.',
    severityHint: 'Critical',
  },
};

export const DAMAGE_CLASS_LIST = Object.values(DAMAGE_CLASSES);

export function getDamageMeta(code) {
  return (
    DAMAGE_CLASSES[code] || {
      code: code || 'UNK',
      name: 'Road Damage',
      shortName: 'Damage',
      color: '#64748b',
      bgTint: 'rgba(100, 116, 139, 0.14)',
      description: 'Detected pavement anomaly.',
      severityHint: 'Moderate',
    }
  );
}

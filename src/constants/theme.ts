export const Colors = {
  // Primary palette
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A42DB',

  // Secondary
  secondary: '#FF6B9D',
  secondaryLight: '#FF8DB5',
  secondaryDark: '#DB4A7A',

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  info: '#2196F3',

  // Background
  background: '#1A1B2E',
  backgroundLight: '#242540',
  surface: '#2A2B45',
  surfaceLight: '#363759',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B8B9CC',
  textTertiary: '#6E6F85',
  textInverse: '#1A1B2E',

  // Score tone colors (brain "temperature")
  scoreFire: '#FF4444',      // 90-100: On fire
  scoreStrong: '#FF9800',    // 70-89: Strong
  scoreCalm: '#4CAF50',      // 50-69: Calm/Normal
  scoreRest: '#2196F3',      // 0-49: Resting

  // Misc
  border: '#363759',
  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const Typography = {
  heading1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  scoreDisplay: {
    fontSize: 64,
    fontWeight: '800' as const,
    lineHeight: 72,
  },
  scoreMini: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export function getScoreColor(score: number): string {
  if (score >= 90) return Colors.scoreFire;
  if (score >= 70) return Colors.scoreStrong;
  if (score >= 50) return Colors.scoreCalm;
  return Colors.scoreRest;
}

export function getScoreLabel(score: number): { ko: string; en: string } {
  if (score >= 90) return { ko: '최상', en: 'On Fire' };
  if (score >= 70) return { ko: '좋음', en: 'Strong' };
  if (score >= 50) return { ko: '보통', en: 'Normal' };
  return { ko: '휴식 필요', en: 'Need Rest' };
}

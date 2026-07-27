export const colors = {
  bg: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#0d1117',
  },
  glass: {
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.12)',
    highlight: 'rgba(255,255,255,0.18)',
  },
  text: {
    primary: 'rgba(255,255,255,0.92)',
    secondary: 'rgba(255,255,255,0.65)',
    muted: 'rgba(255,255,255,0.45)',
  },
  iridescent: {
    start: '#7c3aed',
    mid: '#06b6d4',
    end: '#ec4899',
  },
  action: {
    delete: 'rgba(239,68,68,0.65)',
    keep: 'rgba(34,197,94,0.65)',
    folder: 'rgba(124,58,237,0.65)',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 20,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const typography = {
  title: {
    fontSize: 32,
    fontWeight: '300' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '300' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
};

export const iridescentGradient = [colors.iridescent.start, colors.iridescent.mid, colors.iridescent.end] as const;

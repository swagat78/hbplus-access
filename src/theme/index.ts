// Palette pulled from hbplus.fit so the internal app feels like the same
// product: warm off-whites, a near-black ink and the rust accent.
export const colors = {
  ink: '#121215',
  inkSoft: '#4B3F36',
  text: '#1A1A1A',
  muted: '#6E6E73',
  faint: '#9BA1A5',

  rust: '#9F4022',
  rustPressed: '#7E321A',
  rustTint: '#F7ECE7',
  rustBorder: '#E9CDBF',

  cream: '#F4F2F0',
  sand: '#EDEAE7',
  line: '#E2DCD7',
  surface: '#FFFFFF',
  mist: '#EDF5F7',

  success: '#2F6B3A',
  successTint: '#E8F2EA',
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const fonts = {
  display: 'DMSerifDisplay_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const layout = {
  maxWidth: 1120,
  wideBreakpoint: 960,
} as const;

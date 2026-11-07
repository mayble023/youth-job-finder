import type { TextStyle } from 'react-native';

/**
 * Design tokens for Youth Job Finder.
 *
 * Palette: a deep "Pacific" blue for trust and professionalism, with a warm
 * gold accent inspired by the PNG flag and the Bird of Paradise. Every text
 * colour below meets WCAG AA (>= 4.5:1) against `background` and `surface`.
 * Use the `on*` tokens for text/icons placed on a coloured fill.
 */
export const colors = {
  primary: '#0B4F9C', // deep blue — 8.0:1 on white
  primaryDark: '#073A75', // pressed states, headers — 11.2:1 on white
  primaryLight: '#E6EEF8', // tinted backgrounds (selected chips, banners)
  secondary: '#F2A900', // warm gold accent — use with `onSecondary` text
  secondaryLight: '#FFF4D6',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#111827', // 17.7:1 on white
  textMuted: '#4B5563', // 7.6:1 on white, 7.0:1 on background
  border: '#D0D5DD',
  success: '#1E7B34', // 5.3:1 on white
  successLight: '#E7F5EC',
  warning: '#B54708', // 5.4:1 on white
  warningLight: '#FEF0E6',
  danger: '#B42318', // 6.5:1 on white
  dangerLight: '#FDECEA',
  onPrimary: '#FFFFFF',
  onSecondary: '#1F2937', // 7.3:1 on secondary
  onDanger: '#FFFFFF',
  overlay: 'rgba(17, 24, 39, 0.4)',
  shadow: 'rgba(17, 24, 39, 0.08)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

type TypeStyle = Required<Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight'>>;

export const typography = {
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  heading: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  subheading: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
} as const satisfies Record<string, TypeStyle>;

/** Fixed component dimensions. 48 dp is the Android minimum comfortable touch target. */
export const sizes = {
  touchTarget: 48,
  chipHeight: 36,
  multilineInputMinHeight: 112,
  iconBadge: 72,
} as const;

export const iconSizes = {
  sm: 16,
  md: 18,
  lg: 36,
  xl: 48,
} as const;

export const opacity = {
  pressed: 0.7,
  pressedSubtle: 0.85,
  disabled: 0.5,
} as const;

export const shadows = {
  card: `0 1px 3px ${colors.shadow}`,
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;
export type TypographyVariant = keyof typeof typography;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  sizes,
  iconSizes,
  opacity,
  shadows,
} as const;
export type Theme = typeof theme;

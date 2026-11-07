import { colors, typography } from './index';

/** Header look shared by every Stack and the Tabs navigator, so all screens match. */
export const headerOptions = {
  // A solid background keeps the header opaque on iOS 26+ (Liquid Glass default is transparent).
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.onPrimary,
  headerTitleStyle: {
    fontSize: typography.subheading.fontSize,
    fontWeight: typography.subheading.fontWeight,
  },
} as const;

export const stackScreenOptions = {
  ...headerOptions,
  contentStyle: { backgroundColor: colors.background },
} as const;

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, iconSizes, spacing } from '@/theme';

import { AppText } from './AppText';

export type OfflineBannerProps = {
  /** Controlled by network status later; renders nothing when false. */
  visible: boolean;
  message?: string;
};

export function OfflineBanner({
  visible,
  message = "You're offline. Showing saved jobs.",
}: OfflineBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={iconSizes.md} color={colors.onPrimary} />
      <AppText variant="caption" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warning,
  },
  text: {
    flex: 1,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});

import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing, type ColorToken } from '@/theme';
import type { ApplicationStatus } from '@/types/database';
import { APPLICATION_STATUS_LABELS } from '@/utils/applications';

import { AppText } from './AppText';

// Each status has a strong text colour on a pale fill, so the badge is readable (AA contrast)
// and does not rely on colour alone: the label is always written out.
const STATUS_COLORS: Record<ApplicationStatus, { text: ColorToken; fill: ColorToken }> = {
  applied: { text: 'primary', fill: 'primaryLight' },
  interviewing: { text: 'warning', fill: 'warningLight' },
  offered: { text: 'success', fill: 'successLight' },
  rejected: { text: 'danger', fill: 'dangerLight' },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { text, fill } = STATUS_COLORS[status];
  const label = APPLICATION_STATUS_LABELS[status];

  return (
    <View
      style={[styles.badge, { backgroundColor: colors[fill] }]}
      accessibilityLabel={`Status: ${label}`}
    >
      <AppText variant="caption" color={text} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  label: {
    fontWeight: '700',
  },
});

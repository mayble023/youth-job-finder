import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, iconSizes, radii, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

export type FormAlertProps = {
  /** Renders nothing when empty. */
  message?: string | null;
  tone?: 'error' | 'success';
  /** Optional follow-up such as "Retry" or "Send a new code". */
  action?: { label: string; onPress: () => void; loading?: boolean };
};

/** A form-level message for problems that do not belong to a single field (e.g. no network). */
export function FormAlert({ message, tone = 'error', action }: FormAlertProps) {
  if (!message) return null;
  const isError = tone === 'error';
  const accent = isError ? colors.danger : colors.success;

  return (
    <View
      style={[styles.box, { borderColor: accent }]}
      accessibilityRole={isError ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.row}>
        <Ionicons
          name={isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
          size={iconSizes.md}
          color={accent}
        />
        <AppText variant="body" style={styles.message}>
          {message}
        </AppText>
      </View>
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          loading={action.loading}
          variant="ghost"
          fullWidth={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  message: {
    flex: 1,
  },
});

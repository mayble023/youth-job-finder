import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, iconSizes, radii, sizes, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

import { AppText } from './AppText';

export type DateTimeFieldProps = {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
  error?: string | null;
  minimumDate?: Date;
  placeholder?: string;
};

/**
 * Picks a date and then a time. Android shows two system dialogs one after the other;
 * iOS shows an inline picker under the field.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  error,
  minimumDate,
  placeholder = 'Choose date and time',
}: DateTimeFieldProps) {
  const [isIosPickerOpen, setIsIosPickerOpen] = useState(false);
  const current = value ?? defaultDate();

  const openAndroidPickers = () => {
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      minimumDate,
      onChange: (dateEvent: DateTimePickerEvent, pickedDate?: Date) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onChange: (timeEvent: DateTimePickerEvent, pickedTime?: Date) => {
            if (timeEvent.type !== 'set' || !pickedTime) return;
            const combined = new Date(pickedDate);
            combined.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            onChange(combined);
          },
        });
      },
    });
  };

  const onPress = () =>
    Platform.OS === 'android' ? openAndroidPickers() : setIsIosPickerOpen((open) => !open);

  return (
    <View style={styles.container}>
      <AppText variant="caption" color="text" style={styles.label}>
        {label}
      </AppText>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDateTime(value) : 'not set'}`}
        accessibilityHint={error ?? undefined}
        style={[
          styles.field,
          { borderColor: error ? colors.danger : colors.border, borderWidth: error ? 2 : 1 },
        ]}
      >
        <Ionicons name="calendar-outline" size={iconSizes.md} color={colors.primary} />
        <AppText color={value ? 'text' : 'textMuted'} style={styles.value}>
          {value ? formatDateTime(value) : placeholder}
        </AppText>
      </Pressable>
      {Platform.OS === 'ios' && isIosPickerOpen ? (
        <DateTimePicker
          value={current}
          mode="datetime"
          display="inline"
          minimumDate={minimumDate}
          onChange={(_event, picked) => {
            if (picked) onChange(picked);
          }}
        />
      ) : null}
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

/** Tomorrow at 9:00 — a sensible starting point for an interview. */
function defaultDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  value: {
    flex: 1,
  },
});

import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radii, sizes, spacing, typography } from '@/theme';

import { AppText } from './AppText';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Shown inline under the field; also turns the border red. */
  error?: string | null;
  /** Helper text shown under the field when there is no error. */
  hint?: string;
  multiline?: boolean;
  maxLength?: number;
};

export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  multiline = false,
  maxLength,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  const showCounter = maxLength !== undefined;

  return (
    <View style={styles.container}>
      <AppText variant="caption" color="text" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        maxLength={maxLength}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          { borderColor, borderWidth: focused || error ? 2 : 1 },
        ]}
        {...inputProps}
      />
      {error || hint || showCounter ? (
        <View style={styles.footer}>
          <AppText
            variant="caption"
            color={error ? 'danger' : 'textMuted'}
            style={styles.message}
            accessibilityLiveRegion={error ? 'polite' : undefined}
          >
            {error ?? hint ?? ''}
          </AppText>
          {showCounter ? (
            <AppText variant="caption">
              {value.length}/{maxLength}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: sizes.touchTarget,
  },
  multiline: {
    minHeight: sizes.multilineInputMinHeight,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  message: {
    flex: 1,
  },
});

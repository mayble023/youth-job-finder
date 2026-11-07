import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, iconSizes, opacity, radii, sizes, spacing, type ColorToken } from '@/theme';

import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Stretch to the width of the parent. Defaults to true. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

type VariantStyle = {
  /** Fill colour; `undefined` means transparent. */
  background?: ColorToken;
  /** Fill colour while pressed; when omitted the button dims instead. */
  pressedBackground?: ColorToken;
  text: ColorToken;
};

const variantStyles: Record<ButtonVariant, VariantStyle> = {
  primary: { background: 'primary', pressedBackground: 'primaryDark', text: 'onPrimary' },
  secondary: { background: 'secondary', text: 'onSecondary' },
  danger: { background: 'danger', text: 'onDanger' },
  ghost: { pressedBackground: 'primaryLight', text: 'primary' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const isDisabled = disabled || loading;
  const textColor = colors[variantStyle.text];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => {
        const fill =
          pressed && variantStyle.pressedBackground
            ? variantStyle.pressedBackground
            : variantStyle.background;
        return [
          styles.base,
          fullWidth && styles.fullWidth,
          { backgroundColor: fill ? colors[fill] : 'transparent' },
          pressed && !variantStyle.pressedBackground && styles.pressedDim,
          isDisabled && styles.disabled,
          style,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={iconSizes.md} color={textColor} /> : null}
          <AppText variant="button" style={{ color: textColor }}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressedDim: {
    opacity: opacity.pressedSubtle,
  },
  disabled: {
    opacity: opacity.disabled,
  },
});

import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme';

export type AppTextProps = TextProps & {
  /** Maps to a step in the type scale. Defaults to `body`. */
  variant?: TypographyVariant;
  /** Any colour token. Defaults to `text` (or `textMuted` for captions). */
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
};

export function AppText({ variant = 'body', color, align, style, ...rest }: AppTextProps) {
  const resolvedColor = color ?? (variant === 'caption' ? 'textMuted' : 'text');
  const isHeading = variant === 'title' || variant === 'heading' || variant === 'subheading';

  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      style={[
        styles.base,
        typography[variant],
        { color: colors[resolvedColor] },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
